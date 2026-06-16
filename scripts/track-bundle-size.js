#!/usr/bin/env node
/**
 * Bundle Size Tracker
 *
 * Tracks dist/ output size over time. Compares current size against a baseline
 * stored in a JSON file. Flags significant changes.
 *
 * Usage:
 *   node scripts/track-bundle-size.js           # Check current size
 *   node scripts/track-bundle-size.js --update  # Update baseline after intentional changes
 *
 * Configuration: .bundle-size.json in project root
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_FILE = path.join(ROOT, 'dist', 'debt-snowball-card.js');
const TRACKER_FILE = path.join(ROOT, '.bundle-size.json');

const THRESHOLD_PERCENT = 5;  // Warn if size changes by more than 5%
const THRESHOLD_ABSOLUTE = 10 * 1024;  // Warn if changes by more than 10 KB

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadBaseline() {
    if (!fs.existsSync(TRACKER_FILE)) return null;
    try {
        return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
    } catch (e) {
        console.warn('  ⚠️  Could not read baseline file, creating new one.');
        return null;
    }
}

function saveBaseline(size, buildDate) {
    const data = {
        size,
        sizeFormatted: formatSize(size),
        buildDate,
        updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ─── Main ───────────────────────────────────────────────────────────────────

const shouldUpdate = process.argv.includes('--update') || process.argv.includes('-u');

console.log('\n📦 Bundle Size Tracker\n');

if (!fs.existsSync(DIST_FILE)) {
    console.error(`❌ Dist file not found: ${DIST_FILE}`);
    console.error('   Run npm run build first.');
    process.exit(1);
}

const stats = fs.statSync(DIST_FILE);
const currentSize = stats.size;
const currentDate = stats.mtime.toISOString();

console.log(`  Current size: ${formatSize(currentSize)}`);
console.log(`  Build date:   ${currentDate}`);

const baseline = loadBaseline();

if (!baseline) {
    console.log('\n  📝 No baseline found. Creating one now.');
    saveBaseline(currentSize, currentDate);
    console.log(`  ✅ Baseline saved: ${formatSize(currentSize)}`);
    process.exit(0);
}

console.log(`\n  Baseline size: ${baseline.sizeFormatted} (${baseline.buildDate})`);

const diff = currentSize - baseline.size;
const diffPercent = (diff / baseline.size) * 100;
const diffFormatted = diff > 0 ? `+${formatSize(diff)}` : `${formatSize(diff)}`;
const diffPercentFormatted = diffPercent > 0 ? `+${diffPercent.toFixed(1)}%` : `${diffPercent.toFixed(1)}%`;

console.log(`  Difference:    ${diffFormatted} (${diffPercentFormatted})`);

if (shouldUpdate) {
    saveBaseline(currentSize, currentDate);
    console.log('\n  ✅ Baseline updated.');
    process.exit(0);
}

// Check thresholds
const exceededPercent = Math.abs(diffPercent) > THRESHOLD_PERCENT;
const exceededAbsolute = Math.abs(diff) > THRESHOLD_ABSOLUTE;

if (exceededPercent || exceededAbsolute) {
    console.log('\n  ⚠️  Size change exceeds threshold:');
    if (exceededPercent) {
        console.log(`      > ${THRESHOLD_PERCENT}% change (${diffPercentFormatted})`);
    }
    if (exceededAbsolute) {
        console.log(`      > ${formatSize(THRESHOLD_ABSOLUTE)} absolute change (${diffFormatted})`);
    }
    console.log('\n  If this change is intentional, update the baseline:');
    console.log(`      node scripts/track-bundle-size.js --update`);
    process.exit(0); // warning, not error
} else {
    console.log('\n  ✅ Size change within acceptable thresholds.');
    process.exit(0);
}
