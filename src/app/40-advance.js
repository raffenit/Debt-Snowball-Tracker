async function advanceToNextMonth() {
    const currentKey = workingMonthKey || currentMonthKey();
    const nextKey    = addMonthsToKey(currentKey, 1);
    const nextLabel  = formatMonthLabel(nextKey);

    if (!confirm(`Archive ${formatMonthLabel(currentKey)} and start ${nextLabel} now?\n\nOne-time costs will be removed, income will be cleared, and interval costs will advance. This cannot be undone.`)) return;

    const result = calculateMonthRollover({
        debts, recurringCosts, oneTimeCosts, incomeEntries, checkpoints,
        startingBalance, paidStatus, spendingBudgets,
    }, currentKey, nextKey);

    monthlyArchives.unshift(result.archive);
    if (monthlyArchives.length > 24) monthlyArchives.pop();

    incomeEntries   = result.nextState.incomeEntries;
    checkpoints     = result.nextState.checkpoints;
    recurringCosts  = result.nextState.recurringCosts;
    oneTimeCosts    = result.nextState.oneTimeCosts;
    paidStatus      = result.nextState.paidStatus;
    minPayOverrides = result.nextState.minPayOverrides;
    spendingBudgets = result.nextState.spendingBudgets;

    // Save with paidMonth set to nextKey so the automatic rollover doesn't re-fire
    try {
        await ensureStoreDashboard();
        await _root._hass.connection.sendMessagePromise({
            type:     'lovelace/config/save',
            url_path: STORE_URL_PATH,
            config:   {
                debts, recurringCosts, oneTimeCosts, incomeEntries, checkpoints,
                strategy, startingBalance, showMortgage,
                paidStatus, paidMonth: nextKey,
                monthlyArchives, spendingBudgets,
            },
        });
        viewingArchiveIndex = null;
        workingMonthKey = nextKey;
        renderUI();
        showSavedToast(`Started ${nextLabel} ✓`);
    } catch (err) {
        console.error('Debt Snowball: advance month failed —', err);
        showErrorToast('Failed to advance month. Please try again.');
    }
}
