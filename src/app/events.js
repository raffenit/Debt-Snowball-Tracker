import { appState } from './state.js';
import { currentMonthKey } from '../core/date-utils.js';
import { formatOrdinal } from '../core/pure-utils.js';
import { advanceToNextMonth } from './advance.js';
import { closeArchiveModal, openArchiveModal, updateCostModalIntervalVisibility } from './modals.js';
import { closeCostModal, closeDebtModal, closeIncomeModal, openCostModal, openDebtModal, openIncomeModal, renderUI, saveCost, saveDebt, saveIncome, showErrorToast, showSanityWarningsModal, showSavedToast, togglePaid, updateIncomeScheduleHint } from './render-modals.js';
import { closeCheckpointModal, openCheckpointModal, renderCheckpointsList, saveCheckpoint } from './render-checkpoints.js';
import { closeBudgetModal, closeExpenseModal, convertExpenseToBill, deleteBudget, deleteExpense, getWorkingBudgets, moveExpenseToBudget, openBudgetModal, openExpenseModal, renderSpendingBudgets, saveBudget, saveExpense } from './render-budgets.js';
import { reorderBudgets } from '../core/budgets.js';
import { renderRecurringCostsList } from './render-lists.js';
import { exportData, importData } from './render-export.js';
import { saveData, saveDataAndRender, createServerBackup } from './storage.js';
import { reportError } from './error-report.js';
import { renderPaymentPlan } from './render-payment.js';
import { autoCalcMinPayment, autoCalcMinPaymentCC, calcWindfall, closeWindfallModal, openWindfallModal, updateAutoMinHint } from './render-support.js';

// ─── Event Listeners ─────────────────────────────────────────────────────────
function setupEventListeners() {

    // ── Global ripple effect on all .btn clicks ───────────────────────────────
    appState._root.addEventListener('click', e => {
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

    appState.addDebtBtn.addEventListener('click',   () => openDebtModal());
    appState.addCostBtn.addEventListener('click',   () => openCostModal());
    appState.addIncomeBtn.addEventListener('click', () => openIncomeModal());
    appState._root.getElementById('advance-month-btn').addEventListener('click', advanceToNextMonth);
    appState._root.getElementById('add-budget-btn').addEventListener('click', () => openBudgetModal());

    // Delegated toggle for collapsible cost sections (utility / subscription)
    appState.costsListContainer.addEventListener('click', e => {
        const toggle = e.target.closest('[data-toggle-section]');
        if (!toggle) return;
        const key = toggle.dataset.toggleSection;
        if (appState.expandedCostSections.has(key)) appState.expandedCostSections.delete(key);
        else appState.expandedCostSections.add(key);
        renderRecurringCostsList();
    });

    appState._root.querySelectorAll('.close-budget-modal').forEach(b  => b.addEventListener('click', closeBudgetModal));
    appState._root.querySelectorAll('.close-expense-modal').forEach(b => b.addEventListener('click', closeExpenseModal));

    appState.budgetForm.addEventListener('submit',  e => { e.preventDefault(); saveBudget(); });
    appState.expenseForm.addEventListener('submit', e => { e.preventDefault(); saveExpense(); });

    appState._root.getElementById('budget-exception-toggle').addEventListener('change', () => {
        const show = appState._root.getElementById('budget-exception-toggle').checked;
        appState._root.getElementById('budget-exception-amount-group').style.display = show ? '' : 'none';
    });

    // Delegated click handler for all budget card interactions
    appState._root.getElementById('budgets-list').addEventListener('click', e => {
        const toggle = e.target.closest('[data-toggle-budget]');
        // Buttons inside the header (edit, etc.) get their own handlers — don't toggle
        if (toggle && !e.target.closest('button')) {
            const bid = toggle.dataset.toggleBudget;
            if (appState.expandedBudgets.has(bid)) {
                appState.expandedBudgets.delete(bid);
                // Close inline form too when collapsing
                if (appState.inlineExpenseBudget === bid) appState.inlineExpenseBudget = null;
            } else {
                appState.expandedBudgets.add(bid);
            }
            renderSpendingBudgets();
            return;
        }

        // Inline expense toggle (open/close inline form)
        const inlineToggle = e.target.closest('.btn-toggle-inline-expense');
        if (inlineToggle) {
            const bid = inlineToggle.dataset.budgetId;
            appState.inlineExpenseBudget = (appState.inlineExpenseBudget === bid) ? null : bid;
            appState.expandedBudgets.add(bid); // Ensure card is expanded
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
            const method = form.querySelector('.inline-method')?.value || 'card';
            if (!desc)              { showErrorToast('Please enter a description.'); return; }
            if (isNaN(amount) || amount < 0) { showErrorToast('Please enter a valid amount.'); return; }
            // Archive-aware: budget cards may belong to an archived month
            const budget = getWorkingBudgets().find(b => b.id === bid);
            if (!budget) return;
            if (!budget.expenses) budget.expenses = [];
            // Card expenses link automatically when exactly one card exists —
            // otherwise unlinked (assign via the row's ✎ button).
            const cards = appState.debts.filter(d => d.type === 'credit-card');
            const prefCard = appState.expenseDefaults?.cardDebtId;
            const cardDebtId = method === 'card'
                ? (cards.some(d => d.id === prefCard) ? prefCard : (cards.length === 1 ? cards[0].id : undefined))
                : undefined;
            budget.expenses.push({ id: Date.now().toString(), description: desc, amount, date, paymentMethod: method, cardDebtId });
            appState.inlineExpenseBudget = null;
            appState.expandedBudgets.add(bid);
            saveDataAndRender();
            renderSpendingBudgets();
            showSavedToast('Expense added ✓');
            return;
        }

        // Inline cancel button
        const inlineCancel = e.target.closest('.btn-inline-cancel');
        if (inlineCancel) {
            appState.inlineExpenseBudget = null;
            renderSpendingBudgets();
            return;
        }

        // One-click card ↔ cash/debit toggle on manual expense rows
        const methodToggle = e.target.closest('.expense-method-toggle');
        if (methodToggle) {
            const budget = getWorkingBudgets().find(b => b.id === methodToggle.dataset.budgetId);
            const exp    = budget?.expenses?.find(x => x.id === methodToggle.dataset.expenseId);
            if (!exp || exp.autoCard) return;
            const toCard = exp.paymentMethod !== 'card';
            exp.paymentMethod = toCard ? 'card' : 'direct';
            if (toCard && !exp.cardDebtId) {
                const prefCard = appState.expenseDefaults?.cardDebtId;
                const cards = appState.debts.filter(d => d.type === 'credit-card');
                const cardId = cards.some(d => d.id === prefCard) ? prefCard : (cards.length === 1 ? cards[0].id : undefined);
                if (cardId) exp.cardDebtId = cardId;
            }
            saveDataAndRender();
            showSavedToast(toCard ? 'Marked as card charge — removed from cash flow 💳' : 'Marked as cash/debit — back in cash flow 🏦');
            return;
        }

        // Edit expense (opens modal for editing)
        const editExp = e.target.closest('.btn-edit-expense');
        if (editExp) { openExpenseModal(editExp.dataset.budgetId, editExp.dataset.expenseId); return; }

        // Convert manual expense to a recurring bill
        const toRecurring = e.target.closest('.btn-expense-torecurring');
        if (toRecurring) { convertExpenseToBill(toRecurring.dataset.budgetId, toRecurring.dataset.expenseId); return; }

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

    // ── Expense-entry defaults (persisted prefs in the Budgets header) ───────
    appState._root.getElementById('expense-default-method')?.addEventListener('change', e => {
        appState.expenseDefaults = { ...(appState.expenseDefaults || {}), paymentMethod: e.target.value };
        saveDataAndRender();
    });
    appState._root.getElementById('expense-default-card')?.addEventListener('change', e => {
        appState.expenseDefaults = { ...(appState.expenseDefaults || {}), cardDebtId: e.target.value || null };
        saveDataAndRender();
    });

    // ── Drag & drop: move expenses between budgets ────────────────────────────
    const budgetsList = appState._root.getElementById('budgets-list');

    budgetsList.addEventListener('dragstart', e => {
        const handle = e.target.closest('.budget-drag-handle');
        if (handle) {
            const card = handle.closest('.budget-card');
            if (!card) return;
            appState._budgetDragId = card.dataset.budgetId;
            e.dataTransfer.setData('text/plain', JSON.stringify({
                budgetDragId: card.dataset.budgetId,
            }));
            e.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging');
            return;
        }
        const row = e.target.closest('.budget-expense-row[draggable="true"]');
        if (!row) return;
        e.dataTransfer.setData('text/plain', JSON.stringify({
            expenseId: row.dataset.expenseId,
            budgetId:  row.dataset.budgetId,
        }));
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('dragging');
    });
    budgetsList.addEventListener('dragend', e => {
        appState._budgetDragId = null;
        e.target.closest('.budget-expense-row')?.classList.remove('dragging');
        e.target.closest('.budget-card')?.classList.remove('dragging');
        budgetsList.querySelectorAll('.budget-drop-target, .budget-reorder-target').forEach(c => c.classList.remove('budget-drop-target', 'budget-reorder-target'));
    });
    budgetsList.addEventListener('dragover', e => {
        const card = e.target.closest('.budget-card');
        if (!card) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (appState._budgetDragId) {
            // Reorder mode — highlight the insertion target, not the source card
            budgetsList.querySelectorAll('.budget-reorder-target').forEach(c => { if (c !== card) c.classList.remove('budget-reorder-target'); });
            if (card.dataset.budgetId !== appState._budgetDragId) card.classList.add('budget-reorder-target');
            return;
        }
        budgetsList.querySelectorAll('.budget-drop-target').forEach(c => { if (c !== card) c.classList.remove('budget-drop-target'); });
        card.classList.add('budget-drop-target');
    });
    budgetsList.addEventListener('dragleave', e => {
        const card = e.target.closest('.budget-card');
        if (card && !card.contains(e.relatedTarget)) card.classList.remove('budget-drop-target', 'budget-reorder-target');
    });
    budgetsList.addEventListener('drop', e => {
        const card = e.target.closest('.budget-card');
        if (!card) return;
        e.preventDefault();
        card.classList.remove('budget-drop-target', 'budget-reorder-target');
        let payload;
        try { payload = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
        if (payload?.budgetDragId) {
            // Reorder is structural — live month only (handles aren't rendered in archive view)
            if (appState.viewingArchiveIndex !== null) return;
            const next = reorderBudgets(appState.spendingBudgets, payload.budgetDragId, card.dataset.budgetId);
            if (next === appState.spendingBudgets) return;
            appState.spendingBudgets = next;
            saveDataAndRender();
            showSavedToast('Budget order updated ✓');
            return;
        }
        if (!payload?.expenseId) return;
        moveExpenseToBudget(payload.expenseId, payload.budgetId, card.dataset.budgetId);
    });

    // ── Drag & drop: re-date expenses in the cash flow plan ──────────────────
    const planList = appState._root.getElementById('payment-plan-list');

    planList.addEventListener('dragstart', e => {
        const row = e.target.closest('.schedule-row[draggable="true"]');
        if (!row) return;
        e.dataTransfer.setData('text/plain', JSON.stringify({
            expenseId: row.dataset.expenseId,
            budgetId:  row.dataset.budgetId,
        }));
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('dragging');
    });
    planList.addEventListener('dragend', e => {
        e.target.closest('.schedule-row')?.classList.remove('dragging');
        planList.querySelectorAll('.drop-target').forEach(r => r.classList.remove('drop-target'));
    });
    planList.addEventListener('dragover', e => {
        const row = e.target.closest('.schedule-row');
        if (!row) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        planList.querySelectorAll('.drop-target').forEach(r => { if (r !== row) r.classList.remove('drop-target'); });
        row.classList.add('drop-target');
    });
    planList.addEventListener('dragleave', e => {
        const row = e.target.closest('.schedule-row');
        if (row && !row.contains(e.relatedTarget)) row.classList.remove('drop-target');
    });
    planList.addEventListener('drop', e => {
        const row = e.target.closest('.schedule-row');
        if (!row) return;
        e.preventDefault();
        row.classList.remove('drop-target');
        let payload;
        try { payload = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
        if (!payload?.expenseId || !payload?.budgetId) return;
        const day = parseInt(row.dataset.day);
        if (!day) return;
        const budget = getWorkingBudgets().find(b => b.id === payload.budgetId);
        const exp = budget?.expenses?.find(x => x.id === payload.expenseId);
        if (!exp || exp.autoCard) return;
        const mk = appState.workingMonthKey || currentMonthKey();
        const [y, m] = mk.split('-').map(Number);
        const lastDay = new Date(y, m + 1, 0).getDate();
        const newDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
        if (exp.date === newDate) return;
        exp.date = newDate;
        saveDataAndRender();
        showSavedToast(`Expense moved to ${formatOrdinal(day)} ✓`);
    });

    // Inline expense form — keyboard handling
    appState._root.getElementById('budgets-list').addEventListener('keydown', e => {
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

    appState._root.querySelectorAll('.close-debt-modal').forEach(b       => b.addEventListener('click', closeDebtModal));
    appState._root.querySelectorAll('.close-cost-modal').forEach(b       => b.addEventListener('click', closeCostModal));
    appState._root.querySelectorAll('.close-income-modal').forEach(b     => b.addEventListener('click', closeIncomeModal));
    appState._root.querySelectorAll('.close-checkpoint-modal').forEach(b  => b.addEventListener('click', closeCheckpointModal));

    appState.debtForm.addEventListener('submit',       e => { e.preventDefault(); saveDebt(); });
    appState.checkpointForm.addEventListener('submit', e => { e.preventDefault(); saveCheckpoint(); });
    appState.costForm.addEventListener('submit',       e => { e.preventDefault(); saveCost(); });
    appState.incomeForm.addEventListener('submit',     e => { e.preventDefault(); saveIncome(); });

    appState.exportBtn.addEventListener('click', exportData);
    appState.importFileInput.addEventListener('change', importData);

    // Add new checkpoint inline form
    appState._root.getElementById('add-checkpoint-btn').addEventListener('click', () => {
        const dayInput = appState._root.getElementById('new-checkpoint-day');
        const amountInput = appState._root.getElementById('new-checkpoint-amount');
        const day = parseInt(dayInput.value);
        const amount = parseFloat(amountInput.value);

        if (!day || !Number.isFinite(amount) || amount < 0) {
            showErrorToast('Please enter a valid day and amount');
            return;
        }

        // Check for duplicate day
        if (appState.checkpoints.some(cp => cp.day === day)) {
            showErrorToast(`A checkpoint for day ${day} already exists`);
            return;
        }

        const newCheckpoint = {
            id: 'cp_' + Date.now(),
            day,
            amount
        };
        appState.checkpoints.push(newCheckpoint);
        appState.checkpoints.sort((a, b) => a.day - b.day);

        saveData().then(() => {
            renderCheckpointsList();
            renderUI();
            amountInput.value = '';
            showSavedToast('Checkpoint added ✓');
        }).catch(err => reportError("Save failed — your change may not persist after reload", err));
    });

    // Delete checkpoint handler (delegated)
    appState._root.getElementById('checkpoints-list').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-checkpoint-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            appState.checkpoints = appState.checkpoints.filter(c => c.id !== id);
            saveData().then(() => {
                renderCheckpointsList();
                renderUI();
                showSavedToast('Checkpoint removed ✓');
            }).catch(err => reportError("Save failed — your change may not persist after reload", err));
        }
    });

    // Payment plan month navigation
    appState._root.getElementById('plan-prev-month-btn').addEventListener('click', () => {
        const btn = appState._root.getElementById('plan-prev-month-btn');
        const idx = parseInt(btn.dataset.archiveIdx ?? '0');
        if (idx < appState.monthlyArchives.length) {
            appState.viewingArchiveIndex = idx;
            // Archive months are editable (expense corrections) — take one
            // server backup per session before first entering archive view,
            // so there's a restore point if an edit goes wrong.
            if (!appState._archiveBackupDone) {
                appState._archiveBackupDone = true;
                createServerBackup('archive view')
                    .catch(err => reportError('Automatic backup failed — archive edits will not have a restore point', err));
            }
            renderUI();
        }
    });
    appState._root.getElementById('plan-next-month-btn').addEventListener('click', () => {
        appState.viewingArchiveIndex = null;
        renderUI();
    });

    // Income schedule type hint
    appState._root.getElementById('income-schedule').addEventListener('change', updateIncomeScheduleHint);

    // Sanity warnings badge — reopens the anomaly review modal
    appState._root.getElementById('sanity-badge')?.addEventListener('click', showSanityWarningsModal);

    // Archive / History
    appState._root.getElementById('history-btn').addEventListener('click', openArchiveModal);
    appState._root.getElementById('close-archive-modal').addEventListener('click', closeArchiveModal);
    appState._root.getElementById('archive-modal').addEventListener('click', e => {
        if (e.target === appState._root.getElementById('archive-modal')) closeArchiveModal();
    });

    // Windfall planner
    appState._root.getElementById('windfall-btn').addEventListener('click', openWindfallModal);
    appState._root.getElementById('close-windfall-modal').addEventListener('click', closeWindfallModal);
    appState._root.getElementById('windfall-calc-btn').addEventListener('click', calcWindfall);
    appState.windfallModal.addEventListener('click', e => { if (e.target === appState.windfallModal) closeWindfallModal(); });

    // Check-in modal
    appState._root.getElementById('checkin-later-btn').addEventListener('click', () => {
        localStorage.setItem('snowball_checkin_dismissed', currentMonthKey());
        appState.checkinModal.classList.remove('active');
        setTimeout(() => { appState.checkinModal.style.display = 'none'; }, 300);
    });
    appState._root.getElementById('checkin-done-btn').addEventListener('click', () => {
        localStorage.setItem('snowball_checkin_dismissed', currentMonthKey());
        appState.checkinModal.classList.remove('active');
        setTimeout(() => { appState.checkinModal.style.display = 'none'; }, 300);
    });

    // Cost modal: show/hide interval fields based on category and interval select
    appState._root.getElementById('cost-category').addEventListener('change', updateCostModalIntervalVisibility);
    appState._root.getElementById('cost-interval').addEventListener('change', updateCostModalIntervalVisibility);
    appState._root.getElementById('cost-payment-method').addEventListener('change', updateCostModalIntervalVisibility);

    // Expense modal: show the card picker only when paid by credit card
    appState._root.getElementById('expense-payment-method')?.addEventListener('change', e => {
        const grp = appState._root.getElementById('expense-card-debt-group');
        if (grp) grp.style.display = e.target.value === 'card' ? '' : 'none';
    });

    // Auto min-payment calc
    appState._root.getElementById('auto-min-btn').addEventListener('click', autoCalcMinPaymentCC);
    appState._root.getElementById('debt-balance').addEventListener('input', updateAutoMinHint);
    appState._root.getElementById('debt-rate').addEventListener('input', updateAutoMinHint);

    // Mortgage toggle
    appState._root.getElementById('mortgage-toggle-btn').addEventListener('click', () => {
        appState.showMortgage = !appState.showMortgage;
        saveData().then(() => renderUI()).catch(err => reportError("Save failed — your change may not persist after reload", err));
    });

    // Strategy toggle
    appState._root.querySelectorAll('.strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.strategy = btn.dataset.strategy;
            appState._root.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveData().then(() => renderUI()).catch(err => reportError("Save failed — your change may not persist after reload", err));
        });
    });

    // Payment plan "Mark as Paid" and inline "Edit" buttons
    appState._root.getElementById('payment-plan-list').addEventListener('click', e => {
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
            const form = appState._root.getElementById(`override-form-${overrideBtn.dataset.id}`);
            if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
            return;
        }
        const cancelBtn = e.target.closest('.btn-override-cancel');
        if (cancelBtn) {
            const form = appState._root.getElementById(`override-form-${cancelBtn.dataset.id}`);
            if (form) form.style.display = 'none';
            return;
        }
        const saveBtn = e.target.closest('.btn-override-save');
        if (saveBtn) {
            const id  = saveBtn.dataset.id;
            const form = appState._root.getElementById(`override-form-${id}`);
            const val  = parseFloat(form?.querySelector('.override-input')?.value);
            if (isNaN(val) || val < 0) { showErrorToast('Enter a valid amount.'); return; }
            appState.minPayOverrides[id] = val;
            saveDataAndRender();
            return;
        }
        const clearBtn = e.target.closest('.btn-override-clear');
        if (clearBtn) {
            delete appState.minPayOverrides[clearBtn.dataset.id];
            saveDataAndRender();
            return;
        }
    });

    // Backdrop + Escape
    [appState.debtModal, appState.costModal, appState.incomeModal, appState.checkpointModal].forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                if (modal === appState.debtModal)      closeDebtModal();
                else if (modal === appState.costModal) closeCostModal();
                else if (modal === appState.incomeModal) closeIncomeModal();
                else if (modal === appState.checkpointModal) closeCheckpointModal();
            }
        });
    });

    appState._root.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (appState.debtModal.classList.contains('active'))    closeDebtModal();
            else if (appState.costModal.classList.contains('active'))   closeCostModal();
            else if (appState.incomeModal.classList.contains('active')) closeIncomeModal();
            else if (appState.checkpointModal.classList.contains('active')) closeCheckpointModal();
        }
        if (e.key === 'Tab') {
            const active = [appState.debtModal, appState.costModal, appState.incomeModal, appState.checkpointModal].find(m => m.classList.contains('active'));
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
    const promoToggle      = appState._root.getElementById('debt-promo-toggle');
    const promoExpiryGroup = appState._root.getElementById('promo-expiry-group');
    const rateInput        = appState._root.getElementById('debt-rate');
    const rateGroup        = rateInput.closest('.input-group');

    promoToggle.addEventListener('change', () => {
        if (promoToggle.checked) {
            promoExpiryGroup.style.display = 'block';
            rateGroup.classList.add('input-disabled');
            rateInput.value = '0';
            rateInput.disabled = true;
            appState._root.getElementById('debt-promo-expiry').required = true;
            autoCalcMinPayment();
        } else {
            promoExpiryGroup.style.display = 'none';
            rateGroup.classList.remove('input-disabled');
            rateInput.value = '';
            rateInput.disabled = false;
            appState._root.getElementById('debt-promo-expiry').required = false;
            appState._root.getElementById('debt-promo-expiry').value = '';
        }
    });

    appState._root.getElementById('debt-promo-expiry').addEventListener('change', autoCalcMinPayment);
    appState._root.getElementById('debt-balance').addEventListener('input', () => {
        if (appState._root.getElementById('debt-promo-toggle').checked) autoCalcMinPayment();
    });
}


export { setupEventListeners };
