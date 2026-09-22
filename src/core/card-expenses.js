// Card-expense → spending-budget sync.
//
// Why this module exists: card-charged costs (paymentMethod === 'card') never
// touch the cash pool — they are autopaid by a credit card, so the payment
// plan ignores them. But they are still real spending, so this module mirrors
// each card charge into the spending budgets as an expense entry, logged on
// the day the charge actually posts (its dueDay). Auto expenses carry
// `autoCard`/`costId` markers so the sync can update, move, or remove them as
// costs change — and so user-entered expenses are never touched.
//
// Budget resolution order for a card cost:
//   1. Explicit cost.budgetId (set via the cost modal's Budget dropdown)
//   2. Budget whose name matches the cost name (case/emoji-insensitive)
//   3. Budget whose name contains a keyword for the cost's category
//   4. Fallback: the auto-generated "Card Autopay" budget, whose monthly
//      limit is auto-managed to equal the month's total card charges
//
// Pure functions only — callers own state mutation and persistence.

import { isCostDueInMonth } from './date-utils.js';

export const CARD_AUTOPAY_BUDGET_ID   = 'auto-card-autopay';
export const CARD_AUTOPAY_BUDGET_NAME = '💳 Card Autopay';

const CATEGORY_KEYWORDS = {
    utility:      ['util'],
    subscription: ['subscri', 'stream'],
    maintenance:  ['mainten', 'repair'],
};

function normalizeName(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function namesMatch(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    const [short, long] = a.length <= b.length ? [a, b] : [b, a];
    return short.length >= 4 && long.includes(short);
}

/**
 * Resolve which spending budget a card cost should be logged to.
 * @returns {Object|null} The matching budget, or null if none matched.
 */
export function findBudgetForCost(cost, budgets) {
    if (cost.budgetId) {
        const explicit = budgets.find(b => b.id === cost.budgetId);
        if (explicit) return explicit;
    }
    const costName = normalizeName(cost.name);
    const byName = budgets.find(b => namesMatch(costName, normalizeName(b.name)));
    if (byName) return byName;
    const keywords = CATEGORY_KEYWORDS[cost.category] || [];
    return budgets.find(b => keywords.some(k => normalizeName(b.name).includes(k))) || null;
}

function chargeDayFor(monthKey, dueDay) {
    const [y, m] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return Math.min(Math.max(dueDay || 1, 1), daysInMonth);
}

function expenseDateFor(monthKey, dueDay) {
    const [y, m] = monthKey.split('-').map(Number);
    const day = chargeDayFor(monthKey, dueDay);
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Reconcile spending budgets with the card-charged costs that have come due.
 *
 * @param {Object}  args
 * @param {Array}   args.recurringCosts
 * @param {Array}   args.oneTimeCosts
 * @param {Array}   args.spendingBudgets
 * @param {string}  args.monthKey  - Working month ("YYYY-M", 0-indexed month)
 * @param {number}  args.todayDay  - Day of month; card costs only log once dueDay <= todayDay
 * @param {Array}   args.skips     - Tombstones "monthKey:costId" for auto expenses the user deleted
 * @returns {{budgets: Array, changed: boolean}} New budgets array; `changed` is true when it differs.
 */
export function syncCardExpenses({ recurringCosts = [], oneTimeCosts = [], spendingBudgets = [], monthKey, todayDay, skips = [] }) {
    const skipSet = new Set(skips);
    let changed = false;

    const dueCard = [...recurringCosts, ...oneTimeCosts]
        .filter(c => c.paymentMethod === 'card' && isCostDueInMonth(c, monthKey));
    // Arrival uses the clamped charge day — a "31st" charge posts on the 28th in February.
    const arrived = dueCard.filter(c =>
        chargeDayFor(monthKey, c.dueDay) <= todayDay && !skipSet.has(`${monthKey}:${c.id}`));

    const budgets = spendingBudgets.map(b => ({ ...b, expenses: [...(b.expenses || [])] }));

    // Route every due card cost against user budgets first (the fallback is
    // excluded from matching so it never "steals" a cost by name).
    const userBudgets = budgets.filter(b => b.id !== CARD_AUTOPAY_BUDGET_ID);
    const routed      = new Map(); // costId → user budget (or absent → fallback)
    for (const cost of dueCard) {
        const match = findBudgetForCost(cost, userBudgets);
        if (match) routed.set(cost.id, match);
    }
    // The fallback limit covers ALL unmatched card charges due this month —
    // even ones whose due day hasn't arrived yet.
    const fallbackTotal = dueCard
        .filter(c => !routed.has(c.id))
        .reduce((s, c) => s + c.amount, 0);

    let fallback = budgets.find(b => b.id === CARD_AUTOPAY_BUDGET_ID);
    const fallbackNeeded = arrived.some(c => !routed.has(c.id)) || fallbackTotal > 0;

    if (!fallback && fallbackNeeded) {
        fallback = {
            id:            CARD_AUTOPAY_BUDGET_ID,
            name:          CARD_AUTOPAY_BUDGET_NAME,
            amount:        fallbackTotal,
            exception:     { month: monthKey, amount: fallbackTotal, auto: true },
            expenses:      [],
            autoGenerated: true,
        };
        budgets.push(fallback);
        changed = true;
    }

    // Remove an empty auto budget once nothing routes to it this month —
    // unless the user parked manual expenses in it.
    if (fallback && fallback.autoGenerated && fallbackTotal === 0
        && !fallback.expenses.some(e => !e.autoCard)) {
        if (fallback.expenses.length > 0) changed = true;
        budgets.splice(budgets.indexOf(fallback), 1);
        fallback = null;
        changed = true;
    }

    // Keep the auto budget's monthly limit equal to this month's unmatched
    // card charges — unless the user set a manual override (an exception
    // without the auto flag).
    if (fallback && fallback.autoGenerated) {
        const exc = fallback.exception;
        if (!exc || exc.month !== monthKey || exc.auto) {
            if (!exc || exc.month !== monthKey || exc.amount !== fallbackTotal || !exc.auto) {
                fallback.exception = { month: monthKey, amount: fallbackTotal, auto: true };
                changed = true;
            }
        }
    }

    // Desired auto expenses: expenseId → { budgetId, expense }
    const desired = new Map();
    for (const cost of arrived) {
        const target = routed.get(cost.id) || fallback;
        if (!target) continue;
        desired.set(`cardauto_${cost.id}`, {
            budgetId: target.id,
            expense: {
                id:          `cardauto_${cost.id}`,
                description: cost.name,
                amount:      cost.amount,
                date:        expenseDateFor(monthKey, cost.dueDay),
                costId:      cost.id,
                autoCard:    true,
            },
        });
    }

    // Prune stale/moved auto expenses; mirror field updates onto kept ones
    for (const budget of budgets) {
        const kept = [];
        for (const exp of budget.expenses) {
            if (!exp.autoCard) { kept.push(exp); continue; }
            const want = desired.get(exp.id);
            if (want && want.budgetId === budget.id) {
                if (exp.description !== want.expense.description ||
                    exp.amount !== want.expense.amount ||
                    exp.date !== want.expense.date) {
                    kept.push({ ...exp, ...want.expense });
                    changed = true;
                } else {
                    kept.push(exp);
                }
                desired.delete(exp.id);
            } else {
                changed = true; // orphaned, moved, or no longer due
            }
        }
        budget.expenses = kept;
    }

    // Insert auto expenses that don't exist yet
    for (const { budgetId, expense } of desired.values()) {
        const target = budgets.find(b => b.id === budgetId);
        if (!target) continue;
        target.expenses.push(expense);
        changed = true;
    }

    return { budgets, changed };
}

/**
 * Pay-in-full sustainability check for the Budgets tab.
 *
 * Card charges don't reduce the cash pool day-to-day, but the card bill still
 * has to be paid — ideally in full each month. This reports whether the
 * month's income can cover every card charge on top of direct costs and
 * minimum debt payments, i.e. whether card spending is sustainable without
 * growing the card balance.
 *
 * @returns {{cardCharges: number, cashAvailable: number, sustainable: boolean, shortfall: number}}
 */
export function computeCardPayoffStatus({ recurringCosts = [], oneTimeCosts = [], incomeEntries = [], debts = [], minPayOverrides = {}, monthKey }) {
    const due = [...recurringCosts, ...oneTimeCosts]
        .filter(c => isCostDueInMonth(c, monthKey));

    const cardCharges  = due.filter(c => c.paymentMethod === 'card').reduce((s, c) => s + c.amount, 0);
    const directCosts  = due.filter(c => c.paymentMethod !== 'card').reduce((s, c) => s + c.amount, 0);
    const income       = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const minPayments  = debts
        .filter(d => d.balance > 0)
        .reduce((s, d) => s + (minPayOverrides[d.id] ?? d.minPayment ?? 0), 0);

    const cashAvailable = income - directCosts - minPayments;
    const shortfall     = Math.max(0, cardCharges - cashAvailable);
    const { byDebt, unassigned } = cardChargesByDebt({ recurringCosts, oneTimeCosts, monthKey });
    return { cardCharges, cashAvailable, sustainable: shortfall === 0, shortfall, byDebt, unassigned };
}

/**
 * Group this month's card charges by the debt (credit card) they're linked to.
 * Costs carry `cardDebtId` when the user picked a specific card in the modal.
 *
 * @returns {{byDebt: Object<string, number>, unassigned: number}}
 *   byDebt maps debtId → total charged; unassigned totals card costs with no
 *   linked debt.
 */
export function cardChargesByDebt({ recurringCosts = [], oneTimeCosts = [], monthKey }) {
    const byDebt = {};
    let unassigned = 0;
    for (const c of [...recurringCosts, ...oneTimeCosts]) {
        if (c.paymentMethod !== 'card' || !isCostDueInMonth(c, monthKey)) continue;
        if (c.cardDebtId) byDebt[c.cardDebtId] = (byDebt[c.cardDebtId] || 0) + c.amount;
        else unassigned += c.amount;
    }
    return { byDebt, unassigned };
}

/**
 * Flatten the month's *manual* budget expenses (cash/debit/Zelle purchases)
 * for use as cash outflows in the payment plan. Auto-logged card expenses
 * (autoCard) are excluded — they never touch the cash pool.
 * Each returned expense gains `budgetName` for display. Expenses dated
 * outside `monthKey` are skipped; undated ones are included.
 */
export function cashExpensesForMonth(spendingBudgets, monthKey) {
    return (spendingBudgets || [])
        .flatMap(b => (b.expenses || [])
            .filter(e => !e.autoCard)
            .map(e => ({ ...e, budgetName: b.name })))
        .filter(e => {
            if (!e.date) return true;
            const [y, m] = e.date.split('-').map(Number);
            return `${y}-${m - 1}` === monthKey;
        });
}
