import { appState } from './state.js';
import { currentMonthKey } from '../core/date-utils.js';
import { calcAutoMin, escHtml, formatMoney } from '../core/pure-utils.js';
import { getStrategyOrder, runSimulation } from '../core/simulation.js';
import { showNotificationToast } from './render-export.js';

// ─── Countdown Timer ─────────────────────────────────────────────────────────
function startCountdown(payoffDate) {
    stopCountdown();
    updateCountdownDisplay(payoffDate);
    appState.countdownInterval = setInterval(() => updateCountdownDisplay(payoffDate), 60000);
}
function stopCountdown() {
    if (appState.countdownInterval) { clearInterval(appState.countdownInterval); appState.countdownInterval = null; }
}

function updateCountdownDisplay(payoffDate) {
    const el = appState._root.getElementById('stat-countdown');
    if (!el) return;
    const now  = new Date();
    const diff = payoffDate - now;
    if (diff <= 0) { el.textContent = '🎉 Debt Free!'; return; }
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    el.textContent = days.toLocaleString();
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

function calcWindfall() {
    const amount = parseFloat(appState._root.getElementById('windfall-amount').value);
    if (!amount || amount <= 0) { showNotificationToast('Enter a windfall amount first.', 'error'); return; }

    const baseResult = runSimulation(appState.strategy);
    if (!baseResult.valid) { showNotificationToast('Fix your budget setup first.', 'error'); return; }

    // Run simulation with windfall applied optimally:
    // Distribute across debts in strategy order (strategy target gets it all first,
    // cascading remainder to the next if fully paid off)
    const windfallResult = runSimulationWithWindfall(amount, appState.strategy);

    const today = new Date();
    const baseDateStr   = new Date(today.getFullYear(), today.getMonth() + baseResult.monthsElapsed, 1)
        .toLocaleDateString(undefined, { month:'short', year:'numeric' });
    const afterDateStr  = new Date(today.getFullYear(), today.getMonth() + windfallResult.monthsElapsed, 1)
        .toLocaleDateString(undefined, { month:'short', year:'numeric' });

    appState._root.getElementById('wf-before-date').textContent     = baseDateStr;
    appState._root.getElementById('wf-before-interest').textContent = formatMoney(baseResult.totalInterestPaid);
    appState._root.getElementById('wf-before-months').textContent   = baseResult.monthsElapsed;
    appState._root.getElementById('wf-after-date').textContent      = afterDateStr;
    appState._root.getElementById('wf-after-interest').textContent  = formatMoney(windfallResult.totalInterestPaid);
    appState._root.getElementById('wf-after-months').textContent    = windfallResult.monthsElapsed;

    const monthsSaved    = baseResult.monthsElapsed - windfallResult.monthsElapsed;
    const interestSaved  = baseResult.totalInterestPaid - windfallResult.totalInterestPaid;
    const banner         = appState._root.getElementById('windfall-savings-banner');

    if (monthsSaved > 0 || interestSaved > 0.01) {
        banner.className   = 'windfall-savings-banner windfall-savings-positive';
        banner.innerHTML   = `🎉 You'd be debt-free <strong>${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner</strong> and save <strong>${formatMoney(interestSaved)}</strong> in interest!`;
    } else {
        banner.className   = 'windfall-savings-banner';
        banner.innerHTML   = `This windfall would fully eliminate your debt — congratulations!`;
    }

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

function runSimulationWithWindfall(windfall, strat) {
    // Clone debts and apply windfall in strategy order before simulating
    let simDebts = appState.debts.map(d => ({ ...d }));
    const ordered = getStrategyOrder(simDebts, strat);
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
function initTabs() {
    const tabBtns   = appState._root.querySelectorAll('.tab-btn');
    const tabPanels = appState._root.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const panel = appState._root.getElementById('tab-' + target);
            if (panel) panel.classList.add('active');

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
}


export { autoCalcMinPayment, autoCalcMinPaymentCC, calcWindfall, closeWindfallModal, initTabs, launchConfetti, maybeShowCheckin, openWindfallModal, runSimulationWithWindfall, showAutoMinHint, startCountdown, stopCountdown, updateAutoMinHint, updateCountdownDisplay };
