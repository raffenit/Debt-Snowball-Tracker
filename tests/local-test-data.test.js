import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalTestData } from './fixtures/local-test-data.js';
import { sanitizeData, countRepairs } from '../src/core/health.js';
import { checkDataSanity } from '../src/core/sanity.js';
import { syncCardExpenses } from '../src/core/card-expenses.js';
import { currentMonthKey } from '../src/core/date-utils.js';

describe('local test demo data', () => {
    test('uses the current month so load does not auto-rollover', () => {
        const data = buildLocalTestData();
        assert.equal(data.paidMonth, currentMonthKey());
    });

    test('needs no structural repairs', () => {
        const { data, issues } = sanitizeData(buildLocalTestData());
        assert.ok(data);
        assert.equal(countRepairs(issues), 0);
        assert.equal(issues.filter(i => i.severity === 'fatal').length, 0);
    });

    test('has no sanity warnings', () => {
        const data = buildLocalTestData();
        assert.deepEqual(checkDataSanity({ ...data, workingMonthKey: data.paidMonth }), []);
    });

    test('does not send bills to the Card Autopay categorize prompt', () => {
        const data = buildLocalTestData();
        const sync = syncCardExpenses({
            recurringCosts: data.recurringCosts,
            oneTimeCosts: data.oneTimeCosts,
            spendingBudgets: data.spendingBudgets,
            monthKey: data.paidMonth,
            skips: data.cardExpenseSkips,
        });
        assert.deepEqual(sync.newFallbackCosts, []);
    });
});
