import { appState } from './state.js';
import { addMonthsToKey, currentMonthKey, formatMonthLabel, generateRecurringIncomeForMonth, isCostDueInMonth, isCostDueThisMonth } from '../core/date-utils.js';
import { escHtml, formatMoney, formatOrdinal } from '../core/pure-utils.js';
import { getStrategyOrder } from '../core/simulation.js';
import { getBudgetAmount } from './render-budgets.js';
import { renderPaydownChart, renderTimelineChart } from './render-charts.js';
import { startCountdown, stopCountdown } from './render-support.js';

// ─── Core Simulation ─────────────────────────────────────────────────────────
// Date-aware: income arrives on its specific day-of-month, payments are only
// made after sufficient cash has arrived. Returns a rich result object used
// for both the chart and the debt cards.
function runSimulation(strat) {
    const totalIncome         = appState.incomeEntries.reduce((s,e) => s + e.amount, 0);
    const activeCosts          = appState.recurringCosts.filter(c => isCostDueThisMonth(c));
    // Timeline projection uses recurring costs only; one-time costs are separate.
    const totalRecurringDirect = activeCosts.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurringCard   = activeCosts.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurring       = activeCosts.reduce((s,c) => s + c.amount, 0);
    // Only direct-payment costs reduce the immediate cash available for debt payoff;
    // card-charged costs are already folded into the card's minimum payment.
    const effectiveBudget = totalIncome - totalRecurringDirect;

    if (appState.debts.length === 0 || totalIncome <= 0 || effectiveBudget <= 0) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget };
    }

    const totalMinPayments = appState.debts.reduce((s,d) => s + d.minPayment, 0);
    if (effectiveBudget < totalMinPayments) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget, belowMin: true, totalMinPayments };
    }

    // Build income day schedule (sorted)
    const incomeDays = [...appState.incomeEntries
        .map(e => ({ day: parseInt(e.date.split('-')[2]), amount: e.amount }))
        .sort((a,b) => a.day - b.day)];

    let simDebts = appState.debts.map(d => ({ ...d, interestPaid: 0 }));
    const MAX_MONTHS = 1200;
    let monthsElapsed     = 0;
    let totalInterestPaid = 0;
    let payoffLog         = [];

    // Per-debt monthly balance snapshots
    const perDebtMonthly = {};
    simDebts.forEach(d => { perDebtMonthly[d.id] = [d.balance]; });

    // Get day 1 checkpoint amount for initial cash
    const day1Checkpoint = appState.checkpoints.find(cp => cp.day === 1);
    const day1Balance = day1Checkpoint ? day1Checkpoint.amount : 0;

    while (simDebts.some(d => d.balance > 0) && monthsElapsed < MAX_MONTHS) {
        monthsElapsed++;
        // Add starting cash in first month to the monthly available amount
        let availableCash = effectiveBudget + (monthsElapsed === 1 ? day1Balance : 0); // eslint-disable-line no-unused-vars

        // 1. Accrue interest
        simDebts.forEach(d => {
            if (d.balance <= 0) return;
            let effectiveRate = d.rate;
            if (d.promoZeroInterest && d.promoExpiryDate) {
                const today   = new Date();
                const simDate = new Date(today.getFullYear(), today.getMonth() + monthsElapsed, 1);
                if (simDate <= new Date(d.promoExpiryDate+'T00:00:00')) effectiveRate = 0;
                else effectiveRate = d.originalRate || d.rate;
            }
            const interest     = d.balance * (effectiveRate / 100 / 12);
            d.balance         += interest;
            totalInterestPaid += interest;
            d.interestPaid    += interest;
        });

        // 2. Date-aware payment scheduling
        const alive    = simDebts.filter(d => d.balance > 0);
        const ordered  = getStrategyOrder(alive, strat);
        const targetId = ordered[0]?.id;
        const aliveMinSum   = alive.reduce((s,d) => s + d.minPayment, 0);
        const extraAvail    = Math.max(0, effectiveBudget - aliveMinSum);

        // Build payment queue sorted by due day
        const paymentQueue = alive.map(d => ({
            id:     d.id,
            dueDay: d.dueDay || 1,
            needed: Math.min(
                d.balance,
                d.minPayment + (d.id === targetId ? Math.min(extraAvail, Math.max(0, d.balance - d.minPayment)) : 0)
            )
        })).sort((a,b) => a.dueDay - b.dueDay);

        let cashPool   = 0;
        let incomeIdx  = 0;

        for (const payment of paymentQueue) {
            // Advance income whose day <= payment due day
            while (incomeIdx < incomeDays.length && incomeDays[incomeIdx].day <= payment.dueDay) {
                cashPool += incomeDays[incomeIdx++].amount;
            }
            // If still short, pull remaining income (payment deferred until next check)
            while (cashPool < payment.needed && incomeIdx < incomeDays.length) {
                cashPool += incomeDays[incomeIdx++].amount;
            }

            const debt   = simDebts.find(d => d.id === payment.id);
            if (!debt || debt.balance <= 0) continue;
            const actual = Math.min(payment.needed, cashPool, debt.balance);
            cashPool    -= actual;
            debt.balance = Math.max(0, debt.balance - actual);

            if (debt.balance <= 0.01) {
                debt.balance = 0;
                if (!payoffLog.find(l => l.id === debt.id)) {
                    payoffLog.push({ ...debt, payoffMonth: monthsElapsed });
                }
            }
        }

        // Snapshot balances this month
        simDebts.forEach(d => {
            perDebtMonthly[d.id].push(Math.max(0, d.balance));
        });
    }

    const debtPayoffMonths = {};
    payoffLog.forEach(l => { debtPayoffMonths[l.id] = l.payoffMonth; });

    const maxLen = Math.max(...Object.values(perDebtMonthly).map(a => a.length));
    const monthlyTotals = Array.from({ length: maxLen }, (_,i) =>
        Object.values(perDebtMonthly).reduce((sum, arr) => sum + (arr[i] ?? 0), 0)
    );

    return {
        valid: true,
        monthsElapsed,
        totalInterestPaid,
        payoffLog,
        monthlyTotals,
        perDebtMonthly,
        debtPayoffMonths,
        totalIncome,
        totalRecurring,
        effectiveBudget
    };
}

// ─── Visualization ───────────────────────────────────────────────────────────
function renderVisualization(simResults) {
    const statTotalDebt     = appState._root.getElementById('stat-total-debt');
    const statTotalInterest = appState._root.getElementById('stat-total-interest');
    const statSavingsBox    = appState._root.getElementById('stat-savings-box');
    const statSavings       = appState._root.getElementById('stat-savings');
    const statSavingsLabel  = appState._root.getElementById('stat-savings-label');
    const stratDesc         = appState._root.getElementById('strategy-desc');
    const timelineChart     = appState._root.getElementById('timeline-chart');
    const countdownBox      = appState._root.getElementById('stat-countdown-box');
    const payoffBoxAlt      = appState._root.getElementById('stat-payoff-box');
    const windfallBar       = appState._root.getElementById('windfall-bar');

    // Get archive data if in archive view
    const isArchiveViewTimeline = appState.viewingArchiveIndex !== null && !!appState.monthlyArchives[appState.viewingArchiveIndex];
    const archiveDataForDebt = isArchiveViewTimeline ? appState.monthlyArchives[appState.viewingArchiveIndex] : null;
    const debtsForCalc = archiveDataForDebt ? (archiveDataForDebt.debts || appState.debts) : appState.debts;
    
    const initialTotalDebt = debtsForCalc.reduce((s,d) => s + d.balance, 0);
    statTotalDebt.textContent = formatMoney(initialTotalDebt);

    stratDesc.textContent = appState.strategy === 'snowball'
        ? 'Snowball: paying the smallest balance first. Quick wins build momentum and keep you motivated.'
        : 'Avalanche: paying the highest interest rate first. Mathematically optimal — minimises total interest paid.';

    // Show archive notice for historical months
    if (isArchiveViewTimeline) {
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        appState._root.getElementById('stat-payoff-date-alt').textContent = 'Historical Data';
        statTotalInterest.textContent = '-';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        stopCountdown();
        
        const totalDebtArchive = (archiveDataForDebt.debts || []).reduce((s,d) => s + d.balance, 0);
        
        timelineChart.innerHTML = `
            <div class="timeline-error-card" style="background: linear-gradient(145deg, rgba(91,127,255,0.08) 0%, rgba(168,85,247,0.05) 100%); border-color: rgba(91,127,255,0.2);">
                <span class="timeline-error-icon">📅</span>
                <div class="timeline-error-title">${formatMonthLabel(archiveDataForDebt.month)}</div>
                <div class="timeline-error-message">
                    This is a historical view. The timeline projection shows future payoff estimates based on <strong>current</strong> data, not historical snapshots.<br><br>
                    <strong>Total Debt this month:</strong> ${formatMoney(totalDebtArchive)}<br>
                    <strong>Income:</strong> ${formatMoney(archiveDataForDebt.totalIncome || 0)}<br>
                    <strong>Costs:</strong> ${formatMoney(archiveDataForDebt.totalCosts || 0)}
                </div>
                <div class="timeline-error-actions">
                    <button class="btn btn-primary" onclick="document.getElementById('plan-next-month-btn').click()">📅 Return to Current Month</button>
                </div>
            </div>`;
        renderPaydownChart([], {});
        return;
    }

    if (appState.debts.length === 0) {
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        appState._root.getElementById('stat-payoff-date-alt').textContent = '-';
        statTotalInterest.textContent = '$0.00';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        timelineChart.innerHTML = `
            <div class="timeline-error-card">
                <span class="timeline-error-icon">📊</span>
                <div class="timeline-error-title">No Debts Added</div>
                <div class="timeline-error-message">Add your credit cards, loans, and other debts to see your personalized payoff timeline and calculate your debt-free date.</div>
                <div class="timeline-error-actions">
                    <button class="btn btn-primary" onclick="document.querySelector('[data-tab=\"debts\"]').click()">💳 Add Your First Debt</button>
                </div>
            </div>`;
        renderPaydownChart([], {});
        stopCountdown();
        return;
    }

    if (!simResults.valid) {
        const { totalIncome, totalRecurring, effectiveBudget, totalMinPayments } = simResults;
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        appState._root.getElementById('stat-payoff-date-alt').textContent = 'Budget Too Low!';
        statTotalInterest.textContent = 'N/A';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        stopCountdown();
        
        let icon = '⚠️';
        let title = '';
        let message = '';
        let primaryAction = '';
        let secondaryAction = '';
        
        if ((totalIncome || 0) <= 0) {
            icon = '💰';
            title = 'No Income Added';
            message = 'You need to add income entries before we can calculate your payoff timeline. Tell us about your paychecks, deposits, or any other monthly income.';
            primaryAction = `<button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click(); setTimeout(() => document.getElementById('add-income-btn').click(), 100)">➕ Add Income</button>`;
        } else if ((effectiveBudget || 0) <= 0) {
            const _active              = appState.recurringCosts.filter(c => isCostDueThisMonth(c));
            const totalRecurringDirect = _active.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
            const totalRecurringCard   = _active.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
            icon = '📉';
            title = 'Budget Over-Committed';
            message = `Your income of ${formatMoney(totalIncome)} is entirely consumed by direct recurring costs of ${formatMoney(totalRecurringDirect)}.${totalRecurringCard > 0 ? ` (Card-charged costs of ${formatMoney(totalRecurringCard)} are already factored into card payments.)` : ''} You need to either increase income or reduce costs to free up money for debt payoff.`;
            primaryAction = `<button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click()">💰 Add Income</button>`;
            secondaryAction = `<button class="btn btn-warning" onclick="document.querySelector('[data-tab=\"income\"]').click()">📝 Review Costs</button>`;
        } else {
            icon = '💳';
            title = 'Can\'t Cover Minimum Payments';
            message = `Your effective budget of ${formatMoney(effectiveBudget)} is less than your total minimum payments of ${formatMoney(totalMinPayments)}. You need more available cash to make progress on your debts.`;
            primaryAction = `<button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click()">💰 Increase Income</button>`;
            secondaryAction = `<button class="btn btn-secondary" onclick="document.querySelector('[data-tab=\"debts\"]').click()">📉 Review Debts</button>`;
        }
        
        timelineChart.innerHTML = `
            <div class="timeline-error-card">
                <span class="timeline-error-icon">${icon}</span>
                <div class="timeline-error-title">${title}</div>
                <div class="timeline-error-message">${message}</div>
                <div class="timeline-error-actions">
                    ${primaryAction}
                    ${secondaryAction}
                </div>
            </div>`;
        renderPaydownChart([], {});
        return;
    }

    if (simResults.monthsElapsed >= 1200) {
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        appState._root.getElementById('stat-payoff-date-alt').textContent = '> 100 Years';
        statTotalInterest.textContent = 'Too High';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        stopCountdown();
        timelineChart.innerHTML = `
            <div class="timeline-error-card">
                <span class="timeline-error-icon">⏰</span>
                <div class="timeline-error-title">Payoff Exceeds 100 Years</div>
                <div class="timeline-error-message">With your current budget, these debts would take over 100 years to pay off. This usually means either the balances are very high compared to your available payoff budget, or interest rates are preventing progress.</div>
                <div class="timeline-error-actions">
                    <button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click()">💰 Increase Budget</button>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-tab=\"debts\"]').click()">📉 Review Debts</button>
                </div>
            </div>`;
        return;
    }

    const today      = new Date();
    const payoffDate = new Date(today.getFullYear(), today.getMonth() + simResults.monthsElapsed, 1);
    appState.lastSimPayoffDate = payoffDate;
    statTotalInterest.textContent = formatMoney(simResults.totalInterestPaid);

    // Countdown box
    countdownBox.style.display = 'block';
    payoffBoxAlt.style.display = 'none';
    windfallBar.style.display  = 'flex';
    appState._root.getElementById('stat-payoff-date').textContent =
        payoffDate.toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' });
    startCountdown(payoffDate);

    // Compare against the other appState.strategy
    const otherStrat  = appState.strategy === 'snowball' ? 'avalanche' : 'snowball';
    const otherLabel  = otherStrat.charAt(0).toUpperCase() + otherStrat.slice(1);
    const otherResult = runSimulation(otherStrat);
    if (otherResult.valid) {
        const interestDiff = otherResult.totalInterestPaid - simResults.totalInterestPaid;
        statSavingsBox.style.display  = 'block';
        statSavingsLabel.textContent  = `vs. ${otherLabel}`;
        if (interestDiff > 0.01) {
            statSavings.textContent = `Save ${formatMoney(interestDiff)}`;
            statSavings.style.color = 'var(--success-color)';
        } else if (interestDiff < -0.01) {
            statSavings.textContent = `${formatMoney(Math.abs(interestDiff))} more interest`;
            statSavings.style.color = 'var(--warning-color)';
        } else {
            statSavings.textContent = 'Same cost';
            statSavings.style.color = 'var(--text-secondary)';
        }
    } else {
        statSavingsBox.style.display = 'none';
    }

    renderTimelineChart(simResults.payoffLog, simResults.monthsElapsed);
    renderPaydownChart(simResults.monthlyTotals, simResults.perDebtMonthly);
}
// ─── Payment Plan ─────────────────────────────────────────────────────────────
function renderPaymentPlan() {
    const section = appState._root.getElementById('payment-plan-section');
    const list    = appState._root.getElementById('payment-plan-list');

    // ── Archive-view wiring ────────────────────────────────────────────────────
    const isArchiveView = appState.viewingArchiveIndex !== null && !!appState.monthlyArchives[appState.viewingArchiveIndex];
    const archiveData   = isArchiveView ? appState.monthlyArchives[appState.viewingArchiveIndex] : null;
    const _income       = archiveData ? (archiveData.incomeEntries  || []) : appState.incomeEntries;
    const _costs        = archiveData ? (archiveData.recurringCosts || []) : appState.recurringCosts;
    const _oneTimeCosts = archiveData ? (archiveData.oneTimeCosts   || []) : appState.oneTimeCosts;
    const _checkpoints  = archiveData ? (archiveData.checkpoints    || []) : appState.checkpoints;
    const _debts        = archiveData ? (archiveData.debts           || appState.debts) : appState.debts;
    const _startBal     = archiveData ? (archiveData.startingBalance || 0)  : appState.startingBalance;
    const _paidStatus   = archiveData ? (archiveData.paidStatus      || {}) : appState.paidStatus;
    const _monthKey     = archiveData ? archiveData.month : (appState.workingMonthKey || currentMonthKey());

    // ── Month title & navigation ───────────────────────────────────────────────
    const monthTitleEl = appState._root.getElementById('global-month-title');
    const prevBtn      = appState._root.getElementById('plan-prev-month-btn');
    const nextBtn      = appState._root.getElementById('plan-next-month-btn');

    const monthDisplay = formatMonthLabel(_monthKey);
    if (monthTitleEl) monthTitleEl.textContent = monthDisplay;

    if (prevBtn) {
        const prevIdx = isArchiveView ? appState.viewingArchiveIndex + 1 : 0;
        if (prevIdx < appState.monthlyArchives.length) {
            prevBtn.style.visibility = 'visible';
            prevBtn.dataset.archiveIdx = prevIdx;
        } else {
            prevBtn.style.visibility = 'hidden';
        }
    }
    if (nextBtn) nextBtn.style.visibility = isArchiveView ? 'visible' : 'hidden';

    list.innerHTML = '';

    if (_income.length === 0 && _checkpoints.length === 0) { section.style.display = 'none'; return; }

    const events = [];
    const today = new Date();
    const currentDay = today.getDate();

    _income.forEach(entry => {
        const day = parseInt(entry.date.split('-')[2]);
        events.push({ type:'income', id: entry.id, name: entry.label, day, date: new Date(entry.date+'T00:00:00'), amount: entry.amount, sortKey: day * 1000 });
    });

    _checkpoints.forEach(cp => {
        // Sortkey +0.5 ensures appState.checkpoints happen AFTER standard income on that day, but BEFORE bills are paid.
        events.push({ type: 'checkpoint', id: cp.id, name: 'Bank Balance Sync', day: cp.day, amount: cp.amount, sortKey: cp.day * 1000 + 0.5 });
    });

    _costs.filter(c => isCostDueInMonth(c, _monthKey)).forEach(cost => {
        const day = cost.dueDay || 1;
        events.push({
            type:'recurring',
            id: cost.id,
            name: cost.name,
            day,
            amount: cost.amount,
            paymentMethod: cost.paymentMethod || 'direct',
            amountType: cost.amountType || 'fixed',
            autoPay: !!cost.autoPay,
            sortKey: day * 1000 + 1
        });
    });

    // One-time costs always apply to the current month
    _oneTimeCosts.forEach(cost => {
        events.push({
            type: 'one-time',
            id: cost.id,
            name: cost.name,
            day: cost.dueDay || 1,
            amount: cost.amount,
            paymentMethod: cost.paymentMethod || 'direct',
            amountType: cost.amountType || 'fixed',
            autoPay: !!cost.autoPay,
            sortKey: (cost.dueDay || 1) * 1000 + 1
        });
    });

    const sortedDebts   = getStrategyOrder(_debts.filter(d => d.balance > 0), appState.strategy);
    const _overrides    = isArchiveView ? {} : appState.minPayOverrides;
    const totalMinPay   = sortedDebts.reduce((s,d) => s + (_overrides[d.id] ?? d.minPayment), 0);
    const totalInc      = _income.reduce((s,e) => s + e.amount, 0);
    const totalRec      = [
        ..._costs.filter(c => isCostDueInMonth(c, _monthKey)),
        ..._appState.oneTimeCosts,
    ].reduce((s,c) => s + c.amount, 0);
    const extra         = Math.max(0, totalInc - totalRec - totalMinPay);
    const targetId      = sortedDebts[0]?.id;

    sortedDebts.forEach(debt => {
        const day      = debt.dueDay || 1;
        const isTarget = debt.id === targetId;
        const effMin   = _overrides[debt.id] ?? debt.minPayment;
        const amount   = isTarget ? Math.min(debt.balance, effMin + extra) : Math.min(debt.balance, effMin);
        const hasOverride = debt.id in _overrides;
        events.push({ type:'debt', id: debt.id, name: debt.name, day, amount, minPayment: debt.minPayment, effMin, hasOverride, balance: debt.balance, isSnowballTarget: isTarget, autoPay: !!debt.autoPay, sortKey: day * 1000 + 2 });
    });

    events.sort((a,b) => a.sortKey - b.sortKey);

    // Date-aware scheduling with card-passthrough logic
    // Initial cash = first checkpoint on day 1, or 0 if no day 1 checkpoint
    const day1Checkpoint = _checkpoints.find(cp => cp.day === 1);
    let cashPool       = day1Checkpoint ? day1Checkpoint.amount : 0;
    let incomeReleased = 0;
    const incomeSorted = events.filter(e => e.type === 'income').sort((a,b) => a.day - b.day);
    const schedule     = [];
    const deferred     = [];
    let totalExpenses  = 0;

    const releaseIncomeThroughDay = (day) => {
        while (incomeReleased < incomeSorted.length && incomeSorted[incomeReleased].day <= day) {
            const ev = incomeSorted[incomeReleased++];
            cashPool += ev.amount;
            schedule.push({ ...ev, balance: cashPool });
        }
    };

    for (const ev of events) {
        if (ev.type === 'income') continue;
        releaseIncomeThroughDay(ev.day);

        // Retry deferred items before this one
        const retry = [...deferred];
        deferred.length = 0;
        for (const def of retry) {
            if (cashPool >= def.amount) {
                cashPool -= def.amount; totalExpenses += def.amount;
                schedule.push({ ...def, balance: cashPool, deferred: true });
            } else deferred.push(def);
        }

        // If it's a checkpoint, hard-reset the pool here
        if (ev.type === 'checkpoint') {
            cashPool = ev.amount;
            schedule.push({ ...ev, balance: cashPool });
            continue;
        }

        // Card-method recurring costs bypass the cash pool entirely
        if (ev.type === 'recurring' && ev.paymentMethod === 'card') {
            schedule.push({ ...ev, balance: cashPool, isCard: true });
            continue;
        }

        if (cashPool >= ev.amount) {
            cashPool -= ev.amount; totalExpenses += ev.amount;
            schedule.push({ ...ev, balance: cashPool });
        } else if (cashPool > 0.009 && ev.type === 'debt') {
            const partial    = parseFloat(cashPool.toFixed(2));
            const remainder  = parseFloat((ev.amount - partial).toFixed(2));
            cashPool         = 0;
            totalExpenses   += partial;
            schedule.push({ ...ev, amount: partial, balance: 0, partial: true });
            if (remainder > 0.01) deferred.push({ ...ev, amount: remainder });
        } else {
            deferred.push(ev);
        }
    }

    // Flush remaining income and deferred
    releaseIncomeThroughDay(31);
    for (const def of deferred) {
        if (cashPool >= def.amount) {
            cashPool -= def.amount; totalExpenses += def.amount;
            schedule.push({ ...def, balance: cashPool, deferred: true });
        } else {
            schedule.push({ ...def, balance: cashPool, deferred: true, unpaid: true });
        }
    }

    if (schedule.length === 0) { section.style.display = 'none'; return; }

    // --- MATH ONLY: Cash runway estimate (current month only) ---
    const sortedFutureIncomes = _income
        .map(e => ({ date: new Date(e.date+'T00:00:00'), amount: e.amount, label: e.label }))
        .filter(e => e.date >= today)
        .sort((a,b) => a.date - b.date);
    const nextIncome = sortedFutureIncomes[0] || null;
    const targetDay  = nextIncome ? nextIncome.date.getDate() : 31;

    let testBalance  = _startBal;
    let minProjected = testBalance;

    schedule.forEach(item => {
        const itemDay = item.day || 1;
        if (itemDay < currentDay) return;
        if (nextIncome && itemDay >= targetDay && item.type !== 'income') return;

        if (item.type === 'checkpoint')                       testBalance = item.amount;
        else if (item.type === 'income')                      testBalance += item.amount;
        else if (item.type === 'recurring' && item.isCard) { /* card — no cash impact */ }
        else if (item.type !== 'starting-balance')            testBalance -= item.amount;

        if (testBalance < minProjected) {
            minProjected = testBalance;
        }
    });

    // Update the visual dashboard boxes
    const summaryNext   = appState._root.getElementById('runway-next-paycheck');
    const summaryMin    = appState._root.getElementById('runway-min-project');
    const summaryStatus = appState._root.getElementById('runway-status');

    if (summaryNext)   summaryNext.textContent   = nextIncome ? `${nextIncome.label} (${nextIncome.date.toLocaleDateString(undefined,{month:'short',day:'numeric'})})` : 'None';
    if (summaryMin)    summaryMin.textContent    = formatMoney(minProjected);

    if (summaryStatus) {
        if (minProjected < 0) {
            summaryStatus.innerHTML = '<span style="color:var(--danger-color);">⚠ At Risk (Negative Balance)</span>';
        } else if (minProjected < 100) {
            summaryStatus.innerHTML = '<span style="color:var(--warning-color);">⚠ Low Buffer</span>';
        } else {
            summaryStatus.innerHTML = '<span style="color:var(--success-color);">✓ Safe</span>';
        }
    }

    // --- Month Overview Dashboard ---
    // Calculate month totals
    const totalIncomeVal = _income.reduce((s, e) => s + e.amount, 0);
    // Expenses = direct costs + debt payments (exclude card charges as they don't affect cash)
    const totalDirectCosts = _costs
        .filter(c => isCostDueInMonth(c, _monthKey) && c.paymentMethod !== 'card')
        .reduce((s, c) => s + c.amount, 0);
    const totalDebtPayments = sortedDebts
        .reduce((s, d) => s + (_overrides[d.id] ?? d.minPayment), 0);
    const totalExpensesVal = totalDirectCosts + totalDebtPayments;

    // Next month start = Day 1 balance + all income - all cash expenses
    // If there are appState.checkpoints, use the last checkpoint's balance as the base
    const lastCheckpoint = _checkpoints.length > 0
        ? [..._checkpoints].sort((a, b) => b.day - a.day)[0]
        : null;

    // Calculate final balance through the schedule
    const finalBalance = schedule.length > 0
        ? schedule[schedule.length - 1].balance
        : _startBal;

    // Buffer = cash available before first income of NEXT month
    // Find first income date of next month
    const nextMonthKey = addMonthsToKey(_monthKey, 1);
    const nextMonthFirstDay = new Date(nextMonthKey.split('-')[0], parseInt(nextMonthKey.split('-')[1]), 1);

    // Get income entries that would appear in next month
    const nextMonthIncome = generateRecurringIncomeForMonth(_income, nextMonthKey);
    const firstNextMonthIncome = nextMonthIncome.length > 0
        ? [...nextMonthIncome].sort((a, b) => parseInt(a.date.split('-')[2]) - parseInt(b.date.split('-')[2]))[0]
        : null;

    // Buffer = final balance of this month (this is what carries over)
    const bufferAmount = finalBalance;

    // Populate Month Overview
    const ovStart = appState._root.getElementById('month-overview-start');
    const ovIncome = appState._root.getElementById('month-overview-income');
    const ovExpenses = appState._root.getElementById('month-overview-expenses');
    const ovNextStart = appState._root.getElementById('month-overview-next-start');
    const ovBuffer = appState._root.getElementById('month-overview-buffer');

    // Get day 1 checkpoint amount (or 0 if none)
    const day1Cp = _checkpoints.find(cp => cp.day === 1);
    const day1Amount = day1Cp ? day1Cp.amount : 0;
    if (ovStart) ovStart.textContent = formatMoney(day1Amount);
    if (ovIncome) ovIncome.textContent = formatMoney(totalIncomeVal);
    if (ovExpenses) ovExpenses.textContent = formatMoney(totalExpensesVal);
    if (ovNextStart) ovNextStart.textContent = formatMoney(finalBalance);

    if (ovBuffer) {
        // Color-code the buffer
        let bufferColor = 'var(--success-color)';
        let bufferIcon = '🛡️';
        if (bufferAmount < 0) {
            bufferColor = 'var(--danger-color)';
            bufferIcon = '⚠️';
        } else if (bufferAmount < 100) {
            bufferColor = 'var(--warning-color)';
            bufferIcon = '⚡';
        }
        ovBuffer.innerHTML = `<span style="color:${bufferColor};">${bufferIcon} ${formatMoney(bufferAmount)}</span>`;
    }

    // --- Spending Budgets Summary ---
    const ovBudgetsContainer = appState._root.getElementById('month-overview-budgets');
    const ovBudgetsGrid = appState._root.getElementById('month-overview-budgets-grid');

    if (ovBudgetsContainer && ovBudgetsGrid && appState.spendingBudgets.length > 0) {
        ovBudgetsContainer.style.display = 'block';

        // Calculate budget status for each
        const budgetSummaries = appState.spendingBudgets.map(budget => {
            const budgeted = getBudgetAmount(budget);
            const spent = (budget.expenses || []).reduce((s, e) => s + e.amount, 0);
            const remaining = budgeted - spent;
            const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            return { name: budget.name, budgeted, spent, remaining, percentUsed };
        });

        // Render grid
        ovBudgetsGrid.innerHTML = budgetSummaries.map(b => {
            const colorClass = b.percentUsed > 100 ? 'color: var(--danger-color);' :
                              b.percentUsed > 80 ? 'color: var(--warning-color);' :
                              'color: var(--success-color);';
            const statusIcon = b.percentUsed > 100 ? '🔴' : b.percentUsed > 80 ? '⚡' : '✓';

            return `
                <div style="background: rgba(7,6,26,0.4); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(99,102,241,0.2);">
                    <div style="font-size: 0.65rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.name}</div>
                    <div style="font-size: 0.9rem; font-weight: 600; ${colorClass}">${statusIcon} ${formatMoney(b.remaining)}</div>
                    <div style="font-size: 0.6rem; color: var(--text-secondary);">of ${formatMoney(b.budgeted)}</div>
                </div>
            `;
        }).join('');

        // Add total row
        const totalBudgeted = budgetSummaries.reduce((s, b) => s + b.budgeted, 0);
        const totalSpent = budgetSummaries.reduce((s, b) => s + b.spent, 0);
        const totalRemaining = totalBudgeted - totalSpent;

        ovBudgetsGrid.innerHTML += `
            <div style="background: rgba(168,85,247,0.1); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(168,85,247,0.3);">
                <div style="font-size: 0.65rem; color: var(--text-secondary);">TOTAL BUDGETS</div>
                <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${formatMoney(totalRemaining)}</div>
                <div style="font-size: 0.6rem; color: var(--text-secondary);">remaining</div>
            </div>
        `;
    } else if (ovBudgetsContainer) {
        ovBudgetsContainer.style.display = 'none';
    }

    section.style.display = 'block';

    // --- UI CREATION: Build the visual rows ---
    let todayMarkerInserted = isArchiveView; // skip in archive view
    schedule.forEach((item, index) => {
        // Insert "Today" marker before the first item on or after today
        if (!todayMarkerInserted && (item.day || 1) >= currentDay) {
            todayMarkerInserted = true;
            const marker = document.createElement('div');
            marker.className = 'schedule-today-marker';
            marker.innerHTML = `<span class="schedule-today-label">Today — ${today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>`;
            list.appendChild(marker);
        }

        const itemPaid = _paidStatus[item.id];
        const row      = document.createElement('div');

        let icon, typeBadge = '', amountClass, dayLabel, rowBgClass;

        if (item.type === 'checkpoint') {
            const isDay1 = item.day === 1;
            icon        = isDay1 ? '🏁' : '⚖️';
            typeBadge   = isDay1
                ? '<span class="schedule-badge schedule-badge-start" style="background:rgba(99,102,241,0.15);color:var(--accent-color);border-color:rgba(99,102,241,0.3);">Day 1 Balance</span>'
                : '<span class="schedule-badge schedule-badge-start" style="background:rgba(168,85,247,0.15);color:var(--promo-light);border-color:rgba(168,85,247,0.3);">Manual Sync</span>';
            amountClass = '';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = isDay1 ? 'schedule-starting' : 'schedule-checkpoint';

        } else if (item.type === 'income') {
            icon        = '💵';
            typeBadge   = '<span class="schedule-badge schedule-badge-income">Deposit</span>';
            amountClass = 'schedule-amount-income';
            dayLabel    = item.date.toLocaleDateString(undefined, { month:'short', day:'numeric' });
            rowBgClass  = 'schedule-income';

        } else if (item.type === 'recurring') {
            const isCard = item.paymentMethod === 'card' || item.isCard;
            icon = isCard ? '💳' : '🏦';

            const methodBadge = isCard
                ? '<span class="schedule-badge card-badge" style="border: 1px solid rgba(99, 102, 241, 0.45);">💳 Card</span>'
                : '<span class="schedule-badge direct-badge" style="border: 1px solid rgba(20, 184, 166, 0.45);">🏦 Direct</span>';

            const amtBadge = item.amountType === 'flexible'
                ? '<span class="schedule-badge flexible-badge">〜 Flexible</span>'
                : '<span class="schedule-badge fixed-badge">= Fixed</span>';

            typeBadge = methodBadge + amtBadge;

            if (item.autoPay && !itemPaid) {
                typeBadge += '<span class="schedule-badge schedule-badge-autopay">⚡ Auto</span>';
            }

            amountClass = 'schedule-amount-expense';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = isCard ? 'schedule-recurring-card' : 'schedule-recurring-direct';

        } else {
            icon        = '🧾';
            const directBadge = '<span class="schedule-badge direct-badge" style="border: 1px solid rgba(20, 184, 166, 0.45);">🏦 Direct</span>';
            const targetBadge = item.isSnowballTarget
                ? `<span class="snowball-badge">${appState.strategy==='snowball'?'❄️':'🌊'} ${appState.strategy==='snowball'?'Snowball':'Avalanche'} Target</span>`
                : '';

            typeBadge = directBadge + targetBadge;

            if (item.autoPay && !itemPaid) {
                typeBadge += '<span class="schedule-badge schedule-badge-autopay">⚡ Auto</span>';
            }

            amountClass = 'schedule-amount-expense';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = 'schedule-debt';
        }

        row.className  = `schedule-row ${rowBgClass}${itemPaid ? ' schedule-row-paid' : ''}`;
        row.style.animation = `fadeIn 0.4s ease backwards ${index * 0.04}s`;

        let statusBadges = '';
        if (item.deferred) statusBadges += '<span class="schedule-badge schedule-badge-deferred">⏳ Deferred</span>';
        if (item.partial)  statusBadges += '<span class="schedule-badge schedule-badge-partial">⚠ Partial</span>';
        if (item.unpaid)   statusBadges += '<span class="schedule-badge schedule-badge-unpaid">❌ Unpaid</span>';

        let paidBadge = '';
        if (item.type !== 'income' && item.type !== 'checkpoint') {
            if (itemPaid) paidBadge = '<span class="schedule-badge schedule-badge-paid">✓ Paid</span>';
        }

        const sign     = item.type === 'income' ? '+' : (item.type === 'checkpoint') ? '' : '−';
        const balClass = item.balance <= 0 ? 'balance-zero' : item.balance < 500 ? 'balance-low' : 'balance-healthy';

        const amountLabel = item.type === 'income'           ? 'Deposit'
            : item.type === 'checkpoint'                       ? 'Synced to'
            : 'Payment';

        // Archive view is read-only — no edit or mark-paid buttons
        const editBtnHtml = (!isArchiveView)
            ? `<button class="btn-edit-inline" data-id="${item.id}" data-type="${item.type}" title="Edit entry">Edit</button>`
            : '';

        let paidBtnHtml = '';
        if (!isArchiveView && item.type !== 'income' && item.type !== 'checkpoint') {
            const isPastDue = (item.day || 1) <= currentDay;

            if (itemPaid) {
                paidBtnHtml = `<button class="btn-mark-paid btn-mark-paid-done" data-id="${item.id}" data-autopay="${item.autoPay ? '1' : '0'}" title="Mark as unpaid">✓ Paid</button>`;
            } else if (item.autoPay) {
                if (isPastDue) {
                    paidBtnHtml = `<button class="btn-mark-paid" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-color: rgba(245, 158, 11, 0.35);" data-id="${item.id}" data-autopay="1" title="Confirm auto-payment">⚡ Auto-Paid</button>`;
                } else {
                    paidBtnHtml = `<button disabled style="opacity: 0.5; cursor: not-allowed; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); border-radius: 6px; padding: 0.25rem 0.6rem; font-size: 0.75rem; font-weight: 600;">⚡ Scheduled</button>`;
                }
            } else {
                paidBtnHtml = `<button class="btn-mark-paid" data-id="${item.id}" data-autopay="0" title="Mark as paid">Mark Paid</button>`;
            }
        }

        // Override badge + button (debt rows in current month only)
        const overrideBadge = (!isArchiveView && item.type === 'debt' && item.hasOverride)
            ? `<span class="schedule-badge schedule-badge-override" title="Min payment overridden this month">✏ Override</span>`
            : '';

        const overrideBtnHtml = (!isArchiveView && item.type === 'debt')
            ? `<button class="btn-override-min" data-id="${item.id}" data-min="${item.minPayment}" data-current="${item.effMin}" title="${item.hasOverride ? 'Edit or clear override' : 'Override minimum payment'}">${item.hasOverride ? 'Override ✏' : 'Override'}</button>`
            : '';

        // Inline override form (rendered into row, shown/hidden via JS)
        const overrideFormHtml = (!isArchiveView && item.type === 'debt') ? `
            <div class="override-form" id="override-form-${item.id}" style="display:none;">
                <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-top:0.5rem; padding:0.5rem 0.75rem; background:rgba(91,127,255,0.07); border:1px solid rgba(91,127,255,0.25); border-radius:6px;">
                    <span style="font-size:0.78rem; color:var(--text-secondary); white-space:nowrap;">Min payment <span style="color:var(--text-primary);">($${item.minPayment.toFixed(2)})</span> →</span>
                    <input class="override-input" type="number" min="0" step="0.01" placeholder="${item.effMin.toFixed(2)}" value="${item.hasOverride ? item.effMin.toFixed(2) : ''}" style="width:90px; padding:0.2rem 0.4rem; border-radius:4px; border:1px solid rgba(91,127,255,0.4); background:rgba(7,6,26,0.6); color:var(--text-primary); font-size:0.85rem;">
                    <button class="btn-override-save" data-id="${item.id}" style="padding:0.2rem 0.6rem; font-size:0.78rem; font-weight:600; border-radius:4px; border:1px solid rgba(91,127,255,0.5); background:rgba(91,127,255,0.15); color:#c4d0ff; cursor:pointer;">Save</button>
                    ${item.hasOverride ? `<button class="btn-override-clear" data-id="${item.id}" style="padding:0.2rem 0.6rem; font-size:0.78rem; font-weight:600; border-radius:4px; border:1px solid rgba(239,68,68,0.4); background:rgba(239,68,68,0.1); color:#fca5a5; cursor:pointer;">Clear</button>` : ''}
                    <button class="btn-override-cancel" data-id="${item.id}" style="padding:0.2rem 0.5rem; font-size:0.78rem; background:transparent; border:none; color:var(--text-secondary); cursor:pointer;">✕</button>
                </div>
            </div>` : '';

        const detailText = item.type === 'debt' && item.isSnowballTarget ? 'Minimum + Snowball Extra'
            : item.type === 'debt' ? 'Minimum Payment'
            : item.type === 'recurring' && (item.isCard || item.paymentMethod === 'card') ? 'Charged to credit card'
            : item.type === 'recurring' ? 'Paid from bank account'
            : item.type === 'checkpoint' ? 'Resets the running balance for calculations below'
            : '';

        row.innerHTML = `
            <div class="schedule-date-col"><span class="schedule-icon">${icon}</span><span class="schedule-day">${dayLabel}</span></div>
            <div class="schedule-info-col">
                <div class="schedule-name" style="margin-bottom:0.25rem;">${escHtml(item.name)}</div>
                <div class="schedule-badges" style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.25rem;">
                    ${typeBadge} ${statusBadges} ${paidBadge} ${overrideBadge}
                </div>
                <div class="schedule-detail">${detailText}</div>
                ${overrideFormHtml}
            </div>
            <div class="schedule-right-col">
                <div class="schedule-amount-col ${amountClass}"><span class="col-label">${amountLabel}</span>${sign}$${item.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                <div class="schedule-balance-col ${balClass}"><span class="col-label">Balance</span>$${item.balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>

            <div class="schedule-action-col" style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-end; justify-content:center;">
                ${paidBtnHtml}
                ${overrideBtnHtml}
                ${editBtnHtml}
            </div>`;

        list.appendChild(row);
    });

    // If every item was before today (end-of-month edge case), append marker at the bottom
    if (!todayMarkerInserted) {
        const marker = document.createElement('div');
        marker.className = 'schedule-today-marker';
        marker.innerHTML = `<span class="schedule-today-label">Today — ${today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>`;
        list.appendChild(marker);
    }

    const totalIncEl  = appState._root.getElementById('payment-plan-total-income');
    const totalExpEl  = appState._root.getElementById('payment-plan-total-expenses');
    const nextMonthEl = appState._root.getElementById('payment-plan-next-month');

    if (totalIncEl) totalIncEl.textContent = formatMoney(totalInc);
    if (totalExpEl) totalExpEl.textContent = formatMoney(totalExpenses);
    if (nextMonthEl) {
        nextMonthEl.textContent = formatMoney(cashPool);
        nextMonthEl.style.color = cashPool < 0 ? 'var(--danger-color)' : 'var(--text-primary)';
    }
    return isArchiveView ? null : schedule;
}

export { renderPaymentPlan, renderVisualization, runSimulation };
