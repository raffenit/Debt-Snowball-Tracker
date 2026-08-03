import { appState } from './state.js';
import { monthKeyToIndex } from '../core/date-utils.js';
import { calculateMonthRollover } from '../core/rollover.js';
import { renderUI } from './render-modals.js';
import { initTabs } from './render-support.js';

// ─── HA Backend Data Storage ─────────────────────────────────────────────────
// Storage mechanism: a dedicated hidden Lovelace dashboard used purely as a
// JSON store. HA writes its config to .storage/lovelace.snowball-store.json
// on disk immediately on every save, and restores it automatically on restart.
//
// Why this works:
//   ✓ Zero setup — no YAML, no helpers, no config changes required
//   ✓ Truly persistent — written to disk, survives restarts
//   ✓ Shared — all users on the server read the same data
//   ✓ No size limits — the full payload is one JSON object
//   ✓ Standard HA API — same mechanism Lovelace itself uses for dashboards
//
// The dashboard is created automatically on first save (hidden from sidebar).
// Only the active-tab UI preference is kept in localStorage.

const STORE_URL_PATH = 'snowball-store';

// Ensure the hidden storage dashboard exists (idempotent — safe to call every time).
async function ensureStoreDashboard() {
    const conn = appState._root._hass.connection;

    // Check if it already exists by attempting to list dashboards
    try {
        const dashboards = await conn.sendMessagePromise({ type: 'lovelace/dashboards/list' });
        if (dashboards.some(d => d.url_path === STORE_URL_PATH)) return; // already exists
    } catch (err) {
        // If listing fails, attempt creation anyway
    }

    // Create the hidden dashboard — this only runs once ever
    try {
        await conn.sendMessagePromise({
            type:             'lovelace/dashboards/create',
            url_path:         STORE_URL_PATH,
            title:            'Snowball Store',
            icon:             'mdi:database',
            show_in_sidebar:  false,
            require_admin:    false,
        });
    } catch (err) {
        // "already exists" / duplicate key errors are fine — another user may have created it first.
        const msg = String(err?.message ?? err).toLowerCase();
        if (!msg.includes('already') && !msg.includes('duplicate') && !msg.includes('exists')) {
            throw err;
        }
    }
}

// ─── 1. Load ─────────────────────────────────────────────────────────────────
async function loadBackendData() {
    try {
        const result = await appState._root._hass.connection.sendMessagePromise({
            type:      'lovelace/config',
            url_path:  STORE_URL_PATH,
            force:     true,
        });

        if (result) {
            appState.debts           = result.debts          || [];
            appState.recurringCosts  = result.recurringCosts  || [];
            appState.incomeEntries   = result.incomeEntries   || [];
            appState.checkpoints     = result.checkpoints     || [];
            appState.strategy        = result.strategy        || 'snowball';
            appState.showMortgage    = result.showMortgage !== false;
            appState.startingBalance = result.startingBalance || 0;
            appState.monthlyArchives  = result.monthlyArchives  || [];
            appState.spendingBudgets  = result.spendingBudgets  || [];
            appState.minPayOverrides  = result.minPayOverrides  || {};

            // Backward-compat: oneTimeCosts may not exist in older saved data.
            // If missing, migrate any one-time entries from recurringCosts.
            if (result.oneTimeCosts) {
                appState.oneTimeCosts = result.oneTimeCosts;
            } else {
                appState.oneTimeCosts = appState.recurringCosts.filter(c => (c.category || 'other') === 'one-time');
                appState.recurringCosts = appState.recurringCosts.filter(c => (c.category || 'other') !== 'one-time');
            }

            const prevMonth = result.paidMonth;
            const thisMonth = currentMonthKey();

            // workingMonthKey is whichever is later: the stored month or the calendar month.
            // This means if the user advanced early, workingMonthKey stays at the advanced month.
            appState.workingMonthKey = (prevMonth && monthKeyToIndex(prevMonth) > monthKeyToIndex(thisMonth))
                ? prevMonth
                : thisMonth;

            // Only archive if the calendar has moved *past* the stored month (not when user advanced ahead).
            if (prevMonth && monthKeyToIndex(thisMonth) > monthKeyToIndex(prevMonth)) {
                const rollover = calculateMonthRollover({
                    debts:          appState.debts,
                    recurringCosts: appState.recurringCosts,
                    oneTimeCosts:   appState.oneTimeCosts,
                    incomeEntries:  appState.incomeEntries,
                    checkpoints:    appState.checkpoints,
                    startingBalance: appState.startingBalance,
                    paidStatus:     appState.paidStatus,
                    spendingBudgets: appState.spendingBudgets,
                }, prevMonth, thisMonth);

                appState.monthlyArchives.unshift(rollover.archive);
                if (appState.monthlyArchives.length > 24) appState.monthlyArchives.pop();

                appState.incomeEntries   = rollover.nextState.incomeEntries;
                appState.checkpoints     = rollover.nextState.checkpoints;
                appState.recurringCosts  = rollover.nextState.recurringCosts;
                appState.oneTimeCosts    = rollover.nextState.oneTimeCosts;
                appState.paidStatus      = rollover.nextState.paidStatus;
                appState.minPayOverrides = rollover.nextState.minPayOverrides;
                appState.spendingBudgets = rollover.nextState.spendingBudgets;

                saveData().catch(err => console.error('Debt Snowball: rollover save failed —', err));
            } else if (result.paidStatus) {
                // Covers: stored month == calendar month, OR stored month is ahead (user advanced early)
                appState.paidStatus = result.paidStatus;
            } else {
                appState.paidStatus = {};
            }
        }
    } catch (err) {
        // A "not found" / "config_not_found" error just means first run — start empty.
        // Any other error (network, auth, etc.) is worth logging.
        const msg = String(err?.message ?? err).toLowerCase();
        if (!msg.includes('not_found') && !msg.includes('not found') && !msg.includes('config_not_found')) {
            console.error('Debt Snowball: error loading data —', err);
        }
    }

    // Active tab is the one genuine per-browser preference
    const savedTab = localStorage.getItem('snowball_active_tab');
    if (savedTab) {
        const savedBtn = appState._root.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
        if (savedBtn) savedBtn.click();
    }

    initTabs();
    renderUI();
}

// ─── 2. Save ─────────────────────────────────────────────────────────────────
async function saveData() {
    if (!appState._root._hass) return;

    // Active tab stays in the browser
    const activeTabEl = appState._root.querySelector('.tab-btn.active');
    if (activeTabEl) localStorage.setItem('snowball_active_tab', activeTabEl.dataset.tab);

    await ensureStoreDashboard();

    await appState._root._hass.connection.sendMessagePromise({
        type:      'lovelace/config/save',
        url_path:  STORE_URL_PATH,
        config:    {
            debts:          appState.debts,
            recurringCosts: appState.recurringCosts,
            oneTimeCosts:   appState.oneTimeCosts,
            incomeEntries:  appState.incomeEntries,
            checkpoints:    appState.checkpoints,
            strategy:       appState.strategy,
            startingBalance: appState.startingBalance,
            showMortgage:   appState.showMortgage,
            paidStatus:     appState.paidStatus,
            paidMonth:      appState.workingMonthKey || currentMonthKey(),
            monthlyArchives: appState.monthlyArchives,
            spendingBudgets: appState.spendingBudgets,
            minPayOverrides: appState.minPayOverrides,
        },
    });
}

// Save + auto-refresh UI. Use this for fire-and-forget saves so the UI
// always reflects the latest state without callers needing to manually render.
function saveDataAndRender() {
    return saveData()
        .then(() => renderUI())
        .catch(err => console.error('Debt Snowball: save failed —', err));
}

function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
}

// ─── Manual Month Advance ─────────────────────────────────────────────────────

export { STORE_URL_PATH, ensureStoreDashboard, loadBackendData, saveData, saveDataAndRender, currentMonthKey };
