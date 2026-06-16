import { appState } from './state.js';
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from '../core/date-utils.js';
import { calculateMonthRollover } from '../core/rollover.js';
import { renderUI, showErrorToast, showSavedToast } from './render-modals.js';

async function advanceToNextMonth() {
    const currentKey = appState.workingMonthKey || currentMonthKey();
    const nextKey    = addMonthsToKey(currentKey, 1);
    const nextLabel  = formatMonthLabel(nextKey);

    if (!confirm(`Archive ${formatMonthLabel(currentKey)} and start ${nextLabel} now?\n\nOne-time costs will be removed, income will be cleared, and interval costs will advance. This cannot be undone.`)) return;

    const result = calculateMonthRollover({
        debts:          appState.debts,
        recurringCosts: appState.recurringCosts,
        oneTimeCosts:   appState.oneTimeCosts,
        incomeEntries:  appState.incomeEntries,
        checkpoints:    appState.checkpoints,
        startingBalance: appState.startingBalance,
        paidStatus:     appState.paidStatus,
        spendingBudgets: appState.spendingBudgets,
    }, currentKey, nextKey);

    appState.monthlyArchives.unshift(result.archive);
    if (appState.monthlyArchives.length > 24) appState.monthlyArchives.pop();

    appState.incomeEntries   = result.nextState.incomeEntries;
    appState.checkpoints     = result.nextState.checkpoints;
    appState.recurringCosts  = result.nextState.recurringCosts;
    appState.oneTimeCosts    = result.nextState.oneTimeCosts;
    appState.paidStatus      = result.nextState.paidStatus;
    appState.minPayOverrides = result.nextState.minPayOverrides;
    appState.spendingBudgets = result.nextState.spendingBudgets;

    // Save with paidMonth set to nextKey so the automatic rollover doesn't re-fire
    try {
        await ensureStoreDashboard();
        await appState._root._hass.connection.sendMessagePromise({
            type:     'lovelace/config/save',
            url_path: STORE_URL_PATH,
            config:   {
                debts:          appState.debts,
                recurringCosts: appState.recurringCosts,
                oneTimeCosts:   appState.oneTimeCosts,
                incomeEntries:  appState.incomeEntries,
                checkpoints:    appState.checkpoints,
                strategy:       appState.strategy,
                startingBalance: appState.startingBalance,
                showMortgage:   appState.showMortgage,
                paidStatus:     appState.paidStatus,
                paidMonth:      nextKey,
                monthlyArchives: appState.monthlyArchives,
                spendingBudgets: appState.spendingBudgets,
            },
        });
        appState.viewingArchiveIndex = null;
        appState.workingMonthKey = nextKey;
        renderUI();
        showSavedToast(`Started ${nextLabel} ✓`);
    } catch (err) {
        console.error('Debt Snowball: advance month failed —', err);
        showErrorToast('Failed to advance month. Please try again.');
    }
}

export { advanceToNextMonth };
