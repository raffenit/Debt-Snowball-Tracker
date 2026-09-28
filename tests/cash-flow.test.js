// Month Overview aggregation contract.
// Keeps the headline totals tied to the full cash-flow event stream rather
// than to any one tab or expense source.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { lowestCashFlowBalance, summarizeCashFlowEvents } from '../src/core/cash-flow.js';

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

describe('lowestCashFlowBalance', () => {
    test('uses the lowest running balance from the full month schedule', () => {
        const lowest = lowestCashFlowBalance([
            { type: 'income', balance: 3500 },
            { type: 'recurring', balance: 2300 },
            { type: 'debt', balance: 1850 },
            { type: 'income', balance: 4650 },
        ]);
        assert.equal(lowest, 1850);
    });

    test('does not ignore early-month events that already happened', () => {
        const lowest = lowestCashFlowBalance([
            { type: 'recurring', day: 1, balance: 800 },
            { type: 'debt', day: 8, balance: 620 },
            { type: 'income', day: 19, balance: 3420 },
        ], 2000);
        assert.equal(lowest, 620);
    });

    test('falls back when the schedule has no balances', () => {
        assert.equal(lowestCashFlowBalance([], 2000), 2000);
    });
});
