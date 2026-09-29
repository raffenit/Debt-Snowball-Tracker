import { appState } from './state.js';
import { currentMonthKey, isCostDueThisMonth } from '../core/date-utils.js';
import { calcAutoMin, escHtml, formatMoney } from '../core/pure-utils.js';
import { getStrategyOrder, planHoldTypes, simulatePayoff } from '../core/simulation.js';
import { showNotificationToast } from './render-export.js';

// ─── Countdown Timer ─────────────────────────────────────────────────────────
function startCountdown(payoffDate, asideDate = null) {
    stopCountdown();
    appState.lastSimPayoffDate = payoffDate;
    appState.lastSimPayoffAsideDate = asideDate;
    updateCountdownDisplay();
    appState.countdownInterval = setInterval(updateCountdownDisplay, 60000);
}
function stopCountdown() {
    if (appState.countdownInterval) { clearInterval(appState.countdownInterval); appState.countdownInterval = null; }
}

function paintCountdown(el, payoffDate) {
    if (!el || !payoffDate) return;
    const diff = payoffDate - new Date();
    if (diff <= 0) { el.textContent = '🎉 Debt Free!'; return; }
    el.textContent = Math.ceil(diff / (1000 * 60 * 60 * 24)).toLocaleString();
}

function updateCountdownDisplay() {
    paintCountdown(appState._root.getElementById('stat-countdown'), appState.lastSimPayoffDate);
    paintCountdown(appState._root.getElementById('stat-countdown-ex-mortgage'), appState.lastSimPayoffAsideDate);
}

function autoCalcMinPaymentCC() {
    const balance = parseFloat(appState._root.getElementById('debt-balance').value) || 0;
    const rate    = parseFloat(appState._root.getElementById('debt-rate').value) || 0;
    const min     = calcAutoMin(balance, rate);
    if (min !== null) {
        appState._root.getElementById('debt-min-payment').value = min.toFixed(2);
        showAutoMinHint(min, balance, rate);
    }
}

function updateAutoMinHint() {
    // Only show hint when both fields have values, don't overwrite the field
    const balance = parseFloat(appState._root.getElementById('debt-balance').value) || 0;
    const rate    = parseFloat(appState._root.getElementById('debt-rate').value) || 0;
    if (balance > 0 && rate >= 0) {
        const min = calcAutoMin(balance, rate);
        if (min !== null) showAutoMinHint(min, balance, rate);
    } else {
        const hint = appState._root.getElementById('auto-min-hint');
        hint.style.display = 'none';
    }
}

function showAutoMinHint(min, balance, rate) {
    const hint = appState._root.getElementById('auto-min-hint');
    hint.textContent  = `Suggested minimum: ${formatMoney(min)} (1% of balance + monthly interest, min $25)`;
    hint.style.display = 'block';
}

// Override promo autoCalcMinPayment to also clear hint
function autoCalcMinPayment() {
    if (!appState._root.getElementById('debt-promo-toggle').checked) return;
    const balance    = parseFloat(appState._root.getElementById('debt-balance').value) || 0;
    const expiryDate = appState._root.getElementById('debt-promo-expiry').value;
    if (!expiryDate || balance <= 0) return;
    const now    = new Date();
    const expiry = new Date(expiryDate + 'T00:00:00');
    const diff   = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    if (diff > 0) {
        appState._root.getElementById('debt-min-payment').value = (Math.ceil((balance / diff) * 100) / 100).toFixed(2);
    }
    appState._root.getElementById('auto-min-hint').style.display = 'none';
}

// ─── Windfall Planner ────────────────────────────────────────────────────────
function openWindfallModal() {
    appState._root.getElementById('windfall-amount').value = '';
    appState._root.getElementById('windfall-results').style.display = 'none';
    appState.windfallModal.style.display = 'flex';
    void appState.windfallModal.offsetWidth;
    appState.windfallModal.classList.add('active');
    setTimeout(() => appState._root.getElementById('windfall-amount').focus(), 50);
}

function closeWindfallModal() {
    appState.windfallModal.classList.remove('active');
    setTimeout(() => { appState.windfallModal.style.display = 'none'; }, 300);
}

// The payoff sim lives in core/simulation.js and takes an explicit state
// snapshot — feed it live appState scoped to the working month.
function runSimulation(strat) {
    const hold = planHoldTypes(appState);
    return simulatePayoff({
        debts:          appState.debts,
        incomeEntries:  appState.incomeEntries,
        recurringCosts: appState.recurringCosts,
        monthKey:       appState.workingMonthKey || currentMonthKey(),
        ...(hold.length ? { holdMinimumTypes: hold } : {}),
    }, strat);
}

function calcWindfall() {
    const amount = parseFloat(appState._root.getElementById('windfall-amount').value);
    if (!amount || amount <= 0) { showNotificationToast('Enter a windfall amount first.', 'error'); return; }

    const baseResult = runSimulation(appState.strategy);
    // Allow windfall calculation even when base simulation is invalid — the windfall
    // itself might be enough to make the scenario work (budget too low is exactly when
    // this tool is most useful: "what if I add a lump sum to make this work?")
    const baseMonths = baseResult.valid ? baseResult.monthsElapsed : null;
    const baseInterest = baseResult.valid ? baseResult.totalInterestPaid : null;

    // Run simulation with windfall applied optimally:
    // Distribute across debts in strategy order (strategy target gets it all first,
    // cascading remainder to the next if fully paid off)
    const windfallResult = runSimulationWithWindfall(amount, appState.strategy);

    const today = new Date();
    const baseDateStr   = baseMonths
        ? new Date(today.getFullYear(), today.getMonth() + baseMonths, 1).toLocaleDateString(undefined, { month:'short', year:'numeric' })
        : 'Unknown (budget too low)';
    const afterDateStr  = new Date(today.getFullYear(), today.getMonth() + windfallResult.monthsElapsed, 1)
        .toLocaleDateString(undefined, { month:'short', year:'numeric' });

    appState._root.getElementById('wf-before-date').textContent     = baseDateStr;
    appState._root.getElementById('wf-before-interest').textContent = baseInterest ? formatMoney(baseInterest) : 'N/A';
    appState._root.getElementById('wf-before-months').textContent   = baseMonths ? baseMonths : 'N/A';
    appState._root.getElementById('wf-after-date').textContent      = afterDateStr;
    appState._root.getElementById('wf-after-interest').textContent = formatMoney(windfallResult.totalInterestPaid);
    appState._root.getElementById('wf-after-months').textContent    = windfallResult.monthsElapsed;

    const monthsSaved    = baseMonths ? (baseMonths - windfallResult.monthsElapsed) : 0;
    const interestSaved  = baseInterest ? (baseInterest - windfallResult.totalInterestPaid) : 0;
    const banner         = appState._root.getElementById('windfall-savings-banner');

    if (baseMonths === null) {
        banner.className   = 'windfall-savings-banner';
        banner.innerHTML   = `Your current budget is too low to calculate a baseline. The windfall may be enough to get you on track.`;
    } else if (monthsSaved > 0 || interestSaved > 0.01) {
        banner.className   = 'windfall-savings-banner windfall-savings-positive';
        banner.innerHTML   = `🎉 You'd be debt-free <strong>${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner</strong> and save <strong>${formatMoney(interestSaved)}</strong> in interest!`;
    } else {
        banner.className   = 'windfall-savings-banner';
        banner.innerHTML   = `This windfall would fully eliminate your debt — congratulations!`;
    }

    // Show apply button
    const applyBtn = appState._root.getElementById('windfall-apply-btn');
    if (applyBtn) applyBtn.style.display = 'block';

    // Show per-debt allocation
    const alloc = appState._root.getElementById('windfall-allocation');
    alloc.innerHTML = '<div class="windfall-alloc-title">Optimal allocation:</div>';
    windfallResult.allocation.forEach(a => {
        const pct = Math.min(100, (a.applied / amount) * 100);
        alloc.innerHTML += `
            <div class="windfall-alloc-row">
                <span class="windfall-alloc-name">${escHtml(a.name)}</span>
                <span class="windfall-alloc-amount">${formatMoney(a.applied)}</span>
                <div class="windfall-alloc-bar"><div class="windfall-alloc-fill" style="width:${pct}%"></div></div>
            </div>`;
    });

    appState._root.getElementById('windfall-results').style.display = 'block';
}

function applyWindfall() {
    const amount = parseFloat(appState._root.getElementById('windfall-amount').value);
    if (!amount || amount <= 0) { showNotificationToast('Enter a windfall amount first.', 'error'); return; }

    const result = runSimulationWithWindfall(amount, appState.strategy);
    if (!result.valid) { showNotificationToast('Cannot apply payment — simulation failed.', 'error'); return; }

    // Apply the windfall to actual debt balances
    // result.allocation contains { name, applied } for each debt in strategy order
    const ordered = getStrategyOrder(appState.debts, appState.strategy);
    const originalBalances = {};
    const originalOverrides = {};
    result.allocation.forEach((a, idx) => {
        const debt = ordered[idx];
        if (debt) {
            originalBalances[debt.id] = debt.balance;
            originalOverrides[debt.id] = appState.minPayOverrides[debt.id];
            debt.balance = Math.max(0, debt.balance - a.applied);
            // If this fully pays off the debt, set the override to the payment amount
            // so it shows in cash flow for this month
            if (debt.balance === 0 && a.applied > 0) {
                appState.minPayOverrides[debt.id] = a.applied;
            }
        }
    });

    saveDataAndRender();
    closeWindfallModal();
    launchConfetti();
    showUndoToast('Windfall applied', () => {
        Object.entries(originalBalances).forEach(([id, bal]) => {
            const debt = appState.debts.find(d => d.id === id);
            if (debt) debt.balance = bal;
            if (originalOverrides[id] !== undefined) {
                appState.minPayOverrides[id] = originalOverrides[id];
            } else {
                delete appState.minPayOverrides[id];
            }
        });
        saveDataAndRender();
    });
}

function runSimulationWithWindfall(windfall, strat) {
    // Clone debts and apply windfall in strategy order before simulating
    let simDebts = appState.debts.map(d => ({ ...d }));
    const ordered = getStrategyOrder(simDebts, strat)
        .filter(d => appState.includeMortgageOnTimeline || d.type !== 'mortgage');
    let remaining = windfall;
    const allocation = [];

    for (const debt of ordered) {
        if (remaining <= 0) break;
        const apply = Math.min(remaining, debt.balance);
        const live  = simDebts.find(d => d.id === debt.id);
        if (live) { live.balance = Math.max(0, live.balance - apply); }
        allocation.push({ name: debt.name, applied: apply });
        remaining -= apply;
    }

    // Now run the full simulation on the reduced balances
    // Temporarily swap debts, run simulation, restore
    const originalDebts = appState.debts;
    appState.debts = simDebts.filter(d => d.balance > 0.01);
    const result = runSimulation(strat);
    appState.debts = originalDebts;

    result.allocation = allocation;
    return result;
}

// ─── Monthly Check-In Prompt ──────────────────────────────────────────────────
function maybeShowCheckin() {
    if (appState.debts.length === 0) return;
    const dismissed  = localStorage.getItem('snowball_checkin_dismissed');
    const thisMonth  = currentMonthKey();
    if (dismissed === thisMonth) return;

    // Populate debt list in the modal
    const listEl = appState._root.getElementById('checkin-debt-list');
    listEl.innerHTML = '';
    appState.debts.forEach(d => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;font-size:0.85rem;';
        row.innerHTML = `<span style="color:var(--text-primary);font-weight:500;">${escHtml(d.name)}</span>
                         <span style="color:var(--text-secondary);">Current: ${formatMoney(d.balance)}</span>`;
        listEl.appendChild(row);
    });

    appState.checkinModal.style.display = 'flex';
    void appState.checkinModal.offsetWidth;
    appState.checkinModal.classList.add('active');
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function launchConfetti() {
    const canvas  = appState._root.getElementById('confetti-canvas');
    const ctx     = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const COLORS  = ['#3b82f6','#10b981','#f59e0b','#ef4444','#a855f7','#ec4899','#14b8a6','#f97316'];
    const PIECES  = 140;
    const particles = [];

    for (let i = 0; i < PIECES; i++) {
        particles.push({
            x:    canvas.width  * Math.random(),
            y:    -20 - Math.random() * canvas.height * 0.3,
            w:    6  + Math.random() * 8,
            h:    10 + Math.random() * 8,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * Math.PI * 2,
            vx:   (Math.random() - 0.5) * 4,
            vy:   2.5 + Math.random() * 4,
            vr:   (Math.random() - 0.5) * 0.25,
            opacity: 1,
        });
    }

    let frame = 0;
    const MAX_FRAMES = 160;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frame++;
        const fadeStart = MAX_FRAMES * 0.6;

        particles.forEach(p => {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += 0.12; // gravity
            p.rotation += p.vr;
            if (frame > fadeStart) p.opacity = Math.max(0, 1 - (frame - fadeStart) / (MAX_FRAMES - fadeStart));

            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            // Alternate between rect and circle shapes
            if (p.w > 11) {
                ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            } else {
                ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
            ctx.fill();
            ctx.restore();
        });

        if (frame < MAX_FRAMES) {
            requestAnimationFrame(draw);
        } else {
            canvas.style.display = 'none';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    requestAnimationFrame(draw);
}


// ─── Tab Navigation ───────────────────────────────────────────────────────────
function fitTabLabels() {
    const nav = appState._root.querySelector('.tab-nav');
    if (!nav || nav.dataset.fitting === '1') return;
    nav.dataset.fitting = '1';
    nav.classList.remove('tabs-icons');
    const overflows = nav.scrollWidth > nav.clientWidth + 1;
    nav.classList.toggle('tabs-icons', overflows);
    delete nav.dataset.fitting;
}

function syncTabPageTitle() {
    const titleEl = appState._root.querySelector('.tab-page-title');
    const active = appState._root.querySelector('.tab-btn.active');
    if (!titleEl || !active) return;
    titleEl.textContent = active.getAttribute('title') || '';
}

function initTabs() {
    const tabBtns   = appState._root.querySelectorAll('.tab-btn');
    const tabPanels = appState._root.querySelectorAll('.tab-panel');
    const nav       = appState._root.querySelector('.tab-nav');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const panel = appState._root.getElementById('tab-' + target);
            if (panel) panel.classList.add('active');
            syncTabPageTitle();

            // Persist active tab
            localStorage.setItem('snowball_active_tab', target);
        });
    });

    // Restore last active tab
    const savedTab = localStorage.getItem('snowball_active_tab');
    if (savedTab) {
        const savedBtn = appState._root.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
        if (savedBtn) savedBtn.click();
    }

    syncTabPageTitle();
    fitTabLabels();
    if (nav && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => fitTabLabels());
        observer.observe(nav);
    }
}


function renderBabySteps() {
    const host = appState._root?.getElementById('baby-steps');
    if (!host) return;
    const debts = appState.debts || [];
    const others = debts.filter(d => d.type !== 'mortgage' && d.balance > 0);
    const mortgages = debts.filter(d => d.type === 'mortgage' && d.balance > 0);
    const monthKey = appState.workingMonthKey || currentMonthKey();
    const billTotal = [
        ...(appState.recurringCosts || []).filter(c => isCostDueThisMonth(c, monthKey)),
        ...(appState.oneTimeCosts || []),
    ].reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);
    const minTotal = debts.filter(d => d.balance > 0).reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
    const monthly = billTotal + minTotal;
    const marked = appState.babySteps || {};
    const steps = [
        { n: 1, title: '$1,000 starter emergency fund', manual: true, detail: 'Cash set aside before the snowball.' },
        { n: 2, title: 'Pay off every debt except the house', detail: others.length
            ? `${others.length} left: ${others.map(d => d.name).join(', ')}`
            : 'Nothing left outside the mortgage.' },
        { n: 3, title: 'Save 3–6 months of expenses', manual: true, detail: monthly > 0
            ? `Bills and minimums are about ${formatMoney(monthly)} a month, so 3–6 months is ${formatMoney(monthly * 3)}–${formatMoney(monthly * 6)}.`
            : 'Add bills and debts to estimate 3–6 months of expenses.' },
        { n: 4, title: 'Invest 15% of income for retirement', manual: true, detail: 'After the snowball and the full emergency fund.' },
        { n: 5, title: 'College funding', manual: true, detail: 'Mark done if this does not apply.' },
        { n: 6, title: 'Pay off the house', detail: mortgages.length
            ? `${formatMoney(mortgages.reduce((s, d) => s + d.balance, 0))} left on the mortgage.`
            : 'No mortgage balance.' },
        { n: 7, title: 'Build wealth and give', manual: true, detail: 'The last step.' },
    ];
    const done = step => {
        if (step.n === 2) return others.length === 0;
        if (step.n === 6) return mortgages.length === 0;
        return !!marked[String(step.n)];
    };
    const current = steps.find(step => !done(step));
    host.innerHTML = `<p class="baby-steps-title">Baby steps</p>` + steps.map(step => {
        const isDone = done(step);
        const isCurrent = current && current.n === step.n;
        const mark = step.manual
            ? `<button type="button" class="baby-step-mark" data-baby-step="${step.n}">${isDone ? 'Done' : 'Mark done'}</button>`
            : '';
        return `<div class="baby-step${isCurrent ? ' is-current' : ''}${isDone ? ' is-done' : ''}">
            <span class="baby-step-index">${isDone ? '✓' : step.n}</span>
            <span class="baby-step-title">${escHtml(step.title)}</span>
            ${mark}
            <span class="baby-step-detail">${escHtml(step.detail)}</span>
        </div>`;
    }).join('');
}

export { applyWindfall, autoCalcMinPayment, autoCalcMinPaymentCC, calcWindfall, closeWindfallModal, initTabs, launchConfetti, maybeShowCheckin, openWindfallModal, renderBabySteps, runSimulationWithWindfall, showAutoMinHint, startCountdown, stopCountdown, updateAutoMinHint, updateCountdownDisplay };
