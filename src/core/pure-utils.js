// Pure utility functions (no side effects, no DOM dependencies)

/**
 * Format a number as currency string
 * @param {number} n - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export function formatMoney(n, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

/**
 * Simple format without Intl (for contexts where Intl may not be available)
 * @param {number} n - Amount to format
 * @returns {string} Formatted string with $ prefix
 */
export function formatMoneySimple(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format a day number with ordinal suffix (1st, 2nd, 3rd, etc.)
 * @param {number} day - Day of month (1-31)
 * @returns {string} Day with ordinal suffix
 */
export function formatOrdinal(day) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    return day + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
export function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Calculate minimum credit card payment using standard formula:
 * max($25, 1% of balance + monthly interest)
 * @param {number} balance - Current balance
 * @param {number} aprPct - Annual percentage rate (e.g., 24.99)
 * @returns {number|null} Minimum payment or null if balance <= 0
 */
export function calcAutoMin(balance, aprPct) {
    if (!balance || balance <= 0) return null;
    const monthlyInterest = balance * (aprPct / 100 / 12);
    const onePercent = balance * 0.01;
    return Math.max(25, parseFloat((onePercent + monthlyInterest).toFixed(2)));
}
