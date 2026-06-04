#!/bin/bash
# release.sh — Automates the GitHub release for HACS distribution
#
# Usage: ./scripts/release.sh [version]
#   If no version is provided, reads from package.json
#
# Prerequisites:
#   - gh (GitHub CLI) installed and authenticated
#   - git working tree clean
#   - tests pass
#   - on main branch (or a branch you're ready to tag)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# ─── 1. Determine version ────────────────────────────────────────────────────
if [ $# -ge 1 ]; then
    VERSION="$1"
else
    VERSION=$(node -p "require('./package.json').version")
fi

# Ensure version has 'v' prefix for tag
TAG="v${VERSION#v}"

echo "🔖 Releasing $TAG for raffenit/debt-snowball-tracker"

# ─── 2. Pre-flight checks ────────────────────────────────────────────────────

# Check gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install: https://cli.github.com/"
    echo "   Then run: gh auth login"
    exit 1
fi

# Check gh is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI not authenticated. Run: gh auth login"
    exit 1
fi

# Check on default branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  You are on branch '$CURRENT_BRANCH', not 'main'."
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check working tree clean
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Working tree has uncommitted changes:"
    git status --short
    echo ""
    read -p "Would you like to commit them? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " msg
        if [ -z "$msg" ]; then
            echo "❌ Empty commit message. Aborting."
            exit 1
        fi
        git add -A
        git commit -m "$msg"
        echo "✅ Committed: $msg"
        echo ""
        read -p "Push to origin/main now? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! git push origin main; then
                echo "❌ Push failed. Possible causes:"
                echo "   - Merge conflict with remote"
                echo "   - Network issue"
                echo "   - Permission denied"
                echo ""
                # Check if merge conflict
                if git ls-files -u | grep -q .; then
                    echo "🔴 Merge conflict detected!"
                    echo "Files with conflicts:"
                    git diff --name-only --diff-filter=U
                    echo ""
                    echo "To resolve:"
                    echo "  1. Edit the conflicted files, look for '<<<<<<<' markers"
                    echo "  2. Run: git add <file>"
                    echo "  3. Run: git commit -m 'Merge resolved'"
                    echo "  4. Run: git push origin main"
                    echo "  5. Re-run: npm run release"
                fi
                exit 1
            fi
            echo "✅ Pushed to origin/main"
        else
            echo "❌ Push skipped. Release aborted (tag would point to unpushed commit)."
            exit 1
        fi
    else
        echo "❌ Release aborted. Commit or stash changes first."
        exit 1
    fi
fi

# ─── 3. Verify tests pass ────────────────────────────────────────────────────
echo "🧪 Running tests..."
if ! npm test > /tmp/release-test.log 2>&1; then
    echo "❌ Tests failed. See /tmp/release-test.log"
    tail -30 /tmp/release-test.log
    exit 1
fi
echo "✅ All tests passed"

# ─── 4. Build ──────────────────────────────────────────────────────────────────
echo "🔨 Building distribution..."
npm run build > /tmp/release-build.log 2>&1
if [ ! -f "dist/debt-snowball-card.js" ]; then
    echo "❌ Build failed: dist/debt-snowball-card.js not found"
    exit 1
fi
DIST_SIZE=$(du -h dist/debt-snowball-card.js | cut -f1)
echo "✅ Built dist/debt-snowball-card.js ($DIST_SIZE)"

# ─── 5. Tag ──────────────────────────────────────────────────────────────────
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "⚠️  Tag $TAG already exists locally."
    read -p "Delete and recreate? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$TAG"
    else
        exit 1
    fi
fi

git tag -a "$TAG" -m "Release $TAG"
echo "✅ Created tag $TAG"

# ─── 6. Push tag ─────────────────────────────────────────────────────────────
echo "📤 Pushing tag to origin..."
git push origin "$TAG"
echo "✅ Pushed $TAG"

# ─── 7. Create GitHub Release ──────────────────────────────────────────────
echo "🚀 Creating GitHub release..."

# Generate release notes from last tag
PREV_TAG=$(git describe --tags --abbrev=0 "$TAG^" 2>/dev/null || echo "")
if [ -n "$PREV_TAG" ]; then
    COMMITS=$(git log "$PREV_TAG..$TAG" --pretty=format:'- %s' --no-merges)
else
    COMMITS=$(git log --pretty=format:'- %s' --no-merges | head -20)
fi

# Build notes
NOTES="## Changes
$COMMITS

## Installation
HACS users: Update via HACS → Debt Snowball Tracker → Update.

Manual users: Download \`debt-snowball-card.js\` from the assets below."

gh release create "$TAG" \
    --title "Debt Snowball Tracker $TAG" \
    --notes "$NOTES" \
    "dist/debt-snowball-card.js#debt-snowball-card.js"

echo "✅ Release $TAG published!"
echo ""
echo "📋 Next steps in Home Assistant:"
echo "   1. HACS → Debt Snowball Tracker → Update"
echo "   2. Settings → System → Restart Home Assistant (or reload UI)"
echo "   3. Clear browser cache (Ctrl+Shift+R on dashboard)"
echo ""
echo "🔗 Release URL: https://github.com/raffenit/debt-snowball-tracker/releases/tag/$TAG"
