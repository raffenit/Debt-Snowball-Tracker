// Month Overview aggregation contract.
// Keeps the headline totals tied to the full cash-flow event stream rather
// than to any one tab or expense source.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCashFlowEvents } from '../src/core/cash-flow.js';

describe('summarizeCashFlowEvents', () => {
    test('includes every cash outflow source, including overridden debt payments', () => {
        const totals = summarizeCashFlowEvents([
            { type: 'income', amount: 4200 },
            { type: 'recurring', amount: 1200 },
            { type: 'one-time', amount: 175 },
            { type: 'expense', amount: 80 },
            { type: 'debt', amount: 950, hasOverride: true },
        ]);

        assert.deepEqual(totals, {
            income: 4200,
            expenditures: 2405,
        });
    });

    test('includes a pay-in-full debt event even when its remaining balance is zero', () => {
        const totals = summarizeCashFlowEvents([
            { type: 'income', amount: 2000 },
            { type: 'debt', amount: 1375, balance: 0, hasOverride: true },
        ]);

        assert.equal(totals.expenditures, 1375);
    });

    test('does not count balance checkpoints as income or expenditures', () => {
        const totals = summarizeCashFlowEvents([
            { type: 'checkpoint', amount: 850 },
            { type: 'income', amount: 500 },
            { type: 'debt', amount: 100 },
        ]);

        assert.deepEqual(totals, {
            income: 500,
            expenditures: 100,
        });
    });
});
