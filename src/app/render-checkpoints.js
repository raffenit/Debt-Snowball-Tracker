import { appState } from './state.js';
import { renderUI, showErrorToast, showSavedToast } from './render-modals.js';
import { saveData } from './storage.js';
import { reportError } from './error-report.js';

// ─── Checkpoints ─────────────────────────────────────────────────────────────
// Focused module for checkpoint list rendering and CRUD modal.
// Extracted from render-modals.js to keep the modals module focused on
// debt, cost, income, budget, and expense modals.

function renderCheckpointsList() {
    const container = appState._root.getElementById('checkpoints-list');
    if (!container) return;

    // Archive-aware: browsing a past month shows THAT month's checkpoints,
    // read-only. The add row hides so edits can't leak into live state.
    const archive = (appState.viewingArchiveIndex !== null)
        ? appState.monthlyArchives[appState.viewingArchiveIndex]
        : null;
    const cps = archive ? (archive.checkpoints || []) : appState.checkpoints;

    const addRow = appState._root.getElementById('add-checkpoint-row');
    if (addRow) addRow.style.display = archive ? 'none' : '';

    if (cps.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Sort by day
    const sorted = [...cps].sort((a, b) => a.day - b.day);

    const formatMoneyLocal = (n) => {
        const currency = appState._root._currency || 'USD';
        const locale = appState._root._locale || 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    };

    container.innerHTML = sorted.map(cp => `
        <div class="checkpoint-chip">
            <span class="checkpoint-day"${cp.autoRollover ? ' title="Carried over from last month\'s final balance"' : ''}>Day ${cp.day}${cp.autoRollover ? ' · auto' : ''}</span>
            <span class="checkpoint-amount">${formatMoneyLocal(cp.amount)}</span>
            ${archive ? '' : `<button class="btn btn-icon delete-checkpoint-btn" data-id="${cp.id}" title="Remove checkpoint">✕</button>`}
        </div>
    `).join('');
}

function openCheckpointModal(cpId = null) {
    appState.checkpointForm.reset();
    appState._root.getElementById('checkpoint-id').value = '';

    if (cpId) {
        appState._root.getElementById('checkpoint-modal-title').textContent = 'Edit Checkpoint';
        const cp = appState.checkpoints.find(c => c.id === cpId);
        if (cp) {
            appState._root.getElementById('checkpoint-id').value = cp.id;
            appState._root.getElementById('checkpoint-day').value = cp.day;
            appState._root.getElementById('checkpoint-amount').value = cp.amount.toFixed(2);
        }
    } else {
        appState._root.getElementById('checkpoint-modal-title').textContent = 'Add Checkpoint';
    }

    appState.checkpointModal.style.display = 'flex';
    setTimeout(() => appState.checkpointModal.classList.add('active'), 10);
    setTimeout(() => appState._root.getElementById('checkpoint-amount').focus(), 50);
}

function closeCheckpointModal() {
    appState.checkpointModal.classList.remove('active');
    setTimeout(() => { appState.checkpointModal.style.display = 'none'; }, 300);
}

function saveCheckpoint() {
    try {
        const id      = appState._root.getElementById('checkpoint-id').value;
        const day     = parseInt(appState._root.getElementById('checkpoint-day').value);
        const amount  = parseFloat(appState._root.getElementById('checkpoint-amount').value);

        if (!day || day < 1 || day > 31) throw new Error('Please select a valid day (1-31).');
        if (!Number.isFinite(amount)) throw new Error('Please enter a valid amount.');

        // Check for duplicate day (if adding new or changing day)
        const existingSameDay = appState.checkpoints.find(cp => cp.day === day && cp.id !== id);
        if (existingSameDay) throw new Error(`A checkpoint for day ${day} already exists.`);

        if (id) {
            // Edit existing
            const idx = appState.checkpoints.findIndex(cp => cp.id === id);
            if (idx !== -1) {
                appState.checkpoints[idx] = { id, day, amount };
            }
        } else {
            // Add new
            const newCp = {
                id: 'cp_' + Date.now(),
                day,
                amount
            };
            appState.checkpoints.push(newCp);
        }

        appState.checkpoints.sort((a, b) => a.day - b.day);

        saveData().then(() => {
            renderCheckpointsList();
            renderUI();
            closeCheckpointModal();
            showSavedToast(id ? 'Checkpoint updated ✓' : 'Checkpoint added ✓');
        }).catch(err => reportError('Save failed — your change may not persist after reload', err));
    } catch (err) {
        showErrorToast(err.message || 'Failed to save checkpoint.');
    }
}

export { closeCheckpointModal, openCheckpointModal, renderCheckpointsList, saveCheckpoint };
