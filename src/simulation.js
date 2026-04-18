// Shared simulation logic for debt snowball/avalanche calculations
// Used by both the main panel app and test suite

import { MAX_SIMULATION_MONTHS } from './constants.js';
import { currentMonthKey } from './date-utils.js';

// ── State setters (mirrors app.js globals) ───────────────────────────────────
let debts = [];
let recurringCosts = [];
let incomeEntries = [];
let startingBalance = 0;

export function setDebts(d)            { debts = d; }
export function setRecurringCosts(c)   { recurringCosts = c; }
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
// NOTE: effectiveBudget = income - DIRECT costs only (excluding one-time costs).
// Card-charged recurring costs do NOT reduce the immediate cash available
// for debt payoff — they are assumed to be folded into card minimum payments.
// One-time costs are excluded because timeline projects multi-month future.
export function runSimulation(strat) {
    const totalIncome          = incomeEntries.reduce((s,e) => s + e.amount, 0);
    // For timeline projection, exclude one-time costs from effectiveBudget calculation
    const monthlyCostsOnly     = recurringCosts.filter(c => (c.category || 'other') !== 'one-time');
    const totalRecurringDirect = monthlyCostsOnly.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurringCard   = monthlyCostsOnly.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurring       = monthlyCostsOnly.reduce((s,c) => s + c.amount, 0);
    // Only direct-payment costs reduce the immediate cash available for debt payoff;
    // card-charged costs are already folded into the card's minimum payment.
    // Note: one-time costs are excluded because timeline projects multi-month future.
    const effectiveBudget      = totalIncome - totalRecurringDirect;

    if (debts.length === 0 || totalIncome <= 0 || effectiveBudget <= 0) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget };
    }

    const totalMinPayments = debts.reduce((s,d) => s + d.minPayment, 0);
    if (effectiveBudget < totalMinPayments) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget, belowMin: true, totalMinPayments };
    }

    const incomeDays = [...incomeEntries]
        .map(e => ({ day: parseInt(e.date.split('-')[2]), amount: e.amount }))
        .sort((a,b) => a.day - b.day);

    let simDebts = debts.map(d => ({ ...d, interestPaid: 0 }));
    let monthsElapsed = 0, totalInterestPaid = 0, payoffLog = [];
    const perDebtMonthly = {};
    simDebts.forEach(d => { perDebtMonthly[d.id] = [d.balance]; });

    while (simDebts.some(d => d.balance > 0) && monthsElapsed < MAX_SIMULATION_MONTHS) {
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
            totalInterestPaid += interest;
            d.interestPaid    += interest;
        });

        const alive     = simDebts.filter(d => d.balance > 0);
        const ordered   = getStrategyOrder(alive, strat);
        const targetId  = ordered[0]?.id;
        const aliveMinSum  = alive.reduce((s,d) => s + d.minPayment, 0);
        const extraAvail   = Math.max(0, effectiveBudget - aliveMinSum);

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
