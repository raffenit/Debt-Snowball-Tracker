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
        debts,
        recurringCosts,
        oneTimeCosts = [],
        incomeEntries,
        checkpoints,
        startingBalance,
        paidStatus,
        spendingBudgets,
    } = state;

    // ── 1. Archive snapshot of the closing month ────────────────────────────
    const archive = {
        month: closingMonthKey,
        label: formatMonthLabel(closingMonthKey),
        incomeEntries: [...incomeEntries],
        recurringCosts: [...recurringCosts],
        oneTimeCosts: [...oneTimeCosts],
        checkpoints: [...checkpoints],
        debts: debts.map(d => ({ ...d })),
        startingBalance,
        paidStatus: { ...paidStatus },
        totalIncome: incomeEntries.reduce((s, e) => s + e.amount, 0),
        totalCosts: [
            ...recurringCosts.filter(c => isCostDueInMonth(c, closingMonthKey)),
            ...oneTimeCosts,
        ].reduce((s, c) => s + c.amount, 0),
    };

    // ── 2. Final balance = day-1 cash + income − all costs ─────────────────
    const day1Cp = checkpoints.find(cp => cp.day === 1);
    let cashPool = day1Cp ? day1Cp.amount : 0;
    const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const totalCosts = [
        ...recurringCosts.filter(c => isCostDueInMonth(c, closingMonthKey)),
        ...oneTimeCosts,
    ].reduce((s, c) => s + c.amount, 0);
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
