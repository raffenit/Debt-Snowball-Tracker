// Shared simulation logic for debt snowball/avalanche calculations
// Used by both the main panel app and test suite

import { MAX_SIMULATION_MONTHS } from './constants.js';
import { currentMonthKey, isCostDueThisMonth, keyToHtmlMonth } from './date-utils.js';

// ── State setters (mirrors app.js globals) ───────────────────────────────────
let debts = [];
let recurringCosts = [];
let oneTimeCosts = [];
let incomeEntries = [];
let startingBalance = 0;

export function setDebts(d)            { debts = d; }
export function setRecurringCosts(c)   { recurringCosts = c; }
export function setOneTimeCosts(c)     { oneTimeCosts = c; }
export function setIncomeEntries(e)    { incomeEntries = e; }
export function setStartingBalance(b)  { startingBalance = b; }

// ── Strategy sorting ─────────────────────────────────────────────────────────
export function getStrategyOrder(debtList, strat) {
    const copy = [...debtList];
    if (strat === 'avalanche') {
        copy.sort((a,b) => {
            const ra = a.promoZeroInterest ? (a.originalRate || 0) : a.rate;
            const rb = b.promoZeroInterest ? (b.originalRate || 0) : b.rate;
            return rb - ra || a.balance - b.balance;
        });
    } else {
        copy.sort((a,b) => a.balance - b.balance);
    }
    return copy;
}

// ── Core Simulation ──────────────────────────────────────────────────────────
// Date-aware: income arrives on its specific day-of-month, payments are only
// made after sufficient cash has arrived. Returns a rich result object used
// for both the chart and the debt cards.
//
// NOTE: effectiveBudget = repeating income - DIRECT costs (excluding one-time
// costs and one-time income). Card-charged recurring costs do NOT reduce the
// cash available for debt payoff — they are folded into card minimum payments.
// One-time costs and one-time income are this-month only. The payoff timeline
// may spend one-time income in month 1, then continues on repeating income.
/**
 * Pure payoff simulation over an explicit state snapshot.
 * `state.monthKey` (optional): when set, income is scoped to that month and
 * cost due-checks evaluate against it — pass the working month so an
 * early-advanced month sims on its own data, not the real calendar's.
 */
export function simulatePayoff(state, strat) {
    const simDebtsInput = state.debts || [];
    const incomes       = state.incomeEntries || [];
    const costs         = state.recurringCosts || [];
    const monthKey      = state.monthKey || undefined;

    // Scope income to the target month when one is given — recurring rows are
    // materialized to the working month, so a stray one-time/stale row from
    // another month must not inflate (or corrupt) the projection.
    const scopedIncome = monthKey
        ? incomes.filter(e => (e.date || '').slice(0, 7) === keyToHtmlMonth(monthKey))
        : incomes;

    const isOneTimeIncome      = e => (e.scheduleType || e.schedule) === 'one-time';
    const oneTimeIncome        = scopedIncome.filter(isOneTimeIncome);
    const repeatingIncomeRows  = scopedIncome.filter(e => !isOneTimeIncome(e));
    const oneTimeTotal         = oneTimeIncome.reduce((s,e) => s + e.amount, 0);
    // Timeline repeats monthly and biweekly income. An explicit one-time row
    // is cash this month only — it must not be baked into every future month.
    const totalIncome          = repeatingIncomeRows.reduce((s,e) => s + e.amount, 0);
    // Timeline projection uses recurring costs due this month only; one-time costs are separate.
    const activeCosts          = costs.filter(c => isCostDueThisMonth(c, monthKey));
    const totalRecurringDirect = activeCosts.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurringCard   = activeCosts.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurring       = activeCosts.reduce((s,c) => s + c.amount, 0);
    // Only direct-payment costs reduce the immediate cash available for debt payoff;
    // card-charged costs are already folded into the card's minimum payment.
    const effectiveBudget      = totalIncome - totalRecurringDirect;

    if (simDebtsInput.length === 0 || totalIncome <= 0 || effectiveBudget <= 0) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget };
    }

    // Paid-off debts don't owe a minimum — don't let them block the sim.
    const totalMinPayments = simDebtsInput.filter(d => d.balance > 0).reduce((s,d) => s + d.minPayment, 0);
    if (effectiveBudget < totalMinPayments) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget, belowMin: true, totalMinPayments };
    }

    // Types listed here still receive their minimum (the bill is real) but
    // never the extra payment, and the countdown stops when every other debt
    // is gone. Used for "debt-free excluding the mortgage."
    const holdMinimumTypes = state.holdMinimumTypes || [];
    const isHeld = d => holdMinimumTypes.includes(d.type);

    const toIncomeDays = rows => rows
        .map(e => ({ day: parseInt((e.date || '').split('-')[2]) || 1, amount: e.amount }))
        .sort((a,b) => a.day - b.day);
    const repeatingIncomeDays = toIncomeDays(repeatingIncomeRows);
    const firstMonthIncomeDays = toIncomeDays(scopedIncome);

    let simDebts = simDebtsInput.map(d => ({ ...d, interestPaid: 0 }));
    let monthsElapsed = 0, totalInterestPaid = 0, payoffLog = [];
    const perDebtMonthly = {};
    simDebts.forEach(d => { perDebtMonthly[d.id] = [d.balance]; });

    const stillCounting = d => d.balance > 0 && !isHeld(d);
    const unfinished = holdMinimumTypes.length
        ? () => simDebts.some(stillCounting)
        : () => simDebts.some(d => d.balance > 0);
    while (unfinished() && monthsElapsed < MAX_SIMULATION_MONTHS) {
        monthsElapsed++;
        let availableCash = effectiveBudget + (monthsElapsed === 1 ? startingBalance : 0); // eslint-disable-line no-unused-vars

        // Accrue interest
        simDebts.forEach(d => {
            if (d.balance <= 0) return;
            let effectiveRate = d.rate;
            if (d.promoZeroInterest && d.promoExpiryDate) {
                const today   = new Date();
                const simDate = new Date(today.getFullYear(), today.getMonth() + monthsElapsed, 1);
                if (simDate <= new Date(d.promoExpiryDate+'T00:00:00')) effectiveRate = 0;
                else effectiveRate = d.originalRate || d.rate;
            }
            const interest     = d.balance * (effectiveRate / 100 / 12);
            d.balance         += interest;
            d.interestPaid    += interest;
            if (!isHeld(d)) totalInterestPaid += interest;
        });

        const alive      = simDebts.filter(d => d.balance > 0);
        const targetPool = holdMinimumTypes.length ? alive.filter(d => !isHeld(d)) : alive;
        const ordered    = getStrategyOrder(targetPool.length ? targetPool : alive, strat);
        const targetId   = ordered[0]?.id;
        const aliveMinSum  = alive.reduce((s,d) => s + d.minPayment, 0);
        const monthBudget  = monthsElapsed === 1 ? effectiveBudget + oneTimeTotal : effectiveBudget;
        const incomeDays   = monthsElapsed === 1 ? firstMonthIncomeDays : repeatingIncomeDays;
        const extraAvail   = Math.max(0, monthBudget - aliveMinSum);

        const paymentQueue = alive.map(d => ({
            id:     d.id,
            dueDay: d.dueDay || 1,
            needed: Math.min(
                d.balance,
                d.minPayment + (d.id === targetId ? Math.min(extraAvail, Math.max(0, d.balance - d.minPayment)) : 0)
            )
        })).sort((a,b) => a.dueDay - b.dueDay);

        let cashPool = 0, incomeIdx = 0;
        for (const payment of paymentQueue) {
            while (incomeIdx < incomeDays.length && incomeDays[incomeIdx].day <= payment.dueDay)
                cashPool += incomeDays[incomeIdx++].amount;
            while (cashPool < payment.needed && incomeIdx < incomeDays.length)
                cashPool += incomeDays[incomeIdx++].amount;

            const debt = simDebts.find(d => d.id === payment.id);
            if (!debt || debt.balance <= 0) continue;
            const actual = Math.min(payment.needed, cashPool, debt.balance);
            cashPool    -= actual;
            debt.balance = Math.max(0, debt.balance - actual);
            if (debt.balance <= 0.01) {
                debt.balance = 0;
                if (!payoffLog.find(l => l.id === debt.id))
                    payoffLog.push({ ...debt, payoffMonth: monthsElapsed });
            }
        }
        simDebts.forEach(d => { perDebtMonthly[d.id].push(Math.max(0, d.balance)); });
    }

    const debtPayoffMonths = {};
    payoffLog.forEach(l => { debtPayoffMonths[l.id] = l.payoffMonth; });
    const maxLen = Math.max(...Object.values(perDebtMonthly).map(a => a.length));
    const monthlyTotals = Array.from({ length: maxLen }, (_,i) =>
        Object.values(perDebtMonthly).reduce((sum, arr) => sum + (arr[i] ?? 0), 0)
    );

    return { valid: true, monthsElapsed, totalInterestPaid, payoffLog,
             monthlyTotals, perDebtMonthly, debtPayoffMonths,
             totalIncome, totalRecurring, effectiveBudget };
}

/**
 * Build a simulatePayoff snapshot from live app state.
 * The card stores the working month as `workingMonthKey`; the engine reads `monthKey`.
 */
// Mortgage stays on its minimum, and out of the payoff, unless the timeline
// toggle explicitly includes it. Missing flag means excluded.
export function planHoldTypes(state) {
    if (!state || state.includeMortgageOnTimeline === true) return [];
    const hasMortgage = (state.debts || []).some(d => d.type === 'mortgage' && d.balance > 0);
    return hasMortgage ? ['mortgage'] : [];
}

export function simulationStateFrom(state) {
    return {
        debts:           state.debts || [],
        incomeEntries:   state.incomeEntries || [],
        recurringCosts:  state.recurringCosts || [],
        monthKey:        state.monthKey || state.workingMonthKey,
        startingBalance: state.startingBalance || 0,
    };
}

// Optional second argument is the live card state. Omitting it keeps the
// setter-based module globals used by the unit tests.
export function runSimulation(strat, state) {
    const snapshot = state
        ? simulationStateFrom(state)
        : { debts, incomeEntries, recurringCosts, startingBalance };
    const hold = planHoldTypes(state);
    if (hold.length) snapshot.holdMinimumTypes = hold;
    return simulatePayoff(snapshot, strat);
}

export function runSimulationWithWindfall(windfall, strat) {
    let simDebts  = debts.map(d => ({ ...d }));
    const ordered = getStrategyOrder(simDebts, strat);
    let remaining = windfall;
    const allocation = [];

    for (const debt of ordered) {
        if (remaining <= 0) break;
        const apply = Math.min(remaining, debt.balance);
        const live  = simDebts.find(d => d.id === debt.id);
        if (live) live.balance = Math.max(0, live.balance - apply);
        allocation.push({ name: debt.name, applied: apply });
        remaining -= apply;
    }

    const originalDebts = debts;
    debts = simDebts.filter(d => d.balance > 0.01);
    const result = runSimulation(strat);
    debts = originalDebts;
    result.allocation = allocation;
    return result;
}
