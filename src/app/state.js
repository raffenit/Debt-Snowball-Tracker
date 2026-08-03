/**
 * Shared application state module.
 *
 * All mutable state lives here. Browser app modules import this object
 * instead of using closure globals. This makes data flow explicit and
 * enables testing of individual modules in isolation.
 */

export const appState = {
    // ─── Data Models ──────────────────────────────────────────────────────────
    debts: [],
    recurringCosts: [],   // Monthly, quarterly, annual costs (NOT one-time)
    oneTimeCosts: [],     // One-time expenses for the current month only
    incomeEntries: [],
    checkpoints: [],
    startingBalance: 0,
    strategy: 'snowball', // 'snowball' | 'avalanche'
    showMortgage: true,   // toggle mortgage visibility
    paidStatus: {},       // { [id]: 'paid' | 'autopay' } — resets each calendar month
    monthlyArchives: [],  // [{ month, label, incomeEntries, recurringCosts, checkpoints, startingBalance, totalIncome, totalCosts }]
    spendingBudgets: [],  // [{ id, name, amount, exception, expenses: [] }]
    expandedBudgets: new Set(), // UI state: which budget IDs are expanded
    expandedCostSections: new Set(['utility', 'subscription', 'maintenance', 'other', 'one-time']), // UI state
    inlineExpenseBudget: null,  // UI state: which budget ID has inline add-expense form open
    paydownChart: null,
    lastSimPayoffDate: null, // used for countdown ticker
    countdownInterval: null,
    viewingArchiveIndex: null, // null = current month, number = index into monthlyArchives
    workingMonthKey: null,    // the month the data is for
    minPayOverrides: {},      // { [debtId]: amount } — this-month-only overrides

    // ─── Root Element (set during init) ───────────────────────────────────────
    _root: null,

    // ─── DOM Elements (populated during init) ───────────────────────────────
    debtsListContainer: null,
    costsListContainer: null,
    incomeListContainer: null,
    addDebtBtn: null,
    addCostBtn: null,
    addIncomeBtn: null,
    debtModal: null,
    costModal: null,
    incomeModal: null,
    debtForm: null,
    costForm: null,
    incomeForm: null,
    exportBtn: null,
    importFileInput: null,
    windfallModal: null,
    checkinModal: null,
    budgetModal: null,
    budgetForm: null,
    expenseModal: null,
    expenseForm: null,
    checkpointModal: null,
    checkpointForm: null,
};

/**
 * Initialize DOM references from the root custom element.
 * Called once during _initApp().
 */
export function initDomRefs(root) {
    appState._root = root;
    root.getElementById = (id) => root.querySelector(`#${id}`);

    appState.debtsListContainer    = root.getElementById('debts-list');
    appState.costsListContainer    = root.getElementById('costs-list');
    appState.incomeListContainer   = root.getElementById('income-list');
    appState.addDebtBtn            = root.getElementById('add-debt-btn');
    appState.addCostBtn            = root.getElementById('add-cost-btn');
    appState.addIncomeBtn          = root.getElementById('add-income-btn');
    appState.debtModal             = root.getElementById('debt-modal');
    appState.costModal             = root.getElementById('cost-modal');
    appState.incomeModal           = root.getElementById('income-modal');
    appState.debtForm              = root.getElementById('debt-form');
    appState.costForm              = root.getElementById('cost-form');
    appState.incomeForm            = root.getElementById('income-form');
    appState.exportBtn             = root.getElementById('export-btn');
    appState.importFileInput       = root.getElementById('import-file');
    appState.windfallModal         = root.getElementById('windfall-modal');
    appState.checkinModal          = root.getElementById('checkin-modal');
    appState.budgetModal           = root.getElementById('budget-modal');
    appState.budgetForm            = root.getElementById('budget-form');
    appState.expenseModal          = root.getElementById('expense-modal');
    appState.expenseForm           = root.getElementById('expense-form');
    appState.checkpointModal       = root.getElementById('checkpoint-modal');
    appState.checkpointForm        = root.getElementById('checkpoint-form');
}
