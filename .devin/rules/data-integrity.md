---
description: "Data integrity contract — trust boundaries, sanitization, backups, month/archive semantics"
trigger: always_on
---

# Data Integrity Rules

All persisted data lives in one hidden Lovelace dashboard (`snowball-store`)
plus three rotating backup dashboards (`snowball-backup-1..3`). These rules
exist because real bugs here caused silent data loss.

## Trust boundaries — sanitize everything inbound

Any data crossing a trust boundary (stored config on load, file import,
server backup restore) MUST go through `sanitizeData()` in
`src/core/health.js`:

- `info` — field absent → default used
- `repaired` — wrong shape → reset / malformed entries dropped
- `fatal` — unrecognizable → reject

Rules:

- **New persisted fields require a `FIELD_SPECS` entry** — never silently
  trust stored shapes.
- Repairs are always disclosed via `showDataHealthModal()` — never repair
  silently.
- Before load-time repairs are applied, preserve the raw data via
  `preserveRawConfig()` so nothing is unrecoverable.
- `validateBackupData()` only answers "is this our data at all" — field-level
  problems are repairs, not rejections.

## Sanity checks — advisory anomaly detection

`checkDataSanity()` in `src/core/sanity.js` runs every render and flags
semantically suspicious data: duplicate rows (the biweekly-income bug
signature), month-over-month count/total explosions vs the latest archive,
dangling references, negative amounts, expenses dated outside the working
month.

- Warnings are advisory — never auto-mutate based on them.
- Every warning needs a stable `id` (used for modal dedupe signature).
- Surfaced via the header ⚠ badge + modal; auto-opens only when the warning
  *set* changes.

## Persist first, then mutate

Destructive flows (month advance, backup apply) must build the next payload,
save it, and only then apply to `appState`. Never mutate state before the
save succeeds — a failed save must not leave phantom state on screen.
`applyBackupData()` rolls back in-memory state on save failure.

## Persisted-field checklist

A new persisted field must appear in ALL of:

1. `buildSavePayload()` in `storage.js` (advance + export derive from it)
2. `FIELD_SPECS` in `core/health.js`
3. `filterBackupFields()` in `core/backups.js` if month-scoped
4. `BACKUP_FIELDS` snapshot list in `render-export.js`

## Month semantics

- Month keys are zero-indexed: `2026-8` = September 2026.
- `paidStatus` / `minPayOverrides` are month-scoped — only apply when the
  payload's `paidMonth` matches the working month.
- One-time costs match by `addedMonth`; one-time income and dated manual
  budget expenses match by date prefix. Undated + `autoCard` expenses are
  month-agnostic.
- Card-paid bills never touch bank cash flow; they mirror into budgets as
  `autoCard` expenses for the whole month up front (committed spending).

## Archive semantics

- `viewingArchiveIndex` routes Budgets/Cash Flow to the archived snapshot
  via `budgetsForView`/`getWorkingBudgets` — never read
  `appState.spendingBudgets` directly in event handlers or rendering.
- Archive expense edits are allowed; budget structure is locked.
- Older archives may lack `spendingBudgets` — treat as empty, never fall
  back to live budgets.

## Server backups

- 3 slots; `pickBackupSlot` (pure) picks first-empty else oldest
  `_meta.savedAt` — no external index.
- Snapshot the payload synchronously before any `await` — in-flight edits
  must not leak in.
- Triggers: before month advance (blocking), before auto-rollover
  (best-effort), first archive-view entry per session, pre-repair.
