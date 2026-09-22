import { appState } from './state.js';
import { monthKeyToIndex, keyToHtmlMonth, generateRecurringIncomeForMonth } from '../core/date-utils.js';
import { calculateMonthRollover } from '../core/rollover.js';
import { renderUI } from './render-modals.js';
import { initTabs } from './render-support.js';
import { reportError } from './error-report.js';
import { pickBackupSlot } from '../core/backups.js';
import { sanitizeData } from '../core/health.js';

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

// Server-side rotating backups: three hidden Lovelace dashboards used as
// backup slots. The oldest slot is overwritten on each backup.
const BACKUP_URL_PATHS = ['snowball-backup-1', 'snowball-backup-2', 'snowball-backup-3'];

// Ensure a hidden storage dashboard exists (idempotent — safe to call every time).
async function ensureDashboard(urlPath, title) {
    const conn = appState._root._hass.connection;

    // Check if it already exists by attempting to list dashboards
    try {
        const dashboards = await conn.sendMessagePromise({ type: 'lovelace/dashboards/list' });
        if (dashboards.some(d => d.url_path === urlPath)) return; // already exists
    } catch (err) {
        // If listing fails, attempt creation anyway
    }

    // Create the hidden dashboard — this only runs once ever
    try {
        await conn.sendMessagePromise({
            type:             'lovelace/dashboards/create',
            url_path:         urlPath,
            title:            title,
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

async function ensureStoreDashboard() {
    return ensureDashboard(STORE_URL_PATH, 'Snowball Store');
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
            // Data health: repair whatever the stored config contains rather
            // than trusting shapes. Each fix is disclosed to the user via the
            // health modal, and a raw pre-repair snapshot is preserved in a
            // server backup slot before anything gets saved over it.
            const { data: clean, issues } = sanitizeData(result);
            if (issues.some(i => i.severity !== 'info')) {
                try {
                    await preserveRawConfig(result, 'pre-repair snapshot');
                } catch (err) {
                    reportError('Could not preserve a pre-repair snapshot — repairs applied in memory only until the next save', err);
                }
                appState.dataIssues = issues;
            }
            const data = clean || result;

            appState.debts           = data.debts          || [];
            appState.recurringCosts  = data.recurringCosts  || [];
            appState.incomeEntries   = data.incomeEntries   || [];
            appState.checkpoints     = data.checkpoints     || [];
            appState.strategy        = data.strategy        || 'snowball';
            appState.showMortgage    = data.showMortgage !== false;
            appState.startingBalance = data.startingBalance || 0;
            appState.monthlyArchives  = data.monthlyArchives  || [];
            appState.spendingBudgets  = data.spendingBudgets  || [];
            appState.cardExpenseSkips = data.cardExpenseSkips || [];

            // Migration: income entries previously defaulted to scheduleType 'one-time',
            // which caused them to be skipped during month rollover (resulting in zero income).
            // Convert any entries with no scheduleType or 'one-time' to 'monthly'.
            let incomeMigrated = false;
            appState.incomeEntries = appState.incomeEntries.map(e => {
                const sched = e.scheduleType || e.schedule;
                if (!sched || sched === 'one-time') {
                    incomeMigrated = true;
                    const day = parseInt((e.date || '').split('-')[2]) || 1;
                    return { ...e, scheduleType: 'monthly', scheduleDay: day };
                }
                return e;
            });
            if (incomeMigrated) {
                console.info('[DebtSnowball] Migrated income entries to monthly schedule (were one-time/missing).');
            }

            // Repair: older biweekly rows were saved without id/seriesId and could
            // be duplicated by a rollover bug. Restore ids, derive seriesId, and
            // drop exact series+date duplicates.
            const seenIncomeRows = new Set();
            appState.incomeEntries = appState.incomeEntries
                .map((e, i) => ({
                    ...e,
                    id: e.id || `inc_${i}_${e.date}`,
                    // A biweekly row's own date is a valid anchor point when
                    // scheduleAnchorDate is missing — without one the row
                    // regenerates as monthly (wrong day, wrong count).
                    ...(e.scheduleType === 'biweekly' && !(e.scheduleAnchorDate || e.anchorDate) && e.date
                        ? { scheduleAnchorDate: e.date }
                        : {}),
                    ...(e.scheduleType === 'biweekly' && !e.seriesId
                        ? { seriesId: `${e.scheduleAnchorDate || e.date}|${e.label}|${e.amount}` }
                        : {}),
                }))
                .filter(e => {
                    const dupKey = e.scheduleType === 'biweekly' ? `${e.seriesId}|${e.date}` : e.id;
                    if (seenIncomeRows.has(dupKey)) return false;
                    seenIncomeRows.add(dupKey);
                    return true;
                });
            appState.minPayOverrides  = data.minPayOverrides  || {};
            appState.expenseDefaults  = data.expenseDefaults  || {};

            // Backward-compat: oneTimeCosts may not exist in older saved data.
            // If missing, migrate any one-time entries from recurringCosts.
            // (sanitizeData fills a default [] when absent, so detect "absent"
            // on the raw result, not the cleaned data.)
            if (result.oneTimeCosts !== undefined && result.oneTimeCosts !== null) {
                appState.oneTimeCosts = data.oneTimeCosts;
            } else {
                appState.oneTimeCosts = appState.recurringCosts.filter(c => (c.category || 'other') === 'one-time');
                appState.recurringCosts = appState.recurringCosts.filter(c => (c.category || 'other') !== 'one-time');
            }

            // Cleanup: remove stale one-time costs from previous months.
            // These may have accumulated due to a delete bug (fixed in v2.2.8)
            // where costs were never actually removed from state.
            // Also remove legacy one-time costs with no addedMonth — they should
            // not persist across months.
            const workingKey = data.paidMonth || currentMonthKey();
            const workingIdx = monthKeyToIndex(workingKey);
            let needsCleanupSave = incomeMigrated;
            const staleOneTime = appState.oneTimeCosts.filter(c => {
                if (!c.addedMonth) return true; // legacy entries with no addedMonth — remove
                return monthKeyToIndex(c.addedMonth) < workingIdx;
            });
            if (staleOneTime.length > 0) {
                appState.oneTimeCosts = appState.oneTimeCosts.filter(c => !staleOneTime.includes(c));
                needsCleanupSave = true;
                console.info(`[DebtSnowball] Cleaned up ${staleOneTime.length} stale one-time cost(s) from previous months.`);
            }

            // Also cleanup: remove any one-time costs that leaked into recurringCosts
            const leakedOneTime = appState.recurringCosts.filter(c => (c.category || 'other') === 'one-time');
            if (leakedOneTime.length > 0) {
                appState.recurringCosts = appState.recurringCosts.filter(c => (c.category || 'other') !== 'one-time');
                needsCleanupSave = true;
                console.info(`[DebtSnowball] Cleaned up ${leakedOneTime.length} one-time cost(s) that leaked into recurringCosts.`);
            }

            const prevMonth = data.paidMonth;
            const thisMonth = currentMonthKey();

            // workingMonthKey is whichever is later: the stored month or the calendar month.
            // This means if the user advanced early, workingMonthKey stays at the advanced month.
            appState.workingMonthKey = (prevMonth && monthKeyToIndex(prevMonth) > monthKeyToIndex(thisMonth))
                ? prevMonth
                : thisMonth;

            // Only archive if the calendar has moved *past* the stored month (not when user advanced ahead).
            if (prevMonth && monthKeyToIndex(thisMonth) > monthKeyToIndex(prevMonth)) {
                // Snapshot the outgoing month to a server backup slot before
                // rollover mutates anything. Best-effort: a failed backup is
                // reported loudly but can't block the calendar from moving.
                try {
                    // paidMonth override: workingMonthKey was already set to the
                    // new month, but this snapshot holds the OLD month's data.
                    await createServerBackup('month rollover', { paidMonth: prevMonth });
                } catch (err) {
                    reportError('Automatic backup failed before month rollover — continuing without a restore point', err);
                }

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

                saveData().catch(err => reportError('Month rollover save failed', err));
            } else if (data.paidStatus) {
                // Covers: stored month == calendar month, OR stored month is ahead (user advanced early)
                appState.paidStatus = data.paidStatus;
            } else {
                appState.paidStatus = {};
            }

            // Repair: recurring income rows must be materialized for the
            // working month — stale rows (missed rollover, restored backup)
            // carry last month's dates and land on the wrong days in the cash
            // plan. Regeneration is idempotent: monthly rows re-derive from
            // scheduleDay, biweekly rows from the series anchor.
            {
                const wm = appState.workingMonthKey;
                const htmlMk = wm ? keyToHtmlMonth(wm) : null;
                const isOneTimeInc = e => (e.scheduleType || e.schedule) === 'one-time';
                const stale = appState.incomeEntries.filter(e =>
                    !isOneTimeInc(e) && (e.date || '').slice(0, 7) !== htmlMk);
                if (htmlMk && stale.length) {
                    appState.incomeEntries = [
                        ...generateRecurringIncomeForMonth(appState.incomeEntries, wm),
                        ...appState.incomeEntries.filter(isOneTimeInc),
                    ];
                    needsCleanupSave = true;
                    console.info(`[DebtSnowball] Regenerated ${stale.length} income entr(ies) with stale dates for the working month.`);
                }
            }

            // If cleanup removed stale data but no rollover occurred, persist the cleaned state
            // so it doesn't come back on next reload.
            if (needsCleanupSave) {
                saveData().catch(err => reportError('Cleanup save failed', err));
            }
        }
    } catch (err) {
        // A "not found" / "config_not_found" error just means first run — start empty.
        // Any other error (network, auth, etc.) leaves us on an empty state —
        // flag it so saves are blocked rather than overwriting real data.
        const msg = String(err?.message ?? err).toLowerCase();
        if (!msg.includes('not_found') && !msg.includes('not found') && !msg.includes('config_not_found')) {
            appState.loadFailed = true;
            reportError('Could not load saved data — showing an empty state. Saves are blocked until you reload, to protect your stored data', err);
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
// The full persisted snapshot — also the shape of file exports and server backups.
function buildSavePayload() {
    return {
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
        cardExpenseSkips: appState.cardExpenseSkips,
        minPayOverrides: appState.minPayOverrides,
        expenseDefaults: appState.expenseDefaults,
    };
}

async function saveData() {
    if (!appState._root._hass) return;
    if (appState.loadFailed) {
        throw new Error('Refusing to save: the initial data load failed and saving now could overwrite your stored data. Reload the card and try again.');
    }

    // Active tab stays in the browser
    const activeTabEl = appState._root.querySelector('.tab-btn.active');
    if (activeTabEl) localStorage.setItem('snowball_active_tab', activeTabEl.dataset.tab);

    await ensureStoreDashboard();

    await appState._root._hass.connection.sendMessagePromise({
        type:      'lovelace/config/save',
        url_path:  STORE_URL_PATH,
        config:    buildSavePayload(),
    });
}

// ─── Server-side rotating backups ────────────────────────────────────────────
// Three hidden dashboards act as backup slots; the oldest is overwritten.
// Slots are chosen by reading each slot's _meta.savedAt — no separate index
// to keep in sync (a lost counter can't orphan backups).

async function _readSlotConfig(urlPath) {
    return appState._root._hass.connection.sendMessagePromise({
        type: 'lovelace/config', url_path: urlPath, force: true,
    });
}

// Write an arbitrary config object into the oldest backup slot.
async function _writeServerBackupConfig(config, reason) {
    const savedAt = new Date().toISOString();

    // Pick the first empty slot, else the oldest existing backup
    const slots = [];
    for (const path of BACKUP_URL_PATHS) {
        let cfg = null;
        try { cfg = await _readSlotConfig(path); } catch { /* missing/unreadable slot counts as empty */ }
        slots.push({ path, cfg });
    }
    const target = pickBackupSlot(slots);

    await ensureDashboard(target, 'Snowball Backup');
    await appState._root._hass.connection.sendMessagePromise({
        type:     'lovelace/config/save',
        url_path: target,
        config:   { _meta: { savedAt, reason }, ...config },
    });
    return { urlPath: target, savedAt };
}

/**
 * Snapshot the current state into the oldest backup slot.
 * The payload is captured before any async work so concurrent edits can't
 * leak into the backup.
 * @param {string} reason - Why the backup was taken (e.g. 'month advance')
 * @param {Object} [overrides] - Fields to override in the snapshot (e.g.
 *   paidMonth when the snapshot predates a workingMonthKey update)
 * @returns {Promise<{urlPath: string, savedAt: string}|null>}
 */
async function createServerBackup(reason = 'auto', overrides = {}) {
    if (!appState._root._hass || appState.loadFailed) return null;

    const payload = buildSavePayload(); // snapshot NOW, before awaiting
    return _writeServerBackupConfig({ ...payload, ...overrides }, reason);
}

/**
 * Preserve a raw config verbatim (e.g. corrupted stored data before
 * sanitizeData repairs it in memory). The raw copy stays restorable —
 * restoring it runs the same repair pass, so nothing is lost either way.
 */
async function preserveRawConfig(rawConfig, reason = 'pre-repair snapshot') {
    if (!appState._root._hass) return null;
    return _writeServerBackupConfig({ ...rawConfig }, reason);
}

/**
 * List existing server backups, newest first.
 * @returns {Promise<Array<{urlPath: string, savedAt: string, reason: string, config: Object}>>}
 */
async function listServerBackups() {
    if (!appState._root._hass) return [];
    const out = [];
    for (const path of BACKUP_URL_PATHS) {
        try {
            const cfg = await _readSlotConfig(path);
            if (cfg?._meta) {
                out.push({ urlPath: path, savedAt: cfg._meta.savedAt || '', reason: cfg._meta.reason || 'backup', config: cfg });
            }
        } catch { /* slot doesn't exist yet */ }
    }
    return out.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}

// Save + auto-refresh UI. Use this for fire-and-forget saves so the UI
// always reflects the latest state without callers needing to manually render.
// We render even on save failure because the in-memory appState is already
// mutated by the caller — the user should see their change immediately.
function saveDataAndRender() {
    return saveData()
        .then(() => renderUI())
        .catch(err => {
            reportError('Save failed — your change may not persist after reload', err);
            renderUI();
        });
}

function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
}

// ─── Manual Month Advance ─────────────────────────────────────────────────────

export { STORE_URL_PATH, ensureStoreDashboard, loadBackendData, saveData, saveDataAndRender, currentMonthKey, buildSavePayload, createServerBackup, preserveRawConfig, listServerBackups };
