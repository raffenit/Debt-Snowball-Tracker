# Modular Architecture Plan — Debt Snowball Tracker

- [Overview](#overview)
- [Build Process](#build-process)
- [Module Reference](#module-reference)
- [State Flow Diagram](#state-flow-diagram)
- [Testing Strategy](#testing-strategy)
- [Completed Phases](#completed-phases)
- [Future Work](#future-work)

## Overview

The `dist/debt-snowball-card.js` file is a self-contained Home Assistant Lovelace card. Because HA loads it as a single JavaScript module, the distribution file must remain monolithic. However, the **source** is modularized into smaller ES modules under `src/app/`, bundled by esbuild.

This document describes the current architecture, the responsibilities of each module, and the build process.

## Build Process

```
src/app/                →   esbuild (bundle: true)   →   dist/debt-snowball-card.js
*.js (ES modules with imports/exports)                        (IIFE loaded by HA)
```

**Build script**: `scripts/build-esbuild.js` points esbuild at `src/app/index.js` (the real entry point). Esbuild follows the import graph, resolves all `import`/`export` statements, and emits a single IIFE bundle. Each module is a true ES module with explicit imports and exports. No concatenation step is required.

## Module Reference

### `header.js` — Version & Installation Detection
- **Purpose**: Sets `PANEL_VERSION`, `PANEL_BUILD_DATE`, and detects whether the card was loaded via HACS or manual install. Logs to console for debugging.
- **Dependencies**: None
- **Side effects**: `console.info()` calls

### `template.js` — CSS & HTML Template
- **Purpose**: Defines `PANEL_CSS` (a string containing all component styles) and `PANEL_HTML` (the full HTML template string). These are injected into the shadow DOM by the custom element class.
- **Dependencies**: None (pure static content)
- **Why extract**: ~4440 lines of purely static content. Removing this cuts the dist file by ~54%.

### `state.js` — Shared State & DOM Refs
- **Purpose**: Declares the canonical `appState` object and `initDomRefs()` function.
- **Dependencies**: None
- **Why extract**: Single source of truth for all mutable state. Imported by every module that reads or mutates state.

### `storage.js` — HA Backend Persistence
- **Purpose**: `ensureStoreDashboard()`, `loadBackendData()`, `saveData()`. Uses HA's Lovelace config API to persist data to a hidden dashboard (`snowball-store`).
- **Dependencies**: `_root._hass`, `appState` from `state.js`
- **Why extract**: Clear I/O boundary. Already partially isolated by comment blocks. Self-contained persistence logic.

### `advance.js` — Manual Month Advance
- **Purpose**: `advanceToNextMonth()`. Orchestrates the month rollover by calling `calculateMonthRollover()` then saving the result and updating globals.
- **Dependencies**: `calculateMonthRollover()` (from `../rollover.js`), `ensureStoreDashboard()`, `saveData()`
- **Why extract**: The pure rollover logic lives in `calculateMonthRollover()`; this file only handles the async HA API call and global state assignment.

### `modals.js` — Modal Helpers & Archive Viewer
- **Purpose**: `showModal()`, `openArchiveModal()`, `closeArchiveModal()`, `updateCostModalIntervalVisibility()`
- **Dependencies**: `_root`, DOM refs, `formatMoney()`, `escHtml()`
- **Why extract**: UI interaction logic separate from event wiring and rendering.

### `events.js` — Event Listener Wiring
- **Purpose**: `setupEventListeners()`, `autoCalcMinPayment()`. Attaches all click/keydown/change handlers. Includes delegated handlers for dynamic content (budget cards, payment plan, checkpoints).
- **Dependencies**: `_root`, DOM refs, all modal open/close functions, `saveData()`, `renderUI()`, `renderPaymentPlan()`, `renderRecurringCostsList()`, `renderSpendingBudgets()`, `renderCheckpointsList()`
- **Why extract**: Centralizes all user interaction entry points. Makes it clear which user actions trigger which state mutations and re-renders.

### `render-modals.js` — Modals, CRUD, Toasts, Export/Import, HA Sensors, `renderUI`
- **Purpose**: All modal open/close functions (`openDebtModal`, `closeDebtModal`, etc.), CRUD operations (`saveDebt`, `deleteDebt`, etc.), inline confirm & undo toasts, export/import data, HA sensor bridge (`updateHASensors`), and the main `renderUI()` orchestrator.
- **Dependencies**: All global state, `_root`, DOM refs, `formatMoney()`, `escHtml()`, `saveData()`, `runSimulation()`, `renderPaymentPlan()`, `renderDebtsList()`, etc.
- **Why extract**: Contains the coordination layer (`renderUI`) plus all modal/CRUD logic. Separated from pure rendering to keep each file focused.

### `render-lists.js` — List Renderers
- **Purpose**: `renderIncomeList()`, `renderRecurringCostsList()`, `renderDebtsList()`.
- **Dependencies**: Global state, `_root`, DOM refs, `formatMoney()`, `escHtml()`, `getStrategyOrder()`, `runSimulation()`.
- **Why extract**: These three functions collectively render ~400 lines of HTML list generation. Isolating them makes list-specific styling and logic easier to maintain.

### `render-payment.js` — Payment Plan, Visualization, Simulation
- **Purpose**: `runSimulation()`, `renderPaymentPlan()`, `renderVisualization()`, `renderTimelineChart()`, `renderPerDebtChart()`.
- **Dependencies**: Global state, `_root`, DOM refs, `getStrategyOrder()` (from `pure-shim.js`).
- **Why extract**: The core simulation engine and its visual outputs. **Note**: `runSimulation()` also exists in `src/core/simulation.js` (ES module for Node.js tests). The browser bundle uses this inline copy because the dist file is self-contained. Any bug fixes must be synced to both copies.

### `card.js` — Custom Element Definition
- **Purpose**: Defines the `DebtSnowballCard` class extending `HTMLElement`, including `connectedCallback`, `disconnectedCallback`, `_initApp`, `_loadChartJs`, and Lovelace Card API methods (`setConfig`, `getCardSize`, etc.). Registers the element via `customElements.define()`.
- **Dependencies**: `state.js`, `template.js`, `storage.js`, `events.js`
- **Why extract**: Isolates the custom element class so the build entry point can import it as a single dependency.

### `render-support.js` — Support Functions
- **Purpose**: Countdown timer, windfall planner, monthly check-in prompt, confetti animation, tab navigation, and `autoCalcMinPayment()`.
- **Dependencies**: `state.js`, `pure.js`, other render modules.
- **Why extract**: Miscellaneous UI support features that don't fit into the other render categories.

## State Flow Diagram

```
User Action → events.js → mutates state (state-shim.js)
                  ↓
            calls storage.js (saveData)
                  ↓
            calls render-modals.js (renderUI)
                  ↓
            calls render-lists.js, render-payment.js (specific renderers)
                  ↓
            DOM updated
```

## Testing Strategy

| Module | Test Approach |
|--------|--------------|
| `pure-shim.js` | Unit tests (`tests/app.test.js`, `tests/date-utils.test.js`) |
| `rollover.js` | `tests/rollover.test.js` — 13 tests covering archive, final balance, cost pruning, interval advancement, income regeneration, budget reset, one-time cost handling |
| `date-utils.js` | `tests/date-utils.test.js` — round-trip tests for `keyToHtmlMonth` / `htmlMonthToKey` |
| `simulation.js` | `tests/app.extended.test.js` — windfall allocation, strategy ordering, effective budget |
| `advance.js` | Integration via `calculateMonthRollover()` tests; async HA API calls mocked |
| `storage.js` | Mock `_root._hass.connection.sendMessagePromise` |
| Render modules | Build the dist file, assert it loads without syntax errors; `tests/build.test.js` verifies module presence and marker order |
| Build script | Assert output file exists, assert auto-discovery order, assert no syntax errors |

## Completed Phases

### Phase 1 — Template Extraction (`template.js`)
✅ Moved CSS + HTML template (~4440 lines) into `src/app/template.js`. Build script concatenates it. Card renders identically.

### Phase 2 — Storage + Utilities (`storage.js`, `pure-shim.js`)
✅ Extracted HA storage functions and pure utilities. `getStrategyOrder()` deduplicated — moved from `render-payment.js` to `pure-shim.js` as a pure function. Data loads/saves correctly.

### Phase 3 — Events + Modals (`modals.js`, `events.js`)
✅ Extracted modal helpers and event wiring. All buttons, modals, and navigation verified.

### Phase 4 — Rollover Deduplication (`src/core/rollover.js`, `tests/rollover.test.js`)
✅ Extracted `calculateMonthRollover()` from duplicated logic in `storage.js` and `advance.js`. Created `src/core/rollover.js` (ES module) and added browser version to `pure-shim.js`. Fixed bug where `advance.js` incorrectly excluded one-time costs from final balance. Added 13 comprehensive tests.

### Phase 4 — Render Functions (`80-render.js` → 4 sub-modules)
✅ Split ~2730 lines of render code into focused modules:
- `render-modals.js` — modals, CRUD, toasts, export/import, HA sensors, `renderUI()`
- `render-lists.js` — income, costs, and debts list renderers
- `render-payment.js` — simulation engine, payment plan, visualization, charts
- `render-support.js` — countdown, windfall, check-in, confetti, tabs, custom element registration

### Phase 5 — One-Time Cost Refactor (2026)
✅ Eliminated `category === 'one-time'` filtering from `recurringCosts` by creating a separate `oneTimeCosts` state array:
- `state-shim.js` — added `let oneTimeCosts = []`
- `storage.js` — save/load `oneTimeCosts`; backward-compat migration on load
- `advance.js` / `pure-shim.js` / `src/core/rollover.js` — `calculateMonthRollover()` archives both arrays, resets `oneTimeCosts` to `[]` for next month
- `render-modals.js` — cost CRUD targets correct array; edit can move cost between arrays
- `render-lists.js` — recurring costs grouped by category; one-time costs rendered in separate section
- `render-payment.js` — simulation uses `recurringCosts` only; payment plan includes `oneTimeCosts` in current-month cash flow
- `modals.js` — archive viewer shows recurring and one-time costs separately
- `src/core/simulation.js` — added `setOneTimeCosts`; removed `monthlyCostsOnly` filter
- Tests updated: `rollover.test.js`, `app.extended.test.js`

### Phase 6 — Full ES Module Conversion (2026)
✅ Eliminated the concatenation build step. All `src/app/*.js` modules are now true ES modules:
- Added `export` to every top-level function and `import` for every cross-module dependency
- Created `state.js` as the canonical shared state module
- App modules import pure utilities directly from `src/*.js` (`../date-utils.js`, `../pure-utils.js`, `../simulation.js`, `../rollover.js`, `../constants.js`)
- Extracted `DebtSnowballCard` class into `card.js`
- `src/app/index.js` is now a real ES module entry point (`import './card.js'`), not a generated concatenation
- Updated `scripts/build-esbuild.js` to point esbuild directly at the real entry point
- Updated `tests/build.test.js` to validate the new module structure
- Renamed all modules to remove numeric concatenation-order prefixes

### Tooling
- **`jsconfig.json`** — VS Code workspace config.

## Future Work

- **Sync `runSimulation` implementations**: The simulation engine exists in both `src/core/simulation.js` (ES module for Node tests) and `render-payment.js` (browser bundle). A future build step could transpile `src/core/simulation.js` into the bundle instead of maintaining two copies.
- **Further subdivide `render-modals.js`**: At ~1030 lines, this module still contains modals, CRUD, and `renderUI`. Could be split into `80-render-ui.js` and `85-modals-crud.js` if it grows further.
- **Add a standalone HTML test page**: For browser-level testing without HA, create `test.html` that loads `dist/debt-snowball-card.js` in a mock environment.
