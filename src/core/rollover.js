// Month rollover logic — pure function for advancing from one month to the next.
// Used by both the automatic calendar rollover (on load) and the manual
// "Next Month" button.  All side-effects (HA API calls, global mutation) are
// handled by the callers.

import {
    formatMonthLabel,
    isCostDueInMonth,
    generateRecurringIncomeForMonth,
    monthKeyToIndex,
    addMonthsToKey,
} from './date-utils.js';
import { cashExpensesForMonth, syncCardExpenses } from './card-expenses.js';
import { getStrategyOrder } from './simulation.js';

/**
 * Calculate the state transition when closing one month and opening the next.
 *
 * @param {Object} state - Current application state snapshot
 * @param {Array} state.debts
 * @param {Array} state.recurringCosts
 * @param {Array} state.oneTimeCosts
 * @param {Array} state.incomeEntries
 * @param {Array} state.checkpoints
 * @param {number} state.startingBalance
 * @param {Object} state.paidStatus
 * @param {Array} state.spendingBudgets
 * @param {Object} [state.minPayOverrides]
 * @param {string} [state.strategy]
 * @param {string} closingMonthKey - Month being closed (e.g. "2026-3")
 * @param {string} nextMonthKey - Month being opened (e.g. "2026-4")
 * @returns {{archive: Object, nextState: Object}} Archive snapshot and next-month state
 */
export function calculateMonthRollover(state, closingMonthKey, nextMonthKey) {
    const {
        debts = [],
        recurringCosts = [],
        oneTimeCosts = [],
        incomeEntries = [],
        checkpoints = [],
        startingBalance = 0,
        paidStatus = {},
        spendingBudgets = [],
        minPayOverrides = {},
        strategy = 'snowball',
    } = state;

    // Card-paid bills never touch bank cash (autopaid by card), and manual
    // budget expenses DO leave the account — mirror the cash-flow plan's rules.
    const isCashCost = c => c.paymentMethod !== 'card';
    const cashCosts = [
        ...recurringCosts.filter(c => isCostDueInMonth(c, closingMonthKey) && isCashCost(c)),
        ...oneTimeCosts.filter(isCashCost),
    ];
    const spentCash = cashExpensesForMonth(spendingBudgets || [], closingMonthKey)
        .reduce((s, e) => s + e.amount, 0);
    const totalCosts = cashCosts.reduce((s, c) => s + c.amount, 0) + spentCash;

    // ── 1. Archive snapshot of the closing month ────────────────────────────
    const archive = {
        month: closingMonthKey,
        label: formatMonthLabel(closingMonthKey),
        incomeEntries: [...incomeEntries],
        recurringCosts: [...recurringCosts],
        oneTimeCosts: [...oneTimeCosts],
        checkpoints: [...checkpoints],
        debts: debts.map(d => ({ ...d })),
        spendingBudgets: (spendingBudgets || []).map(b => ({
            ...b,
            expenses: (b.expenses || []).map(e => ({ ...e })),
        })),
        startingBalance,
        paidStatus: { ...paidStatus },
        totalIncome: incomeEntries.reduce((s, e) => s + e.amount, 0),
        totalCosts,
    };

    // ── 2. Final balance, mirroring the cash-flow schedule ─────────────────
    // A checkpoint is a ground-truth bank sync that hard-resets the pool, so
    // the LAST one is the real balance — only income after its day still adds,
    // and only outflows on/after its day still subtract. With no checkpoints
    // the pool starts at 0. Debt payments are real cash outflows and must be
    // counted (minimums/overrides + snowball extra on the target, capped at
    // balance — same math the schedule uses).
    const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const orderedDebts = getStrategyOrder(debts.filter(d => d.balance > 0), strategy);
    const totalMinPay = orderedDebts.reduce((s, d) => s + (minPayOverrides[d.id] ?? d.minPayment ?? 0), 0);
    const extra = Math.max(0, totalIncome - totalCosts - totalMinPay);
    const targetId = orderedDebts[0]?.id;

    const syncDay = checkpoints.length
        ? Math.max(...checkpoints.map(cp => cp.day))
        : 0;
    const poolAtSync = checkpoints.length
        ? checkpoints.find(cp => cp.day === syncDay).amount
        : 0;

    const dayOf = (e) => parseInt((e.date || '').split('-')[2]) || 1;
    const incomeAfter = incomeEntries
        .filter(e => dayOf(e) > syncDay)
        .reduce((s, e) => s + e.amount, 0);
    const outflowsAfter = [
        ...cashCosts.map(c => ({ day: c.dueDay || 1, amount: c.amount })),
        ...cashExpensesForMonth(spendingBudgets || [], closingMonthKey)
            .map(e => ({ day: e.date ? dayOf(e) : 1, amount: e.amount })),
        ...orderedDebts.map(d => ({
            day: d.dueDay || 1,
            amount: Math.min(d.balance,
                (minPayOverrides[d.id] ?? d.minPayment ?? 0) + (d.id === targetId ? extra : 0)),
        })),
    ].filter(x => x.day >= syncDay)
     .reduce((s, x) => s + x.amount, 0);

    const finalBalance = poolAtSync + incomeAfter - outflowsAfter;
    archive.finalBalance = finalBalance;

    // ── 3. Next-month state ─────────────────────────────────────────────────
    const nextIncome = generateRecurringIncomeForMonth(incomeEntries, nextMonthKey);
    // Always seed day 1 with the closing month's final balance — including
    // zero and negative (overdraft) values. The next month's cash position
    // should never silently reset to "no checkpoint" just because the
    // month ended in the red.
    const nextCheckpoints = [{ id: 'cp_' + Date.now(), day: 1, amount: finalBalance, autoRollover: true }];
    // Defensive: strip any one-time costs that may still be in recurringCosts (backward compat)
    const cleanRecurring = recurringCosts.filter(c => (c.category || 'other') !== 'one-time');
    const nextCosts = cleanRecurring.map(c => {
        if ((c.intervalMonths || 1) <= 1) return c;
        let next = c.nextDueMonth || closingMonthKey;
        while (monthKeyToIndex(next) <= monthKeyToIndex(closingMonthKey)) {
            next = addMonthsToKey(next, c.intervalMonths);
        }
        return { ...c, nextDueMonth: next };
    });
    const nextBudgets = spendingBudgets.map(b => ({
        ...b,
        expenses: [],
        exception: (b.exception?.month === closingMonthKey) ? null : b.exception,
    }));

    return {
        archive,
        nextState: {
            incomeEntries: nextIncome,
            checkpoints: nextCheckpoints,
            recurringCosts: nextCosts,
            oneTimeCosts: [],
            paidStatus: {},
            minPayOverrides: {},
            spendingBudgets: nextBudgets,
            startingBalance: finalBalance,
        },
    };
}

/**
 * Reconstruct an archive for a month that was never rolled over.
 *
 * The archive mirrors what calculateMonthRollover would have captured:
 * recurring income is projected onto the month (biweekly series included),
 * stored one-time income dated in the month carries over, budget categories
 * become empty shells the user can fill via archive editing, and card-paid
 * bills are mirrored in as auto expenses via the normal sync.
 *
 * startingBalance is 0 and totals are computed from the reconstruction —
 * the archive is marked `retro` so the UI can disclose it was rebuilt.
 *
 * @param {Object} state - Live app state (debts, costs, income, budgets)
 * @param {string} monthKey - Month to reconstruct ("YYYY-M", 0-indexed month)
 * @returns {Object} Archive snapshot suitable for monthlyArchives
 */
export function buildRetroArchive(state, monthKey) {
    const {
        debts = [],
        recurringCosts = [],
        oneTimeCosts = [],
        incomeEntries = [],
        spendingBudgets = [],
    } = state;
    const isCashCost = c => c.paymentMethod !== 'card';
    const [y, m] = monthKey.split('-').map(Number);
    const htmlMk = `${y}-${String(m + 1).padStart(2, '0')}`;

    const income = [
        ...generateRecurringIncomeForMonth(incomeEntries, monthKey),
        ...incomeEntries.filter(e =>
            (e.scheduleType || e.schedule) === 'one-time' && (e.date || '').slice(0, 7) === htmlMk),
    ];

    const cashCostsDue = [
        ...recurringCosts.filter(c => isCostDueInMonth(c, monthKey) && isCashCost(c)),
        ...oneTimeCosts.filter(c => c.addedMonth === monthKey && isCashCost(c)),
    ];
    const totalIncome = income.reduce((s, e) => s + e.amount, 0);
    const totalCosts  = cashCostsDue.reduce((s, c) => s + c.amount, 0);

    // Budget shells (no manual expenses — user fills those in) then mirror
    // that month's card-paid bills in through the normal sync so card
    // spending shows up without manual re-entry.
    const shells = (spendingBudgets || []).map(b => ({
        ...b,
        expenses: [],
        exception: b.exception?.month === monthKey ? b.exception : null,
    }));
    const { budgets } = syncCardExpenses({
        recurringCosts, oneTimeCosts, spendingBudgets: shells, monthKey, skips: [],
    });

    return {
        month: monthKey,
        label: formatMonthLabel(monthKey),
        incomeEntries: income,
        recurringCosts: [...recurringCosts],
        oneTimeCosts: oneTimeCosts.filter(c => c.addedMonth === monthKey),
        checkpoints: [],
        debts: debts.map(d => ({ ...d })),
        spendingBudgets: budgets,
        startingBalance: 0,
        paidStatus: {},
        totalIncome,
        totalCosts,
        finalBalance: totalIncome - totalCosts,
        retro: true,
    };
}
