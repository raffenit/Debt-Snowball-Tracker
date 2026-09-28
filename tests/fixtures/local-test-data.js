// Demo dataset for test.html local visual testing.
// Intentionally complete and already-routed so load does not open
// health, sanity, or categorize dialogs.

import { keyToHtmlMonth } from '../../src/core/date-utils.js';

function pad(n) {
    return String(n).padStart(2, '0');
}

export function buildLocalTestData(now = new Date()) {
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const htmlMonth = keyToHtmlMonth(monthKey);
    const dateOn = (day) => `${htmlMonth}-${pad(day)}`;

    return {
        paidMonth: monthKey,
        strategy: 'snowball',
        showMortgage: true,
        startingBalance: 2000,
        debts: [
            {
                id: 'debt-visa',
                name: 'Visa',
                type: 'credit-card',
                balance: 1200,
                rate: 19.99,
                minPayment: 35,
                dueDay: 18,
                autoPay: false,
            },
            {
                id: 'debt-car',
                name: 'Car loan',
                type: 'auto-loan',
                balance: 4500,
                rate: 6.5,
                minPayment: 180,
                dueDay: 8,
                autoPay: true,
            },
        ],
        recurringCosts: [
            {
                id: 'bill-rent',
                name: 'Rent',
                amount: 1200,
                dueDay: 1,
                category: 'other',
                paymentMethod: 'direct',
                amountType: 'fixed',
                intervalMonths: 1,
                budgetId: 'budget-housing',
            },
            {
                id: 'bill-netflix',
                name: 'Netflix',
                amount: 15.49,
                dueDay: 12,
                category: 'subscription',
                paymentMethod: 'card',
                amountType: 'fixed',
                intervalMonths: 1,
                budgetId: 'budget-subs',
                cardDebtId: 'debt-visa',
            },
        ],
        oneTimeCosts: [],
        incomeEntries: [
            {
                id: 'inc-paycheck-1',
                label: 'Paycheck',
                amount: 2800,
                date: dateOn(5),
                scheduleType: 'monthly',
                scheduleDay: 5,
            },
            {
                id: 'inc-paycheck-2',
                label: 'Paycheck',
                amount: 2800,
                date: dateOn(19),
                scheduleType: 'monthly',
                scheduleDay: 19,
            },
        ],
        checkpoints: [
            { id: 'cp-day1', day: 1, amount: 2000 },
        ],
        spendingBudgets: [
            { id: 'budget-housing', name: 'Housing', amount: 1200, expenses: [] },
            { id: 'budget-subs', name: 'Subscriptions', amount: 50, expenses: [] },
            {
                id: 'budget-groceries',
                name: 'Groceries',
                amount: 500,
                expenses: [
                    {
                        id: 'exp-groceries',
                        description: 'Grocery store',
                        amount: 86.42,
                        date: dateOn(8),
                        paymentMethod: 'direct',
                    },
                ],
            },
        ],
        monthlyArchives: [],
        cardExpenseSkips: [],
        paidStatus: {},
        minPayOverrides: {},
        expenseDefaults: { paymentMethod: 'direct' },
    };
}
