# Debt Snowball Tracker — Project Rules

Home Assistant custom Lovelace card (vanilla JS ES modules, esbuild bundle,
`node:test` unit tests). Source lives in `src/`, output in
`dist/debt-snowball-card.js`.

## Commands

- `npm test` — full test suite (node:test)
- `npm run build` — rebuild `dist/debt-snowball-card.js` (required after any
  src change; `tests/build.test.js` verifies the bundle)
- `node --test tests/<file>.test.js` — run a single suite

## Conventions

- Pure logic goes in `src/core/` and gets unit tests (TDD: failing test
  first). DOM/HA-bound code lives in `src/app/` and is not unit-tested.
- New persisted fields must be registered in all of: `buildSavePayload()`
  (storage.js), `FIELD_SPECS` (core/health.js), `filterBackupFields()`
  (core/backups.js) if month-scoped, `BACKUP_FIELDS` (render-export.js).
- Escape all user-provided strings with `escHtml()` before inserting
  into HTML.

## Safety contracts (details in `.devin/rules/`)

- **Data integrity** (`.devin/rules/data-integrity.md`): sanitize all inbound
  data (`sanitizeData`), disclose repairs, preserve raw snapshots before
  fixing, persist-then-mutate on destructive flows, archive views never
  touch live state.
- **Error handling** (`.devin/rules/error-handling.md`): loud but
  non-blocking. `reportError()` for system/IO failures, never
  `console.error` alone, save failures are always user-facing,
  `loadFailed` blocks saves.
- **Sanity checks**: `checkDataSanity()` (core/sanity.js) warns on
  suspicious-but-valid data — advisory only, surfaced via the ⚠ badge.
