import { appState } from './state.js';
import { currentMonthKey } from '../core/date-utils.js';
import { escHtml, formatMoney } from '../core/pure-utils.js';
import { showErrorToast, showSavedToast, showUndoToast } from './render-modals.js';
import { saveData, saveDataAndRender } from './storage.js';

// ─── Spending Budgets ────────────────────────────────────────────────────────
// Focused module for budget list rendering, budget/expense modals, and CRUD.
// Extracted from render-modals.js.

function getBudgetAmount(budget) {
    const exc = budget.exception;
    if (exc && exc.month === (appState.workingMonthKey || currentMonthKey())) return exc.amount;
    return budget.amount;
}

function renderSpendingBudgets() {
    const container = appState._root.getElementById('budgets-list');
    if (!container) return;

    if (appState.spendingBudgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No spending budgets yet.<br>Track discretionary spending by setting a spending limit for each category.
                <br><button class="empty-cta-btn" id="empty-add-budget-btn">+ Add Your First Budget</button>
            </div>`;
        const emptyBtn = container.querySelector('#empty-add-budget-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openBudgetModal());
        return;
    }

    // Budget meta bar — current month + totals across all budgets
    const now = new Date();
    const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const totalBudgeted = appState.spendingBudgets.reduce((s, b) => s + getBudgetAmount(b), 0);
    const totalSpent    = appState.spendingBudgets.reduce((s, b) => s + (b.expenses || []).reduce((x, e) => x + e.amount, 0), 0);
    const totalOver     = totalSpent - totalBudgeted;
    const metaSpentClass = totalOver > 0 ? 'budget-meta-over' : 'budget-meta-ok';

    const metaBar = `
        <div class="budget-meta-bar">
            <span class="budget-meta-month">📅 ${monthName}</span>
            <div class="budget-meta-divider"></div>
            <span class="budget-meta-budgeted">${appState.spendingBudgets.length} budget${appState.spendingBudgets.length !== 1 ? 's' : ''} · ${formatMoney(totalBudgeted)} total limit</span>
            <span class="budget-meta-total">
                <span class="budget-meta-budgeted">Spent:</span>
                <span class="${metaSpentClass}">${formatMoney(totalSpent)}</span>
                ${totalOver > 0
                    ? `<span class="budget-meta-over" style="font-size:0.75rem;">⚠ ${formatMoney(totalOver)} over</span>`
                    : `<span class="budget-meta-ok" style="font-size:0.75rem;">${formatMoney(totalBudgeted - totalSpent)} left</span>`}
            </span>
        </div>`;

    const cards = appState.spendingBudgets.map((budget, cardIdx) => {
        const budgetAmt  = getBudgetAmount(budget);
        const expenses   = budget.expenses || [];
        const spent      = expenses.reduce((s, e) => s + e.amount, 0);
        const over       = spent - budgetAmt;
        const isOver     = over > 0;
        const rawPct     = budgetAmt > 0 ? (spent / budgetAmt) * 100 : (spent > 0 ? 100 : 0);
        const barPct     = Math.min(rawPct, 100);
        const isExpanded = appState.expandedBudgets.has(budget.id);
        const showInline = appState.inlineExpenseBudget === budget.id;
        const hasExc     = budget.exception?.month === (appState.workingMonthKey || currentMonthKey());

        // Gradient fill for premium look
        let fillGradient;
        if (isOver) {
            fillGradient = 'linear-gradient(90deg, var(--danger-color), #f87171)';
        } else if (rawPct < 70) {
            fillGradient = 'linear-gradient(90deg, var(--success-color), #34d399)';
        } else if (rawPct < 90) {
            fillGradient = 'linear-gradient(90deg, var(--warning-color), #fbbf24)';
        } else {
            fillGradient = 'linear-gradient(90deg, #f87171, var(--danger-color))';
        }

        const expenseRows = expenses.length === 0
            ? `<p class="budget-empty-text">No expenses logged yet.</p>`
            : [...expenses].sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1).map(exp => `
                <div class="budget-expense-row" data-expense-id="${exp.id}">
                    <span class="expense-description">${escHtml(exp.description)}</span>
                    <span class="expense-date">${exp.date ? new Date(exp.date + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'}) : ''}</span>
                    <span class="expense-amount" style="color:var(--expense-color);">−${formatMoney(exp.amount)}</span>
                    <div class="expense-actions">
                        <button class="btn-icon btn-edit-expense" data-budget-id="${budget.id}" data-expense-id="${exp.id}" title="Edit">✎</button>
                        <button class="btn-icon btn-delete-expense" data-budget-id="${budget.id}" data-expense-id="${exp.id}" title="Delete">✕</button>
                    </div>
                </div>`).join('');

        const totalRow = expenses.length > 0 ? `
            <div class="budget-total-row ${isOver ? 'budget-total-over' : 'budget-total-ok'}">
                <span>${formatMoney(spent)} / ${formatMoney(budgetAmt)}</span>
                ${isOver
                    ? `<span style="color:var(--danger-color); font-weight:700;">⚠ Over by ${formatMoney(over)}</span>`
                    : `<span style="color:var(--success-color);">${formatMoney(budgetAmt - spent)} remaining</span>`}
            </div>` : '';

        // Inline add-expense form (shown instead of modal for new expenses)
        const inlineForm = showInline ? `
            <div class="inline-expense-form">
                <div class="inline-expense-form-row">
                    <div class="inline-field field-desc">
                        <label>Description</label>
                        <input type="text" class="inline-desc" placeholder="e.g. Walmart run" autocomplete="off">
                    </div>
                    <div class="inline-field">
                        <label>Amount ($)</label>
                        <input type="number" class="inline-amount" min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="inline-field">
                        <label>Date</label>
                        <input type="date" class="inline-date" value="${new Date().toISOString().slice(0,10)}">
                    </div>
                    <div class="inline-expense-form-actions">
                        <button class="btn-inline-save" data-budget-id="${budget.id}">Save</button>
                        <button class="btn-inline-cancel" data-budget-id="${budget.id}">✕</button>
                    </div>
                </div>
            </div>` : '';

        const addExpBtn = showInline
            ? `<button class="btn btn-secondary btn-sm btn-toggle-inline-expense" data-budget-id="${budget.id}" style="border-color:rgba(91,127,255,0.4);color:var(--accent-color);">✕ Cancel</button>`
            : `<button class="btn btn-secondary btn-sm btn-toggle-inline-expense" data-budget-id="${budget.id}">+ Add Expense</button>`;

        return `
        <div class="budget-card ${isOver ? 'budget-over' : ''}" data-budget-id="${budget.id}" data-expanded="${isExpanded}" style="animation-delay:${cardIdx * 0.06}s;">
            <div class="budget-card-header" data-toggle-budget="${budget.id}">
                <div class="budget-header-left">
                    <span class="budget-toggle-icon">▶</span>
                    <span class="budget-name">${escHtml(budget.name)}</span>
                    ${hasExc ? `<span class="budget-exception-badge">Override: ${formatMoney(budgetAmt)}</span>` : ''}
                </div>
                <div class="budget-header-right">
                    ${isOver
                        ? `<span class="budget-over-label">⚠ Over ${formatMoney(over)}</span>`
                        : `<span class="budget-remaining">${formatMoney(budgetAmt - spent)} left</span>`}
                    <span class="budget-spent-of">${formatMoney(spent)} / ${formatMoney(budgetAmt)}</span>
                </div>
            </div>
            <div class="budget-progress-track">
                <div class="budget-progress-fill" style="width:${barPct}%; background:${fillGradient};"></div>
            </div>
            ${isExpanded ? `
            <div class="budget-expenses-panel">
                ${expenseRows}
                ${totalRow}
                ${inlineForm}
                <div class="budget-card-actions">
                    ${addExpBtn}
                    <button class="btn btn-sm btn-override btn-override-budget" data-budget-id="${budget.id}">${hasExc ? '✎ Edit' : '⚡ Override'}</button>
                    <button class="btn btn-secondary btn-sm btn-edit-budget" data-budget-id="${budget.id}">✎ Edit</button>
                    <button class="btn btn-secondary btn-sm btn-delete-budget" data-budget-id="${budget.id}" style="margin-left:auto; border-color:var(--danger-color); color:var(--danger-color);">🗑 Delete</button>
                </div>
            </div>` : ''}
        </div>`;
    }).join('');

    container.innerHTML = metaBar + cards;

    // Auto-focus the inline form description field if open
    if (appState.inlineExpenseBudget) {
        const descInput = container.querySelector('.inline-expense-form .inline-desc');
        if (descInput) setTimeout(() => descInput.focus(), 50);
    }
}

// ─── Budget Modal ─────────────────────────────────────────────────────────────
function openBudgetModal(budgetId = null, focusException = false) {
    appState.budgetForm.reset();
    appState._root.getElementById('budget-id').value = '';
    appState._root.getElementById('budget-exception-amount-group').style.display = 'none';
    appState._root.getElementById('budget-exception-toggle').checked = false;

    if (budgetId) {
        appState._root.getElementById('budget-modal-title').textContent = 'Edit Budget';
        const budget = appState.spendingBudgets.find(b => b.id === budgetId);
        if (budget) {
            appState._root.getElementById('budget-id').value     = budget.id;
            appState._root.getElementById('budget-name').value   = budget.name;
            appState._root.getElementById('budget-amount').value = budget.amount;
            const hasExc = budget.exception?.month === currentMonthKey();
            if (hasExc || focusException) {
                appState._root.getElementById('budget-exception-toggle').checked = true;
                appState._root.getElementById('budget-exception-amount-group').style.display = '';
                if (hasExc) appState._root.getElementById('budget-exception-amount').value = budget.exception.amount;
            }
        }
    } else {
        appState._root.getElementById('budget-modal-title').textContent = 'Add Budget';
    }

    appState.budgetModal.style.display = 'flex';
    void appState.budgetModal.offsetWidth;
    appState.budgetModal.classList.add('active');
    setTimeout(() => appState.budgetModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeBudgetModal() {
    appState.budgetModal.classList.remove('active');
    setTimeout(() => { appState.budgetModal.style.display = 'none'; }, 300);
}

function saveBudget() {
    try {
        const id     = appState._root.getElementById('budget-id').value;
        const name   = appState._root.getElementById('budget-name').value.trim();
        const amount = parseFloat(appState._root.getElementById('budget-amount').value);
        const useExc = appState._root.getElementById('budget-exception-toggle').checked;
        const excAmt = parseFloat(appState._root.getElementById('budget-exception-amount').value);

        if (!name)       throw new Error('Please enter a category name.');
        if (isNaN(amount) || amount < 0) throw new Error('Please enter a valid budget amount.');
        if (useExc && (isNaN(excAmt) || excAmt < 0)) throw new Error('Please enter a valid override amount.');

        const _wk = appState.workingMonthKey || currentMonthKey();
        const exception = useExc ? { month: _wk, amount: excAmt } : null;

        if (id) {
            const idx = appState.spendingBudgets.findIndex(b => b.id === id);
            if (idx !== -1) {
                // Preserve existing expenses; only replace exception when toggle was used
                const existing = appState.spendingBudgets[idx];
                const newException = useExc ? { month: _wk, amount: excAmt }
                    : (existing.exception?.month === _wk ? null : existing.exception);
                appState.spendingBudgets[idx] = { ...existing, name, amount, exception: newException };
            }
        } else {
            appState.spendingBudgets.push({ id: Date.now().toString(), name, amount, exception, expenses: [] });
        }

        saveDataAndRender();
        closeBudgetModal();
        renderSpendingBudgets();
        showSavedToast(id ? 'Budget updated ✓' : 'Budget added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save budget.');
    }
}

function deleteBudget(id) {
    const budget = appState.spendingBudgets.find(b => b.id === id);
    if (!budget) return;
    if (!confirm(`Delete the "${budget.name}" budget and all its expenses for this month?`)) return;
    appState.spendingBudgets = appState.spendingBudgets.filter(b => b.id !== id);
    appState.expandedBudgets.delete(id);
    saveDataAndRender();
    renderSpendingBudgets();
    showSavedToast('Budget deleted ✓');
}

// ─── Expense Modal ────────────────────────────────────────────────────────────
function openExpenseModal(budgetId, expenseId = null) {
    appState.expenseForm.reset();
    appState._root.getElementById('expense-budget-id').value = budgetId;
    appState._root.getElementById('expense-id').value = '';

    const budget = appState.spendingBudgets.find(b => b.id === budgetId);
    const budgetLabel = budget ? ` — ${budget.name}` : '';

    if (expenseId) {
        appState._root.getElementById('expense-modal-title').textContent = `Edit Expense${budgetLabel}`;
        const exp = budget?.expenses?.find(e => e.id === expenseId);
        if (exp) {
            appState._root.getElementById('expense-id').value          = exp.id;
            appState._root.getElementById('expense-description').value = exp.description;
            appState._root.getElementById('expense-amount').value      = exp.amount;
            appState._root.getElementById('expense-date').value        = exp.date || '';
        }
    } else {
        appState._root.getElementById('expense-modal-title').textContent = `Add Expense${budgetLabel}`;
        // Default date to today
        appState._root.getElementById('expense-date').value = new Date().toISOString().slice(0, 10);
    }

    appState.expenseModal.style.display = 'flex';
    void appState.expenseModal.offsetWidth;
    appState.expenseModal.classList.add('active');
    setTimeout(() => appState.expenseModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeExpenseModal() {
    appState.expenseModal.classList.remove('active');
    setTimeout(() => { appState.expenseModal.style.display = 'none'; }, 300);
}

function saveExpense() {
    try {
        const budgetId    = appState._root.getElementById('expense-budget-id').value;
        const expenseId   = appState._root.getElementById('expense-id').value;
        const description = appState._root.getElementById('expense-description').value.trim();
        const amount      = parseFloat(appState._root.getElementById('expense-amount').value);
        const date        = appState._root.getElementById('expense-date').value;

        if (!description)          throw new Error('Please enter a description.');
        if (isNaN(amount) || amount < 0) throw new Error('Please enter a valid amount.');

        const budget = appState.spendingBudgets.find(b => b.id === budgetId);
        if (!budget) throw new Error('Budget not found.');

        if (!budget.expenses) budget.expenses = [];

        if (expenseId) {
            const idx = budget.expenses.findIndex(e => e.id === expenseId);
            if (idx !== -1) budget.expenses[idx] = { id: expenseId, description, amount, date };
        } else {
            budget.expenses.push({ id: Date.now().toString(), description, amount, date });
        }

        saveDataAndRender();
        closeExpenseModal();
        appState.expandedBudgets.add(budgetId);
        renderSpendingBudgets();
        showSavedToast(expenseId ? 'Expense updated ✓' : 'Expense added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save expense.');
    }
}

function deleteExpense(budgetId, expenseId) {
    const budget = appState.spendingBudgets.find(b => b.id === budgetId);
    if (!budget) return;
    const deleted = budget.expenses.find(e => e.id === expenseId);
    if (!deleted) return;
    budget.expenses = budget.expenses.filter(e => e.id !== expenseId);
    saveDataAndRender();
    renderSpendingBudgets();
    showUndoToast('Expense deleted', () => {
        budget.expenses.push(deleted);
        saveDataAndRender();
        renderSpendingBudgets();
    });
}

export { closeBudgetModal, closeExpenseModal, deleteBudget, deleteExpense, getBudgetAmount, openBudgetModal, openExpenseModal, renderSpendingBudgets, saveBudget, saveExpense };
