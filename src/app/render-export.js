import { appState } from './state.js';
import { dismissToast, renderUI } from './render-modals.js';
import { showDataHealthModal } from './modals.js';
import { saveData } from './storage.js';
import { reportError } from './error-report.js';
import { currentMonthKey } from '../core/date-utils.js';
import { filterBackupFields } from '../core/backups.js';
import { sanitizeData } from '../core/health.js';
import { PANEL_VERSION } from './header.js';

// ─── Export / Import ─────────────────────────────────────────────────────────
// Focused module for data backup/restore and notification toasts.
// Extracted from render-modals.js.

function exportData() {
    const dataStr = JSON.stringify({
        _meta:           { app: 'debt-snowball', version: PANEL_VERSION, exportedAt: new Date().toISOString() },
        paidMonth:       appState.workingMonthKey || currentMonthKey(),
        debts:           appState.debts,
        incomeEntries:   appState.incomeEntries,
        recurringCosts:  appState.recurringCosts,
        oneTimeCosts:    appState.oneTimeCosts,
        checkpoints:     appState.checkpoints,
        strategy:        appState.strategy,
        spendingBudgets: appState.spendingBudgets,
        cardExpenseSkips: appState.cardExpenseSkips,
        minPayOverrides: appState.minPayOverrides,
        monthlyArchives: appState.monthlyArchives,
        paidStatus:      appState.paidStatus,
        startingBalance: appState.startingBalance,
        showMortgage:    appState.showMortgage,
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
    const hasData = appState.debts.length > 0
        || appState.recurringCosts.length > 0
        || appState.oneTimeCosts.length > 0
        || appState.incomeEntries.length > 0
        || appState.checkpoints.length > 0
        || appState.spendingBudgets.length > 0
        || appState.monthlyArchives.length > 0
        || appState.cardExpenseSkips.length > 0
        || Object.keys(appState.paidStatus || {}).length > 0
        || Object.keys(appState.minPayOverrides || {}).length > 0;

    const doImport = () => {
        const reader = new FileReader();
        reader.onload = async ev => {
            let raw;
            try {
                raw = JSON.parse(ev.target.result);
            } catch {
                showNotificationToast('Error: Invalid backup file — could not parse JSON.', 'error');
                return;
            }
            // Universal repair pass: fixable problems are disclosed in the
            // health modal before anything is applied; only unrecognizable
            // files are rejected outright.
            const { data: clean, issues } = sanitizeData(raw);
            const fatal = issues.find(i => i.severity === 'fatal');
            if (fatal) {
                showNotificationToast(`Error: Invalid backup file — ${fatal.detail}`, 'error');
                return;
            }
            const apply = async () => { if (await applyBackupData(clean)) location.reload(); };
            if (!issues.length) {
                hasData ? showImportConfirmModal(apply, () => { e.target.value = ''; }) : apply();
                return;
            }
            const choice = await showDataHealthModal(issues, {
                context: 'confirm', hasData,
                title: '🩹 Repair backup & import?',
                body: 'This backup has problems that can be fixed automatically. Review the repairs — anything not listed is imported as-is.',
                confirmLabel: 'Repair & Import',
            });
            if (choice === 'export') exportData();
            if (choice === 'confirm' || choice === 'export') apply();
        };
        reader.onerror = () => showNotificationToast('Error: could not read the selected file.', 'error');
        reader.readAsText(file);
        e.target.value = '';
    };

    doImport();
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

// ─── Shared apply ────────────────────────────────────────────────────────────
// Fields a backup replaces entirely (a missing key means "no data", not
// "keep current"). Snapshotting these before mutation lets a failed save
// roll in-memory state back instead of leaving phantom imported data on screen.
const BACKUP_FIELDS = [
    'debts', 'recurringCosts', 'oneTimeCosts', 'incomeEntries', 'checkpoints',
    'strategy', 'spendingBudgets', 'cardExpenseSkips', 'minPayOverrides',
    'monthlyArchives', 'paidStatus', 'startingBalance', 'showMortgage',
];

/**
 * Replace app state with backup contents and persist. Shared by file import
 * and server-backup restore. Month-scoped items only apply when the backup
 * belongs to the current working month. On save failure, in-memory state is
 * rolled back so the UI never shows data that wasn't persisted.
 * @returns {Promise<boolean>} true if applied and saved (caller may reload)
 */
async function applyBackupData(raw) {
    // Universal gate — every entry point (file import, server restore) runs
    // the same repair pass. Callers normally pre-sanitize to disclose issues
    // first; this stays as the safety net so nothing unvalidated reaches state.
    const { data, issues } = sanitizeData(raw);
    const fatal = issues.find(i => i.severity === 'fatal');
    if (fatal) {
        showNotificationToast(`Error: Invalid backup — ${fatal.detail}`, 'error');
        return false;
    }

    const mk = appState.workingMonthKey || currentMonthKey();
    const snapshot = {};
    BACKUP_FIELDS.forEach(k => { snapshot[k] = appState[k]; });

    try {
        Object.assign(appState, filterBackupFields(data, mk));
        await saveData();
        return true;
    } catch (err) {
        Object.assign(appState, snapshot);
        renderUI();
        reportError('Import failed — data parsed but could not be saved to server; your data was not changed', err);
        return false;
    }
}

export { exportData, importData, showImportConfirmModal, showNotificationToast, applyBackupData };
