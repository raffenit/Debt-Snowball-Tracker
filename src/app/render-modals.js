import { appState } from './state.js';
import { currentMonthKey, generateBiweeklyForMonth, htmlMonthToKey, isCostDueThisMonth, keyToHtmlMonth } from '../core/date-utils.js';
import { getStrategyOrder, runSimulation } from '../core/simulation.js';
import { updateCostModalIntervalVisibility } from './modals.js';
import { renderCheckpointsList } from './render-checkpoints.js';
import { renderSpendingBudgets } from './render-budgets.js';
import { renderDebtsList, renderIncomeList, renderRecurringCostsList } from './render-lists.js';
import { renderPaymentPlan, renderVisualization } from './render-payment.js';
import { saveData, saveDataAndRender } from './storage.js';
import { launchConfetti } from './render-support.js';

// ─── Debt Modal ──────────────────────────────────────────────────────────────
function openDebtModal(debtId = null) {
    appState.debtForm.reset();
    appState._root.getElementById('debt-id').value = '';

    const promoToggle      = appState._root.getElementById('debt-promo-toggle');
    const promoExpiryGroup = appState._root.getElementById('promo-expiry-group');
    const rateInput        = appState._root.getElementById('debt-rate');

    promoToggle.checked = false;
    promoExpiryGroup.style.display = 'none';
    rateInput.closest('.input-group').classList.remove('input-disabled');
    rateInput.disabled = false;
    appState._root.getElementById('debt-promo-expiry').value    = '';
    appState._root.getElementById('debt-promo-expiry').required = false;
    appState._root.getElementById('debt-autopay-toggle').checked = false;
    appState._root.getElementById('debt-url').value = '';

    if (debtId) {
        appState._root.getElementById('modal-title').textContent = 'Edit Debt';
        const debt = appState.debts.find(d => d.id === debtId);
        if (debt) {
            appState._root.getElementById('debt-id').value          = debt.id;
            appState._root.getElementById('debt-name').value        = debt.name;
            appState._root.getElementById('debt-type').value        = debt.type || 'credit-card';
            appState._root.getElementById('debt-balance').value     = debt.balance;
            appState._root.getElementById('debt-rate').value        = debt.rate;
            appState._root.getElementById('debt-min-payment').value = debt.minPayment;
            appState._root.getElementById('debt-due-day').value     = debt.dueDay || '';
            appState._root.getElementById('debt-autopay-toggle').checked = !!debt.autoPay;
            appState._root.getElementById('debt-url').value = debt.paymentUrl || '';
            if (debt.promoZeroInterest) {
                promoToggle.checked = true;
                promoExpiryGroup.style.display = 'block';
                rateInput.closest('.input-group').classList.add('input-disabled');
                rateInput.disabled = true;
                rateInput.value = '0';
                appState._root.getElementById('debt-promo-expiry').value    = debt.promoExpiryDate || '';
                appState._root.getElementById('debt-promo-expiry').required = true;
            }
        }
    } else {
        appState._root.getElementById('modal-title').textContent = 'Add New Debt';
        appState._root.getElementById('debt-type').value = 'credit-card';
    }

    appState.debtModal.style.display = 'flex';
    void appState.debtModal.offsetWidth;
    appState.debtModal.classList.add('active');
    setTimeout(() => appState.debtModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeDebtModal() {
    appState.debtModal.classList.remove('active');
    setTimeout(() => { appState.debtModal.style.display = 'none'; }, 300);
}

// ─── Recurring Cost Modal ────────────────────────────────────────────────────
function openCostModal(costId = null) {
    appState.costForm.reset();
    appState._root.getElementById('cost-id').value = '';
    appState._root.getElementById('cost-autopay-toggle').checked = false;

    if (costId) {
        appState._root.getElementById('cost-modal-title').textContent = 'Edit Cost';
        const cost = appState.recurringCosts.find(c => c.id === costId) || appState.oneTimeCosts.find(c => c.id === costId);
        if (cost) {
            appState._root.getElementById('cost-id').value              = cost.id;
            appState._root.getElementById('cost-name').value            = cost.name;
            appState._root.getElementById('cost-amount').value          = cost.amount;
            appState._root.getElementById('cost-due-day').value         = cost.dueDay || '';
            appState._root.getElementById('cost-category').value        = cost.category || 'other';
            appState._root.getElementById('cost-payment-method').value  = cost.paymentMethod || 'direct';
            appState._root.getElementById('cost-amount-type').value     = cost.amountType || 'fixed';
            appState._root.getElementById('cost-autopay-toggle').checked = !!cost.autoPay;
            // Restore interval
            const n = cost.intervalMonths || 1;
            const intervalEl = appState._root.getElementById('cost-interval');
            if ([1,2,3,6,12].includes(n)) {
                intervalEl.value = String(n);
            } else {
                intervalEl.value = 'custom';
                appState._root.getElementById('cost-interval-custom').value = n;
            }
            // Restore next due month
            if (n > 1 && cost.nextDueMonth) {
                appState._root.getElementById('cost-start-month').value = keyToHtmlMonth(cost.nextDueMonth);
            } else {
                appState._root.getElementById('cost-start-month').value = '';
            }
        }
    } else {
        appState._root.getElementById('cost-modal-title').textContent = 'Add Cost';
        appState._root.getElementById('cost-payment-method').value = 'direct';
        appState._root.getElementById('cost-amount-type').value = 'fixed';
        appState._root.getElementById('cost-interval').value = '1';
    }
    updateCostModalIntervalVisibility();

    appState.costModal.style.display = 'flex';
    void appState.costModal.offsetWidth;
    appState.costModal.classList.add('active');
    setTimeout(() => appState.costModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeCostModal() {
    appState.costModal.classList.remove('active');
    setTimeout(() => { appState.costModal.style.display = 'none'; }, 300);
}

// ─── Income Modal ────────────────────────────────────────────────────────────
function openIncomeModal(incomeId = null) {
    appState.incomeForm.reset();
    appState._root.getElementById('income-id').value = '';
    appState._root.getElementById('income-schedule').value = 'one-time';
    appState._root.getElementById('income-schedule-hint').style.display = 'none';

    if (incomeId) {
        appState._root.getElementById('income-modal-title').textContent = 'Edit Income Entry';
        const entry = appState.incomeEntries.find(e => e.id === incomeId);
        if (entry) {
            appState._root.getElementById('income-id').value       = entry.id;
            appState._root.getElementById('income-label').value    = entry.label;
            appState._root.getElementById('income-date').value     = entry.date;
            appState._root.getElementById('income-amount').value   = entry.amount;
            appState._root.getElementById('income-schedule').value = entry.scheduleType || 'one-time';
            updateIncomeScheduleHint();
        }
    } else {
        appState._root.getElementById('income-modal-title').textContent = 'Add Income Entry';
    }

    appState.incomeModal.style.display = 'flex';
    void appState.incomeModal.offsetWidth;
    appState.incomeModal.classList.add('active');
    setTimeout(() => appState.incomeModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function updateIncomeScheduleHint() {
    const sel  = appState._root.getElementById('income-schedule');
    const hint = appState._root.getElementById('income-schedule-hint');
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
    appState.incomeModal.classList.remove('active');
    setTimeout(() => { appState.incomeModal.style.display = 'none'; }, 300);
}

// ─── CRUD: Debts ─────────────────────────────────────────────────────────────
function saveDebt() {
    try {
        const id         = appState._root.getElementById('debt-id').value;
        const name       = appState._root.getElementById('debt-name').value;
        const type       = appState._root.getElementById('debt-type').value;
        const balance    = parseFloat(appState._root.getElementById('debt-balance').value);
        const rate       = parseFloat(appState._root.getElementById('debt-rate').value);
        const minPayment = parseFloat(appState._root.getElementById('debt-min-payment').value);
        const dueDay     = parseInt(appState._root.getElementById('debt-due-day').value) || 1;
        const autoPay    = appState._root.getElementById('debt-autopay-toggle').checked;
        const paymentUrl = appState._root.getElementById('debt-url').value.trim();

        const promoZeroInterest = appState._root.getElementById('debt-promo-toggle').checked;
        const promoExpiryDate   = promoZeroInterest ? appState._root.getElementById('debt-promo-expiry').value : null;

        if (!name.trim())          throw new Error('Please enter a name for this debt.');
        if (isNaN(balance))        throw new Error('Please enter a valid balance.');
        if (!promoZeroInterest && isNaN(rate)) throw new Error('Please enter a valid interest rate.');
        if (isNaN(minPayment))     throw new Error('Please enter a valid minimum payment.');

        const existingDebt = appState.debts.find(d => d.id === id);
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
            const idx = appState.debts.findIndex(d => d.id === id);
            if (idx !== -1) appState.debts[idx] = { id, ...debtData };
        } else {
            appState.debts.push({ id: Date.now().toString(), ...debtData });
        }

        saveDataAndRender();
        closeDebtModal();
        showSavedToast(id ? 'Debt updated ✓' : 'Debt added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save debt.');
    }
}

function deleteDebt(id) {
    showInlineConfirm(id, 'debt', () => {
        const deleted = appState.debts.find(d => d.id === id);
        appState.debts = appState.debts.filter(d => d.id !== id);
        delete appState.paidStatus[id];
        saveDataAndRender();
        showUndoToast('Debt deleted', () => { appState.debts.push(deleted); saveDataAndRender(); });
    });
}

// ─── CRUD: Recurring Costs ───────────────────────────────────────────────────
function saveCost() {
    try {
        const id            = appState._root.getElementById('cost-id').value;
        const name          = appState._root.getElementById('cost-name').value;
        const amount        = parseFloat(appState._root.getElementById('cost-amount').value);
        const dueDay        = parseInt(appState._root.getElementById('cost-due-day').value) || 1;
        const category      = appState._root.getElementById('cost-category').value || 'other';
        const paymentMethod = appState._root.getElementById('cost-payment-method').value || 'direct';
        const amountType    = appState._root.getElementById('cost-amount-type').value || 'fixed';
        const autoPay       = appState._root.getElementById('cost-autopay-toggle').checked;
        const intervalSel   = appState._root.getElementById('cost-interval').value;
        const intervalMonths = intervalSel === 'custom'
            ? (parseInt(appState._root.getElementById('cost-interval-custom').value) || 1)
            : parseInt(intervalSel) || 1;

        if (!name.trim())   throw new Error('Please enter a name for this cost.');
        if (isNaN(amount))  throw new Error('Please enter a valid amount.');
        if (intervalMonths < 1) throw new Error('Interval must be at least 1 month.');

        const startMonthInput = appState._root.getElementById('cost-start-month').value;
        const startMonthKey = startMonthInput ? htmlMonthToKey(startMonthInput) : null;

        const addedMonth = category === 'one-time' ? (appState.workingMonthKey || currentMonthKey()) : undefined;

        const targetArray = category === 'one-time' ? appState.oneTimeCosts : appState.recurringCosts;
        const sourceArray = category === 'one-time' ? appState.recurringCosts : appState.oneTimeCosts;

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

        saveDataAndRender();
        closeCostModal();
        showSavedToast(id ? 'Cost updated ✓' : 'Cost added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save cost.');
    }
}

function deleteCost(id) {
    showInlineConfirm(id, 'cost', () => {
        let deleted = appState.recurringCosts.find(c => c.id === id);
        const isRecurring = !!deleted;
        if (!deleted) {
            deleted = appState.oneTimeCosts.find(c => c.id === id);
        }
        if (deleted) {
            if (isRecurring) {
                appState.recurringCosts = appState.recurringCosts.filter(c => c.id !== id);
            } else {
                appState.oneTimeCosts = appState.oneTimeCosts.filter(c => c.id !== id);
            }
            delete appState.paidStatus[id];
            saveDataAndRender();
            showUndoToast('Cost deleted', () => {
                if (isRecurring) {
                    appState.recurringCosts = [...appState.recurringCosts, deleted];
                } else {
                    appState.oneTimeCosts = [...appState.oneTimeCosts, deleted];
                }
                saveDataAndRender();
            });
        }
    });
}

// ─── CRUD: Income ────────────────────────────────────────────────────────────
function saveIncome() {
    try {
        const id           = appState._root.getElementById('income-id').value;
        const label        = appState._root.getElementById('income-label').value;
        const date         = appState._root.getElementById('income-date').value;
        const amount       = parseFloat(appState._root.getElementById('income-amount').value);
        const scheduleType = appState._root.getElementById('income-schedule').value || 'one-time';

        if (!label.trim()) throw new Error('Please enter a label for this income entry.');
        if (!date)         throw new Error('Please select a date.');
        if (isNaN(amount)) throw new Error('Please enter a valid amount.');

        const entryBase = { label, date, amount, scheduleType };
        if (scheduleType === 'monthly')   entryBase.scheduleDay = parseInt(date.split('-')[2]);
        if (scheduleType === 'biweekly')  entryBase.scheduleAnchorDate = date;

        if (id) {
            const idx = appState.incomeEntries.findIndex(e => e.id === id);
            if (idx !== -1) appState.incomeEntries[idx] = { id, ...entryBase };
        } else if (scheduleType === 'biweekly') {
            const generated = generateBiweeklyForMonth(label, amount, date, appState.workingMonthKey || currentMonthKey());
            if (generated.length === 0) throw new Error('No occurrences of this schedule fall in the current month. Choose a date within the current month as the starting point.');
            appState.incomeEntries.push(...generated);
        } else {
            appState.incomeEntries.push({ id: Date.now().toString(), ...entryBase });
        }

        saveDataAndRender();
        closeIncomeModal();
        showSavedToast(id ? 'Income updated ✓' : 'Income added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save income entry.');
    }
}

function deleteIncome(id) {
    showInlineConfirm(id, 'income', () => {
        const deleted = appState.incomeEntries.find(e => e.id === id);
        appState.incomeEntries = appState.incomeEntries.filter(e => e.id !== id);
        saveDataAndRender();
        showUndoToast('Income entry deleted', () => { appState.incomeEntries.push(deleted); saveDataAndRender(); });
    });
}

// ─── Paid-this-month toggle ───────────────────────────────────────────────────

// Calculate the scheduled payment amount for a single debt in the current month.
// Mirrors the logic in renderPaymentPlan so the deduction matches what the UI shows.
function _getDebtPaymentAmount(debtId) {
    const debt = appState.debts.find(d => d.id === debtId);
    if (!debt || debt.balance <= 0) return 0;

    const aliveDebts = appState.debts.filter(d => d.balance > 0);
    const sortedDebts = getStrategyOrder(aliveDebts, appState.strategy);
    const targetId = sortedDebts[0]?.id;

    const totalIncome = appState.incomeEntries.reduce((s, e) => s + e.amount, 0);
    const totalRecurring = [
        ...appState.recurringCosts.filter(c => isCostDueThisMonth(c)),
        ...appState.oneTimeCosts,
    ].reduce((s, c) => s + c.amount, 0);
    const totalMinPay = sortedDebts.reduce((s, d) => s + (appState.minPayOverrides[d.id] ?? d.minPayment), 0);
    const extra = Math.max(0, totalIncome - totalRecurring - totalMinPay);

    const effMin = appState.minPayOverrides[debt.id] ?? debt.minPayment;
    const isTarget = debt.id === targetId;
    return isTarget ? Math.min(debt.balance, effMin + extra) : Math.min(debt.balance, effMin);
}

function togglePaid(id, autoPay) {
    const wasUnpaid = !appState.paidStatus[id];
    const debt = appState.debts.find(d => d.id === id);

    if (appState.paidStatus[id]) {
        // Unmarking: restore the deducted amount to the debt balance
        if (debt) {
            const prev = appState.paidStatus[id];
            const deducted = (typeof prev === 'object' && prev.amount) || 0;
            if (deducted > 0) debt.balance = Math.round((debt.balance + deducted) * 100) / 100;
        }
        delete appState.paidStatus[id];
    } else {
        // Marking paid: deduct the payment amount from the debt balance
        let amount = 0;
        if (debt) {
            amount = _getDebtPaymentAmount(id);
            if (amount > 0) debt.balance = Math.round((debt.balance - amount) * 100) / 100;
        }
        appState.paidStatus[id] = { status: autoPay ? 'autopay' : 'paid', amount };
        if (wasUnpaid && debt) {
            launchConfetti();
        }
    }
    // Micro-animation on the card being toggled
    const card = appState._root.querySelector(`.debt-card[data-cost-id="${id}"], .debt-card .btn-mark-paid-action[data-id="${id}"]`)
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
    saveDataAndRender();
}

// ─── Inline Confirm & Undo Toast ─────────────────────────────────────────────
function showInlineConfirm(id, type, onConfirm) {
    const selector = type === 'debt' ? '.btn-delete' : type === 'cost' ? '.btn-delete-cost' : '.btn-delete-income';
    const btn      = appState._root.querySelector(`${selector}[data-id="${id}"]`);
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
    const existing = appState._root.getElementById('undo-toast');
    if (existing) existing.remove();
    if (undoToastTimer) clearTimeout(undoToastTimer);

    const toast     = document.createElement('div');
    toast.id        = 'undo-toast';
    toast.className = 'undo-toast';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span><button class="undo-toast-btn">Undo</button>`;
    appState._root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    toast.querySelector('.undo-toast-btn').addEventListener('click', () => { onUndo(); dismissToast(toast); });
    undoToastTimer = setTimeout(() => dismissToast(toast), 5000);
}

function dismissToast(toast) {
    toast.classList.remove('undo-toast-visible');
    setTimeout(() => toast.remove(), 300);
}

function showSavedToast(message) {
    const existing = appState._root.getElementById('saved-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'saved-toast';
    toast.className = 'undo-toast undo-toast-success';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    appState._root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 2500);
}

function showErrorToast(message) {
    const existing = appState._root.getElementById('error-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'error-toast';
    toast.className = 'undo-toast undo-toast-error';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    appState._root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 4000);
}

// ─── HA Sensor Bridge ────────────────────────────────────────────────────────
function updateHASensors(simResults, schedule) {
    if (!appState._root._hass) return; // Safety check: Ensure HA object exists

    // 1. Push Total Debt Sensor
    const totalDebt = appState.debts.reduce((s, d) => s + d.balance, 0);
    appState._root._hass.callApi('POST', 'states/sensor.snowball_total_debt', {
        state: totalDebt.toFixed(2),
        attributes: {
            friendly_name: 'Total Remaining Debt',
            unit_of_measurement: appState._root._currency || 'USD',
            icon: 'mdi:cash-multiple'
        }
    });

    // 2. Push Payoff Date Sensor
    if (simResults && simResults.valid && simResults.monthsElapsed < 1200) {
        const today = new Date();
        const payoffDate = new Date(today.getFullYear(), today.getMonth() + simResults.monthsElapsed, 1);
        appState._root._hass.callApi('POST', 'states/sensor.snowball_payoff_date', {
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
            !appState.paidStatus[item.id] && 
            item.day >= currentDay
        );

        if (nextPayment) {
            appState._root._hass.callApi('POST', 'states/sensor.snowball_next_payment', {
                state: nextPayment.amount.toFixed(2),
                attributes: {
                    friendly_name: 'Next Debt Payment',
                    unit_of_measurement: appState._root._currency || 'USD',
                    debt_name: nextPayment.name,
                    due_day: nextPayment.day,
                    icon: 'mdi:calendar-clock'
                }
            });
        } else {
            // All caught up for the month!
            appState._root._hass.callApi('POST', 'states/sensor.snowball_next_payment', {
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

    appState._root.querySelectorAll('.strategy-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.strategy === appState.strategy);
    });
    renderIncomeList();
    renderRecurringCostsList();
    renderSpendingBudgets();

    const simResults = runSimulation(appState.strategy);
    renderDebtsList(simResults);
    renderVisualization(simResults);
    
    const schedule = renderPaymentPlan();

    // Only update HA sensors from current-month data; renderPaymentPlan returns null in archive view
    if (schedule !== null) updateHASensors(simResults, schedule);
}

export { closeCostModal, closeDebtModal, closeIncomeModal, deleteCost, deleteDebt, deleteIncome, dismissToast, openCostModal, openDebtModal, openIncomeModal, renderUI, saveCost, saveDebt, saveIncome, showErrorToast, showInlineConfirm, showSavedToast, showUndoToast, togglePaid, updateHASensors, updateIncomeScheduleHint };
