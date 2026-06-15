// ─── Debt Modal ──────────────────────────────────────────────────────────────
function openDebtModal(debtId = null) {
    debtForm.reset();
    _root.getElementById('debt-id').value = '';

    const promoToggle      = _root.getElementById('debt-promo-toggle');
    const promoExpiryGroup = _root.getElementById('promo-expiry-group');
    const rateInput        = _root.getElementById('debt-rate');

    promoToggle.checked = false;
    promoExpiryGroup.style.display = 'none';
    rateInput.closest('.input-group').classList.remove('input-disabled');
    rateInput.disabled = false;
    _root.getElementById('debt-promo-expiry').value    = '';
    _root.getElementById('debt-promo-expiry').required = false;
    _root.getElementById('debt-autopay-toggle').checked = false;
    _root.getElementById('debt-url').value = '';

    if (debtId) {
        _root.getElementById('modal-title').textContent = 'Edit Debt';
        const debt = debts.find(d => d.id === debtId);
        if (debt) {
            _root.getElementById('debt-id').value          = debt.id;
            _root.getElementById('debt-name').value        = debt.name;
            _root.getElementById('debt-type').value        = debt.type || 'credit-card';
            _root.getElementById('debt-balance').value     = debt.balance;
            _root.getElementById('debt-rate').value        = debt.rate;
            _root.getElementById('debt-min-payment').value = debt.minPayment;
            _root.getElementById('debt-due-day').value     = debt.dueDay || '';
            _root.getElementById('debt-autopay-toggle').checked = !!debt.autoPay;
            _root.getElementById('debt-url').value = debt.paymentUrl || '';
            if (debt.promoZeroInterest) {
                promoToggle.checked = true;
                promoExpiryGroup.style.display = 'block';
                rateInput.closest('.input-group').classList.add('input-disabled');
                rateInput.disabled = true;
                rateInput.value = '0';
                _root.getElementById('debt-promo-expiry').value    = debt.promoExpiryDate || '';
                _root.getElementById('debt-promo-expiry').required = true;
            }
        }
    } else {
        _root.getElementById('modal-title').textContent = 'Add New Debt';
        _root.getElementById('debt-type').value = 'credit-card';
    }

    debtModal.style.display = 'flex';
    void debtModal.offsetWidth;
    debtModal.classList.add('active');
    setTimeout(() => debtModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeDebtModal() {
    debtModal.classList.remove('active');
    setTimeout(() => { debtModal.style.display = 'none'; }, 300);
}

// ─── Recurring Cost Modal ────────────────────────────────────────────────────
function openCostModal(costId = null) {
    costForm.reset();
    _root.getElementById('cost-id').value = '';
    _root.getElementById('cost-autopay-toggle').checked = false;

    if (costId) {
        _root.getElementById('cost-modal-title').textContent = 'Edit Cost';
        const cost = recurringCosts.find(c => c.id === costId) || oneTimeCosts.find(c => c.id === costId);
        if (cost) {
            _root.getElementById('cost-id').value              = cost.id;
            _root.getElementById('cost-name').value            = cost.name;
            _root.getElementById('cost-amount').value          = cost.amount;
            _root.getElementById('cost-due-day').value         = cost.dueDay || '';
            _root.getElementById('cost-category').value        = cost.category || 'other';
            _root.getElementById('cost-payment-method').value  = cost.paymentMethod || 'direct';
            _root.getElementById('cost-amount-type').value     = cost.amountType || 'fixed';
            _root.getElementById('cost-autopay-toggle').checked = !!cost.autoPay;
            // Restore interval
            const n = cost.intervalMonths || 1;
            const intervalEl = _root.getElementById('cost-interval');
            if ([1,2,3,6,12].includes(n)) {
                intervalEl.value = String(n);
            } else {
                intervalEl.value = 'custom';
                _root.getElementById('cost-interval-custom').value = n;
            }
            // Restore next due month
            if (n > 1 && cost.nextDueMonth) {
                _root.getElementById('cost-start-month').value = keyToHtmlMonth(cost.nextDueMonth);
            } else {
                _root.getElementById('cost-start-month').value = '';
            }
        }
    } else {
        _root.getElementById('cost-modal-title').textContent = 'Add Cost';
        _root.getElementById('cost-payment-method').value = 'direct';
        _root.getElementById('cost-amount-type').value = 'fixed';
        _root.getElementById('cost-interval').value = '1';
    }
    updateCostModalIntervalVisibility();

    costModal.style.display = 'flex';
    void costModal.offsetWidth;
    costModal.classList.add('active');
    setTimeout(() => costModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeCostModal() {
    costModal.classList.remove('active');
    setTimeout(() => { costModal.style.display = 'none'; }, 300);
}

// ─── Income Modal ────────────────────────────────────────────────────────────
function openIncomeModal(incomeId = null) {
    incomeForm.reset();
    _root.getElementById('income-id').value = '';
    _root.getElementById('income-schedule').value = 'one-time';
    _root.getElementById('income-schedule-hint').style.display = 'none';

    if (incomeId) {
        _root.getElementById('income-modal-title').textContent = 'Edit Income Entry';
        const entry = incomeEntries.find(e => e.id === incomeId);
        if (entry) {
            _root.getElementById('income-id').value       = entry.id;
            _root.getElementById('income-label').value    = entry.label;
            _root.getElementById('income-date').value     = entry.date;
            _root.getElementById('income-amount').value   = entry.amount;
            _root.getElementById('income-schedule').value = entry.scheduleType || 'one-time';
            updateIncomeScheduleHint();
        }
    } else {
        _root.getElementById('income-modal-title').textContent = 'Add Income Entry';
    }

    incomeModal.style.display = 'flex';
    void incomeModal.offsetWidth;
    incomeModal.classList.add('active');
    setTimeout(() => incomeModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function updateIncomeScheduleHint() {
    const sel  = _root.getElementById('income-schedule');
    const hint = _root.getElementById('income-schedule-hint');
    if (!sel || !hint) return;
    if (sel.value === 'monthly') {
        hint.textContent = 'This day of the month will be reused each month automatically.';
        hint.style.display = '';
    } else if (sel.value === 'biweekly') {
        hint.textContent = 'All biweekly occurrences within the current month will be added as separate entries.';
        hint.style.display = '';
    } else {
        hint.style.display = 'none';
    }
}

function closeIncomeModal() {
    incomeModal.classList.remove('active');
    setTimeout(() => { incomeModal.style.display = 'none'; }, 300);
}

// ─── CRUD: Debts ─────────────────────────────────────────────────────────────
function saveDebt() {
    try {
        const id         = _root.getElementById('debt-id').value;
        const name       = _root.getElementById('debt-name').value;
        const type       = _root.getElementById('debt-type').value;
        const balance    = parseFloat(_root.getElementById('debt-balance').value);
        const rate       = parseFloat(_root.getElementById('debt-rate').value);
        const minPayment = parseFloat(_root.getElementById('debt-min-payment').value);
        const dueDay     = parseInt(_root.getElementById('debt-due-day').value) || 1;
        const autoPay    = _root.getElementById('debt-autopay-toggle').checked;
        const paymentUrl = _root.getElementById('debt-url').value.trim();

        const promoZeroInterest = _root.getElementById('debt-promo-toggle').checked;
        const promoExpiryDate   = promoZeroInterest ? _root.getElementById('debt-promo-expiry').value : null;

        if (!name.trim())          throw new Error('Please enter a name for this debt.');
        if (isNaN(balance))        throw new Error('Please enter a valid balance.');
        if (!promoZeroInterest && isNaN(rate)) throw new Error('Please enter a valid interest rate.');
        if (isNaN(minPayment))     throw new Error('Please enter a valid minimum payment.');

        const existingDebt = debts.find(d => d.id === id);
        const originalRate = promoZeroInterest
            ? (existingDebt?.originalRate != null ? existingDebt.originalRate : rate)
            : rate;

        const debtData = {
            name, type,
            balance,
            rate:         promoZeroInterest ? 0 : rate,
            originalRate: promoZeroInterest ? originalRate : rate,
            minPayment, dueDay, autoPay, paymentUrl,
            promoZeroInterest, promoExpiryDate
        };

        if (id) {
            const idx = debts.findIndex(d => d.id === id);
            if (idx !== -1) debts[idx] = { id, ...debtData };
        } else {
            debts.push({ id: Date.now().toString(), ...debtData });
        }

        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        closeDebtModal();
        showSavedToast(id ? 'Debt updated ✓' : 'Debt added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save debt.');
    }
}

function deleteDebt(id) {
    showInlineConfirm(id, 'debt', () => {
        const deleted = debts.find(d => d.id === id);
        debts = debts.filter(d => d.id !== id);
        delete paidStatus[id];
        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        showUndoToast('Debt deleted', () => { debts.push(deleted); saveData().catch(err => console.error('Debt Snowball: save failed —', err)); });
    });
}

// ─── CRUD: Recurring Costs ───────────────────────────────────────────────────
function saveCost() {
    try {
        const id            = _root.getElementById('cost-id').value;
        const name          = _root.getElementById('cost-name').value;
        const amount        = parseFloat(_root.getElementById('cost-amount').value);
        const dueDay        = parseInt(_root.getElementById('cost-due-day').value) || 1;
        const category      = _root.getElementById('cost-category').value || 'other';
        const paymentMethod = _root.getElementById('cost-payment-method').value || 'direct';
        const amountType    = _root.getElementById('cost-amount-type').value || 'fixed';
        const autoPay       = _root.getElementById('cost-autopay-toggle').checked;
        const intervalSel   = _root.getElementById('cost-interval').value;
        const intervalMonths = intervalSel === 'custom'
            ? (parseInt(_root.getElementById('cost-interval-custom').value) || 1)
            : parseInt(intervalSel) || 1;

        if (!name.trim())   throw new Error('Please enter a name for this cost.');
        if (isNaN(amount))  throw new Error('Please enter a valid amount.');
        if (intervalMonths < 1) throw new Error('Interval must be at least 1 month.');

        const startMonthInput = _root.getElementById('cost-start-month').value;
        const startMonthKey = startMonthInput ? htmlMonthToKey(startMonthInput) : null;

        const addedMonth = category === 'one-time' ? (workingMonthKey || currentMonthKey()) : undefined;

        const targetArray = category === 'one-time' ? oneTimeCosts : recurringCosts;
        const sourceArray = category === 'one-time' ? recurringCosts : oneTimeCosts;

        if (id) {
            // Find in current or other array (user may have changed category)
            const idx = targetArray.findIndex(c => c.id === id);
            const otherIdx = sourceArray.findIndex(c => c.id === id);
            if (idx !== -1) {
                const existing = targetArray[idx];
                const nextDueMonth = intervalMonths > 1
                    ? (startMonthKey ?? (existing.intervalMonths === intervalMonths ? existing.nextDueMonth : currentMonthKey()))
                    : undefined;
                targetArray[idx] = { id, name, amount, dueDay, category, paymentMethod, amountType, autoPay, intervalMonths, nextDueMonth, addedMonth };
            } else if (otherIdx !== -1) {
                // Moved from other array — remove from old, add to new
                const [moved] = sourceArray.splice(otherIdx, 1);
                const nextDueMonth = intervalMonths > 1
                    ? (startMonthKey ?? currentMonthKey())
                    : undefined;
                targetArray.push({ id, name, amount, dueDay, category, paymentMethod, amountType, autoPay, intervalMonths, nextDueMonth, addedMonth });
            }
        } else {
            const nextDueMonth = intervalMonths > 1 ? (startMonthKey ?? currentMonthKey()) : undefined;
            targetArray.push({ id: Date.now().toString(), name, amount, dueDay, category, paymentMethod, amountType, autoPay, intervalMonths, nextDueMonth, addedMonth });
        }

        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        closeCostModal();
        showSavedToast(id ? 'Cost updated ✓' : 'Cost added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save cost.');
    }
}

function deleteCost(id) {
    showInlineConfirm(id, 'cost', () => {
        let deleted = recurringCosts.find(c => c.id === id);
        let array = recurringCosts;
        if (!deleted) {
            deleted = oneTimeCosts.find(c => c.id === id);
            array = oneTimeCosts;
        }
        if (deleted) {
            array = array.filter(c => c.id !== id);
            if (array === recurringCosts) recurringCosts = array;
            else oneTimeCosts = array;
            delete paidStatus[id];
            saveData().catch(err => console.error("Debt Snowball: save failed —", err));
            showUndoToast('Cost deleted', () => {
                array.push(deleted);
                if (array === recurringCosts) recurringCosts = array;
                else oneTimeCosts = array;
                saveData().catch(err => console.error('Debt Snowball: save failed —', err));
            });
        }
    });
}

// ─── Spending Budgets ────────────────────────────────────────────────────────

function getBudgetAmount(budget) {
    const exc = budget.exception;
    if (exc && exc.month === (workingMonthKey || currentMonthKey())) return exc.amount;
    return budget.amount;
}

function renderSpendingBudgets() {
    const container = _root.getElementById('budgets-list');
    if (!container) return;

    if (spendingBudgets.length === 0) {
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
    const totalBudgeted = spendingBudgets.reduce((s, b) => s + getBudgetAmount(b), 0);
    const totalSpent    = spendingBudgets.reduce((s, b) => s + (b.expenses || []).reduce((x, e) => x + e.amount, 0), 0);
    const totalOver     = totalSpent - totalBudgeted;
    const metaSpentClass = totalOver > 0 ? 'budget-meta-over' : 'budget-meta-ok';

    const metaBar = `
        <div class="budget-meta-bar">
            <span class="budget-meta-month">📅 ${monthName}</span>
            <div class="budget-meta-divider"></div>
            <span class="budget-meta-budgeted">${spendingBudgets.length} budget${spendingBudgets.length !== 1 ? 's' : ''} · ${formatMoney(totalBudgeted)} total limit</span>
            <span class="budget-meta-total">
                <span class="budget-meta-budgeted">Spent:</span>
                <span class="${metaSpentClass}">${formatMoney(totalSpent)}</span>
                ${totalOver > 0
                    ? `<span class="budget-meta-over" style="font-size:0.75rem;">⚠ ${formatMoney(totalOver)} over</span>`
                    : `<span class="budget-meta-ok" style="font-size:0.75rem;">${formatMoney(totalBudgeted - totalSpent)} left</span>`}
            </span>
        </div>`;

    const cards = spendingBudgets.map((budget, cardIdx) => {
        const budgetAmt  = getBudgetAmount(budget);
        const expenses   = budget.expenses || [];
        const spent      = expenses.reduce((s, e) => s + e.amount, 0);
        const over       = spent - budgetAmt;
        const isOver     = over > 0;
        const rawPct     = budgetAmt > 0 ? (spent / budgetAmt) * 100 : (spent > 0 ? 100 : 0);
        const barPct     = Math.min(rawPct, 100);
        const isExpanded = expandedBudgets.has(budget.id);
        const showInline = inlineExpenseBudget === budget.id;
        const hasExc     = budget.exception?.month === (workingMonthKey || currentMonthKey());

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
    if (inlineExpenseBudget) {
        const descInput = container.querySelector('.inline-expense-form .inline-desc');
        if (descInput) setTimeout(() => descInput.focus(), 50);
    }
}

// ─── Budget Modal ─────────────────────────────────────────────────────────────
function openBudgetModal(budgetId = null, focusException = false) {
    budgetForm.reset();
    _root.getElementById('budget-id').value = '';
    _root.getElementById('budget-exception-amount-group').style.display = 'none';
    _root.getElementById('budget-exception-toggle').checked = false;

    if (budgetId) {
        _root.getElementById('budget-modal-title').textContent = 'Edit Budget';
        const budget = spendingBudgets.find(b => b.id === budgetId);
        if (budget) {
            _root.getElementById('budget-id').value     = budget.id;
            _root.getElementById('budget-name').value   = budget.name;
            _root.getElementById('budget-amount').value = budget.amount;
            const hasExc = budget.exception?.month === currentMonthKey();
            if (hasExc || focusException) {
                _root.getElementById('budget-exception-toggle').checked = true;
                _root.getElementById('budget-exception-amount-group').style.display = '';
                if (hasExc) _root.getElementById('budget-exception-amount').value = budget.exception.amount;
            }
        }
    } else {
        _root.getElementById('budget-modal-title').textContent = 'Add Budget';
    }

    budgetModal.style.display = 'flex';
    void budgetModal.offsetWidth;
    budgetModal.classList.add('active');
    setTimeout(() => budgetModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeBudgetModal() {
    budgetModal.classList.remove('active');
    setTimeout(() => { budgetModal.style.display = 'none'; }, 300);
}

function saveBudget() {
    try {
        const id     = _root.getElementById('budget-id').value;
        const name   = _root.getElementById('budget-name').value.trim();
        const amount = parseFloat(_root.getElementById('budget-amount').value);
        const useExc = _root.getElementById('budget-exception-toggle').checked;
        const excAmt = parseFloat(_root.getElementById('budget-exception-amount').value);

        if (!name)       throw new Error('Please enter a category name.');
        if (isNaN(amount) || amount < 0) throw new Error('Please enter a valid budget amount.');
        if (useExc && (isNaN(excAmt) || excAmt < 0)) throw new Error('Please enter a valid override amount.');

        const _wk = workingMonthKey || currentMonthKey();
        const exception = useExc ? { month: _wk, amount: excAmt } : null;

        if (id) {
            const idx = spendingBudgets.findIndex(b => b.id === id);
            if (idx !== -1) {
                // Preserve existing expenses; only replace exception when toggle was used
                const existing = spendingBudgets[idx];
                const newException = useExc ? { month: _wk, amount: excAmt }
                    : (existing.exception?.month === _wk ? null : existing.exception);
                spendingBudgets[idx] = { ...existing, name, amount, exception: newException };
            }
        } else {
            spendingBudgets.push({ id: Date.now().toString(), name, amount, exception, expenses: [] });
        }

        saveData().catch(err => console.error('Debt Snowball: save failed —', err));
        closeBudgetModal();
        renderSpendingBudgets();
        showSavedToast(id ? 'Budget updated ✓' : 'Budget added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save budget.');
    }
}

function deleteBudget(id) {
    const budget = spendingBudgets.find(b => b.id === id);
    if (!budget) return;
    if (!confirm(`Delete the "${budget.name}" budget and all its expenses for this month?`)) return;
    spendingBudgets = spendingBudgets.filter(b => b.id !== id);
    expandedBudgets.delete(id);
    saveData().catch(err => console.error('Debt Snowball: save failed —', err));
    renderSpendingBudgets();
    showSavedToast('Budget deleted ✓');
}

// ─── Expense Modal ────────────────────────────────────────────────────────────
function openExpenseModal(budgetId, expenseId = null) {
    expenseForm.reset();
    _root.getElementById('expense-budget-id').value = budgetId;
    _root.getElementById('expense-id').value = '';

    const budget = spendingBudgets.find(b => b.id === budgetId);
    const budgetLabel = budget ? ` — ${budget.name}` : '';

    if (expenseId) {
        _root.getElementById('expense-modal-title').textContent = `Edit Expense${budgetLabel}`;
        const exp = budget?.expenses?.find(e => e.id === expenseId);
        if (exp) {
            _root.getElementById('expense-id').value          = exp.id;
            _root.getElementById('expense-description').value = exp.description;
            _root.getElementById('expense-amount').value      = exp.amount;
            _root.getElementById('expense-date').value        = exp.date || '';
        }
    } else {
        _root.getElementById('expense-modal-title').textContent = `Add Expense${budgetLabel}`;
        // Default date to today
        _root.getElementById('expense-date').value = new Date().toISOString().slice(0, 10);
    }

    expenseModal.style.display = 'flex';
    void expenseModal.offsetWidth;
    expenseModal.classList.add('active');
    setTimeout(() => expenseModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeExpenseModal() {
    expenseModal.classList.remove('active');
    setTimeout(() => { expenseModal.style.display = 'none'; }, 300);
}

function saveExpense() {
    try {
        const budgetId    = _root.getElementById('expense-budget-id').value;
        const expenseId   = _root.getElementById('expense-id').value;
        const description = _root.getElementById('expense-description').value.trim();
        const amount      = parseFloat(_root.getElementById('expense-amount').value);
        const date        = _root.getElementById('expense-date').value;

        if (!description)          throw new Error('Please enter a description.');
        if (isNaN(amount) || amount < 0) throw new Error('Please enter a valid amount.');

        const budget = spendingBudgets.find(b => b.id === budgetId);
        if (!budget) throw new Error('Budget not found.');

        if (!budget.expenses) budget.expenses = [];

        if (expenseId) {
            const idx = budget.expenses.findIndex(e => e.id === expenseId);
            if (idx !== -1) budget.expenses[idx] = { id: expenseId, description, amount, date };
        } else {
            budget.expenses.push({ id: Date.now().toString(), description, amount, date });
        }

        saveData().catch(err => console.error('Debt Snowball: save failed —', err));
        closeExpenseModal();
        expandedBudgets.add(budgetId);
        renderSpendingBudgets();
        showSavedToast(expenseId ? 'Expense updated ✓' : 'Expense added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save expense.');
    }
}

function deleteExpense(budgetId, expenseId) {
    const budget = spendingBudgets.find(b => b.id === budgetId);
    if (!budget) return;
    const deleted = budget.expenses.find(e => e.id === expenseId);
    if (!deleted) return;
    budget.expenses = budget.expenses.filter(e => e.id !== expenseId);
    saveData().catch(err => console.error('Debt Snowball: save failed —', err));
    renderSpendingBudgets();
    showUndoToast('Expense deleted', () => {
        budget.expenses.push(deleted);
        saveData().catch(err => console.error('Debt Snowball: save failed —', err));
        renderSpendingBudgets();
    });
}

// ─── CRUD: Income ────────────────────────────────────────────────────────────
function saveIncome() {
    try {
        const id           = _root.getElementById('income-id').value;
        const label        = _root.getElementById('income-label').value;
        const date         = _root.getElementById('income-date').value;
        const amount       = parseFloat(_root.getElementById('income-amount').value);
        const scheduleType = _root.getElementById('income-schedule').value || 'one-time';

        if (!label.trim()) throw new Error('Please enter a label for this income entry.');
        if (!date)         throw new Error('Please select a date.');
        if (isNaN(amount)) throw new Error('Please enter a valid amount.');

        const entryBase = { label, date, amount, scheduleType };
        if (scheduleType === 'monthly')   entryBase.scheduleDay = parseInt(date.split('-')[2]);
        if (scheduleType === 'biweekly')  entryBase.scheduleAnchorDate = date;

        if (id) {
            const idx = incomeEntries.findIndex(e => e.id === id);
            if (idx !== -1) incomeEntries[idx] = { id, ...entryBase };
        } else if (scheduleType === 'biweekly') {
            const generated = generateBiweeklyForMonth(label, amount, date, workingMonthKey || currentMonthKey());
            if (generated.length === 0) throw new Error('No occurrences of this schedule fall in the current month. Choose a date within the current month as the starting point.');
            incomeEntries.push(...generated);
        } else {
            incomeEntries.push({ id: Date.now().toString(), ...entryBase });
        }

        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        closeIncomeModal();
        showSavedToast(id ? 'Income updated ✓' : 'Income added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save income entry.');
    }
}

function deleteIncome(id) {
    showInlineConfirm(id, 'income', () => {
        const deleted = incomeEntries.find(e => e.id === id);
        incomeEntries = incomeEntries.filter(e => e.id !== id);
        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        showUndoToast('Income entry deleted', () => { incomeEntries.push(deleted); saveData().catch(err => console.error('Debt Snowball: save failed —', err)); });
    });
}

// ─── Paid-this-month toggle ───────────────────────────────────────────────────
function togglePaid(id, autoPay) {
    const wasUnpaid = !paidStatus[id];
    if (paidStatus[id]) {
        delete paidStatus[id];
    } else {
        paidStatus[id] = autoPay ? 'autopay' : 'paid';
        if (wasUnpaid && debts.find(d => d.id === id)) {
            launchConfetti();
        }
    }
    // Micro-animation on the card being toggled
    const card = _root.querySelector(`.debt-card[data-cost-id="${id}"], .debt-card .btn-mark-paid-action[data-id="${id}"]`)
        ?.closest('.debt-card');
    if (card) {
        card.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
        card.style.transform  = 'scale(0.99)';
        card.style.opacity    = '0.8';
        setTimeout(() => {
            card.style.transform = '';
            card.style.opacity   = '';
        }, 160);
    }
    saveData().catch(err => console.error('Debt Snowball: save failed —', err));
    renderRecurringCostsList();
    renderDebtsList(runSimulation(strategy));
}

// ─── Inline Confirm & Undo Toast ─────────────────────────────────────────────
function showInlineConfirm(id, type, onConfirm) {
    const selector = type === 'debt' ? '.btn-delete' : type === 'cost' ? '.btn-delete-cost' : '.btn-delete-income';
    const btn      = _root.querySelector(`${selector}[data-id="${id}"]`);
    if (!btn) return;

    const actions      = btn.parentElement;
    const originalHTML = actions.innerHTML;

    actions.innerHTML = `
        <span class="confirm-text">Are you sure?</span>
        <button class="btn btn-danger btn-confirm-yes" data-id="${id}">Delete</button>
        <button class="btn btn-secondary btn-confirm-no">Cancel</button>`;

    actions.querySelector('.btn-confirm-yes').addEventListener('click', onConfirm);
    actions.querySelector('.btn-confirm-no').addEventListener('click', () => {
        actions.innerHTML = originalHTML;
        const editBtn   = actions.querySelector('.btn-edit, .btn-edit-cost, .btn-edit-income');
        const deleteBtn = actions.querySelector('.btn-delete, .btn-delete-cost, .btn-delete-income');
        if (editBtn)   { const fn = type==='debt'?openDebtModal:type==='cost'?openCostModal:openIncomeModal; editBtn.addEventListener('click', e=>fn(e.target.dataset.id)); }
        if (deleteBtn) { const fn = type==='debt'?deleteDebt:type==='cost'?deleteCost:deleteIncome; deleteBtn.addEventListener('click', e=>fn(e.target.dataset.id)); }
    });
}

let undoToastTimer = null;
function showUndoToast(message, onUndo) {
    const existing = _root.getElementById('undo-toast');
    if (existing) existing.remove();
    if (undoToastTimer) clearTimeout(undoToastTimer);

    const toast     = document.createElement('div');
    toast.id        = 'undo-toast';
    toast.className = 'undo-toast';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span><button class="undo-toast-btn">Undo</button>`;
    _root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    toast.querySelector('.undo-toast-btn').addEventListener('click', () => { onUndo(); dismissToast(toast); });
    undoToastTimer = setTimeout(() => dismissToast(toast), 5000);
}

function dismissToast(toast) {
    toast.classList.remove('undo-toast-visible');
    setTimeout(() => toast.remove(), 300);
}

function showSavedToast(message) {
    const existing = _root.getElementById('saved-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'saved-toast';
    toast.className = 'undo-toast undo-toast-success';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    _root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 2500);
}

function showErrorToast(message) {
    const existing = _root.getElementById('error-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'error-toast';
    toast.className = 'undo-toast undo-toast-error';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    _root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 4000);
}

// ─── HA Sensor Bridge ────────────────────────────────────────────────────────
function updateHASensors(simResults, schedule) {
    if (!_root._hass) return; // Safety check: Ensure HA object exists

    // 1. Push Total Debt Sensor
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    _root._hass.callApi('POST', 'states/sensor.snowball_total_debt', {
        state: totalDebt.toFixed(2),
        attributes: {
            friendly_name: 'Total Remaining Debt',
            unit_of_measurement: _root._currency || 'USD',
            icon: 'mdi:cash-multiple'
        }
    });

    // 2. Push Payoff Date Sensor
    if (simResults && simResults.valid && simResults.monthsElapsed < 1200) {
        const today = new Date();
        const payoffDate = new Date(today.getFullYear(), today.getMonth() + simResults.monthsElapsed, 1);
        _root._hass.callApi('POST', 'states/sensor.snowball_payoff_date', {
            state: payoffDate.toISOString().split('T')[0],
            attributes: {
                friendly_name: 'Debt Free Date',
                device_class: 'date',
                icon: 'mdi:calendar-star'
            }
        });
    }

    // 3. Push Next Upcoming Payment Sensor
    if (schedule && schedule.length > 0) {
        const currentDay = new Date().getDate();
        // Find the next unpaid debt in the schedule that is due today or later
        const nextPayment = schedule.find(item => 
            item.type === 'debt' && 
            !paidStatus[item.id] && 
            item.day >= currentDay
        );

        if (nextPayment) {
            _root._hass.callApi('POST', 'states/sensor.snowball_next_payment', {
                state: nextPayment.amount.toFixed(2),
                attributes: {
                    friendly_name: 'Next Debt Payment',
                    unit_of_measurement: _root._currency || 'USD',
                    debt_name: nextPayment.name,
                    due_day: nextPayment.day,
                    icon: 'mdi:calendar-clock'
                }
            });
        } else {
            // All caught up for the month!
            _root._hass.callApi('POST', 'states/sensor.snowball_next_payment', {
                state: '0.00',
                attributes: {
                    friendly_name: 'Next Debt Payment',
                    debt_name: 'All Caught Up!',
                    icon: 'mdi:check-circle'
                }
            });
        }
    }
}

// ─── Rendering ───────────────────────────────────────────────────────────────
function renderUI() {
    // Render checkpoints list
    renderCheckpointsList();

    _root.querySelectorAll('.strategy-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.strategy === strategy);
    });
    renderIncomeList();
    renderRecurringCostsList();
    renderSpendingBudgets();
    
    const simResults = runSimulation(strategy);
    renderDebtsList(simResults);
    renderVisualization(simResults);
    
    const schedule = renderPaymentPlan();

    // Only update HA sensors from current-month data; renderPaymentPlan returns null in archive view
    if (schedule !== null) updateHASensors(simResults, schedule);
}
