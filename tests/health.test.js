// Data health — sanitizeData() repairs data crossing a trust boundary
// (stored config, file import, server restore). Tests pin the repair rules,
// the issue metadata the UI discloses, and fatal conditions.

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { sanitizeData, countRepairs, FIELD_SPECS } from '../src/core/health.js';

const severity = (issues, s) => issues.filter(i => i.severity === s);
const issueFor = (issues, field) => issues.find(i => i.field === field);

// A fully-populated, valid payload — zero issues expected.
const VALID = {
    _meta: { savedAt: '2026-09-19T00:00:00Z' },
    paidMonth: '2026-8',
    debts: [{ id: 'd1', balance: 100 }],
    recurringCosts: [{ id: 'c1', amount: 10 }],
    oneTimeCosts: [{ id: 'c2' }],
    incomeEntries: [{ id: 'i1' }],
    checkpoints: [{ id: 'k1' }],
    monthlyArchives: [{ month: '2026-7' }],
    spendingBudgets: [{ id: 'b1', expenses: [] }],
    cardExpenseSkips: ['2026-8:c1'],
    paidStatus: { c1: true },
    minPayOverrides: { d1: 25 },
    expenseDefaults: { paymentMethod: 'card', cardDebtId: 'd1' },
    startingBalance: 500,
    showMortgage: false,
    strategy: 'avalanche',
};

// ─── Fatal ───────────────────────────────────────────────────────────────────
describe('sanitizeData — fatal', () => {
    test('non-objects are fatal', () => {
        for (const bad of [null, undefined, 'x', 42, [1, 2], true]) {
            const { data, issues } = sanitizeData(bad);
            assert.equal(data, null);
            assert.equal(issues[0].severity, 'fatal');
        }
    });

    test('objects with no recognizable fields are fatal', () => {
        const { data, issues } = sanitizeData({ hello: 'world', foo: [1] });
        assert.equal(data, null);
        assert.equal(issues[0].severity, 'fatal');
        assert.match(issues[0].detail, /recognizable/);
    });

    test('empty object is fatal — protects against wiping data with a wrong file', () => {
        assert.equal(sanitizeData({}).data, null);
    });

    test('recognized-key-only payload is usable (empty backup is legitimate)', () => {
        const { data, issues } = sanitizeData({ paidMonth: '2026-8' });
        assert.ok(data);
        assert.equal(data.paidMonth, '2026-8');
        assert.equal(severity(issues, 'fatal').length, 0);
    });
});

// ─── Repairs ─────────────────────────────────────────────────────────────────
describe('sanitizeData — repairs', () => {
    test('wrong-typed fields reset to spec defaults', () => {
        const { data, issues } = sanitizeData({
            debts: 'oops', spendingBudgets: { a: 1 }, paidStatus: [1],
            minPayOverrides: 'x', startingBalance: 'a lot', showMortgage: 'yes',
            strategy: 'bogus',
        });
        assert.deepEqual(data.debts, []);
        assert.deepEqual(data.spendingBudgets, []);
        assert.deepEqual(data.paidStatus, {});
        assert.deepEqual(data.minPayOverrides, {});
        assert.equal(data.startingBalance, 0);
        assert.equal(data.showMortgage, true);
        assert.equal(data.strategy, 'snowball');
        for (const f of ['debts', 'spendingBudgets', 'paidStatus', 'minPayOverrides',
            'startingBalance', 'showMortgage', 'strategy']) {
            const issue = issueFor(issues, f);
            assert.equal(issue.severity, 'repaired', f);
            assert.match(issue.detail, /reset/i);
        }
    });

    test('malformed entries are dropped from record lists, valid kept', () => {
        const { data, issues } = sanitizeData({
            debts: [{ id: 'd1' }, null, 'x', 5, { id: 'd2' }],
        });
        assert.deepEqual(data.debts, [{ id: 'd1' }, { id: 'd2' }]);
        const issue = issueFor(issues, 'debts');
        assert.equal(issue.severity, 'repaired');
        assert.match(issue.detail, /dropped 3 of 5/);
    });

    test('cardExpenseSkips keeps only strings', () => {
        const { data, issues } = sanitizeData({ cardExpenseSkips: ['a:b', 7, null, 'c:d'] });
        assert.deepEqual(data.cardExpenseSkips, ['a:b', 'c:d']);
        assert.equal(issueFor(issues, 'cardExpenseSkips').severity, 'repaired');
    });

    test('non-array list that happens to be an array of wrong type still drops entries', () => {
        const { data } = sanitizeData({ checkpoints: ['x', { id: 'k1' }] });
        assert.deepEqual(data.checkpoints, [{ id: 'k1' }]);
    });

    test('showMortgage: false and strategy: avalanche are preserved', () => {
        const { data } = sanitizeData({ showMortgage: false, strategy: 'avalanche' });
        assert.equal(data.showMortgage, false);
        assert.equal(data.strategy, 'avalanche');
    });
});

// ─── Info ────────────────────────────────────────────────────────────────────
describe('sanitizeData — missing fields', () => {
    test('absent fields default and are reported as info', () => {
        const { data, issues } = sanitizeData({ debts: [{ id: 'd1' }] });
        for (const spec of FIELD_SPECS) {
            if (spec.name === 'debts') continue;
            const issue = issueFor(issues, spec.name);
            assert.equal(issue.severity, 'info', spec.name);
            assert.deepEqual(data[spec.name], spec.default(), spec.name);
        }
        assert.equal(issueFor(issues, 'debts'), undefined); // valid → no issue
    });
});

// ─── Pass-through & idempotence ──────────────────────────────────────────────
describe('sanitizeData — integrity', () => {
    test('a fully valid payload produces zero issues and identical data', () => {
        const { data, issues } = sanitizeData(VALID);
        assert.equal(issues.length, 0);
        assert.equal(data.paidMonth, '2026-8');
        assert.equal(data.showMortgage, false);
        assert.equal(data.strategy, 'avalanche');
        assert.deepEqual(data.debts, VALID.debts);
    });

    test('unknown extra keys pass through (forward compat)', () => {
        const { data } = sanitizeData({ paidMonth: '2026-8', futureField: { x: 1 } });
        assert.deepEqual(data.futureField, { x: 1 });
    });

    test('record entries keep all inner fields (routing data survives)', () => {
        const cost = { id: 'c1', budgetId: 'b9', budgetCategory: 'utility' };
        const { data } = sanitizeData({ recurringCosts: [cost] });
        assert.equal(data.recurringCosts[0].budgetCategory, 'utility');
    });

    test('sanitizing twice is idempotent — no issues on clean data', () => {
        const messy = { debts: 'oops', incomeEntries: [null, { id: 'i' }], strategy: 'x' };
        const once = sanitizeData(messy);
        const twice = sanitizeData(once.data);
        assert.equal(twice.issues.length, 0);
        assert.deepEqual(twice.data.debts, []);
        assert.equal(countRepairs(once.issues) > 0, true);
    });
});
