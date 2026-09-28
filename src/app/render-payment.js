import { appState } from './state.js';
import { addMonthsToKey, currentMonthKey, formatMonthLabel, isCostDueInMonth, isCostDueThisMonth, keyToHtmlMonth } from '../core/date-utils.js';
import { escHtml, formatMoney, formatOrdinal } from '../core/pure-utils.js';
import { getStrategyOrder, simulatePayoff } from '../core/simulation.js';
import { cashExpensesForMonth } from '../core/card-expenses.js';
import { summarizeCashFlowEvents } from '../core/cash-flow.js';
import { getBudgetAmount } from './render-budgets.js';
import { renderPaydownChart, renderTimelineChart } from './render-charts.js';
import { startCountdown, stopCountdown } from './render-support.js';

// ─── Core Simulation ─────────────────────────────────────────────────────────
// Thin wrapper over core/simulation.js — feeds live app state and scopes the
// sim to the WORKING month (which may be ahead of the real calendar after an
// early advance). Income is filtered to that month inside simulatePayoff.
function runSimulation(strat) {
    return simulatePayoff({
        debts:          appState.debts,
        incomeEntries:  appState.incomeEntries,
        recurringCosts: appState.recurringCosts,
        monthKey:       appState.workingMonthKey || currentMonthKey(),
    }, strat);
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
                    <button class="btn btn-primary" data-click-target="plan-next-month-btn">📅 Return to Current Month</button>
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
                    <button class="btn btn-primary" data-goto-tab="debts">💳 Add Your First Debt</button>
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
        // Keep windfall bar visible when there are debts — it can help explore "what if I add a lump sum?"
        if (appState.debts.length > 0) windfallBar.style.display = 'flex';
        stopCountdown();

        const _active = appState.recurringCosts.filter(c => isCostDueThisMonth(c, appState.workingMonthKey || currentMonthKey()));
        const totalRecurringDirect = _active.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
        const totalRecurringCard   = _active.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
        const shortage = totalMinPayments - (effectiveBudget || 0);

        let icon = '⚠️';
        let title = '';
        let message = '';
        let breakdown = '';
        let primaryAction = '';
        let secondaryAction = '';
        let tertiaryAction = '';

        if ((totalIncome || 0) <= 0) {
            icon = '💰';
            title = 'No Income Added';
            message = 'You need to add income entries before we can calculate your payoff timeline. Tell us about your paychecks, deposits, or any other monthly income.';
            breakdown = `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 0.85rem;">
                    <div style="color: var(--text-secondary); margin-bottom: 0.5rem;">To get started, add:</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>• Regular paychecks</span>
                        <span style="color: var(--success-color);">Monthly or biweekly</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>• Side income / freelance</span>
                        <span style="color: var(--success-color);">One-time or recurring</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>• Other deposits</span>
                        <span style="color: var(--success-color);">Any cash inflow</span>
                    </div>
                </div>`;
            primaryAction = `<button class="btn btn-success" data-goto-tab="income" data-then-click="add-income-btn">➕ Add Income</button>`;
        } else if ((effectiveBudget || 0) <= 0) {
            icon = '📉';
            title = 'Budget Over-Committed';
            message = `Your income of ${formatMoney(totalIncome)} is entirely consumed by direct recurring costs of ${formatMoney(totalRecurringDirect)}. No money is left for debt payoff.`;
            breakdown = `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 0.85rem;">
                    <div style="color: var(--text-secondary); margin-bottom: 0.5rem;">Monthly breakdown:</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>💰 Income</span>
                        <span style="color: var(--success-color);">${formatMoney(totalIncome)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>🏦 Direct costs (bills, rent, etc.)</span>
                        <span style="color: var(--danger-color);">−${formatMoney(totalRecurringDirect)}</span>
                    </div>
                    ${totalRecurringCard > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>💳 Card charges (in minimums)</span>
                        <span style="color: var(--warning-color);">−${formatMoney(totalRecurringCard)}</span>
                    </div>` : ''}
                    <div style="display: flex; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); font-weight: 600;">
                        <span>Available for debt payoff</span>
                        <span style="color: var(--danger-color);">$0.00</span>
                    </div>
                </div>
                <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">
                    <strong>Options:</strong>
                    <ul style="margin: 0.5rem 0 0 1.25rem; padding: 0;">
                        <li>Add ${formatMoney(totalRecurringDirect - totalIncome + 100)}+ in income to free up cash</li>
                        <li>Reduce recurring costs by ${formatMoney(totalRecurringDirect - totalIncome + 100)}+</li>
                        <li>Use a windfall to jump-start payoff</li>
                    </ul>
                </div>`;
            primaryAction = `<button class="btn btn-success" data-goto-tab="income">💰 Add Income</button>`;
            secondaryAction = `<button class="btn btn-warning" data-goto-tab="income">📝 Review Costs</button>`;
            tertiaryAction = `<button class="btn btn-secondary" data-goto-tab="timeline" data-then-click="windfall-btn">💰 Try Windfall Planner</button>`;
        } else {
            icon = '💳';
            title = 'Can\'t Cover Minimum Payments';
            message = `Your effective budget of ${formatMoney(effectiveBudget)} is less than your total minimum payments of ${formatMoney(totalMinPayments)}. You're short by ${formatMoney(shortage)} each month.`;
            breakdown = `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 0.85rem;">
                    <div style="color: var(--text-secondary); margin-bottom: 0.5rem;">Monthly breakdown:</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>💰 Income</span>
                        <span style="color: var(--success-color);">${formatMoney(totalIncome)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>🏦 Direct costs</span>
                        <span style="color: var(--danger-color);">−${formatMoney(totalRecurringDirect)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>💳 Available for debt payoff</span>
                        <span style="color: var(--text-primary);">${formatMoney(effectiveBudget)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>💳 Required minimum payments</span>
                        <span style="color: var(--danger-color);">${formatMoney(totalMinPayments)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); font-weight: 600;">
                        <span>Shortfall</span>
                        <span style="color: var(--danger-color);">−${formatMoney(shortage)}</span>
                    </div>
                </div>
                <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">
                    <strong>Options:</strong>
                    <ul style="margin: 0.5rem 0 0 1.25rem; padding: 0;">
                        <li>Add ${formatMoney(shortage + 50)}+ in monthly income</li>
                        <li>Reduce recurring costs by ${formatMoney(shortage + 50)}+</li>
                        <li>Consider debt consolidation to lower rates</li>
                        <li>Use a windfall to pay down balances</li>
                    </ul>
                </div>`;
            primaryAction = `<button class="btn btn-success" data-goto-tab="income">💰 Add Income</button>`;
            secondaryAction = `<button class="btn btn-secondary" data-goto-tab="debts">📉 Review Debts</button>`;
            tertiaryAction = `<button class="btn btn-secondary" data-goto-tab="timeline" data-then-click="windfall-btn">💰 Try Windfall Planner</button>`;
        }

        timelineChart.innerHTML = `
            <div class="timeline-error-card">
                <span class="timeline-error-icon">${icon}</span>
                <div class="timeline-error-title">${title}</div>
                <div class="timeline-error-message">${message}</div>
                ${breakdown}
                <div class="timeline-error-actions">
                    ${primaryAction}
                    ${secondaryAction}
                    ${tertiaryAction}
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
                    <button class="btn btn-success" data-goto-tab="income">💰 Increase Budget</button>
                    <button class="btn btn-primary" data-goto-tab="debts">📉 Review Debts</button>
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
// ─── Monthly Cash Flow Plan ───────────────────────────────────────────────────
function renderPaymentPlan() {
    const section = appState._root.getElementById('payment-plan-section');
    const list    = appState._root.getElementById('payment-plan-list');

    // ── Archive-view wiring ────────────────────────────────────────────────────
    const isArchiveView = appState.viewingArchiveIndex !== null && !!appState.monthlyArchives[appState.viewingArchiveIndex];
    const archiveData   = isArchiveView ? appState.monthlyArchives[appState.viewingArchiveIndex] : null;
    const _monthKey     = archiveData ? archiveData.month : (appState.workingMonthKey || currentMonthKey());
    const _incomeHtml   = keyToHtmlMonth(_monthKey);
    // Income rows are materialized for their month — a stray row dated in a
    // different month (stale one-time income, missed heal) must not render or
    // count here.
    const _income       = (archiveData ? (archiveData.incomeEntries  || []) : appState.incomeEntries)
        .filter(e => (e.date || '').slice(0, 7) === _incomeHtml);
    const _costs        = archiveData ? (archiveData.recurringCosts || []) : appState.recurringCosts;
    const _oneTimeCosts = archiveData ? (archiveData.oneTimeCosts   || []) : appState.oneTimeCosts;
    const _checkpoints  = archiveData ? (archiveData.checkpoints    || []) : appState.checkpoints;
    const _debts        = archiveData ? (archiveData.debts           || appState.debts) : appState.debts;
    const _startBal     = archiveData ? (archiveData.startingBalance || 0)  : appState.startingBalance;
    const _paidStatus   = archiveData ? (archiveData.paidStatus      || {}) : appState.paidStatus;

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
    // "Today" only means something when the viewed month IS the real current
    // month — an early-advanced future month (or an archive) has no today in
    // it. currentDay = 0 means nothing is past-due and nothing is skipped.
    const isLiveMonth = !isArchiveView && _monthKey === currentMonthKey();
    const currentDay  = isLiveMonth ? today.getDate() : 0;

    _income.forEach(entry => {
        const day = parseInt(entry.date.split('-')[2]) || 1;
        events.push({ type:'income', id: entry.id, name: entry.label, day, date: new Date(entry.date+'T00:00:00'), amount: entry.amount, sortKey: day * 1000 });
    });

    _checkpoints.forEach(cp => {
        // Sortkey +0.5 ensures appState.checkpoints happen AFTER standard income on that day, but BEFORE bills are paid.
        events.push({ type: 'checkpoint', id: cp.id, name: 'Bank Balance Sync', day: cp.day, amount: cp.amount, sortKey: cp.day * 1000 + 0.5 });
    });

    // Card-charged costs are excluded entirely — they're autopaid by the card
    // and never touch the cash pool this plan tracks. They're mirrored into
    // the spending budgets instead (see core/card-expenses.js).
    _costs.filter(c => isCostDueInMonth(c, _monthKey) && c.paymentMethod !== 'card').forEach(cost => {
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
    _oneTimeCosts.filter(c => c.paymentMethod !== 'card').forEach(cost => {
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

    // Manual budget expenses (Zelle/cash/debit purchases) are real cash
    // outflows — they draw down the pool on their logged date. Auto-logged
    // card expenses are excluded (they're card charges, not cash).
    // Archives store the month's budgets as they stood at rollover.
    const _budgetExpenses = cashExpensesForMonth(
        archiveData ? (archiveData.spendingBudgets || []) : appState.spendingBudgets, _monthKey);
    _budgetExpenses.forEach(exp => {
        const day = exp.date ? (parseInt(exp.date.split('-')[2]) || 1) : 1;
        events.push({
            type: 'expense',
            id: exp.id,
            name: exp.description,
            day,
            amount: exp.amount,
            budgetName: exp.budgetName,
            budgetId: exp.budgetId,
            settled: true,
            sortKey: day * 1000 + 1.5
        });
    });

    const _overrides    = isArchiveView ? {} : appState.minPayOverrides;
    const sortedDebts   = getStrategyOrder(_debts.filter(d => d.balance > 0 || _overrides[d.id]), appState.strategy);
    const totalMinPay   = sortedDebts.reduce((s,d) => s + (_overrides[d.id] ?? d.minPayment), 0);
    const totalInc      = _income.reduce((s,e) => s + e.amount, 0);
    const totalRec      = [
        ..._costs.filter(c => isCostDueInMonth(c, _monthKey) && c.paymentMethod !== 'card'),
        ..._oneTimeCosts.filter(c => c.paymentMethod !== 'card'),
    ].reduce((s,c) => s + c.amount, 0);
    // Money already spent via budgets isn't available for the snowball extra
    const totalSpentManual = _budgetExpenses.reduce((s, e) => s + e.amount, 0);
    const extra         = Math.max(0, totalInc - totalRec - totalMinPay - totalSpentManual);
    const targetId      = sortedDebts[0]?.id;

    sortedDebts.forEach(debt => {
        const day      = debt.dueDay || 1;
        const isTarget = debt.id === targetId;
        const effMin   = _overrides[debt.id] ?? debt.minPayment;
        // If balance is 0 but there's an override, use the override amount (payoff scenario)
        const amount   = (debt.balance === 0 && _overrides[debt.id])
            ? effMin
            : isTarget ? Math.min(debt.balance, effMin + extra) : Math.min(debt.balance, effMin);
        const hasOverride = debt.id in _overrides;
        events.push({ type:'debt', id: debt.id, name: debt.name, day, amount, minPayment: debt.minPayment, effMin, hasOverride, balance: debt.balance, isSnowballTarget: isTarget, autoPay: !!debt.autoPay, sortKey: day * 1000 + 2 });
    });

    events.sort((a,b) => a.sortKey - b.sortKey);
    const monthTotals = summarizeCashFlowEvents(events);

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

        // Logged budget expenses already happened — always deduct, even if it
        // drives the balance negative (the runway status surfaces that risk)
        if (ev.type === 'expense') {
            cashPool       -= ev.amount;
            totalExpenses  += ev.amount;
            schedule.push({ ...ev, balance: cashPool });
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
    // Totals come from the complete planned cash-flow event stream. This keeps
    // fixed and one-time bills, manual cash expenses, snowball payments,
    // overrides, and pay-in-full events in one source of truth.
    const finalBalance = schedule.length > 0
        ? schedule[schedule.length - 1].balance
        : _startBal;
    const nextMonthKey = addMonthsToKey(_monthKey, 1);

    // Populate Month Overview
    const ovStart = appState._root.getElementById('month-overview-start');
    const ovIncome = appState._root.getElementById('month-overview-income');
    const ovExpenses = appState._root.getElementById('month-overview-expenses');
    const ovEnd = appState._root.getElementById('month-overview-end');
    const ovNextStart = appState._root.getElementById('month-overview-next-start');
    const ovNextLabel = appState._root.getElementById('month-overview-next-label');

    // A Day 1 bank sync is the strongest starting-balance signal. Fall back to
    // the carried starting balance when no checkpoint exists.
    const day1Cp = _checkpoints.find(cp => cp.day === 1);
    const monthStartBalance = day1Cp ? day1Cp.amount : _startBal;
    if (ovStart) ovStart.textContent = formatMoney(monthStartBalance);
    if (ovIncome) ovIncome.textContent = formatMoney(monthTotals.income);
    if (ovExpenses) ovExpenses.textContent = formatMoney(monthTotals.expenditures);
    if (ovEnd) ovEnd.textContent = formatMoney(finalBalance);
    if (ovNextStart) ovNextStart.textContent = formatMoney(finalBalance);
    if (ovNextLabel) ovNextLabel.textContent = `${formatMonthLabel(nextMonthKey)} starting balance`;

    // --- Spending Budgets Summary (collapsed drawer; only shown if budgets exist) ---
    const ovBudgetsContainer = appState._root.getElementById('month-overview-budgets');
    const ovBudgetsGrid = appState._root.getElementById('month-overview-budgets-grid');

    const ovBudgets = archiveData ? (archiveData.spendingBudgets || []) : appState.spendingBudgets;
    if (ovBudgetsContainer && ovBudgetsGrid && ovBudgets.length > 0) {
        ovBudgetsContainer.style.display = 'block';

        // Calculate budget status for each. Exclude autoDirect expenses to avoid
        // double-counting with direct costs (they're already counted in the direct
        // costs line of the Month Overview).
        const budgetSummaries = ovBudgets.map(budget => {
            const budgeted = getBudgetAmount(budget);
            const spent = (budget.expenses || [])
                .filter(e => !e.autoDirect)
                .reduce((s, e) => s + e.amount, 0);
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
        const ovBudgetsTotals = appState._root.getElementById('month-overview-budgets-totals');
        if (ovBudgetsTotals) {
            ovBudgetsTotals.textContent = `${formatMoney(totalSpent)} / ${formatMoney(totalBudgeted)}`;
            const usedPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
            ovBudgetsTotals.style.color = usedPct > 100 ? 'var(--danger-color)'
                : usedPct > 80 ? 'var(--warning-color)'
                : 'var(--text-primary)';
        }

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
    let todayMarkerInserted = !isLiveMonth; // only the real current month has a "today"
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
            icon = '🏦';

            const methodBadge = '<span class="schedule-badge direct-badge" style="border: 1px solid rgba(20, 184, 166, 0.45);">🏦 Direct</span>';

            const amtBadge = item.amountType === 'flexible'
                ? '<span class="schedule-badge flexible-badge">〜 Flexible</span>'
                : '<span class="schedule-badge fixed-badge">= Fixed</span>';

            typeBadge = methodBadge + amtBadge;

            if (item.autoPay && !itemPaid) {
                typeBadge += '<span class="schedule-badge schedule-badge-autopay">⚡ Auto</span>';
            }

            amountClass = 'schedule-amount-expense';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = 'schedule-recurring-direct';

        } else if (item.type === 'expense') {
            icon        = '🛒';
            typeBadge   = `<span class="schedule-badge direct-badge" style="border: 1px solid rgba(20, 184, 166, 0.45);">🛒 ${escHtml(item.budgetName || 'Budget')}</span>`;
            amountClass = 'schedule-amount-expense';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = 'schedule-expense schedule-row-paid';

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
        row.dataset.day = item.day || 1;

        // Logged budget expenses can be dragged onto another row to re-date them
        if (item.type === 'expense' && !isArchiveView) {
            row.draggable = true;
            row.dataset.expenseId = item.id;
            row.dataset.budgetId  = item.budgetId || '';
            row.title = 'Drag onto another row to move this expense to that day';
        }

        let statusBadges = '';
        if (item.deferred) statusBadges += '<span class="schedule-badge schedule-badge-deferred">⏳ Deferred</span>';
        if (item.partial)  statusBadges += '<span class="schedule-badge schedule-badge-partial">⚠ Partial</span>';
        if (item.unpaid)   statusBadges += '<span class="schedule-badge schedule-badge-unpaid">❌ Unpaid</span>';

        let paidBadge = '';
        if (item.type === 'expense') {
            paidBadge = '<span class="schedule-badge schedule-badge-paid">✓ Logged</span>';
        } else if (item.type !== 'income' && item.type !== 'checkpoint') {
            if (itemPaid) paidBadge = '<span class="schedule-badge schedule-badge-paid">✓ Paid</span>';
        }

        const sign     = item.type === 'income' ? '+' : (item.type === 'checkpoint') ? '' : '−';
        const balClass = item.balance <= 0 ? 'balance-zero' : item.balance < 500 ? 'balance-low' : 'balance-healthy';

        const amountLabel = item.type === 'income'           ? 'Deposit'
            : item.type === 'checkpoint'                       ? 'Synced to'
            : item.type === 'expense'                          ? 'Spent'
            : 'Payment';

        // Archive view is read-only — no edit or mark-paid buttons
        // Budget expenses are managed from the Budgets tab, not here
        const editBtnHtml = (!isArchiveView && item.type !== 'expense')
            ? `<button class="btn-edit-inline" data-id="${item.id}" data-type="${item.type}" title="Edit entry">Edit</button>`
            : '';

        let paidBtnHtml = '';
        if (!isArchiveView && item.type !== 'income' && item.type !== 'checkpoint' && item.type !== 'expense') {
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
            : item.type === 'recurring' ? 'Paid from bank account'
            : item.type === 'expense' ? (isArchiveView ? 'Logged budget spending — deducted from cash' : 'Logged budget spending — deducted from cash · drag to re-date')
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
