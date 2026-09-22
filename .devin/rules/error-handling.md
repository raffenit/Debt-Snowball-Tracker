---
description: "Error handling contract — failures must be loud but non-blocking"
trigger: always_on
---

# Error Handling Rules

Failures must be **loud but non-blocking**: the user always knows something
went wrong, and the rest of the app keeps working. Silent failures caused
real data-loss bugs in this codebase (a failed load followed by a save
nearly wiped the store).

## Required patterns

- **Never swallow errors with `console.error`/`console.warn` alone.** Route
  through `reportError(context, err)` in `src/app/error-report.js` — logs to
  console, appends to `appState.errorLog`, shows a sticky dismissible toast
  (deduped per message for 30s).
- **Save failures are user-facing.** Every `saveData()` catch site must
  report — a silent failed save looks identical to a successful one and the
  data is gone on reload.
- **Guard destructive asymmetries.** `appState.loadFailed` blocks all saves —
  an empty state must never overwrite real stored data.
- **Intentional fallbacks need a comment.** Empty catches only for true
  best-effort paths (e.g. chart teardown): `// safe to ignore: <reason>`.
- **Toast taxonomy**: validation errors → transient `showErrorToast()`;
  system/IO failures → `reportError()` (sticky).
- **Global backstop** (`initErrorReporting` in `card.js`): window
  `error`/`unhandledrejection` filtered to this card's stack + any
  `console.error` prefixed `Debt Snowball` also surface as toasts. Assume
  anything logged will be seen — never log secrets.
- **Async fire-and-forget calls** (HA `callApi`, `sendMessagePromise` without
  await) must have `.catch(reportError)` — unhandled rejections are silent
  failures.

## When adding a new failure path

1. Can the user lose data or see a wrong state? → `reportError` + consider
   rollback (`applyBackupData` pattern).
2. Is it recoverable/expected? → transient toast.
3. Is it truly harmless? → `// safe to ignore` comment, nothing else.
