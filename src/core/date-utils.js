// Date utility functions for month key management and date calculations

/**
 * Get current month key in format "YYYY-M" (0-indexed month)
 * @returns {string} Current month key
 */
export function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
}

/**
 * Format month key as human-readable label
 * @param {string} key - Month key in format "YYYY-M"
 * @returns {string} Formatted label (e.g., "March 2026")
 */
export function formatMonthLabel(key) {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * Convert month key to numeric index for comparison
 * @param {string} key - Month key in format "YYYY-M"
 * @returns {number} Numeric index (year * 12 + month)
 */
export function monthKeyToIndex(key) {
    const [y, m] = key.split('-').map(Number);
    return y * 12 + m;
}

/**
 * Add months to a month key
 * @param {string} key - Starting month key
 * @param {number} n - Number of months to add
 * @returns {string} New month key
 */
export function addMonthsToKey(key, n) {
    const total = monthKeyToIndex(key) + n;
    return `${Math.floor(total / 12)}-${total % 12}`;
}

/**
 * Check if a recurring cost is due in the current working month
 * @param {Object} cost - Cost object
 * @param {string} cost.category - Cost category ('one-time', 'utility', etc.)
 * @param {string} [cost.addedMonth] - Month key when one-time cost was added
 * @param {number} [cost.intervalMonths] - Recurrence interval (1 = monthly, 3 = quarterly, etc.)
 * @param {string} [cost.nextDueMonth] - Next due month key for interval costs
 * @param {string} monthKey - Month key to check (defaults to current month)
 * @returns {boolean} True if cost is due this month
 */
export function isCostDueThisMonth(cost, monthKey) {
    const key = monthKey || currentMonthKey();
    if ((cost.category || 'other') === 'one-time') {
        // One-time costs are only due in the month they were added (or legacy ones with no addedMonth)
        return !cost.addedMonth || cost.addedMonth === key;
    }
    if ((cost.intervalMonths || 1) <= 1) return true;
    const next = cost.nextDueMonth || key;
    const targetIdx = monthKeyToIndex(key);
    const nextIdx = monthKeyToIndex(next);
    return targetIdx >= nextIdx && (targetIdx - nextIdx) % cost.intervalMonths === 0;
}

/**
 * Check if a cost is due in a specific month (for archive/historical view)
 * @param {Object} cost - Cost object
 * @param {string} monthKey - Month key to check
 * @returns {boolean} True if cost is due in the specified month
 */
export function isCostDueInMonth(cost, monthKey) {
    if ((cost.category || 'other') === 'one-time') {
        return !cost.addedMonth || cost.addedMonth === monthKey;
    }
    if ((cost.intervalMonths || 1) <= 1) return true;
    const next = cost.nextDueMonth || monthKey;
    const targetIdx = monthKeyToIndex(monthKey);
    const nextIdx = monthKeyToIndex(next);
    return targetIdx >= nextIdx && (targetIdx - nextIdx) % cost.intervalMonths === 0;
}

/**
 * Generate biweekly income entries for a specific month
 * @param {string} label - Income label
 * @param {number} amount - Income amount
 * @param {string} anchorDateStr - Anchor date on the biweekly cycle (YYYY-MM-DD)
 * @param {string} monthKey - Target month key
 * @returns {Array<{day: number, amount: number}>} Array of income entries with day numbers
 */
export function generateBiweeklyForMonth(label, amount, anchorDateStr, monthKey) {
    // All math in UTC: adding 14*msPerDay to a local-midnight Date can drift by
    // an hour across DST boundaries and corrupt the resulting date.
    const anchor = Date.parse(anchorDateStr + 'T00:00:00Z');
    const [y, m] = monthKey.split('-').map(Number);
    const monthStart = Date.UTC(y, m, 1);
    const monthEnd = Date.UTC(y, m + 1, 0);
    const msPerDay = 86400000;
    const entries = [];

    // Find first occurrence on or before month start
    const daysDiff = Math.floor((monthStart - anchor) / msPerDay);
    const offset = ((daysDiff % 14) + 14) % 14;
    let current = monthStart - offset * msPerDay;

    // Generate occurrences within the month
    while (current <= monthEnd) {
        if (current >= monthStart) {
            const d = new Date(current);
            entries.push({
                label,
                amount,
                day: d.getUTCDate(),
                date: d.toISOString().split('T')[0],
                scheduleType: 'biweekly',
                scheduleAnchorDate: anchorDateStr,
            });
        }
        current += 14 * msPerDay;
    }
    return entries;
}

/**
 * Stable identity for a biweekly paycheck series. Stored rows carry seriesId;
 * legacy rows (pre-seriesId) fall back to anchor+label+amount.
 * @param {Object} e - Income entry
 * @returns {string} Series key
 */
function biweeklySeriesKey(e) {
    return e.seriesId || `${e.scheduleAnchorDate || e.anchorDate}|${e.label}|${e.amount}`;
}

/**
 * Generate recurring income entries for a month based on stored entries
 * @param {Array} entries - Stored income entries
 * @param {string} monthKey - Target month key
 * @returns {Array} Generated income entries for the month
 */
export function generateRecurringIncomeForMonth(entries, monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    const out = [];
    const seenSeries = new Set();

    for (const e of entries) {
        const schedule = e.scheduleType || e.schedule || 'monthly';
        if (schedule === 'one-time') continue; // Skip one-time entries

        if (schedule === 'biweekly' && (e.scheduleAnchorDate || e.anchorDate)) {
            // Biweekly: generate all occurrences for this month — once per series.
            // Stored rows are materialized occurrences that all carry the same
            // anchor; without dedupe each row would regenerate the whole series.
            const anchorDate = e.scheduleAnchorDate || e.anchorDate;
            const seriesId = biweeklySeriesKey(e);
            if (seenSeries.has(seriesId)) continue;
            seenSeries.add(seriesId);
            const idBase = e.seriesId || e.id || seriesId;
            const biweekly = generateBiweeklyForMonth(e.label, e.amount, anchorDate, monthKey);
            for (const b of biweekly) {
                out.push({
                    id: idBase + '_' + b.date,
                    label: e.label,
                    amount: e.amount,
                    date: b.date,
                    scheduleType: 'biweekly',
                    scheduleAnchorDate: anchorDate,
                    seriesId,
                });
            }
        } else {
            // Monthly (default): just adjust date to this month
            const day = e.scheduleDay || parseInt(e.date.split('-')[2]);
            const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            out.push({
                id: e.id,
                label: e.label,
                amount: e.amount,
                date: date,
                scheduleType: 'monthly',
                scheduleDay: day,
            });
        }
    }
    return out;
}

/**
 * Re-anchor a biweekly paycheck series from a specific occurrence.
 * The edited paycheck's new date becomes the series anchor: paychecks dated
 * before the edited one are already in the past and keep their dates; the
 * edited paycheck and everything after it is regenerated on the new 14-day
 * cycle. Label/amount changes apply to the whole series.
 *
 * @param {Array} entries - Current month's income entries
 * @param {string} editedId - Id of the paycheck row being edited
 * @param {{label: string, amount: number, date: string}} updates - New values
 * @param {string} monthKey - Working month key (YYYY-M)
 * @returns {Array} New income entries array (sorted by date)
 */
export function shiftBiweeklySeries(entries, editedId, updates, monthKey) {
    const edited = entries.find(e => e.id === editedId);
    if (!edited) return entries;
    const oldDate   = edited.date;
    const newAnchor = updates.date;
    const seriesId  = biweeklySeriesKey(edited);
    const inSeries  = e => biweeklySeriesKey(e) === seriesId;

    // Past paychecks keep their dates but adopt the new anchor so future
    // months regenerate on the new cycle.
    const past = entries
        .filter(e => inSeries(e) && e.date < oldDate)
        .map(e => ({ ...e, label: updates.label, amount: updates.amount, scheduleAnchorDate: newAnchor, seriesId }));

    // The edited paycheck and everything after it follows the new cycle.
    const future = generateBiweeklyForMonth(updates.label, updates.amount, newAnchor, monthKey)
        .filter(g => g.date >= newAnchor)
        .map(g => ({
            id: seriesId + '_' + g.date,
            label: updates.label,
            amount: updates.amount,
            day: g.day,
            date: g.date,
            scheduleType: 'biweekly',
            scheduleAnchorDate: newAnchor,
            seriesId,
        }));

    const rest = entries.filter(e => !inSeries(e));
    return [...rest, ...past, ...future].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get interval label for display
 * @param {number} n - Interval in months
 * @returns {string|null} Human-readable label or null if monthly
 */
export function intervalLabel(n) {
    if (!n || n <= 1) return null;
    if (n === 3) return '📆 Quarterly';
    if (n === 6) return '📆 Semi-Annual';
    if (n === 12) return '📆 Annual';
    return `📆 Every ${n} mo.`;
}

/**
 * Convert app month key (YYYY-M, 0-indexed) → HTML month input value (YYYY-MM, 1-indexed)
 * @param {string} key - Month key like "2026-3"
 * @returns {string} HTML month value like "2026-04"
 */
export function keyToHtmlMonth(key) {
    const [year, month] = key.split('-').map(Number);
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Convert HTML month input value (YYYY-MM, 1-indexed) → app month key (YYYY-M, 0-indexed)
 * @param {string} htmlMonth - HTML month value like "2026-04"
 * @returns {string} Month key like "2026-3"
 */
export function htmlMonthToKey(htmlMonth) {
    const [year, month] = htmlMonth.split('-').map(Number);
    return `${year}-${month - 1}`;
}
