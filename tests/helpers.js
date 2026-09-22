// Re-export all shared modules for tests
// This ensures tests use the exact same implementation as the main app

// Pure utilities
export {
    formatOrdinal,
    formatMoney,
    formatMoneySimple,
    escHtml,
    calcAutoMin,
} from '../src/core/pure-utils.js';

// Date utilities
export {
    currentMonthKey,
    formatMonthLabel,
    monthKeyToIndex,
    addMonthsToKey,
    isCostDueThisMonth,
    isCostDueInMonth,
    generateBiweeklyForMonth,
    generateRecurringIncomeForMonth,
    shiftBiweeklySeries,
    intervalLabel,
    keyToHtmlMonth,
    htmlMonthToKey,
} from '../src/core/date-utils.js';

// Simulation engine
export {
    getStrategyOrder,
    runSimulation,
    runSimulationWithWindfall,
    setDebts,
    setRecurringCosts,
    setOneTimeCosts,
    setIncomeEntries,
    setStartingBalance,
} from '../src/core/simulation.js';

// Rollover logic
export {
    calculateMonthRollover,
    buildRetroArchive,
} from '../src/core/rollover.js';

// Card-expense budget sync
export {
    findBudgetForCost,
    syncCardExpenses,
    computeCardPayoffStatus,
    cardChargesByDebt,
    cashExpensesForMonth,
    CARD_AUTOPAY_BUDGET_ID,
    CARD_AUTOPAY_BUDGET_NAME,
    CATEGORY_BUDGETS,
} from '../src/core/card-expenses.js';

// Backup validation / filtering / slot rotation
export {
    pickBackupSlot,
    validateBackupData,
    filterBackupFields,
} from '../src/core/backups.js';

// Budget view helpers (archive-aware)
export {
    budgetsForView,
    budgetAmountForMonth,
    consumeConvertedExpense,
} from '../src/core/budgets.js';

// Constants
export {
    STORE_URL_PATH,
    MAX_SIMULATION_MONTHS,
    DEFAULT_STRATEGY,
    DEBT_CHART_COLORS,
} from '../src/core/constants.js';

