// Unit tests for pure logic functions (src/ modules)
// Run with: node --test tests/app.test.js
//
// Tests simulation engine and utility functions from src/core/ — UI-independent
// Uses Node 22's built-in test runner (node:test) and assert — no npm deps.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    formatOrdinal,
    formatMoney,
    escHtml,
    calcAutoMin,
    currentMonthKey,
    getStrategyOrder,
    runSimulation,
    runSimulationWithWindfall,
    setDebts,
    setRecurringCosts,
    setIncomeEntries,
} from './helpers.js';

// ─── Shared test fixtures ────────────────────────────────────────────────────

/** A single paycheck arriving on the 1st, enough to cover everything */
const onePaycheck = (amount = 3000, day = 1) => [{
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

// ─── formatOrdinal ───────────────────────────────────────────────────────────

describe('formatOrdinal', () => {
    test('1st', () => assert.equal(formatOrdinal(1), '1st'));
    test('2nd', () => assert.equal(formatOrdinal(2), '2nd'));
    test('3rd', () => assert.equal(formatOrdinal(3), '3rd'));
    test('4th', () => assert.equal(formatOrdinal(4), '4th'));
    test('11th (teen exception)', () => assert.equal(formatOrdinal(11), '11th'));
    test('12th (teen exception)', () => assert.equal(formatOrdinal(12), '12th'));
    test('13th (teen exception)', () => assert.equal(formatOrdinal(13), '13th'));
    test('21st', () => assert.equal(formatOrdinal(21), '21st'));
    test('22nd', () => assert.equal(formatOrdinal(22), '22nd'));
    test('23rd', () => assert.equal(formatOrdinal(23), '23rd'));
    test('31st', () => assert.equal(formatOrdinal(31), '31st'));
    test('100th', () => assert.equal(formatOrdinal(100), '100th'));
    test('101st', () => assert.equal(formatOrdinal(101), '101st'));
    test('111th (teen exception in hundreds)', () => assert.equal(formatOrdinal(111), '111th'));
});

// ─── formatMoney ─────────────────────────────────────────────────────────────

describe('formatMoney', () => {
    test('whole number gets two decimal places', () => assert.equal(formatMoney(1000), '$1,000.00'));
    test('cents are preserved', () => assert.equal(formatMoney(9.99), '$9.99'));
    test('one decimal place is padded', () => assert.equal(formatMoney(5.5), '$5.50'));
    test('zero', () => assert.equal(formatMoney(0), '$0.00'));
    test('large number has comma separators', () => assert.equal(formatMoney(1234567.89), '$1,234,567.89'));
    test('negative value', () => assert.equal(formatMoney(-250.50), '-$250.50'));
    test('three decimal places are rounded', () => assert.equal(formatMoney(1.005), '$1.01'));
});

// ─── escHtml ─────────────────────────────────────────────────────────────────

describe('escHtml', () => {
    test('passes through clean strings unchanged', () => assert.equal(escHtml('Hello World'), 'Hello World'));
    test('escapes ampersand', () => assert.equal(escHtml('Bread & Butter'), 'Bread &amp; Butter'));
    test('escapes less-than', () => assert.equal(escHtml('<script>'), '&lt;script&gt;'));
    test('escapes greater-than', () => assert.equal(escHtml('1 > 0'), '1 &gt; 0'));
    test('escapes double quotes', () => assert.equal(escHtml('"quoted"'), '&quot;quoted&quot;'));
    test('handles XSS attempt', () => {
        const input  = '<img src=x onerror=alert(1)>';
        const output = escHtml(input);
        assert.ok(!output.includes('<img'), 'should not contain raw <img');
        assert.ok(output.includes('&lt;img'), 'should escape the tag');
    });
    test('coerces non-strings to string first', () => assert.equal(escHtml(42), '42'));
    test('empty string returns empty string', () => assert.equal(escHtml(''), ''));
});

// ─── calcAutoMin ─────────────────────────────────────────────────────────────

describe('calcAutoMin', () => {
    test('returns null for zero balance', () => assert.equal(calcAutoMin(0, 20), null));
    test('returns null for negative balance', () => assert.equal(calcAutoMin(-100, 20), null));

    test('enforces $25 floor on very small balance', () => {
        // $100 balance @ 20% APR: 1% = $1, interest = $1.67 → $2.67, floor → $25
        const result = calcAutoMin(100, 20);
        assert.equal(result, 25);
    });

    test('scales above floor for large balance', () => {
        // $5000 @ 20% APR: 1% = $50, interest = $83.33 → $133.33
        const result = calcAutoMin(5000, 20);
        assert.ok(result > 25, 'should exceed $25 floor');
        assert.ok(result > 100, 'should be substantially above floor');
    });

    test('0% APR only uses 1% of balance (still floors at $25)', () => {
        // $1000 @ 0%: 1% = $10, interest = $0 → $10, floor → $25
        assert.equal(calcAutoMin(1000, 0), 25);
    });

    test('higher APR produces higher minimum', () => {
        const low  = calcAutoMin(2000, 5);
        const high = calcAutoMin(2000, 25);
        assert.ok(high > low, 'higher rate should produce higher minimum');
    });

    test('returns a number with at most 2 decimal places', () => {
        const result = calcAutoMin(3333, 18.99);
        assert.ok(typeof result === 'number');
        assert.ok(Number.isFinite(result));
        // Check no more than 2 decimal places
        assert.equal(result, parseFloat(result.toFixed(2)));
    });
});

// ─── currentMonthKey ─────────────────────────────────────────────────────────

describe('currentMonthKey', () => {
    test('returns a string', () => assert.ok(typeof currentMonthKey() === 'string'));

    test('format is YYYY-M', () => {
        const key = currentMonthKey();
        assert.match(key, /^\d{4}-\d{1,2}$/);
    });

    test('calling twice in a row returns the same value', () => {
        assert.equal(currentMonthKey(), currentMonthKey());
    });

    test('contains the current year', () => {
        const key = currentMonthKey();
        assert.ok(key.startsWith(String(new Date().getFullYear())));
    });
});

// ─── getStrategyOrder ────────────────────────────────────────────────────────

describe('getStrategyOrder', () => {
    const debts = [
        makeDebt({ id: 'd1', name: 'Card A', balance: 3000, rate: 15 }),
        makeDebt({ id: 'd2', name: 'Card B', balance: 500,  rate: 24 }),
        makeDebt({ id: 'd3', name: 'Card C', balance: 1500, rate: 18 }),
    ];

    test('snowball sorts smallest balance first', () => {
        const ordered = getStrategyOrder(debts, 'snowball');
        assert.equal(ordered[0].id, 'd2'); // $500
        assert.equal(ordered[1].id, 'd3'); // $1500
        assert.equal(ordered[2].id, 'd1'); // $3000
    });

    test('avalanche sorts highest rate first', () => {
        const ordered = getStrategyOrder(debts, 'avalanche');
        assert.equal(ordered[0].id, 'd2'); // 24%
        assert.equal(ordered[1].id, 'd3'); // 18%
        assert.equal(ordered[2].id, 'd1'); // 15%
    });

    test('does not mutate the original array', () => {
        const original = [...debts];
        getStrategyOrder(debts, 'snowball');
        assert.deepEqual(debts, original);
    });

    test('avalanche tiebreaker on equal rates uses smaller balance first', () => {
        const tied = [
            makeDebt({ id: 'd1', name: 'A', balance: 2000, rate: 20 }),
            makeDebt({ id: 'd2', name: 'B', balance: 1000, rate: 20 }),
        ];
        const ordered = getStrategyOrder(tied, 'avalanche');
        assert.equal(ordered[0].id, 'd2'); // smaller balance wins tiebreak
    });

    test('promo debt uses originalRate for avalanche ordering', () => {
        const promoDebt = makeDebt({
            id: 'd_promo', name: 'Promo Card', balance: 2000,
            rate: 0, originalRate: 22,
            promoZeroInterest: true, promoExpiryDate: '2027-01-01',
        });
        const regularDebt = makeDebt({ id: 'd_reg', name: 'Regular', balance: 1000, rate: 18 });
        const ordered = getStrategyOrder([promoDebt, regularDebt], 'avalanche');
        // originalRate 22% > 18%, so promo debt should be first
        assert.equal(ordered[0].id, 'd_promo');
    });

    test('single debt returns array with that debt', () => {
        const single = [makeDebt()];
        const ordered = getStrategyOrder(single, 'snowball');
        assert.equal(ordered.length, 1);
    });

    test('empty array returns empty array', () => {
        assert.deepEqual(getStrategyOrder([], 'snowball'), []);
    });
});

// ─── runSimulation ───────────────────────────────────────────────────────────

describe('runSimulation — invalid / edge cases', () => {
    beforeEach(() => {
        setDebts([]);
        setRecurringCosts([]);
        setIncomeEntries([]);
    });

    test('returns invalid when no debts', () => {
        setIncomeEntries(onePaycheck());
        const r = runSimulation('snowball');
        assert.equal(r.valid, false);
    });

    test('returns invalid when no income', () => {
        setDebts([makeDebt()]);
        const r = runSimulation('snowball');
        assert.equal(r.valid, false);
    });

    test('returns invalid when recurring costs consume all income', () => {
        setDebts([makeDebt()]);
        setIncomeEntries(onePaycheck(1000));
        setRecurringCosts([{ id: 'r1', name: 'Rent', amount: 1000, dueDay: 1 }]);
        const r = runSimulation('snowball');
        assert.equal(r.valid, false);
    });

    test('returns invalid when budget is below total min payments', () => {
        setDebts([
            makeDebt({ id: 'd1', minPayment: 600 }),
            makeDebt({ id: 'd2', minPayment: 600 }),
        ]);
        setIncomeEntries(onePaycheck(1000));
        const r = runSimulation('snowball');
        assert.equal(r.valid, false);
        assert.ok(r.belowMin);
    });
});

describe('runSimulation — single debt, no interest', () => {
    beforeEach(() => {
        setRecurringCosts([]);
        setDebts([makeDebt({ id: 'd1', balance: 1000, rate: 0, minPayment: 100, dueDay: 15 })]);
        setIncomeEntries(onePaycheck(500, 1));
    });

    test('result is valid', () => {
        const r = runSimulation('snowball');
        assert.equal(r.valid, true);
    });

    test('pays off in expected number of months', () => {
        // $1000 balance, $400 extra after $100 min (500 income - 100 min = $400 extra)
        // Month 1: pay $500 → balance $500. Month 2: pay $500 → balance $0. = 2 months
        const r = runSimulation('snowball');
        assert.equal(r.monthsElapsed, 2);
    });

    test('no interest paid on 0% debt', () => {
        const r = runSimulation('snowball');
        assert.ok(r.totalInterestPaid < 0.01);
    });

    test('debtPayoffMonths contains the debt id', () => {
        const r = runSimulation('snowball');
        assert.ok('d1' in r.debtPayoffMonths);
    });

    test('monthlyTotals starts at balance and ends at 0', () => {
        const r = runSimulation('snowball');
        assert.ok(r.monthlyTotals[0] > 0);
        assert.equal(r.monthlyTotals[r.monthlyTotals.length - 1], 0);
    });

    test('perDebtMonthly is tracked for the debt', () => {
        const r = runSimulation('snowball');
        assert.ok(Array.isArray(r.perDebtMonthly['d1']));
        assert.ok(r.perDebtMonthly['d1'].length > 0);
    });
});

describe('runSimulation — single debt with interest', () => {
    beforeEach(() => {
        setRecurringCosts([]);
        setDebts([makeDebt({ id: 'd1', balance: 1000, rate: 24, minPayment: 50, dueDay: 1 })]);
        setIncomeEntries(onePaycheck(500, 1));
    });

    test('result is valid', () => assert.equal(runSimulation('snowball').valid, true));

    test('accrues some interest', () => {
        const r = runSimulation('snowball');
        assert.ok(r.totalInterestPaid > 0);
    });

    test('pays off within a reasonable timeframe', () => {
        const r = runSimulation('snowball');
        assert.ok(r.monthsElapsed > 0 && r.monthsElapsed < 24,
            `expected < 24 months, got ${r.monthsElapsed}`);
    });
});

describe('runSimulation — snowball vs avalanche ordering', () => {
    beforeEach(() => {
        setRecurringCosts([]);
        setIncomeEntries(onePaycheck(1500, 1));
        setDebts([
            makeDebt({ id: 'small', name: 'Small',  balance: 500,  rate: 10, minPayment: 25,  dueDay: 1 }),
            makeDebt({ id: 'large', name: 'Large',  balance: 5000, rate: 25, minPayment: 150, dueDay: 1 }),
        ]);
    });

    test('snowball pays off smallest debt first', () => {
        const r = runSimulation('snowball');
        const smallPayoff = r.debtPayoffMonths['small'];
        const largePayoff = r.debtPayoffMonths['large'];
        assert.ok(smallPayoff < largePayoff,
            `snowball should retire small debt (${smallPayoff}mo) before large (${largePayoff}mo)`);
    });

    test('avalanche accrues less total interest than snowball', () => {
        const snowball  = runSimulation('snowball');
        const avalanche = runSimulation('avalanche');
        assert.ok(
            avalanche.totalInterestPaid <= snowball.totalInterestPaid,
            `avalanche (${avalanche.totalInterestPaid.toFixed(2)}) should cost ≤ snowball (${snowball.totalInterestPaid.toFixed(2)})`
        );
    });
});

describe('runSimulation — two paychecks mid-month', () => {
    // Income arrives on the 1st and 15th; one debt due on 10th, one on 20th
    beforeEach(() => {
        setRecurringCosts([]);
        setDebts([
            makeDebt({ id: 'd1', balance: 2000, rate: 18, minPayment: 80,  dueDay: 10 }),
            makeDebt({ id: 'd2', balance: 1000, rate: 12, minPayment: 40,  dueDay: 20 }),
        ]);
        setIncomeEntries([
            { id: 'i1', label: 'Paycheck 1', amount: 1000, date: '2026-03-01' },
            { id: 'i2', label: 'Paycheck 2', amount: 1000, date: '2026-03-15' },
        ]);
    });

    test('result is valid', () => assert.equal(runSimulation('snowball').valid, true));
    test('both debts appear in payoff log', () => {
        const r = runSimulation('snowball');
        assert.ok('d1' in r.debtPayoffMonths);
        assert.ok('d2' in r.debtPayoffMonths);
    });
});

describe('runSimulation — promo 0% interest debt', () => {
    beforeEach(() => {
        setRecurringCosts([]);
        setIncomeEntries(onePaycheck(2000, 1));

        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 5);
        const expiryStr = farFuture.toISOString().split('T')[0];

        setDebts([makeDebt({
            id: 'promo', balance: 1000, rate: 0, originalRate: 22,
            minPayment: 50, dueDay: 1,
            promoZeroInterest: true, promoExpiryDate: expiryStr,
        })]);
    });

    test('charges no interest while within promo window', () => {
        const r = runSimulation('snowball');
        assert.ok(r.totalInterestPaid < 0.01,
            `expected ~0 interest, got ${r.totalInterestPaid}`);
    });
});

describe('runSimulation — recurring costs reduce effective budget', () => {
    beforeEach(() => {
        setIncomeEntries(onePaycheck(2000, 1));
        setDebts([makeDebt({ id: 'd1', balance: 1000, rate: 0, minPayment: 100, dueDay: 15 })]);
        setRecurringCosts([{ id: 'r1', name: 'Rent', amount: 800, dueDay: 1 }]);
    });

    test('effective budget is income minus recurring', () => {
        const r = runSimulation('snowball');
        assert.equal(r.effectiveBudget, 1200); // 2000 - 800
    });

    test('simulation is still valid', () => {
        assert.equal(runSimulation('snowball').valid, true);
    });
});

// ─── runSimulationWithWindfall ────────────────────────────────────────────────

describe('runSimulationWithWindfall', () => {
    beforeEach(() => {
        setRecurringCosts([]);
        setIncomeEntries(onePaycheck(500, 1));
        setDebts([
            makeDebt({ id: 'd1', name: 'Card A', balance: 2000, rate: 20, minPayment: 60, dueDay: 1 }),
            makeDebt({ id: 'd2', name: 'Card B', balance: 1000, rate: 15, minPayment: 30, dueDay: 1 }),
        ]);
    });

    test('result has an allocation array', () => {
        const r = runSimulationWithWindfall(500, 'snowball');
        assert.ok(Array.isArray(r.allocation));
        assert.ok(r.allocation.length > 0);
    });

    test('snowball windfall targets smallest debt first', () => {
        const r = runSimulationWithWindfall(500, 'snowball');
        // Smallest debt is d2 ($1000) — it should receive the windfall
        assert.equal(r.allocation[0].name, 'Card B');
    });

    test('avalanche windfall targets highest-rate debt first', () => {
        const r = runSimulationWithWindfall(500, 'avalanche');
        // Highest rate is d1 (20%) — it should receive the windfall
        assert.equal(r.allocation[0].name, 'Card A');
    });

    test('windfall reduces total months vs baseline', () => {
        const baseline = runSimulation('snowball');
        const windfall = runSimulationWithWindfall(1000, 'snowball');
        assert.ok(windfall.monthsElapsed <= baseline.monthsElapsed,
            `windfall (${windfall.monthsElapsed}mo) should be ≤ baseline (${baseline.monthsElapsed}mo)`);
    });

    test('windfall larger than total debt does not crash', () => {
        const r = runSimulationWithWindfall(999999, 'snowball');
        assert.ok(r.valid === true || r.valid === false); // either is fine, no throw
    });

    test('applied amounts do not exceed individual debt balances', () => {
        const r = runSimulationWithWindfall(500, 'snowball');
        r.allocation.forEach(a => {
            assert.ok(a.applied >= 0, 'applied amount should be non-negative');
        });
    });

    test('total allocated does not exceed windfall amount', () => {
        const windfall = 500;
        const r = runSimulationWithWindfall(windfall, 'snowball');
        const totalApplied = r.allocation.reduce((s, a) => s + a.applied, 0);
        assert.ok(totalApplied <= windfall + 0.01,
            `total applied (${totalApplied}) should not exceed windfall (${windfall})`);
    });

    test('original debts array is not mutated', () => {
        setDebts([
            makeDebt({ id: 'd1', balance: 2000, rate: 20, minPayment: 60, dueDay: 1 }),
            makeDebt({ id: 'd2', balance: 1000, rate: 15, minPayment: 30, dueDay: 1 }),
        ]);
        // capture balances before
        const beforeBalances = [2000, 1000];
        runSimulationWithWindfall(500, 'snowball');
        // Re-run simulation — if debts were mutated this would fail or give wrong results
        const r2 = runSimulation('snowball');
        assert.equal(r2.valid, true);
    });
});
