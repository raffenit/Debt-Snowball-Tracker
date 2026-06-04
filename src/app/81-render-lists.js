// ─── Income List ─────────────────────────────────────────────────────────────
function renderIncomeList() {
    incomeListContainer.innerHTML = '';
    const summaryEl = _root.getElementById('income-summary');

    if (incomeEntries.length === 0) {
        incomeListContainer.innerHTML = `
            <div class="empty-state">
                No income entries yet.<br>Add your paychecks and other income for this month.
                <br><button class="empty-cta-btn" id="empty-add-income-btn">+ Add Income</button>
            </div>`;
        incomeListContainer.style.display = 'block';
        summaryEl.style.display = 'none';
        const emptyBtn = incomeListContainer.querySelector('#empty-add-income-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openIncomeModal());
        return;
    }

    incomeListContainer.style.display = 'grid';
    const sorted = [...incomeEntries.sort((a,b) => a.date.localeCompare(b.date))];

    sorted.forEach((entry, idx) => {
        const dateStr = new Date(entry.date+'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' });
        const el = document.createElement('div');
        el.className = 'debt-card income-card';
        el.style.animation = `cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards ${idx * 0.08}s`;
        el.innerHTML = `
            <div class="income-compact-inner">
                <div class="income-compact-info">
                    <span class="income-compact-name">${escHtml(entry.label)}</span>
                    <span class="income-compact-date">${dateStr}</span>
                </div>
                <div class="income-compact-right">
                    <span class="income-compact-amount">${formatMoney(entry.amount)}</span>
                    <button class="btn btn-xs btn-secondary btn-edit-income" data-id="${entry.id}">Edit</button>
                    <button class="btn btn-xs btn-danger btn-delete-income" data-id="${entry.id}">Delete</button>
                </div>
            </div>`;
        incomeListContainer.appendChild(el);
    });

    incomeListContainer.querySelectorAll('.btn-edit-income').forEach(b   => b.addEventListener('click', e => openIncomeModal(e.target.dataset.id)));
    incomeListContainer.querySelectorAll('.btn-delete-income').forEach(b => b.addEventListener('click', e => deleteIncome(e.target.dataset.id)));

    const total = incomeEntries.reduce((s,e) => s + e.amount, 0);
    summaryEl.style.display = 'block';
    summaryEl.innerHTML = `<span class="income-summary-label">Total Monthly Income:</span><span class="income-summary-value">${formatMoney(total)}</span>`;
}

// ─── Recurring Costs List ────────────────────────────────────────────────────
function renderRecurringCostsList() {
    costsListContainer.innerHTML = '';
    const recurringSummaryEl = _root.getElementById('recurring-summary');

    // Recurring costs only (one-time costs are rendered separately)
    const visibleRecurring = recurringCosts.filter(c => isCostDueThisMonth(c));
    const totalRecurring   = visibleRecurring.reduce((sum, c) => sum + c.amount, 0);
    const directRecurring  = visibleRecurring.filter(c => c.paymentMethod === 'direct').reduce((sum, c) => sum + c.amount, 0);
    const cardRecurring    = visibleRecurring.filter(c => c.paymentMethod === 'card').reduce((sum, c) => sum + c.amount, 0);
    const totalOneTime     = oneTimeCosts.reduce((sum, c) => sum + c.amount, 0);
    const grandTotal       = totalRecurring + totalOneTime;

    if (recurringSummaryEl) {
        const otLabel = totalOneTime > 0 ? ` + ${formatMoney(totalOneTime)} one-time` : '';
        recurringSummaryEl.innerHTML = `<span class="recurring-due-label">Due This Month</span><span class="recurring-due-total">$${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span><span class="recurring-due-breakdown">🏦 Direct ${formatMoney(directRecurring)} &nbsp;·&nbsp; 💳 Card ${formatMoney(cardRecurring)}${otLabel}</span>`;
    }

    const hasAnyCosts = visibleRecurring.length > 0 || oneTimeCosts.length > 0;
    if (!hasAnyCosts) {
        costsListContainer.innerHTML = `
            <div class="empty-state">
                No costs yet.<br>Add your bills, subscriptions, and one-time expenses.
                <br><button class="empty-cta-btn" id="empty-add-cost-btn">+ Add Cost</button>
            </div>`;
        costsListContainer.style.display = 'block';
        const emptyBtn = costsListContainer.querySelector('#empty-add-cost-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openCostModal());
        return;
    }

    costsListContainer.style.display = 'block';
    const currentDay = new Date().getDate();
    let cardIndex = 0;

    // ── Recurring sections ──────────────────────────────────────────────────
    const recurringSorted = [...visibleRecurring].sort((a,b) => (a.dueDay||1) - (b.dueDay||1));
    const categories = [
        { key: 'utility',      label: '⚡ Utilities (Monthly Bills)',           cls: 'cost-subsection-utility' },
        { key: 'subscription', label: '📱 Subscriptions (Recurring Services)',   cls: 'cost-subsection-subscription' },
        { key: 'other',        label: '📦 Other Recurring Bills',               cls: 'cost-subsection-other' },
    ];

    categories.forEach(({ key, label, cls }) => {
        const group = recurringSorted.filter(c => (c.category || 'other') === key);
        if (group.length === 0) return;

        const section = document.createElement('div');
        section.className = `cost-subsection ${cls}`;

        const isCompact     = key === 'utility' || key === 'subscription';
        const isCollapsible = isCompact;
        const isExpanded    = expandedCostSections.has(key);
        const groupTotal    = group.reduce((s, c) => s + c.amount, 0);

        const header = document.createElement('div');
        header.className = 'cost-subsection-header' + (isCollapsible ? ' cost-section-collapsible' : '');
        if (isCollapsible) header.dataset.toggleSection = key;
        const toggleIcon = isCollapsible
            ? `<span class="cost-section-toggle-icon${isExpanded ? '' : ' collapsed'}">▼</span>`
            : '';
        header.innerHTML = `<span style="display:flex;align-items:center;gap:0.25rem;">${toggleIcon}${label}</span><span class="cost-subsection-total">${formatMoney(groupTotal)}/mo</span>`;
        section.appendChild(header);

        if (!isCollapsible || isExpanded) {
            const grid = document.createElement('div');
            grid.className = 'debts-list';
            grid.style.display = 'grid';
            if (isCompact) {
                grid.style.gridTemplateColumns = '1fr';
                grid.style.gap = '0.4rem';
            }

            group.forEach(cost => renderCostCard(cost, grid, false, currentDay));
            section.appendChild(grid);
        }
        costsListContainer.appendChild(section);
    });

    // ── One-time section ────────────────────────────────────────────────────
    if (oneTimeCosts.length > 0) {
        const otSection = document.createElement('div');
        otSection.className = 'cost-subsection cost-subsection-onetime';
        const otTotal = oneTimeCosts.reduce((s, c) => s + c.amount, 0);

        const otHeader = document.createElement('div');
        otHeader.className = 'cost-subsection-header';
        otHeader.innerHTML = `<span style="display:flex;align-items:center;gap:0.25rem;">🔴 ONE-TIME EXPENSES (This Month Only)</span><span class="cost-subsection-total">${formatMoney(otTotal)}</span>`;
        otSection.appendChild(otHeader);

        const otGrid = document.createElement('div');
        otGrid.className = 'debts-list';
        otGrid.style.display = 'grid';
        oneTimeCosts.forEach(cost => renderCostCard(cost, otGrid, true, currentDay));
        otSection.appendChild(otGrid);
        costsListContainer.appendChild(otSection);
    }

    costsListContainer.querySelectorAll('.btn-edit-cost').forEach(b   => b.addEventListener('click', e => openCostModal(e.target.dataset.id)));
    costsListContainer.querySelectorAll('.btn-delete-cost').forEach(b => b.addEventListener('click', e => deleteCost(e.target.dataset.id)));
    costsListContainer.querySelectorAll('.btn-mark-paid').forEach(b   => b.addEventListener('click', e => togglePaid(e.currentTarget.dataset.id, e.currentTarget.dataset.autopay === 'true')));
}

function renderCostCard(cost, grid, isOneTime, currentDay) {
    const isPastDue = (cost.dueDay || 1) <= currentDay;
    const isCard    = cost.paymentMethod === 'card';
    const isDue     = isOneTime || isCostDueThisMonth(cost);
    const intN      = cost.intervalMonths || 1;
    const paidState = paidStatus[cost.id];

    const paymentMethodBadge = isCard
        ? '<span class="debt-type-badge card-badge">💳 Card</span>'
        : '<span class="debt-type-badge direct-badge">🏦 Direct</span>';
    const amountTypeBadge = (cost.amountType || 'fixed') === 'flexible'
        ? '<span class="amount-type-badge flexible-badge">〜 Flexible</span>'
        : '';

    let freqBadge;
    if (isOneTime) {
        freqBadge = '<span class="interval-badge" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);">🔴 ONE-TIME</span>';
    } else if (intN > 1) {
        freqBadge = `<span class="interval-badge">${intervalLabel(intN)}</span>`;
    } else {
        freqBadge = '<span class="interval-badge" style="background:rgba(99,102,241,0.1);color:var(--primary-light);border:1px solid rgba(99,102,241,0.25);">📅 Monthly</span>';
    }
    const notDueBadge = (!isDue && intN > 1)
        ? `<span class="not-due-badge">Next: ${formatMonthLabel(cost.nextDueMonth)}</span>` : '';
    const autoBadge   = (!isOneTime && cost.autoPay) ? '<span class="autopay-badge">⚡ Auto-Pay</span>' : '';
    const paidOverlay = paidState ? buildPaidOverlay(cost.autoPay) : '';

    let dueFreq;
    if (isOneTime) {
        dueFreq = 'One-Time Only';
    } else if (intN > 1) {
        dueFreq = intervalLabel(intN).replace('📆 ', '');
    } else {
        dueFreq = 'Monthly';
    }

    const el = document.createElement('div');
    const isCompact = !isOneTime && (cost.category === 'utility' || cost.category === 'subscription');

    if (isCompact) {
        el.className = 'debt-card cost-card cost-card-compact' +
            (isCard ? ' cost-card-credit' : ' cost-card-direct') +
            (paidState ? ' card-paid' : '') +
            (isDue ? '' : ' not-due-month');
        const badgesHtml = [freqBadge, paymentMethodBadge, amountTypeBadge, autoBadge, notDueBadge].filter(Boolean).join('');
        const metaParts  = [`Due ${formatOrdinal(cost.dueDay || 1)}`, `Repeats: ${dueFreq}`].filter(Boolean);
        el.innerHTML = `
            ${paidOverlay}
            <div class="cost-compact-body">
                <div class="cost-compact-info">
                    <div class="cost-compact-name-row">
                        <span class="cost-compact-name">${escHtml(cost.name)}</span>
                        <span class="cost-amount cost-compact-amount">${formatMoney(cost.amount)}</span>
                    </div>
                    ${badgesHtml ? `<div class="cost-compact-badges">${badgesHtml}</div>` : ''}
                    <div class="cost-compact-meta">${metaParts.map((p, i) => i < metaParts.length - 1 ? `<span>${p}</span><span class="cost-meta-dot">·</span>` : `<span>${p}</span>`).join('')}</div>
                </div>
                <div class="cost-compact-actions">
                    ${isDue ? `<div class="cost-compact-paid">${buildPaidButton(cost.id, cost.autoPay, paidState, isPastDue)}</div>` : ''}
                    <div class="cost-mini-actions">
                        <button class="btn-icon btn-edit-cost" data-id="${cost.id}" title="Edit">✎</button>
                        <button class="btn-icon btn-delete-cost" data-id="${cost.id}" title="Delete">✕</button>
                    </div>
                </div>
            </div>`;
    } else {
        el.className = 'debt-card cost-card' +
            (isCard ? ' cost-card-credit' : ' cost-card-direct') +
            (paidState ? ' card-paid' : '') +
            (isDue ? '' : ' not-due-month') +
            (isOneTime ? ' cost-card-onetime' : '');
        const badgesHtml = [freqBadge, paymentMethodBadge, amountTypeBadge, autoBadge, notDueBadge].filter(Boolean).join('');
        const amountLabel = isOneTime ? 'One-Time Amount' : (intN > 1 ? 'Amount' : 'Monthly Amount');
        const paymentMethodLabel = isCard ? 'Credit / Debit Card' : 'Direct Pay (Bank / Cash)';
        const dueValue = `${formatOrdinal(cost.dueDay||1)} (${dueFreq})`;
        el.innerHTML = `
            ${paidOverlay}
            <div class="debt-name">${escHtml(cost.name)}</div>
            ${badgesHtml ? `<div class="cost-badges-line">${badgesHtml}</div>` : ''}
            <div class="debt-detail"><span class="debt-detail-label">${amountLabel}</span><span class="debt-detail-value cost-amount">${formatMoney(cost.amount)}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Due</span><span class="debt-detail-value">${dueValue}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Payment</span><span class="debt-detail-value">${paymentMethodLabel}</span></div>
            <div class="paid-action-row">${isDue ? buildPaidButton(cost.id, cost.autoPay, paidState, isPastDue) : ''}</div>
            <div class="cost-icon-actions">
                <button class="btn-icon btn-edit-cost" data-id="${cost.id}" title="Edit">✎</button>
                <button class="btn-icon btn-delete-cost" data-id="${cost.id}" title="Delete">✕</button>
            </div>`;
    }
    grid.appendChild(el);
}

// Section collapse/expand — delegated on the container so it survives re-renders

// ─── Debts List ──────────────────────────────────────────────────────────────
function renderDebtsList(simResults) {
    debtsListContainer.innerHTML = '';
    const debtsSummaryEl    = _root.getElementById('debts-summary');
    const mortgageToggleBtn = _root.getElementById('mortgage-toggle-btn');

    // ── Archive-view wiring ────────────────────────────────────────────────────
    const isArchiveView = viewingArchiveIndex !== null && !!monthlyArchives[viewingArchiveIndex];
    const archiveData   = isArchiveView ? monthlyArchives[viewingArchiveIndex] : null;
    const _debts        = archiveData ? (archiveData.debts || debts) : debts;
    const _paidStatus   = archiveData ? (archiveData.paidStatus || {}) : paidStatus;

    const hasMortgage = _debts.some(d => d.type === 'mortgage');
    if (mortgageToggleBtn) {
        mortgageToggleBtn.style.display = hasMortgage ? '' : 'none';
        mortgageToggleBtn.textContent   = showMortgage ? 'Hide Mortgage' : 'Show Mortgage';
    }

    if (_debts.length === 0) {
        if (debtsSummaryEl) debtsSummaryEl.textContent = 'Total Debt: $0.00';
        debtsListContainer.innerHTML = `
            <div class="empty-state">
                No debts added yet.<br>Add your credit cards, loans, and other debts to start your payoff plan.
                <br><button class="empty-cta-btn" id="empty-add-debt-btn">+ Add Debt</button>
            </div>`;
        debtsListContainer.style.display = 'block';
        const emptyBtn = debtsListContainer.querySelector('#empty-add-debt-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openDebtModal());
        return;
    }

    const totalDebt = _debts.reduce((sum, d) => sum + d.balance, 0);
    if (debtsSummaryEl) {
        debtsSummaryEl.textContent = `Total Debt: $${totalDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    debtsListContainer.style.display = 'block';
    const ordered    = getStrategyOrder(_debts, strategy);
    const currentDay = new Date().getDate();

    // Apply mortgage filter; keep global order index for order badge numbers
    const visible = showMortgage ? ordered : ordered.filter(d => d.type !== 'mortgage');

    const promoDebts   = visible.filter(d => d.promoZeroInterest);
    const regularDebts = visible.filter(d => !d.promoZeroInterest);

    // The "target" debt is the first in the full visible list
    const targetId = visible[0]?.id;

    function buildDebtCard(debt, globalIdx) {
        const isPastDue    = (debt.dueDay || 1) <= currentDay;
        const payoffMonths = simResults?.debtPayoffMonths?.[debt.id];
        const isTarget     = debt.id === targetId;
        const paidState    = _paidStatus[debt.id];

        const debtElt = document.createElement('div');
        debtElt.className = 'debt-card' +
            (debt.promoZeroInterest ? ' promo-card' : '') +
            (paidState ? ' card-paid' : '') +
            (isTarget ? ' snowball-target-card' : '');
        debtElt.style.animation = `cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards ${globalIdx * 0.09}s`;

        const promoBadge = debt.promoZeroInterest ? '<span class="promo-badge">🎉 0% Promo</span>' : '';
        const autoBadge  = debt.autoPay ? '<span class="autopay-badge">⚡ Auto-Pay</span>' : '';

        const typeLabel = debt.type
            ? debt.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
            : '';
        const typeIcon = debt.type === 'credit-card' ? '💳'
            : debt.type === 'personal-loan' ? '🤝'
            : debt.type === 'student-loan' ? '🎓'
            : debt.type === 'auto-loan' ? '🚗'
            : debt.type === 'mortgage' ? '🏠'
            : '📌';
        const typeBadge = debt.type
            ? `<span class="debt-type-badge ${debt.type === 'credit-card' ? 'card-badge' : ''}">${typeIcon} ${typeLabel}</span>`
            : '';

        let promoExpiryRow = '';
        if (debt.promoZeroInterest && debt.promoExpiryDate) {
            const expStr = new Date(debt.promoExpiryDate+'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
            promoExpiryRow = `<div class="debt-detail"><span class="debt-detail-label">Promo Expires</span><span class="debt-detail-value promo-expiry-value">${expStr}</span></div>`;
        }

        const rateDisplay = debt.promoZeroInterest
            ? '0% APR <span class="promo-auto-note">(promo)</span>'
            : `${debt.rate}% APR`;

        const minPayNote = debt.promoZeroInterest ? '<span class="promo-auto-note">(auto: payoff by promo end)</span>' : '';

        const payoffLine = payoffMonths != null
            ? `<div class="debt-detail payoff-months-row">
                <span class="debt-detail-label">Paid off in</span>
                <span class="debt-detail-value payoff-months-value">${payoffMonths} month${payoffMonths !== 1 ? 's' : ''}</span>
               </div>`
            : '';

        const targetBadge = isTarget
            ? `<div class="snowball-target-banner">${strategy === 'snowball' ? '❄️' : '🌊'} ${strategy === 'snowball' ? 'Snowball' : 'Avalanche'} Target — extra payments go here</div>`
            : '';

        const payUrlRow = debt.paymentUrl
            ? `<div class="debt-detail debt-pay-url-row">
                <a href="${escHtml(debt.paymentUrl)}" target="_blank" rel="noopener noreferrer" class="btn-pay-now">Pay Now →</a>
               </div>`
            : '';

        const paidOverlay = paidState ? buildPaidOverlay(debt.autoPay) : '';

        debtElt.innerHTML = `
            ${paidOverlay}
            <div class="debt-order-badge" title="${strategy === 'snowball' ? 'Payoff order: smallest balance first' : 'Payoff order: highest interest first'}">${globalIdx + 1}</div>
            <div class="debt-name">${escHtml(debt.name)}</div>
            <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.35rem;">${typeBadge}${promoBadge}${autoBadge}</div>
            ${targetBadge}
            <div class="debt-detail debt-balance-row"><span class="debt-detail-label">Balance</span><span class="debt-detail-value debt-balance-value">${formatMoney(debt.balance)}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Interest Rate</span><span class="debt-detail-value">${rateDisplay}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Min Payment</span><span class="debt-detail-value">${formatMoney(debt.minPayment)} ${minPayNote}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Due Day</span><span class="debt-detail-value">${formatOrdinal(debt.dueDay||1)} of each month</span></div>
            ${promoExpiryRow}
            ${payoffLine}
            ${payUrlRow}
            <div class="paid-action-row">${buildPaidButton(debt.id, debt.autoPay, paidState, isPastDue)}</div>
            <div class="debt-actions">
                <button class="btn btn-secondary btn-edit" data-id="${debt.id}">Edit</button>
                <button class="btn btn-danger btn-delete" data-id="${debt.id}">Delete</button>
            </div>`;

        return debtElt;
    }

    function appendSection(debtsSubset, globalOffset, headerEl) {
        const wrapper = document.createElement('div');
        if (headerEl) wrapper.appendChild(headerEl);
        const grid = document.createElement('div');
        grid.className = 'debts-list';
        grid.style.display = 'grid';
        debtsSubset.forEach((debt, i) => grid.appendChild(buildDebtCard(debt, globalOffset + i)));
        wrapper.appendChild(grid);
        debtsListContainer.appendChild(wrapper);
    }

    if (promoDebts.length > 0) {
        const header = document.createElement('div');
        header.className = 'promo-section-header';
        const promoTotal = promoDebts.reduce((s, d) => s + d.balance, 0);
        header.innerHTML = `<span>🎉 0% Promo — Pay Off Before Rate Jumps!</span><span>${formatMoney(promoTotal)}</span>`;
        appendSection(promoDebts, 0, header);
    }

    if (regularDebts.length > 0) {
        let header = null;
        if (promoDebts.length > 0) {
            header = document.createElement('div');
            header.className = 'regular-section-header';
            header.textContent = '📋 Standard Debts';
        }
        appendSection(regularDebts, promoDebts.length, header);
    }

    debtsListContainer.querySelectorAll('.btn-edit').forEach(b   => b.addEventListener('click', e => openDebtModal(e.target.dataset.id)));
    debtsListContainer.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', e => deleteDebt(e.target.dataset.id)));
    debtsListContainer.querySelectorAll('.btn-mark-paid').forEach(b => b.addEventListener('click', e => togglePaid(e.currentTarget.dataset.id, e.currentTarget.dataset.autopay === 'true')));
}

function buildPaidButton(id, autoPay, paidState, isPastDue) {
    if (paidState) {
        return `<button class="btn btn-paid-undo btn-mark-paid" data-id="${id}" data-autopay="${!!autoPay}">✓ Paid this month — tap to undo</button>`;
    }
    if (autoPay) {
        if (isPastDue) {
            return `<button class="btn btn-mark-paid" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; font-weight: 600; width: 100%; font-size: 0.8rem; padding: 0.5rem 1rem;" data-id="${id}" data-autopay="true">⚡ Auto-Paid</button>`;
        } else {
            return `<button class="btn" disabled style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); width: 100%; font-size: 0.8rem; padding: 0.5rem 1rem; cursor: not-allowed;">⚡ Scheduled for Auto-Pay</button>`;
        }
    }
    return `<button class="btn btn-mark-paid-action btn-mark-paid" data-id="${id}" data-autopay="false">Mark as Paid This Month</button>`;
}

function buildPaidOverlay(autoPay) {
    // We only show an overlay once it has actually been paid/confirmed
    return `
        <div class="paid-overlay">
            <span class="paid-overlay-icon">✓</span>
            <span class="paid-overlay-text">Paid This Month</span>
        </div>`;
}
