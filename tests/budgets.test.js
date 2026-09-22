// Budget helpers — archive-aware view selection, monthly limits, and the
// expense→bill conversion consumer.

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { budgetsForView, budgetAmountForMonth, consumeConvertedExpense, reorderBudgets } from '../src/core/budgets.js';

describe('consumeConvertedExpense', () => {
    const budgets = () => [{
        id: 'b1', name: 'Subs',
        expenses: [
            { id: 'e1', description: 'Netflix', amount: 15, date: '2026-09-10' },
            { id: 'e2', description: 'Future thing', amount: 30, date: '2026-12-25' },
            { id: 'e3', description: 'Card buy', amount: 50, date: '2026-09-05', paymentMethod: 'card', cardDebtId: 'd1' },
        ],
    }];

    test('removes the expense from its budget', () => {
        const b = budgets();
        const r = consumeConvertedExpense(b, { budgetId: 'b1', expenseId: 'e1', paymentMethod: 'direct', todayISO: '2026-09-22' });
        assert.equal(r.removed.id, 'e1');
        assert.equal(b[0].expenses.length, 2);
        assert.ok(!b[0].expenses.some(e => e.id === 'e1'));
    });

    test('past-dated cash expense → markPaid (money already left)', () => {
        const r = consumeConvertedExpense(budgets(), { budgetId: 'b1', expenseId: 'e1', paymentMethod: 'direct', todayISO: '2026-09-22' });
        assert.equal(r.markPaid, true);
    });

    test('future-dated cash expense → not paid (hasn\'t happened yet)', () => {
        const r = consumeConvertedExpense(budgets(), { budgetId: 'b1', expenseId: 'e2', paymentMethod: 'direct', todayISO: '2026-09-22' });
        assert.equal(r.markPaid, false);
    });

    test('card expense → never markPaid (the bill\'s card charge replaces it)', () => {
        const r = consumeConvertedExpense(budgets(), { budgetId: 'b1', expenseId: 'e3', paymentMethod: 'card', todayISO: '2026-09-22' });
        assert.equal(r.markPaid, false);
        assert.equal(r.removed.id, 'e3');
    });

    test('undated expense → not marked paid', () => {
        const b = [{ id: 'b1', expenses: [{ id: 'e9', description: 'X', amount: 1 }] }];
        const r = consumeConvertedExpense(b, { budgetId: 'b1', expenseId: 'e9', paymentMethod: 'direct', todayISO: '2026-09-22' });
        assert.equal(r.markPaid, false);
    });

    test('missing budget or expense → null, nothing mutated', () => {
        const b = budgets();
        assert.equal(consumeConvertedExpense(b, { budgetId: 'nope', expenseId: 'e1', paymentMethod: 'direct', todayISO: '2026-09-22' }), null);
        assert.equal(consumeConvertedExpense(b, { budgetId: 'b1', expenseId: 'nope', paymentMethod: 'direct', todayISO: '2026-09-22' }), null);
        assert.equal(b[0].expenses.length, 3);
    });
});

describe('budgetsForView', () => {
    test('archive budgets when present, live otherwise', () => {
        const live = [{ id: 'b1' }];
        const arch = { spendingBudgets: [{ id: 'ba' }] };
        assert.deepEqual(budgetsForView(arch, live), arch.spendingBudgets);
        assert.deepEqual(budgetsForView(null, live), live);
    });

    test('archive without budgets → empty, never live fallback', () => {
        assert.deepEqual(budgetsForView({ month: '2026-7' }, [{ id: 'b1' }]), []);
        assert.deepEqual(budgetsForView(null, undefined), []);
    });
});

describe('budgetAmountForMonth', () => {
    test('exception for the viewed month wins; stale exception ignored', () => {
        const b = { amount: 100, exception: { month: '2026-8', amount: 250 } };
        assert.equal(budgetAmountForMonth(b, '2026-8'), 250);
        assert.equal(budgetAmountForMonth(b, '2026-9'), 100);
    });
});

// ─── reorderBudgets ───────────────────────────────────────────────────────────

test('reorderBudgets: moves a budget to the target position', () => {
    const budgets = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const next = reorderBudgets(budgets, 'a', 'c');
    assert.deepStrictEqual(next.map(b => b.id), ['b', 'c', 'a', 'd']);
});

test('reorderBudgets: moving later item earlier works', () => {
    const budgets = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const next = reorderBudgets(budgets, 'c', 'a');
    assert.deepStrictEqual(next.map(b => b.id), ['c', 'a', 'b']);
});

test('reorderBudgets: does not mutate the input array', () => {
    const budgets = [{ id: 'a' }, { id: 'b' }];
    const next = reorderBudgets(budgets, 'b', 'a');
    assert.deepStrictEqual(budgets.map(b => b.id), ['a', 'b']);   // original untouched
    assert.deepStrictEqual(next.map(b => b.id), ['b', 'a']);
});

test('reorderBudgets: no-ops return the same reference', () => {
    const budgets = [{ id: 'a' }, { id: 'b' }];
    assert.strictEqual(reorderBudgets(budgets, 'a', 'a'), budgets);        // self-drop
    assert.strictEqual(reorderBudgets(budgets, 'x', 'a'), budgets);        // missing drag id
    assert.strictEqual(reorderBudgets(budgets, 'a', 'x'), budgets);        // missing target
    assert.strictEqual(reorderBudgets(budgets, null, 'a'), budgets);       // empty payload
    assert.strictEqual(reorderBudgets([], 'a', 'b').length, 0);            // empty list
});

test('reorderBudgets: preserves each budget object intact (expenses, metadata)', () => {
    const budgets = [
        { id: 'a', name: 'Food', amount: 400, expenses: [{ id: 'e1', amount: 10 }] },
        { id: 'b', name: 'Subs', amount: 50, autoGenerated: true },
        { id: 'c', name: 'Rent', amount: 1500, exception: { month: '2026-09', amount: 1400 } },
    ];
    const next = reorderBudgets(budgets, 'b', 'a');
    assert.deepStrictEqual(next.map(b => b.id), ['b', 'a', 'c']);
    assert.strictEqual(next[0], budgets[1]);   // same object references — no data loss
    assert.strictEqual(next[1], budgets[0]);
});
