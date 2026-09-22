// Tests for backup logic (src/core/backups.js) and archive-aware budget
// helpers (src/core/budgets.js).
//
// Covers the holes found in the backup/month-switching audit:
//   - import replaces rather than merges (missing keys → defaults)
//   - month-scoped data (paid marks, overrides, one-time items, dated
//     expenses) can't leak across months on restore
//   - malformed payloads are rejected before touching state
//   - server backups rotate through 3 slots, overwriting the oldest
//   - archived budgets render instead of the live set — and an archive
//     that predates archived budgets shows empty, never live data
//
// Run with: node --test tests/backups.test.js

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    pickBackupSlot,
    validateBackupData,
    filterBackupFields,
    budgetsForView,
    budgetAmountForMonth,
} from './helpers.js';

const MK = '2026-8'; // September 2026 (zero-based month)

// ─── pickBackupSlot ──────────────────────────────────────────────────────────
describe('pickBackupSlot', () => {
    const paths = ['snowball-backup-1', 'snowball-backup-2', 'snowball-backup-3'];
    const slot = (path, savedAt) => ({ path, cfg: savedAt === null ? null : { _meta: { savedAt } } });

    test('all slots empty → first slot', () => {
        assert.equal(pickBackupSlot(paths.map(p => ({ path: p, cfg: null }))), paths[0]);
    });

    test('first empty slot wins even if it is not the first path', () => {
        const slots = [
            slot(paths[0], '2026-09-01T00:00:00Z'),
            slot(paths[1], null),
            slot(paths[2], '2026-09-02T00:00:00Z'),
        ];
        assert.equal(pickBackupSlot(slots), paths[1]);
    });

    test('all occupied → oldest savedAt is overwritten', () => {
        const slots = [
            slot(paths[0], '2026-09-20T00:00:00Z'),
            slot(paths[1], '2026-09-18T00:00:00Z'), // oldest
            slot(paths[2], '2026-09-19T00:00:00Z'),
        ];
        assert.equal(pickBackupSlot(slots), paths[1]);
    });

    test('missing/unparseable savedAt counts as oldest — safest to overwrite', () => {
        const slots = [
            slot(paths[0], '2026-09-20T00:00:00Z'),
            slot(paths[1], 'not-a-date'),
            slot(paths[2], '2026-09-19T00:00:00Z'),
        ];
        assert.equal(pickBackupSlot(slots), paths[1]);
    });

    test('config without _meta counts as oldest', () => {
        const slots = [
            slot(paths[0], '2026-09-20T00:00:00Z'),
            { path: paths[1], cfg: { debts: [] } }, // no _meta at all
            slot(paths[2], '2026-09-19T00:00:00Z'),
        ];
        assert.equal(pickBackupSlot(slots), paths[1]);
    });

    test('tie on savedAt → earliest slot wins (stable)', () => {
        const slots = [
            slot(paths[0], '2026-09-19T00:00:00Z'),
            slot(paths[1], '2026-09-19T00:00:00Z'),
            slot(paths[2], '2026-09-20T00:00:00Z'),
        ];
        assert.equal(pickBackupSlot(slots), paths[0]);
    });

    test('empty/missing slots list → null, no crash', () => {
        assert.equal(pickBackupSlot([]), null);
        assert.equal(pickBackupSlot(undefined), null);
        assert.equal(pickBackupSlot(null), null);
    });
});

// ─── validateBackupData ──────────────────────────────────────────────────────
// Field-level problems are repairable via sanitizeData() — validateBackupData
// only answers "is this recognizable as our data at all?" (fatal issues).
describe('validateBackupData', () => {
    test('rejects non-objects and unrecognized payloads', () => {
        for (const bad of [null, undefined, 'x', 42, [1, 2, 3], true]) {
            assert.ok(validateBackupData(bad));
        }
        // An empty object has no recognizable fields — rejecting it protects
        // against wiping all data by importing an empty/wrong JSON file.
        assert.ok(validateBackupData({}));
        assert.ok(validateBackupData({ unrelated: true }));
    });

    test('accepts payloads with at least one recognized field', () => {
        assert.equal(validateBackupData({ _meta: { savedAt: 'x' } }), null);
        assert.equal(validateBackupData({ paidMonth: '2026-8' }), null);
        assert.equal(validateBackupData({ debts: [] }), null);
    });

    test('field-level problems are repairable, not fatal', () => {
        // These used to be hard rejections — sanitizeData now repairs them.
        assert.equal(validateBackupData({ debts: 'oops' }), null);
        assert.equal(validateBackupData({ debts: [1, 2, 3] }), null);
        assert.equal(validateBackupData({ spendingBudgets: { a: 1 } }), null);
        assert.equal(validateBackupData({ paidStatus: [1] }), null);
        assert.equal(validateBackupData({ cardExpenseSkips: [1, 2] }), null);
        assert.equal(validateBackupData({ strategy: 'bogus' }), null);
    });
});

// ─── filterBackupFields ──────────────────────────────────────────────────────
describe('filterBackupFields', () => {
    test('empty backup → full defaults (replace, never merge)', () => {
        const f = filterBackupFields({}, MK);
        assert.deepEqual(f.debts, []);
        assert.deepEqual(f.recurringCosts, []);
        assert.deepEqual(f.incomeEntries, []);
        assert.deepEqual(f.checkpoints, []);
        assert.deepEqual(f.spendingBudgets, []);
        assert.deepEqual(f.monthlyArchives, []);
        assert.deepEqual(f.cardExpenseSkips, []);
        assert.deepEqual(f.paidStatus, {});
        assert.deepEqual(f.minPayOverrides, {});
        assert.equal(f.strategy, 'snowball');
        assert.equal(f.startingBalance, 0);
        assert.equal(f.showMortgage, true);
    });

    test('absent keys reset to defaults rather than keeping current values', () => {
        // The merge-vs-replace bug: a backup that only contains debts must
        // still clear everything else.
        const f = filterBackupFields({ debts: [{ id: 'd1' }] }, MK);
        assert.equal(f.debts.length, 1);
        assert.deepEqual(f.recurringCosts, []);
        assert.deepEqual(f.spendingBudgets, []);
    });

    test('invalid strategy falls back to snowball', () => {
        assert.equal(filterBackupFields({ strategy: 'yolo' }, MK).strategy, 'snowball');
        assert.equal(filterBackupFields({ strategy: 'avalanche' }, MK).strategy, 'avalanche');
    });

    test('showMortgage false is preserved, absent defaults to true', () => {
        assert.equal(filterBackupFields({ showMortgage: false }, MK).showMortgage, false);
        assert.equal(filterBackupFields({}, MK).showMortgage, true);
    });

    test('paidStatus/minPayOverrides kept only when paidMonth matches', () => {
        const data = {
            paidMonth: MK,
            paidStatus: { c1: true },
            minPayOverrides: { d1: 30 },
        };
        const kept = filterBackupFields(data, MK);
        assert.deepEqual(kept.paidStatus, { c1: true });
        assert.deepEqual(kept.minPayOverrides, { d1: 30 });
    });

    test('paidStatus/minPayOverrides dropped for a different month', () => {
        const data = {
            paidMonth: '2026-7',
            paidStatus: { c1: true },
            minPayOverrides: { d1: 30 },
        };
        const f = filterBackupFields(data, MK);
        assert.deepEqual(f.paidStatus, {});
        assert.deepEqual(f.minPayOverrides, {});
    });

    test('old backups without paidMonth conservatively drop paid marks', () => {
        const f = filterBackupFields({ paidStatus: { c1: true } }, MK);
        assert.deepEqual(f.paidStatus, {});
    });

    test('one-time costs keep only entries added in the working month', () => {
        const f = filterBackupFields({
            oneTimeCosts: [
                { id: 'a', amount: 10, addedMonth: MK },
                { id: 'b', amount: 20, addedMonth: '2026-7' },
                { id: 'c', amount: 30 }, // no addedMonth → dropped
            ],
        }, MK);
        assert.deepEqual(f.oneTimeCosts.map(c => c.id), ['a']);
    });

    test('one-time income filtered by date prefix; recurring income kept', () => {
        const f = filterBackupFields({
            incomeEntries: [
                { id: 'i1', scheduleType: 'one-time', date: '2026-09-10', amount: 100 },
                { id: 'i2', scheduleType: 'one-time', date: '2026-08-10', amount: 200 },
                { id: 'i3', scheduleType: 'monthly', date: '2026-04-15', amount: 3000 },
                { id: 'i4', scheduleType: 'one-time', amount: 400 }, // no date → dropped
            ],
        }, MK);
        assert.deepEqual(f.incomeEntries.map(e => e.id), ['i1', 'i3']);
    });

    test('budget expenses: keeps autoCard, undated, and same-month; drops other months', () => {
        const f = filterBackupFields({
            spendingBudgets: [{
                id: 'b1', name: 'Misc', amount: 300,
                expenses: [
                    { id: 'e1', autoCard: true, date: '2026-08-05', amount: 10 },
                    { id: 'e2', description: 'no date', amount: 20 },
                    { id: 'e3', date: '2026-09-12', amount: 30 },
                    { id: 'e4', date: '2026-08-31', amount: 40 },
                ],
            }],
        }, MK);
        assert.deepEqual(f.spendingBudgets[0].expenses.map(e => e.id), ['e1', 'e2', 'e3']);
    });

    test('legacy monthlyBudget migrates to a single income entry', () => {
        const f = filterBackupFields({ monthlyBudget: 5000 }, MK);
        assert.equal(f.incomeEntries.length, 1);
        assert.equal(f.incomeEntries[0].amount, 5000);
        assert.match(f.incomeEntries[0].label, /migrated/i);
    });

    test('monthlyBudget ignored when incomeEntries present', () => {
        const f = filterBackupFields({
            monthlyBudget: 5000,
            incomeEntries: [{ id: 'i1', scheduleType: 'monthly', amount: 1 }],
        }, MK);
        assert.equal(f.incomeEntries.length, 1);
        assert.equal(f.incomeEntries[0].id, 'i1');
    });

    test('cost records pass through whole — routing fields survive backup/restore', () => {
        // budgetId/budgetCategory/cardDebtId are set by the bill modal and the
        // categorize prompt; an import must not strip them or routing resets.
        const cost = {
            id: 'c1', name: 'Netflix', amount: 15, paymentMethod: 'card',
            budgetId: 'b9', budgetCategory: 'utility', cardDebtId: 'd2',
        };
        const f = filterBackupFields({ recurringCosts: [cost] }, MK);
        assert.equal(f.recurringCosts[0].budgetId, 'b9');
        assert.equal(f.recurringCosts[0].budgetCategory, 'utility');
        assert.equal(f.recurringCosts[0].cardDebtId, 'd2');
    });

    test('archives pass through intact, including archived budgets', () => {
        const arch = {
            month: '2026-7', label: 'August 2026',
            spendingBudgets: [{ id: 'b1', expenses: [{ id: 'e1', amount: 5 }] }],
            paidStatus: { c1: true },
        };
        const f = filterBackupFields({ monthlyArchives: [arch] }, MK);
        assert.deepEqual(f.monthlyArchives, [arch]);
    });
});

// ─── budgetsForView / budgetAmountForMonth ───────────────────────────────────
describe('budgetsForView', () => {
    const live = [{ id: 'live1' }];

    test('no archive → live budgets', () => {
        assert.deepEqual(budgetsForView(null, live), live);
        assert.deepEqual(budgetsForView(undefined, live), live);
    });

    test('archive with budgets → archive budgets, not live', () => {
        const archive = { month: '2026-7', spendingBudgets: [{ id: 'arch1' }] };
        assert.deepEqual(budgetsForView(archive, live), [{ id: 'arch1' }]);
    });

    test('archive predating archived budgets → empty, NEVER the live set', () => {
        // The trap: falling back to live budgets would show September's
        // budgets while viewing August.
        const archive = { month: '2026-7' };
        assert.deepEqual(budgetsForView(archive, live), []);
    });
});

describe('budgetAmountForMonth', () => {
    const budget = { id: 'b1', amount: 500, exception: { month: '2026-8', amount: 700 } };

    test('exception applies to its own month only', () => {
        assert.equal(budgetAmountForMonth(budget, '2026-8'), 700);
        assert.equal(budgetAmountForMonth(budget, '2026-7'), 500);
        assert.equal(budgetAmountForMonth(budget, '2026-9'), 500);
    });

    test('no exception → base amount', () => {
        assert.equal(budgetAmountForMonth({ id: 'b2', amount: 200 }, '2026-8'), 200);
    });
});
