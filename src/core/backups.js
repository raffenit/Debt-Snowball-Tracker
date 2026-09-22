// Backup logic — pure functions for server-side backup rotation and for
// validating/filtering backup payloads before they replace app state.
// All I/O (HA API calls, DOM, saveData) lives in the callers:
//   app/storage.js      — createServerBackup / listServerBackups
//   app/render-export.js — applyBackupData (file import + server restore)

import { keyToHtmlMonth } from './date-utils.js';
import { sanitizeData } from './health.js';

// ─── Server backup slot rotation ─────────────────────────────────────────────
// Backups live in a fixed set of store slots. The first empty slot wins;
// once all slots hold backups, the oldest (by _meta.savedAt) is overwritten.
// A slot whose timestamp is missing/unparseable counts as oldest — safest
// thing to overwrite.

const slotTime = cfg => (cfg?._meta?.savedAt ? Date.parse(cfg._meta.savedAt) : 0) || 0;

/**
 * Pick which backup slot to write next.
 * @param {Array<{path: string, cfg: Object|null}>} slots - slots in fixed order
 * @returns {string} url_path of the slot to write
 */
export function pickBackupSlot(slots) {
    if (!slots?.length) return null;
    const empty = slots.find(s => !s.cfg);
    if (empty) return empty.path;
    return slots.reduce((a, b) => (slotTime(a.cfg) <= slotTime(b.cfg) ? a : b)).path;
}

// ─── Backup payload validation ───────────────────────────────────────────────
// Field-level problems are repairable — see core/health.js sanitizeData(),
// which fixes them and reports each repair. Validation here only answers the
// narrower question: is this payload recognizable as our data at all?

/**
 * @param {*} data - parsed backup JSON
 * @returns {string|null} human-readable validation error, or null if usable
 */
export function validateBackupData(data) {
    const fatal = sanitizeData(data).issues.find(i => i.severity === 'fatal');
    return fatal ? fatal.detail : null;
}

// ─── Month-aware field filtering ─────────────────────────────────────────────
// Import/restore is REPLACE semantics: every managed field is set from the
// backup, defaulting to empty when absent (a missing key means "no data",
// never "keep current").
//
// Month-scoped data only applies when the backup belongs to the working
// month: paidStatus/minPayOverrides are dropped otherwise (old backups lack
// paidMonth entirely — conservative drop), one-time costs are matched by
// addedMonth, one-time income by date prefix, and dated budget expenses by
// date prefix. Undated expenses and autoCard mirrors are month-agnostic.

/**
 * Compute the field values a backup should replace state with.
 * @param {Object} data - validated backup payload
 * @param {string} monthKey - working month ("YYYY-M", zero-based month)
 * @returns {Object} field map to assign onto appState
 */
export function filterBackupFields(data, monthKey) {
    const htmlMk = keyToHtmlMonth(monthKey);
    const monthMatches = d => (d || '').slice(0, 7) === htmlMk;
    const backupIsCurrentMonth = data.paidMonth === monthKey;

    const fields = {
        debts:            data.debts          ?? [],
        recurringCosts:   data.recurringCosts ?? [],
        checkpoints:      data.checkpoints    ?? [],
        strategy:         ['snowball', 'avalanche'].includes(data.strategy) ? data.strategy : 'snowball',
        cardExpenseSkips: data.cardExpenseSkips ?? [],
        monthlyArchives:  data.monthlyArchives  ?? [],
        paidStatus:       backupIsCurrentMonth ? (data.paidStatus     ?? {}) : {},
        minPayOverrides:  backupIsCurrentMonth ? (data.minPayOverrides ?? {}) : {},
        startingBalance:  data.startingBalance ?? 0,
        showMortgage:     data.showMortgage !== false,
        oneTimeCosts:     (data.oneTimeCosts ?? []).filter(c => c.addedMonth === monthKey),
        incomeEntries:    (data.incomeEntries ?? []).filter(e =>
            e.scheduleType !== 'one-time' || monthMatches(e.date)),
        spendingBudgets:  (data.spendingBudgets ?? []).map(b => ({
            ...b,
            expenses: (b.expenses || []).filter(e => e.autoCard || !e.date || monthMatches(e.date)),
        })),
    };

    // Legacy migration: very old exports stored a single monthlyBudget number
    if (data.monthlyBudget !== undefined && !data.incomeEntries) {
        const now = new Date();
        fields.incomeEntries = [{ id: Date.now().toString(), label: 'Monthly Budget (migrated)',
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
            amount: data.monthlyBudget }];
    }

    return fields;
}
