import { appState } from './state.js';
import { dismissToast } from './render-modals.js';
import { saveData } from './storage.js';

// ─── Export / Import ─────────────────────────────────────────────────────────
// Focused module for data backup/restore and notification toasts.
// Extracted from render-modals.js.

function exportData() {
    const dataStr = JSON.stringify({
        debts:          appState.debts,
        incomeEntries:  appState.incomeEntries,
        recurringCosts: appState.recurringCosts,
        oneTimeCosts:   appState.oneTimeCosts,
        checkpoints:    appState.checkpoints,
        strategy:       appState.strategy
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link    = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `debt-snowball-backup-${new Date().toISOString().split('T')[0]}.json`);
    link.click();
}

function importData(e) {
    const file    = e.target.files[0];
    if (!file) return;
    const hasData = appState.debts.length > 0 || appState.recurringCosts.length > 0 || appState.incomeEntries.length > 0;

    const doImport = () => {
        const reader = new FileReader();
        reader.onload = async ev => {
            let data;
            try {
                data = JSON.parse(ev.target.result);
            } catch {
                showNotificationToast('Error: Invalid backup file — could not parse JSON.', 'error');
                return;
            }
            try {
                if (data.debts)          appState.debts          = data.debts;
                if (data.recurringCosts) appState.recurringCosts = data.recurringCosts;
                if (data.oneTimeCosts)   appState.oneTimeCosts   = data.oneTimeCosts;
                if (data.incomeEntries)  appState.incomeEntries  = data.incomeEntries;
                if (data.checkpoints)    appState.checkpoints    = data.checkpoints;
                if (data.strategy)       appState.strategy       = data.strategy;
                if (data.monthlyBudget !== undefined && !data.incomeEntries) {
                    const now = new Date();
                    appState.incomeEntries = [{ id: Date.now().toString(), label: 'Monthly Budget (migrated)',
                        date: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`,
                        amount: data.monthlyBudget }];
                }
                await saveData();
                location.reload();
            } catch (err) {
                console.error('Debt Snowball: import save failed —', err);
                showNotificationToast('Error: Data parsed but could not be saved to server.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    hasData ? showImportConfirmModal(doImport, () => { e.target.value = ''; }) : doImport();
}

function showImportConfirmModal(onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className    = 'modal active';
    overlay.style.zIndex = '200';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header"><h3>⚠️ Replace Existing Data?</h3></div>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.5rem;line-height:1.6;">
                Importing will <strong style="color:var(--text-primary);">replace all your current data</strong>. Export a backup first if needed.
            </p>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end;flex-wrap:wrap;">
                <button class="btn btn-secondary" id="import-cancel-btn">Cancel</button>
                <button class="btn btn-secondary" id="import-export-first-btn">Export First, then Import</button>
                <button class="btn btn-danger"    id="import-confirm-btn">Replace Anyway</button>
            </div>
        </div>`;
    appState._root.appendChild(overlay);
    overlay.querySelector('#import-cancel-btn').addEventListener('click',       () => { overlay.remove(); onCancel(); });
    overlay.querySelector('#import-export-first-btn').addEventListener('click', () => { exportData(); overlay.remove(); onConfirm(); });
    overlay.querySelector('#import-confirm-btn').addEventListener('click',      () => { overlay.remove(); onConfirm(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); onCancel(); } });
}

function showNotificationToast(message, type = 'info') {
    const existing = appState._root.getElementById('notif-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'notif-toast';
    toast.className = `undo-toast undo-toast-${type}`;
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    appState._root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 4000);
}

export { exportData, importData, showImportConfirmModal, showNotificationToast };
