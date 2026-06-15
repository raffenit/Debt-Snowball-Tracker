# Divergence Analysis & Source of Truth Determination

## Context
The debt-snowball-tracker has dual implementations of several functions:
- `src/*.js` (ES modules, used by Node tests)
- `src/app/*.js` (browser bundle, concatenated for HA Lovelace)

We need to consolidate these before restructuring to real ES modules + esbuild.

## Source of Truth Factors Applied

### Git History

| File | Commits | Last Edit | Notes |
|------|---------|-----------|-------|
| `src/pure-utils.js` | 1 (Apr 15) | Apr 15 | Oldest, least maintained |
| `src/constants.js` | 1 (Apr 15) | Apr 15 | Oldest, least maintained |
| `src/date-utils.js` | 2 (Apr 15, Jun 4) | Jun 4 | Updated during refactor |
| `src/simulation.js` | 3 (Apr 15, Apr 17, Jun 4) | Jun 4 | Active maintenance |
| `src/rollover.js` | 1 (Jun 4) | Jun 4 | Created during refactor |
| `src/app/50-pure.js` | 1 (Jun 4) | Jun 4 | Created during refactor |
| `src/app/82-render-payment.js` | 1 (Jun 4) | Jun 4 | Created during refactor |

The Jun 4 commit "Refactoring for modularity, reducing duplication, adding tests & documentation" was the modularity extraction. It created `src/app/50-pure.js`, `src/app/82-render-payment.js`, and `src/rollover.js`. It also updated `src/date-utils.js` and `src/simulation.js`.

### Factor Analysis

1. **File creation/edit dates**: `src/app/50-pure.js` and `82-render-payment.js` were CREATED in the most recent refactor. `src/date-utils.js` and `src/simulation.js` were also updated in that same commit. `src/pure-utils.js` is from April and hasn't been touched since.

2. **Internal documentation**: `src/date-utils.js` has extensive JSDoc. `src/simulation.js` has inline comments. `src/app/50-pure.js` has minimal comments. `src/pure-utils.js` also has JSDoc but is outdated.

3. **Documentation alignment**: `docs/MODULAR_ARCHITECTURE.md` describes the browser bundle architecture. It notes that `50-pure.js` "holds all pure utilities that also exist as ES modules" and that `runSimulation` "also exists in `src/simulation.js` (ES module for Node.js tests)."

4. **Test coverage**: Tests import from `src/*.js` via `tests/helpers.js`. The browser bundle functions are NOT directly tested — only via build validation.

5. **Usage context**: The browser bundle (`dist/debt-snowball-card.js`) is what Home Assistant actually loads. Users depend on its behavior.

## Divergent Functions Identified

### 1. `generateBiweeklyForMonth`
- `src/date-utils.js` — uses `schedule`/`anchorDate` props, different algorithm (modulo-based offset from month start)
- `src/app/50-pure.js` — uses `scheduleType`/`scheduleAnchorDate` props, different algorithm (step forward from anchor in 14-day increments)

### 2. `generateRecurringIncomeForMonth`
- `src/date-utils.js` — uses `e.schedule` (values: 'monthly', 'biweekly', 'one-time'), generates IDs differently
- `src/app/50-pure.js` — uses `e.scheduleType` (values: 'monthly', 'biweekly', null), legacy handling for no scheduleType

### 3. `isCostDueThisMonth` / `isCostDueInMonth`
- `src/date-utils.js` — interval math: `(targetIdx - nextIdx) % cost.intervalMonths === 0`
- `src/app/50-pure.js` — interval math: `monthKeyToIndex(next) <= monthKeyToIndex(key)` (simpler, may have edge case)

### 4. `runSimulation`
- `src/simulation.js` — uses `setDebts`/`setRecurringCosts` etc. global state setters, uses `startingBalance` global
- `src/app/82-render-payment.js` — reads `debts`, `recurringCosts`, `incomeEntries`, `checkpoints` directly from closure, uses `day1Balance` instead of `startingBalance`

### 5. `formatMoney`
- `src/pure-utils.js` — takes `(n, currency, locale)` as explicit params
- `src/app/50-pure.js` — reads `_root._currency` and `_root._language` from closure

### 6. `getStrategyOrder`
- `src/simulation.js` — standalone export
- `src/app/50-pure.js` — closure function, identical logic

## Preliminary Source of Truth Decisions

| Function | Source of Truth | Rationale |
|----------|-----------------|-----------|
| `formatMoney` | `src/pure-utils.js` | Explicit params = testable, browser version can pass `_root._currency` |
| `escHtml`, `calcAutoMin`, `formatOrdinal` | `src/pure-utils.js` | No divergence in logic, just export vs closure |
| `monthKeyToIndex`, `addMonthsToKey`, `formatMonthLabel`, `keyToHtmlMonth`, `htmlMonthToKey` | `src/date-utils.js` | Better documented, has tests |
| `getStrategyOrder` | `src/simulation.js` | No divergence in logic, just export vs closure |
| `isCostDueThisMonth` / `isCostDueInMonth` | `src/date-utils.js` | More robust interval math with modulo check |
| `generateBiweeklyForMonth` | **NEEDS DECISION** | Both algorithms differ significantly |
| `generateRecurringIncomeForMonth` | **NEEDS DECISION** | Data structure mismatch (`schedule` vs `scheduleType`) |
| `runSimulation` | **NEEDS DECISION** | Different state access patterns, different variable names |

## Next Steps
1. Resolve `generateBiweeklyForMonth` — compare algorithm correctness
2. Resolve `generateRecurringIncomeForMonth` — align data structures
3. Resolve `runSimulation` — make state access explicit
4. Update `src/app/50-pure.js` to import from `src/*.js` instead of duplicating
5. Then proceed with full ES module restructure
