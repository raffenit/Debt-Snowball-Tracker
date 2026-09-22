// Sanity checks — advisory anomaly detection. These tests pin the detectors
// to the actual bug signatures we've hit (duplicated biweekly income above
// all) and confirm clean states produce zero noise.

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { checkDataSanity } from '../src/core/sanity.js';
import { calculateMonthRollover } from '../src/core/rollover.js';

const base = (over = {}) => ({
    debts: [], recurringCosts: [], oneTimeCosts: [], incomeEntries: [],
    spendingBudgets: [], paidStatus: {}, cardExpenseSkips: [],
    monthlyArchives: [], checkpoints: [], startingBalance: 0,
    workingMonthKey: '2026-8', ...over,
});

const ids = ws => ws.map(x => x.id);

// ─── Clean states are quiet ──────────────────────────────────────────────────
describe('checkDataSanity — clean states', () => {
    test('empty state → no warnings', () => {
        assert.deepEqual(checkDataSanity(base()), []);
    });

    test('typical populated state → no warnings', () => {
        const s = checkDataSanity(base({
            incomeEntries: [
                { id: 'i1', label: 'Paycheck', amount: 2500, date: '2026-09-05', scheduleType: 'biweekly', seriesId: 'a|Paycheck|2500' },
                { id: 'i2', label: 'Paycheck', amount: 2500, date: '2026-09-19', scheduleType: 'biweekly', seriesId: 'a|Paycheck|2500' },
            ],
            recurringCosts: [{ id: 'c1', name: 'Rent', amount: 1500, dueDay: 1 }],
            debts: [{ id: 'd1', name: 'Visa', balance: 3000, apr: 24 }],
            paidStatus: { c1: true, d1: { status: 'paid' } },
        }));
        assert.deepEqual(s, []);
    });

    test('rollover output state → no warnings (regression: rollover must not create anomalies)', () => {
        const state = {
            debts: [{ id: 'd1', name: 'Visa', balance: 3000, apr: 24, minPay: 50 }],
            recurringCosts: [{ id: 'c1', name: 'Rent', amount: 1500, dueDay: 1 }],
            oneTimeCosts: [{ id: 'c2', name: 'Gift', amount: 50, addedMonth: '2026-8' }],
            incomeEntries: [{ id: 'i1', label: 'Salary', amount: 4000, scheduleType: 'monthly', scheduleDay: 1 }],
            checkpoints: [], startingBalance: 1000, paidStatus: {}, spendingBudgets: [],
        };
        const { nextState } = calculateMonthRollover(state, '2026-8', '2026-9');
        assert.deepEqual(checkDataSanity(base({ ...nextState, workingMonthKey: '2026-9' })), []);
    });
});

// ─── Duplicates ──────────────────────────────────────────────────────────────
describe('checkDataSanity — duplicates', () => {
    test('identical income rows flag (the biweekly bug signature)', () => {
        const row = { id: 'i1', label: 'Paycheck', amount: 2500, date: '2026-09-05', scheduleType: 'biweekly', seriesId: 'a|x|2500' };
        const ws = checkDataSanity(base({ incomeEntries: [row, { ...row, id: 'i2' }, { ...row, id: 'i3' }] }));
        const dup = ws.find(x => x.id.startsWith('dup-income-'));
        assert.ok(dup);
        assert.equal(dup.severity, 'warning');
        assert.match(dup.detail, /3 identical income entries/);
    });

    test('same paycheck on different dates is fine', () => {
        const s = base({ incomeEntries: [
            { id: 'i1', label: 'Paycheck', amount: 2500, date: '2026-09-05' },
            { id: 'i2', label: 'Paycheck', amount: 2500, date: '2026-09-19' },
        ]});
        assert.deepEqual(checkDataSanity(s), []);
    });

    test('duplicate ids in any list flag', () => {
        const ws = checkDataSanity(base({
            recurringCosts: [{ id: 'c1', name: 'A', amount: 1 }, { id: 'c1', name: 'B', amount: 2 }],
        }));
        assert.ok(ids(ws).includes('dup-ids-recurringCosts'));
    });

    test('duplicate bills flag', () => {
        const ws = checkDataSanity(base({
            recurringCosts: [
                { id: 'c1', name: 'Netflix', amount: 15, dueDay: 10 },
                { id: 'c2', name: 'Netflix', amount: 15, dueDay: 10 },
            ],
        }));
        assert.ok(ids(ws).some(i => i.startsWith('dup-cost-')));
    });

    test('duplicate manual budget expenses flag; autoCard mirrors are exempt', () => {
        const ws = checkDataSanity(base({ spendingBudgets: [
            { id: 'b1', name: 'Groceries', expenses: [
                { id: 'e1', description: 'Milk', amount: 5, date: '2026-09-02' },
                { id: 'e2', description: 'Milk', amount: 5, date: '2026-09-02' },
            ]},
            { id: 'b2', name: 'Subs', expenses: [
                { id: 'e3', description: 'Netflix', amount: 15, date: '2026-09-10', autoCard: true },
                { id: 'e4', description: 'Netflix', amount: 15, date: '2026-09-10', autoCard: true },
            ]},
        ]}));
        const dups = ids(ws).filter(i => i.startsWith('dup-exp-'));
        assert.equal(dups.length, 1);
        assert.match(dups[0], /b1/);
    });
});

// ─── Amounts ─────────────────────────────────────────────────────────────────
describe('checkDataSanity — amounts', () => {
    test('negative amounts and balances flag', () => {
        const ws = checkDataSanity(base({
            recurringCosts: [{ id: 'c1', name: 'Refund', amount: -50 }],
            debts: [{ id: 'd1', name: 'Card', balance: -100 }],
        }));
        assert.ok(ids(ws).includes('neg-recurringCosts'));
        assert.ok(ids(ws).includes('neg-debt-d1'));
    });

    test('unusual APR flags both directions', () => {
        const ws = checkDataSanity(base({
            debts: [
                { id: 'd1', name: 'A', balance: 10, apr: 99 },
                { id: 'd2', name: 'B', balance: 10, apr: -5 },
                { id: 'd3', name: 'C', balance: 10, apr: 24 },
            ],
        }));
        assert.ok(ids(ws).includes('apr-d1'));
        assert.ok(ids(ws).includes('apr-d2'));
        assert.ok(!ids(ws).includes('apr-d3'));
    });
});

// ─── Dangling references ─────────────────────────────────────────────────────
describe('checkDataSanity — dangling references', () => {
    test('paid marks for deleted bills flag', () => {
        const ws = checkDataSanity(base({
            recurringCosts: [{ id: 'c1', name: 'Rent', amount: 1 }],
            paidStatus: { c1: true, ghost: true },
        }));
        const w = ws.find(x => x.id === 'dangling-paid');
        assert.ok(w);
        assert.match(w.detail, /1 paid mark/);
    });

    test('paid marks on debts count as valid references', () => {
        const ws = checkDataSanity(base({
            debts: [{ id: 'd1', name: 'Visa', balance: 100 }],
            paidStatus: { d1: { status: 'paid' } },
        }));
        assert.equal(ids(ws).includes('dangling-paid'), false);
    });

    test('skips for deleted costs flag', () => {
        const ws = checkDataSanity(base({ cardExpenseSkips: ['2026-8:gone'] }));
        assert.ok(ids(ws).includes('dangling-skips'));
    });

    test('expenses linked to a deleted card flag', () => {
        const ws = checkDataSanity(base({
            debts: [{ id: 'd1', name: 'Visa', balance: 100 }],
            spendingBudgets: [{ id: 'b1', name: 'Fun', expenses: [
                { id: 'e1', description: 'Concert', amount: 60, paymentMethod: 'card', cardDebtId: 'd1' },
                { id: 'e2', description: 'Ghost card', amount: 20, paymentMethod: 'card', cardDebtId: 'd9' },
            ]}],
        }));
        const w = ws.find(x => x.id === 'dangling-carddebt');
        assert.ok(w);
        assert.match(w.detail, /1 expense/);
    });
});

// ─── Month consistency ───────────────────────────────────────────────────────
describe('checkDataSanity — month consistency', () => {
    test('manual expenses dated outside the working month flag', () => {
        const ws = checkDataSanity(base({
            spendingBudgets: [{ id: 'b1', name: 'Food', expenses: [
                { id: 'e1', description: 'Lunch', amount: 10, date: '2026-08-15' }, // wrong month
                { id: 'e2', description: 'Dinner', amount: 20, date: '2026-09-05' }, // in-month
            ]}],
        }));
        const w = ws.find(x => x.id === 'stray-expenses');
        assert.ok(w);
        assert.match(w.detail, /1 manual expense/);
    });
});

// ─── Month-over-month drift ──────────────────────────────────────────────────
describe('checkDataSanity — month-over-month', () => {
    const archive = {
        month: '2026-7', totalIncome: 4000, totalCosts: 2000,
        incomeEntries: [{ id: 'i1' }, { id: 'i2' }],
        recurringCosts: [{ id: 'c1' }, { id: 'c2' }],
    };

    test('entry-count explosion flags', () => {
        const ws = checkDataSanity(base({
            monthlyArchives: [archive],
            incomeEntries: Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, amount: 10 })),
        }));
        assert.ok(ids(ws).includes('count-incomeEntries'));
    });

    test('income total >2.5× archive flags', () => {
        const ws = checkDataSanity(base({
            monthlyArchives: [archive],
            incomeEntries: [{ id: 'i1', amount: 12000 }],
        }));
        assert.ok(ids(ws).includes('income-jump'));
    });

    test('income total <40% of archive gives a notice', () => {
        const ws = checkDataSanity(base({
            monthlyArchives: [archive],
            incomeEntries: [{ id: 'i1', amount: 1000 }],
        }));
        const w = ws.find(x => x.id === 'income-drop');
        assert.ok(w);
        assert.equal(w.severity, 'notice');
    });

    test('cost total >2.5× archive flags', () => {
        const ws = checkDataSanity(base({
            monthlyArchives: [archive],
            recurringCosts: [{ id: 'c1', amount: 6000 }],
        }));
        assert.ok(ids(ws).includes('cost-jump'));
    });

    test('repeated manual expense across months → convert suggestion', () => {
        const ws = checkDataSanity(base({
            monthlyArchives: [{
                month: '2026-7', totalIncome: 4000, totalCosts: 2000,
                incomeEntries: [{ id: 'i1' }, { id: 'i2' }],
                recurringCosts: [{ id: 'c1' }, { id: 'c2' }],
                spendingBudgets: [{ id: 'b1', name: 'Subs', expenses: [
                    { id: 'e0', description: 'Netflix', amount: 15, date: '2026-08-10' },
                ]}],
            }],
            spendingBudgets: [{ id: 'b1', name: 'Subs', expenses: [
                { id: 'e1', description: 'Netflix', amount: 15, date: '2026-09-10' },
                { id: 'e2', description: 'One-off', amount: 33, date: '2026-09-11' },
                { id: 'e3', description: 'Netflix', amount: 15, date: '2026-09-10', autoCard: true }, // mirrors don't count
            ]}],
        }));
        const w = ws.find(x => x.id === 'repeat-expenses');
        assert.ok(w);
        assert.equal(w.severity, 'notice');
        assert.match(w.detail, /1 expense/);
        assert.match(w.detail, /Netflix/);
    });

    test('no archive → no drift checks (fresh install is quiet)', () => {
        const ws = checkDataSanity(base({ incomeEntries: [{ id: 'i1', amount: 99999 }] }));
        assert.ok(!ids(ws).includes('income-jump'));
    });
});

// ─── Coverage ────────────────────────────────────────────────────────────────
describe('checkDataSanity — coverage', () => {
    test('obligations with no income → notice', () => {
        const ws = checkDataSanity(base({ recurringCosts: [{ id: 'c1', amount: 10 }] }));
        assert.ok(ids(ws).includes('no-income'));
    });
});

    test('bill linked to a card but marked direct → warning', () => {
        const ws = checkDataSanity(base({
            debts: [{ id: 'd1', name: 'Visa', balance: 500 }],
            recurringCosts: [{ id: 'c1', name: 'Netflix', amount: 15, paymentMethod: 'direct', cardDebtId: 'd1' }],
        }));
        assert.ok(ids(ws).includes('card-method-mismatch'));
    });

    test('card bill with no linked card → no warning (legit unlinked)', () => {
        const ws = checkDataSanity(base({
            recurringCosts: [{ id: 'c1', name: 'Netflix', amount: 15, paymentMethod: 'card' }],
        }));
        assert.ok(!ids(ws).includes('card-method-mismatch'));
    });

describe('checkDataSanity — drift baseline', () => {
    test('retro (reconstructed) archives are skipped as drift baselines', () => {
        const retro = { month: '2026-7', retro: true, totalIncome: 100, totalCosts: 50,
            incomeEntries: [{ id: 'r1' }], recurringCosts: [] };
        const ws = checkDataSanity(base({
            monthlyArchives: [retro],
            incomeEntries: [{ id: 'i1', amount: 5000 }],
            recurringCosts: [{ id: 'c1', amount: 4800 }],
        }));
        assert.ok(!ids(ws).some(id => id.includes('jump') || id.includes('count-')),
            'reconstructed month should not trigger drift warnings');
    });

    test('a real archive after a retro one is still used as baseline', () => {
        const retro = { month: '2026-7', retro: true, totalIncome: 100, totalCosts: 50,
            incomeEntries: [], recurringCosts: [] };
        const real = { month: '2026-6', totalIncome: 4000, totalCosts: 2000,
            incomeEntries: [{ id: 'a1' }, { id: 'a2' }], recurringCosts: [{ id: 'r1' }, { id: 'r2' }] };
        const ws = checkDataSanity(base({
            monthlyArchives: [retro, real],
            incomeEntries: [{ id: 'i1', amount: 12000 }],
        }));
        assert.ok(ids(ws).includes('income-jump'));
    });
});
