import { appState } from './state.js';
import { escHtml, formatMoney } from '../core/pure-utils.js';

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
}

// ─── Archive Viewer ───────────────────────────────────────────────────────────
function openArchiveModal() {
    const body = appState._root.getElementById('archive-body');
    body.innerHTML = '';

    if (appState.monthlyArchives.length === 0) {
        body.innerHTML = '<div class="archive-empty">No archived months yet.<br>History is saved automatically when each month rolls over.</div>';
        showModal(appState._root.getElementById('archive-modal'));
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

    showModal(appState._root.getElementById('archive-modal'));
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

export { closeArchiveModal, openArchiveModal, showModal, updateCostModalIntervalVisibility };
