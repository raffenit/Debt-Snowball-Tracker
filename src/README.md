# Source Modules

This directory contains the source code for the Debt Snowball Tracker Home Assistant Lovelace card.

## Architecture Overview

| Runtime | Entry Point | Format | Purpose |
|---------|------------|--------|---------|
| **Node.js (tests)** | `src/*.js` | ES modules (`import`/`export`) | Unit tests, simulation validation |
| **Browser (HA)** | `src/app/*.js` | ES modules (`import`/`export`) | Bundled into `dist/debt-snowball-card.js` by esbuild |

Home Assistant Lovelace cards are loaded as single self-contained JavaScript files, so the `src/app/` ES modules are bundled by esbuild into a single IIFE. The Node.js ES modules (`src/*.js`) are the canonical testable versions. Browser modules import directly from `src/*.js` via relative paths (e.g., `../date-utils.js`) — there is no code duplication.

## Directory Layout

```
src/
├── app/                          # Browser bundle source (bundled by esbuild)
│   ├── index.js                  # Entry point: imports card.js
│   ├── card.js                   # DebtSnowballCard custom element
│   ├── state.js                  # Shared appState + initDomRefs
│   ├── header.js                 # Version info, install detection
│   ├── template.js               # PANEL_CSS + PANEL_HTML (~4440 lines)
│   ├── storage.js                # HA backend persistence
│   ├── advance.js                # Month rollover logic
│   ├── modals.js                 # Modal helpers + archive viewer
│   ├── events.js                 # Event listener wiring
│   ├── render-modals.js          # Modals, CRUD, toasts, renderUI()
│   ├── render-checkpoints.js     # Checkpoints list + CRUD
│   ├── render-export.js          # Backup/restore + notification toasts
│   ├── render-budgets.js         # Budget list + expense CRUD
│   ├── render-lists.js           # Income, costs, debts list renderers
│   ├── render-payment.js         # Simulation, payment plan, visualization
│   ├── render-charts.js          # Chart.js paydown + timeline charts
│   └── render-support.js         # Countdown, windfall, confetti, tabs
│
├── constants.js                  # Shared constants
├── date-utils.js                 # Date utilities
├── pure-utils.js                 # Pure formatting / calculation functions
├── simulation.js                 # Simulation engine
├── rollover.js                   # Month rollover logic
└── README.md                     # This file
```

## Module Descriptions

### ES Modules (Node.js / Tests)

These are the canonical, testable implementations:

- **`constants.js`** — `STORE_URL_PATH`, `MAX_SIMULATION_MONTHS`, `DEFAULT_STRATEGY`, `DEBT_CHART_COLORS`
- **`date-utils.js`** — `currentMonthKey()`, `formatMonthLabel()`, `monthKeyToIndex()`, `addMonthsToKey()`, `isCostDueThisMonth()`, `isCostDueInMonth()`, `generateBiweeklyForMonth()`, `generateRecurringIncomeForMonth()`, `intervalLabel()`
- **`pure-utils.js`** — `formatMoney()`, `formatMoneySimple()`, `formatOrdinal()`, `escHtml()`, `calcAutoMin()`
- **`simulation.js`** — `runSimulation()`, `runSimulationWithWindfall()`, `getStrategyOrder()`, state setters (`setDebts`, `setRecurringCosts`, etc.)
- **`rollover.js`** — `calculateMonthRollover()`: pure function for advancing from one month to the next. Computes archive snapshot, final balance, and next-month state (pruned costs, advanced intervals, regenerated income, reset budgets). Used by both automatic calendar rollover (`storage.js`) and manual "Next Month" advance (`advance.js`)

### Browser Bundle (`src/app/`)

These files are true ES modules with explicit `import`/`export` statements. Esbuild resolves the import graph starting from `index.js` and emits a single IIFE bundle (`dist/debt-snowball-card.js`).

See `docs/MODULAR_ARCHITECTURE.md` for the full module reference.

## Build Process

```bash
npm run build        # or: node scripts/build-esbuild.js
```

Esbuild bundles the `src/app/` module graph into `dist/debt-snowball-card.js`. The import graph, not alphabetical order, determines inclusion and ordering.

## Testing

```bash
npm test             # Run all tests
npm run test:build   # Run build validation tests only
npm run test:unit    # Run pure utility tests only
```

Tests import from `tests/helpers.js`, which re-exports the ES module versions (`src/core/date-utils.js`, `src/core/pure-utils.js`, `src/core/simulation.js`). The build tests (`tests/build.test.js`) validate that the browser bundle is correctly assembled and syntactically valid.

## Design Principles

1. **Single Responsibility**: Each `src/app/` module does one thing (template, storage, events, render, etc.)
2. **Pure Functions**: Utilities in `date-utils.js`, `pure-utils.js`, and `rollover.js` have no side effects
3. **Explicit Imports**: Every cross-module dependency is declared with `import` — no global scope pollution
4. **Test-Driven Development**: Tests validate both the ES module implementations and the build output
5. **No Line Number Fragility**: Code is located via structural markers (`// ─── Section Name ───`), not remembered line numbers
