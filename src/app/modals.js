import { appState } from './state.js';
import { escHtml, formatMoney } from '../core/pure-utils.js';
import { htmlMonthToKey, monthKeyToIndex, currentMonthKey } from '../core/date-utils.js';
import { buildRetroArchive } from '../core/rollover.js';

function updateCostModalIntervalVisibility() {
    const cat      = appState._root.getElementById('cost-category').value;
    const intGrp   = appState._root.getElementById('cost-interval-group');
    const custGrp  = appState._root.getElementById('cost-interval-custom-group');
    const startGrp = appState._root.getElementById('cost-start-month-group');
    const isOneTime = cat === 'one-time';
    intGrp.style.display  = isOneTime ? 'none' : '';
    if (isOneTime) {
        custGrp.style.display = 'none';
        startGrp.style.display = 'none';
    } else {
        const val = appState._root.getElementById('cost-interval').value;
        const isMultiMonth = val === 'custom' || parseInt(val) > 1;
        custGrp.style.display  = val === 'custom' ? '' : 'none';
        startGrp.style.display = isMultiMonth ? '' : 'none';
    }

    // Budget routing + card linking only apply to card-charged costs
    const method = appState._root.getElementById('cost-payment-method').value;
    ['cost-budget-group', 'cost-card-debt-group'].forEach(id => {
        const grp = appState._root.getElementById(id);
        if (grp) grp.style.display = method === 'card' ? '' : 'none';
    });
}

// ─── Archive Viewer ───────────────────────────────────────────────────────────
function openArchiveModal() {
    const body = appState._root.getElementById('archive-body');
    body.innerHTML = '';

    if (appState.monthlyArchives.length === 0) {
        body.innerHTML = '<div class="archive-empty">No archived months yet.<br>History is saved automatically when each month rolls over.</div>';
        _appendArchiveAdder(body);
        showModal(appState._root.getElementById('archive-modal'));
        _renderServerBackups(body);
        return;
    }

    // Dropdown
    const select = document.createElement('select');
    select.className = 'input-group archive-select';
    appState.monthlyArchives.forEach((a, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = a.label;
        select.appendChild(opt);
    });
    body.appendChild(select);

    const detailWrap = document.createElement('div');
    body.appendChild(detailWrap);

    function renderArchiveDetail(idx) {
        const a = appState.monthlyArchives[idx];
        detailWrap.innerHTML = '';

        const summary = document.createElement('div');
        summary.className = 'archive-summary';

        const fmt = n => typeof n === 'number' ? formatMoney(n) : '$0.00';

        summary.innerHTML = `
            ${a.retro ? `<div class="archive-retro-badge" title="This month was reconstructed after the fact — verify the numbers">⟲ Reconstructed</div>` : ''}
            <div class="archive-summary-row">
                <span class="archive-summary-label">Starting Balance</span>
                <span class="archive-summary-value">${fmt(a.startingBalance)}</span>
            </div>
            <div class="archive-summary-row">
                <span class="archive-summary-label">Total Income</span>
                <span class="archive-summary-value income">${fmt(a.totalIncome)}</span>
            </div>
            <div class="archive-summary-row">
                <span class="archive-summary-label">Total Costs</span>
                <span class="archive-summary-value expense">${fmt(a.totalCosts)}</span>
            </div>`;

        // Income detail toggle
        if (a.incomeEntries && a.incomeEntries.length > 0) {
            const incBtn = document.createElement('button');
            incBtn.className = 'archive-detail-toggle';
            incBtn.textContent = `▶ Income entries (${a.incomeEntries.length})`;
            const incDetail = document.createElement('div');
            incDetail.className = 'archive-detail-section';
            a.incomeEntries.forEach(e => {
                const row = document.createElement('div');
                row.className = 'archive-detail-item';
                row.innerHTML = `<span>${escHtml(e.label)}</span><span>${fmt(e.amount)}</span>`;
                incDetail.appendChild(row);
            });
            incBtn.addEventListener('click', () => {
                incDetail.classList.toggle('open');
                incBtn.textContent = incDetail.classList.contains('open')
                    ? `▼ Income entries (${a.incomeEntries.length})`
                    : `▶ Income entries (${a.incomeEntries.length})`;
            });
            summary.appendChild(incBtn);
            summary.appendChild(incDetail);
        }

        // Recurring costs detail toggle
        if (a.recurringCosts && a.recurringCosts.length > 0) {
            const costBtn = document.createElement('button');
            costBtn.className = 'archive-detail-toggle';
            costBtn.textContent = `▶ Recurring costs (${a.recurringCosts.length})`;
            const costDetail = document.createElement('div');
            costDetail.className = 'archive-detail-section';
            a.recurringCosts.forEach(c => {
                const row = document.createElement('div');
                row.className = 'archive-detail-item';
                row.innerHTML = `<span>${escHtml(c.name)} <span style="opacity:0.6;font-size:0.75em;">${c.category || 'other'}</span></span><span>${fmt(c.amount)}</span>`;
                costDetail.appendChild(row);
            });
            costBtn.addEventListener('click', () => {
                costDetail.classList.toggle('open');
                costBtn.textContent = costDetail.classList.contains('open')
                    ? `▼ Recurring costs (${a.recurringCosts.length})`
                    : `▶ Recurring costs (${a.recurringCosts.length})`;
            });
            summary.appendChild(costBtn);
            summary.appendChild(costDetail);
        }

        // One-time costs detail toggle
        if (a.oneTimeCosts && a.oneTimeCosts.length > 0) {
            const otBtn = document.createElement('button');
            otBtn.className = 'archive-detail-toggle';
            otBtn.textContent = `▶ One-time costs (${a.oneTimeCosts.length})`;
            const otDetail = document.createElement('div');
            otDetail.className = 'archive-detail-section';
            a.oneTimeCosts.forEach(c => {
                const row = document.createElement('div');
                row.className = 'archive-detail-item';
                row.innerHTML = `<span>${escHtml(c.name)} <span style="opacity:0.6;font-size:0.75em;">one-time</span></span><span>${fmt(c.amount)}</span>`;
                otDetail.appendChild(row);
            });
            otBtn.addEventListener('click', () => {
                otDetail.classList.toggle('open');
                otBtn.textContent = otDetail.classList.contains('open')
                    ? `▼ One-time costs (${a.oneTimeCosts.length})`
                    : `▶ One-time costs (${a.oneTimeCosts.length})`;
            });
            summary.appendChild(otBtn);
            summary.appendChild(otDetail);
        }

        detailWrap.appendChild(summary);
    }

    renderArchiveDetail(0);
    select.addEventListener('change', () => renderArchiveDetail(Number(select.value)));

    _appendArchiveAdder(body);
    showModal(appState._root.getElementById('archive-modal'));
    _renderServerBackups(body);
}

// "Add a missing month" — reconstructs an archive for a month that was never
// rolled over, so the user can fill it in via archive editing.
function _appendArchiveAdder(body) {
    const wrap = document.createElement('div');
    wrap.className = 'archive-add';
    wrap.innerHTML = `
        <div class="archive-backups-title">➕ Add a Missing Month</div>
        <div class="archive-add-row">
            <input type="month" class="retro-month-input">
            <button class="btn btn-secondary btn-sm">Add</button>
        </div>
        <div class="archive-add-hint">Rebuilt from your recurring income, bills, and budgets — card charges are mirrored automatically. Fill in cash expenses by opening the month via ‹ Prev on the Cash Flow tab.</div>`;
    body.appendChild(wrap);

    const input = wrap.querySelector('.retro-month-input');
    wrap.querySelector('button').addEventListener('click', async () => {
        const { showErrorToast, showSavedToast } = await import('./render-modals.js');
        const { reportError } = await import('./error-report.js');
        const val = input.value;
        if (!val) { showErrorToast('Pick a month first.'); return; }
        const monthKey = htmlMonthToKey(val);
        const workKey  = appState.workingMonthKey || currentMonthKey();
        if (monthKeyToIndex(monthKey) >= monthKeyToIndex(workKey)) {
            showErrorToast('Only past months can be reconstructed — the current month is live.');
            return;
        }
        if (appState.monthlyArchives.some(a => a.month === monthKey)) {
            showErrorToast('That month is already in history.');
            return;
        }
        const archive = buildRetroArchive(appState, monthKey);
        // Archives are newest-first — insert before the first older one
        const idx = appState.monthlyArchives.findIndex(a => monthKeyToIndex(a.month) < monthKeyToIndex(monthKey));
        if (idx === -1) appState.monthlyArchives.push(archive);
        else appState.monthlyArchives.splice(idx, 0, archive);
        const { saveDataAndRender } = await import('./storage.js');
        await saveDataAndRender();
        openArchiveModal(); // refresh the list with the new entry selected-ready
        showSavedToast(`${archive.label} added — open it via ‹ Prev Month to fill in details ✓`);
    });
}

// ─── Server backups ──────────────────────────────────────────────────────────
// The app keeps ~3 rotating backups on the HASS server (hidden dashboards).
// They're written automatically before month advance and before the first
// archive-view edit of a session. Dynamic imports avoid module cycles
// (storage/render-export → render-modals → modals).
async function _renderServerBackups(body) {
    const wrap = document.createElement('div');
    wrap.className = 'archive-backups';
    body.appendChild(wrap);

    let backups;
    try {
        const { listServerBackups } = await import('./storage.js');
        backups = await listServerBackups();
    } catch (err) {
        const { reportError } = await import('./error-report.js');
        reportError('Could not load server backups', err);
        wrap.innerHTML = '<div class="archive-empty">Server backups unavailable.</div>';
        return;
    }
    // The modal may have been closed while loading
    if (!wrap.isConnected) return;

    if (!backups.length) {
        wrap.innerHTML = '<div class="archive-empty" style="margin-top:1rem;">No server backups yet.<br>One is saved automatically before each month advance.</div>';
        return;
    }

    wrap.innerHTML = `<div class="archive-backups-title">🛟 Server Backups <span style="opacity:0.6;font-weight:400;">(latest ${backups.length} kept)</span></div>` +
        backups.map((b, i) => `
            <div class="archive-detail-item">
                <span>${escHtml(new Date(b.savedAt).toLocaleString())} <span style="opacity:0.6;font-size:0.75em;">${escHtml(b.reason)}</span></span>
                <button class="btn btn-secondary btn-sm" data-backup-idx="${i}">Restore</button>
            </div>`).join('');

    wrap.querySelectorAll('[data-backup-idx]').forEach(btn => btn.addEventListener('click', async () => {
        const b = backups[Number(btn.dataset.backupIdx)];
        try {
            // Surface any repairable problems in this snapshot before applying it.
            const { sanitizeData } = await import('../core/health.js');
            const { issues } = sanitizeData(b.config);
            if (issues.length) {
                const choice = await showDataHealthModal(issues, {
                    context:  'confirm',
                    title:    '🩹 Backup needs repair',
                    body:     `The snapshot from ${new Date(b.savedAt).toLocaleString()} has problems that will be auto-fixed on restore. Restoring replaces ALL current data.`,
                    confirmLabel: 'Repair & Restore',
                });
                if (choice !== 'confirm') return;
            } else if (!confirm(`Restore the backup from ${new Date(b.savedAt).toLocaleString()}?\n\nThis replaces ALL current data with that snapshot.`)) {
                return;
            }
            const { applyBackupData } = await import('./render-export.js');
            if (await applyBackupData(b.config)) location.reload();
        } catch (err) {
            const { reportError } = await import('./error-report.js');
            reportError('Backup restore failed', err);
        }
    }));
}

// ─── Data health ─────────────────────────────────────────────────────────────
// Universal disclosure for sanitizeData() results — same modal whether the
// data came from the stored config, a file import, or a server backup.
//   context 'load'    — review-only; repairs already applied in memory.
//   context 'confirm' — gate a destructive action (import/restore) on the
//                       repair list. Resolves 'confirm' | 'export' | 'cancel'.
function showDataHealthModal(issues, { context = 'load', title, body, confirmLabel = 'Fix & Continue', hasData = false } = {}) {
    const icons = { repaired: '⚠️', warning: '⚠️', notice: 'ℹ️', info: 'ℹ️', fatal: '⛔' };
    const rows = issues.map(i => `
        <div style="display:flex;gap:0.5rem;align-items:baseline;padding:0.3rem 0;font-size:0.85rem;color:var(--text-secondary);line-height:1.4;">
            <span>${icons[i.severity] || 'ℹ️'}</span>
            <span><strong style="color:var(--text-primary);">${escHtml(i.field)}</strong> — ${escHtml(i.detail)}</span>
        </div>`).join('');

    const defaultTitle = context === 'confirm' ? '🩹 Data needs repair' : '🩹 Data repairs applied';
    const defaultBody  = context === 'confirm'
        ? 'The incoming data has problems that can be fixed automatically. Review the fixes before continuing.'
        : 'The stored data had problems — automatic fixes were applied. A raw pre-repair snapshot was saved to your server backups (History → Server Backups) in case anything looks wrong.';

    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className    = 'modal active';
        overlay.style.zIndex = '210';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:460px;">
                <div class="modal-header"><h3>${escHtml(title || defaultTitle)}</h3></div>
                <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:0.5rem;line-height:1.6;">
                    ${escHtml(body || defaultBody)}
                    ${context === 'confirm' && hasData ? ' <strong style="color:var(--text-primary);">This replaces all your current data.</strong>' : ''}
                </p>
                <div style="max-height:40vh;overflow-y:auto;border-top:1px solid var(--border-color,rgba(128,128,128,0.25));margin-bottom:1rem;">${rows}</div>
                <div style="display:flex;gap:0.75rem;justify-content:flex-end;flex-wrap:wrap;">
                    ${context === 'confirm' ? `
                        <button class="btn btn-secondary" id="health-cancel-btn">Cancel</button>
                        ${hasData ? '<button class="btn btn-secondary" id="health-export-btn">Export First</button>' : ''}
                        <button class="btn btn-danger" id="health-confirm-btn">${escHtml(confirmLabel)}</button>`
                    : '<button class="btn btn-primary" id="health-ok-btn">Got it</button>'}
                </div>
            </div>`;
        appState._root.appendChild(overlay);
        const done = v => { overlay.remove(); resolve(v); };
        overlay.querySelector('#health-ok-btn')?.addEventListener('click',      () => done('ok'));
        overlay.querySelector('#health-confirm-btn')?.addEventListener('click', () => done('confirm'));
        overlay.querySelector('#health-export-btn')?.addEventListener('click',  () => done('export'));
        overlay.querySelector('#health-cancel-btn')?.addEventListener('click',  () => done('cancel'));
        overlay.addEventListener('click', e => { if (e.target === overlay) done(context === 'confirm' ? 'cancel' : 'ok'); });
    });
}

// ─── Categorize prompt ───────────────────────────────────────────────────────
// Shown when a card charge newly lands in the 💳 Card Autopay catch-all —
// the user picks a real home for it and the choice persists on the cost
// (budgetId / budgetCategory), so it routes correctly every month.
// Resolves: 'budget:<id>' | 'cat:<key>' | 'autopay' | 'later'.
function showCategorizeModal(cost, userBudgets) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className    = 'modal active';
        overlay.style.zIndex = '200';
        const options = [
            ...userBudgets.map(b => `<option value="budget:${b.id}">${escHtml(b.name)}</option>`),
            `<option value="cat:subscription">📱 Subscriptions (auto budget)</option>`,
            `<option value="cat:utility">⚡ Utilities (auto budget)</option>`,
            `<option value="cat:maintenance">🔧 Maintenance (auto budget)</option>`,
            `<option value="autopay">💳 Keep in Card Autopay</option>`,
        ].join('');
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:420px;">
                <div class="modal-header"><h3>🏷 Categorize “${escHtml(cost.name)}”?</h3></div>
                <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1rem;line-height:1.6;">
                    This card charge didn't match a budget, so it landed in <strong>💳 Card Autopay</strong>.
                    Pick where it should be tracked — your choice applies every month.
                </p>
                <select class="input-group" id="categorize-select" style="width:100%;margin-bottom:1rem;">${options}</select>
                <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                    <button class="btn btn-secondary" id="categorize-later-btn">Not Now</button>
                    <button class="btn btn-primary"   id="categorize-save-btn">Save</button>
                </div>
            </div>`;
        appState._root.appendChild(overlay);

        const done = v => { overlay.remove(); resolve(v); };
        overlay.querySelector('#categorize-save-btn').addEventListener('click',
            () => done(overlay.querySelector('#categorize-select').value));
        overlay.querySelector('#categorize-later-btn').addEventListener('click', () => done('later'));
        overlay.addEventListener('click', e => { if (e.target === overlay) done('later'); });
    });
}

function closeArchiveModal() {
    const modal = appState._root.getElementById('archive-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

function showModal(modal) {
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('active');
}

export { closeArchiveModal, openArchiveModal, showCategorizeModal, showDataHealthModal, showModal, updateCostModalIntervalVisibility };
