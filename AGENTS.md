# Debt Snowball Tracker — Project Rules

Home Assistant custom Lovelace card (vanilla JS ES modules, esbuild bundle,
`node:test` unit tests). Source lives in `src/`, output in
`dist/debt-snowball-card.js`.

## Commands

- `npm test` — full test suite (node:test)
- `npm run build` — rebuild `dist/debt-snowball-card.js` (required after any
  src change; `tests/build.test.js` verifies the bundle)
- `node --test tests/<file>.test.js` — run a single suite
- `npm run release` — tests → build → tag → GitHub release. Bump the version
  in BOTH `package.json` and `PANEL_VERSION`/`PANEL_BUILD_DATE` in
  `src/app/header.js` first (never `npm version`); see
  `.devin/workflows/hacs-deployment.md`.

## Conventions

- Pure logic goes in `src/core/` and gets unit tests (TDD: failing test
  first). DOM/HA-bound code lives in `src/app/` and is not unit-tested.
- New persisted fields must be registered in all of: `buildSavePayload()`
  (storage.js), `FIELD_SPECS` (core/health.js), `filterBackupFields()`
  (core/backups.js) if month-scoped, `BACKUP_FIELDS` (render-export.js).
- Escape all user-provided strings with `escHtml()` before inserting
  into HTML.
- **Avoid duplicate imports** — esbuild fails if the same symbol is imported
  from the same module twice. When adding imports, check existing imports
  first to avoid `The symbol "X" has already been declared` errors.

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

## Archive view protection

Archive view (browsing historical months) must block all operations that
would mutate live state:

- Debt edit/delete/payoff actions blocked with error message guiding user
  to return to live month via "Current Month →"
- Debt modal itself blocks opening in archive view
- Archive edits write to `monthlyArchives[idx]` via `saveArchiveEdit()`,
  never to `appState.spendingBudgets` or `appState.debts`
- Archive-aware routing in `saveDataAndRender()` detects `viewingArchiveIndex`
  and routes to the archive save path

## Debt payoff features (v2.8.6+)

Three ways to pay off debts:

1. **Debt modal "Pay Off in Full"** — When editing a debt, a warning button
   appears (only for debts with balance > 0). Sets balance to $0, marks paid
   for current month, sets `minPayOverride` to the full balance (so the
   payment appears in cash flow), confetti celebration, undo toast.

2. **Debt card "Pay Off Full"** — On each debt card, the paid button is split:
   - "Mark Paid" — mark minimum payment as paid this month
   - "Pay Off Full" — set entire balance to $0 and set override for cash flow
   - Archive view blocks this action

3. **Windfall "Apply This Payment"** — After calculating a windfall, an
   "Apply This Payment" button appears. Actually reduces debt balances per
   optimal allocation (follows strategy order). If a debt is fully paid off,
   sets its `minPayOverride` to the payment amount for cash flow visibility.
   Undo toast to revert.

All payoff actions have undo toasts because setting balance to $0 is
destructive and users may change their mind. Undo restores both the balance
and the original `minPayOverride` state.

**Cash flow visibility (v2.8.8/v2.8.9 fixes):**
- **v2.8.8**: Debts with `minPayOverride` are included in the cash flow schedule
  even if their balance is 0. Without this, paid-off debts were filtered out
  entirely and the payment didn't appear in cash flow.
- **v2.8.9**: Payment amount calculation fixed. When balance is 0 and there's a
  `minPayOverride`, the amount was calculated as `Math.min(0, override) = 0`.
  Now it uses the override amount directly, so the payment shows the correct
  amount and deducts from the running balance.

The fixes apply to:
- `render-payment.js` schedule generation and payment amount calculation
- `render-modals.js` snowball extra calculation
- `rollover.js` month rollover calculations

## Enhanced error cards (v2.8.5+)

The "budget too low" error cards now show detailed breakdowns and
actionable options:

- **No income**: Lists what to add (paychecks, side income, deposits) with
  auto-open of income form
- **Budget over-committed**: Monthly breakdown (income, direct costs, card
  charges, available) + specific dollar amounts needed + windfall button
- **Can't cover minimums**: Shows exact shortfall amount + options (add
  income, reduce costs, consolidate, windfall)

The windfall bar is now visible even when the simulation is invalid — that's
exactly when the tool is most useful.
