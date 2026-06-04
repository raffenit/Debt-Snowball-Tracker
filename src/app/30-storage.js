
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
    const conn = _root._hass.connection;

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
        const result = await _root._hass.connection.sendMessagePromise({
            type:      'lovelace/config',
            url_path:  STORE_URL_PATH,
            force:     true,
        });

        if (result) {
            debts           = result.debts          || [];
            recurringCosts  = result.recurringCosts  || [];
            incomeEntries   = result.incomeEntries   || [];
            checkpoints     = result.checkpoints     || [];
            strategy        = result.strategy        || 'snowball';
            showMortgage    = result.showMortgage !== false;
            startingBalance = result.startingBalance || 0;
            monthlyArchives  = result.monthlyArchives  || [];
            spendingBudgets  = result.spendingBudgets  || [];
            minPayOverrides  = result.minPayOverrides  || {};

            // Backward-compat: oneTimeCosts may not exist in older saved data.
            // If missing, migrate any one-time entries from recurringCosts.
            if (result.oneTimeCosts) {
                oneTimeCosts = result.oneTimeCosts;
            } else {
                oneTimeCosts = recurringCosts.filter(c => (c.category || 'other') === 'one-time');
                recurringCosts = recurringCosts.filter(c => (c.category || 'other') !== 'one-time');
            }

            const prevMonth = result.paidMonth;
            const thisMonth = currentMonthKey();

            // workingMonthKey is whichever is later: the stored month or the calendar month.
            // This means if the user advanced early, workingMonthKey stays at the advanced month.
            workingMonthKey = (prevMonth && monthKeyToIndex(prevMonth) > monthKeyToIndex(thisMonth))
                ? prevMonth
                : thisMonth;

            // Only archive if the calendar has moved *past* the stored month (not when user advanced ahead).
            if (prevMonth && monthKeyToIndex(thisMonth) > monthKeyToIndex(prevMonth)) {
                const rollover = calculateMonthRollover({
                    debts, recurringCosts, oneTimeCosts, incomeEntries, checkpoints,
                    startingBalance, paidStatus, spendingBudgets,
                }, prevMonth, thisMonth);

                monthlyArchives.unshift(rollover.archive);
                if (monthlyArchives.length > 24) monthlyArchives.pop();

                incomeEntries   = rollover.nextState.incomeEntries;
                checkpoints     = rollover.nextState.checkpoints;
                recurringCosts  = rollover.nextState.recurringCosts;
                oneTimeCosts    = rollover.nextState.oneTimeCosts;
                paidStatus      = rollover.nextState.paidStatus;
                minPayOverrides = rollover.nextState.minPayOverrides;
                spendingBudgets = rollover.nextState.spendingBudgets;

                saveData().catch(err => console.error('Debt Snowball: rollover save failed —', err));
            } else if (result.paidStatus) {
                // Covers: stored month == calendar month, OR stored month is ahead (user advanced early)
                paidStatus = result.paidStatus;
            } else {
                paidStatus = {};
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
        const savedBtn = _root.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
        if (savedBtn) savedBtn.click();
    }

    initTabs();
    renderUI();
}

// ─── 2. Save ─────────────────────────────────────────────────────────────────
async function saveData() {
    if (!_root._hass) return;

    // Active tab stays in the browser
    const activeTabEl = _root.querySelector('.tab-btn.active');
    if (activeTabEl) localStorage.setItem('snowball_active_tab', activeTabEl.dataset.tab);

    await ensureStoreDashboard();

    await _root._hass.connection.sendMessagePromise({
        type:      'lovelace/config/save',
        url_path:  STORE_URL_PATH,
        config:    {
            debts, recurringCosts, oneTimeCosts, incomeEntries, checkpoints,
            strategy, startingBalance, showMortgage,
            paidStatus, paidMonth: workingMonthKey || currentMonthKey(),
            monthlyArchives, spendingBudgets, minPayOverrides,
        },
    });
}

function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
}

// ─── Manual Month Advance ─────────────────────────────────────────────────────
