// Budget helpers — pure functions shared by the Budgets tab and tests.

/**
 * Which budget set a view should operate on. An archive view uses the
 * snapshot captured at rollover — never the live budgets (an archive that
 * predates archived budgets correctly shows empty, not the current month).
 * @param {Object|null} archive - monthlyArchives entry or null for live view
 * @param {Array} liveBudgets - appState.spendingBudgets
 * @returns {Array}
 */
export function budgetsForView(archive, liveBudgets) {
    return archive ? (archive.spendingBudgets || []) : (liveBudgets || []);
}

/**
 * A budget's effective limit for a specific month: the month's exception
 * override when present, else the base amount.
 * @param {Object} budget
 * @param {string} monthKey - viewed month ("YYYY-M", zero-based)
 * @returns {number}
 */
export function budgetAmountForMonth(budget, monthKey) {
    const exc = budget?.exception;
    return (exc && exc.month === monthKey) ? exc.amount : (budget?.amount ?? 0);
}
