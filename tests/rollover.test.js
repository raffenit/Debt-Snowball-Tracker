// Tests for month rollover logic (calculateMonthRollover)
// Covers both manual "Next Month" advance and automatic calendar rollover.
//
// Run with: node --test tests/rollover.test.js

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthRollover } from './helpers.js';

const closingMonth = '2026-3'; // April 2026
const nextMonth    = '2026-4'; // May 2026

function baseState(overrides = {}) {
    return {
        debts: [],
        recurringCosts: [],
        incomeEntries: [],
        checkpoints: [],
        startingBalance: 0,
        paidStatus: {},
        spendingBudgets: [],
        ...overrides,
    };
}

describe('calculateMonthRollover', () => {

    test('archive contains snapshot of current state', () => {
        const state = baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            recurringCosts: [{ id: 'c1', name: 'Rent', amount: 1000, category: 'utility', intervalMonths: 1 }],
            checkpoints: [{ id: 'cp1', day: 1, amount: 500 }],
            debts: [{ id: 'd1', name: 'Card', balance: 5000, rate: 18, minPayment: 150 }],
            startingBalance: 100,
            paidStatus: { c1: true },
        });

        const { archive } = calculateMonthRollover(state, closingMonth, nextMonth);

        assert.equal(archive.month, closingMonth);
        assert.equal(archive.label, 'April 2026');
        assert.equal(archive.incomeEntries.length, 1);
        assert.equal(archive.recurringCosts.length, 1);
        assert.equal(archive.checkpoints.length, 1);
        assert.equal(archive.debts.length, 1);
        assert.equal(archive.startingBalance, 100);
        assert.equal(archive.paidStatus.c1, true);
        assert.equal(archive.totalIncome, 3000);
        assert.equal(archive.totalCosts, 1000);
        // finalBalance = 500 + 3000 - 1000 = 2500
        assert.equal(archive.finalBalance, 2500);
    });

    test('final balance includes one-time costs', () => {
        const state = baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            recurringCosts: [
                { id: 'c1', name: 'Rent', amount: 1000, category: 'utility', intervalMonths: 1 },
            ],
            oneTimeCosts: [
                { id: 'c2', name: 'Gift', amount: 200 },
            ],
            checkpoints: [{ id: 'cp1', day: 1, amount: 500 }],
        });

        const { archive } = calculateMonthRollover(state, closingMonth, nextMonth);
        // finalBalance = 500 + 3000 - (1000 + 200) = 2300
        assert.equal(archive.finalBalance, 2300);
    });

    test('one-time costs are pruned from next state', () => {
        const state = baseState({
            recurringCosts: [
                { id: 'c1', name: 'Rent', amount: 1000, category: 'utility', intervalMonths: 1 },
            ],
            oneTimeCosts: [
                { id: 'c2', name: 'Gift', amount: 200 },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.recurringCosts.length, 1);
        assert.equal(nextState.recurringCosts[0].id, 'c1');
    });

    test('interval costs advance nextDueMonth past closing month', () => {
        const state = baseState({
            recurringCosts: [
                { id: 'c1', name: 'Insurance', amount: 300, category: 'other', intervalMonths: 3, nextDueMonth: closingMonth },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.recurringCosts.length, 1);
        assert.equal(nextState.recurringCosts[0].nextDueMonth, '2026-6'); // July
    });

    test('interval costs without nextDueMonth default to closing month then advance', () => {
        const state = baseState({
            recurringCosts: [
                { id: 'c1', name: 'HOA', amount: 150, category: 'other', intervalMonths: 6 },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.recurringCosts[0].nextDueMonth, '2026-9'); // October
    });

    test('monthly costs (interval 1) keep their nextDueMonth unchanged', () => {
        const state = baseState({
            recurringCosts: [
                { id: 'c1', name: 'Rent', amount: 1000, category: 'utility', intervalMonths: 1, nextDueMonth: '2026-5' },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.recurringCosts[0].nextDueMonth, '2026-5');
    });

    test('income entries are regenerated for next month', () => {
        const state = baseState({
            incomeEntries: [
                { id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.incomeEntries.length, 1);
        assert.equal(nextState.incomeEntries[0].date, '2026-05-15');
    });

    test('checkpoints cleared and day-1 checkpoint created with final balance', () => {
        const state = baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            checkpoints: [
                { id: 'cp1', day: 1, amount: 500 },
                { id: 'cp2', day: 15, amount: 2000 },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.checkpoints.length, 1);
        assert.equal(nextState.checkpoints[0].day, 1);
        // finalBalance = 500 + 3000 - 0 = 3500
        assert.equal(nextState.checkpoints[0].amount, 3500);
        assert.ok(nextState.checkpoints[0].id.startsWith('cp_'));
    });

    test('zero or negative final balance produces no checkpoint', () => {
        const state = baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 1000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            recurringCosts: [{ id: 'c1', name: 'Rent', amount: 2000, category: 'utility', intervalMonths: 1 }],
            checkpoints: [{ id: 'cp1', day: 1, amount: 500 }],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.checkpoints.length, 0);
    });

    test('paidStatus and minPayOverrides are reset', () => {
        const state = baseState({
            paidStatus: { c1: true },
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.deepEqual(nextState.paidStatus, {});
        assert.deepEqual(nextState.minPayOverrides, {});
    });

    test('budget expenses are cleared', () => {
        const state = baseState({
            spendingBudgets: [
                { id: 'b1', label: 'Groceries', amount: 500, expenses: [{ id: 'e1', label: 'Shop', amount: 120 }] },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.spendingBudgets[0].expenses.length, 0);
    });

    test('budget exceptions for closing month are removed', () => {
        const state = baseState({
            spendingBudgets: [
                { id: 'b1', label: 'Groceries', amount: 500, exception: { month: closingMonth, amount: 600 } },
                { id: 'b2', label: 'Fun', amount: 200, exception: { month: '2026-2', amount: 300 } },
            ],
        });

        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.spendingBudgets[0].exception, null);
        assert.deepEqual(nextState.spendingBudgets[1].exception, { month: '2026-2', amount: 300 });
    });

    test('no checkpoint when no day-1 checkpoint and no income', () => {
        const state = baseState();
        const { nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(nextState.checkpoints.length, 0);
    });
});
