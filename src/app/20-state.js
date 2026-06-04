  _initApp() {
    // _root is used throughout the app to scope DOM queries to this panel
    const _root = this;
    _root.getElementById = (id) => _root.querySelector(`#${id}`);

    // ─── Data Models ────────────────────────────────────────────────────────────
let debts = [];
let recurringCosts = [];   // Monthly, quarterly, annual costs (NOT one-time)
let oneTimeCosts = [];     // One-time expenses for the current month only
let incomeEntries = [];
let checkpoints = [];
let startingBalance = 0;
let strategy = 'snowball'; // 'snowball' | 'avalanche'
let showMortgage = true;   // toggle mortgage visibility
let paidStatus = {};       // { [id: 'paid' | 'autopay' } — resets each calendar month
let monthlyArchives = [];  // [{ month, label, incomeEntries, recurringCosts, checkpoints, startingBalance, totalIncome, totalCosts }]
let spendingBudgets = [];  // [{ id, name, amount, exception: {month,amount}|null, expenses: [{id,description,amount,date}] }]
let expandedBudgets = new Set(); // UI state: which budget IDs are expanded
let expandedCostSections = new Set(['utility', 'subscription', 'other', 'one-time']); // UI state: expanded cost section keys
let inlineExpenseBudget = null;  // UI state: which budget ID has the inline add-expense form open
let paydownChart = null;
let lastSimPayoffDate = null; // used for countdown ticker
let countdownInterval = null;
let viewingArchiveIndex = null; // null = current month, number = index into monthlyArchives
let workingMonthKey = null;    // the month the data is for — may be ahead of the calendar if user advanced early
let minPayOverrides = {};      // { [debtId]: amount } — this-month-only minimum payment overrides

// ─── DOM Elements ───────────────────────────────────────────────────────────
const debtsListContainer    = _root.getElementById('debts-list');
const costsListContainer    = _root.getElementById('costs-list');
const incomeListContainer   = _root.getElementById('income-list');
const addDebtBtn            = _root.getElementById('add-debt-btn');
const addCostBtn            = _root.getElementById('add-cost-btn');
const addIncomeBtn          = _root.getElementById('add-income-btn');
const debtModal             = _root.getElementById('debt-modal');
const costModal             = _root.getElementById('cost-modal');
const incomeModal           = _root.getElementById('income-modal');
const debtForm              = _root.getElementById('debt-form');
const costForm              = _root.getElementById('cost-form');
const incomeForm            = _root.getElementById('income-form');
const exportBtn             = _root.getElementById('export-btn');
const importFileInput       = _root.getElementById('import-file');
const windfallModal         = _root.getElementById('windfall-modal');
const checkinModal          = _root.getElementById('checkin-modal');
const budgetModal           = _root.getElementById('budget-modal');
const budgetForm            = _root.getElementById('budget-form');
const expenseModal          = _root.getElementById('expense-modal');
const expenseForm           = _root.getElementById('expense-form');
const checkpointModal       = _root.getElementById('checkpoint-modal');
const checkpointForm        = _root.getElementById('checkpoint-form');
