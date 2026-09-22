// Card-expense → spending-budget sync.
//
// Why this module exists: card-charged costs (paymentMethod === 'card') never
// touch the cash pool — they are autopaid by a credit card, so the payment
// plan ignores them. But they are still real spending, so this module mirrors
// each card charge into the spending budgets as an expense entry, all logged
// up front at month load so the budget always shows the month's committed
// card spending (each expense carries its real charge date). Auto expenses carry
// `autoCard`/`costId` markers so the sync can update, move, or remove them as
// costs change — and so user-entered expenses are never touched.
//
// Budget resolution order for a card cost:
//   1. Explicit cost.budgetId (set via the cost modal's Budget dropdown)
//   2. Budget whose name matches the cost name (case/emoji-insensitive)
//   3. Budget whose name contains a keyword for the cost's category
//   4. An auto-created category budget (Subscriptions/Utilities/Maintenance)
//   5. Fallback: the auto-generated "Card Autopay" budget, whose monthly
//      limit is auto-managed to equal the month's unrouted card charges
//
// Auto-created budgets share the fallback's rules: their monthly limit
// auto-tracks the routed charge total (unless the user sets a manual
// override), and they're removed once nothing routes to them — unless the
// user parked manual expenses there.
//
// Pure functions only — callers own state mutation and persistence.

import { isCostDueInMonth, keyToHtmlMonth } from './date-utils.js';

export const CARD_AUTOPAY_BUDGET_ID   = 'auto-card-autopay';
export const CARD_AUTOPAY_BUDGET_NAME = '💳 Card Autopay';

// Card costs whose category maps here get their own auto-created budget —
// e.g. a subscription charge auto-populates a "📱 Subscriptions" budget when
// the user hasn't made one. Categories without a meaningful grouping
// ('other', 'one-time') fall through to the Card Autopay catch-all.
export const CATEGORY_BUDGETS = {
    subscription: { id: 'auto_cat_subscription', name: '📱 Subscriptions' },
    utility:      { id: 'auto_cat_utility',      name: '⚡ Utilities' },
    maintenance:  { id: 'auto_cat_maintenance',  name: '🔧 Maintenance' },
};
const AUTO_BUDGET_IDS = new Set([CARD_AUTOPAY_BUDGET_ID, ...Object.values(CATEGORY_BUDGETS).map(c => c.id)]);

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
 * @param {Array}   args.skips     - Tombstones "monthKey:costId" for auto expenses the user deleted
 * @returns {{budgets: Array, changed: boolean}} New budgets array; `changed` is true when it differs.
 */
export function syncCardExpenses({ recurringCosts = [], oneTimeCosts = [], spendingBudgets = [], monthKey, skips = [] }) {
    const skipSet = new Set(skips);
    let changed = false;

    const dueCard = [...recurringCosts, ...oneTimeCosts]
        .filter(c => c.paymentMethod === 'card' && isCostDueInMonth(c, monthKey));
    // Every due card cost is logged immediately — the budget should show the
    // month's committed card spending from day one, not just charges already
    // posted. The expense's date is still its real charge day.
    const arrived = dueCard.filter(c => !skipSet.has(`${monthKey}:${c.id}`));

    const budgets = spendingBudgets.map(b => ({ ...b, expenses: [...(b.expenses || [])] }));

    // Route every due card cost: user budgets first (auto budgets are excluded
    // from name matching so they never "steal" a cost), then a category budget
    // created on demand, leaving only 'other'/'one-time' for the fallback.
    const userBudgets = budgets.filter(b => !AUTO_BUDGET_IDS.has(b.id));
    const routed      = new Map(); // costId → target budget (or absent → fallback)
    for (const cost of dueCard) {
        const match = findBudgetForCost(cost, userBudgets);
        if (match) { routed.set(cost.id, match); continue; }
        // User-taught routing: the categorize prompt can pin a cost to a
        // category budget (any CATEGORY_BUDGETS key) or explicitly keep it
        // in the fallback ('autopay'). Applies every month via the cost.
        if (cost.budgetCategory === 'autopay') continue;
        const cat = CATEGORY_BUDGETS[cost.budgetCategory || cost.category];
        if (cat) {
            let b = budgets.find(x => x.id === cat.id);
            if (!b) {
                b = { id: cat.id, name: cat.name, amount: 0, expenses: [], autoGenerated: true };
                budgets.push(b);
                changed = true;
            }
            routed.set(cost.id, b);
        }
    }

    let fallback = budgets.find(b => b.id === CARD_AUTOPAY_BUDGET_ID);
    // The fallback limit covers ALL unmatched card charges due this month.
    const fallbackTotal = dueCard
        .filter(c => !routed.has(c.id))
        .reduce((s, c) => s + c.amount, 0);
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

    // Routed totals per auto budget — the monthly limit auto-tracks them.
    const autoTotals = new Map();
    for (const cost of dueCard) {
        const t = routed.get(cost.id);
        if (t?.autoGenerated) autoTotals.set(t.id, (autoTotals.get(t.id) || 0) + cost.amount);
    }
    if (fallback) autoTotals.set(CARD_AUTOPAY_BUDGET_ID, fallbackTotal);

    // Every auto-generated budget: drop it once nothing routes to it this
    // month (unless the user parked manual expenses in it), else keep its
    // limit equal to the routed total — unless the user set a manual
    // override (an exception without the auto flag).
    for (let i = budgets.length - 1; i >= 0; i--) {
        const b = budgets[i];
        if (!b.autoGenerated) continue;
        const total = autoTotals.get(b.id) || 0;
        // Keep when the user parked manual expenses or set a manual limit
        // override (exception without the auto flag) — removing would lose it.
        const hasManual = b.expenses.some(e => !e.autoCard) || (b.exception && !b.exception.auto);
        if (total === 0 && !hasManual) {
            budgets.splice(i, 1);
            if (b === fallback) fallback = null;
            changed = true;
            continue;
        }
        const exc = b.exception;
        if (!exc || exc.month !== monthKey || exc.auto) {
            if (!exc || exc.month !== monthKey || exc.amount !== total || !exc.auto) {
                b.exception = { month: monthKey, amount: total, auto: true };
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
    const costById = new Map(dueCard.map(c => [c.id, c]));

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
    const newFallbackCosts = [];
    for (const { budgetId, expense } of desired.values()) {
        const target = budgets.find(b => b.id === budgetId);
        if (!target) continue;
        target.expenses.push(expense);
        changed = true;
        // Costs that newly land in the catch-all are candidates for the
        // categorize prompt — only when the user hasn't already told us.
        if (budgetId === CARD_AUTOPAY_BUDGET_ID) {
            const cost = costById.get(expense.costId);
            if (cost && cost.budgetCategory !== 'autopay') newFallbackCosts.push(cost);
        }
    }

    return { budgets, changed, newFallbackCosts };
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
export function computeCardPayoffStatus({ recurringCosts = [], oneTimeCosts = [], incomeEntries = [], debts = [], minPayOverrides = {}, spendingBudgets = [], monthKey }) {
    const due = [...recurringCosts, ...oneTimeCosts]
        .filter(c => isCostDueInMonth(c, monthKey));

    // cardChargesByDebt already totals card bills AND manual card expenses —
    // cardCharges is just its sum.
    const { byDebt, unassigned, items } = cardChargesByDebt({ recurringCosts, oneTimeCosts, spendingBudgets, monthKey });
    const cardCharges  = Object.values(byDebt).reduce((s, v) => s + v, 0) + unassigned;
    const directCosts  = due.filter(c => c.paymentMethod !== 'card').reduce((s, c) => s + c.amount, 0);
    const income       = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const minPayments  = debts
        .filter(d => d.balance > 0)
        .reduce((s, d) => s + (minPayOverrides[d.id] ?? d.minPayment ?? 0), 0);

    const cashAvailable = income - directCosts - minPayments;
    const shortfall     = Math.max(0, cardCharges - cashAvailable);
    return { cardCharges, cashAvailable, sustainable: shortfall === 0, shortfall, byDebt, unassigned, items };
}

/**
 * Group this month's card charges by the debt (credit card) they're linked to.
 * Costs carry `cardDebtId` when the user picked a specific card in the modal.
 * Manual budget expenses marked `paymentMethod === 'card'` count the same way
 * (dated expenses only in their month; undated count every month, matching
 * cashExpensesForMonth semantics).
 *
 * @returns {{byDebt: Object<string, number>, unassigned: number, items: Array}}
 *   byDebt maps debtId → total charged; unassigned totals card costs with no
 *   linked debt. items lists every contributing charge ({name, amount, debtId,
 *   source}) for display/diagnostics.
 */
export function cardChargesByDebt({ recurringCosts = [], oneTimeCosts = [], spendingBudgets = [], monthKey }) {
    const byDebt = {};
    let unassigned = 0;
    const items = [];
    const tally = (name, amount, debtId, source) => {
        items.push({ name, amount, debtId: debtId || null, source });
        if (debtId) byDebt[debtId] = (byDebt[debtId] || 0) + amount;
        else unassigned += amount;
    };
    for (const c of [...recurringCosts, ...oneTimeCosts]) {
        if (c.paymentMethod !== 'card' || !isCostDueInMonth(c, monthKey)) continue;
        tally(c.name, c.amount, c.cardDebtId, 'bill');
    }
    const htmlMk = keyToHtmlMonth(monthKey);
    for (const b of spendingBudgets || []) {
        for (const e of b.expenses || []) {
            if (e.autoCard || e.paymentMethod !== 'card') continue;
            if (e.date && e.date.slice(0, 7) !== htmlMk) continue;
            tally(e.description, e.amount, e.cardDebtId, 'expense');
        }
    }
    return { byDebt, unassigned, items };
}

/**
 * Flatten the month's *manual* budget expenses (cash/debit/Zelle purchases)
 * for use as cash outflows in the payment plan. Auto-logged card expenses
 * (autoCard) and manual expenses marked `paymentMethod === 'card'` are
 * excluded — they land on a card balance, never the cash pool.
 * Each returned expense gains `budgetName` for display. Expenses dated
 * outside `monthKey` are skipped; undated ones are included.
 */
export function cashExpensesForMonth(spendingBudgets, monthKey) {
    return (spendingBudgets || [])
        .flatMap(b => (b.expenses || [])
            .filter(e => !e.autoCard && e.paymentMethod !== 'card')
            .map(e => ({ ...e, budgetName: b.name, budgetId: b.id })))
        .filter(e => {
            if (!e.date) return true;
            const [y, m] = e.date.split('-').map(Number);
            return `${y}-${m - 1}` === monthKey;
        });
}
