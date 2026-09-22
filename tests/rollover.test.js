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

    test('tolerates missing state fields (defensive defaults)', () => {
        // Callers pass appState fields, but a hand-rolled or legacy state
        // without the newer fields must not crash.
        const { archive, nextState } = calculateMonthRollover({}, closingMonth, nextMonth);
        assert.deepEqual(archive.spendingBudgets, []);
        assert.deepEqual(nextState.spendingBudgets, []);
        assert.equal(archive.finalBalance, 0);
    });

    // ── Cash-flow semantics in finalBalance (added in the card/expense audit) ──

    test('card-paid costs do NOT reduce the carried-over balance', () => {
        // Card bills are autopaid by the card — they never touch bank cash,
        // so they must not shrink next month's day-1 checkpoint.
        const state = baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            recurringCosts: [
                { id: 'c1', name: 'Rent', amount: 1000, category: 'utility', intervalMonths: 1 },
                { id: 'c2', name: 'Netflix', amount: 20, category: 'subscription', intervalMonths: 1, paymentMethod: 'card' },
            ],
            oneTimeCosts: [
                { id: 'c3', name: 'Gift card purchase', amount: 50, paymentMethod: 'card' },
                { id: 'c4', name: 'DMV fee', amount: 40, paymentMethod: 'direct' },
            ],
            checkpoints: [{ id: 'cp1', day: 1, amount: 500 }],
        });

        const { archive, nextState } = calculateMonthRollover(state, closingMonth, nextMonth);
        // finalBalance = 500 + 3000 − (1000 + 40) = 2460 — card costs excluded
        assert.equal(archive.finalBalance, 2460);
        assert.equal(nextState.checkpoints[0].amount, 2460);
    });

    test('manual budget expenses DO reduce the carried-over balance', () => {
        const state = baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            checkpoints: [{ id: 'cp1', day: 1, amount: 500 }],
            spendingBudgets: [{
                id: 'b1', name: 'Misc', amount: 400,
                expenses: [
                    { id: 'e1', description: 'Zelle purchase', amount: 300, date: '2026-04-10' },
                    { id: 'e2', description: 'Undated', amount: 100 }, // undated counts
                ],
            }],
        });

        const { archive } = calculateMonthRollover(state, closingMonth, nextMonth);
        // finalBalance = 500 + 3000 − (300 + 100) = 3100
        assert.equal(archive.finalBalance, 3100);
    });

    test('autoCard expenses and other-month expenses do NOT reduce finalBalance', () => {
        const state = baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            checkpoints: [{ id: 'cp1', day: 1, amount: 500 }],
            spendingBudgets: [{
                id: 'b1', name: 'Misc', amount: 400,
                expenses: [
                    { id: 'e1', autoCard: true, description: 'Netflix', amount: 20, date: '2026-04-05' },
                    { id: 'e2', description: 'March leftover', amount: 60, date: '2026-03-20' },
                    { id: 'e3', description: 'In-month', amount: 30, date: '2026-04-20' },
                ],
            }],
        });

        const { archive } = calculateMonthRollover(state, closingMonth, nextMonth);
        // Only e3 counts: 500 + 3000 − 30 = 3470
        assert.equal(archive.finalBalance, 3470);
    });

    test('archive captures spendingBudgets with expenses — deep copied', () => {
        const state = baseState({
            spendingBudgets: [{
                id: 'b1', name: 'Groceries', amount: 500,
                expenses: [{ id: 'e1', description: 'Shop', amount: 120, date: '2026-04-10' }],
            }],
        });

        const { archive } = calculateMonthRollover(state, closingMonth, nextMonth);
        assert.equal(archive.spendingBudgets.length, 1);
        assert.equal(archive.spendingBudgets[0].expenses.length, 1);

        // Deep copy: mutating the archive must not touch the source state
        archive.spendingBudgets[0].expenses[0].amount = 999;
        archive.spendingBudgets[0].name = 'Changed';
        assert.equal(state.spendingBudgets[0].expenses[0].amount, 120);
        assert.equal(state.spendingBudgets[0].name, 'Groceries');
    });

    test('archive totalCosts includes manual expenses, excludes card costs', () => {
        const state = baseState({
            recurringCosts: [
                { id: 'c1', name: 'Rent', amount: 1000, category: 'utility', intervalMonths: 1 },
                { id: 'c2', name: 'Netflix', amount: 20, category: 'subscription', intervalMonths: 1, paymentMethod: 'card' },
            ],
            spendingBudgets: [{
                id: 'b1', name: 'Misc', amount: 400,
                expenses: [{ id: 'e1', description: 'Zelle', amount: 50, date: '2026-04-10' }],
            }],
        });

        const { archive } = calculateMonthRollover(state, closingMonth, nextMonth);
        // totalCosts = 1000 + 50 = 1050 (card bill + autoCard excluded)
        assert.equal(archive.totalCosts, 1050);
    });
});

// ─── buildRetroArchive ────────────────────────────────────────────────────────

import { buildRetroArchive } from './helpers.js';

describe('buildRetroArchive', () => {

    test('reconstructs income, cash costs, and totals for a past month', () => {
        const a = buildRetroArchive(baseState({
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 3000, date: '2026-04-15', scheduleType: 'monthly', scheduleDay: 15 }],
            recurringCosts: [
                { id: 'c1', name: 'Rent', amount: 1000, paymentMethod: 'direct' },
                { id: 'c2', name: 'Netflix', amount: 15, paymentMethod: 'card' },
            ],
        }), '2026-7'); // August 2026

        assert.equal(a.month, '2026-7');
        assert.equal(a.label, 'August 2026');
        assert.equal(a.retro, true);
        assert.equal(a.totalIncome, 3000);
        assert.equal(a.incomeEntries[0].date, '2026-08-15');   // projected onto August
        assert.equal(a.totalCosts, 1000);                       // card bill excluded from cash costs
        assert.equal(a.finalBalance, 2000);
    });

    test('card bills are mirrored into budget shells as auto expenses', () => {
        const a = buildRetroArchive(baseState({
            recurringCosts: [{ id: 'c2', name: 'Subs', amount: 15, paymentMethod: 'card', dueDay: 10 }],
            spendingBudgets: [{ id: 'b1', name: 'Subs', amount: 50, expenses: [{ id: 'x', amount: 5 }] }],
        }), '2026-7');

        const shell = a.spendingBudgets.find(b => b.id === 'b1');
        assert.deepEqual(shell.expenses.filter(e => !e.autoCard), []);   // manual expenses cleared
        const auto = shell.expenses.find(e => e.autoCard);
        assert.ok(auto, 'card charge mirrored into the budget');
        assert.equal(auto.amount, 15);
        assert.equal(auto.date, '2026-08-10');
    });

    test('one-time costs/income only land in their own month', () => {
        const a = buildRetroArchive(baseState({
            incomeEntries: [{ id: 'i9', label: 'Bonus', amount: 500, date: '2026-08-03', scheduleType: 'one-time' }],
            oneTimeCosts: [
                { id: 'o1', name: 'Gift', amount: 60, addedMonth: '2026-7', paymentMethod: 'direct' },
                { id: 'o2', name: 'Other month', amount: 40, addedMonth: '2026-6', paymentMethod: 'direct' },
            ],
        }), '2026-7');

        assert.equal(a.totalIncome, 500);
        assert.equal(a.totalCosts, 60);
        assert.deepEqual(a.oneTimeCosts.map(c => c.id), ['o1']);
    });

    test('biweekly income series regenerates the right dates for the month', () => {
        const a = buildRetroArchive(baseState({
            incomeEntries: [{ id: 'i1', label: 'Paycheck', amount: 1500, scheduleType: 'biweekly', scheduleAnchorDate: '2026-09-05' }],
        }), '2026-8'); // September 2026

        // Sep 5 + 19 on a 14-day cycle from the anchor
        assert.deepEqual(a.incomeEntries.map(e => e.date), ['2026-09-05', '2026-09-19']);
        assert.equal(a.totalIncome, 3000);
    });
});
