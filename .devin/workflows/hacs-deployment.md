# Release & HACS Deployment

The release is automated by `scripts/release.sh` — run it via:

```bash
npm run release          # version from package.json
npm run release -- 2.6.0 # or pass a version explicitly
```

It does, in order: pre-flight checks (`gh` auth, main branch, clean tree) →
`npm test` → `npm run build` → annotated tag → push tag →
`gh release create` with auto-generated notes and
`dist/debt-snowball-card.js` attached as the HACS asset.

## Version bumping — two places, then rebuild

The version is **not** single-sourced:

1. `package.json` → `"version"` (drives the tag name)
2. `src/app/header.js` → `PANEL_VERSION` + `PANEL_BUILD_DATE` (shown in the
   UI version badge and console banner — this is how you verify which file
   HA actually loaded)

`npm version patch` only updates `package.json` AND creates its own git
tag — do **not** use it here; it leaves `PANEL_VERSION` stale and the
release script then hits an existing tag.

Correct sequence:

```bash
# 1. Bump package.json version AND PANEL_VERSION/PANEL_BUILD_DATE in header.js
# 2. Rebuild so the new version string lands in the bundle
npm run build
# 3. Commit (include dist/debt-snowball-card.js) and push main
git add -u && git commit -m "chore: bump version to X.Y.Z" && git push origin main
# 4. Release
npm run release
```

Pushing `main` before the release matters: `git push origin <tag>` uploads
the tag's objects but does not move the `main` ref — an unpushed bump commit
would leave the tagged release pointing at history `main` doesn't have.

## After publishing

In Home Assistant:

1. **HACS → Frontend → Debt Snowball Tracker → Update**
2. Hard-refresh the dashboard (**Ctrl+Shift+R** / **Cmd+Shift+R**) — HA
   caches custom cards aggressively
3. Check the browser console for
   `📊 Debt Snowball Tracker vX.Y.Z` to confirm the new file loaded

## Post-release watchpoints (v2.5.0+)

First load after upgrade runs `sanitizeData` on the stored config. If
repairs were needed, the 🩹 health modal lists them and a raw pre-repair
snapshot sits in a server backup slot (History → Server Backups). The ⚠
header badge flags sanity anomalies (duplicates, month drift, dangling
references). If the load itself fails, saves are blocked — nothing can
overwrite the store.
