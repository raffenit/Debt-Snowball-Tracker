# Source Modules

This directory contains the source code for the Debt Snowball Tracker Home Assistant Lovelace card.

## Architecture Overview

There are **two parallel implementations** of the same logic:

| Runtime | Entry Point | Format | Purpose |
|---------|------------|--------|---------|
| **Node.js (tests)** | `src/*.js` | ES modules (`import`/`export`) | Unit tests, simulation validation |
| **Browser (HA)** | `src/app/*.js` | Plain functions, no modules | Concatenated into `dist/debt-snowball-card.js` by `scripts/build.js` |

This dual-track approach is necessary because Home Assistant Lovelace cards are loaded as single self-contained JavaScript files — they cannot use ES module imports. The Node.js ES modules are the canonical testable versions; the `src/app/` files are the browser-compatible inline copies.

## Directory Layout

```
src/
├── app/                          # Browser bundle source (concatenated by build script)
│   ├── 00-header.js              # Version info, install detection
│   ├── 10-template.js            # PANEL_CSS + PANEL_HTML (~4440 lines)
│   ├── 20-state.js               # Mutable state + DOM refs
│   ├── 30-storage.js             # HA backend persistence
│   ├── 40-advance.js             # Month rollover logic
│   ├── 50-pure.js                # Pure utility functions
│   ├── 60-modals.js              # Modal helpers + archive viewer
│   ├── 70-events.js              # Event listener wiring
│   ├── 80-render-modals.js       # Modals, CRUD, toasts, renderUI()
│   ├── 81-render-lists.js        # Income, costs, debts list renderers
│   ├── 82-render-payment.js      # Simulation, payment plan, charts
│   └── 83-render-support.js      # Countdown, windfall, confetti, custom element registration
│
├── constants.js                  # Shared constants (also in app/ globals)
├── date-utils.js                 # Date utilities (duplicated in app/50-pure.js)
├── pure-utils.js                 # Pure functions (duplicated in app/50-pure.js)
├── simulation.js                 # Simulation engine (duplicated in app/82-render-payment.js)
├── rollover.js                   # Month rollover logic (also in app/50-pure.js)
└── README.md                     # This file
```

## Module Descriptions

### ES Modules (Node.js / Tests)

These are the canonical, testable implementations:

- **`constants.js`** — `STORE_URL_PATH`, `MAX_SIMULATION_MONTHS`, `DEFAULT_STRATEGY`, `DEBT_CHART_COLORS`
- **`date-utils.js`** — `currentMonthKey()`, `formatMonthLabel()`, `monthKeyToIndex()`, `addMonthsToKey()`, `isCostDueThisMonth()`, `isCostDueInMonth()`, `generateBiweeklyForMonth()`, `generateRecurringIncomeForMonth()`, `intervalLabel()`
- **`pure-utils.js`** — `formatMoney()`, `formatMoneySimple()`, `formatOrdinal()`, `escHtml()`, `calcAutoMin()`
- **`simulation.js`** — `runSimulation()`, `runSimulationWithWindfall()`, `getStrategyOrder()`, state setters (`setDebts`, `setRecurringCosts`, etc.)
- **`rollover.js`** — `calculateMonthRollover()`: pure function for advancing from one month to the next. Computes archive snapshot, final balance, and next-month state (pruned costs, advanced intervals, regenerated income, reset budgets). Used by both automatic calendar rollover (`30-storage.js`) and manual "Next Month" advance (`40-advance.js`)

### Browser Bundle (`src/app/`)

These files are concatenated in alphabetical order by `scripts/build.js` to produce `dist/debt-snowball-card.js`. Each file is a self-contained script with no `import`/`export` — functions are declared in the global scope and rely on the concatenation order for dependency resolution.

See `docs/MODULAR_ARCHITECTURE.md` for the full module reference.

## Build Process

```bash
npm run build        # or: node scripts/build.js
```

The build script auto-discovers all `.js` files in `src/app/`, sorts them alphabetically, and concatenates them. The alphabetical order enforces the dependency chain (`00-*` before `10-*` before `20-*`, etc.).

## Testing

```bash
npm test             # Run all tests
npm run test:build   # Run build validation tests only
npm run test:unit    # Run pure utility tests only
```

Tests import from `tests/helpers.js`, which re-exports the ES module versions (`src/date-utils.js`, `src/pure-utils.js`, `src/simulation.js`). The build tests (`tests/build.test.js`) validate that the browser bundle is correctly assembled.

## Keeping Implementations in Sync

**Critical**: The browser bundle (`src/app/*.js`) contains inline copies of functions from the ES modules (`src/date-utils.js`, `src/pure-utils.js`, `src/simulation.js`). When fixing bugs in the core logic, you must update **both** copies.

Functions with known dual implementations:
- `runSimulation()` — `src/simulation.js` and `src/app/82-render-payment.js`
- `runSimulationWithWindfall()` — `src/simulation.js` and `src/app/83-render-support.js`
- Date utilities — `src/date-utils.js` and `src/app/50-pure.js`
- Pure utilities — `src/pure-utils.js` and `src/app/50-pure.js`

> **Future improvement**: A future build step could transpile the ES modules into the browser bundle instead of maintaining two copies. See `docs/MODULAR_ARCHITECTURE.md` → Future Work.

## Design Principles

1. **Single Responsibility**: Each `src/app/` module does one thing (template, storage, events, render, etc.)
2. **Pure Functions**: Utilities in `date-utils.js`, `pure-utils.js`, and `50-pure.js` have no side effects
3. **Test-Driven Development**: Tests validate both the ES module implementations and the build output
4. **No Line Number Fragility**: Code is located via structural markers (`// ─── Section Name ───`), not remembered line numbers
