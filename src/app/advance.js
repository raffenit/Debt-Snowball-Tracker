import { appState } from './state.js';
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from '../core/date-utils.js';
import { calculateMonthRollover } from '../core/rollover.js';
import { renderUI, showSavedToast } from './render-modals.js';
import { ensureStoreDashboard, STORE_URL_PATH, buildSavePayload, createServerBackup } from './storage.js';
import { reportError } from './error-report.js';

async function advanceToNextMonth() {
    const currentKey = appState.workingMonthKey || currentMonthKey();
    const nextKey    = addMonthsToKey(currentKey, 1);
    const nextLabel  = formatMonthLabel(nextKey);

    if (!confirm(`Archive ${formatMonthLabel(currentKey)} and start ${nextLabel} now?\n\nOne-time bills will be removed, income will be cleared, and interval bills will advance. This cannot be undone.`)) return;

    // Safety net: snapshot the current month to a server backup slot before
    // the rollover mutates anything. If the backup can't be written we stop —
    // a failed rollover without a backup could silently corrupt months of data.
    try {
        await createServerBackup('month advance');
    } catch (err) {
        reportError('Automatic backup failed — month was not advanced. Try again, or check your connection.', err);
        return;
    }

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

    // Compute the full next-month payload FIRST, persist it, and only then
    // apply it to appState — a failed save leaves the UI on the old month
    // instead of showing state that was never stored.
    const nextFields = {
        incomeEntries:   result.nextState.incomeEntries,
        checkpoints:     result.nextState.checkpoints,
        recurringCosts:  result.nextState.recurringCosts,
        oneTimeCosts:    result.nextState.oneTimeCosts,
        paidStatus:      result.nextState.paidStatus,
        minPayOverrides: result.nextState.minPayOverrides,
        spendingBudgets: result.nextState.spendingBudgets,
        monthlyArchives: [result.archive, ...appState.monthlyArchives].slice(0, 24),
    };

    // Save with paidMonth set to nextKey so the automatic rollover doesn't re-fire
    try {
        await ensureStoreDashboard();
        await appState._root._hass.connection.sendMessagePromise({
            type:     'lovelace/config/save',
            url_path: STORE_URL_PATH,
            config:   { ...buildSavePayload(), ...nextFields, paidMonth: nextKey },
        });
    } catch (err) {
        reportError('Advance month failed — please try again', err);
        return;
    }

    Object.assign(appState, nextFields);
    appState.viewingArchiveIndex = null;
    appState.workingMonthKey = nextKey;
    renderUI();
    showSavedToast(`Started ${nextLabel} ✓`);
}

export { advanceToNextMonth };
