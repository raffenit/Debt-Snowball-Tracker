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

/**
 * Consume a manual expense being converted into a recurring bill.
 * Removes it from its budget so it isn't double-counted (the bill now
 * represents it — card bills re-mirror as autoCard on next sync), and
 * reports whether the new bill should be marked paid: cash expenses with a
 * past date already left the account, so the bill shouldn't show as unpaid.
 *
 * Only call on the LIVE budgets — archived expenses are historical and stay.
 *
 * @returns {{removed: Object, markPaid: boolean}|null} null when not found
 */
export function consumeConvertedExpense(budgets, { budgetId, expenseId, paymentMethod, todayISO }) {
    const b = (budgets || []).find(x => x.id === budgetId);
    const i = b?.expenses?.findIndex(e => e.id === expenseId) ?? -1;
    if (i < 0) return null;
    const [removed] = b.expenses.splice(i, 1);
    const markPaid = paymentMethod !== 'card' && !!removed.date && removed.date <= todayISO;
    return { removed, markPaid };
}

/**
 * Move a budget to a new position. Array order is display order.
 * @returns {Array} the reordered array (new array), or the same reference
 *   when the move is a no-op (same id, missing ids)
 */
export function reorderBudgets(budgets, dragId, targetId) {
    if (!dragId || !targetId || dragId === targetId) return budgets;
    const list = budgets || [];
    const from = list.findIndex(b => b.id === dragId);
    const to   = list.findIndex(b => b.id === targetId);
    if (from < 0 || to < 0) return list;
    const next = list.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
}
