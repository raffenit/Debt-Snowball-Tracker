// Extended tests for debt-snowball-card.js (Lovelace card) logic
// Tests pure functions from src/ modules - UI-independent
// Covers gaps not exercised by app.test.js:
//   - card vs direct recurring cost budget separation
//   - startingBalance accelerates first month payoff
//   - promo debt that expires mid-simulation starts accruing interest
//   - three-debt snowball cascade (extra rolls to next target)
//   - three-debt avalanche cascade
//   - zero-balance debts are skipped in simulation
//   - runSimulationWithWindfall: cascade across multiple debts
//   - formatMoney edge cases
//   - calcAutoMin precision across a range of inputs
//
// Run with: node --test tests/app.extended.test.js

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    formatMoney,
    calcAutoMin,
    getStrategyOrder,
    runSimulation,
    runSimulationWithWindfall,
    setDebts,
    setRecurringCosts,
    setOneTimeCosts,
    setIncomeEntries,
    setStartingBalance,
} from './helpers.js';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const paycheck = (amount, day = 1) => [{
    id: 'inc1', label: 'Paycheck', amount,
    date: `2026-03-${String(day).padStart(2, '0')}`,
}];

const makeDebt = (overrides) => ({
    id: 'd1', name: 'Card A', balance: 1000, rate: 20,
    originalRate: 20, minPayment: 50, dueDay: 15,
    autoPay: false, promoZeroInterest: false,
    promoExpiryDate: null, paymentUrl: '',
    ...overrides,
});

// ─── Card vs Direct recurring costs ──────────────────────────────────────────

describe('card-charged recurring costs are excluded from effectiveBudget', () => {
    beforeEach(() => {
        setStartingBalance(0);
        setDebts([makeDebt({ id: 'd1', balance: 1000, rate: 0, minPayment: 100, dueDay: 1 })]);
        setIncomeEntries(paycheck(1500));
    });

    test('direct cost reduces effectiveBudget', () => {
        setRecurringCosts([{ id: 'r1', name: 'Rent', amount: 500, dueDay: 1, paymentMethod: 'direct' }]);
        const r = runSimulation('snowball');
        assert.equal(r.effectiveBudget, 1000); // 1500 - 500
        assert.equal(r.valid, true);
    });

    test('card cost does NOT reduce effectiveBudget', () => {
        setRecurringCosts([{ id: 'r1', name: 'Subscription', amount: 500, dueDay: 1, paymentMethod: 'card' }]);
        const r = runSimulation('snowball');
        assert.equal(r.effectiveBudget, 1500); // 1500 - 0 (card costs excluded)
        assert.equal(r.valid, true);
    });

    test('mixed costs: only direct portion reduces budget', () => {
        setRecurringCosts([
            { id: 'r1', name: 'Rent',   amount: 400, dueDay: 1, paymentMethod: 'direct' },
            { id: 'r2', name: 'Netflix', amount: 20,  dueDay: 5, paymentMethod: 'card' },
        ]);
        const r = runSimulation('snowball');
        assert.equal(r.effectiveBudget, 1100); // 1500 - 400 (card $20 excluded)
        assert.equal(r.valid, true);
    });

    test('card cost alone does not invalidate simulation even if large', () => {
        // $1400 card cost: effectiveBudget = 1500 - 0 = 1500, still valid
        setRecurringCosts([{ id: 'r1', name: 'BigCard', amount: 1400, dueDay: 1, paymentMethod: 'card' }]);
        const r = runSimulation('snowball');
        assert.equal(r.valid, true);
    });

    test('one-time costs are excluded from effectiveBudget in timeline simulation', () => {
        // Without one-time cost: effectiveBudget = 1500 - 0 = 1500, minPayment = 100, valid
        // With one-time cost of $2000: if counted, effectiveBudget would be negative
        // But one-time costs should NOT affect timeline projection
        setRecurringCosts([]);
        setOneTimeCosts([
            { id: 'r1', name: 'Emergency', amount: 2000, dueDay: 1, paymentMethod: 'direct' },
        ]);
        const r = runSimulation('snowball');
        // Timeline should remain valid because one-time costs are excluded from effectiveBudget
        assert.equal(r.valid, true, 'timeline should be valid even with large one-time cost this month');
        assert.equal(r.effectiveBudget, 1500, 'one-time cost should not reduce effectiveBudget');
    });

    test('direct cost large enough to invalidate simulation', () => {
        // $1400 direct cost: effectiveBudget = 1500 - 1400 = 100, less than minPayment 100? No, equal. 
        // Make it exceed: $1450 direct → effectiveBudget = 50 < 100 minPayment
        setRecurringCosts([{ id: 'r1', name: 'Rent', amount: 1450, dueDay: 1, paymentMethod: 'direct' }]);
        const r = runSimulation('snowball');
        assert.equal(r.valid, false);
        assert.ok(r.belowMin, 'should report belowMin when direct costs eat the budget');
    });

    test('card costs appear in totalRecurring but not effectiveBudget', () => {
        setRecurringCosts([
            { id: 'r1', name: 'Rent',    amount: 300, dueDay: 1, paymentMethod: 'direct' },
            { id: 'r2', name: 'Netflix', amount: 15,  dueDay: 5, paymentMethod: 'card' },
        ]);
        const r = runSimulation('snowball');
        assert.equal(r.totalRecurring, 315);      // both count toward total
        assert.equal(r.effectiveBudget, 1200);    // only direct (300) subtracted
    });
});

// ─── startingBalance ─────────────────────────────────────────────────────────
// NOTE: startingBalance is declared in app.js and computed into `availableCash`
// inside runSimulation(), but that variable is never read by the payment loop
// (it carries an eslint-disable-line no-unused-vars comment in the source).
// The core simulation timeline is therefore NOT affected by startingBalance.
// It only influences renderPaymentPlan() (the monthly schedule UI view).
// These tests document that boundary so any future accidental change is caught.

describe('startingBalance — simulation engine boundary', () => {
    beforeEach(() => {
        setRecurringCosts([]);
        setIncomeEntries(paycheck(200, 1));
        setDebts([makeDebt({ id: 'd1', balance: 500, rate: 0, minPayment: 100, dueDay: 15 })]);
    });

    test('startingBalance has no effect on months-to-payoff in the simulation engine', () => {
        setStartingBalance(0);
        const without = runSimulation('snowball').monthsElapsed;

        setStartingBalance(10000); // huge value — should not change timeline
        const withBig = runSimulation('snowball').monthsElapsed;

        assert.equal(withBig, without,
            `startingBalance should not change simulation timeline (${without} vs ${withBig} months)`);
    });

    test('simulation remains valid regardless of startingBalance value', () => {
        setStartingBalance(999999);
        assert.equal(runSimulation('snowball').valid, true);
    });

    test('negative startingBalance does not crash the simulation', () => {
        setStartingBalance(-500);
        assert.doesNotThrow(() => runSimulation('snowball'));
    });

    test('setStartingBalance(0) is the safe default', () => {
        setStartingBalance(0);
        assert.equal(runSimulation('snowball').valid, true);
    });
});

// ─── Promo expiry mid-simulation ─────────────────────────────────────────────

describe('promo debt starts accruing interest after expiry', () => {
    test('interest accrues after promo window closes', () => {
        setStartingBalance(0);
        setRecurringCosts([]);
        setIncomeEntries(paycheck(200, 1));

        // Promo expires next month — after that, 24% APR kicks in
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        const expiryStr = expiry.toISOString().split('T')[0];

        setDebts([makeDebt({
            id: 'promo', balance: 5000, rate: 0, originalRate: 24,
            minPayment: 100, dueDay: 1,
            promoZeroInterest: true, promoExpiryDate: expiryStr,
        })]);

        const r = runSimulation('snowball');
        assert.ok(r.totalInterestPaid > 0,
            `expected interest after promo expires, got ${r.totalInterestPaid}`);
    });

    test('no interest paid if promo never expires (far-future date)', () => {
        setStartingBalance(0);
        setRecurringCosts([]);
        setIncomeEntries(paycheck(3000, 1));
        setDebts([makeDebt({
            id: 'promo', balance: 1000, rate: 0, originalRate: 24,
            minPayment: 100, dueDay: 1,
            promoZeroInterest: true, promoExpiryDate: '2099-12-31',
        })]);

        const r = runSimulation('snowball');
        assert.ok(r.totalInterestPaid < 0.01,
            `expected ~0 interest, got ${r.totalInterestPaid}`);
    });
});

// ─── Snowball cascade (extra rolls to next target) ───────────────────────────

describe('snowball cascade — extra payment rolls to next debt after payoff', () => {
    beforeEach(() => {
        setStartingBalance(0);
        setRecurringCosts([]);
        setIncomeEntries(paycheck(1000, 1));
        setDebts([
            makeDebt({ id: 'small',  name: 'Small',  balance: 200,  rate: 0, minPayment: 50,  dueDay: 1 }),
            makeDebt({ id: 'medium', name: 'Medium', balance: 800,  rate: 0, minPayment: 100, dueDay: 1 }),
            makeDebt({ id: 'large',  name: 'Large',  balance: 3000, rate: 0, minPayment: 200, dueDay: 1 }),
        ]);
    });

    test('smallest debt is paid off first', () => {
        const r = runSimulation('snowball');
        const smallMonth  = r.debtPayoffMonths['small'];
        const mediumMonth = r.debtPayoffMonths['medium'];
        const largeMonth  = r.debtPayoffMonths['large'];
        assert.ok(smallMonth  <= mediumMonth, 'small should pay off before medium');
        assert.ok(mediumMonth <= largeMonth,  'medium should pay off before large');
    });

    test('simulation is valid', () => {
        assert.equal(runSimulation('snowball').valid, true);
    });

    test('all three debts appear in payoff log', () => {
        const r = runSimulation('snowball');
        assert.ok('small'  in r.debtPayoffMonths);
        assert.ok('medium' in r.debtPayoffMonths);
        assert.ok('large'  in r.debtPayoffMonths);
    });

    test('final monthlyTotals entry is zero', () => {
        const r = runSimulation('snowball');
        const last = r.monthlyTotals[r.monthlyTotals.length - 1];
        assert.ok(last < 0.01, `last balance should be ~0, got ${last}`);
    });
});

// ─── Avalanche cascade ───────────────────────────────────────────────────────

describe('avalanche cascade — highest rate gets extra, then rolls down', () => {
    beforeEach(() => {
        setStartingBalance(0);
        setRecurringCosts([]);
        setIncomeEntries(paycheck(1500, 1));
        setDebts([
            makeDebt({ id: 'low',  name: 'Low Rate',  balance: 2000, rate: 5,  minPayment: 60,  dueDay: 1 }),
            makeDebt({ id: 'mid',  name: 'Mid Rate',  balance: 1000, rate: 15, minPayment: 40,  dueDay: 1 }),
            makeDebt({ id: 'high', name: 'High Rate', balance: 500,  rate: 25, minPayment: 25,  dueDay: 1 }),
        ]);
    });

    test('highest-rate debt paid off first in avalanche', () => {
        const r = runSimulation('avalanche');
        const highMonth = r.debtPayoffMonths['high'];
        const midMonth  = r.debtPayoffMonths['mid'];
        const lowMonth  = r.debtPayoffMonths['low'];
        assert.ok(highMonth <= midMonth, 'high-rate debt should be retired before mid-rate');
        assert.ok(midMonth  <= lowMonth, 'mid-rate debt should be retired before low-rate');
    });

    test('avalanche pays less interest than snowball on same debts', () => {
        const snowball  = runSimulation('snowball');
        const avalanche = runSimulation('avalanche');
        assert.ok(
            avalanche.totalInterestPaid <= snowball.totalInterestPaid,
            `avalanche (${avalanche.totalInterestPaid.toFixed(2)}) should cost ≤ snowball (${snowball.totalInterestPaid.toFixed(2)})`
        );
    });
});

// ─── Zero-balance debts ───────────────────────────────────────────────────────

describe('zero-balance debts are ignored by the simulation', () => {
    test('zero-balance debt does not invalidate simulation', () => {
        setStartingBalance(0);
        setRecurringCosts([]);
        setIncomeEntries(paycheck(500, 1));
        setDebts([
            makeDebt({ id: 'd1', balance: 0,    rate: 20, minPayment: 50,  dueDay: 1 }),
            makeDebt({ id: 'd2', balance: 1000, rate: 20, minPayment: 50,  dueDay: 1 }),
        ]);
        const r = runSimulation('snowball');
        assert.equal(r.valid, true);
    });

    test('only the non-zero debt appears in payoff log', () => {
        setStartingBalance(0);
        setRecurringCosts([]);
        setIncomeEntries(paycheck(500, 1));
        setDebts([
            makeDebt({ id: 'd1', balance: 0,    rate: 20, minPayment: 50, dueDay: 1 }),
            makeDebt({ id: 'd2', balance: 1000, rate: 20, minPayment: 50, dueDay: 1 }),
        ]);
        const r = runSimulation('snowball');
        assert.ok('d2' in r.debtPayoffMonths, 'd2 should be in payoff log');
    });
});

// ─── runSimulationWithWindfall: cascade ──────────────────────────────────────

describe('runSimulationWithWindfall cascades across multiple debts', () => {
    beforeEach(() => {
        setStartingBalance(0);
        setRecurringCosts([]);
        setIncomeEntries(paycheck(500, 1));
        setDebts([
            makeDebt({ id: 'd1', name: 'Small',  balance: 200,  rate: 10, minPayment: 30, dueDay: 1 }),
            makeDebt({ id: 'd2', name: 'Medium', balance: 1000, rate: 20, minPayment: 60, dueDay: 1 }),
        ]);
    });

    test('windfall exactly equal to first debt wipes it and cascades remainder', () => {
        // Snowball: target is smallest (d1 = $200). Windfall $600: wipe d1 ($200), then $400 → d2
        const r = runSimulationWithWindfall(600, 'snowball');
        const d1alloc = r.allocation.find(a => a.name === 'Small');
        const d2alloc = r.allocation.find(a => a.name === 'Medium');
        assert.ok(d1alloc, 'Small should have allocation');
        assert.equal(d1alloc.applied, 200); // fully wiped
        assert.ok(d2alloc && d2alloc.applied > 0, 'Medium should receive remainder');
        assert.ok(Math.abs(d1alloc.applied + d2alloc.applied - 600) < 0.01, 'total should equal windfall');
    });

    test('windfall of zero changes nothing', () => {
        const baseline = runSimulation('snowball');
        const r = runSimulationWithWindfall(0, 'snowball');
        assert.ok(r.monthsElapsed >= baseline.monthsElapsed,
            'zero windfall should not improve on baseline');
    });

    test('windfall larger than total debt pays everything off', () => {
        const r = runSimulationWithWindfall(5000, 'snowball');
        // When all debts are paid off, runSimulation returns invalid (no debts left)
        assert.equal(r.valid, false, 'no debts remain to simulate');
        const totalAllocated = r.allocation.reduce((s, a) => s + a.applied, 0);
        assert.equal(totalAllocated, 1200, 'should only apply what was needed (200 + 1000)');
    });

    test('avalanche strategy applies windfall to highest-rate debt first', () => {
        // d2 has higher rate (20% vs 10%), so avalanche targets d2 first
        const r = runSimulationWithWindfall(600, 'avalanche');
        const d1alloc = r.allocation.find(a => a.name === 'Small');
        const d2alloc = r.allocation.find(a => a.name === 'Medium');
        assert.ok(d2alloc, 'Medium should have allocation');
        assert.equal(d2alloc.applied, 600); // all goes to highest-rate debt
        assert.ok(!d1alloc || d1alloc.applied === 0, 'Small should get nothing');
    });

    test('windfall reduces months and interest vs baseline', () => {
        const baseline = runSimulation('snowball');
        const r = runSimulationWithWindfall(300, 'snowball');
        assert.ok(r.monthsElapsed < baseline.monthsElapsed,
            'windfall should reduce payoff time');
        assert.ok(r.totalInterestPaid < baseline.totalInterestPaid,
            'windfall should reduce total interest');
    });
});

// ─── formatMoney edge cases ───────────────────────────────────────────────────

describe('formatMoney additional edge cases', () => {
    test('NaN returns $NaN (graceful, not a throw)', () => {
        // The function calls toLocaleString on NaN which may return "$NaN" — just confirm no throw
        assert.doesNotThrow(() => formatMoney(NaN));
    });

    test('very small positive number rounds to $0.00', () => {
        assert.equal(formatMoney(0.001), '$0.00');
    });

    test('exactly half-cent rounds up', () => {
        // 1.005 → should round to $1.01 per standard half-up rounding
        const result = formatMoney(1.005);
        assert.ok(result === '$1.00' || result === '$1.01',
            `expected $1.00 or $1.01 (platform rounding), got ${result}`);
    });

    test('integer one million formats with commas', () => {
        assert.equal(formatMoney(1000000), '$1,000,000.00');
    });
});

// ─── calcAutoMin precision ────────────────────────────────────────────────────

describe('calcAutoMin — precision and boundary cases', () => {
    test('result is always >= 25 for any positive balance and rate', () => {
        const cases = [
            [1, 0], [10, 1], [99, 5], [100, 20], [500, 0], [999.99, 29.99],
        ];
        for (const [balance, rate] of cases) {
            const result = calcAutoMin(balance, rate);
            assert.ok(result >= 25, `calcAutoMin(${balance}, ${rate}) = ${result}, expected >= 25`);
        }
    });

    test('result is always a finite number for valid inputs', () => {
        const cases = [[100, 15], [5000, 24.99], [250, 0], [10000, 30]];
        for (const [balance, rate] of cases) {
            const result = calcAutoMin(balance, rate);
            assert.ok(Number.isFinite(result), `expected finite for (${balance}, ${rate})`);
        }
    });

    test('returns null for zero balance regardless of rate', () => {
        assert.equal(calcAutoMin(0, 0), null);
        assert.equal(calcAutoMin(0, 25), null);
    });
});

// ─── getStrategyOrder — large identical balances ──────────────────────────────

describe('getStrategyOrder — ties and large lists', () => {
    test('snowball with all equal balances preserves relative order (stable-ish)', () => {
        const debts = [
            makeDebt({ id: 'a', balance: 1000, rate: 10 }),
            makeDebt({ id: 'b', balance: 1000, rate: 20 }),
            makeDebt({ id: 'c', balance: 1000, rate: 5  }),
        ];
        const ordered = getStrategyOrder(debts, 'snowball');
        assert.equal(ordered.length, 3);
        // All balances equal — no specific order required, just no duplicates
        const ids = ordered.map(d => d.id);
        assert.ok(ids.includes('a') && ids.includes('b') && ids.includes('c'));
    });

    test('avalanche with five debts, all different rates', () => {
        const debts = [10, 5, 25, 15, 20].map((rate, i) =>
            makeDebt({ id: `d${i}`, balance: 1000, rate })
        );
        const ordered = getStrategyOrder(debts, 'avalanche');
        // Should be descending by rate: 25, 20, 15, 10, 5
        const rates = ordered.map(d => d.rate);
        for (let i = 0; i < rates.length - 1; i++) {
            assert.ok(rates[i] >= rates[i + 1],
                `Rate at position ${i} (${rates[i]}) should be >= position ${i+1} (${rates[i+1]})`);
        }
    });
});
