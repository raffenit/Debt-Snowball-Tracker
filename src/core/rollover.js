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

    // ── 2. Final balance = day-1 cash + income − all cash out ──────────────
    const day1Cp = checkpoints.find(cp => cp.day === 1);
    let cashPool = day1Cp ? day1Cp.amount : 0;
    const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const finalBalance = cashPool + totalIncome - totalCosts;
    archive.finalBalance = finalBalance;

    // ── 3. Next-month state ─────────────────────────────────────────────────
    const nextIncome = generateRecurringIncomeForMonth(incomeEntries, nextMonthKey);
    const nextCheckpoints = finalBalance > 0
        ? [{ id: 'cp_' + Date.now(), day: 1, amount: finalBalance }]
        : [];
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
