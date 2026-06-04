// ─── Event Listeners ─────────────────────────────────────────────────────────
function setupEventListeners() {

    // ── Global ripple effect on all .btn clicks ───────────────────────────────
    _root.addEventListener('click', e => {
        const btn = e.target.closest('.btn');
        if (!btn || btn.disabled) return;
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            left: ${e.clientX - rect.left - size/2}px;
            top:  ${e.clientY - rect.top  - size/2}px;
            width: ${size}px;
            height: ${size}px;
        `;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }, true);

    addDebtBtn.addEventListener('click',   () => openDebtModal());
    addCostBtn.addEventListener('click',   () => openCostModal());
    addIncomeBtn.addEventListener('click', () => openIncomeModal());
    _root.getElementById('advance-month-btn').addEventListener('click', advanceToNextMonth);
    _root.getElementById('add-budget-btn').addEventListener('click', () => openBudgetModal());

    // Delegated toggle for collapsible cost sections (utility / subscription)
    costsListContainer.addEventListener('click', e => {
        const toggle = e.target.closest('[data-toggle-section]');
        if (!toggle) return;
        const key = toggle.dataset.toggleSection;
        if (expandedCostSections.has(key)) expandedCostSections.delete(key);
        else expandedCostSections.add(key);
        renderRecurringCostsList();
    });

    _root.querySelectorAll('.close-budget-modal').forEach(b  => b.addEventListener('click', closeBudgetModal));
    _root.querySelectorAll('.close-expense-modal').forEach(b => b.addEventListener('click', closeExpenseModal));

    budgetForm.addEventListener('submit',  e => { e.preventDefault(); saveBudget(); });
    expenseForm.addEventListener('submit', e => { e.preventDefault(); saveExpense(); });

    _root.getElementById('budget-exception-toggle').addEventListener('change', () => {
        const show = _root.getElementById('budget-exception-toggle').checked;
        _root.getElementById('budget-exception-amount-group').style.display = show ? '' : 'none';
    });

    // Delegated click handler for all budget card interactions
    _root.getElementById('budgets-list').addEventListener('click', e => {
        const toggle = e.target.closest('[data-toggle-budget]');
        if (toggle) {
            const bid = toggle.dataset.toggleBudget;
            if (expandedBudgets.has(bid)) {
                expandedBudgets.delete(bid);
                // Close inline form too when collapsing
                if (inlineExpenseBudget === bid) inlineExpenseBudget = null;
            } else {
                expandedBudgets.add(bid);
            }
            renderSpendingBudgets();
            return;
        }

        // Inline expense toggle (open/close inline form)
        const inlineToggle = e.target.closest('.btn-toggle-inline-expense');
        if (inlineToggle) {
            const bid = inlineToggle.dataset.budgetId;
            inlineExpenseBudget = (inlineExpenseBudget === bid) ? null : bid;
            expandedBudgets.add(bid); // Ensure card is expanded
            renderSpendingBudgets();
            return;
        }

        // Inline save button
        const inlineSave = e.target.closest('.btn-inline-save');
        if (inlineSave) {
            const bid = inlineSave.dataset.budgetId;
            const form = inlineSave.closest('.inline-expense-form');
            if (!form) return;
            const desc   = form.querySelector('.inline-desc').value.trim();
            const amount = parseFloat(form.querySelector('.inline-amount').value);
            const date   = form.querySelector('.inline-date').value;
            if (!desc)              { showErrorToast('Please enter a description.'); return; }
            if (isNaN(amount) || amount < 0) { showErrorToast('Please enter a valid amount.'); return; }
            const budget = spendingBudgets.find(b => b.id === bid);
            if (!budget) return;
            if (!budget.expenses) budget.expenses = [];
            budget.expenses.push({ id: Date.now().toString(), description: desc, amount, date });
            inlineExpenseBudget = null;
            expandedBudgets.add(bid);
            saveData().catch(err => console.error('Debt Snowball: save failed —', err));
            renderSpendingBudgets();
            showSavedToast('Expense added ✓');
            return;
        }

        // Inline cancel button
        const inlineCancel = e.target.closest('.btn-inline-cancel');
        if (inlineCancel) {
            inlineExpenseBudget = null;
            renderSpendingBudgets();
            return;
        }

        // Edit expense (opens modal for editing)
        const editExp = e.target.closest('.btn-edit-expense');
        if (editExp) { openExpenseModal(editExp.dataset.budgetId, editExp.dataset.expenseId); return; }

        const delExp = e.target.closest('.btn-delete-expense');
        if (delExp) {
            // Animate the row out before removing
            const row = delExp.closest('.budget-expense-row');
            if (row) {
                row.classList.add('expense-removing');
                setTimeout(() => deleteExpense(delExp.dataset.budgetId, delExp.dataset.expenseId), 280);
            } else {
                deleteExpense(delExp.dataset.budgetId, delExp.dataset.expenseId);
            }
            return;
        }

        const override = e.target.closest('.btn-override-budget');
        if (override) { openBudgetModal(override.dataset.budgetId, true); return; }

        const editBudget = e.target.closest('.btn-edit-budget');
        if (editBudget) { openBudgetModal(editBudget.dataset.budgetId); return; }

        const delBudget = e.target.closest('.btn-delete-budget');
        if (delBudget) { deleteBudget(delBudget.dataset.budgetId); return; }
    });

    // Inline expense form — keyboard handling
    _root.getElementById('budgets-list').addEventListener('keydown', e => {
        const form = e.target.closest('.inline-expense-form');
        if (!form) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            const saveBtn = form.querySelector('.btn-inline-save');
            if (saveBtn) saveBtn.click();
        } else if (e.key === 'Escape') {
            const cancelBtn = form.querySelector('.btn-inline-cancel');
            if (cancelBtn) cancelBtn.click();
        }
    });

    _root.querySelectorAll('.close-debt-modal').forEach(b       => b.addEventListener('click', closeDebtModal));
    _root.querySelectorAll('.close-cost-modal').forEach(b       => b.addEventListener('click', closeCostModal));
    _root.querySelectorAll('.close-income-modal').forEach(b     => b.addEventListener('click', closeIncomeModal));
    _root.querySelectorAll('.close-checkpoint-modal').forEach(b  => b.addEventListener('click', closeCheckpointModal));

    debtForm.addEventListener('submit',       e => { e.preventDefault(); saveDebt(); });
    checkpointForm.addEventListener('submit', e => { e.preventDefault(); saveCheckpoint(); });
    costForm.addEventListener('submit',       e => { e.preventDefault(); saveCost(); });
    incomeForm.addEventListener('submit',     e => { e.preventDefault(); saveIncome(); });

    exportBtn.addEventListener('click', exportData);
    importFileInput.addEventListener('change', importData);

    // Add new checkpoint inline form
    _root.getElementById('add-checkpoint-btn').addEventListener('click', () => {
        const dayInput = _root.getElementById('new-checkpoint-day');
        const amountInput = _root.getElementById('new-checkpoint-amount');
        const day = parseInt(dayInput.value);
        const amount = parseFloat(amountInput.value);

        if (!day || !Number.isFinite(amount) || amount < 0) {
            showErrorToast('Please enter a valid day and amount');
            return;
        }

        // Check for duplicate day
        if (checkpoints.some(cp => cp.day === day)) {
            showErrorToast(`A checkpoint for day ${day} already exists`);
            return;
        }

        const newCheckpoint = {
            id: 'cp_' + Date.now(),
            day,
            amount
        };
        checkpoints.push(newCheckpoint);
        checkpoints.sort((a, b) => a.day - b.day);

        saveData().then(() => {
            renderCheckpointsList();
            renderUI();
            amountInput.value = '';
            showSavedToast('Checkpoint added ✓');
        }).catch(err => console.error("Debt Snowball: save failed —", err));
    });

    // Delete checkpoint handler (delegated)
    _root.getElementById('checkpoints-list').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-checkpoint-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            checkpoints = checkpoints.filter(c => c.id !== id);
            saveData().then(() => {
                renderCheckpointsList();
                renderUI();
                showSavedToast('Checkpoint removed ✓');
            }).catch(err => console.error("Debt Snowball: save failed —", err));
        }
    });

    // Payment plan month navigation
    _root.getElementById('plan-prev-month-btn').addEventListener('click', () => {
        const btn = _root.getElementById('plan-prev-month-btn');
        const idx = parseInt(btn.dataset.archiveIdx ?? '0');
        if (idx < monthlyArchives.length) { viewingArchiveIndex = idx; renderUI(); }
    });
    _root.getElementById('plan-next-month-btn').addEventListener('click', () => {
        viewingArchiveIndex = null;
        renderUI();
    });

    // Income schedule type hint
    _root.getElementById('income-schedule').addEventListener('change', updateIncomeScheduleHint);

    // Archive / History
    _root.getElementById('history-btn').addEventListener('click', openArchiveModal);
    _root.getElementById('close-archive-modal').addEventListener('click', closeArchiveModal);
    _root.getElementById('archive-modal').addEventListener('click', e => {
        if (e.target === _root.getElementById('archive-modal')) closeArchiveModal();
    });

    // Windfall planner
    _root.getElementById('windfall-btn').addEventListener('click', openWindfallModal);
    _root.getElementById('close-windfall-modal').addEventListener('click', closeWindfallModal);
    _root.getElementById('windfall-calc-btn').addEventListener('click', calcWindfall);
    windfallModal.addEventListener('click', e => { if (e.target === windfallModal) closeWindfallModal(); });

    // Check-in modal
    _root.getElementById('checkin-later-btn').addEventListener('click', () => {
        localStorage.setItem('snowball_checkin_dismissed', currentMonthKey());
        checkinModal.classList.remove('active');
        setTimeout(() => { checkinModal.style.display = 'none'; }, 300);
    });
    _root.getElementById('checkin-done-btn').addEventListener('click', () => {
        localStorage.setItem('snowball_checkin_dismissed', currentMonthKey());
        checkinModal.classList.remove('active');
        setTimeout(() => { checkinModal.style.display = 'none'; }, 300);
    });

    // Cost modal: show/hide interval fields based on category and interval select
    _root.getElementById('cost-category').addEventListener('change', updateCostModalIntervalVisibility);
    _root.getElementById('cost-interval').addEventListener('change', updateCostModalIntervalVisibility);

    // Auto min-payment calc
    _root.getElementById('auto-min-btn').addEventListener('click', autoCalcMinPaymentCC);
    _root.getElementById('debt-balance').addEventListener('input', updateAutoMinHint);
    _root.getElementById('debt-rate').addEventListener('input', updateAutoMinHint);

    // Mortgage toggle
    _root.getElementById('mortgage-toggle-btn').addEventListener('click', () => {
        showMortgage = !showMortgage;
        saveData().then(() => renderUI()).catch(err => console.error("Debt Snowball: save failed —", err));
    });

    // Strategy toggle
    _root.querySelectorAll('.strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            strategy = btn.dataset.strategy;
            _root.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveData().then(() => renderUI()).catch(err => console.error("Debt Snowball: save failed —", err));
        });
    });

    // Payment plan "Mark as Paid" and inline "Edit" buttons
    _root.getElementById('payment-plan-list').addEventListener('click', e => {
        const paidBtn = e.target.closest('.btn-mark-paid');
        if (paidBtn) {
            togglePaid(paidBtn.dataset.id, paidBtn.dataset.autopay === '1');
            return;
        }
        const editBtn = e.target.closest('.btn-edit-inline');
        if (editBtn) {
            const { id, type } = editBtn.dataset;
            if (type === 'debt') openDebtModal(id);
            else if (type === 'recurring') openCostModal(id);
            else if (type === 'income') openIncomeModal(id);
            else if (type === 'checkpoint') openCheckpointModal(id);
            return;
        }

        // Override min payment — toggle inline form
        const overrideBtn = e.target.closest('.btn-override-min');
        if (overrideBtn) {
            const form = _root.getElementById(`override-form-${overrideBtn.dataset.id}`);
            if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
            return;
        }
        const cancelBtn = e.target.closest('.btn-override-cancel');
        if (cancelBtn) {
            const form = _root.getElementById(`override-form-${cancelBtn.dataset.id}`);
            if (form) form.style.display = 'none';
            return;
        }
        const saveBtn = e.target.closest('.btn-override-save');
        if (saveBtn) {
            const id  = saveBtn.dataset.id;
            const form = _root.getElementById(`override-form-${id}`);
            const val  = parseFloat(form?.querySelector('.override-input')?.value);
            if (isNaN(val) || val < 0) { showErrorToast('Enter a valid amount.'); return; }
            minPayOverrides[id] = val;
            saveData().catch(err => console.error('Debt Snowball: save failed —', err));
            renderPaymentPlan();
            return;
        }
        const clearBtn = e.target.closest('.btn-override-clear');
        if (clearBtn) {
            delete minPayOverrides[clearBtn.dataset.id];
            saveData().catch(err => console.error('Debt Snowball: save failed —', err));
            renderPaymentPlan();
            return;
        }
    });

    // Backdrop + Escape
    [debtModal, costModal, incomeModal, checkpointModal].forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                if (modal === debtModal)      closeDebtModal();
                else if (modal === costModal) closeCostModal();
                else if (modal === incomeModal) closeIncomeModal();
                else if (modal === checkpointModal) closeCheckpointModal();
            }
        });
    });

    _root.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (debtModal.classList.contains('active'))    closeDebtModal();
            else if (costModal.classList.contains('active'))   closeCostModal();
            else if (incomeModal.classList.contains('active')) closeIncomeModal();
            else if (checkpointModal.classList.contains('active')) closeCheckpointModal();
        }
        if (e.key === 'Tab') {
            const active = [debtModal, costModal, incomeModal, checkpointModal].find(m => m.classList.contains('active'));
            if (!active) return;
            const focusable = active.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1")');
            if(focusable.length > 0) {
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
                else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
            }
        }
    });

    // Promo toggle
    const promoToggle      = _root.getElementById('debt-promo-toggle');
    const promoExpiryGroup = _root.getElementById('promo-expiry-group');
    const rateInput        = _root.getElementById('debt-rate');
    const rateGroup        = rateInput.closest('.input-group');

    promoToggle.addEventListener('change', () => {
        if (promoToggle.checked) {
            promoExpiryGroup.style.display = 'block';
            rateGroup.classList.add('input-disabled');
            rateInput.value = '0';
            rateInput.disabled = true;
            _root.getElementById('debt-promo-expiry').required = true;
            autoCalcMinPayment();
        } else {
            promoExpiryGroup.style.display = 'none';
            rateGroup.classList.remove('input-disabled');
            rateInput.value = '';
            rateInput.disabled = false;
            _root.getElementById('debt-promo-expiry').required = false;
            _root.getElementById('debt-promo-expiry').value = '';
        }
    });

    _root.getElementById('debt-promo-expiry').addEventListener('change', autoCalcMinPayment);
    _root.getElementById('debt-balance').addEventListener('input', () => {
        if (_root.getElementById('debt-promo-toggle').checked) autoCalcMinPayment();
    });
}

function autoCalcMinPayment() {
    if (!_root.getElementById('debt-promo-toggle').checked) return;
    const balance    = parseFloat(_root.getElementById('debt-balance').value) || 0;
    const expiryDate = _root.getElementById('debt-promo-expiry').value;
    if (!expiryDate || balance <= 0) return;
    const now    = new Date();
    const expiry = new Date(expiryDate + 'T00:00:00');
    const diff   = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    if (diff > 0) {
        _root.getElementById('debt-min-payment').value = (Math.ceil((balance / diff) * 100) / 100).toFixed(2);
    }
}
