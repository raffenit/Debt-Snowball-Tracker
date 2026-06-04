# Modular Architecture Plan — Debt Snowball Tracker

- [Overview](#overview)
- [Build Process](#build-process)
- [Module Reference](#module-reference)
- [State Flow Diagram](#state-flow-diagram)
- [Testing Strategy](#testing-strategy)
- [Completed Phases](#completed-phases)
- [Future Work](#future-work)

## Overview

The `dist/debt-snowball-card.js` file is a self-contained Home Assistant Lovelace card. Because HA loads it as a single JavaScript module, the distribution file must remain monolithic. However, the **source** is modularized into smaller files under `src/app/`, concatenated by a build script.

This document describes the current architecture, the responsibilities of each module, and the build process.

## Build Process

```
src/app/                →   scripts/build.js   →   dist/debt-snowball-card.js
*.js                       (auto-discover + sort)     (single file loaded by HA)
```

**Build script**: `scripts/build.js` auto-discovers all `.js` files in `src/app/`, sorts them alphabetically, and concatenates them. The alphabetical order enforces the dependency chain: `00-*` before `10-*` before `20-*`, etc. Adding a new module requires no build-script changes — simply create the file in `src/app/` and run `node scripts/build.js`.

## Module Reference

### `00-header.js` — Version & Installation Detection
- **Purpose**: Sets `PANEL_VERSION`, `PANEL_BUILD_DATE`, and detects whether the card was loaded via HACS or manual install. Logs to console for debugging.
- **Dependencies**: None
- **Side effects**: `console.info()` calls

### `10-template.js` — CSS & HTML Template
- **Purpose**: Defines `PANEL_CSS` (a string containing all component styles) and `PANEL_HTML` (the full HTML template string). These are injected into the shadow DOM by the custom element class.
- **Dependencies**: None (pure static content)
- **Why extract**: ~4440 lines of purely static content. Removing this cuts the dist file by ~54%.

### `20-state.js` — State Variables & DOM References
- **Purpose**: Declares all mutable state (`debts`, `recurringCosts`, `oneTimeCosts`, `incomeEntries`, `workingMonthKey`, etc.) and grabs DOM element references inside `_initApp()`.
- **Dependencies**: `_root` (the custom element instance, passed via closure)
- **Why extract**: Centralizes all mutable state in one place, making data flow explicit.
- **Note**: `oneTimeCosts` (current-month-only expenses) was split from `recurringCosts` in a 2026 refactor to eliminate `category === 'one-time'` filtering scattered across ~15 locations.

### `30-storage.js` — HA Backend Persistence
- **Purpose**: `ensureStoreDashboard()`, `loadBackendData()`, `saveData()`. Uses HA's Lovelace config API to persist data to a hidden dashboard (`snowball-store`).
- **Dependencies**: `_root._hass`, global state vars from `20-state.js`
- **Why extract**: Clear I/O boundary. Already partially isolated by comment blocks. Self-contained persistence logic.

### `40-advance.js` — Manual Month Advance
- **Purpose**: `advanceToNextMonth()`. Orchestrates the month rollover by calling `calculateMonthRollover()` then saving the result and updating globals.
- **Dependencies**: `calculateMonthRollover()` (from `50-pure.js`), `ensureStoreDashboard()`, `saveData()`
- **Why extract**: The pure rollover logic lives in `calculateMonthRollover()`; this file only handles the async HA API call and global state assignment.

### `50-pure.js` — Pure Utility Functions
- **Purpose**: `formatMoney()`, `escHtml()`, `formatOrdinal()`, `calcAutoMin()`, `getStrategyOrder()`, `monthKeyToIndex()`, `addMonthsToKey()`, `formatMonthLabel()`, `generateBiweeklyForMonth()`, `generateRecurringIncomeForMonth()`, `isCostDueThisMonth()`, `isCostDueInMonth()`, `intervalLabel()`, `keyToHtmlMonth()`, `htmlMonthToKey()`, `calculateMonthRollover()`
- **Dependencies**: None (pure functions, no side effects)
- **Why extract**: These are already duplicated in `src/date-utils.js`, `src/pure-utils.js`, and `src/rollover.js`. Consolidation eliminates drift. `getStrategyOrder` and `calculateMonthRollover` were previously duplicated inline in other modules; moving them here ensures single canonical definitions. `calculateMonthRollover` is used by both `30-storage.js` (automatic rollover) and `40-advance.js` (manual advance). Test coverage via `tests/app.test.js`, `tests/date-utils.test.js`, and `tests/rollover.test.js`.

### `60-modals.js` — Modal Helpers & Archive Viewer
- **Purpose**: `showModal()`, `openArchiveModal()`, `closeArchiveModal()`, `updateCostModalIntervalVisibility()`
- **Dependencies**: `_root`, DOM refs, `formatMoney()`, `escHtml()`
- **Why extract**: UI interaction logic separate from event wiring and rendering.

### `70-events.js` — Event Listener Wiring
- **Purpose**: `setupEventListeners()`, `autoCalcMinPayment()`. Attaches all click/keydown/change handlers. Includes delegated handlers for dynamic content (budget cards, payment plan, checkpoints).
- **Dependencies**: `_root`, DOM refs, all modal open/close functions, `saveData()`, `renderUI()`, `renderPaymentPlan()`, `renderRecurringCostsList()`, `renderSpendingBudgets()`, `renderCheckpointsList()`
- **Why extract**: Centralizes all user interaction entry points. Makes it clear which user actions trigger which state mutations and re-renders.

### `80-render-modals.js` — Modals, CRUD, Toasts, Export/Import, HA Sensors, `renderUI`
- **Purpose**: All modal open/close functions (`openDebtModal`, `closeDebtModal`, etc.), CRUD operations (`saveDebt`, `deleteDebt`, etc.), inline confirm & undo toasts, export/import data, HA sensor bridge (`updateHASensors`), and the main `renderUI()` orchestrator.
- **Dependencies**: All global state, `_root`, DOM refs, `formatMoney()`, `escHtml()`, `saveData()`, `runSimulation()`, `renderPaymentPlan()`, `renderDebtsList()`, etc.
- **Why extract**: Contains the coordination layer (`renderUI`) plus all modal/CRUD logic. Separated from pure rendering to keep each file focused.

### `81-render-lists.js` — List Renderers
- **Purpose**: `renderIncomeList()`, `renderRecurringCostsList()`, `renderDebtsList()`.
- **Dependencies**: Global state, `_root`, DOM refs, `formatMoney()`, `escHtml()`, `getStrategyOrder()`, `runSimulation()`.
- **Why extract**: These three functions collectively render ~400 lines of HTML list generation. Isolating them makes list-specific styling and logic easier to maintain.

### `82-render-payment.js` — Payment Plan, Visualization, Simulation
- **Purpose**: `runSimulation()`, `renderPaymentPlan()`, `renderVisualization()`, `renderTimelineChart()`, `renderPerDebtChart()`.
- **Dependencies**: Global state, `_root`, DOM refs, `getStrategyOrder()` (from `50-pure.js`).
- **Why extract**: The core simulation engine and its visual outputs. **Note**: `runSimulation()` also exists in `src/simulation.js` (ES module for Node.js tests). The browser bundle uses this inline copy because the dist file is self-contained. Any bug fixes must be synced to both copies.

### `83-render-support.js` — Support Functions & Custom Element Registration
- **Purpose**: Countdown timer, windfall planner, monthly check-in prompt, confetti animation, tab navigation, and the closing brace of the `DebtSnowballCard` class plus `customElements.define()`.
- **Dependencies**: `_root`, DOM refs, `formatMoney()`, `escHtml()`, `runSimulation()`, `getStrategyOrder()`.
- **Why extract**: Miscellaneous UI support features that don't fit into the other render categories, plus the mandatory custom element registration that must appear last in the concatenated file.

## State Flow Diagram

```
User Action → 70-events.js → mutates state (20-state.js)
                  ↓
            calls 30-storage.js (saveData)
                  ↓
            calls 80-render-modals.js (renderUI)
                  ↓
            calls 81-render-lists.js, 82-render-payment.js (specific renderers)
                  ↓
            DOM updated
```

## Testing Strategy

| Module | Test Approach |
|--------|--------------|
| `50-pure.js` | Unit tests (`tests/app.test.js`, `tests/date-utils.test.js`) |
| `rollover.js` | `tests/rollover.test.js` — 13 tests covering archive, final balance, cost pruning, interval advancement, income regeneration, budget reset, one-time cost handling |
| `date-utils.js` | `tests/date-utils.test.js` — round-trip tests for `keyToHtmlMonth` / `htmlMonthToKey` |
| `simulation.js` | `tests/app.extended.test.js` — windfall allocation, strategy ordering, effective budget |
| `40-advance.js` | Integration via `calculateMonthRollover()` tests; async HA API calls mocked |
| `30-storage.js` | Mock `_root._hass.connection.sendMessagePromise` |
| Render modules | Build the dist file, assert it loads without syntax errors; `tests/build.test.js` verifies module presence and marker order |
| Build script | Assert output file exists, assert auto-discovery order, assert no syntax errors |

## Completed Phases

### Phase 1 — Template Extraction (`10-template.js`)
✅ Moved CSS + HTML template (~4440 lines) into `src/app/10-template.js`. Build script concatenates it. Card renders identically.

### Phase 2 — Storage + Utilities (`30-storage.js`, `50-pure.js`)
✅ Extracted HA storage functions and pure utilities. `getStrategyOrder()` deduplicated — moved from `82-render-payment.js` to `50-pure.js` as a pure function. Data loads/saves correctly.

### Phase 3 — Events + Modals (`60-modals.js`, `70-events.js`)
✅ Extracted modal helpers and event wiring. All buttons, modals, and navigation verified.

### Phase 4 — Rollover Deduplication (`src/rollover.js`, `tests/rollover.test.js`)
✅ Extracted `calculateMonthRollover()` from duplicated logic in `30-storage.js` and `40-advance.js`. Created `src/rollover.js` (ES module) and added browser version to `50-pure.js`. Fixed bug where `40-advance.js` incorrectly excluded one-time costs from final balance. Added 13 comprehensive tests.

### Phase 4 — Render Functions (`80-render.js` → 4 sub-modules)
✅ Split ~2730 lines of render code into focused modules:
- `80-render-modals.js` — modals, CRUD, toasts, export/import, HA sensors, `renderUI()`
- `81-render-lists.js` — income, costs, and debts list renderers
- `82-render-payment.js` — simulation engine, payment plan, visualization, charts
- `83-render-support.js` — countdown, windfall, check-in, confetti, tabs, custom element registration

### Phase 5 — One-Time Cost Refactor (2026)
✅ Eliminated `category === 'one-time'` filtering from `recurringCosts` by creating a separate `oneTimeCosts` state array:
- `20-state.js` — added `let oneTimeCosts = []`
- `30-storage.js` — save/load `oneTimeCosts`; backward-compat migration on load
- `40-advance.js` / `50-pure.js` / `src/rollover.js` — `calculateMonthRollover()` archives both arrays, resets `oneTimeCosts` to `[]` for next month
- `80-render-modals.js` — cost CRUD targets correct array; edit can move cost between arrays
- `81-render-lists.js` — recurring costs grouped by category; one-time costs rendered in separate section
- `82-render-payment.js` — simulation uses `recurringCosts` only; payment plan includes `oneTimeCosts` in current-month cash flow
- `60-modals.js` — archive viewer shows recurring and one-time costs separately
- `src/simulation.js` — added `setOneTimeCosts`; removed `monthlyCostsOnly` filter
- Tests updated: `rollover.test.js`, `app.extended.test.js`

### Tooling
- **`jsconfig.json`** — VS Code workspace config excluding `src/app/` from linting to prevent false positives in concatenated browser bundle files.

## Future Work

- **Sync `runSimulation` implementations**: The simulation engine exists in both `src/simulation.js` (ES module for Node tests) and `82-render-payment.js` (browser bundle). A future build step could transpile `src/simulation.js` into the bundle instead of maintaining two copies.
- **Further subdivide `80-render-modals.js`**: At ~1030 lines, this module still contains modals, CRUD, and `renderUI`. Could be split into `80-render-ui.js` and `85-modals-crud.js` if it grows further.
- **Add a standalone HTML test page**: For browser-level testing without HA, create `test.html` that loads `dist/debt-snowball-card.js` in a mock environment. Currently the only way to test the browser bundle is via the HA dashboard or manual inspection of `dist/` output.
