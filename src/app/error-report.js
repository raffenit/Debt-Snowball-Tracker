import { appState } from './state.js';

// ─── Central error reporting ─────────────────────────────────────────────────
// One funnel for every failure in the app: log to the console AND surface a
// sticky, dismissible toast so problems are loud without blocking the UI.
//
// Rules for contributors:
//   - Never swallow errors with console.error/warn alone — call reportError().
//   - Catch blocks that are intentional fallbacks (e.g. "first run, no data")
//     should say so in a comment; everything else reports.
//   - Toasts are deduped per message for 30s, so reporting is always safe even
//     in loops.

const _recentToasts = new Map(); // message → last toast timestamp
const DEDUPE_MS     = 30000;
const LOG_CAP       = 50;

// Keep the real console.error so the backstop wrapper can't recurse.
const _origConsoleError = console.error.bind(console);

function _pushLog(context, msg, err) {
    if (!Array.isArray(appState.errorLog)) appState.errorLog = [];
    appState.errorLog.push({ ts: new Date().toISOString(), context, msg });
    if (appState.errorLog.length > LOG_CAP) appState.errorLog.shift();
    void err;
}

function _showStickyErrorToast(message) {
    if (!appState._root) return; // DOM not ready — console log still happened

    const existing = appState._root.getElementById('error-report-toast');
    if (existing) existing.remove();

    const toast     = document.createElement('div');
    toast.id        = 'error-report-toast';
    toast.className = 'undo-toast undo-toast-error';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span><button class="undo-toast-close" title="Dismiss">✕</button>`;
    appState._root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    // Sticky: stays until dismissed so failures can't be missed
    toast.querySelector('.undo-toast-close').addEventListener('click', () => {
        toast.classList.remove('undo-toast-visible');
        setTimeout(() => toast.remove(), 300);
    });
}

/**
 * Report an error: console + sticky toast + in-memory log.
 * @param {string} context - What was happening, e.g. "Save failed"
 * @param {*} err - Error object or message
 */
function reportError(context, err) {
    const detail = err?.message || (typeof err === 'string' ? err : '') || 'unknown error';
    _pushLog(context, detail, err);
    _origConsoleError(`Debt Snowball: ${context} —`, err);

    const now = Date.now();
    const key = `${context}: ${detail}`;
    if (now - (_recentToasts.get(key) || 0) < DEDUPE_MS) return;
    if (_recentToasts.size > 100) _recentToasts.clear();
    _recentToasts.set(key, now);

    _showStickyErrorToast(`⚠ ${context} — ${detail}`);
}

/**
 * Install the catch-all layers so no failure stays silent:
 *  - window 'error' / 'unhandledrejection' filtered to this card's code
 *  - console.error backstop: any 'Debt Snowball:'-prefixed log also toasts
 */
function initErrorReporting() {
    if (typeof window === 'undefined' || window.__snowballErrorReporting) return;
    window.__snowballErrorReporting = true;

    window.addEventListener('error', e => {
        const src = `${e.filename || ''} ${e.error?.stack || ''}`;
        if (src.includes('debt-snowball')) {
            reportError('Unexpected error', e.error || e.message);
        }
    });

    window.addEventListener('unhandledrejection', e => {
        const src = `${e.reason?.stack || ''} ${e.reason?.message || e.reason || ''}`;
        if (src.includes('debt-snowball')) {
            reportError('Unhandled async failure', e.reason);
        }
    });

    // Backstop: legacy/console-only paths still surface. reportError already
    // logged via _origConsoleError, so this can't recurse.
    console.error = (...args) => {
        _origConsoleError(...args);
        try {
            const head = String(args[0] ?? '');
            if (head.includes('Debt Snowball')) {
                const detail = args.find(a => a?.message)?.message || '';
                _showDedupedToast(`${head.replace(/\s*—\s*$/, '')}${detail ? ` — ${detail}` : ''}`);
            }
        } catch { /* never break logging */ }
    };
}

function _showDedupedToast(message) {
    const now = Date.now();
    if (now - (_recentToasts.get(message) || 0) < DEDUPE_MS) return;
    if (_recentToasts.size > 100) _recentToasts.clear();
    _recentToasts.set(message, now);
    _pushLog('console.error', message);
    _showStickyErrorToast(`⚠ ${message}`);
}

export { reportError, initErrorReporting };
