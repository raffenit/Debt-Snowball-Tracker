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
} from '../src/core/rollover.js';

// Constants
export {
    STORE_URL_PATH,
    MAX_SIMULATION_MONTHS,
    DEFAULT_STRATEGY,
    DEBT_CHART_COLORS,
} from '../src/core/constants.js';

