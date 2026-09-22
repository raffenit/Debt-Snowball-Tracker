import { appState } from './state.js';
import { currentMonthKey, formatMonthLabel, keyToHtmlMonth } from '../core/date-utils.js';
import { computeCardPayoffStatus } from '../core/card-expenses.js';
import { budgetsForView, budgetAmountForMonth } from '../core/budgets.js';
import { escHtml, formatMoney } from '../core/pure-utils.js';
import { showErrorToast, showSavedToast, showUndoToast, openCostModal } from './render-modals.js';
import { saveData, saveDataAndRender } from './storage.js';

// ─── Spending Budgets ────────────────────────────────────────────────────────
// Focused module for budget list rendering, budget/expense modals, and CRUD.
// Extracted from render-modals.js.

// ─── Archive-aware working set ───────────────────────────────────────────────
// When viewing an archived month, the Budgets tab operates on that month's
// snapshot instead of the live budgets. Expense entries stay editable so the
// historical record can be corrected; budget structure (add/edit/delete/override)
// stays locked — archives capture what the month actually was.

function getArchive() {
    const i = appState.viewingArchiveIndex;
    return (i !== null && appState.monthlyArchives[i]) ? appState.monthlyArchives[i] : null;
}

function getWorkingBudgets() {
    return budgetsForView(getArchive(), appState.spendingBudgets);
}

function getViewedMonthKey() {
    return getArchive()?.month || appState.workingMonthKey || currentMonthKey();
}

function getBudgetAmount(budget) {
    return budgetAmountForMonth(budget, getViewedMonthKey());
}

function renderSpendingBudgets() {
    const container = appState._root.getElementById('budgets-list');
    if (!container) return;

    const archive  = getArchive();
    const budgets  = getWorkingBudgets();
    const monthKey = getViewedMonthKey();
    const monthName = archive
        ? formatMonthLabel(archive.month)
        : new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    if (budgets.length === 0) {
        container.innerHTML = archive
            ? `<div class="empty-state">No budget data was recorded for ${escHtml(monthName)}.<br>Archived months preserve the budgets exactly as they stood at rollover.</div>`
            : `
            <div class="empty-state">
                No spending budgets yet.<br>Set a monthly limit per category and log spending as it happens — card-charged bills land here automatically too.
                <br><button class="empty-cta-btn" id="empty-add-budget-btn">+ Add Your First Budget</button>
            </div>`;
        const emptyBtn = container.querySelector('#empty-add-budget-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openBudgetModal());
        return;
    }

    // Budget meta bar — viewed month + totals across all budgets
    const totalBudgeted = budgets.reduce((s, b) => s + getBudgetAmount(b), 0);
    const totalSpent    = budgets.reduce((s, b) => s + (b.expenses || []).reduce((x, e) => x + e.amount, 0), 0);
    const totalOver     = totalSpent - totalBudgeted;
    const metaSpentClass = totalOver > 0 ? 'budget-meta-over' : 'budget-meta-ok';

    const archiveBanner = archive ? `
        <div class="budget-meta-bar" style="border-color:var(--warning-color);">
            <span class="budget-meta-month">&#x1F5C4;&#xFE0F; Archived month — ${escHtml(monthName)}</span>
            <div class="budget-meta-divider"></div>
            <span style="font-size:0.75rem;color:var(--text-secondary);">Expense edits update the historical record · budget structure is locked</span>
        </div>` : '';

    const metaBar = `
        <div class="budget-meta-bar">
            <span class="budget-meta-month">📅 ${monthName}</span>
            <div class="budget-meta-divider"></div>
            <span class="budget-meta-budgeted">${budgets.length} budget${budgets.length !== 1 ? 's' : ''} · ${formatMoney(totalBudgeted)} total limit</span>
            <span class="budget-meta-total">
                <span class="budget-meta-budgeted">Spent:</span>
                <span class="${metaSpentClass}">${formatMoney(totalSpent)}</span>
                ${totalOver > 0
                    ? `<span class="budget-meta-over" style="font-size:0.75rem;">⚠ ${formatMoney(totalOver)} over</span>`
                    : `<span class="budget-meta-ok" style="font-size:0.75rem;">${formatMoney(totalBudgeted - totalSpent)} left</span>`}
            </span>
        </div>`;

    // Card pay-in-full check: everything charged to cards this month should be
    // payable in full from this month's income after direct costs + minimums.
    // Current month only — archives don't carry the inputs this needs.
    const _mk = monthKey;
    const payoff = computeCardPayoffStatus({
        recurringCosts:  appState.recurringCosts,
        oneTimeCosts:    appState.oneTimeCosts,
        incomeEntries:   appState.incomeEntries,
        debts:           appState.debts,
        minPayOverrides: appState.minPayOverrides,
        spendingBudgets: appState.spendingBudgets,
        monthKey:        _mk,
    });
    // Per-card breakdown: which debt each charge landed on
    const perCard = Object.entries(payoff.byDebt)
        .map(([debtId, amt]) => `${escHtml(appState.debts.find(d => d.id === debtId)?.name || 'Card')}: ${formatMoney(amt)}`);
    if (payoff.unassigned > 0) perCard.push(`Unlinked: ${formatMoney(payoff.unassigned)}`);

    const chargeItems = (payoff.items || []).map(it => {
        const cardName = it.debtId ? (appState.debts.find(d => d.id === it.debtId)?.name || 'Card') : 'Unlinked';
        return `<div class="card-charge-item"><span>${escHtml(it.name)}</span><span>${formatMoney(it.amount)} · ${escHtml(cardName)}</span></div>`;
    }).join('');
    const cardStrip = !archive && payoff.cardCharges > 0 ? `
        <div class="budget-meta-bar" style="margin-top:0.5rem; flex-wrap:wrap; row-gap:0.35rem;">
            <details class="card-charges-detail">
                <summary class="budget-meta-budgeted" title="Click to see which charges make up this total">💳 Charged to cards this month: ${formatMoney(payoff.cardCharges)}</summary>
                <div class="card-charge-items">
                    ${chargeItems}
                    <div class="card-charge-item card-charge-hint">Missing a charge? A bill or expense only counts when its payment method is set to a card.</div>
                </div>
            </details>
            ${perCard.length > 0 ? `<span style="font-size:0.75rem; color:var(--text-secondary);">${perCard.join(' · ')}</span>` : ''}
            <div class="budget-meta-divider"></div>
            ${payoff.sustainable
                ? `<span class="budget-meta-ok" title="Income covers all card charges after direct costs and minimum payments">✓ Covered — pay card balances in full</span>`
                : `<span class="budget-meta-over" title="Card charges exceed what this month's income can cover — the card balance will grow">⚠ ${formatMoney(payoff.shortfall)} beyond what income can cover</span>`}
        </div>` : '';

    const cards = budgets.map((budget, cardIdx) => {
        const budgetAmt  = getBudgetAmount(budget);
        const expenses   = budget.expenses || [];
        const spent      = expenses.reduce((s, e) => s + e.amount, 0);
        const over       = spent - budgetAmt;
        const isOver     = over > 0;
        const rawPct     = budgetAmt > 0 ? (spent / budgetAmt) * 100 : (spent > 0 ? 100 : 0);
        const barPct     = Math.min(rawPct, 100);
        const isExpanded = appState.expandedBudgets.has(budget.id);
        const showInline = appState.inlineExpenseBudget === budget.id;
        const hasExc     = budget.exception?.month === monthKey;

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

        const todayISO = new Date().toISOString().slice(0, 10);
        const expenseRows = expenses.length === 0
            ? `<p class="budget-empty-text">No expenses logged yet.</p>`
            : [...expenses].sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1).map(exp => {
                // Auto card charges log up front — a future date means the
                // money is committed but hasn't posted to the card yet.
                const upcoming  = exp.autoCard && exp.date && exp.date > todayISO;
                const autoBadge = exp.autoCard
                    ? ` <span class="expense-auto-badge" title="${upcoming ? 'Scheduled card charge — posts on this date · edit the bill to change it' : 'Auto-logged card charge — edit the bill to change it'}">${upcoming ? '⏳' : '⚡'}</span>`
                    : '';
                const cardName  = exp.cardDebtId && appState.debts.find(d => d.id === exp.cardDebtId)?.name;
                const cardBadge = !exp.autoCard && exp.paymentMethod === 'card'
                    ? ` <span class="expense-auto-badge" title="Charged to ${escHtml(cardName || 'a credit card')} — not deducted from cash flow">💳${cardName ? ` ${escHtml(cardName)}` : ''}</span>`
                    : '';
                return `
                <div class="budget-expense-row${exp.autoCard ? ' expense-auto' : ''}" data-expense-id="${exp.id}" data-budget-id="${budget.id}"${exp.autoCard ? '' : ' draggable="true" title="Drag to move to another budget"'}>
                    <span class="expense-description">${escHtml(exp.description)}${autoBadge}${cardBadge}</span>
                    <span class="expense-date">${exp.date ? new Date(exp.date + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'}) : ''}</span>
                    <span class="expense-amount" style="color:var(--expense-color);">−${formatMoney(exp.amount)}</span>
                    <div class="expense-actions">
                        ${exp.autoCard ? '' : `<button class="btn-icon btn-edit-expense" data-budget-id="${budget.id}" data-expense-id="${exp.id}" title="Edit">✎</button>`}
                        ${exp.autoCard ? '' : `<button class="btn-icon btn-expense-torecurring" data-budget-id="${budget.id}" data-expense-id="${exp.id}" title="Convert to recurring bill">🔁</button>`}
                        <button class="btn-icon btn-delete-expense" data-budget-id="${budget.id}" data-expense-id="${exp.id}" title="Delete">✕</button>
                    </div>
                </div>`;
            }).join('');

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
                    ${archive ? '' : `<span class="budget-drag-handle" draggable="true" title="Drag to reorder">⠿</span>`}
                    <span class="budget-toggle-icon">▶</span>
                    <span class="budget-name">${escHtml(budget.name)}</span>
                    ${budget.autoGenerated ? `<span class="budget-exception-badge" title="Auto-managed: card charges are logged here and the monthly limit tracks them">⚡ auto</span>` : ''}
                    ${hasExc && !budget.exception?.auto ? `<span class="budget-exception-badge">Override: ${formatMoney(budgetAmt)}</span>` : ''}
                </div>
                <div class="budget-header-right">
                    ${isOver
                        ? `<span class="budget-over-label">⚠ Over ${formatMoney(over)}</span>`
                        : `<span class="budget-remaining">${formatMoney(budgetAmt - spent)} left</span>`}
                    <span class="budget-spent-of">${formatMoney(spent)} / ${formatMoney(budgetAmt)}</span>
                    ${archive ? '' : `<button class="btn-icon btn-edit-budget" data-budget-id="${budget.id}" title="Edit budget">✎</button>`}
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
                    ${archive ? '' : `
                    <button class="btn btn-sm btn-override btn-override-budget" data-budget-id="${budget.id}" title="Set a one-time amount for this month only — base amount stays unchanged">${hasExc ? '⚡ Edit Override' : '⚡ Override'}</button>
                    <button class="btn btn-secondary btn-sm btn-edit-budget" data-budget-id="${budget.id}" title="Edit name and base monthly amount">✎ Edit</button>
                    <button class="btn btn-secondary btn-sm btn-delete-budget" data-budget-id="${budget.id}" style="margin-left:auto; border-color:var(--danger-color); color:var(--danger-color);">🗑 Delete</button>`}
                </div>
            </div>` : ''}
        </div>`;
    }).join('');

    container.innerHTML = archiveBanner + metaBar + cardStrip + cards;

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
        appState._root.getElementById('budget-modal-title').textContent =
            focusException ? 'Edit Budget — Monthly Override' : 'Edit Budget';
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
        if (getArchive()) throw new Error('Budgets are locked in archived months.');
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
    if (getArchive()) return; // archived budget structure is locked
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

    const budgets = getWorkingBudgets();

    // Budget picker — defaults to the budget the expense lives in
    const budgetSel = appState._root.getElementById('expense-budget-select');
    if (budgetSel) {
        budgetSel.innerHTML = budgets
            .map(b => `<option value="${b.id}"${b.id === budgetId ? ' selected' : ''}>${escHtml(b.name)}</option>`)
            .join('');
    }

    // Card picker — same pattern as the bill modal's "charged to card" select
    const methodSel   = appState._root.getElementById('expense-payment-method');
    const cardDebtSel = appState._root.getElementById('expense-card-debt');
    if (cardDebtSel) {
        const cards = appState.debts.filter(d => d.type === 'credit-card');
        cardDebtSel.innerHTML = '<option value="">— Unspecified card —</option>' +
            cards.map(d => `<option value="${d.id}">${escHtml(d.name)}</option>`).join('');
    }
    const toggleCardGroup = () => {
        const grp = appState._root.getElementById('expense-card-debt-group');
        if (grp) grp.style.display = methodSel?.value === 'card' ? '' : 'none';
    };
    if (methodSel) methodSel.value = 'direct';
    toggleCardGroup();

    const budget = budgets.find(b => b.id === budgetId);
    const budgetLabel = budget ? ` — ${budget.name}` : '';

    if (expenseId) {
        appState._root.getElementById('expense-modal-title').textContent = `Edit Expense${budgetLabel}`;
        const exp = budget?.expenses?.find(e => e.id === expenseId);
        if (exp) {
            appState._root.getElementById('expense-id').value          = exp.id;
            appState._root.getElementById('expense-description').value = exp.description;
            appState._root.getElementById('expense-amount').value      = exp.amount;
            appState._root.getElementById('expense-date').value        = exp.date || '';
            if (methodSel)   methodSel.value   = exp.paymentMethod || 'direct';
            if (cardDebtSel) cardDebtSel.value = exp.cardDebtId || '';
            toggleCardGroup();
        }
    } else {
        appState._root.getElementById('expense-modal-title').textContent = `Add Expense${budgetLabel}`;
        // Default date: today for the live month, the 1st for archives
        const archive = getArchive();
        appState._root.getElementById('expense-date').value = archive
            ? `${keyToHtmlMonth(archive.month)}-01`
            : new Date().toISOString().slice(0, 10);
    }

    appState.expenseModal.style.display = 'flex';
    void appState.expenseModal.offsetWidth;
    appState.expenseModal.classList.add('active');
    setTimeout(() => appState.expenseModal.querySelector('input:not([type=hidden])').focus(), 50);
}

// Convert a manual expense into a recurring bill: opens the bill modal
// prefilled with the expense's details. On save, `saveCost` consumes the
// source expense (live month only — archived expenses stay as history) and
// marks the new bill paid when the money already left. Card-paid expenses
// carry their routing over, so the bill's auto-mirror lands right back in
// the same budget.
function convertExpenseToBill(budgetId, expenseId) {
    const budget = getWorkingBudgets().find(b => b.id === budgetId);
    const exp = budget?.expenses?.find(e => e.id === expenseId);
    if (!exp || exp.autoCard) return;

    // Guess a bill category from the budget it lived in
    const catGuess = budget.id?.startsWith('auto_cat_')
        ? budget.id.slice('auto_cat_'.length)
        : 'other';

    appState._expenseToConvert = {
        budgetId, expenseId,
        fromArchive: appState.viewingArchiveIndex !== null,
    };
    openCostModal(null, {
        name:          exp.description,
        amount:        exp.amount,
        dueDay:        exp.date ? parseInt(exp.date.split('-')[2], 10) : 1,
        paymentMethod: exp.paymentMethod || 'direct',
        cardDebtId:    exp.cardDebtId,
        budgetId,
        category:      ['subscription', 'utility', 'maintenance', 'other'].includes(catGuess) ? catGuess : 'other',
    });
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
        const paymentMethod = appState._root.getElementById('expense-payment-method')?.value || 'direct';
        const cardDebtId    = paymentMethod === 'card'
            ? (appState._root.getElementById('expense-card-debt')?.value || undefined)
            : undefined;

        if (!description)          throw new Error('Please enter a description.');
        if (isNaN(amount) || amount < 0) throw new Error('Please enter a valid amount.');

        const budgets = getWorkingBudgets();
        const budget = budgets.find(b => b.id === budgetId);
        if (!budget) throw new Error('Budget not found.');

        if (!budget.expenses) budget.expenses = [];

        const targetBudgetId = appState._root.getElementById('expense-budget-select')?.value || budgetId;

        if (expenseId) {
            const idx = budget.expenses.findIndex(e => e.id === expenseId);
            if (idx !== -1) {
                const updated = { ...budget.expenses[idx], description, amount, date, paymentMethod, cardDebtId };
                if (targetBudgetId !== budgetId) {
                    // Reassigned to a different budget
                    const target = budgets.find(b => b.id === targetBudgetId);
                    if (!target) throw new Error('Target budget not found.');
                    if (!target.expenses) target.expenses = [];
                    budget.expenses.splice(idx, 1);
                    target.expenses.push(updated);
                } else {
                    budget.expenses[idx] = updated;
                }
            }
        } else {
            const target = budgets.find(b => b.id === targetBudgetId) || budget;
            if (!target.expenses) target.expenses = [];
            target.expenses.push({ id: Date.now().toString(), description, amount, date, paymentMethod, cardDebtId });
        }

        saveDataAndRender();
        closeExpenseModal();
        appState.expandedBudgets.add(targetBudgetId);
        renderSpendingBudgets();
        showSavedToast(expenseId ? 'Expense updated ✓' : 'Expense added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save expense.');
    }
}

// Move a manual expense from one budget to another (drag & drop).
// Auto-logged card expenses can't move — they mirror the bill's routing.
function moveExpenseToBudget(expenseId, fromBudgetId, toBudgetId) {
    if (fromBudgetId === toBudgetId) return false;
    const budgets = getWorkingBudgets();
    const from = budgets.find(b => b.id === fromBudgetId);
    const to   = budgets.find(b => b.id === toBudgetId);
    const exp  = from?.expenses?.find(e => e.id === expenseId);
    if (!from || !to || !exp || exp.autoCard) return false;
    from.expenses = from.expenses.filter(e => e.id !== expenseId);
    if (!to.expenses) to.expenses = [];
    to.expenses.push(exp);
    saveDataAndRender();
    renderSpendingBudgets();
    showSavedToast(`Moved to ${to.name} ✓`);
    return true;
}

function deleteExpense(budgetId, expenseId) {
    const budget = getWorkingBudgets().find(b => b.id === budgetId);
    if (!budget) return;
    const deleted = budget.expenses.find(e => e.id === expenseId);
    if (!deleted) return;
    // Tombstone auto card expenses so the sync doesn't resurrect them next
    // render — live month only; archives aren't synced.
    const skipKey = !getArchive() && deleted.autoCard && deleted.costId
        ? `${appState.workingMonthKey || currentMonthKey()}:${deleted.costId}`
        : null;
    if (skipKey && !appState.cardExpenseSkips.includes(skipKey)) {
        appState.cardExpenseSkips.push(skipKey);
    }
    budget.expenses = budget.expenses.filter(e => e.id !== expenseId);
    saveDataAndRender();
    renderSpendingBudgets();
    showUndoToast('Expense deleted', () => {
        if (skipKey) appState.cardExpenseSkips = appState.cardExpenseSkips.filter(k => k !== skipKey);
        budget.expenses.push(deleted);
        saveDataAndRender();
        renderSpendingBudgets();
    });
}

export { closeBudgetModal, closeExpenseModal, convertExpenseToBill, deleteBudget, deleteExpense, getBudgetAmount, getWorkingBudgets, moveExpenseToBudget, openBudgetModal, openExpenseModal, renderSpendingBudgets, saveBudget, saveExpense };
