/**
 * Debt Snowball Tracker — Home Assistant Lovelace Card
 * 
 * Installation via HACS (recommended):
 *   1. Add custom repository: https://github.com/raffenit/debt-snowball-tracker
 *   2. Install "Debt Snowball Tracker" in HACS → Frontend
 *   3. Add card to your dashboard: Edit Dashboard → Add Card → Debt Snowball Tracker
 *   4. For best experience: Set view type to "Panel" in the view settings
 * 
 * Manual installation:
 *   1. Copy debt-snowball-card.js to /config/www/
 *   2. Add as resource: Settings → Dashboards → Resources → Add Resource
 *      URL: /local/debt-snowball-card.js  Type: JavaScript Module
 *   3. Add card to dashboard
 */

// Version marker - check console to verify which file is loaded
const PANEL_VERSION = '2.1.0-checkpoint-edit';
const PANEL_BUILD_DATE = '2025-04-18';

// Detect installation path for debugging
const currentScript = document.currentScript;
const scriptSrc = currentScript?.src || 'unknown';
const installType = scriptSrc.includes('hacsfiles') ? 'HACS' :
                    scriptSrc.includes('local') ? 'Manual (/local/)' :
                    scriptSrc.includes('community') ? 'HACS (community)' : 'Unknown';
console.info(`📊 Debt Snowball Tracker v${PANEL_VERSION} (${PANEL_BUILD_DATE})`);
console.info(`   Loaded from: ${installType} (${scriptSrc})`);

const PANEL_CSS = `
:host {
    display: block;
    width: 100% !important;
    height: 100% !important;
    min-height: 100vh;
    box-sizing: border-box;
    margin: 0 !important;
    padding: 0 !important;
}

* {
    box-sizing: border-box;
}

:root {
    --bg-color: #07061a;           /* Deep midnight */
    --card-bg: #0f0d2a;            /* Dark indigo */
    --card-bg-2: #13113a;          /* Slightly lighter indigo */
    --text-primary: #ede9ff;       /* Lavender white */
    --text-secondary: #7b74a8;     /* Muted violet */
    --accent-color: #5b7fff;       /* Blue-violet */
    --accent-hover: #4466ee;       /* Deeper blue-violet */
    --accent-glow: rgba(91, 127, 255, 0.35);
    --danger-color: #f4587a;       /* Hot rose */
    --success-color: #34c97a;      /* Vivid mint */
    --success-hover: #22ae63;
    --warning-color: #f0a050;      /* Warm amber */
    --warning-hover: #d4893a;
    --border-color: #1e2255;       /* Blue-indigo border */
    --border-bright: #2e3888;      /* Brighter blue-indigo border */
    --radius: 12px;
    --transition: all 0.2s ease;
    --promo-color: #a855f7;        /* 0% promo / BNPL rate */
    --promo-light: #c084fc;        /* Promo text accents */
    --teal-color: #2dd4bf;         /* Direct-pay cost accent */
    --expense-color: #f87171;      /* Expense row amounts */
}

* {
    margin: 0;
    padding: 0;
}

debt-snowball-card {
    display: block;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
}

body {
    font-family: 'DM Sans', 'Outfit', ui-sans-serif, system-ui, sans-serif;
    background-color: var(--bg-color);
    background-image:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(60, 80, 220, 0.18) 0%, transparent 70%),
        radial-gradient(ellipse 40% 30% at 80% 80%, rgba(40, 60, 180, 0.12) 0%, transparent 60%);
    color: var(--text-primary);
    line-height: 1.5;
    min-height: 100vh;
}

.app-container {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 1rem;
    min-height: 100vh;
    box-sizing: border-box;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
    background: linear-gradient(110deg, #7ab0ff 0%, #5b7fff 40%, #9b6dff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.month-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0.5rem;
    background: linear-gradient(135deg, rgba(91,127,255,0.08) 0%, rgba(168,85,247,0.05) 50%, rgba(91,127,255,0.08) 100%);
    border-radius: 10px;
    border: 1px solid rgba(91,127,255,0.15);
}

.month-title {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    background: linear-gradient(110deg, #a5b8ff 0%, #c084fc 50%, #a5b8ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    min-width: 140px;
    text-align: center;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: var(--transition);
    border: none;
    font-family: inherit;
}

.btn-primary {
    background-color: var(--accent-color);
    color: white;
    position: relative;
    overflow: hidden;
}

.btn-primary:hover {
    background-color: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--accent-glow);
}

.btn-primary:active {
    transform: translateY(0) scale(0.97);
    box-shadow: none;
}

.btn-secondary {
    background-color: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    position: relative;
    overflow: hidden;
}

.btn-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: var(--border-bright);
}

.btn-secondary:active {
    transform: scale(0.97);
}

.btn-danger {
    background-color: transparent;
    border: 1px solid var(--danger-color);
    color: var(--danger-color);
    position: relative;
    overflow: hidden;
}

.btn-danger:hover {
    background-color: var(--danger-color);
    color: white;
}

.btn-danger:active {
    transform: scale(0.97);
}

/* Ripple effect layer */
.btn-ripple {
    position: absolute;
    border-radius: 50%;
    width: 6px;
    height: 6px;
    background: rgba(255, 255, 255, 0.35);
    pointer-events: none;
    animation: ripple 0.5s ease-out forwards;
    transform-origin: center;
}

.main-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.card {
    background-color: var(--card-bg);
    background-image: linear-gradient(145deg, var(--card-bg-2), var(--card-bg));
    border-radius: var(--radius);
    padding: 1.5rem 2rem;
    box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.5),
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255,255,255,0.05) inset,
        0 0 0 1px rgba(255,255,255,0.02);
    border: 1px solid var(--border-color);
    transition: box-shadow 0.3s ease, transform 0.2s ease;
}
.card:hover {
    box-shadow: 
        0 16px 48px rgba(0, 0, 0, 0.55),
        0 6px 16px rgba(0, 0, 0, 0.35),
        0 1px 0 rgba(255,255,255,0.06) inset,
        0 0 0 1px rgba(91,127,255,0.1);
    transform: translateY(-2px);
}

h2 {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.subtitle {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 1.25rem;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.input-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
}

input[type="number"], input[type="text"], input[type="date"], input[type="month"], select {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: #07061a;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 1rem;
    transition: var(--transition);
    touch-action: manipulation;
}

input[type="number"]:focus, input[type="text"]:focus, input[type="date"]:focus, select:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(91, 127, 255, 0.2);
}

select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f8fafc'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1rem;
    padding-right: 2.25rem;
}


/* Date input calendar icon color fix for dark theme */
input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.7);
    cursor: pointer;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.debts-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
}

.debt-card {
    background-color: var(--card-bg);
    border-radius: var(--radius);
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease, border-color 0.22s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 
        0 6px 20px rgba(0, 0, 0, 0.35),
        0 2px 6px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(255,255,255,0.02);
}

.debt-card:hover {
    border-color: rgba(91,127,255,0.5);
    transform: translateY(-4px);
    box-shadow: 
        0 20px 44px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(91, 127, 255, 0.25),
        0 0 32px rgba(91,127,255,0.12),
        0 0 64px rgba(91,127,255,0.06);
}

.debt-name {
    font-weight: 600;
    font-size: 1.125rem;
    margin-bottom: 1rem;
    padding-right: 2rem;
    color: var(--text-primary);
}

.debt-detail {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
}

.debt-detail-label {
    color: var(--text-secondary);
}

.debt-detail-value {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.95rem;
}

.debt-balance-row {
    align-items: baseline;
    margin-bottom: 1rem;
}

.debt-balance-value {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-primary);
}

.debt-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border-color);
}

.debt-actions button {
    flex: 1;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(7, 6, 26, 0.88);
    backdrop-filter: blur(10px);
    z-index: 100;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.modal.active {
    display: flex;
    opacity: 1;
}

.modal-content {
    background: linear-gradient(160deg, var(--card-bg-2), var(--card-bg));
    border-radius: var(--radius);
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    border: 1px solid var(--border-bright);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(91,127,255,0.08);
    transform: translateY(20px);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal.active .modal-content {
    transform: translateY(0);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.close-modal, .close-income-modal, .close-cost-modal {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
    transition: var(--transition);
}

.close-modal:hover, .close-income-modal:hover, .close-cost-modal:hover {
    color: var(--text-primary);
    transform: scale(1.1);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 2rem;
}

/* Summary Stats */
.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
}

.stat-box {
    background-color: rgba(7, 6, 26, 0.6);
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #a5b8ff;
    letter-spacing: -0.02em;
}

/* Timeline/Progress Bars */
.timeline-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.chart-wrapper {
    background-color: rgba(7, 6, 26, 0.5);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 1rem;
}

#paydown-chart {
    width: 100%;
    height: 260px;
    display: block;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
    background-color: rgba(7, 6, 26, 0.4);
    border-radius: var(--radius);
    border: 1px dashed var(--border-color);
    font-size: 0.9rem;
    line-height: 1.7;
    animation: fadeIn 0.4s ease;
}

.empty-state .empty-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 1.1rem;
    padding: 0.55rem 1.25rem;
    background: rgba(91,127,255,0.12);
    border: 1px solid rgba(91,127,255,0.3);
    border-radius: var(--radius);
    color: var(--accent-color);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}

.empty-state .empty-cta-btn:hover {
    background: rgba(91,127,255,0.2);
    border-color: var(--accent-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(91,127,255,0.2);
}

.empty-state .empty-cta-btn:active {
    transform: scale(0.97) translateY(0);
}

/* ===== Timeline Error Card ===== */
.timeline-error-card {
    background: linear-gradient(145deg, rgba(244,88,122,0.08) 0%, rgba(240,160,80,0.05) 100%);
    border: 1px solid rgba(244,88,122,0.25);
    border-radius: var(--radius);
    padding: 1.5rem;
    margin: 1rem 0;
    text-align: center;
    box-shadow: 
        0 8px 32px rgba(0,0,0,0.3),
        0 0 0 1px rgba(255,255,255,0.02),
        0 0 24px rgba(244,88,122,0.08) inset;
}

.timeline-error-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    display: block;
}

.timeline-error-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
}

.timeline-error-message {
    font-size: 0.95rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 1.25rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
}

.timeline-error-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
}

.timeline-error-actions .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.25rem;
    font-size: 0.875rem;
}

/* ===== Tablet (≤ 1024px) ===== */
@media (max-width: 1024px) {
    .app-container {
        padding: 0.875rem;
    }

    .summary-stats {
        grid-template-columns: repeat(2, 1fr);
    }

    .stat-value {
        font-size: 1.35rem;
    }

    .debts-list {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }

    #debt-form {
        grid-template-columns: 1fr 1fr;
    }

    .windfall-comparison {
        flex-direction: column;
    }

    .windfall-arrow {
        transform: rotate(90deg);
        align-self: center;
    }

    .schedule-balance-col {
        min-width: 90px;
    }

    .schedule-amount-col {
        min-width: 80px;
    }

    /* Larger touch targets on tablet */
    debt-snowball-card .btn {
        padding: 0.75rem 1.375rem;
        min-height: 44px;
    }

    debt-snowball-card .tab-btn {
        padding: 0.75rem 1.25rem;
        min-height: 44px;
    }

    debt-snowball-card input[type="number"],
    debt-snowball-card input[type="text"],
    debt-snowball-card input[type="date"],
    debt-snowball-card select {
        padding: 0.875rem 1rem;
        min-height: 48px;
    }
}

/* ===== Mobile (≤ 640px) ===== */
@media (max-width: 640px) {
    .app-container {
        padding: 0.75rem;
    }

    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .header h1 {
        font-size: 1.25rem;
    }

    .tab-nav {
        margin-bottom: 0.75rem;
    }

    .tab-btn {
        padding: 0.4rem 0.75rem;
        font-size: 0.8rem;
    }

    .month-nav {
        padding: 0.375rem;
        margin-bottom: 0.625rem;
        gap: 0.5rem;
    }
    
    .month-nav .btn-sm {
        padding: 0.35rem 0.625rem;
        font-size: 0.75rem;
    }

    .month-title {
        font-size: 1rem;
        min-width: 100px;
    }

    .header-actions {
        width: 100%;
        flex-wrap: wrap;
    }

    .header-actions .btn {
        flex: 1;
        min-width: 0;
        font-size: 0.875rem;
        padding: 0.75rem 0.875rem;
        min-height: 44px;
    }

    .debts-list {
        grid-template-columns: 1fr;
    }

    .summary-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.875rem;
    }

    .stat-label {
        font-size: 0.8rem;
    }

    .stat-value {
        font-size: 1.35rem;
    }

    .card {
        padding: 1.125rem 1rem;
    }

    h2 {
        font-size: 1.125rem;
    }

    .subtitle {
        font-size: 0.9rem;
    }

    .input-group label {
        font-size: 0.9rem;
    }

    debt-snowball-card input[type="number"],
    debt-snowball-card input[type="text"],
    debt-snowball-card input[type="date"],
    debt-snowball-card select {
        padding: 0.875rem 1rem;
        font-size: 1rem;
        min-height: 48px;
    }

    debt-snowball-card .btn {
        min-height: 44px;
        font-size: 0.9rem;
    }

    debt-snowball-card .tab-btn {
        padding: 0.625rem 0.5rem;
        font-size: 0.85rem;
    }

    .modal {
        align-items: flex-end;
    }

    .modal-content {
        padding: 1.5rem 1.25rem;
        margin: 0;
        border-radius: var(--radius) var(--radius) 0 0;
        max-width: 100% !important;
        width: 100%;
        max-height: 92vh;
        overflow-y: auto;
    }

    .modal-header h2 {
        font-size: 1.1rem;
    }

    #debt-form {
        grid-template-columns: 1fr;
    }

    #promo-expiry-group {
        grid-column: 1;
    }

    .tab-nav {
        padding: 0.3rem;
        gap: 0.2rem;
        margin-bottom: 1.25rem;
        overflow-x: visible;
    }

    .tab-btn {
        flex: 1;
        justify-content: center;
        padding: 0.625rem 0.5rem;
        font-size: 0.85rem;
        min-height: 40px;
    }

    .schedule-header {
        display: none;
    }

    .windfall-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.875rem;
    }

    .btn-windfall {
        width: 100%;
        justify-content: center;
        min-height: 44px;
    }

    .income-summary,
    .debt-payments-summary,
    .recurring-cost-summary {
        flex-direction: column;
        gap: 0.375rem;
    }

    .income-summary-label,
    .debt-payments-label,
    .recurring-cost-label {
        font-size: 0.875rem;
    }

    .income-summary-value,
    .debt-payments-value,
    .recurring-cost-value {
        font-size: 1.2rem;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.625rem;
    }

    .section-header .btn {
        width: 100%;
    }

    .debt-actions {
        flex-direction: row;
        gap: 0.5rem;
    }

    .debt-actions button {
        min-height: 40px;
        font-size: 0.85rem;
    }

    .debt-name {
        font-size: 1.1rem;
    }

    .debt-detail {
        font-size: 0.9rem;
    }

    .modal-actions {
        flex-direction: column-reverse;
    }

    .modal-actions .btn {
        width: 100%;
        min-height: 48px;
    }

    .viz-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .strategy-toggle {
        width: 100%;
    }

    .strategy-btn {
        flex: 1;
        text-align: center;
        min-height: 40px;
    }

    .timeline-item {
        padding: 1rem;
    }

    .timeline-name {
        font-size: 0.95rem;
    }

    .timeline-date {
        font-size: 0.875rem;
    }

    .toggle-label {
        font-size: 0.95rem;
    }

    debt-snowball-card .tab-panel.active {
        gap: 1.5rem;
    }

    .main-content {
        gap: 1.5rem;
    }
}

/* ===== Small phone (≤ 480px) ===== */
@media (max-width: 480px) {
    .app-container {
        padding: 0.625rem;
    }
    
    .month-title {
        font-size: 0.875rem;
        min-width: 80px;
    }
    
    .month-nav .btn-sm {
        padding: 0.3rem 0.5rem;
        font-size: 0.7rem;
    }

    .header h1 {
        font-size: 1.5rem;
    }

    .summary-stats {
        grid-template-columns: 1fr 1fr;
        gap: 0.625rem;
    }

    .stat-box {
        padding: 1rem 0.875rem;
    }

    .stat-label {
        font-size: 0.775rem;
    }

    .stat-value {
        font-size: 1.25rem;
    }

    .stat-countdown-value {
        font-size: 1.875rem !important;
    }

    .card {
        padding: 1rem 0.875rem;
    }

    h2 {
        font-size: 1.1rem;
    }

    .tab-btn {
        padding: 0.6rem 0.375rem;
        font-size: 0.8rem;
    }

    .tab-label {
        display: none;
    }

    .tab-icon {
        font-size: 1.15rem;
    }

    .timeline-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .debt-card {
        padding: 1.25rem 1rem;
    }

    .debt-name {
        font-size: 1.05rem;
    }

    .debt-detail {
        font-size: 0.875rem;
    }

    .debt-detail-value {
        font-size: 0.875rem;
    }

    .undo-toast {
        left: 0.5rem;
        right: 0.5rem;
        min-width: 0;
        transform: translateX(0) translateY(120%);
        white-space: normal;
    }

    .undo-toast-visible {
        transform: translateX(0) translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes cardReveal {
    from {
        opacity: 0;
        transform: translateY(18px) scale(0.97);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-14px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(14px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(244, 88, 122, 0); }
    50%       { box-shadow: 0 0 0 6px rgba(244, 88, 122, 0.22); }
}

@keyframes progressFill {
    from { width: 0 !important; }
}

@keyframes ripple {
    from { transform: scale(0); opacity: 0.5; }
    to   { transform: scale(3); opacity: 0; }
}

@keyframes paidPulse {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.07); }
    65%  { transform: scale(0.97); }
    100% { transform: scale(1); }
}

@keyframes inlineFormIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
}

@keyframes expenseFadeOut {
    from { opacity: 1; transform: translateX(0); max-height: 60px; }
    to   { opacity: 0; transform: translateX(16px); max-height: 0; padding: 0; }
}

/* Animate section headers when tab becomes active */
debt-snowball-card .tab-panel.active .section-header {
    animation: slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

debt-snowball-card .tab-panel.active .section-header:nth-of-type(2) {
    animation-delay: 0.05s;
}

debt-snowball-card .tab-panel.active .section-header:nth-of-type(3) {
    animation-delay: 0.1s;
}

/* Animate summary bars at the bottom of each section */
debt-snowball-card .tab-panel.active .income-summary,
debt-snowball-card .tab-panel.active .debt-payments-summary,
debt-snowball-card .tab-panel.active .recurring-cost-summary {
    animation: fadeIn 0.4s ease backwards 0.3s;
}

/* Animate stat boxes on payment plan tab */
debt-snowball-card .tab-panel.active .stat-box {
    animation: cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

debt-snowball-card .tab-panel.active .stat-box:nth-child(1) { animation-delay: 0.05s; }
debt-snowball-card .tab-panel.active .stat-box:nth-child(2) { animation-delay: 0.12s; }
debt-snowball-card .tab-panel.active .stat-box:nth-child(3) { animation-delay: 0.19s; }
debt-snowball-card .tab-panel.active .stat-box:nth-child(4) { animation-delay: 0.26s; }

/* ===== Warning Button ===== */
.btn-warning {
    background-color: var(--warning-color);
    color: #07061a;
    font-weight: 600;
    position: relative;
    overflow: hidden;
}

.btn-warning:hover {
    background-color: var(--warning-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-warning:active {
    transform: scale(0.97) translateY(0);
    box-shadow: none;
}

/* ===== Success Button ===== */
.btn-success {
    background-color: var(--success-color);
    color: white;
    font-weight: 600;
    position: relative;
    overflow: hidden;
}

.btn-success:hover {
    background-color: var(--success-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-success:active {
    transform: scale(0.97) translateY(0);
    box-shadow: none;
}

/* ===== Recurring Cost Cards ===== */
.cost-card {
    border-left: 4px solid var(--warning-color) !important;
}

.cost-card:hover {
    border-color: var(--warning-color) !important;
    box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 0 0 1px rgba(245,158,11,0.15) !important;
    transform: translateY(-2px);
}

/* Direct Pay variant — teal/green accent */
.cost-card-direct {
    border-left-color: var(--teal-color) !important;
    background: linear-gradient(160deg, rgba(20, 184, 166, 0.06) 0%, var(--card-bg) 60%) !important;
}

.cost-card-direct:hover {
    border-color: var(--teal-color) !important;
    box-shadow: 0 10px 20px -4px rgba(20, 184, 166, 0.18) !important;
}

/* Credit Card variant — indigo/violet accent */
.cost-card-credit {
    border-left-color: #818cf8 !important;
    background: linear-gradient(160deg, rgba(99, 102, 241, 0.08) 0%, var(--card-bg) 60%) !important;
}

/* One-Time cost variant — red accent */
.cost-card-onetime {
    border-left-color: #f87171 !important;
    background: linear-gradient(160deg, rgba(239, 68, 68, 0.08) 0%, var(--card-bg) 60%) !important;
}

.cost-card-onetime:hover {
    border-color: #f87171 !important;
    box-shadow: 0 10px 20px -4px rgba(239, 68, 68, 0.18) !important;
}

.cost-card-credit:hover {
    border-color: #818cf8 !important;
    box-shadow: 0 10px 20px -4px rgba(99, 102, 241, 0.2) !important;
}

/* Amount value colour per card type */
.cost-card-direct .cost-amount {
    color: var(--teal-color) !important;
}

.cost-card-credit .cost-amount {
    color: #a5b4fc !important;
}

.recurring-badge {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid rgba(245, 158, 11, 0.3);
    white-space: nowrap;
}

/* ===== Income Cards ===== */
.income-card {
    border-left: 4px solid var(--success-color) !important;
    padding: 0.65rem 1rem !important;
}

.income-card:hover {
    border-color: var(--success-color) !important;
    box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 0 0 1px rgba(52,201,122,0.15) !important;
    transform: translateY(-2px);
}

/* Compact income card layout */
.income-compact-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.income-compact-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
    min-width: 0;
}

.income-compact-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.income-compact-date {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.income-compact-right {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-shrink: 0;
}

.income-compact-amount {
    font-weight: 700;
    font-size: 1rem;
    color: var(--success-color);
    margin-right: 0.25rem;
}

.btn-xs {
    padding: 0.18rem 0.55rem;
    font-size: 0.73rem;
    line-height: 1.4;
}

.income-amount {
    color: var(--success-color) !important;
}

/* ===== Section Cards (Income / Recurring / Debts tab containers) ===== */
.income-section, .recurring-section, .debts-section, .spending-budgets-section {
    background-color: var(--card-bg);
    background-image: linear-gradient(145deg, var(--card-bg-2), var(--card-bg));
    border-radius: var(--radius);
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.income-section:hover, .recurring-section:hover, .debts-section:hover, .spending-budgets-section:hover {
    box-shadow: 
        0 16px 48px rgba(0,0,0,0.45),
        0 0 0 1px rgba(255,255,255,0.05),
        0 0 32px rgba(91,127,255,0.1);
    transform: translateY(-2px);
}

.income-section {
    border-left: 4px solid var(--success-color);
    box-shadow: 
        0 10px 36px rgba(0,0,0,0.45),
        0 0 32px rgba(52,201,122,0.12) inset,
        0 0 0 1px rgba(52,201,122,0.1);
}
.income-section:hover {
    box-shadow: 
        0 14px 44px rgba(0,0,0,0.5),
        0 0 40px rgba(52,201,122,0.15) inset,
        0 0 24px rgba(52,201,122,0.1);
}

.recurring-section {
    border-left: 4px solid var(--warning-color);
    box-shadow: 
        0 10px 36px rgba(0,0,0,0.45),
        0 0 32px rgba(240,160,80,0.12) inset,
        0 0 0 1px rgba(240,160,80,0.1);
}
.recurring-section:hover {
    box-shadow: 
        0 14px 44px rgba(0,0,0,0.5),
        0 0 40px rgba(240,160,80,0.15) inset,
        0 0 24px rgba(240,160,80,0.1);
}

.debts-section {
    border-left: 4px solid var(--accent-color);
    box-shadow: 
        0 10px 36px rgba(0,0,0,0.45),
        0 0 32px rgba(91,127,255,0.12) inset,
        0 0 0 1px rgba(91,127,255,0.1);
}
.debts-section:hover {
    box-shadow: 
        0 14px 44px rgba(0,0,0,0.5),
        0 0 40px rgba(91,127,255,0.15) inset,
        0 0 24px rgba(91,127,255,0.1);
}

.spending-budgets-section {
    border-left: 4px solid #a855f7;
    box-shadow: 
        0 10px 36px rgba(0,0,0,0.45),
        0 0 32px rgba(168,85,247,0.12) inset,
        0 0 0 1px rgba(168,85,247,0.1);
}
.spending-budgets-section:hover {
    box-shadow: 
        0 14px 44px rgba(0,0,0,0.5),
        0 0 40px rgba(168,85,247,0.15) inset,
        0 0 24px rgba(168,85,247,0.1);
}

/* Budget tab card color accents */
#bank-balances-card {
    border-left: 4px solid var(--success-color);
    box-shadow: 
        0 10px 36px rgba(0,0,0,0.45),
        0 0 32px rgba(52,201,122,0.12) inset,
        0 0 0 1px rgba(52,201,122,0.1);
}
#bank-balances-card:hover {
    box-shadow: 
        0 14px 44px rgba(0,0,0,0.5),
        0 0 40px rgba(52,201,122,0.15) inset,
        0 0 20px rgba(52,201,122,0.1);
}

#payment-plan-section {
    border-left: 4px solid var(--accent-color);
    box-shadow: 
        0 10px 36px rgba(0,0,0,0.45),
        0 0 32px rgba(91,127,255,0.12) inset,
        0 0 0 1px rgba(91,127,255,0.1);
}
#payment-plan-section:hover {
    box-shadow: 
        0 14px 44px rgba(0,0,0,0.5),
        0 0 40px rgba(91,127,255,0.15) inset,
        0 0 20px rgba(91,127,255,0.1);
}

/* ===== Recurring Due-This-Month Summary Bar ===== */
.recurring-due-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1.25rem;
    padding: 0.7rem 1rem;
    margin-bottom: 1.25rem;
    border-radius: 0.4rem;
    background: rgba(240,160,80,0.08);
    border-left: 3px solid var(--warning-color);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    min-height: 2.5rem;
}

.recurring-due-summary:empty {
    display: none;
}

.recurring-due-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--warning-color);
    margin-right: 0.25rem;
}

.recurring-due-total {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--warning-color);
}

.recurring-due-breakdown {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-left: auto;
}

/* ===== Cost Sub-section Headers ===== */
.cost-subsection {
    margin-bottom: 1.25rem;
}

.cost-subsection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.9rem;
    border-radius: 0.375rem;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
}

.cost-subsection-total {
    font-weight: 700;
    font-size: 0.85rem;
}

.cost-subsection-utility .cost-subsection-header {
    background: linear-gradient(90deg, rgba(45,212,191,0.12) 0%, rgba(45,212,191,0.04) 100%);
    border-left: 3px solid var(--teal-color);
    color: var(--teal-color);
    box-shadow: inset 0 1px 0 rgba(45,212,191,0.08);
}

.cost-subsection-subscription .cost-subsection-header {
    background: linear-gradient(90deg, rgba(129,140,248,0.13) 0%, rgba(129,140,248,0.04) 100%);
    border-left: 3px solid #818cf8;
    color: #a5b4fc;
    box-shadow: inset 0 1px 0 rgba(129,140,248,0.08);
}

.cost-subsection-other .cost-subsection-header {
    background: linear-gradient(90deg, rgba(240,160,80,0.12) 0%, rgba(240,160,80,0.04) 100%);
    border-left: 3px solid var(--warning-color);
    color: var(--warning-color);
    box-shadow: inset 0 1px 0 rgba(240,160,80,0.08);
}

.cost-subsection-onetime .cost-subsection-header {
    background: linear-gradient(90deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.03) 100%);
    border-left: 3px solid #f87171;
    color: #f87171;
    box-shadow: inset 0 1px 0 rgba(239,68,68,0.06);
}

/* ===== Interval Cost Styles ===== */
.interval-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.18rem 0.45rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    background: rgba(148,163,184,0.12);
    color: #94a3b8;
    border: 1px solid rgba(148,163,184,0.2);
    margin-left: 0.3rem;
}

.cost-card.not-due-month {
    opacity: 0.42;
    filter: grayscale(0.35) brightness(0.85);
    transition: opacity 0.2s ease, filter 0.2s ease;
}

.cost-card.not-due-month:hover {
    opacity: 0.72;
    filter: grayscale(0.1) brightness(0.95);
}

/* ===== Compact Cost Card Layout (Utility / Subscription) ===== */
.cost-card-compact {
    padding: 0.65rem 0.9rem !important;
}
.cost-compact-body {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}
.cost-compact-info {
    flex: 1;
    min-width: 0;
}
.cost-compact-name-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.18rem;
}
.cost-compact-name {
    font-weight: 600;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
}
.cost-compact-amount {
    font-weight: 700;
    font-size: 0.95rem;
    flex-shrink: 0;
}
.cost-compact-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
}
.cost-compact-meta {
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
}
.cost-meta-dot {
    opacity: 0.35;
    font-size: 0.6rem;
}
.cost-compact-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
    flex-shrink: 0;
}
.cost-compact-paid .btn {
    font-size: 0.73rem !important;
    padding: 0.28rem 0.55rem !important;
    width: auto !important;
    white-space: nowrap;
}

/* Badges on own line for full-layout cost cards */
.cost-badges-line {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0.2rem 0 0.65rem;
}

/* Icon-only action row for full-layout cost cards */
.cost-icon-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.15rem;
    padding-top: 0.5rem;
    margin-top: 0.25rem;
    border-top: 1px solid var(--border-color);
}

/* Collapsible section headers */
.cost-section-collapsible {
    cursor: pointer;
    user-select: none;
}
.cost-section-collapsible:hover {
    filter: brightness(1.12);
}
.cost-section-toggle-icon {
    font-size: 0.6rem;
    display: inline-block;
    transition: transform 0.2s ease;
    vertical-align: middle;
}
.cost-section-toggle-icon.collapsed {
    transform: rotate(-90deg);
}

.not-due-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.18rem 0.45rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 600;
    background: rgba(100,116,139,0.1);
    color: #64748b;
    border: 1px dashed rgba(100,116,139,0.3);
    margin-left: 0.3rem;
}

/* ===== Spending Budgets ===== */
.budget-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-left: 3px solid var(--accent-color);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 0.75rem;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    animation: cardReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards 0s;
    box-shadow: 
        0 6px 20px rgba(0,0,0,0.35),
        0 2px 6px rgba(0,0,0,0.2),
        0 0 0 1px rgba(255,255,255,0.02);
}
.budget-card:hover {
    box-shadow: 
        0 14px 36px rgba(0,0,0,0.4),
        0 0 0 1px rgba(91,127,255,0.2),
        0 0 24px rgba(91,127,255,0.1);
    transform: translateY(-3px);
    border-color: rgba(91,127,255,0.4);
}
.budget-card.budget-over {
    border-left-color: var(--danger-color);
    border-color: rgba(239,68,68,0.35);
    animation: pulseGlow 2.5s ease-in-out infinite;
    box-shadow: 
        0 6px 20px rgba(0,0,0,0.35),
        0 0 16px rgba(244,88,122,0.1),
        0 0 0 1px rgba(244,88,122,0.08);
}
.budget-card.budget-over:hover {
    box-shadow: 
        0 14px 36px rgba(244,88,122,0.25),
        0 0 0 1px rgba(244,88,122,0.3),
        0 0 32px rgba(244,88,122,0.15);
    border-color: rgba(244,88,122,0.5);
}
.budget-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    user-select: none;
    gap: 0.75rem;
    transition: background 0.15s ease;
}
.budget-card-header:hover {
    background: rgba(255,255,255,0.04);
}
.budget-card-header:active {
    background: rgba(255,255,255,0.07);
}
.budget-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
}
.budget-toggle-icon {
    font-size: 0.6rem;
    color: var(--text-secondary);
    flex-shrink: 0;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.budget-card[data-expanded="true"] .budget-toggle-icon {
    transform: rotate(90deg);
}
.budget-name {
    font-weight: 600;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.budget-exception-badge {
    background: rgba(91,127,255,0.15);
    color: var(--accent-color);
    border: 1px solid rgba(91,127,255,0.3);
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    white-space: nowrap;
    flex-shrink: 0;
}
.budget-header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
}
.budget-spent-of {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.budget-remaining {
    font-size: 0.85rem;
    color: var(--success-color);
    font-weight: 600;
    white-space: nowrap;
}
.budget-over-label {
    font-size: 0.8rem;
    color: var(--danger-color);
    font-weight: 700;
    white-space: nowrap;
    background: rgba(244,88,122,0.1);
    border: 1px solid rgba(244,88,122,0.25);
    border-radius: 999px;
    padding: 0.1rem 0.55rem;
}
.budget-progress-track {
    height: 5px;
    background: rgba(255,255,255,0.07);
    border-radius: 0 0 3px 3px;
}
.budget-progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0;
    animation: progressFill 0.8s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}
.budget-expenses-panel {
    border-top: 1px solid var(--border-color);
    padding: 0.75rem 1rem 1rem;
    animation: fadeIn 0.25s ease;
}
.budget-empty-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-style: italic;
    margin: 0.25rem 0 0.75rem;
}
.budget-expense-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 0.88rem;
    transition: background 0.15s ease;
    border-radius: 4px;
    padding-left: 0.25rem;
    padding-right: 0.25rem;
}
.budget-expense-row:hover {
    background: rgba(255,255,255,0.03);
}
.budget-expense-row:last-of-type {
    border-bottom: none;
}
.budget-expense-row.expense-removing {
    animation: expenseFadeOut 0.3s ease forwards;
    overflow: hidden;
}

/* ===== Inline Expense Form ===== */
.inline-expense-form {
    background: rgba(91, 127, 255, 0.06);
    border: 1px solid rgba(91, 127, 255, 0.2);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    margin-top: 0.75rem;
    animation: inlineFormIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.inline-expense-form-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    flex-wrap: wrap;
}

.inline-expense-form .inline-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    min-width: 80px;
}

.inline-expense-form .inline-field.field-desc {
    flex: 2;
    min-width: 120px;
}

.inline-expense-form .inline-field label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
}

.inline-expense-form input {
    padding: 0.45rem 0.65rem;
    font-size: 0.875rem;
    background: rgba(7,6,26,0.7);
    border: 1px solid var(--border-bright);
    border-radius: 7px;
    color: var(--text-primary);
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
}

.inline-expense-form input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(91,127,255,0.15);
}

.inline-expense-form-actions {
    display: flex;
    gap: 0.4rem;
    align-items: flex-end;
    flex-shrink: 0;
    padding-bottom: 0;
}

.btn-inline-save {
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 7px;
    padding: 0.5rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
}
.btn-inline-save:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
}
.btn-inline-save:active { transform: scale(0.96); }

.btn-inline-cancel {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: 7px;
    padding: 0.5rem 0.65rem;
    font-size: 0.8rem;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
}
.btn-inline-cancel:hover {
    background: rgba(255,255,255,0.06);
    color: var(--text-primary);
}
.expense-description {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.expense-date {
    color: var(--text-secondary);
    font-size: 0.8rem;
    white-space: nowrap;
    flex-shrink: 0;
}
.expense-amount {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 4.5rem;
    text-align: right;
}
.expense-actions {
    display: flex;
    gap: 0.15rem;
    flex-shrink: 0;
}
.btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.2rem 0.35rem;
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--text-secondary);
    transition: color 0.15s, background 0.15s;
    line-height: 1;
}
.btn-icon:hover {
    color: var(--text-primary);
    background: rgba(255,255,255,0.08);
}
.btn-icon.btn-delete-expense:hover {
    color: var(--danger-color);
}
.budget-card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.85rem;
    flex-wrap: wrap;
    align-items: center;
}
.btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
}
.btn-override {
    background: linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(91,127,255,0.1) 100%);
    border: 1px solid rgba(168,85,247,0.35);
    color: #c084fc;
    border-radius: 20px;
    font-weight: 500;
    transition: all 0.2s ease;
}
.btn-override:hover {
    background: linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(91,127,255,0.18) 100%);
    border-color: rgba(168,85,247,0.55);
    color: #d8b4fe;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(168,85,247,0.2);
}
.btn-override.active {
    background: linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(91,127,255,0.25) 100%);
    border-color: rgba(168,85,247,0.65);
    color: #e9d5ff;
}

/* Min payment override button (in schedule rows) */
.btn-override-min {
    background: linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(91,127,255,0.08) 100%);
    border: 1px solid rgba(168,85,247,0.3);
    color: #c084fc;
    border-radius: 20px;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
}
.btn-override-min:hover {
    background: linear-gradient(135deg, rgba(168,85,247,0.22) 0%, rgba(91,127,255,0.15) 100%);
    border-color: rgba(168,85,247,0.5);
    color: #d8b4fe;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(168,85,247,0.15);
}

/* Budget card override button */
.btn-override-budget {
    background: linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(91,127,255,0.08) 100%);
    border: 1px solid rgba(168,85,247,0.3);
    color: #c084fc;
    border-radius: 20px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
}
.btn-override-budget:hover {
    background: linear-gradient(135deg, rgba(168,85,247,0.22) 0%, rgba(91,127,255,0.15) 100%);
    border-color: rgba(168,85,247,0.5);
    color: #d8b4fe;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(168,85,247,0.15);
}

.budget-total-row {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.4rem 0 0.5rem;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin-top: 0.25rem;
    font-size: 0.88rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}
.budget-total-over { color: var(--danger-color); }
.budget-total-ok   { color: var(--text-secondary); }

/* ===== Spending Budgets Section Container ===== */
.spending-budgets-section {
    background-color: var(--card-bg);
    background-image: linear-gradient(145deg, var(--card-bg-2), var(--card-bg));
    border-radius: var(--radius);
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    border-left: 4px solid var(--accent-color);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(91,127,255,0.06) inset;
    transition: box-shadow 0.2s ease;
}

.spending-budgets-section:hover {
    box-shadow: 0 12px 40px rgba(0,0,0,0.35), 0 0 24px rgba(91,127,255,0.08) inset;
}

/* ===== Budget Section Meta Bar ===== */
.budget-meta-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.6rem 1rem;
    background: rgba(91,127,255,0.06);
    border: 1px solid rgba(91,127,255,0.15);
    border-radius: 10px;
    margin-bottom: 1rem;
    font-size: 0.82rem;
    color: var(--text-secondary);
    animation: fadeIn 0.35s ease;
}

.budget-meta-month {
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--accent-color);
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.budget-meta-total {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: auto;
    font-weight: 600;
}

.budget-meta-budgeted {
    color: var(--text-secondary);
}

.budget-meta-spent {
    color: var(--text-primary);
    font-weight: 700;
}

.budget-meta-over {
    color: var(--danger-color);
}

.budget-meta-ok {
    color: var(--success-color);
}

.budget-meta-divider {
    width: 1px;
    height: 16px;
    background: var(--border-color);
    flex-shrink: 0;
}

/* ===== Archive Modal ===== */
.archive-modal-content {
    max-width: 560px;
}

.archive-select {
    width: 100%;
    margin-bottom: 1.25rem;
}

.archive-summary {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.archive-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 1rem;
    background: rgba(255,255,255,0.03);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    font-size: 0.875rem;
}

.archive-summary-label {
    color: var(--text-secondary);
}

.archive-summary-value {
    font-weight: 600;
    color: var(--text-primary);
}

.archive-summary-value.income  { color: var(--success-color); }
.archive-summary-value.expense { color: var(--expense-color, #f87171); }

.archive-detail-toggle {
    cursor: pointer;
    color: var(--accent-color);
    font-size: 0.8rem;
    background: none;
    border: none;
    padding: 0.25rem 0;
    text-decoration: underline;
}

.archive-detail-section {
    margin-top: 0.5rem;
    display: none;
    flex-direction: column;
    gap: 0.3rem;
}

.archive-detail-section.open {
    display: flex;
}

.archive-detail-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    color: var(--text-secondary);
    border-bottom: 1px solid rgba(255,255,255,0.04);
}

.archive-empty {
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.875rem;
    padding: 2rem 1rem;
}

.income-badge {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid rgba(16, 185, 129, 0.3);
    white-space: nowrap;
}

.income-summary {
    margin-top: 1.25rem;
    padding: 1rem 1.25rem;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.income-summary-label {
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.income-summary-value {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--success-color);
}

/* ===== Debt Cards ===== */
.debt-payments-summary {
    margin-top: 1.25rem;
    padding: 1rem 1.25rem;
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.debt-payments-label {
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.debt-payments-value {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--warning-color);
}

/* ===== Recurring Cost Cards ===== */
.recurring-cost-summary {
    margin-top: 1.25rem;
    padding: 1rem 1.25rem;
    background: rgba(255, 111, 106, 0.08);
    border: 1px solid rgba(202, 0, 0, 0.2);
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.recurring-cost-label {
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.recurring-cost-value {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--danger-color);
}

/* ===== Snowball Badge ===== */
.snowball-badge {
    background: rgba(91, 127, 255, 0.15);
    color: #a5b8ff;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid rgba(91, 127, 255, 0.3);
}

/* ===== Compact Forecast Bar ===== */
.forecast-bar {
    display: flex;
    gap: 1.5rem;
    background: rgba(7, 6, 26, 0.4);
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    margin-top: 0.25rem;
    font-size: 0.85rem;
    flex-wrap: wrap;
}

.forecast-item {
    display: flex;
    gap: 0.4rem;
    align-items: center;
}

.forecast-label {
    color: var(--text-secondary);
}

.forecast-value {
    font-weight: 700;
    color: var(--text-primary);
}

/* ===== Payment Schedule ===== */
.payment-schedule {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.schedule-row {
    display: flex;
    align-items: center;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid rgba(42, 37, 96, 0.6);
    transition: var(--transition);
    gap: 1rem;
}

.schedule-row:last-child {
    border-bottom: none;
}

.schedule-row:hover {
    background: rgba(255, 255, 255, 0.03);
}

/* ===== Schedule Row Backgrounds ===== */
.schedule-starting {
    background: rgba(255, 255, 255, 0.02);
}

.schedule-checkpoint {
    background: rgba(168, 85, 247, 0.04);
}

.schedule-income {
    background: rgba(16, 185, 129, 0.05);
}
.schedule-income:hover {
    background: rgba(16, 185, 129, 0.09) !important;
}

.schedule-recurring-direct {
    background: rgba(20, 184, 166, 0.06);
    border-left: 3px solid rgba(20, 184, 166, 0.5);
}
.schedule-recurring-direct:hover {
    background: rgba(20, 184, 166, 0.1) !important;
}

.schedule-recurring-card {
    background: rgba(99, 102, 241, 0.06);
    border-left: 3px solid rgba(99, 102, 241, 0.5);
}
.schedule-recurring-card:hover {
    background: rgba(99, 102, 241, 0.1) !important;
}

.schedule-debt {
    background: rgba(91, 127, 255, 0.04);
    border-left: 3px solid rgba(91, 127, 255, 0.5);
}
.schedule-debt:hover {
    background: rgba(91, 127, 255, 0.09) !important;
}

.schedule-income {
    background: rgba(16, 185, 129, 0.04);
}

.schedule-income:hover {
    background: rgba(16, 185, 129, 0.08) !important;
}

.schedule-date-col {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 100px;
    flex-shrink: 0;
}

.schedule-icon {
    font-size: 1.1rem;
}

.schedule-day {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.schedule-info-col {
    flex: 1;
    min-width: 0;
}

.schedule-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.schedule-detail {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
}

.schedule-amount-col {
    font-weight: 700;
    font-size: 1rem;
    text-align: right;
    min-width: 100px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
}

.schedule-amount-income {
    color: var(--success-color);
}

.schedule-amount-expense {
    color: var(--expense-color);
}

.schedule-balance-col {
    font-weight: 600;
    font-size: 0.95rem;
    text-align: right;
    min-width: 110px;
    flex-shrink: 0;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    background: rgba(7, 6, 26, 0.5);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
}

.col-label {
    display: block;
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-secondary);
    opacity: 0.7;
}

/* Groups amount + balance so they can stack on mobile */
.schedule-right-col {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
}

.balance-healthy {
    color: var(--success-color);
}

.balance-low {
    color: var(--warning-color);
}

.balance-zero {
    color: var(--danger-color);
}

/* Schedule badges */
.schedule-badge {
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    font-size: 0.65rem;
    font-weight: 600;
    white-space: nowrap;
}

.schedule-badge-income {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.schedule-badge-recurring {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.schedule-badge-deferred {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.schedule-badge-partial {
    background: rgba(249, 115, 22, 0.15);
    color: #fb923c;
    border: 1px solid rgba(249, 115, 22, 0.3);
}

.schedule-badge-unpaid {
    background: rgba(239, 68, 68, 0.15);
    color: var(--expense-color);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.schedule-badge-override {
    background: rgba(251, 191, 36, 0.12);
    color: #fcd34d;
    border: 1px solid rgba(251, 191, 36, 0.3);
}

.schedule-badge-start {
    background: rgba(91, 127, 255, 0.15);
    color: #a5b8ff;
    border: 1px solid rgba(91, 127, 255, 0.3);
}

/* Schedule header row */
.schedule-header {
    display: flex;
    padding: 0.5rem 1rem;
    border-bottom: 2px solid var(--border-color);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    gap: 1rem;
}

/* Progress track & fill for timeline */
.progress-track {
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), var(--success-color));
    border-radius: 3px;
}

.timeline-item {
    background: rgba(7, 6, 26, 0.55);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
}

.timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.timeline-name {
    font-weight: 600;
    color: var(--text-primary);
}

.timeline-date {
    font-size: 0.85rem;
    color: var(--accent-color);
    font-weight: 500;
}

/* ===== Toggle Switch ===== */
.promo-toggle-group {
    margin-top: 0.25rem;
}

.toggle-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-weight: 500;
    gap: 1rem;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    inset: 0;
    background-color: rgba(51, 65, 85, 0.8);
    border-radius: 26px;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
}

.toggle-slider::before {
    content: "";
    position: absolute;
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: #94a3b8;
    border-radius: 50%;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
}

.toggle-switch input:checked + .toggle-slider {
    background-color: rgba(168, 85, 247, 0.4);
    box-shadow: 0 0 12px rgba(168, 85, 247, 0.25);
}

.toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(22px);
    background-color: var(--promo-color);
}

/* ===== Promo Expiry Field ===== */
.promo-expiry-group {
    animation: fadeIn 0.3s ease;
}

/* ===== Promo Badge ===== */
.promo-badge {
    background: rgba(168, 85, 247, 0.15);
    color: var(--promo-light);
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid rgba(168, 85, 247, 0.3);
    white-space: nowrap;
}

.debt-type-badge {
    background: rgba(96, 165, 250, 0.18);
    color: #93c5fd;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid rgba(96, 165, 250, 0.3);
    margin-left: 0.5rem;
    white-space: nowrap;
}

.card-badge {
    background: rgba(99, 102, 241, 0.18);
    color: #c7d2fe;
    border-color: rgba(99, 102, 241, 0.45);
}

.direct-badge {
    background: rgba(20, 184, 166, 0.18);
    color: #99f6e4;
    border-color: rgba(20, 184, 166, 0.45);
}

/* ===== Amount Type Badges ===== */
.amount-type-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-left: 0.4rem;
    white-space: nowrap;
    display: inline-block;
}

.fixed-badge {
    background: rgba(148, 163, 184, 0.15);
    color: #cbd5e1;
    border: 1px solid rgba(148, 163, 184, 0.3);
}

.flexible-badge {
    background: rgba(251, 191, 36, 0.15);
    color: #fcd34d;
    border: 1px solid rgba(251, 191, 36, 0.35);
}

/* ===== Promo Section ===== */
.promo-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.85rem;
    border-radius: 0.4rem;
    background: rgba(168, 85, 247, 0.12);
    border-left: 3px solid var(--promo-color);
    color: var(--promo-light);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.85rem;
}

.promo-section-grid {
    margin-bottom: 1.5rem;
}

.regular-section-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.85rem;
    border-radius: 0.4rem;
    background: rgba(99, 102, 241, 0.08);
    border-left: 3px solid rgba(99, 102, 241, 0.5);
    color: var(--text-secondary);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.85rem;
}

/* ===== Promo Card Accent ===== */
.promo-card {
    border-left: 4px solid var(--promo-color) !important;
    background: linear-gradient(135deg, rgba(168,85,247,0.06) 0%, var(--card-bg) 60%) !important;
}

.promo-card:hover {
    border-color: var(--promo-color) !important;
    box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.2) !important;
}

.promo-auto-note {
    font-size: 0.7rem;
    color: var(--promo-light);
    font-style: italic;
    margin-left: 0.25rem;
}

.promo-expiry-value {
    color: var(--promo-light) !important;
    font-weight: 600;
}

/* Disabled-looking rate field when promo is on */
.input-disabled {
    opacity: 0.4;
    pointer-events: none;
}

/* ===== Inline Confirm ===== */
.confirm-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
    white-space: nowrap;
    align-self: center;
}

.btn-confirm-yes,
.btn-confirm-no {
    padding: 0.4rem 0.85rem !important;
    font-size: 0.8rem !important;
}

/* ===== Undo Toast ===== */
.undo-toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(120%);
    background: #0f0d2a;
    border: 1px solid var(--border-bright);
    border-radius: 10px;
    padding: 0.875rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    z-index: 999;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    opacity: 0;
    white-space: nowrap;
    min-width: 240px;
}

.undo-toast-visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}

.undo-toast-error {
    border-color: rgba(239, 68, 68, 0.4);
    background: #130d1e;
}

.undo-toast-msg {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 500;
    flex: 1;
}

.undo-toast-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.35rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease;
    flex-shrink: 0;
}

.undo-toast-btn:hover {
    background: var(--accent-hover);
}

/* ===== Modal backdrop cursor ===== */
.modal {
    cursor: pointer;
}

.modal-content {
    cursor: default;
}

/* ===== Strategy Toggle ===== */
.viz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.strategy-toggle {
    display: flex;
    background: rgba(7,6,26,0.7);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 3px;
    gap: 3px;
}

.strategy-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.4rem 1rem;
    border-radius: 7px;
    cursor: pointer;
    transition: var(--transition);
    font-family: inherit;
    white-space: nowrap;
}

.strategy-btn:hover {
    color: var(--text-primary);
    background: rgba(255,255,255,0.05);
}

.strategy-btn.active {
    background: var(--accent-color);
    color: white;
    box-shadow: 0 2px 8px rgba(91,127,255,0.45);
}

.strategy-desc-text {
    margin-bottom: 1.5rem !important;
    font-style: italic;
}

/* ===== Savings Stat ===== */
.stat-savings-value {
    font-size: 1.25rem !important;
}

/* ===== Debt Order Badge ===== */
.debt-order-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--accent-color);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(91,127,255,0.45);
    cursor: help;
    flex-shrink: 0;
}

/* ===== Snowball/Avalanche Target Banner ===== */
.snowball-target-banner {
    background: linear-gradient(135deg, rgba(91,127,255,0.22), rgba(52,201,122,0.12));
    border: 1.5px solid rgba(91,127,255,0.55);
    border-radius: 8px;
    padding: 0.5rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: #c4d0ff;
    margin-bottom: 0.85rem;
    letter-spacing: 0.01em;
    box-shadow: 0 0 12px rgba(91,127,255,0.18), inset 0 0 12px rgba(91,127,255,0.06);
    text-shadow: 0 0 10px rgba(91,127,255,0.5);
}

/* ===== Target card highlight ===== */
.snowball-target-card {
    border-color: rgba(91,127,255,0.45) !important;
    box-shadow: 0 0 0 1px rgba(91,127,255,0.2), 0 4px 24px rgba(91,127,255,0.12) !important;
}

/* ===== Payoff Months Row ===== */
.payoff-months-row {
    margin-top: 0.25rem;
}

.payoff-months-value {
    color: var(--success-color) !important;
    font-weight: 700 !important;
}

/* ===== Auto-Pay Badge ===== */
.autopay-badge {
    background: rgba(245,158,11,0.12);
    color: #fbbf24;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid rgba(245,158,11,0.3);
    white-space: nowrap;
}

/* ===== Auto-Pay Schedule Badge ===== */
.schedule-badge-autopay {
    background: rgba(245,158,11,0.12);
    color: #fbbf24;
    border: 1px solid rgba(245,158,11,0.25);
}

.schedule-badge-paid {
    background: rgba(16,185,129,0.15);
    color: #34d399;
    border: 1px solid rgba(16,185,129,0.3);
}

.schedule-badge-paid-auto {
    background: rgba(245,158,11,0.15);
    color: #fbbf24;
    border: 1px solid rgba(245,158,11,0.3);
}

/* ===== Paid Status Overlay ===== */
.paid-overlay {
    position: absolute;
    top: 0.75rem;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    background: rgba(16,185,129,0.1);
    border-bottom: 1px solid rgba(16,185,129,0.2);
    padding: 0.3rem 0.75rem;
    pointer-events: none;
    z-index: 1;
}

.autopay-overlay {
    background: rgba(245,158,11,0.1);
    border-bottom-color: rgba(245,158,11,0.2);
}

.paid-overlay-icon {
    font-size: 0.85rem;
}

.paid-overlay-text {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--success-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.autopay-overlay .paid-overlay-text {
    color: #fbbf24;
}

/* ===== Card Paid State ===== */
.card-paid {
    opacity: 0.8;
    border-color: rgba(16,185,129,0.35) !important;
    padding-top: 2.75rem !important;
}

.cost-card.card-paid {
    border-left-color: var(--success-color) !important;
}

/* ===== Paid Action Row ===== */
.paid-action-row {
    margin-bottom: 0.75rem;
}

.paid-action-row .btn {
    width: 100%;
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
}

.btn-mark-paid-action {
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.3);
    color: var(--success-color);
    font-weight: 600;
    transition: background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.btn-mark-paid-action:hover {
    background: rgba(16,185,129,0.2);
    border-color: var(--success-color);
    box-shadow: 0 0 0 3px rgba(52,201,122,0.12);
}

.btn-mark-paid-action:active {
    transform: scale(0.97);
    animation: paidPulse 0.4s ease;
}

.btn-autopay-confirm {
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.3);
    color: #fbbf24;
    font-weight: 600;
}

.btn-autopay-confirm:hover {
    background: rgba(245,158,11,0.2);
    border-color: var(--warning-color);
}

.btn-paid-undo {
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.3);
    color: var(--success-color);
    font-weight: 600;
    font-size: 0.75rem !important;
}

.btn-paid-undo:hover {
    background: rgba(239,68,68,0.1);
    border-color: var(--danger-color);
    color: var(--danger-color);
}

/* ===== Schedule Row Paid State ===== */
.schedule-row-paid {
    opacity: 0.6;
    background: rgba(16,185,129,0.03) !important;
}

.schedule-today-marker {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.5rem 0;
    pointer-events: none;
}
.schedule-today-marker::before,
.schedule-today-marker::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-color));
}
.schedule-today-marker::after {
    background: linear-gradient(90deg, var(--accent-color), transparent);
}
.schedule-today-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent-color);
    white-space: nowrap;
    padding: 0.15rem 0.5rem;
    border: 1px solid rgba(99,102,241,0.35);
    border-radius: 999px;
    background: rgba(99,102,241,0.08);
}

.schedule-action-col {
    flex-shrink: 0;
    min-width: 100px;
    display: flex;
    justify-content: flex-end;
}

.btn-mark-paid {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem; /* Tightened padding */
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07);
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
    white-space: nowrap;
}

.btn-mark-paid:hover {
    background: rgba(16,185,129,0.15);
    border-color: var(--success-color);
    color: var(--success-color);
}

.btn-mark-paid-done {
    background: rgba(16,185,129,0.18);
    border-color: var(--success-color);
    color: var(--success-color);
}

.btn-mark-paid-done:hover {
    background: rgba(239,68,68,0.15);
    border-color: var(--expense-color);
    color: var(--expense-color);
}

/* ===== Green Toggle Slider ===== */
.toggle-slider-green.toggle-slider {
    background-color: rgba(51, 65, 85, 0.8);
}

.toggle-switch input:checked + .toggle-slider-green {
    background-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
}

.toggle-switch input:checked + .toggle-slider-green::before {
    transform: translateX(22px);
    background-color: var(--success-color);
}

/* ===== Inline Confirm ===== */
.confirm-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
    white-space: nowrap;
    align-self: center;
}

.btn-confirm-yes,
.btn-confirm-no {
    padding: 0.4rem 0.85rem !important;
    font-size: 0.8rem !important;
}

/* ===== Undo Toast ===== */
.undo-toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(120%);
    background: #0f0d2a;
    border: 1px solid var(--border-bright);
    border-radius: 10px;
    padding: 0.875rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    z-index: 999;
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease;
    opacity: 0;
    white-space: nowrap;
    min-width: 240px;
}

.undo-toast-visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}

.undo-toast-error {
    border-color: rgba(244, 88, 122, 0.5);
    background: #1a0d18;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(244,88,122,0.15);
}

.undo-toast-error .undo-toast-msg {
    color: #fca5bc;
}

.undo-toast-error::before {
    content: '⚠';
    font-size: 1rem;
    flex-shrink: 0;
}

.undo-toast-success {
    border-color: rgba(52, 201, 122, 0.45);
    background: #081a12;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(52,201,122,0.12);
}

.undo-toast-success .undo-toast-msg {
    color: var(--success-color);
}

.undo-toast-success::before {
    content: '✓';
    font-size: 1rem;
    font-weight: 700;
    color: var(--success-color);
    flex-shrink: 0;
}

.undo-toast-msg {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 500;
    flex: 1;
}

.undo-toast-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.35rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease;
    flex-shrink: 0;
}

.undo-toast-btn:hover { background: var(--accent-hover); }

/* ===== Modal backdrop cursor ===== */
.modal         { cursor: pointer; }
.modal-content { cursor: default; }

/* ===== Countdown Stat Box ===== */
.stat-box-countdown {
    background: linear-gradient(135deg, rgba(91,127,255,0.12), rgba(52,201,122,0.07)) !important;
    border-color: rgba(91,127,255,0.35) !important;
}

.stat-countdown-value {
    font-size: 2.25rem !important;
    font-weight: 800 !important;
    background: linear-gradient(135deg, #a5b8ff, #34c97a);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
}

.stat-countdown-date {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
    font-weight: 500;
}

/* ===== Windfall Bar ===== */
.windfall-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(16,185,129,0.06);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 8px;
    padding: 0.75rem 1.25rem;
    margin-bottom: 1.5rem;
    gap: 1rem;
}

.windfall-bar-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.btn-windfall {
    background: linear-gradient(135deg, rgba(52,201,122,0.15), rgba(91,127,255,0.15));
    border: 1px solid rgba(52,201,122,0.4);
    color: var(--success-color);
    font-weight: 600;
    font-size: 0.85rem;
    white-space: nowrap;
}

.btn-windfall:hover {
    background: linear-gradient(135deg, rgba(52,201,122,0.25), rgba(91,127,255,0.25));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(52,201,122,0.2);
}

/* ===== Windfall Modal ===== */
.windfall-comparison {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.windfall-col {
    flex: 1;
    background: rgba(7,6,26,0.6);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
}

.windfall-col-after {
    border-color: rgba(16,185,129,0.35);
    background: rgba(16,185,129,0.05);
}

.windfall-col-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
}

.windfall-col-after .windfall-col-title {
    color: var(--success-color);
}

.windfall-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
    margin-bottom: 0.4rem;
    color: var(--text-secondary);
}

.windfall-stat strong {
    color: var(--text-primary);
    font-weight: 700;
}

.windfall-col-after .windfall-stat strong {
    color: var(--success-color);
}

.windfall-arrow {
    font-size: 1.5rem;
    color: var(--success-color);
    flex-shrink: 0;
}

.windfall-savings-banner {
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 8px;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    line-height: 1.5;
}

.windfall-savings-positive {
    background: rgba(16,185,129,0.08);
    border-color: rgba(16,185,129,0.25);
    color: var(--success-color);
}

.windfall-savings-positive strong {
    color: var(--success-color);
}

.windfall-allocation {
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
}

.windfall-alloc-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
}

.windfall-alloc-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.4rem 0.75rem;
    align-items: center;
    margin-bottom: 0.6rem;
}

.windfall-alloc-bar {
    grid-column: 1 / -1;
    height: 4px;
    background: var(--border-color);
    border-radius: 2px;
    overflow: hidden;
}

.windfall-alloc-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), var(--success-color));
    border-radius: 2px;
    transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}

.windfall-alloc-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
}

.windfall-alloc-amount {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--success-color);
}

/* ===== Pay Now URL Button ===== */
.debt-pay-url-row {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    justify-content: flex-end !important;
}

.btn-pay-now {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.875rem;
    background: rgba(91,127,255,0.1);
    border: 1px solid rgba(91,127,255,0.3);
    border-radius: 6px;
    color: var(--accent-color);
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
    transition: var(--transition);
}

.btn-pay-now:hover {
    background: rgba(91,127,255,0.2);
    border-color: var(--accent-color);
    transform: translateX(2px);
}

/* ===== Auto Min-Payment UI ===== */
.min-payment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0;
}

.min-payment-header label {
    margin-bottom: 0 !important;
}

.btn-auto-min {
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.3);
    color: #fbbf24;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: var(--transition);
    white-space: nowrap;
}

.btn-auto-min:hover {
    background: rgba(245,158,11,0.2);
    border-color: var(--warning-color);
}

.auto-min-hint {
    font-size: 0.72rem;
    color: var(--text-secondary);
    margin-top: 0.35rem;
    font-style: italic;
}

/* ===== URL Input label ===== */
.label-optional {
    font-size: 0.72rem;
    color: var(--text-secondary);
    font-weight: 400;
}

/* ===== Tab Navigation ===== */
.tab-nav {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1rem;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 0.375rem;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.tab-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
}

.tab-btn.active {
    background: var(--accent-color);
    color: white;
    box-shadow: 0 2px 12px rgba(91, 127, 255, 0.45);
}

/* ===== Tab Panels ===== */
.tab-panel {
    display: none !important;
}

.tab-panel.active {
    display: flex !important;
    flex-direction: column;
    gap: 1.5rem;
    animation: fadeIn 0.3s ease;
}

/* ===== Month Header ===== */
.month-header {
    text-align: center;
    margin-bottom: 0.75rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, rgba(91,127,255,0.1) 0%, rgba(168,85,247,0.08) 50%, rgba(91,127,255,0.1) 100%);
    border-radius: 12px;
    border: 1px solid rgba(91,127,255,0.2);
    position: relative;
    overflow: hidden;
    box-shadow: 
        0 6px 20px rgba(0,0,0,0.35),
        0 0 32px rgba(91,127,255,0.06) inset,
        0 0 0 1px rgba(255,255,255,0.03);
}
.month-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(91,127,255,0.6), rgba(168,85,247,0.6), rgba(91,127,255,0.6), transparent);
    box-shadow: 0 0 12px rgba(91,127,255,0.4);
}
.month-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(91,127,255,0.6), rgba(168,85,247,0.6), rgba(91,127,255,0.6), transparent);
    box-shadow: 0 0 12px rgba(91,127,255,0.4);
}
.month-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(110deg, #a5b8ff 0%, #c084fc 50%, #a5b8ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    text-transform: uppercase;
    line-height: 1.2;
}
.month-header .subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

/* ===== Debt Modal Layout Update ===== */
#debt-modal .modal-content {
    max-width: 700px;
}

#debt-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1.5rem;
    align-items: start;
}

#debt-form .modal-actions {
    grid-column: 1 / -1;
    margin-top: 1rem;
}

#promo-expiry-group {
    grid-column: 1 / -1;
}

/* ===== Inline Actions ===== */
.btn-edit-inline {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.2rem 0.6rem; /* Tightened padding */
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-edit-inline:hover {
    background: rgba(255,255,255,0.15);
    color: var(--text-primary);
    border-color: rgba(255,255,255,0.25);
}

.btn-text-action {
    background: transparent;
    border: none;
    color: var(--accent-color);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: underline;
    padding: 0 0.25rem;
    transition: color 0.2s;
    font-family: inherit;
}

.btn-text-action:hover {
    color: var(--accent-hover);
}

/* ===== Schedule Row — Mobile Overrides =====
   Must live AFTER the base schedule CSS above so these win the cascade. */
@media (max-width: 640px) {
    .schedule-row {
        flex-wrap: nowrap;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
    }

    /* Left: icon + day stacked, fixed narrow width */
    .schedule-date-col {
        width: auto;
        min-width: 0;
        max-width: 40px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.15rem;
        flex-shrink: 0;
    }

    .schedule-icon {
        font-size: 1.35rem;
        line-height: 1;
    }

    .schedule-day {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    /* Middle: stretches to fill all remaining space */
    .schedule-info-col {
        flex: 1;
        min-width: 0;
    }

    .schedule-name {
        font-size: 0.9rem;
    }

    .schedule-detail {
        font-size: 0.75rem;
    }

    /* Right: amount stacked above balance, flush right */
    .schedule-right-col {
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
        flex-shrink: 0;
    }

    .schedule-amount-col {
        min-width: 0;
        font-size: 0.875rem;
        align-items: flex-end;
    }

    .schedule-balance-col {
        font-size: 0.72rem;
        font-weight: 400;
        min-width: 0;
        padding: 0.15rem 0.3rem;
        background: transparent;
        align-items: flex-end;
    }

    .schedule-balance-col .col-label {
        display: none;
    }

    /* Action buttons: compact, never wrap */
    .schedule-action-col {
        min-width: 0;
        flex-shrink: 0;
    }

    .btn-mark-paid {
        font-size: 0.7rem;
        padding: 0.25rem 0.45rem;
        min-height: 28px;
        white-space: nowrap;
    }

    .btn-edit-inline {
        font-size: 0.7rem;
        padding: 0.18rem 0.4rem;
    }
}`;

const PANEL_HTML = `<div class="app-container">
        <header class="header">
            <div style="display:flex;flex-direction:column;align-items:flex-start;">
                <h1>Debt Snowball Tracker</h1>
                <span class="version-badge" title="v${PANEL_VERSION} (${PANEL_BUILD_DATE})" style="font-size:0.65rem;color:var(--text-secondary);opacity:0.6;margin-top:0.25rem;">v${PANEL_VERSION}</span>
            </div>
            <div class="header-actions">
                <button id="history-btn" class="btn btn-secondary" style="background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.4); color: #c084fc;">📅 History</button>
                <label for="import-file" class="btn btn-secondary" style="background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.4); color: #60a5fa;">
                    Import Data
                    <input type="file" id="import-file" accept=".json" style="display: none;">
                </label>
                <button id="export-btn" class="btn btn-secondary" style="background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.4); color: #4ade80;">Export Data</button>
            </div>
        </header>

        <div class="month-nav">
            <button id="plan-prev-month-btn" class="btn btn-secondary btn-sm" style="visibility:hidden;">← Previous</button>
            <div class="month-title" id="global-month-title"></div>
            <button id="plan-next-month-btn" class="btn btn-primary btn-sm" style="visibility:hidden;">Current Month →</button>
        </div>

        <nav class="tab-nav">
            <button class="tab-btn active" data-tab="payment-plan"><span class="tab-icon">&#128197;</span><span class="tab-label"> Plan</span></button>
            <button class="tab-btn" data-tab="income"><span class="tab-icon">&#128176;</span><span class="tab-label"> Budget</span></button>
            <button class="tab-btn" data-tab="debts"><span class="tab-icon">&#128179;</span><span class="tab-label"> Debts</span></button>
            <button class="tab-btn" data-tab="timeline"><span class="tab-icon">&#128202;</span><span class="tab-label"> Timeline</span></button>
        </nav>

        <main class="main-content">

            <div class="tab-panel active" id="tab-payment-plan">

                <section id="balance-checkpoints-card" class="card" style="margin-bottom: 1.5rem;">
                    <div style="margin-bottom: 1rem;">
                        <h2 style="margin-bottom: 0.25rem;">💰 Cash Position</h2>
                        <p class="subtitle" style="margin-bottom:0; font-size: 0.85rem;">Track your bank balance throughout the month. Add your Day 1 balance as a checkpoint on day 1.</p>
                    </div>

                    <!-- Existing Checkpoints List -->
                    <div id="checkpoints-list" style="margin-bottom: 1rem;"></div>

                    <!-- Add New Checkpoint -->
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span style="font-size: 0.875rem; color: var(--text-secondary);">Add checkpoint on day</span>
                        <select id="new-checkpoint-day" style="width: 65px; padding: 0.4rem; font-size: 0.875rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                            ${Array.from({length: 31}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                        </select>
                        <span style="font-size: 0.875rem; color: var(--text-secondary);">for</span>
                        <input type="number" id="new-checkpoint-amount" min="0" step="0.01" placeholder="Amount"
                            style="width: 100px; padding: 0.4rem; font-size: 0.875rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                        <button id="add-checkpoint-btn" class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; white-space: nowrap;">+ Add</button>
                    </div>
                </section>

                <section id="payment-plan-section" class="card" style="display: none; margin-bottom: 1.5rem;">
                    <!-- Month Overview Dashboard (at top) -->
                    <div style="margin-bottom: 1.25rem; padding: 1rem; background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%); border-radius: 12px; border: 1px solid rgba(99,102,241,0.2);">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem; font-weight: 600;">📊 Month Overview</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr) auto; gap: 1rem;">
                            <!-- Start Balance -->
                            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">Day 1 Start</span>
                                <span id="month-overview-start" style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary);">-</span>
                            </div>
                            <!-- Income -->
                            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">+ Income</span>
                                <span id="month-overview-income" style="font-size: 1.1rem; font-weight: 600; color: var(--success-color);">-</span>
                            </div>
                            <!-- Expenditures -->
                            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">− Expenses</span>
                                <span id="month-overview-expenses" style="font-size: 1.1rem; font-weight: 600; color: var(--expense-color);">-</span>
                            </div>
                        </div>

                        <!-- Spending Budgets Summary (only shows if budgets exist) -->
                        <div id="month-overview-budgets" style="display: none; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(99,102,241,0.15);">
                            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.5rem;">💳 Spending Budgets (Card Charges)</div>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;" id="month-overview-budgets-grid">
                            </div>
                        </div>

                        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(99,102,241,0.15); display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <!-- Next Month Start -->
                            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">= Next Month Start</span>
                                <span id="month-overview-next-start" style="font-size: 1.2rem; font-weight: 700; color: var(--primary-light);">-</span>
                            </div>
                            <!-- Buffer -->
                            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">🛡️ Buffer (before 1st paycheck)</span>
                                <span id="month-overview-buffer" style="font-size: 1.2rem; font-weight: 700; color: var(--success-color);">-</span>
                            </div>
                        </div>
                    </div>

                    <!-- Runway Dashboard -->
                    <div style="margin-bottom: 1rem;">
                        <div class="forecast-bar" id="runway-dashboard" style="padding: 0.75rem; background: rgba(7,6,26,0.4); border-radius: 8px;">
                            <div class="forecast-item">
                                <span class="forecast-label">Next Paycheck:</span>
                                <span id="runway-next-paycheck" class="forecast-value">-</span>
                            </div>
                            <div class="forecast-item">
                                <span class="forecast-label">Lowest Balance:</span>
                                <span id="runway-min-project" class="forecast-value">$0.00</span>
                            </div>
                            <div class="forecast-item">
                                <span class="forecast-label">Status:</span>
                                <span id="runway-status" class="forecast-value">Safe</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Schedule List -->
                    <div id="payment-plan-list" class="payment-schedule">
                        </div>
                    </section>
            </div>

            <div class="tab-panel" id="tab-income">
                <section class="spending-budgets-section">
                    <div class="section-header">
                        <div>
                            <h2>Spending Budgets</h2>
                            <p class="subtitle" style="margin-bottom:0;">Track discretionary spending with category limits. Expenses clear at month end.</p>
                        </div>
                        <button id="add-budget-btn" class="btn btn-primary">+ Add Budget</button>
                    </div>
                    <div id="budgets-list" style="margin-top: 0.25rem;"></div>
                </section>

                <section class="income-section">
                    <div class="section-header">
                        <div>
                            <h2>Income</h2>
                            <p class="subtitle" style="margin-bottom:0;">Add each paycheck, deposit, or other income for this month with its expected date.</p>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                            <button id="advance-month-btn" class="btn btn-secondary" title="Archive this month and start fresh for next month early">⏭ Next Month</button>
                            <button id="add-income-btn" class="btn btn-success">+ Add Income</button>
                        </div>
                    </div>
                    <div id="income-list" class="debts-list">
                        </div>
                    <div id="income-summary" class="income-summary" style="display:none;"></div>
                </section>

                <section class="recurring-section">
                    <div class="section-header">
                        <div>
                            <h2>Bills & Expenses</h2>
                            <p class="subtitle" style="margin-bottom:0;">
                                <strong>Recurring</strong> = Every month · 
                                <strong>Quarterly</strong> = Every 3 months · 
                                <strong>Annual</strong> = Once per year · 
                                <strong style="color:var(--danger-color);">One-Time</strong> = This month only (deleted next month)
                            </p>
                        </div>
                        <button id="add-cost-btn" class="btn btn-warning">+ Add Bill/Expense</button>
                    </div>
                    <div id="recurring-summary" class="recurring-due-summary"></div>
                    <div id="costs-list" class="debts-list">
                        </div>
                    <div id="recurring-cost-summary" class="recurring-cost-summary" style="display:none"></div>
                </section>
            </div>

            <div class="tab-panel" id="tab-debts">
                <section class="debts-section">
                    <div class="section-header">
                        <div>
                            <h2>Your Debts</h2>
                            <p id="debts-summary" class="subtitle" style="margin-top:0.35rem; color: var(--text-secondary); font-size: 0.95rem;"></p>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                            <button id="mortgage-toggle-btn" class="btn btn-secondary" style="display:none;">Show Mortgage</button>
                            <button id="add-debt-btn" class="btn btn-primary">+ Add Debt</button>
                        </div>
                    </div>
                    <div id="debts-list" class="debts-list">
                        </div>
                    <div id="debt-payments-summary" class="debt-payments-summary" style="display:none;"></div>
                </section>
            </div>

            <div class="tab-panel" id="tab-timeline">
                <section class="visualization-section card">
                    <div class="viz-header">
                        <h2>Payoff Timeline</h2>
                        <div class="strategy-toggle" id="strategy-toggle">
                            <button class="strategy-btn active" data-strategy="snowball" title="Pay smallest balance first — quick wins keep you motivated">
                                &#10052;&#65039; Snowball
                            </button>
                            <button class="strategy-btn" data-strategy="avalanche" title="Pay highest interest first — saves the most money">
                                &#127754; Avalanche
                            </button>
                        </div>
                    </div>
                    <p id="strategy-desc" class="subtitle strategy-desc-text"></p>
                    <div class="summary-stats">
                        <div class="stat-box">
                            <span class="stat-label">Total Debt</span>
                            <span id="stat-total-debt" class="stat-value">$0.00</span>
                        </div>
                        <div class="stat-box stat-box-countdown" id="stat-countdown-box" style="display:none;">
                            <span class="stat-label">Days Until Debt-Free</span>
                            <span id="stat-countdown" class="stat-value stat-countdown-value">-</span>
                            <span id="stat-payoff-date" class="stat-countdown-date">-</span>
                        </div>
                        <div class="stat-box" id="stat-payoff-box" style="display:none;">
                            <span class="stat-label">Estimated Debt-Free Date</span>
                            <span id="stat-payoff-date-alt" class="stat-value">-</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Total Interest Paid</span>
                            <span id="stat-total-interest" class="stat-value">$0.00</span>
                        </div>
                        <div class="stat-box" id="stat-savings-box" style="display:none;">
                            <span class="stat-label" id="stat-savings-label">vs. Other Strategy</span>
                            <span id="stat-savings" class="stat-value stat-savings-value">-</span>
                        </div>
                    </div>
                    <div id="windfall-bar" style="display:none;" class="windfall-bar">
                        <span class="windfall-bar-label">&#128176; Got a windfall?</span>
                        <button id="windfall-btn" class="btn btn-windfall">Run Lump Sum Planner</button>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="paydown-chart" aria-label="Paydown chart" role="img"></canvas>
                    </div>
                    <div id="timeline-chart" class="timeline-container">
                        </div>
                </section>
            </div>

        </main>
    </div>

    <div id="debt-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Add New Debt</h3>
                <button class="close-modal close-debt-modal">&times;</button>
            </div>
            <form id="debt-form">
                <input type="hidden" id="debt-id">
                <div class="input-group">
                    <label for="debt-name">Name / Creditor</label>
                    <input type="text" id="debt-name" required placeholder="e.g. Chase Credit Card">
                </div>
                <div class="input-group">
                    <label for="debt-url">Payment URL <span class="label-optional">(optional)</span></label>
                    <input type="url" id="debt-url" placeholder="e.g. https://chase.com/login">
                </div>
                <div class="input-group">
                    <label for="debt-balance">Current Balance ($)</label>
                    <input type="number" id="debt-balance" min="0" step="0.01" required>
                </div>
                <div class="input-group">
                    <label for="debt-type">Debt Type</label>
                    <select id="debt-type" required>
                        <option value="credit-card">Credit Card</option>
                        <option value="personal-loan">Personal Loan</option>
                        <option value="student-loan">Student Loan</option>
                        <option value="auto-loan">Auto Loan</option>
                        <option value="mortgage">Mortgage</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="debt-rate">Interest Rate (APR %)</label>
                    <input type="number" id="debt-rate" min="0" step="0.01" required>
                </div>
                <div class="input-group">
                    <div class="min-payment-header">
                        <label for="debt-min-payment">Minimum Monthly Payment ($)</label>
                        <button type="button" id="auto-min-btn" class="btn-auto-min" title="Auto-calculate based on balance and rate">⚡ Auto-calc</button>
                    </div>
                    <input type="number" id="debt-min-payment" min="0" step="0.01" required>
                    <span id="auto-min-hint" class="auto-min-hint" style="display:none;"></span>
                </div>
                <div class="input-group">
                    <label for="debt-due-day">Due Day of Month (1–31)</label>
                    <input type="number" id="debt-due-day" min="1" max="31" step="1" required placeholder="e.g. 15">
                </div>
                <div class="input-group promo-toggle-group">
                    <label class="toggle-label" for="debt-autopay-toggle">
                        <span>Auto-Pay Enabled?</span>
                        <span class="toggle-switch">
                            <input type="checkbox" id="debt-autopay-toggle">
                            <span class="toggle-slider toggle-slider-green"></span>
                        </span>
                    </label>
                </div>
                <div class="input-group promo-toggle-group">
                    <label class="toggle-label" for="debt-promo-toggle">
                        <span>Promotional 0% Interest?</span>
                        <span class="toggle-switch">
                            <input type="checkbox" id="debt-promo-toggle">
                            <span class="toggle-slider"></span>
                        </span>
                    </label>
                </div>
                <div class="input-group promo-expiry-group" id="promo-expiry-group" style="display: none;">
                    <label for="debt-promo-expiry">Promo Expiration Date</label>
                    <input type="date" id="debt-promo-expiry">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-debt-modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Debt</button>
                </div>
            </form>
        </div>
    </div>

    <div id="cost-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="cost-modal-title">Add Recurring Cost</h3>
                <button class="close-modal close-cost-modal">&times;</button>
            </div>
            <form id="cost-form">
                <input type="hidden" id="cost-id">
                <div class="input-group">
                    <label for="cost-category">Bill Category</label>
                    <select id="cost-category">
                        <option value="utility">⚡ Utility (Electric, Water, Gas, Internet)</option>
                        <option value="subscription">📱 Subscription (Streaming, Services)</option>
                        <option value="other">📦 Other Recurring Bill</option>
                        <option value="one-time">🔴 ONE-TIME ONLY — This Month Only (No Repeat)</option>
                    </select>
                    <p class="subtitle" id="category-hint" style="margin-top:0.3rem; margin-bottom:0; font-size:0.8rem; color: var(--text-secondary);">Choose 'ONE-TIME' for expenses that happen just once this month.</p>
                </div>
                <div class="input-group">
                    <label for="cost-name">Name</label>
                    <input type="text" id="cost-name" required placeholder="e.g. Electric Bill">
                </div>
                <div class="input-group" id="cost-interval-group">
                    <label for="cost-interval">How Often Does This Bill Repeat?</label>
                    <select id="cost-interval">
                        <option value="1">📅 Every Month (Monthly)</option>
                        <option value="2">📅 Every 2 Months</option>
                        <option value="3">📅 Quarterly (Every 3 Months)</option>
                        <option value="6">📅 Semi-Annual (Every 6 Months)</option>
                        <option value="12">📅 Annual (Once Per Year)</option>
                        <option value="custom">⚙️ Custom Interval...</option>
                    </select>
                </div>
                <div class="input-group" id="cost-interval-custom-group" style="display:none;">
                    <label for="cost-interval-custom">Every X Months</label>
                    <input type="number" id="cost-interval-custom" min="2" max="60" step="1" placeholder="e.g. 4">
                </div>
                <div class="input-group" id="cost-start-month-group" style="display:none;">
                    <label for="cost-start-month">Next Due Month</label>
                    <input type="month" id="cost-start-month">
                    <p class="subtitle" style="margin-top:0.3rem; margin-bottom:0; font-size:0.8rem;">The month this cost should first (or next) appear. Leave blank to start this month.</p>
                </div>
                <div class="input-group">
                    <label for="cost-amount">Amount ($)</label>
                    <input type="number" id="cost-amount" min="0" step="0.01" required placeholder="e.g. 120">
                </div>
                <div class="input-group">
                    <label for="cost-amount-type">Amount Type</label>
                    <select id="cost-amount-type" required>
                        <option value="fixed">Fixed</option>
                        <option value="flexible">Flexible — varies each occurrence</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="cost-due-day">Due Day of Month (1–31)</label>
                    <input type="number" id="cost-due-day" min="1" max="31" step="1" required placeholder="e.g. 1">
                </div>
                <div class="input-group">
                    <label for="cost-payment-method">Payment Method</label>
                    <select id="cost-payment-method" required>
                        <option value="direct">Direct (bank transfer / cash)</option>
                        <option value="card">Card (credit/debit, not in immediate cash budget)</option>
                    </select>
                </div>
                <div class="input-group promo-toggle-group">
                    <label class="toggle-label" for="cost-autopay-toggle">
                        <span>Auto-Pay Enabled?</span>
                        <span class="toggle-switch">
                            <input type="checkbox" id="cost-autopay-toggle">
                            <span class="toggle-slider toggle-slider-green"></span>
                        </span>
                    </label>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-cost-modal">Cancel</button>
                    <button type="submit" class="btn btn-warning">Save Cost</button>
                </div>
            </form>
        </div>
    </div>

    <div id="income-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="income-modal-title">Add Income Entry</h3>
                <button class="close-modal close-income-modal">&times;</button>
            </div>
            <form id="income-form">
                <input type="hidden" id="income-id">
                <div class="input-group">
                    <label for="income-label">Label</label>
                    <input type="text" id="income-label" required placeholder="e.g. Paycheck, Tax Refund">
                </div>
                <div class="input-group">
                    <label for="income-date">Date Expected</label>
                    <input type="date" id="income-date" required>
                </div>
                <div class="input-group">
                    <label for="income-amount">Amount ($)</label>
                    <input type="number" id="income-amount" min="0" step="0.01" required placeholder="e.g. 6000">
                </div>
                <div class="input-group">
                    <label for="income-schedule">Recurrence</label>
                    <select id="income-schedule">
                        <option value="one-time">One-time (this month only)</option>
                        <option value="monthly">Monthly (same day each month)</option>
                        <option value="biweekly">Every 2 weeks</option>
                    </select>
                    <p class="subtitle" id="income-schedule-hint" style="font-size:0.8rem; margin-top:0.3rem; display:none;"></p>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-income-modal">Cancel</button>
                    <button type="submit" class="btn btn-success">Save Income</button>
                </div>
            </form>
        </div>
    </div>

    <div id="budget-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="budget-modal-title">Add Budget</h3>
                <button class="close-modal close-budget-modal">&times;</button>
            </div>
            <form id="budget-form">
                <input type="hidden" id="budget-id">
                <div class="input-group">
                    <label for="budget-name">Category Name</label>
                    <input type="text" id="budget-name" required placeholder="e.g. Groceries">
                </div>
                <div class="input-group">
                    <label for="budget-amount">Budget Limit ($)</label>
                    <input type="number" id="budget-amount" min="0" step="0.01" required placeholder="e.g. 500">
                </div>
                <div class="input-group promo-toggle-group">
                    <label class="toggle-label" for="budget-exception-toggle">
                        <span>Set a one-time override for this month?</span>
                        <span class="toggle-switch">
                            <input type="checkbox" id="budget-exception-toggle">
                            <span class="toggle-slider toggle-slider-green"></span>
                        </span>
                    </label>
                </div>
                <div class="input-group" id="budget-exception-amount-group" style="display:none;">
                    <label for="budget-exception-amount">This Month's Override Amount ($)</label>
                    <input type="number" id="budget-exception-amount" min="0" step="0.01" placeholder="e.g. 750">
                    <p class="subtitle" style="margin-top:0.3rem; margin-bottom:0; font-size:0.8rem;">Reverts to the regular budget next month.</p>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-budget-modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Budget</button>
                </div>
            </form>
        </div>
    </div>

    <div id="expense-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="expense-modal-title">Add Expense</h3>
                <button class="close-modal close-expense-modal">&times;</button>
            </div>
            <form id="expense-form">
                <input type="hidden" id="expense-id">
                <input type="hidden" id="expense-budget-id">
                <div class="input-group">
                    <label for="expense-description">Description</label>
                    <input type="text" id="expense-description" required placeholder="e.g. Walmart run">
                </div>
                <div class="input-group">
                    <label for="expense-amount">Amount ($)</label>
                    <input type="number" id="expense-amount" min="0" step="0.01" required placeholder="e.g. 85.00">
                </div>
                <div class="input-group">
                    <label for="expense-date">Date</label>
                    <input type="date" id="expense-date">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-expense-modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Expense</button>
                </div>
            </form>
        </div>
    </div>

    <div id="windfall-modal" class="modal">
        <div class="modal-content" style="max-width:520px;">
            <div class="modal-header">
                <h3>💰 Lump Sum Windfall Planner</h3>
                <button class="close-modal" id="close-windfall-modal">&times;</button>
            </div>
            <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1.25rem;line-height:1.6;">
                Enter a one-time extra payment. The app will show you how applying it optimally changes your payoff date and total interest.
            </p>
            <div class="input-group">
                <label for="windfall-amount">Windfall Amount ($)</label>
                <input type="number" id="windfall-amount" min="0" step="0.01" placeholder="e.g. 2000">
            </div>
            <button id="windfall-calc-btn" class="btn btn-primary" style="width:100%;margin-bottom:1.25rem;">Calculate Impact</button>
            <div id="windfall-results" style="display:none;">
                <div class="windfall-comparison">
                    <div class="windfall-col windfall-col-before">
                        <div class="windfall-col-title">Without Windfall</div>
                        <div class="windfall-stat"><span>Payoff Date</span><strong id="wf-before-date">-</strong></div>
                        <div class="windfall-stat"><span>Total Interest</span><strong id="wf-before-interest">-</strong></div>
                        <div class="windfall-stat"><span>Months</span><strong id="wf-before-months">-</strong></div>
                    </div>
                    <div class="windfall-arrow">→</div>
                    <div class="windfall-col windfall-col-after">
                        <div class="windfall-col-title">With Windfall</div>
                        <div class="windfall-stat"><span>Payoff Date</span><strong id="wf-after-date">-</strong></div>
                        <div class="windfall-stat"><span>Total Interest</span><strong id="wf-after-interest">-</strong></div>
                        <div class="windfall-stat"><span>Months</span><strong id="wf-after-months">-</strong></div>
                    </div>
                </div>
                <div id="windfall-savings-banner" class="windfall-savings-banner"></div>
                <div id="windfall-allocation" class="windfall-allocation"></div>
            </div>
        </div>
    </div>

    <div id="checkpoint-modal" class="modal">
        <div class="modal-content" style="max-width:420px;">
            <div class="modal-header">
                <h3 id="checkpoint-modal-title">Edit Checkpoint</h3>
                <button class="close-modal close-checkpoint-modal">&times;</button>
            </div>
            <form id="checkpoint-form">
                <input type="hidden" id="checkpoint-id">
                <div class="input-group">
                    <label for="checkpoint-day">Day of Month</label>
                    <select id="checkpoint-day" required style="width:100%; padding:0.6rem; font-size:0.95rem; background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; color:var(--text-primary);">
                        ${Array.from({length: 31}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label for="checkpoint-amount">Balance Amount ($)</label>
                    <input type="number" id="checkpoint-amount" min="0" step="0.01" required placeholder="e.g. 1200">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-checkpoint-modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Checkpoint</button>
                </div>
            </form>
        </div>
    </div>

    <div id="checkin-modal" class="modal">
        <div class="modal-content" style="max-width:420px;">
            <div class="modal-header">
                <h3>📅 New Month Check-In</h3>
            </div>
            <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">
                It's a new month! For the most accurate payoff timeline, update each debt card with your latest statement balance.
            </p>
            <div style="background:rgba(91,127,255,0.08);border:1px solid rgba(91,127,255,0.2);border-radius:8px;padding:1rem;margin-bottom:1.5rem;">
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.5rem;">Your debts to review:</div>
                <div id="checkin-debt-list" style="display:flex;flex-direction:column;gap:0.4rem;"></div>
            </div>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                <button class="btn btn-secondary" id="checkin-later-btn">Remind Me Later</button>
                <button class="btn btn-primary" id="checkin-done-btn">Got It, I'll Update</button>
            </div>
        </div>
    </div>

    <div id="archive-modal" class="modal">
        <div class="modal-content archive-modal-content">
            <div class="modal-header">
                <h3>📅 Monthly History</h3>
                <button class="close-modal" id="close-archive-modal">&times;</button>
            </div>
            <div id="archive-body">
                <div class="archive-empty">No archived months yet.<br>History is saved automatically when each month rolls over.</div>
            </div>
        </div>
    </div>

    <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;display:none;"></canvas>`;

class DebtSnowballCard extends HTMLElement {
    // Lovelace Card API - minimal implementation at top
    // Full implementation at bottom of class

    set hass(hass) {
        // Just store the HA object and locale settings when HA pushes them
        this._hass = hass;
        this._currency = hass.config?.currency || 'USD';
        this._language = hass.locale?.language || hass.language || navigator.language;
    }
  
    connectedCallback() {
        // Guard against multiple injections when HA re-renders
        if (this._initialized) return;
        this._initialized = true;

        // Load Google Fonts
        if (!document.querySelector('link[data-debt-snowball-font]')) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.setAttribute('data-debt-snowball-font', '1');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap';
            document.head.appendChild(fontLink);
        }

        // Inject styles directly into the component to bypass HA's Shadow DOM blocking
        const styleEl = document.createElement('style');
        styleEl.textContent = PANEL_CSS;
        this.appendChild(styleEl);

        // Inject HTML
        const wrapper = document.createElement('div');
        wrapper.innerHTML = PANEL_HTML;
        while (wrapper.firstChild) this.appendChild(wrapper.firstChild);

        // Load Chart.js then initialize the app
        this._loadChartJs().then(() => {
        this._initApp();
        });
    }

  disconnectedCallback() {
    // Clean up interval if panel is removed
    if (typeof countdownInterval !== 'undefined' && countdownInterval) {
      clearInterval(countdownInterval);
    }
  }

  _loadChartJs() {
    return new Promise((resolve) => {
      if (window.Chart) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = resolve;
      script.onerror = () => {
        console.error('[DebtSnowball] Failed to load Chart.js');
        resolve(); // continue anyway
      };
      document.head.appendChild(script);
    });
  }

  _initApp() {
    // _root is used throughout the app to scope DOM queries to this panel
    const _root = this;
    _root.getElementById = (id) => _root.querySelector(`#${id}`);

    // ─── Data Models ────────────────────────────────────────────────────────────
let debts = [];
let recurringCosts = [];
let incomeEntries = [];
let checkpoints = [];
let startingBalance = 0;
let strategy = 'snowball'; // 'snowball' | 'avalanche'
let showMortgage = true;   // toggle mortgage visibility
let paidStatus = {};       // { [id: 'paid' | 'autopay' } — resets each calendar month
let monthlyArchives = [];  // [{ month, label, incomeEntries, recurringCosts, checkpoints, startingBalance, totalIncome, totalCosts }]
let spendingBudgets = [];  // [{ id, name, amount, exception: {month,amount}|null, expenses: [{id,description,amount,date}] }]
let expandedBudgets = new Set(); // UI state: which budget IDs are expanded
let expandedCostSections = new Set(['utility', 'subscription', 'other', 'one-time']); // UI state: expanded cost section keys
let inlineExpenseBudget = null;  // UI state: which budget ID has the inline add-expense form open
let paydownChart = null;
let lastSimPayoffDate = null; // used for countdown ticker
let countdownInterval = null;
let viewingArchiveIndex = null; // null = current month, number = index into monthlyArchives
let workingMonthKey = null;    // the month the data is for — may be ahead of the calendar if user advanced early
let minPayOverrides = {};      // { [debtId]: amount } — this-month-only minimum payment overrides

// ─── DOM Elements ───────────────────────────────────────────────────────────
const debtsListContainer    = _root.getElementById('debts-list');
const costsListContainer    = _root.getElementById('costs-list');
const incomeListContainer   = _root.getElementById('income-list');
const addDebtBtn            = _root.getElementById('add-debt-btn');
const addCostBtn            = _root.getElementById('add-cost-btn');
const addIncomeBtn          = _root.getElementById('add-income-btn');
const debtModal             = _root.getElementById('debt-modal');
const costModal             = _root.getElementById('cost-modal');
const incomeModal           = _root.getElementById('income-modal');
const debtForm              = _root.getElementById('debt-form');
const costForm              = _root.getElementById('cost-form');
const incomeForm            = _root.getElementById('income-form');
const exportBtn             = _root.getElementById('export-btn');
const importFileInput       = _root.getElementById('import-file');
const windfallModal         = _root.getElementById('windfall-modal');
const checkinModal          = _root.getElementById('checkin-modal');
const budgetModal           = _root.getElementById('budget-modal');
const budgetForm            = _root.getElementById('budget-form');
const expenseModal          = _root.getElementById('expense-modal');
const expenseForm           = _root.getElementById('expense-form');
const checkpointModal       = _root.getElementById('checkpoint-modal');
const checkpointForm        = _root.getElementById('checkpoint-form');

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

            const prevMonth = result.paidMonth;
            const thisMonth = currentMonthKey();

            // workingMonthKey is whichever is later: the stored month or the calendar month.
            // This means if the user advanced early, workingMonthKey stays at the advanced month.
            workingMonthKey = (prevMonth && monthKeyToIndex(prevMonth) > monthKeyToIndex(thisMonth))
                ? prevMonth
                : thisMonth;

            // Only archive if the calendar has moved *past* the stored month (not when user advanced ahead).
            if (prevMonth && monthKeyToIndex(thisMonth) > monthKeyToIndex(prevMonth)) {
                // Calculate final balance (next month's starting balance)
                const _cp = result.checkpoints || [];
                const _inc = result.incomeEntries || [];
                const _cst = (result.recurringCosts || []).filter(c => isCostDueInMonth(c, prevMonth));
                const day1Cp = _cp.find(cp => cp.day === 1);
                let cashPool = day1Cp ? day1Cp.amount : 0;
                const totalIncome = _inc.reduce((s, e) => s + e.amount, 0);
                const totalCosts = _cst.reduce((s, c) => s + c.amount, 0);
                const finalBalance = cashPool + totalIncome - totalCosts;

                // Archive the closing month before clearing
                const archive = {
                    month:          prevMonth,
                    label:          formatMonthLabel(prevMonth),
                    incomeEntries:  result.incomeEntries  || [],
                    recurringCosts: result.recurringCosts || [],
                    checkpoints:    result.checkpoints    || [],
                    debts:          result.debts          || [],
                    startingBalance: result.startingBalance || 0,
                    paidStatus:     result.paidStatus     || {},
                    totalIncome:    (result.incomeEntries  || []).reduce((s, e) => s + e.amount, 0),
                    totalCosts:     (result.recurringCosts || []).filter(c => isCostDueInMonth(c, prevMonth)).reduce((s, c) => s + c.amount, 0),
                    finalBalance,
                };
                monthlyArchives.unshift(archive);
                if (monthlyArchives.length > 24) monthlyArchives.pop();

                // Clear month-specific data; prune one-time costs; advance interval nextDueMonth
                incomeEntries  = generateRecurringIncomeForMonth(result.incomeEntries || [], thisMonth);
                // Create day 1 checkpoint with the final balance from previous month
                checkpoints    = finalBalance > 0
                    ? [{ id: 'cp_' + Date.now(), day: 1, amount: finalBalance }]
                    : [];
                recurringCosts = recurringCosts
                    .filter(c => (c.category || 'other') !== 'one-time')
                    .map(c => {
                        if ((c.intervalMonths || 1) <= 1) return c;
                        let next = c.nextDueMonth || prevMonth;
                        // Advance until next is strictly past the closing month
                        while (monthKeyToIndex(next) <= monthKeyToIndex(prevMonth)) {
                            next = addMonthsToKey(next, c.intervalMonths);
                        }
                        return { ...c, nextDueMonth: next };
                    });
                paidStatus      = {};
                minPayOverrides = {};
                spendingBudgets = spendingBudgets.map(b => ({
                    ...b,
                    expenses:  [],
                    exception: (b.exception?.month === prevMonth) ? null : b.exception,
                }));

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
            debts, recurringCosts, incomeEntries, checkpoints,
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
async function advanceToNextMonth() {
    const currentKey = workingMonthKey || currentMonthKey();
    const nextKey    = addMonthsToKey(currentKey, 1);
    const nextLabel  = formatMonthLabel(nextKey);

    if (!confirm(`Archive ${formatMonthLabel(currentKey)} and start ${nextLabel} now?\n\nOne-time costs will be removed, income will be cleared, and interval costs will advance. This cannot be undone.`)) return;

    // Archive current month
    const archive = {
        month:          currentKey,
        label:          formatMonthLabel(currentKey),
        incomeEntries:  [...incomeEntries],
        recurringCosts: [...recurringCosts],
        checkpoints:    [...checkpoints],
        debts:          debts.map(d => ({...d})),
        startingBalance,
        paidStatus:     { ...paidStatus },
        totalIncome:    incomeEntries.reduce((s, e) => s + e.amount, 0),
        totalCosts:     recurringCosts.filter(c => isCostDueInMonth(c, currentKey)).reduce((s, c) => s + c.amount, 0),
    };
    monthlyArchives.unshift(archive);
    if (monthlyArchives.length > 24) monthlyArchives.pop();

    // Calculate final balance for next month's day 1 checkpoint
    const day1CpCurrent = checkpoints.find(cp => cp.day === 1);
    let currentCash = day1CpCurrent ? day1CpCurrent.amount : 0;
    const currentIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const currentCosts = recurringCosts
        .filter(c => isCostDueInMonth(c, currentKey) && (c.category || 'other') !== 'one-time')
        .reduce((s, c) => s + c.amount, 0);
    const finalBalanceForNext = currentCash + currentIncome - currentCosts;

    // Reset month-specific data, prune one-time costs, advance interval nextDueMonth
    incomeEntries  = generateRecurringIncomeForMonth(incomeEntries, nextKey);
    // Create day 1 checkpoint with the calculated final balance
    checkpoints    = finalBalanceForNext > 0
        ? [{ id: 'cp_' + Date.now(), day: 1, amount: finalBalanceForNext }]
        : [];
    recurringCosts = recurringCosts
        .filter(c => (c.category || 'other') !== 'one-time')
        .map(c => {
            if ((c.intervalMonths || 1) <= 1) return c;
            let next = c.nextDueMonth || currentKey;
            while (monthKeyToIndex(next) <= monthKeyToIndex(currentKey)) {
                next = addMonthsToKey(next, c.intervalMonths);
            }
            return { ...c, nextDueMonth: next };
        });
    paidStatus      = {};
    minPayOverrides = {};
    spendingBudgets = spendingBudgets.map(b => ({
        ...b,
        expenses:  [],
        exception: (b.exception?.month === currentKey) ? null : b.exception,
    }));

    // Save with paidMonth set to nextKey so the automatic rollover doesn't re-fire
    try {
        await ensureStoreDashboard();
        await _root._hass.connection.sendMessagePromise({
            type:     'lovelace/config/save',
            url_path: STORE_URL_PATH,
            config:   {
                debts, recurringCosts, incomeEntries, checkpoints,
                strategy, startingBalance, showMortgage,
                paidStatus, paidMonth: nextKey,
                monthlyArchives, spendingBudgets,
            },
        });
        workingMonthKey = nextKey;
        renderUI();
        showSavedToast(`Started ${nextLabel} ✓`);
    } catch (err) {
        console.error('Debt Snowball: advance month failed —', err);
        showErrorToast('Failed to advance month. Please try again.');
    }
}

function formatMonthLabel(key) {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function monthKeyToIndex(key) {
    const [y, m] = key.split('-').map(Number);
    return y * 12 + m;
}

function addMonthsToKey(key, n) {
    const total = monthKeyToIndex(key) + n;
    return `${Math.floor(total / 12)}-${total % 12}`;
}

// Generate all biweekly occurrences of a paycheck within a given month.
// anchorDateStr is any past reference date on the correct two-week cycle (YYYY-MM-DD).
function generateBiweeklyForMonth(label, amount, anchorDateStr, monthKey) {
    const anchor = new Date(anchorDateStr + 'T00:00:00');
    const [y, m] = monthKey.split('-').map(Number);
    const monthStart = new Date(y, m, 1);
    const monthEnd   = new Date(y, m + 1, 0);
    const msPerDay   = 86400000;
    const entries    = [];

    // Step forward from anchor in 14-day increments until we enter the month
    let d = new Date(anchor);
    const daysToStart = Math.floor((monthStart - anchor) / msPerDay);
    if (daysToStart > 0) {
        d = new Date(anchor.getTime() + Math.floor(daysToStart / 14) * 14 * msPerDay);
    }

    while (d <= monthEnd) {
        if (d >= monthStart) {
            const mm = String(m + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            entries.push({
                id: `${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
                label, amount,
                date: `${y}-${mm}-${dd}`,
                scheduleType: 'biweekly',
                scheduleAnchorDate: anchorDateStr,
            });
        }
        d = new Date(d.getTime() + 14 * msPerDay);
    }
    return entries;
}

// Carry recurring income entries forward into newMonthKey.
// Monthly entries (and legacy entries with no scheduleType) get their date updated;
// biweekly entries are regenerated; explicit one-time entries are dropped.
function generateRecurringIncomeForMonth(oldEntries, newMonthKey) {
    const [y, m] = newMonthKey.split('-').map(Number);
    const newEntries = [];

    // Monthly recurring: update date to same day in new month.
    // Legacy entries with no scheduleType are treated as monthly.
    oldEntries.filter(e => !e.scheduleType || e.scheduleType === 'monthly').forEach(e => {
        const day     = e.scheduleDay || parseInt(e.date.split('-')[2]);
        const lastDay = new Date(y, m + 1, 0).getDate();
        const actual  = Math.min(day, lastDay);
        const mm = String(m + 1).padStart(2, '0');
        const dd = String(actual).padStart(2, '0');
        newEntries.push({ ...e, scheduleDay: day, date: `${y}-${mm}-${dd}` });
    });

    // Biweekly: deduplicate templates by (label|amount|anchorDate) then regenerate
    const seen = new Set();
    oldEntries.filter(e => e.scheduleType === 'biweekly' && e.scheduleAnchorDate).forEach(e => {
        const key = `${e.label}|${e.amount}|${e.scheduleAnchorDate}`;
        if (!seen.has(key)) {
            seen.add(key);
            newEntries.push(...generateBiweeklyForMonth(e.label, e.amount, e.scheduleAnchorDate, newMonthKey));
        }
    });

    return newEntries;
}

// Convert app month key (YYYY-M, 0-indexed month) ↔ HTML month input value (YYYY-MM, 1-indexed)
function keyToHtmlMonth(key) {
    const [year, month] = key.split('-').map(Number);
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}
function htmlMonthToKey(htmlMonth) {
    const [year, month] = htmlMonth.split('-').map(Number);
    return `${year}-${month - 1}`;
}

function isCostDueThisMonth(cost) {
    const key = workingMonthKey || currentMonthKey();
    if ((cost.category || 'other') === 'one-time') {
        // One-time costs are only due in the month they were added (or legacy ones with no addedMonth)
        return !cost.addedMonth || cost.addedMonth === key;
    }
    if ((cost.intervalMonths || 1) <= 1) return true;
    const next = cost.nextDueMonth || key;
    return monthKeyToIndex(next) <= monthKeyToIndex(key);
}

function isCostDueInMonth(cost, monthKey) {
    if ((cost.category || 'other') === 'one-time') {
        return !cost.addedMonth || cost.addedMonth === monthKey;
    }
    if ((cost.intervalMonths || 1) <= 1) return true;
    const next = cost.nextDueMonth || monthKey;
    return monthKeyToIndex(next) <= monthKeyToIndex(monthKey);
}

function intervalLabel(n) {
    if (!n || n <= 1) return null;
    if (n === 3)  return '📆 Quarterly';
    if (n === 6)  return '📆 Semi-Annual';
    if (n === 12) return '📆 Annual';
    return `📆 Every ${n} mo.`;
}

function updateCostModalIntervalVisibility() {
    const cat      = _root.getElementById('cost-category').value;
    const intGrp   = _root.getElementById('cost-interval-group');
    const custGrp  = _root.getElementById('cost-interval-custom-group');
    const startGrp = _root.getElementById('cost-start-month-group');
    const isOneTime = cat === 'one-time';
    intGrp.style.display  = isOneTime ? 'none' : '';
    if (isOneTime) {
        custGrp.style.display = 'none';
        startGrp.style.display = 'none';
    } else {
        const val = _root.getElementById('cost-interval').value;
        const isMultiMonth = val === 'custom' || parseInt(val) > 1;
        custGrp.style.display  = val === 'custom' ? '' : 'none';
        startGrp.style.display = isMultiMonth ? '' : 'none';
    }
}

// ─── Archive Viewer ───────────────────────────────────────────────────────────
function openArchiveModal() {
    const body = _root.getElementById('archive-body');
    body.innerHTML = '';

    if (monthlyArchives.length === 0) {
        body.innerHTML = '<div class="archive-empty">No archived months yet.<br>History is saved automatically when each month rolls over.</div>';
        showModal(_root.getElementById('archive-modal'));
        return;
    }

    // Dropdown
    const select = document.createElement('select');
    select.className = 'input-group archive-select';
    monthlyArchives.forEach((a, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = a.label;
        select.appendChild(opt);
    });
    body.appendChild(select);

    const detailWrap = document.createElement('div');
    body.appendChild(detailWrap);

    function renderArchiveDetail(idx) {
        const a = monthlyArchives[idx];
        detailWrap.innerHTML = '';

        const summary = document.createElement('div');
        summary.className = 'archive-summary';

        const fmt = n => typeof n === 'number' ? formatMoney(n) : '$0.00';

        summary.innerHTML = `
            <div class="archive-summary-row">
                <span class="archive-summary-label">Starting Balance</span>
                <span class="archive-summary-value">${fmt(a.startingBalance)}</span>
            </div>
            <div class="archive-summary-row">
                <span class="archive-summary-label">Total Income</span>
                <span class="archive-summary-value income">${fmt(a.totalIncome)}</span>
            </div>
            <div class="archive-summary-row">
                <span class="archive-summary-label">Total Costs</span>
                <span class="archive-summary-value expense">${fmt(a.totalCosts)}</span>
            </div>`;

        // Income detail toggle
        if (a.incomeEntries && a.incomeEntries.length > 0) {
            const incBtn = document.createElement('button');
            incBtn.className = 'archive-detail-toggle';
            incBtn.textContent = `▶ Income entries (${a.incomeEntries.length})`;
            const incDetail = document.createElement('div');
            incDetail.className = 'archive-detail-section';
            a.incomeEntries.forEach(e => {
                const row = document.createElement('div');
                row.className = 'archive-detail-item';
                row.innerHTML = `<span>${escHtml(e.label)}</span><span>${fmt(e.amount)}</span>`;
                incDetail.appendChild(row);
            });
            incBtn.addEventListener('click', () => {
                incDetail.classList.toggle('open');
                incBtn.textContent = incDetail.classList.contains('open')
                    ? `▼ Income entries (${a.incomeEntries.length})`
                    : `▶ Income entries (${a.incomeEntries.length})`;
            });
            summary.appendChild(incBtn);
            summary.appendChild(incDetail);
        }

        // Costs detail toggle
        if (a.recurringCosts && a.recurringCosts.length > 0) {
            const costBtn = document.createElement('button');
            costBtn.className = 'archive-detail-toggle';
            costBtn.textContent = `▶ Cost entries (${a.recurringCosts.length})`;
            const costDetail = document.createElement('div');
            costDetail.className = 'archive-detail-section';
            a.recurringCosts.forEach(c => {
                const row = document.createElement('div');
                row.className = 'archive-detail-item';
                row.innerHTML = `<span>${escHtml(c.name)} <span style="opacity:0.6;font-size:0.75em;">${c.category || 'other'}</span></span><span>${fmt(c.amount)}</span>`;
                costDetail.appendChild(row);
            });
            costBtn.addEventListener('click', () => {
                costDetail.classList.toggle('open');
                costBtn.textContent = costDetail.classList.contains('open')
                    ? `▼ Cost entries (${a.recurringCosts.length})`
                    : `▶ Cost entries (${a.recurringCosts.length})`;
            });
            summary.appendChild(costBtn);
            summary.appendChild(costDetail);
        }

        detailWrap.appendChild(summary);
    }

    renderArchiveDetail(0);
    select.addEventListener('change', () => renderArchiveDetail(Number(select.value)));

    showModal(_root.getElementById('archive-modal'));
}

function closeArchiveModal() {
    const modal = _root.getElementById('archive-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

function showModal(modal) {
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('active');
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
function setupEventListeners() {

    // ── Global ripple effect on all .btn clicks ───────────────────────────────
    _root.addEventListener('click', e => {
        const btn = e.target.closest('.btn');
        if (!btn || btn.disabled) return;
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            left: ${e.clientX - rect.left - size/2}px;
            top:  ${e.clientY - rect.top  - size/2}px;
            width: ${size}px;
            height: ${size}px;
        `;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }, true);

    addDebtBtn.addEventListener('click',   () => openDebtModal());
    addCostBtn.addEventListener('click',   () => openCostModal());
    addIncomeBtn.addEventListener('click', () => openIncomeModal());
    _root.getElementById('advance-month-btn').addEventListener('click', advanceToNextMonth);
    _root.getElementById('add-budget-btn').addEventListener('click', () => openBudgetModal());

    // Delegated toggle for collapsible cost sections (utility / subscription)
    costsListContainer.addEventListener('click', e => {
        const toggle = e.target.closest('[data-toggle-section]');
        if (!toggle) return;
        const key = toggle.dataset.toggleSection;
        if (expandedCostSections.has(key)) expandedCostSections.delete(key);
        else expandedCostSections.add(key);
        renderRecurringCostsList();
    });

    _root.querySelectorAll('.close-budget-modal').forEach(b  => b.addEventListener('click', closeBudgetModal));
    _root.querySelectorAll('.close-expense-modal').forEach(b => b.addEventListener('click', closeExpenseModal));

    budgetForm.addEventListener('submit',  e => { e.preventDefault(); saveBudget(); });
    expenseForm.addEventListener('submit', e => { e.preventDefault(); saveExpense(); });

    _root.getElementById('budget-exception-toggle').addEventListener('change', () => {
        const show = _root.getElementById('budget-exception-toggle').checked;
        _root.getElementById('budget-exception-amount-group').style.display = show ? '' : 'none';
    });

    // Delegated click handler for all budget card interactions
    _root.getElementById('budgets-list').addEventListener('click', e => {
        const toggle = e.target.closest('[data-toggle-budget]');
        if (toggle) {
            const bid = toggle.dataset.toggleBudget;
            if (expandedBudgets.has(bid)) {
                expandedBudgets.delete(bid);
                // Close inline form too when collapsing
                if (inlineExpenseBudget === bid) inlineExpenseBudget = null;
            } else {
                expandedBudgets.add(bid);
            }
            renderSpendingBudgets();
            return;
        }

        // Inline expense toggle (open/close inline form)
        const inlineToggle = e.target.closest('.btn-toggle-inline-expense');
        if (inlineToggle) {
            const bid = inlineToggle.dataset.budgetId;
            inlineExpenseBudget = (inlineExpenseBudget === bid) ? null : bid;
            expandedBudgets.add(bid); // Ensure card is expanded
            renderSpendingBudgets();
            return;
        }

        // Inline save button
        const inlineSave = e.target.closest('.btn-inline-save');
        if (inlineSave) {
            const bid = inlineSave.dataset.budgetId;
            const form = inlineSave.closest('.inline-expense-form');
            if (!form) return;
            const desc   = form.querySelector('.inline-desc').value.trim();
            const amount = parseFloat(form.querySelector('.inline-amount').value);
            const date   = form.querySelector('.inline-date').value;
            if (!desc)              { showErrorToast('Please enter a description.'); return; }
            if (isNaN(amount) || amount < 0) { showErrorToast('Please enter a valid amount.'); return; }
            const budget = spendingBudgets.find(b => b.id === bid);
            if (!budget) return;
            if (!budget.expenses) budget.expenses = [];
            budget.expenses.push({ id: Date.now().toString(), description: desc, amount, date });
            inlineExpenseBudget = null;
            expandedBudgets.add(bid);
            saveData().catch(err => console.error('Debt Snowball: save failed —', err));
            renderSpendingBudgets();
            showSavedToast('Expense added ✓');
            return;
        }

        // Inline cancel button
        const inlineCancel = e.target.closest('.btn-inline-cancel');
        if (inlineCancel) {
            inlineExpenseBudget = null;
            renderSpendingBudgets();
            return;
        }

        // Edit expense (opens modal for editing)
        const editExp = e.target.closest('.btn-edit-expense');
        if (editExp) { openExpenseModal(editExp.dataset.budgetId, editExp.dataset.expenseId); return; }

        const delExp = e.target.closest('.btn-delete-expense');
        if (delExp) {
            // Animate the row out before removing
            const row = delExp.closest('.budget-expense-row');
            if (row) {
                row.classList.add('expense-removing');
                setTimeout(() => deleteExpense(delExp.dataset.budgetId, delExp.dataset.expenseId), 280);
            } else {
                deleteExpense(delExp.dataset.budgetId, delExp.dataset.expenseId);
            }
            return;
        }

        const override = e.target.closest('.btn-override-budget');
        if (override) { openBudgetModal(override.dataset.budgetId, true); return; }

        const editBudget = e.target.closest('.btn-edit-budget');
        if (editBudget) { openBudgetModal(editBudget.dataset.budgetId); return; }

        const delBudget = e.target.closest('.btn-delete-budget');
        if (delBudget) { deleteBudget(delBudget.dataset.budgetId); return; }
    });

    // Inline expense form — keyboard handling
    _root.getElementById('budgets-list').addEventListener('keydown', e => {
        const form = e.target.closest('.inline-expense-form');
        if (!form) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            const saveBtn = form.querySelector('.btn-inline-save');
            if (saveBtn) saveBtn.click();
        } else if (e.key === 'Escape') {
            const cancelBtn = form.querySelector('.btn-inline-cancel');
            if (cancelBtn) cancelBtn.click();
        }
    });

    _root.querySelectorAll('.close-debt-modal').forEach(b       => b.addEventListener('click', closeDebtModal));
    _root.querySelectorAll('.close-cost-modal').forEach(b       => b.addEventListener('click', closeCostModal));
    _root.querySelectorAll('.close-income-modal').forEach(b     => b.addEventListener('click', closeIncomeModal));
    _root.querySelectorAll('.close-checkpoint-modal').forEach(b  => b.addEventListener('click', closeCheckpointModal));

    debtForm.addEventListener('submit',       e => { e.preventDefault(); saveDebt(); });
    checkpointForm.addEventListener('submit', e => { e.preventDefault(); saveCheckpoint(); });
    costForm.addEventListener('submit',       e => { e.preventDefault(); saveCost(); });
    incomeForm.addEventListener('submit',     e => { e.preventDefault(); saveIncome(); });

    exportBtn.addEventListener('click', exportData);
    importFileInput.addEventListener('change', importData);

    // Add new checkpoint inline form
    _root.getElementById('add-checkpoint-btn').addEventListener('click', () => {
        const dayInput = _root.getElementById('new-checkpoint-day');
        const amountInput = _root.getElementById('new-checkpoint-amount');
        const day = parseInt(dayInput.value);
        const amount = parseFloat(amountInput.value);

        if (!day || !Number.isFinite(amount) || amount < 0) {
            showErrorToast('Please enter a valid day and amount');
            return;
        }

        // Check for duplicate day
        if (checkpoints.some(cp => cp.day === day)) {
            showErrorToast(`A checkpoint for day ${day} already exists`);
            return;
        }

        const newCheckpoint = {
            id: 'cp_' + Date.now(),
            day,
            amount
        };
        checkpoints.push(newCheckpoint);
        checkpoints.sort((a, b) => a.day - b.day);

        saveData().then(() => {
            renderCheckpointsList();
            renderUI();
            amountInput.value = '';
            showSavedToast('Checkpoint added ✓');
        }).catch(err => console.error("Debt Snowball: save failed —", err));
    });

    // Delete checkpoint handler (delegated)
    _root.getElementById('checkpoints-list').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-checkpoint-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            checkpoints = checkpoints.filter(c => c.id !== id);
            saveData().then(() => {
                renderCheckpointsList();
                renderUI();
                showSavedToast('Checkpoint removed ✓');
            }).catch(err => console.error("Debt Snowball: save failed —", err));
        }
    });

    // Payment plan month navigation
    _root.getElementById('plan-prev-month-btn').addEventListener('click', () => {
        const btn = _root.getElementById('plan-prev-month-btn');
        const idx = parseInt(btn.dataset.archiveIdx ?? '0');
        if (idx < monthlyArchives.length) { viewingArchiveIndex = idx; renderPaymentPlan(); }
    });
    _root.getElementById('plan-next-month-btn').addEventListener('click', () => {
        viewingArchiveIndex = null;
        renderPaymentPlan();
    });

    // Income schedule type hint
    _root.getElementById('income-schedule').addEventListener('change', updateIncomeScheduleHint);

    // Archive / History
    _root.getElementById('history-btn').addEventListener('click', openArchiveModal);
    _root.getElementById('close-archive-modal').addEventListener('click', closeArchiveModal);
    _root.getElementById('archive-modal').addEventListener('click', e => {
        if (e.target === _root.getElementById('archive-modal')) closeArchiveModal();
    });

    // Windfall planner
    _root.getElementById('windfall-btn').addEventListener('click', openWindfallModal);
    _root.getElementById('close-windfall-modal').addEventListener('click', closeWindfallModal);
    _root.getElementById('windfall-calc-btn').addEventListener('click', calcWindfall);
    windfallModal.addEventListener('click', e => { if (e.target === windfallModal) closeWindfallModal(); });

    // Check-in modal
    _root.getElementById('checkin-later-btn').addEventListener('click', () => {
        localStorage.setItem('snowball_checkin_dismissed', currentMonthKey());
        checkinModal.classList.remove('active');
        setTimeout(() => { checkinModal.style.display = 'none'; }, 300);
    });
    _root.getElementById('checkin-done-btn').addEventListener('click', () => {
        localStorage.setItem('snowball_checkin_dismissed', currentMonthKey());
        checkinModal.classList.remove('active');
        setTimeout(() => { checkinModal.style.display = 'none'; }, 300);
    });

    // Cost modal: show/hide interval fields based on category and interval select
    _root.getElementById('cost-category').addEventListener('change', updateCostModalIntervalVisibility);
    _root.getElementById('cost-interval').addEventListener('change', updateCostModalIntervalVisibility);

    // Auto min-payment calc
    _root.getElementById('auto-min-btn').addEventListener('click', autoCalcMinPaymentCC);
    _root.getElementById('debt-balance').addEventListener('input', updateAutoMinHint);
    _root.getElementById('debt-rate').addEventListener('input', updateAutoMinHint);

    // Mortgage toggle
    _root.getElementById('mortgage-toggle-btn').addEventListener('click', () => {
        showMortgage = !showMortgage;
        saveData().then(() => renderUI()).catch(err => console.error("Debt Snowball: save failed —", err));
    });

    // Strategy toggle
    _root.querySelectorAll('.strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            strategy = btn.dataset.strategy;
            _root.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveData().then(() => renderUI()).catch(err => console.error("Debt Snowball: save failed —", err));
        });
    });

    // Payment plan "Mark as Paid" and inline "Edit" buttons
    _root.getElementById('payment-plan-list').addEventListener('click', e => {
        const paidBtn = e.target.closest('.btn-mark-paid');
        if (paidBtn) {
            togglePaid(paidBtn.dataset.id, paidBtn.dataset.autopay === '1');
            return;
        }
        const editBtn = e.target.closest('.btn-edit-inline');
        if (editBtn) {
            const { id, type } = editBtn.dataset;
            if (type === 'debt') openDebtModal(id);
            else if (type === 'recurring') openCostModal(id);
            else if (type === 'income') openIncomeModal(id);
            else if (type === 'checkpoint') openCheckpointModal(id);
            return;
        }

        // Override min payment — toggle inline form
        const overrideBtn = e.target.closest('.btn-override-min');
        if (overrideBtn) {
            const form = _root.getElementById(`override-form-${overrideBtn.dataset.id}`);
            if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
            return;
        }
        const cancelBtn = e.target.closest('.btn-override-cancel');
        if (cancelBtn) {
            const form = _root.getElementById(`override-form-${cancelBtn.dataset.id}`);
            if (form) form.style.display = 'none';
            return;
        }
        const saveBtn = e.target.closest('.btn-override-save');
        if (saveBtn) {
            const id  = saveBtn.dataset.id;
            const form = _root.getElementById(`override-form-${id}`);
            const val  = parseFloat(form?.querySelector('.override-input')?.value);
            if (isNaN(val) || val < 0) { showErrorToast('Enter a valid amount.'); return; }
            minPayOverrides[id] = val;
            saveData().catch(err => console.error('Debt Snowball: save failed —', err));
            renderPaymentPlan();
            return;
        }
        const clearBtn = e.target.closest('.btn-override-clear');
        if (clearBtn) {
            delete minPayOverrides[clearBtn.dataset.id];
            saveData().catch(err => console.error('Debt Snowball: save failed —', err));
            renderPaymentPlan();
            return;
        }
    });

    // Backdrop + Escape
    [debtModal, costModal, incomeModal, checkpointModal].forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                if (modal === debtModal)      closeDebtModal();
                else if (modal === costModal) closeCostModal();
                else if (modal === incomeModal) closeIncomeModal();
                else if (modal === checkpointModal) closeCheckpointModal();
            }
        });
    });

    _root.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (debtModal.classList.contains('active'))    closeDebtModal();
            else if (costModal.classList.contains('active'))   closeCostModal();
            else if (incomeModal.classList.contains('active')) closeIncomeModal();
            else if (checkpointModal.classList.contains('active')) closeCheckpointModal();
        }
        if (e.key === 'Tab') {
            const active = [debtModal, costModal, incomeModal, checkpointModal].find(m => m.classList.contains('active'));
            if (!active) return;
            const focusable = active.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1")');
            if(focusable.length > 0) {
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
                else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
            }
        }
    });

    // Promo toggle
    const promoToggle      = _root.getElementById('debt-promo-toggle');
    const promoExpiryGroup = _root.getElementById('promo-expiry-group');
    const rateInput        = _root.getElementById('debt-rate');
    const rateGroup        = rateInput.closest('.input-group');

    promoToggle.addEventListener('change', () => {
        if (promoToggle.checked) {
            promoExpiryGroup.style.display = 'block';
            rateGroup.classList.add('input-disabled');
            rateInput.value = '0';
            rateInput.disabled = true;
            _root.getElementById('debt-promo-expiry').required = true;
            autoCalcMinPayment();
        } else {
            promoExpiryGroup.style.display = 'none';
            rateGroup.classList.remove('input-disabled');
            rateInput.value = '';
            rateInput.disabled = false;
            _root.getElementById('debt-promo-expiry').required = false;
            _root.getElementById('debt-promo-expiry').value = '';
        }
    });

    _root.getElementById('debt-promo-expiry').addEventListener('change', autoCalcMinPayment);
    _root.getElementById('debt-balance').addEventListener('input', () => {
        if (_root.getElementById('debt-promo-toggle').checked) autoCalcMinPayment();
    });
}

function autoCalcMinPayment() {
    if (!_root.getElementById('debt-promo-toggle').checked) return;
    const balance    = parseFloat(_root.getElementById('debt-balance').value) || 0;
    const expiryDate = _root.getElementById('debt-promo-expiry').value;
    if (!expiryDate || balance <= 0) return;
    const now    = new Date();
    const expiry = new Date(expiryDate + 'T00:00:00');
    const diff   = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    if (diff > 0) {
        _root.getElementById('debt-min-payment').value = (Math.ceil((balance / diff) * 100) / 100).toFixed(2);
    }
}

// ─── Checkpoints List Rendering ───────────────────────────────────────────────
function renderCheckpointsList() {
    const container = _root.getElementById('checkpoints-list');
    if (!container) return;

    if (checkpoints.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Sort by day
    const sorted = [...checkpoints].sort((a, b) => a.day - b.day);

    const formatMoneyLocal = (n) => {
        const currency = _root._currency || 'USD';
        const locale = _root._locale || 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    };

    const listHtml = sorted.map(cp => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; background: rgba(168,85,247,0.06); border-radius: 6px; border: 1px solid rgba(168,85,247,0.2);">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.75rem; color: var(--text-secondary); background: rgba(168,85,247,0.15); padding: 0.2rem 0.4rem; border-radius: 4px;">Day ${cp.day}</span>
                <span style="font-weight: 500; color: var(--text-primary);">${formatMoneyLocal(cp.amount)}</span>
            </div>
            <button class="btn btn-icon delete-checkpoint-btn" data-id="${cp.id}" title="Remove checkpoint" style="padding: 0.25rem; font-size: 0.75rem; background: transparent; color: var(--danger-color); border: none; cursor: pointer;">
                ✕
            </button>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Mid-month checkpoints:</div>
        ${listHtml}
    `;
}


// ─── Debt Modal ──────────────────────────────────────────────────────────────
function openDebtModal(debtId = null) {
    debtForm.reset();
    _root.getElementById('debt-id').value = '';

    const promoToggle      = _root.getElementById('debt-promo-toggle');
    const promoExpiryGroup = _root.getElementById('promo-expiry-group');
    const rateInput        = _root.getElementById('debt-rate');

    promoToggle.checked = false;
    promoExpiryGroup.style.display = 'none';
    rateInput.closest('.input-group').classList.remove('input-disabled');
    rateInput.disabled = false;
    _root.getElementById('debt-promo-expiry').value    = '';
    _root.getElementById('debt-promo-expiry').required = false;
    _root.getElementById('debt-autopay-toggle').checked = false;
    _root.getElementById('debt-url').value = '';

    if (debtId) {
        _root.getElementById('modal-title').textContent = 'Edit Debt';
        const debt = debts.find(d => d.id === debtId);
        if (debt) {
            _root.getElementById('debt-id').value          = debt.id;
            _root.getElementById('debt-name').value        = debt.name;
            _root.getElementById('debt-type').value        = debt.type || 'credit-card';
            _root.getElementById('debt-balance').value     = debt.balance;
            _root.getElementById('debt-rate').value        = debt.rate;
            _root.getElementById('debt-min-payment').value = debt.minPayment;
            _root.getElementById('debt-due-day').value     = debt.dueDay || '';
            _root.getElementById('debt-autopay-toggle').checked = !!debt.autoPay;
            _root.getElementById('debt-url').value = debt.paymentUrl || '';
            if (debt.promoZeroInterest) {
                promoToggle.checked = true;
                promoExpiryGroup.style.display = 'block';
                rateInput.closest('.input-group').classList.add('input-disabled');
                rateInput.disabled = true;
                rateInput.value = '0';
                _root.getElementById('debt-promo-expiry').value    = debt.promoExpiryDate || '';
                _root.getElementById('debt-promo-expiry').required = true;
            }
        }
    } else {
        _root.getElementById('modal-title').textContent = 'Add New Debt';
        _root.getElementById('debt-type').value = 'credit-card';
    }

    debtModal.style.display = 'flex';
    void debtModal.offsetWidth;
    debtModal.classList.add('active');
    setTimeout(() => debtModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeDebtModal() {
    debtModal.classList.remove('active');
    setTimeout(() => { debtModal.style.display = 'none'; }, 300);
}

// ─── Recurring Cost Modal ────────────────────────────────────────────────────
function openCostModal(costId = null) {
    costForm.reset();
    _root.getElementById('cost-id').value = '';
    _root.getElementById('cost-autopay-toggle').checked = false;

    if (costId) {
        _root.getElementById('cost-modal-title').textContent = 'Edit Cost';
        const cost = recurringCosts.find(c => c.id === costId);
        if (cost) {
            _root.getElementById('cost-id').value              = cost.id;
            _root.getElementById('cost-name').value            = cost.name;
            _root.getElementById('cost-amount').value          = cost.amount;
            _root.getElementById('cost-due-day').value         = cost.dueDay || '';
            _root.getElementById('cost-category').value        = cost.category || 'other';
            _root.getElementById('cost-payment-method').value  = cost.paymentMethod || 'direct';
            _root.getElementById('cost-amount-type').value     = cost.amountType || 'fixed';
            _root.getElementById('cost-autopay-toggle').checked = !!cost.autoPay;
            // Restore interval
            const n = cost.intervalMonths || 1;
            const intervalEl = _root.getElementById('cost-interval');
            if ([1,2,3,6,12].includes(n)) {
                intervalEl.value = String(n);
            } else {
                intervalEl.value = 'custom';
                _root.getElementById('cost-interval-custom').value = n;
            }
            // Restore next due month
            if (n > 1 && cost.nextDueMonth) {
                _root.getElementById('cost-start-month').value = keyToHtmlMonth(cost.nextDueMonth);
            } else {
                _root.getElementById('cost-start-month').value = '';
            }
        }
    } else {
        _root.getElementById('cost-modal-title').textContent = 'Add Cost';
        _root.getElementById('cost-payment-method').value = 'direct';
        _root.getElementById('cost-amount-type').value = 'fixed';
        _root.getElementById('cost-interval').value = '1';
    }
    updateCostModalIntervalVisibility();

    costModal.style.display = 'flex';
    void costModal.offsetWidth;
    costModal.classList.add('active');
    setTimeout(() => costModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeCostModal() {
    costModal.classList.remove('active');
    setTimeout(() => { costModal.style.display = 'none'; }, 300);
}

// ─── Income Modal ────────────────────────────────────────────────────────────
function openIncomeModal(incomeId = null) {
    incomeForm.reset();
    _root.getElementById('income-id').value = '';
    _root.getElementById('income-schedule').value = 'one-time';
    _root.getElementById('income-schedule-hint').style.display = 'none';

    if (incomeId) {
        _root.getElementById('income-modal-title').textContent = 'Edit Income Entry';
        const entry = incomeEntries.find(e => e.id === incomeId);
        if (entry) {
            _root.getElementById('income-id').value       = entry.id;
            _root.getElementById('income-label').value    = entry.label;
            _root.getElementById('income-date').value     = entry.date;
            _root.getElementById('income-amount').value   = entry.amount;
            _root.getElementById('income-schedule').value = entry.scheduleType || 'one-time';
            updateIncomeScheduleHint();
        }
    } else {
        _root.getElementById('income-modal-title').textContent = 'Add Income Entry';
    }

    incomeModal.style.display = 'flex';
    void incomeModal.offsetWidth;
    incomeModal.classList.add('active');
    setTimeout(() => incomeModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function updateIncomeScheduleHint() {
    const sel  = _root.getElementById('income-schedule');
    const hint = _root.getElementById('income-schedule-hint');
    if (!sel || !hint) return;
    if (sel.value === 'monthly') {
        hint.textContent = 'This day of the month will be reused each month automatically.';
        hint.style.display = '';
    } else if (sel.value === 'biweekly') {
        hint.textContent = 'All biweekly occurrences within the current month will be added as separate entries.';
        hint.style.display = '';
    } else {
        hint.style.display = 'none';
    }
}

function closeIncomeModal() {
    incomeModal.classList.remove('active');
    setTimeout(() => { incomeModal.style.display = 'none'; }, 300);
}

// ─── Checkpoint Modal ────────────────────────────────────────────────────────
function openCheckpointModal(cpId = null) {
    checkpointForm.reset();
    _root.getElementById('checkpoint-id').value = '';

    if (cpId) {
        _root.getElementById('checkpoint-modal-title').textContent = 'Edit Checkpoint';
        const cp = checkpoints.find(c => c.id === cpId);
        if (cp) {
            _root.getElementById('checkpoint-id').value = cp.id;
            _root.getElementById('checkpoint-day').value = cp.day;
            _root.getElementById('checkpoint-amount').value = cp.amount.toFixed(2);
        }
    } else {
        _root.getElementById('checkpoint-modal-title').textContent = 'Add Checkpoint';
    }

    checkpointModal.style.display = 'flex';
    setTimeout(() => checkpointModal.classList.add('active'), 10);
    setTimeout(() => _root.getElementById('checkpoint-amount').focus(), 50);
}

function closeCheckpointModal() {
    checkpointModal.classList.remove('active');
    setTimeout(() => { checkpointModal.style.display = 'none'; }, 300);
}

function saveCheckpoint() {
    try {
        const id      = _root.getElementById('checkpoint-id').value;
        const day     = parseInt(_root.getElementById('checkpoint-day').value);
        const amount  = parseFloat(_root.getElementById('checkpoint-amount').value);

        if (!day || day < 1 || day > 31) throw new Error('Please select a valid day (1-31).');
        if (!Number.isFinite(amount) || amount < 0) throw new Error('Please enter a valid amount.');

        // Check for duplicate day (if adding new or changing day)
        const existingSameDay = checkpoints.find(cp => cp.day === day && cp.id !== id);
        if (existingSameDay) throw new Error(`A checkpoint for day ${day} already exists.`);

        if (id) {
            // Edit existing
            const idx = checkpoints.findIndex(cp => cp.id === id);
            if (idx !== -1) {
                checkpoints[idx] = { id, day, amount };
            }
        } else {
            // Add new
            const newCp = {
                id: 'cp_' + Date.now(),
                day,
                amount
            };
            checkpoints.push(newCp);
        }

        checkpoints.sort((a, b) => a.day - b.day);

        saveData().then(() => {
            renderCheckpointsList();
            renderUI();
            closeCheckpointModal();
            showSavedToast(id ? 'Checkpoint updated ✓' : 'Checkpoint added ✓');
        }).catch(err => console.error('Debt Snowball: save failed —', err));
    } catch (err) {
        showErrorToast(err.message || 'Failed to save checkpoint.');
    }
}

// ─── CRUD: Debts ─────────────────────────────────────────────────────────────
function saveDebt() {
    try {
        const id         = _root.getElementById('debt-id').value;
        const name       = _root.getElementById('debt-name').value;
        const type       = _root.getElementById('debt-type').value;
        const balance    = parseFloat(_root.getElementById('debt-balance').value);
        const rate       = parseFloat(_root.getElementById('debt-rate').value);
        const minPayment = parseFloat(_root.getElementById('debt-min-payment').value);
        const dueDay     = parseInt(_root.getElementById('debt-due-day').value) || 1;
        const autoPay    = _root.getElementById('debt-autopay-toggle').checked;
        const paymentUrl = _root.getElementById('debt-url').value.trim();

        const promoZeroInterest = _root.getElementById('debt-promo-toggle').checked;
        const promoExpiryDate   = promoZeroInterest ? _root.getElementById('debt-promo-expiry').value : null;

        if (!name.trim())          throw new Error('Please enter a name for this debt.');
        if (isNaN(balance))        throw new Error('Please enter a valid balance.');
        if (!promoZeroInterest && isNaN(rate)) throw new Error('Please enter a valid interest rate.');
        if (isNaN(minPayment))     throw new Error('Please enter a valid minimum payment.');

        const existingDebt = debts.find(d => d.id === id);
        const originalRate = promoZeroInterest
            ? (existingDebt?.originalRate != null ? existingDebt.originalRate : rate)
            : rate;

        const debtData = {
            name, type,
            balance,
            rate:         promoZeroInterest ? 0 : rate,
            originalRate: promoZeroInterest ? originalRate : rate,
            minPayment, dueDay, autoPay, paymentUrl,
            promoZeroInterest, promoExpiryDate
        };

        if (id) {
            const idx = debts.findIndex(d => d.id === id);
            if (idx !== -1) debts[idx] = { id, ...debtData };
        } else {
            debts.push({ id: Date.now().toString(), ...debtData });
        }

        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        closeDebtModal();
        showSavedToast(id ? 'Debt updated ✓' : 'Debt added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save debt.');
    }
}

function deleteDebt(id) {
    showInlineConfirm(id, 'debt', () => {
        const deleted = debts.find(d => d.id === id);
        debts = debts.filter(d => d.id !== id);
        delete paidStatus[id];
        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        showUndoToast('Debt deleted', () => { debts.push(deleted); saveData().catch(err => console.error('Debt Snowball: save failed —', err)); });
    });
}

// ─── CRUD: Recurring Costs ───────────────────────────────────────────────────
function saveCost() {
    try {
        const id            = _root.getElementById('cost-id').value;
        const name          = _root.getElementById('cost-name').value;
        const amount        = parseFloat(_root.getElementById('cost-amount').value);
        const dueDay        = parseInt(_root.getElementById('cost-due-day').value) || 1;
        const category      = _root.getElementById('cost-category').value || 'other';
        const paymentMethod = _root.getElementById('cost-payment-method').value || 'direct';
        const amountType    = _root.getElementById('cost-amount-type').value || 'fixed';
        const autoPay       = _root.getElementById('cost-autopay-toggle').checked;
        const intervalSel   = _root.getElementById('cost-interval').value;
        const intervalMonths = intervalSel === 'custom'
            ? (parseInt(_root.getElementById('cost-interval-custom').value) || 1)
            : parseInt(intervalSel) || 1;

        if (!name.trim())   throw new Error('Please enter a name for this cost.');
        if (isNaN(amount))  throw new Error('Please enter a valid amount.');
        if (intervalMonths < 1) throw new Error('Interval must be at least 1 month.');

        const startMonthInput = _root.getElementById('cost-start-month').value;
        const startMonthKey = startMonthInput ? htmlMonthToKey(startMonthInput) : null;

        const addedMonth = category === 'one-time' ? (workingMonthKey || currentMonthKey()) : undefined;

        if (id) {
            const idx = recurringCosts.findIndex(c => c.id === id);
            if (idx !== -1) {
                const existing = recurringCosts[idx];
                // Use explicit start month if set; otherwise preserve existing nextDueMonth when interval unchanged
                const nextDueMonth = intervalMonths > 1
                    ? (startMonthKey ?? (existing.intervalMonths === intervalMonths ? existing.nextDueMonth : currentMonthKey()))
                    : undefined;
                recurringCosts[idx] = { id, name, amount, dueDay, category, paymentMethod, amountType, autoPay, intervalMonths, nextDueMonth, addedMonth };
            }
        } else {
            const nextDueMonth = intervalMonths > 1 ? (startMonthKey ?? currentMonthKey()) : undefined;
            recurringCosts.push({ id: Date.now().toString(), name, amount, dueDay, category, paymentMethod, amountType, autoPay, intervalMonths, nextDueMonth, addedMonth });
        }

        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        closeCostModal();
        showSavedToast(id ? 'Cost updated ✓' : 'Cost added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save cost.');
    }
}

function deleteCost(id) {
    showInlineConfirm(id, 'cost', () => {
        const deleted = recurringCosts.find(c => c.id === id);
        recurringCosts = recurringCosts.filter(c => c.id !== id);
        delete paidStatus[id];
        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        showUndoToast('Recurring cost deleted', () => { recurringCosts.push(deleted); saveData().catch(err => console.error('Debt Snowball: save failed —', err)); });
    });
}

// ─── Spending Budgets ────────────────────────────────────────────────────────

function getBudgetAmount(budget) {
    const exc = budget.exception;
    if (exc && exc.month === (workingMonthKey || currentMonthKey())) return exc.amount;
    return budget.amount;
}

function renderSpendingBudgets() {
    const container = _root.getElementById('budgets-list');
    if (!container) return;

    if (spendingBudgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No spending budgets yet.<br>Track discretionary spending by setting a spending limit for each category.
                <br><button class="empty-cta-btn" id="empty-add-budget-btn">+ Add Your First Budget</button>
            </div>`;
        const emptyBtn = container.querySelector('#empty-add-budget-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openBudgetModal());
        return;
    }

    // Budget meta bar — current month + totals across all budgets
    const now = new Date();
    const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const totalBudgeted = spendingBudgets.reduce((s, b) => s + getBudgetAmount(b), 0);
    const totalSpent    = spendingBudgets.reduce((s, b) => s + (b.expenses || []).reduce((x, e) => x + e.amount, 0), 0);
    const totalOver     = totalSpent - totalBudgeted;
    const metaSpentClass = totalOver > 0 ? 'budget-meta-over' : 'budget-meta-ok';

    const metaBar = `
        <div class="budget-meta-bar">
            <span class="budget-meta-month">📅 ${monthName}</span>
            <div class="budget-meta-divider"></div>
            <span class="budget-meta-budgeted">${spendingBudgets.length} budget${spendingBudgets.length !== 1 ? 's' : ''} · ${formatMoney(totalBudgeted)} total limit</span>
            <span class="budget-meta-total">
                <span class="budget-meta-budgeted">Spent:</span>
                <span class="${metaSpentClass}">${formatMoney(totalSpent)}</span>
                ${totalOver > 0
                    ? `<span class="budget-meta-over" style="font-size:0.75rem;">⚠ ${formatMoney(totalOver)} over</span>`
                    : `<span class="budget-meta-ok" style="font-size:0.75rem;">${formatMoney(totalBudgeted - totalSpent)} left</span>`}
            </span>
        </div>`;

    const cards = spendingBudgets.map((budget, cardIdx) => {
        const budgetAmt  = getBudgetAmount(budget);
        const expenses   = budget.expenses || [];
        const spent      = expenses.reduce((s, e) => s + e.amount, 0);
        const over       = spent - budgetAmt;
        const isOver     = over > 0;
        const rawPct     = budgetAmt > 0 ? (spent / budgetAmt) * 100 : (spent > 0 ? 100 : 0);
        const barPct     = Math.min(rawPct, 100);
        const isExpanded = expandedBudgets.has(budget.id);
        const showInline = inlineExpenseBudget === budget.id;
        const hasExc     = budget.exception?.month === (workingMonthKey || currentMonthKey());

        // Gradient fill for premium look
        let fillGradient;
        if (isOver) {
            fillGradient = 'linear-gradient(90deg, var(--danger-color), #f87171)';
        } else if (rawPct < 70) {
            fillGradient = 'linear-gradient(90deg, var(--success-color), #34d399)';
        } else if (rawPct < 90) {
            fillGradient = 'linear-gradient(90deg, var(--warning-color), #fbbf24)';
        } else {
            fillGradient = 'linear-gradient(90deg, #f87171, var(--danger-color))';
        }

        const expenseRows = expenses.length === 0
            ? `<p class="budget-empty-text">No expenses logged yet.</p>`
            : [...expenses].sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1).map(exp => `
                <div class="budget-expense-row" data-expense-id="${exp.id}">
                    <span class="expense-description">${escHtml(exp.description)}</span>
                    <span class="expense-date">${exp.date ? new Date(exp.date + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'}) : ''}</span>
                    <span class="expense-amount" style="color:var(--expense-color);">−${formatMoney(exp.amount)}</span>
                    <div class="expense-actions">
                        <button class="btn-icon btn-edit-expense" data-budget-id="${budget.id}" data-expense-id="${exp.id}" title="Edit">✎</button>
                        <button class="btn-icon btn-delete-expense" data-budget-id="${budget.id}" data-expense-id="${exp.id}" title="Delete">✕</button>
                    </div>
                </div>`).join('');

        const totalRow = expenses.length > 0 ? `
            <div class="budget-total-row ${isOver ? 'budget-total-over' : 'budget-total-ok'}">
                <span>${formatMoney(spent)} / ${formatMoney(budgetAmt)}</span>
                ${isOver
                    ? `<span style="color:var(--danger-color); font-weight:700;">⚠ Over by ${formatMoney(over)}</span>`
                    : `<span style="color:var(--success-color);">${formatMoney(budgetAmt - spent)} remaining</span>`}
            </div>` : '';

        // Inline add-expense form (shown instead of modal for new expenses)
        const inlineForm = showInline ? `
            <div class="inline-expense-form">
                <div class="inline-expense-form-row">
                    <div class="inline-field field-desc">
                        <label>Description</label>
                        <input type="text" class="inline-desc" placeholder="e.g. Walmart run" autocomplete="off">
                    </div>
                    <div class="inline-field">
                        <label>Amount ($)</label>
                        <input type="number" class="inline-amount" min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="inline-field">
                        <label>Date</label>
                        <input type="date" class="inline-date" value="${new Date().toISOString().slice(0,10)}">
                    </div>
                    <div class="inline-expense-form-actions">
                        <button class="btn-inline-save" data-budget-id="${budget.id}">Save</button>
                        <button class="btn-inline-cancel" data-budget-id="${budget.id}">✕</button>
                    </div>
                </div>
            </div>` : '';

        const addExpBtn = showInline
            ? `<button class="btn btn-secondary btn-sm btn-toggle-inline-expense" data-budget-id="${budget.id}" style="border-color:rgba(91,127,255,0.4);color:var(--accent-color);">✕ Cancel</button>`
            : `<button class="btn btn-secondary btn-sm btn-toggle-inline-expense" data-budget-id="${budget.id}">+ Add Expense</button>`;

        return `
        <div class="budget-card ${isOver ? 'budget-over' : ''}" data-budget-id="${budget.id}" data-expanded="${isExpanded}" style="animation-delay:${cardIdx * 0.06}s;">
            <div class="budget-card-header" data-toggle-budget="${budget.id}">
                <div class="budget-header-left">
                    <span class="budget-toggle-icon">▶</span>
                    <span class="budget-name">${escHtml(budget.name)}</span>
                    ${hasExc ? `<span class="budget-exception-badge">Override: ${formatMoney(budgetAmt)}</span>` : ''}
                </div>
                <div class="budget-header-right">
                    ${isOver
                        ? `<span class="budget-over-label">⚠ Over ${formatMoney(over)}</span>`
                        : `<span class="budget-remaining">${formatMoney(budgetAmt - spent)} left</span>`}
                    <span class="budget-spent-of">${formatMoney(spent)} / ${formatMoney(budgetAmt)}</span>
                </div>
            </div>
            <div class="budget-progress-track">
                <div class="budget-progress-fill" style="width:${barPct}%; background:${fillGradient};"></div>
            </div>
            ${isExpanded ? `
            <div class="budget-expenses-panel">
                ${expenseRows}
                ${totalRow}
                ${inlineForm}
                <div class="budget-card-actions">
                    ${addExpBtn}
                    <button class="btn btn-sm btn-override btn-override-budget" data-budget-id="${budget.id}">${hasExc ? '✎ Edit' : '⚡ Override'}</button>
                    <button class="btn btn-secondary btn-sm btn-edit-budget" data-budget-id="${budget.id}">✎ Edit</button>
                    <button class="btn btn-secondary btn-sm btn-delete-budget" data-budget-id="${budget.id}" style="margin-left:auto; border-color:var(--danger-color); color:var(--danger-color);">🗑 Delete</button>
                </div>
            </div>` : ''}
        </div>`;
    }).join('');

    container.innerHTML = metaBar + cards;

    // Auto-focus the inline form description field if open
    if (inlineExpenseBudget) {
        const descInput = container.querySelector('.inline-expense-form .inline-desc');
        if (descInput) setTimeout(() => descInput.focus(), 50);
    }
}

// ─── Budget Modal ─────────────────────────────────────────────────────────────
function openBudgetModal(budgetId = null, focusException = false) {
    budgetForm.reset();
    _root.getElementById('budget-id').value = '';
    _root.getElementById('budget-exception-amount-group').style.display = 'none';
    _root.getElementById('budget-exception-toggle').checked = false;

    if (budgetId) {
        _root.getElementById('budget-modal-title').textContent = 'Edit Budget';
        const budget = spendingBudgets.find(b => b.id === budgetId);
        if (budget) {
            _root.getElementById('budget-id').value     = budget.id;
            _root.getElementById('budget-name').value   = budget.name;
            _root.getElementById('budget-amount').value = budget.amount;
            const hasExc = budget.exception?.month === currentMonthKey();
            if (hasExc || focusException) {
                _root.getElementById('budget-exception-toggle').checked = true;
                _root.getElementById('budget-exception-amount-group').style.display = '';
                if (hasExc) _root.getElementById('budget-exception-amount').value = budget.exception.amount;
            }
        }
    } else {
        _root.getElementById('budget-modal-title').textContent = 'Add Budget';
    }

    budgetModal.style.display = 'flex';
    void budgetModal.offsetWidth;
    budgetModal.classList.add('active');
    setTimeout(() => budgetModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeBudgetModal() {
    budgetModal.classList.remove('active');
    setTimeout(() => { budgetModal.style.display = 'none'; }, 300);
}

function saveBudget() {
    try {
        const id     = _root.getElementById('budget-id').value;
        const name   = _root.getElementById('budget-name').value.trim();
        const amount = parseFloat(_root.getElementById('budget-amount').value);
        const useExc = _root.getElementById('budget-exception-toggle').checked;
        const excAmt = parseFloat(_root.getElementById('budget-exception-amount').value);

        if (!name)       throw new Error('Please enter a category name.');
        if (isNaN(amount) || amount < 0) throw new Error('Please enter a valid budget amount.');
        if (useExc && (isNaN(excAmt) || excAmt < 0)) throw new Error('Please enter a valid override amount.');

        const _wk = workingMonthKey || currentMonthKey();
        const exception = useExc ? { month: _wk, amount: excAmt } : null;

        if (id) {
            const idx = spendingBudgets.findIndex(b => b.id === id);
            if (idx !== -1) {
                // Preserve existing expenses; only replace exception when toggle was used
                const existing = spendingBudgets[idx];
                const newException = useExc ? { month: _wk, amount: excAmt }
                    : (existing.exception?.month === _wk ? null : existing.exception);
                spendingBudgets[idx] = { ...existing, name, amount, exception: newException };
            }
        } else {
            spendingBudgets.push({ id: Date.now().toString(), name, amount, exception, expenses: [] });
        }

        saveData().catch(err => console.error('Debt Snowball: save failed —', err));
        closeBudgetModal();
        renderSpendingBudgets();
        showSavedToast(id ? 'Budget updated ✓' : 'Budget added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save budget.');
    }
}

function deleteBudget(id) {
    const budget = spendingBudgets.find(b => b.id === id);
    if (!budget) return;
    if (!confirm(`Delete the "${budget.name}" budget and all its expenses for this month?`)) return;
    spendingBudgets = spendingBudgets.filter(b => b.id !== id);
    expandedBudgets.delete(id);
    saveData().catch(err => console.error('Debt Snowball: save failed —', err));
    renderSpendingBudgets();
    showSavedToast('Budget deleted ✓');
}

// ─── Expense Modal ────────────────────────────────────────────────────────────
function openExpenseModal(budgetId, expenseId = null) {
    expenseForm.reset();
    _root.getElementById('expense-budget-id').value = budgetId;
    _root.getElementById('expense-id').value = '';

    const budget = spendingBudgets.find(b => b.id === budgetId);
    const budgetLabel = budget ? ` — ${budget.name}` : '';

    if (expenseId) {
        _root.getElementById('expense-modal-title').textContent = `Edit Expense${budgetLabel}`;
        const exp = budget?.expenses?.find(e => e.id === expenseId);
        if (exp) {
            _root.getElementById('expense-id').value          = exp.id;
            _root.getElementById('expense-description').value = exp.description;
            _root.getElementById('expense-amount').value      = exp.amount;
            _root.getElementById('expense-date').value        = exp.date || '';
        }
    } else {
        _root.getElementById('expense-modal-title').textContent = `Add Expense${budgetLabel}`;
        // Default date to today
        _root.getElementById('expense-date').value = new Date().toISOString().slice(0, 10);
    }

    expenseModal.style.display = 'flex';
    void expenseModal.offsetWidth;
    expenseModal.classList.add('active');
    setTimeout(() => expenseModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeExpenseModal() {
    expenseModal.classList.remove('active');
    setTimeout(() => { expenseModal.style.display = 'none'; }, 300);
}

function saveExpense() {
    try {
        const budgetId    = _root.getElementById('expense-budget-id').value;
        const expenseId   = _root.getElementById('expense-id').value;
        const description = _root.getElementById('expense-description').value.trim();
        const amount      = parseFloat(_root.getElementById('expense-amount').value);
        const date        = _root.getElementById('expense-date').value;

        if (!description)          throw new Error('Please enter a description.');
        if (isNaN(amount) || amount < 0) throw new Error('Please enter a valid amount.');

        const budget = spendingBudgets.find(b => b.id === budgetId);
        if (!budget) throw new Error('Budget not found.');

        if (!budget.expenses) budget.expenses = [];

        if (expenseId) {
            const idx = budget.expenses.findIndex(e => e.id === expenseId);
            if (idx !== -1) budget.expenses[idx] = { id: expenseId, description, amount, date };
        } else {
            budget.expenses.push({ id: Date.now().toString(), description, amount, date });
        }

        saveData().catch(err => console.error('Debt Snowball: save failed —', err));
        closeExpenseModal();
        expandedBudgets.add(budgetId);
        renderSpendingBudgets();
        showSavedToast(expenseId ? 'Expense updated ✓' : 'Expense added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save expense.');
    }
}

function deleteExpense(budgetId, expenseId) {
    const budget = spendingBudgets.find(b => b.id === budgetId);
    if (!budget) return;
    const deleted = budget.expenses.find(e => e.id === expenseId);
    if (!deleted) return;
    budget.expenses = budget.expenses.filter(e => e.id !== expenseId);
    saveData().catch(err => console.error('Debt Snowball: save failed —', err));
    renderSpendingBudgets();
    showUndoToast('Expense deleted', () => {
        budget.expenses.push(deleted);
        saveData().catch(err => console.error('Debt Snowball: save failed —', err));
        renderSpendingBudgets();
    });
}

// ─── CRUD: Income ────────────────────────────────────────────────────────────
function saveIncome() {
    try {
        const id           = _root.getElementById('income-id').value;
        const label        = _root.getElementById('income-label').value;
        const date         = _root.getElementById('income-date').value;
        const amount       = parseFloat(_root.getElementById('income-amount').value);
        const scheduleType = _root.getElementById('income-schedule').value || 'one-time';

        if (!label.trim()) throw new Error('Please enter a label for this income entry.');
        if (!date)         throw new Error('Please select a date.');
        if (isNaN(amount)) throw new Error('Please enter a valid amount.');

        const entryBase = { label, date, amount, scheduleType };
        if (scheduleType === 'monthly')   entryBase.scheduleDay = parseInt(date.split('-')[2]);
        if (scheduleType === 'biweekly')  entryBase.scheduleAnchorDate = date;

        if (id) {
            const idx = incomeEntries.findIndex(e => e.id === id);
            if (idx !== -1) incomeEntries[idx] = { id, ...entryBase };
        } else if (scheduleType === 'biweekly') {
            const generated = generateBiweeklyForMonth(label, amount, date, workingMonthKey || currentMonthKey());
            if (generated.length === 0) throw new Error('No occurrences of this schedule fall in the current month. Choose a date within the current month as the starting point.');
            incomeEntries.push(...generated);
        } else {
            incomeEntries.push({ id: Date.now().toString(), ...entryBase });
        }

        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        closeIncomeModal();
        showSavedToast(id ? 'Income updated ✓' : 'Income added ✓');
    } catch (err) {
        showErrorToast(err.message || 'Failed to save income entry.');
    }
}

function deleteIncome(id) {
    showInlineConfirm(id, 'income', () => {
        const deleted = incomeEntries.find(e => e.id === id);
        incomeEntries = incomeEntries.filter(e => e.id !== id);
        saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        showUndoToast('Income entry deleted', () => { incomeEntries.push(deleted); saveData().catch(err => console.error('Debt Snowball: save failed —', err)); });
    });
}

// ─── Paid-this-month toggle ───────────────────────────────────────────────────
function togglePaid(id, autoPay) {
    const wasUnpaid = !paidStatus[id];
    if (paidStatus[id]) {
        delete paidStatus[id];
    } else {
        paidStatus[id] = autoPay ? 'autopay' : 'paid';
        if (wasUnpaid && debts.find(d => d.id === id)) {
            launchConfetti();
        }
    }
    // Micro-animation on the card being toggled
    const card = _root.querySelector(`.debt-card[data-cost-id="${id}"], .debt-card .btn-mark-paid-action[data-id="${id}"]`)
        ?.closest('.debt-card');
    if (card) {
        card.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
        card.style.transform  = 'scale(0.99)';
        card.style.opacity    = '0.8';
        setTimeout(() => {
            card.style.transform = '';
            card.style.opacity   = '';
        }, 160);
    }
    saveData().catch(err => console.error('Debt Snowball: save failed —', err));
    renderRecurringCostsList();
    renderDebtsList(runSimulation(strategy));
}

// ─── Inline Confirm & Undo Toast ─────────────────────────────────────────────
function showInlineConfirm(id, type, onConfirm) {
    const selector = type === 'debt' ? '.btn-delete' : type === 'cost' ? '.btn-delete-cost' : '.btn-delete-income';
    const btn      = _root.querySelector(`${selector}[data-id="${id}"]`);
    if (!btn) return;

    const actions      = btn.parentElement;
    const originalHTML = actions.innerHTML;

    actions.innerHTML = `
        <span class="confirm-text">Are you sure?</span>
        <button class="btn btn-danger btn-confirm-yes" data-id="${id}">Delete</button>
        <button class="btn btn-secondary btn-confirm-no">Cancel</button>`;

    actions.querySelector('.btn-confirm-yes').addEventListener('click', onConfirm);
    actions.querySelector('.btn-confirm-no').addEventListener('click', () => {
        actions.innerHTML = originalHTML;
        const editBtn   = actions.querySelector('.btn-edit, .btn-edit-cost, .btn-edit-income');
        const deleteBtn = actions.querySelector('.btn-delete, .btn-delete-cost, .btn-delete-income');
        if (editBtn)   { const fn = type==='debt'?openDebtModal:type==='cost'?openCostModal:openIncomeModal; editBtn.addEventListener('click', e=>fn(e.target.dataset.id)); }
        if (deleteBtn) { const fn = type==='debt'?deleteDebt:type==='cost'?deleteCost:deleteIncome; deleteBtn.addEventListener('click', e=>fn(e.target.dataset.id)); }
    });
}

let undoToastTimer = null;
function showUndoToast(message, onUndo) {
    const existing = _root.getElementById('undo-toast');
    if (existing) existing.remove();
    if (undoToastTimer) clearTimeout(undoToastTimer);

    const toast     = document.createElement('div');
    toast.id        = 'undo-toast';
    toast.className = 'undo-toast';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span><button class="undo-toast-btn">Undo</button>`;
    _root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    toast.querySelector('.undo-toast-btn').addEventListener('click', () => { onUndo(); dismissToast(toast); });
    undoToastTimer = setTimeout(() => dismissToast(toast), 5000);
}

function dismissToast(toast) {
    toast.classList.remove('undo-toast-visible');
    setTimeout(() => toast.remove(), 300);
}

function showSavedToast(message) {
    const existing = _root.getElementById('saved-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'saved-toast';
    toast.className = 'undo-toast undo-toast-success';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    _root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 2500);
}

function showErrorToast(message) {
    const existing = _root.getElementById('error-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'error-toast';
    toast.className = 'undo-toast undo-toast-error';
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    _root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 4000);
}

// ─── Export / Import ─────────────────────────────────────────────────────────
function exportData() {
    const dataStr = JSON.stringify({ debts, incomeEntries, recurringCosts, checkpoints, strategy }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link    = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `debt-snowball-backup-${new Date().toISOString().split('T')[0]}.json`);
    link.click();
}

function importData(e) {
    const file    = e.target.files[0];
    if (!file) return;
    const hasData = debts.length > 0 || recurringCosts.length > 0 || incomeEntries.length > 0;

    const doImport = () => {
        const reader = new FileReader();
        reader.onload = async ev => {
            let data;
            try {
                data = JSON.parse(ev.target.result);
            } catch {
                showNotificationToast('Error: Invalid backup file — could not parse JSON.', 'error');
                return;
            }
            try {
                if (data.debts)          debts          = data.debts;
                if (data.recurringCosts) recurringCosts = data.recurringCosts;
                if (data.incomeEntries)  incomeEntries  = data.incomeEntries;
                if (data.checkpoints)    checkpoints    = data.checkpoints;
                if (data.strategy)       strategy       = data.strategy;
                if (data.monthlyBudget !== undefined && !data.incomeEntries) {
                    const now = new Date();
                    incomeEntries = [{ id: Date.now().toString(), label: 'Monthly Budget (migrated)',
                        date: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`,
                        amount: data.monthlyBudget }];
                }
                await saveData();
                location.reload();
            } catch (err) {
                console.error('Debt Snowball: import save failed —', err);
                showNotificationToast('Error: Data parsed but could not be saved to server.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    hasData ? showImportConfirmModal(doImport, () => { e.target.value = ''; }) : doImport();
}

function showImportConfirmModal(onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className    = 'modal active';
    overlay.style.zIndex = '200';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header"><h3>⚠️ Replace Existing Data?</h3></div>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.5rem;line-height:1.6;">
                Importing will <strong style="color:var(--text-primary);">replace all your current data</strong>. Export a backup first if needed.
            </p>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end;flex-wrap:wrap;">
                <button class="btn btn-secondary" id="import-cancel-btn">Cancel</button>
                <button class="btn btn-secondary" id="import-export-first-btn">Export First, then Import</button>
                <button class="btn btn-danger"    id="import-confirm-btn">Replace Anyway</button>
            </div>
        </div>`;
    _root.appendChild(overlay);
    overlay.querySelector('#import-cancel-btn').addEventListener('click',       () => { overlay.remove(); onCancel(); });
    overlay.querySelector('#import-export-first-btn').addEventListener('click', () => { exportData(); overlay.remove(); onConfirm(); });
    overlay.querySelector('#import-confirm-btn').addEventListener('click',      () => { overlay.remove(); onConfirm(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); onCancel(); } });
}

function showNotificationToast(message, type = 'info') {
    const existing = _root.getElementById('notif-toast');
    if (existing) existing.remove();
    const toast     = document.createElement('div');
    toast.id        = 'notif-toast';
    toast.className = `undo-toast undo-toast-${type}`;
    toast.innerHTML = `<span class="undo-toast-msg">${message}</span>`;
    _root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('undo-toast-visible'));
    setTimeout(() => dismissToast(toast), 4000);
}

// ─── HA Sensor Bridge ────────────────────────────────────────────────────────
function updateHASensors(simResults, schedule) {
    if (!_root._hass) return; // Safety check: Ensure HA object exists

    // 1. Push Total Debt Sensor
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    _root._hass.callApi('POST', 'states/sensor.snowball_total_debt', {
        state: totalDebt.toFixed(2),
        attributes: {
            friendly_name: 'Total Remaining Debt',
            unit_of_measurement: _root._currency || 'USD',
            icon: 'mdi:cash-multiple'
        }
    });

    // 2. Push Payoff Date Sensor
    if (simResults && simResults.valid && simResults.monthsElapsed < 1200) {
        const today = new Date();
        const payoffDate = new Date(today.getFullYear(), today.getMonth() + simResults.monthsElapsed, 1);
        _root._hass.callApi('POST', 'states/sensor.snowball_payoff_date', {
            state: payoffDate.toISOString().split('T')[0],
            attributes: {
                friendly_name: 'Debt Free Date',
                device_class: 'date',
                icon: 'mdi:calendar-star'
            }
        });
    }

    // 3. Push Next Upcoming Payment Sensor
    if (schedule && schedule.length > 0) {
        const currentDay = new Date().getDate();
        // Find the next unpaid debt in the schedule that is due today or later
        const nextPayment = schedule.find(item => 
            item.type === 'debt' && 
            !paidStatus[item.id] && 
            item.day >= currentDay
        );

        if (nextPayment) {
            _root._hass.callApi('POST', 'states/sensor.snowball_next_payment', {
                state: nextPayment.amount.toFixed(2),
                attributes: {
                    friendly_name: 'Next Debt Payment',
                    unit_of_measurement: _root._currency || 'USD',
                    debt_name: nextPayment.name,
                    due_day: nextPayment.day,
                    icon: 'mdi:calendar-clock'
                }
            });
        } else {
            // All caught up for the month!
            _root._hass.callApi('POST', 'states/sensor.snowball_next_payment', {
                state: '0.00',
                attributes: {
                    friendly_name: 'Next Debt Payment',
                    debt_name: 'All Caught Up!',
                    icon: 'mdi:check-circle'
                }
            });
        }
    }
}

// ─── Rendering ───────────────────────────────────────────────────────────────
function renderUI() {
    // Render checkpoints list
    renderCheckpointsList();

    _root.querySelectorAll('.strategy-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.strategy === strategy);
    });
    renderIncomeList();
    renderRecurringCostsList();
    renderSpendingBudgets();
    
    const simResults = runSimulation(strategy);
    renderDebtsList(simResults);
    renderVisualization(simResults);
    
    const schedule = renderPaymentPlan();

    // Only update HA sensors from current-month data; renderPaymentPlan returns null in archive view
    if (schedule !== null) updateHASensors(simResults, schedule);
}

function formatOrdinal(day) {
    const s = ['th','st','nd','rd'], v = day % 100;
    return day + (s[(v-20)%10] || s[v] || s[0]);
}

function formatMoney(n) {
    // Pull the currency and language we caught in Step 1. 
    // (_root is your panel instance where we saved them)
    const currency = _root._currency || 'USD';
    const language = _root._language || undefined; // undefined falls back to browser default

    try {
        return new Intl.NumberFormat(language, {
            style: 'currency',
            currency: currency,
            // These ensure you always get $0.00 instead of $0
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2
        }).format(n);
    } catch (e) {
        // Safe fallback just in case the browser doesn't recognize the currency code
        return Number(n).toLocaleString(language, { 
            style: 'currency', 
            currency: 'USD' 
        });
    }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Income List ─────────────────────────────────────────────────────────────
function renderIncomeList() {
    incomeListContainer.innerHTML = '';
    const summaryEl = _root.getElementById('income-summary');

    if (incomeEntries.length === 0) {
        incomeListContainer.innerHTML = `
            <div class="empty-state">
                No income entries yet.<br>Add your paychecks and other income for this month.
                <br><button class="empty-cta-btn" id="empty-add-income-btn">+ Add Income</button>
            </div>`;
        incomeListContainer.style.display = 'block';
        summaryEl.style.display = 'none';
        const emptyBtn = incomeListContainer.querySelector('#empty-add-income-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openIncomeModal());
        return;
    }

    incomeListContainer.style.display = 'grid';
    const sorted = [...incomeEntries.sort((a,b) => a.date.localeCompare(b.date))];

    sorted.forEach((entry, idx) => {
        const dateStr = new Date(entry.date+'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' });
        const el = document.createElement('div');
        el.className = 'debt-card income-card';
        el.style.animation = `cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards ${idx * 0.08}s`;
        el.innerHTML = `
            <div class="income-compact-inner">
                <div class="income-compact-info">
                    <span class="income-compact-name">${escHtml(entry.label)}</span>
                    <span class="income-compact-date">${dateStr}</span>
                </div>
                <div class="income-compact-right">
                    <span class="income-compact-amount">${formatMoney(entry.amount)}</span>
                    <button class="btn btn-xs btn-secondary btn-edit-income" data-id="${entry.id}">Edit</button>
                    <button class="btn btn-xs btn-danger btn-delete-income" data-id="${entry.id}">Delete</button>
                </div>
            </div>`;
        incomeListContainer.appendChild(el);
    });

    incomeListContainer.querySelectorAll('.btn-edit-income').forEach(b   => b.addEventListener('click', e => openIncomeModal(e.target.dataset.id)));
    incomeListContainer.querySelectorAll('.btn-delete-income').forEach(b => b.addEventListener('click', e => deleteIncome(e.target.dataset.id)));

    const total = incomeEntries.reduce((s,e) => s + e.amount, 0);
    summaryEl.style.display = 'block';
    summaryEl.innerHTML = `<span class="income-summary-label">Total Monthly Income:</span><span class="income-summary-value">${formatMoney(total)}</span>`;
}

// ─── Recurring Costs List ────────────────────────────────────────────────────
function renderRecurringCostsList() {
    costsListContainer.innerHTML = '';
    const recurringSummaryEl = _root.getElementById('recurring-summary');

    // Only show costs due this month — handles one-times (by addedMonth), interval costs,
    // and the edge case of the page staying open across a month boundary without a reload.
    const visibleCosts    = recurringCosts.filter(isCostDueThisMonth);
    const totalRecurring  = visibleCosts.reduce((sum, c) => sum + c.amount, 0);
    const directRecurring = visibleCosts.filter(c => c.paymentMethod === 'direct').reduce((sum, c) => sum + c.amount, 0);
    const cardRecurring   = visibleCosts.filter(c => c.paymentMethod === 'card').reduce((sum, c) => sum + c.amount, 0);
    if (recurringSummaryEl) {
        recurringSummaryEl.innerHTML = `<span class="recurring-due-label">Due This Month</span><span class="recurring-due-total">$${totalRecurring.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span><span class="recurring-due-breakdown">🏦 Direct ${formatMoney(directRecurring)} &nbsp;·&nbsp; 💳 Card ${formatMoney(cardRecurring)}</span>`;
    }

    if (visibleCosts.length === 0) {
        costsListContainer.innerHTML = `
            <div class="empty-state">
                No recurring costs yet.<br>Add your bills, subscriptions, and utilities.
                <br><button class="empty-cta-btn" id="empty-add-cost-btn">+ Add Recurring Cost</button>
            </div>`;
        costsListContainer.style.display = 'block';
        const emptyBtn = costsListContainer.querySelector('#empty-add-cost-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openCostModal());
        return;
    }

    costsListContainer.style.display = 'block';
    const sorted = [...visibleCosts].sort((a,b) => (a.dueDay||1) - (b.dueDay||1));
    const currentDay = new Date().getDate();

    const categories = [
        { key: 'utility',      label: '⚡ Utilities (Monthly Bills)',              cls: 'cost-subsection-utility' },
        { key: 'subscription', label: '📱 Subscriptions (Recurring Services)',    cls: 'cost-subsection-subscription' },
        { key: 'other',        label: '📦 Other Recurring Bills',                  cls: 'cost-subsection-other' },
        { key: 'one-time',     label: '🔴 ONE-TIME EXPENSES (This Month Only)',   cls: 'cost-subsection-onetime' },
    ];

    let cardIndex = 0;
    categories.forEach(({ key, label, cls }) => {
        const group = sorted.filter(c => (c.category || 'other') === key);
        if (group.length === 0) return;

        const section = document.createElement('div');
        section.className = `cost-subsection ${cls}`;

        const isCompact     = key === 'utility' || key === 'subscription';
        const isCollapsible = isCompact;
        const isExpanded    = expandedCostSections.has(key);
        const groupActive   = group.filter(isCostDueThisMonth);
        const groupTotal    = groupActive.reduce((s, c) => s + c.amount, 0);
        const totalSuffix   = key === 'one-time' ? '' : '/mo';

        const header = document.createElement('div');
        header.className = 'cost-subsection-header' + (isCollapsible ? ' cost-section-collapsible' : '');
        if (isCollapsible) header.dataset.toggleSection = key;
        const toggleIcon = isCollapsible
            ? `<span class="cost-section-toggle-icon${isExpanded ? '' : ' collapsed'}">▼</span>`
            : '';
        header.innerHTML = `<span style="display:flex;align-items:center;gap:0.25rem;">${toggleIcon}${label}</span><span class="cost-subsection-total">${formatMoney(groupTotal)}${totalSuffix}</span>`;
        section.appendChild(header);

        if (!isCollapsible || isExpanded) {
            const grid = document.createElement('div');
            grid.className = 'debts-list';
            grid.style.display = 'grid';
            if (isCompact) {
                grid.style.gridTemplateColumns = '1fr';
                grid.style.gap = '0.4rem';
            }

            group.forEach(cost => {
                const isPastDue = (cost.dueDay || 1) <= currentDay;
                const isCard    = cost.paymentMethod === 'card';
                const isDue     = isCostDueThisMonth(cost);
                const intN      = cost.intervalMonths || 1;
                const isOneTime = key === 'one-time';
                const paidState = paidStatus[cost.id];

                const paymentMethodBadge = isCard
                    ? '<span class="debt-type-badge card-badge">💳 Card</span>'
                    : '<span class="debt-type-badge direct-badge">🏦 Direct</span>';
                const amountTypeBadge = (cost.amountType || 'fixed') === 'flexible'
                    ? '<span class="amount-type-badge flexible-badge">〜 Flexible</span>'
                    : '';
                // Frequency badge - more prominent
                let freqBadge;
                if (isOneTime) {
                    freqBadge = '<span class="interval-badge" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);">🔴 ONE-TIME</span>';
                } else if (intN > 1) {
                    freqBadge = `<span class="interval-badge">${intervalLabel(intN)}</span>`;
                } else {
                    freqBadge = '<span class="interval-badge" style="background:rgba(99,102,241,0.1);color:var(--primary-light);border:1px solid rgba(99,102,241,0.25);">📅 Monthly</span>';
                }
                const notDueBadge = (!isDue && intN > 1)
                    ? `<span class="not-due-badge">Next: ${formatMonthLabel(cost.nextDueMonth)}</span>` : '';
                const autoBadge   = (!isOneTime && cost.autoPay) ? '<span class="autopay-badge">⚡ Auto-Pay</span>' : '';
                const paidOverlay = paidState ? buildPaidOverlay(cost.autoPay) : '';
                // Due frequency text
                let dueFreq;
                if (isOneTime) {
                    dueFreq = 'One-Time Only';
                } else if (intN > 1) {
                    dueFreq = intervalLabel(intN).replace('📆 ', '');
                } else {
                    dueFreq = 'Monthly';
                }

                const el = document.createElement('div');
                el.style.animation = `cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards ${cardIndex * 0.08}s`;
                cardIndex++;

                if (isCompact) {
                    el.className = 'debt-card cost-card cost-card-compact' +
                        (isCard ? ' cost-card-credit' : ' cost-card-direct') +
                        (paidState ? ' card-paid' : '') +
                        (isDue ? '' : ' not-due-month');
                    const badgesHtml = [freqBadge, paymentMethodBadge, amountTypeBadge, autoBadge, notDueBadge].filter(Boolean).join('');
                    const metaParts  = [`Due ${formatOrdinal(cost.dueDay || 1)}`, `Repeats: ${dueFreq}`].filter(Boolean);
                    el.innerHTML = `
                        ${paidOverlay}
                        <div class="cost-compact-body">
                            <div class="cost-compact-info">
                                <div class="cost-compact-name-row">
                                    <span class="cost-compact-name">${escHtml(cost.name)}</span>
                                    <span class="cost-amount cost-compact-amount">${formatMoney(cost.amount)}</span>
                                </div>
                                ${badgesHtml ? `<div class="cost-compact-badges">${badgesHtml}</div>` : ''}
                                <div class="cost-compact-meta">${metaParts.map((p, i) => i < metaParts.length - 1 ? `<span>${p}</span><span class="cost-meta-dot">·</span>` : `<span>${p}</span>`).join('')}</div>
                            </div>
                            <div class="cost-compact-actions">
                                ${isDue ? `<div class="cost-compact-paid">${buildPaidButton(cost.id, cost.autoPay, paidState, isPastDue)}</div>` : ''}
                                <div class="cost-mini-actions">
                                    <button class="btn-icon btn-edit-cost" data-id="${cost.id}" title="Edit">✎</button>
                                    <button class="btn-icon btn-delete-cost" data-id="${cost.id}" title="Delete">✕</button>
                                </div>
                            </div>
                        </div>`;
                } else {
                    el.className = 'debt-card cost-card' +
                        (isCard ? ' cost-card-credit' : ' cost-card-direct') +
                        (paidState ? ' card-paid' : '') +
                        (isDue ? '' : ' not-due-month') +
                        (isOneTime ? ' cost-card-onetime' : '');
                    const badgesHtml = [freqBadge, paymentMethodBadge, amountTypeBadge, autoBadge, notDueBadge].filter(Boolean).join('');
                    const amountLabel = isOneTime ? 'One-Time Amount' : (intN > 1 ? 'Amount' : 'Monthly Amount');
                    const paymentMethodLabel = isCard ? 'Credit / Debit Card' : 'Direct Pay (Bank / Cash)';
                    const dueValue = `${formatOrdinal(cost.dueDay||1)} (${dueFreq})`;
                    el.innerHTML = `
                        ${paidOverlay}
                        <div class="debt-name">${escHtml(cost.name)}</div>
                        ${badgesHtml ? `<div class="cost-badges-line">${badgesHtml}</div>` : ''}
                        <div class="debt-detail"><span class="debt-detail-label">${amountLabel}</span><span class="debt-detail-value cost-amount">${formatMoney(cost.amount)}</span></div>
                        <div class="debt-detail"><span class="debt-detail-label">Due</span><span class="debt-detail-value">${dueValue}</span></div>
                        <div class="debt-detail"><span class="debt-detail-label">Payment</span><span class="debt-detail-value">${paymentMethodLabel}</span></div>
                        <div class="paid-action-row">${isDue ? buildPaidButton(cost.id, cost.autoPay, paidState, isPastDue) : ''}</div>
                        <div class="cost-icon-actions">
                            <button class="btn-icon btn-edit-cost" data-id="${cost.id}" title="Edit">✎</button>
                            <button class="btn-icon btn-delete-cost" data-id="${cost.id}" title="Delete">✕</button>
                        </div>`;
                }
                grid.appendChild(el);
            });

            section.appendChild(grid);
        }
        costsListContainer.appendChild(section);
    });

    costsListContainer.querySelectorAll('.btn-edit-cost').forEach(b   => b.addEventListener('click', e => openCostModal(e.target.dataset.id)));
    costsListContainer.querySelectorAll('.btn-delete-cost').forEach(b => b.addEventListener('click', e => deleteCost(e.target.dataset.id)));
    costsListContainer.querySelectorAll('.btn-mark-paid').forEach(b   => b.addEventListener('click', e => togglePaid(e.currentTarget.dataset.id, e.currentTarget.dataset.autopay === 'true')));
}

// Section collapse/expand — delegated on the container so it survives re-renders

// ─── Debts List ──────────────────────────────────────────────────────────────
function renderDebtsList(simResults) {
    debtsListContainer.innerHTML = '';
    const debtsSummaryEl    = _root.getElementById('debts-summary');
    const mortgageToggleBtn = _root.getElementById('mortgage-toggle-btn');

    // ── Archive-view wiring ────────────────────────────────────────────────────
    const isArchiveView = viewingArchiveIndex !== null && !!monthlyArchives[viewingArchiveIndex];
    const archiveData   = isArchiveView ? monthlyArchives[viewingArchiveIndex] : null;
    const _debts        = archiveData ? (archiveData.debts || debts) : debts;
    const _paidStatus   = archiveData ? (archiveData.paidStatus || {}) : paidStatus;

    const hasMortgage = _debts.some(d => d.type === 'mortgage');
    if (mortgageToggleBtn) {
        mortgageToggleBtn.style.display = hasMortgage ? '' : 'none';
        mortgageToggleBtn.textContent   = showMortgage ? 'Hide Mortgage' : 'Show Mortgage';
    }

    if (_debts.length === 0) {
        if (debtsSummaryEl) debtsSummaryEl.textContent = 'Total Debt: $0.00';
        debtsListContainer.innerHTML = `
            <div class="empty-state">
                No debts added yet.<br>Add your credit cards, loans, and other debts to start your payoff plan.
                <br><button class="empty-cta-btn" id="empty-add-debt-btn">+ Add Debt</button>
            </div>`;
        debtsListContainer.style.display = 'block';
        const emptyBtn = debtsListContainer.querySelector('#empty-add-debt-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openDebtModal());
        return;
    }

    const totalDebt = _debts.reduce((sum, d) => sum + d.balance, 0);
    if (debtsSummaryEl) {
        debtsSummaryEl.textContent = `Total Debt: $${totalDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    debtsListContainer.style.display = 'block';
    const ordered    = getStrategyOrder(_debts, strategy);
    const currentDay = new Date().getDate();

    // Apply mortgage filter; keep global order index for order badge numbers
    const visible = showMortgage ? ordered : ordered.filter(d => d.type !== 'mortgage');

    const promoDebts   = visible.filter(d => d.promoZeroInterest);
    const regularDebts = visible.filter(d => !d.promoZeroInterest);

    // The "target" debt is the first in the full visible list
    const targetId = visible[0]?.id;

    function buildDebtCard(debt, globalIdx) {
        const isPastDue    = (debt.dueDay || 1) <= currentDay;
        const payoffMonths = simResults?.debtPayoffMonths?.[debt.id];
        const isTarget     = debt.id === targetId;
        const paidState    = _paidStatus[debt.id];

        const debtElt = document.createElement('div');
        debtElt.className = 'debt-card' +
            (debt.promoZeroInterest ? ' promo-card' : '') +
            (paidState ? ' card-paid' : '') +
            (isTarget ? ' snowball-target-card' : '');
        debtElt.style.animation = `cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards ${globalIdx * 0.09}s`;

        const promoBadge = debt.promoZeroInterest ? '<span class="promo-badge">🎉 0% Promo</span>' : '';
        const autoBadge  = debt.autoPay ? '<span class="autopay-badge">⚡ Auto-Pay</span>' : '';

        const typeLabel = debt.type
            ? debt.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
            : '';
        const typeIcon = debt.type === 'credit-card' ? '💳'
            : debt.type === 'personal-loan' ? '🤝'
            : debt.type === 'student-loan' ? '🎓'
            : debt.type === 'auto-loan' ? '🚗'
            : debt.type === 'mortgage' ? '🏠'
            : '📌';
        const typeBadge = debt.type
            ? `<span class="debt-type-badge ${debt.type === 'credit-card' ? 'card-badge' : ''}">${typeIcon} ${typeLabel}</span>`
            : '';

        let promoExpiryRow = '';
        if (debt.promoZeroInterest && debt.promoExpiryDate) {
            const expStr = new Date(debt.promoExpiryDate+'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
            promoExpiryRow = `<div class="debt-detail"><span class="debt-detail-label">Promo Expires</span><span class="debt-detail-value promo-expiry-value">${expStr}</span></div>`;
        }

        const rateDisplay = debt.promoZeroInterest
            ? '0% APR <span class="promo-auto-note">(promo)</span>'
            : `${debt.rate}% APR`;

        const minPayNote = debt.promoZeroInterest ? '<span class="promo-auto-note">(auto: payoff by promo end)</span>' : '';

        const payoffLine = payoffMonths != null
            ? `<div class="debt-detail payoff-months-row">
                <span class="debt-detail-label">Paid off in</span>
                <span class="debt-detail-value payoff-months-value">${payoffMonths} month${payoffMonths !== 1 ? 's' : ''}</span>
               </div>`
            : '';

        const targetBadge = isTarget
            ? `<div class="snowball-target-banner">${strategy === 'snowball' ? '❄️' : '🌊'} ${strategy === 'snowball' ? 'Snowball' : 'Avalanche'} Target — extra payments go here</div>`
            : '';

        const payUrlRow = debt.paymentUrl
            ? `<div class="debt-detail debt-pay-url-row">
                <a href="${escHtml(debt.paymentUrl)}" target="_blank" rel="noopener noreferrer" class="btn-pay-now">Pay Now →</a>
               </div>`
            : '';

        const paidOverlay = paidState ? buildPaidOverlay(debt.autoPay) : '';

        debtElt.innerHTML = `
            ${paidOverlay}
            <div class="debt-order-badge" title="${strategy === 'snowball' ? 'Payoff order: smallest balance first' : 'Payoff order: highest interest first'}">${globalIdx + 1}</div>
            <div class="debt-name">${escHtml(debt.name)}</div>
            <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.35rem;">${typeBadge}${promoBadge}${autoBadge}</div>
            ${targetBadge}
            <div class="debt-detail debt-balance-row"><span class="debt-detail-label">Balance</span><span class="debt-detail-value debt-balance-value">${formatMoney(debt.balance)}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Interest Rate</span><span class="debt-detail-value">${rateDisplay}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Min Payment</span><span class="debt-detail-value">${formatMoney(debt.minPayment)} ${minPayNote}</span></div>
            <div class="debt-detail"><span class="debt-detail-label">Due Day</span><span class="debt-detail-value">${formatOrdinal(debt.dueDay||1)} of each month</span></div>
            ${promoExpiryRow}
            ${payoffLine}
            ${payUrlRow}
            <div class="paid-action-row">${buildPaidButton(debt.id, debt.autoPay, paidState, isPastDue)}</div>
            <div class="debt-actions">
                <button class="btn btn-secondary btn-edit" data-id="${debt.id}">Edit</button>
                <button class="btn btn-danger btn-delete" data-id="${debt.id}">Delete</button>
            </div>`;

        return debtElt;
    }

    function appendSection(debtsSubset, globalOffset, headerEl) {
        const wrapper = document.createElement('div');
        if (headerEl) wrapper.appendChild(headerEl);
        const grid = document.createElement('div');
        grid.className = 'debts-list';
        grid.style.display = 'grid';
        debtsSubset.forEach((debt, i) => grid.appendChild(buildDebtCard(debt, globalOffset + i)));
        wrapper.appendChild(grid);
        debtsListContainer.appendChild(wrapper);
    }

    if (promoDebts.length > 0) {
        const header = document.createElement('div');
        header.className = 'promo-section-header';
        const promoTotal = promoDebts.reduce((s, d) => s + d.balance, 0);
        header.innerHTML = `<span>🎉 0% Promo — Pay Off Before Rate Jumps!</span><span>${formatMoney(promoTotal)}</span>`;
        appendSection(promoDebts, 0, header);
    }

    if (regularDebts.length > 0) {
        let header = null;
        if (promoDebts.length > 0) {
            header = document.createElement('div');
            header.className = 'regular-section-header';
            header.textContent = '📋 Standard Debts';
        }
        appendSection(regularDebts, promoDebts.length, header);
    }

    debtsListContainer.querySelectorAll('.btn-edit').forEach(b   => b.addEventListener('click', e => openDebtModal(e.target.dataset.id)));
    debtsListContainer.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', e => deleteDebt(e.target.dataset.id)));
    debtsListContainer.querySelectorAll('.btn-mark-paid').forEach(b => b.addEventListener('click', e => togglePaid(e.currentTarget.dataset.id, e.currentTarget.dataset.autopay === 'true')));
}

function buildPaidButton(id, autoPay, paidState, isPastDue) {
    if (paidState) {
        return `<button class="btn btn-paid-undo btn-mark-paid" data-id="${id}" data-autopay="${!!autoPay}">✓ Paid this month — tap to undo</button>`;
    }
    if (autoPay) {
        if (isPastDue) {
            return `<button class="btn btn-mark-paid" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; font-weight: 600; width: 100%; font-size: 0.8rem; padding: 0.5rem 1rem;" data-id="${id}" data-autopay="true">⚡ Auto-Paid</button>`;
        } else {
            return `<button class="btn" disabled style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); width: 100%; font-size: 0.8rem; padding: 0.5rem 1rem; cursor: not-allowed;">⚡ Scheduled for Auto-Pay</button>`;
        }
    }
    return `<button class="btn btn-mark-paid-action btn-mark-paid" data-id="${id}" data-autopay="false">Mark as Paid This Month</button>`;
}

function buildPaidOverlay(autoPay) {
    // We only show an overlay once it has actually been paid/confirmed
    return `
        <div class="paid-overlay">
            <span class="paid-overlay-icon">✓</span>
            <span class="paid-overlay-text">Paid This Month</span>
        </div>`;
}

// ─── Strategy Sorting ────────────────────────────────────────────────────────
function getStrategyOrder(debtList, strat) {
    const copy = [...debtList];
    if (strat === 'avalanche') {
        copy.sort((a,b) => {
            const ra = a.promoZeroInterest ? (a.originalRate || 0) : a.rate;
            const rb = b.promoZeroInterest ? (b.originalRate || 0) : b.rate;
            return rb - ra || a.balance - b.balance;
        });
    } else {
        copy.sort((a,b) => a.balance - b.balance);
    }
    return copy;
}

// ─── Core Simulation ─────────────────────────────────────────────────────────
// Date-aware: income arrives on its specific day-of-month, payments are only
// made after sufficient cash has arrived. Returns a rich result object used
// for both the chart and the debt cards.
function runSimulation(strat) {
    const totalIncome         = incomeEntries.reduce((s,e) => s + e.amount, 0);
    const activeCosts          = recurringCosts.filter(isCostDueThisMonth);
    // For timeline projection, exclude one-time costs from effectiveBudget calculation
    // since they only apply to this month, not future months being simulated.
    const monthlyCostsOnly     = activeCosts.filter(c => (c.category || 'other') !== 'one-time');
    const totalRecurringDirect = monthlyCostsOnly.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurringCard   = monthlyCostsOnly.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurring       = monthlyCostsOnly.reduce((s,c) => s + c.amount, 0);
    // Only direct-payment costs reduce the immediate cash available for debt payoff;
    // card-charged costs are already folded into the card's minimum payment.
    // Note: one-time costs are excluded because timeline projects multi-month future.
    const effectiveBudget = totalIncome - totalRecurringDirect;

    if (debts.length === 0 || totalIncome <= 0 || effectiveBudget <= 0) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget };
    }

    const totalMinPayments = debts.reduce((s,d) => s + d.minPayment, 0);
    if (effectiveBudget < totalMinPayments) {
        return { valid: false, totalIncome, totalRecurring, effectiveBudget, belowMin: true, totalMinPayments };
    }

    // Build income day schedule (sorted)
    const incomeDays = [...incomeEntries
        .map(e => ({ day: parseInt(e.date.split('-')[2]), amount: e.amount }))
        .sort((a,b) => a.day - b.day)];

    let simDebts = debts.map(d => ({ ...d, interestPaid: 0 }));
    const MAX_MONTHS = 1200;
    let monthsElapsed     = 0;
    let totalInterestPaid = 0;
    let payoffLog         = [];

    // Per-debt monthly balance snapshots
    const perDebtMonthly = {};
    simDebts.forEach(d => { perDebtMonthly[d.id] = [d.balance]; });

    // Get day 1 checkpoint amount for initial cash
    const day1Checkpoint = checkpoints.find(cp => cp.day === 1);
    const day1Balance = day1Checkpoint ? day1Checkpoint.amount : 0;

    while (simDebts.some(d => d.balance > 0) && monthsElapsed < MAX_MONTHS) {
        monthsElapsed++;
        // Add starting cash in first month to the monthly available amount
        let availableCash = effectiveBudget + (monthsElapsed === 1 ? day1Balance : 0); // eslint-disable-line no-unused-vars

        // 1. Accrue interest
        simDebts.forEach(d => {
            if (d.balance <= 0) return;
            let effectiveRate = d.rate;
            if (d.promoZeroInterest && d.promoExpiryDate) {
                const today   = new Date();
                const simDate = new Date(today.getFullYear(), today.getMonth() + monthsElapsed, 1);
                if (simDate <= new Date(d.promoExpiryDate+'T00:00:00')) effectiveRate = 0;
                else effectiveRate = d.originalRate || d.rate;
            }
            const interest     = d.balance * (effectiveRate / 100 / 12);
            d.balance         += interest;
            totalInterestPaid += interest;
            d.interestPaid    += interest;
        });

        // 2. Date-aware payment scheduling
        const alive    = simDebts.filter(d => d.balance > 0);
        const ordered  = getStrategyOrder(alive, strat);
        const targetId = ordered[0]?.id;
        const aliveMinSum   = alive.reduce((s,d) => s + d.minPayment, 0);
        const extraAvail    = Math.max(0, effectiveBudget - aliveMinSum);

        // Build payment queue sorted by due day
        const paymentQueue = alive.map(d => ({
            id:     d.id,
            dueDay: d.dueDay || 1,
            needed: Math.min(
                d.balance,
                d.minPayment + (d.id === targetId ? Math.min(extraAvail, Math.max(0, d.balance - d.minPayment)) : 0)
            )
        })).sort((a,b) => a.dueDay - b.dueDay);

        let cashPool   = 0;
        let incomeIdx  = 0;

        for (const payment of paymentQueue) {
            // Advance income whose day <= payment due day
            while (incomeIdx < incomeDays.length && incomeDays[incomeIdx].day <= payment.dueDay) {
                cashPool += incomeDays[incomeIdx++].amount;
            }
            // If still short, pull remaining income (payment deferred until next check)
            while (cashPool < payment.needed && incomeIdx < incomeDays.length) {
                cashPool += incomeDays[incomeIdx++].amount;
            }

            const debt   = simDebts.find(d => d.id === payment.id);
            if (!debt || debt.balance <= 0) continue;
            const actual = Math.min(payment.needed, cashPool, debt.balance);
            cashPool    -= actual;
            debt.balance = Math.max(0, debt.balance - actual);

            if (debt.balance <= 0.01) {
                debt.balance = 0;
                if (!payoffLog.find(l => l.id === debt.id)) {
                    payoffLog.push({ ...debt, payoffMonth: monthsElapsed });
                }
            }
        }

        // Snapshot balances this month
        simDebts.forEach(d => {
            perDebtMonthly[d.id].push(Math.max(0, d.balance));
        });
    }

    const debtPayoffMonths = {};
    payoffLog.forEach(l => { debtPayoffMonths[l.id] = l.payoffMonth; });

    const maxLen = Math.max(...Object.values(perDebtMonthly).map(a => a.length));
    const monthlyTotals = Array.from({ length: maxLen }, (_,i) =>
        Object.values(perDebtMonthly).reduce((sum, arr) => sum + (arr[i ?? 0]), 0)
    );

    return {
        valid: true,
        monthsElapsed,
        totalInterestPaid,
        payoffLog,
        monthlyTotals,
        perDebtMonthly,
        debtPayoffMonths,
        totalIncome,
        totalRecurring,
        effectiveBudget
    };
}

// ─── Visualization ───────────────────────────────────────────────────────────
function renderVisualization(simResults) {
    const statTotalDebt     = _root.getElementById('stat-total-debt');
    const statTotalInterest = _root.getElementById('stat-total-interest');
    const statSavingsBox    = _root.getElementById('stat-savings-box');
    const statSavings       = _root.getElementById('stat-savings');
    const statSavingsLabel  = _root.getElementById('stat-savings-label');
    const stratDesc         = _root.getElementById('strategy-desc');
    const timelineChart     = _root.getElementById('timeline-chart');
    const countdownBox      = _root.getElementById('stat-countdown-box');
    const payoffBoxAlt      = _root.getElementById('stat-payoff-box');
    const windfallBar       = _root.getElementById('windfall-bar');

    // Get archive data if in archive view
    const isArchiveViewTimeline = viewingArchiveIndex !== null && !!monthlyArchives[viewingArchiveIndex];
    const archiveDataForDebt = isArchiveViewTimeline ? monthlyArchives[viewingArchiveIndex] : null;
    const debtsForCalc = archiveDataForDebt ? (archiveDataForDebt.debts || debts) : debts;
    
    const initialTotalDebt = debtsForCalc.reduce((s,d) => s + d.balance, 0);
    statTotalDebt.textContent = formatMoney(initialTotalDebt);

    stratDesc.textContent = strategy === 'snowball'
        ? 'Snowball: paying the smallest balance first. Quick wins build momentum and keep you motivated.'
        : 'Avalanche: paying the highest interest rate first. Mathematically optimal — minimises total interest paid.';

    // Show archive notice for historical months
    if (isArchiveViewTimeline) {
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        _root.getElementById('stat-payoff-date-alt').textContent = 'Historical Data';
        statTotalInterest.textContent = '-';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        stopCountdown();
        
        const totalDebtArchive = (archiveDataForDebt.debts || []).reduce((s,d) => s + d.balance, 0);
        
        timelineChart.innerHTML = `
            <div class="timeline-error-card" style="background: linear-gradient(145deg, rgba(91,127,255,0.08) 0%, rgba(168,85,247,0.05) 100%); border-color: rgba(91,127,255,0.2);">
                <span class="timeline-error-icon">📅</span>
                <div class="timeline-error-title">${formatMonthLabel(archiveDataForDebt.month)}</div>
                <div class="timeline-error-message">
                    This is a historical view. The timeline projection shows future payoff estimates based on <strong>current</strong> data, not historical snapshots.<br><br>
                    <strong>Total Debt this month:</strong> ${formatMoney(totalDebtArchive)}<br>
                    <strong>Income:</strong> ${formatMoney(archiveDataForDebt.totalIncome || 0)}<br>
                    <strong>Costs:</strong> ${formatMoney(archiveDataForDebt.totalCosts || 0)}
                </div>
                <div class="timeline-error-actions">
                    <button class="btn btn-primary" onclick="document.getElementById('plan-next-month-btn').click()">📅 Return to Current Month</button>
                </div>
            </div>`;
        renderPaydownChart([], {});
        return;
    }

    if (debts.length === 0) {
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        _root.getElementById('stat-payoff-date-alt').textContent = '-';
        statTotalInterest.textContent = '$0.00';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        timelineChart.innerHTML = `
            <div class="timeline-error-card">
                <span class="timeline-error-icon">📊</span>
                <div class="timeline-error-title">No Debts Added</div>
                <div class="timeline-error-message">Add your credit cards, loans, and other debts to see your personalized payoff timeline and calculate your debt-free date.</div>
                <div class="timeline-error-actions">
                    <button class="btn btn-primary" onclick="document.querySelector('[data-tab=\"debts\"]').click()">💳 Add Your First Debt</button>
                </div>
            </div>`;
        renderPaydownChart([], {});
        stopCountdown();
        return;
    }

    if (!simResults.valid) {
        const { totalIncome, totalRecurring, effectiveBudget, totalMinPayments } = simResults;
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        _root.getElementById('stat-payoff-date-alt').textContent = 'Budget Too Low!';
        statTotalInterest.textContent = 'N/A';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        stopCountdown();
        
        let icon = '⚠️';
        let title = '';
        let message = '';
        let primaryAction = '';
        let secondaryAction = '';
        
        if ((totalIncome || 0) <= 0) {
            icon = '💰';
            title = 'No Income Added';
            message = 'You need to add income entries before we can calculate your payoff timeline. Tell us about your paychecks, deposits, or any other monthly income.';
            primaryAction = `<button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click(); setTimeout(() => document.getElementById('add-income-btn').click(), 100)">➕ Add Income</button>`;
        } else if ((effectiveBudget || 0) <= 0) {
            const _active              = recurringCosts.filter(isCostDueThisMonth);
            const _monthlyOnly         = _active.filter(c => (c.category || 'other') !== 'one-time');
            const totalRecurringDirect = _monthlyOnly.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
            const totalRecurringCard   = _monthlyOnly.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
            icon = '📉';
            title = 'Budget Over-Committed';
            message = `Your income of ${formatMoney(totalIncome)} is entirely consumed by direct recurring costs of ${formatMoney(totalRecurringDirect)}.${totalRecurringCard > 0 ? ` (Card-charged costs of ${formatMoney(totalRecurringCard)} are already factored into card payments.)` : ''} You need to either increase income or reduce costs to free up money for debt payoff.`;
            primaryAction = `<button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click()">💰 Add Income</button>`;
            secondaryAction = `<button class="btn btn-warning" onclick="document.querySelector('[data-tab=\"income\"]').click()">📝 Review Costs</button>`;
        } else {
            icon = '💳';
            title = 'Can\'t Cover Minimum Payments';
            message = `Your effective budget of ${formatMoney(effectiveBudget)} is less than your total minimum payments of ${formatMoney(totalMinPayments)}. You need more available cash to make progress on your debts.`;
            primaryAction = `<button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click()">💰 Increase Income</button>`;
            secondaryAction = `<button class="btn btn-secondary" onclick="document.querySelector('[data-tab=\"debts\"]').click()">📉 Review Debts</button>`;
        }
        
        timelineChart.innerHTML = `
            <div class="timeline-error-card">
                <span class="timeline-error-icon">${icon}</span>
                <div class="timeline-error-title">${title}</div>
                <div class="timeline-error-message">${message}</div>
                <div class="timeline-error-actions">
                    ${primaryAction}
                    ${secondaryAction}
                </div>
            </div>`;
        renderPaydownChart([], {});
        return;
    }

    if (simResults.monthsElapsed >= 1200) {
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        _root.getElementById('stat-payoff-date-alt').textContent = '> 100 Years';
        statTotalInterest.textContent = 'Too High';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        stopCountdown();
        timelineChart.innerHTML = `
            <div class="timeline-error-card">
                <span class="timeline-error-icon">⏰</span>
                <div class="timeline-error-title">Payoff Exceeds 100 Years</div>
                <div class="timeline-error-message">With your current budget, these debts would take over 100 years to pay off. This usually means either the balances are very high compared to your available payoff budget, or interest rates are preventing progress.</div>
                <div class="timeline-error-actions">
                    <button class="btn btn-success" onclick="document.querySelector('[data-tab=\"income\"]').click()">💰 Increase Budget</button>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-tab=\"debts\"]').click()">📉 Review Debts</button>
                </div>
            </div>`;
        return;
    }

    const today      = new Date();
    const payoffDate = new Date(today.getFullYear(), today.getMonth() + simResults.monthsElapsed, 1);
    lastSimPayoffDate = payoffDate;
    statTotalInterest.textContent = formatMoney(simResults.totalInterestPaid);

    // Countdown box
    countdownBox.style.display = 'block';
    payoffBoxAlt.style.display = 'none';
    windfallBar.style.display  = 'flex';
    _root.getElementById('stat-payoff-date').textContent =
        payoffDate.toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' });
    startCountdown(payoffDate);

    // Compare against the other strategy
    const otherStrat  = strategy === 'snowball' ? 'avalanche' : 'snowball';
    const otherLabel  = otherStrat.charAt(0).toUpperCase() + otherStrat.slice(1);
    const otherResult = runSimulation(otherStrat);
    if (otherResult.valid) {
        const interestDiff = otherResult.totalInterestPaid - simResults.totalInterestPaid;
        statSavingsBox.style.display  = 'block';
        statSavingsLabel.textContent  = `vs. ${otherLabel}`;
        if (interestDiff > 0.01) {
            statSavings.textContent = `Save ${formatMoney(interestDiff)}`;
            statSavings.style.color = 'var(--success-color)';
        } else if (interestDiff < -0.01) {
            statSavings.textContent = `${formatMoney(Math.abs(interestDiff))} more interest`;
            statSavings.style.color = 'var(--warning-color)';
        } else {
            statSavings.textContent = 'Same cost';
            statSavings.style.color = 'var(--text-secondary)';
        }
    } else {
        statSavingsBox.style.display = 'none';
    }

    renderTimelineChart(simResults.payoffLog, simResults.monthsElapsed);
    renderPaydownChart(simResults.monthlyTotals, simResults.perDebtMonthly);
}
// ─── Per-Debt Paydown Chart ──────────────────────────────────────────────────
const DEBT_COLORS = [
    { border: 'rgba(59,130,246,1)',  bg: 'rgba(59,130,246,0.08)'  },
    { border: 'rgba(16,185,129,1)',  bg: 'rgba(16,185,129,0.08)'  },
    { border: 'rgba(245,158,11,1)',  bg: 'rgba(245,158,11,0.08)'  },
    { border: 'rgba(239,68,68,1)',   bg: 'rgba(239,68,68,0.08)'   },
    { border: 'rgba(168,85,247,1)',  bg: 'rgba(168,85,247,0.08)'  },
    { border: 'rgba(236,72,153,1)',  bg: 'rgba(236,72,153,0.08)'  },
    { border: 'rgba(20,184,166,1)',  bg: 'rgba(20,184,166,0.08)'  },
    { border: 'rgba(249,115,22,1)',  bg: 'rgba(249,115,22,0.08)'  },
];

function renderPaydownChart(monthlyTotals, perDebtMonthly) {
    const canvas = _root.getElementById('paydown-chart');
    if (!canvas) return;

    if (paydownChart) { try { paydownChart.destroy(); } catch(e) {} paydownChart = null; }

    const maxLen = monthlyTotals.length;
    if (maxLen === 0) { canvas.style.height = '0'; return; }
    canvas.style.height = '300px';

    const labels = monthlyTotals.map((_,i) => {
        const d = new Date();
        d.setMonth(d.getMonth() + i + 1);
        return d.toLocaleDateString(undefined, { month:'short', year:'numeric' });
    });

    const datasets = [];
    const orderedDebts = getStrategyOrder(debts, strategy);

    orderedDebts.forEach((debt, idx) => {
        const color  = DEBT_COLORS[idx % DEBT_COLORS.length];
        const series = perDebtMonthly[debt.id] || [];
        const data   = Array.from({ length: maxLen }, (_,i) => Number((series[i ?? 0]).toFixed(2)));
        datasets.push({
            label:           debt.name,
            data,
            borderColor:     color.border,
            backgroundColor: color.bg,
            fill:            true,
            tension:         0.3,
            pointRadius:     0,
            borderWidth:     2,
        });
    });

    // Dashed total line
    datasets.push({
        label:           'Total Remaining',
        data:            monthlyTotals.map(v => Number(v.toFixed(2))),
        borderColor:     'rgba(248,250,252,0.4)',
        backgroundColor: 'transparent',
        fill:            false,
        tension:         0.3,
        pointRadius:     0,
        borderWidth:     1.5,
        borderDash:      [5,4],
    });

    paydownChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            interaction:         { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 16 }
                },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}` } }
            },
            scales: {
                x: { display: true, ticks: { color: '#64748b', maxTicksLimit: 10 }, grid: { color: 'rgba(51,65,85,0.4)' } },
                y: { display: true, ticks: { color: '#64748b', callback: v => '$'+Number(v).toLocaleString() }, grid: { color: 'rgba(51,65,85,0.4)' } }
            }
        }
    });
}

// ─── Timeline Chart ──────────────────────────────────────────────────────────
function renderTimelineChart(payoffLog, totalMonths) {
    const timelineChart = _root.getElementById('timeline-chart');
    timelineChart.innerHTML = '';
    const today = new Date();
    payoffLog.sort((a,b) => a.payoffMonth - b.payoffMonth);

    payoffLog.forEach((log, idx) => {
        const d          = new Date(today.getFullYear(), today.getMonth() + log.payoffMonth, 1);
        const dateString = d.toLocaleDateString(undefined, { month:'short', year:'numeric' });
        const pct        = Math.min(100, Math.max(0, (log.payoffMonth / totalMonths) * 100));
        const color      = DEBT_COLORS[idx % DEBT_COLORS.length];

        const item = document.createElement('div');
        item.className    = 'timeline-item';
        item.style.animation = `fadeIn 0.5s ease backwards ${idx * 0.1}s`;
        item.innerHTML = `
            <div class="timeline-header">
                <span class="timeline-name">${escHtml(log.name)}</span>
                <span class="timeline-date">Paid off ${dateString} · ${log.payoffMonth} mo</span>
            </div>
            <div class="timeline-interest">Interest paid: ${formatMoney(log.interestPaid)}</div>
            <div class="progress-track">
                <div class="progress-fill" style="width:0%;background:${color.border};transition:width 1s cubic-bezier(0.4,0,0.2,1) ${0.2+idx*0.1}s;"></div>
            </div>`;
        timelineChart.appendChild(item);
        setTimeout(() => { const f = item.querySelector('.progress-fill'); if(f) f.style.width=`${pct}%`; }, 50);
    });
}

// ─── Payment Plan ─────────────────────────────────────────────────────────────
function renderPaymentPlan() {
    const section = _root.getElementById('payment-plan-section');
    const list    = _root.getElementById('payment-plan-list');

    // ── Archive-view wiring ────────────────────────────────────────────────────
    const isArchiveView = viewingArchiveIndex !== null && !!monthlyArchives[viewingArchiveIndex];
    const archiveData   = isArchiveView ? monthlyArchives[viewingArchiveIndex] : null;
    const _income       = archiveData ? (archiveData.incomeEntries  || []) : incomeEntries;
    const _costs        = archiveData ? (archiveData.recurringCosts || []) : recurringCosts;
    const _checkpoints  = archiveData ? (archiveData.checkpoints    || []) : checkpoints;
    const _debts        = archiveData ? (archiveData.debts           || debts) : debts;
    const _startBal     = archiveData ? (archiveData.startingBalance || 0)  : startingBalance;
    const _paidStatus   = archiveData ? (archiveData.paidStatus      || {}) : paidStatus;
    const _monthKey     = archiveData ? archiveData.month : (workingMonthKey || currentMonthKey());

    // ── Month title & navigation ───────────────────────────────────────────────
    const monthTitleEl = _root.getElementById('global-month-title');
    const prevBtn      = _root.getElementById('plan-prev-month-btn');
    const nextBtn      = _root.getElementById('plan-next-month-btn');

    const monthDisplay = formatMonthLabel(_monthKey);
    if (monthTitleEl) monthTitleEl.textContent = monthDisplay;

    if (prevBtn) {
        const prevIdx = isArchiveView ? viewingArchiveIndex + 1 : 0;
        if (prevIdx < monthlyArchives.length) {
            prevBtn.style.visibility = 'visible';
            prevBtn.dataset.archiveIdx = prevIdx;
        } else {
            prevBtn.style.visibility = 'hidden';
        }
    }
    if (nextBtn) nextBtn.style.visibility = isArchiveView ? 'visible' : 'hidden';

    list.innerHTML = '';

    if (_income.length === 0 && _checkpoints.length === 0) { section.style.display = 'none'; return; }

    const events = [];
    const today = new Date();
    const currentDay = today.getDate();

    _income.forEach(entry => {
        const day = parseInt(entry.date.split('-')[2]);
        events.push({ type:'income', id: entry.id, name: entry.label, day, date: new Date(entry.date+'T00:00:00'), amount: entry.amount, sortKey: day * 1000 });
    });

    _checkpoints.forEach(cp => {
        // Sortkey +0.5 ensures checkpoints happen AFTER standard income on that day, but BEFORE bills are paid.
        events.push({ type: 'checkpoint', id: cp.id, name: 'Bank Balance Sync', day: cp.day, amount: cp.amount, sortKey: cp.day * 1000 + 0.5 });
    });

    _costs.filter(c => isCostDueInMonth(c, _monthKey)).forEach(cost => {
        const day = cost.dueDay || 1;
        events.push({
            type:'recurring',
            id: cost.id,
            name: cost.name,
            day,
            amount: cost.amount,
            paymentMethod: cost.paymentMethod || 'direct',
            amountType: cost.amountType || 'fixed',
            autoPay: !!cost.autoPay,
            sortKey: day * 1000 + 1
        });
    });

    const sortedDebts   = getStrategyOrder(_debts.filter(d => d.balance > 0), strategy);
    const _overrides    = isArchiveView ? {} : minPayOverrides;
    const totalMinPay   = sortedDebts.reduce((s,d) => s + (_overrides[d.id] ?? d.minPayment), 0);
    const totalInc      = _income.reduce((s,e) => s + e.amount, 0);
    const totalRec      = _costs.filter(c => isCostDueInMonth(c, _monthKey)).reduce((s,c) => s + c.amount, 0);
    const extra         = Math.max(0, totalInc - totalRec - totalMinPay);
    const targetId      = sortedDebts[0]?.id;

    sortedDebts.forEach(debt => {
        const day      = debt.dueDay || 1;
        const isTarget = debt.id === targetId;
        const effMin   = _overrides[debt.id] ?? debt.minPayment;
        const amount   = isTarget ? Math.min(debt.balance, effMin + extra) : Math.min(debt.balance, effMin);
        const hasOverride = debt.id in _overrides;
        events.push({ type:'debt', id: debt.id, name: debt.name, day, amount, minPayment: debt.minPayment, effMin, hasOverride, balance: debt.balance, isSnowballTarget: isTarget, autoPay: !!debt.autoPay, sortKey: day * 1000 + 2 });
    });

    events.sort((a,b) => a.sortKey - b.sortKey);

    // Date-aware scheduling with card-passthrough logic
    // Initial cash = first checkpoint on day 1, or 0 if no day 1 checkpoint
    const day1Checkpoint = _checkpoints.find(cp => cp.day === 1);
    let cashPool       = day1Checkpoint ? day1Checkpoint.amount : 0;
    let incomeReleased = 0;
    const incomeSorted = events.filter(e => e.type === 'income').sort((a,b) => a.day - b.day);
    const schedule     = [];
    const deferred     = [];
    let totalExpenses  = 0;

    const releaseIncomeThroughDay = (day) => {
        while (incomeReleased < incomeSorted.length && incomeSorted[incomeReleased].day <= day) {
            const ev = incomeSorted[incomeReleased++];
            cashPool += ev.amount;
            schedule.push({ ...ev, balance: cashPool });
        }
    };

    for (const ev of events) {
        if (ev.type === 'income') continue;
        releaseIncomeThroughDay(ev.day);

        // Retry deferred items before this one
        const retry = [...deferred];
        deferred.length = 0;
        for (const def of retry) {
            if (cashPool >= def.amount) {
                cashPool -= def.amount; totalExpenses += def.amount;
                schedule.push({ ...def, balance: cashPool, deferred: true });
            } else deferred.push(def);
        }

        // If it's a checkpoint, hard-reset the pool here
        if (ev.type === 'checkpoint') {
            cashPool = ev.amount;
            schedule.push({ ...ev, balance: cashPool });
            continue;
        }

        // Card-method recurring costs bypass the cash pool entirely
        if (ev.type === 'recurring' && ev.paymentMethod === 'card') {
            schedule.push({ ...ev, balance: cashPool, isCard: true });
            continue;
        }

        if (cashPool >= ev.amount) {
            cashPool -= ev.amount; totalExpenses += ev.amount;
            schedule.push({ ...ev, balance: cashPool });
        } else if (cashPool > 0.009 && ev.type === 'debt') {
            const partial    = parseFloat(cashPool.toFixed(2));
            const remainder  = parseFloat((ev.amount - partial).toFixed(2));
            cashPool         = 0;
            totalExpenses   += partial;
            schedule.push({ ...ev, amount: partial, balance: 0, partial: true });
            if (remainder > 0.01) deferred.push({ ...ev, amount: remainder });
        } else {
            deferred.push(ev);
        }
    }

    // Flush remaining income and deferred
    releaseIncomeThroughDay(31);
    for (const def of deferred) {
        if (cashPool >= def.amount) {
            cashPool -= def.amount; totalExpenses += def.amount;
            schedule.push({ ...def, balance: cashPool, deferred: true });
        } else {
            schedule.push({ ...def, balance: cashPool, deferred: true, unpaid: true });
        }
    }

    if (schedule.length === 0) { section.style.display = 'none'; return; }

    // --- MATH ONLY: Cash runway estimate (current month only) ---
    const sortedFutureIncomes = _income
        .map(e => ({ date: new Date(e.date+'T00:00:00'), amount: e.amount, label: e.label }))
        .filter(e => e.date >= today)
        .sort((a,b) => a.date - b.date);
    const nextIncome = sortedFutureIncomes[0] || null;
    const targetDay  = nextIncome ? nextIncome.date.getDate() : 31;

    let testBalance  = _startBal;
    let minProjected = testBalance;

    schedule.forEach(item => {
        const itemDay = item.day || 1;
        if (itemDay < currentDay) return;
        if (nextIncome && itemDay >= targetDay && item.type !== 'income') return;

        if (item.type === 'checkpoint')                       testBalance = item.amount;
        else if (item.type === 'income')                      testBalance += item.amount;
        else if (item.type === 'recurring' && item.isCard) { /* card — no cash impact */ }
        else if (item.type !== 'starting-balance')            testBalance -= item.amount;

        if (testBalance < minProjected) {
            minProjected = testBalance;
        }
    });

    // Update the visual dashboard boxes
    const summaryNext   = _root.getElementById('runway-next-paycheck');
    const summaryMin    = _root.getElementById('runway-min-project');
    const summaryStatus = _root.getElementById('runway-status');

    if (summaryNext)   summaryNext.textContent   = nextIncome ? `${nextIncome.label} (${nextIncome.date.toLocaleDateString(undefined,{month:'short',day:'numeric'})})` : 'None';
    if (summaryMin)    summaryMin.textContent    = formatMoney(minProjected);

    if (summaryStatus) {
        if (minProjected < 0) {
            summaryStatus.innerHTML = '<span style="color:var(--danger-color);">⚠ At Risk (Negative Balance)</span>';
        } else if (minProjected < 100) {
            summaryStatus.innerHTML = '<span style="color:var(--warning-color);">⚠ Low Buffer</span>';
        } else {
            summaryStatus.innerHTML = '<span style="color:var(--success-color);">✓ Safe</span>';
        }
    }

    // --- Month Overview Dashboard ---
    // Calculate month totals
    const totalIncomeVal = _income.reduce((s, e) => s + e.amount, 0);
    // Expenses = direct costs + debt payments (exclude card charges as they don't affect cash)
    const totalDirectCosts = _costs
        .filter(c => isCostDueInMonth(c, _monthKey) && c.paymentMethod !== 'card')
        .reduce((s, c) => s + c.amount, 0);
    const totalDebtPayments = sortedDebts
        .reduce((s, d) => s + (_overrides[d.id] ?? d.minPayment), 0);
    const totalExpensesVal = totalDirectCosts + totalDebtPayments;

    // Next month start = Day 1 balance + all income - all cash expenses
    // If there are checkpoints, use the last checkpoint's balance as the base
    const lastCheckpoint = _checkpoints.length > 0
        ? [..._checkpoints].sort((a, b) => b.day - a.day)[0]
        : null;

    // Calculate final balance through the schedule
    const finalBalance = schedule.length > 0
        ? schedule[schedule.length - 1].balance
        : _startBal;

    // Buffer = cash available before first income of NEXT month
    // Find first income date of next month
    const nextMonthKey = addMonthsToKey(_monthKey, 1);
    const nextMonthFirstDay = new Date(nextMonthKey.split('-')[0], parseInt(nextMonthKey.split('-')[1]), 1);

    // Get income entries that would appear in next month
    const nextMonthIncome = generateRecurringIncomeForMonth(_income, nextMonthKey);
    const firstNextMonthIncome = nextMonthIncome.length > 0
        ? [...nextMonthIncome].sort((a, b) => parseInt(a.date.split('-')[2]) - parseInt(b.date.split('-')[2]))[0]
        : null;

    // Buffer = final balance of this month (this is what carries over)
    const bufferAmount = finalBalance;

    // Populate Month Overview
    const ovStart = _root.getElementById('month-overview-start');
    const ovIncome = _root.getElementById('month-overview-income');
    const ovExpenses = _root.getElementById('month-overview-expenses');
    const ovNextStart = _root.getElementById('month-overview-next-start');
    const ovBuffer = _root.getElementById('month-overview-buffer');

    // Get day 1 checkpoint amount (or 0 if none)
    const day1Cp = _checkpoints.find(cp => cp.day === 1);
    const day1Amount = day1Cp ? day1Cp.amount : 0;
    if (ovStart) ovStart.textContent = formatMoney(day1Amount);
    if (ovIncome) ovIncome.textContent = formatMoney(totalIncomeVal);
    if (ovExpenses) ovExpenses.textContent = formatMoney(totalExpensesVal);
    if (ovNextStart) ovNextStart.textContent = formatMoney(finalBalance);

    if (ovBuffer) {
        // Color-code the buffer
        let bufferColor = 'var(--success-color)';
        let bufferIcon = '🛡️';
        if (bufferAmount < 0) {
            bufferColor = 'var(--danger-color)';
            bufferIcon = '⚠️';
        } else if (bufferAmount < 100) {
            bufferColor = 'var(--warning-color)';
            bufferIcon = '⚡';
        }
        ovBuffer.innerHTML = `<span style="color:${bufferColor};">${bufferIcon} ${formatMoney(bufferAmount)}</span>`;
    }

    // --- Spending Budgets Summary ---
    const ovBudgetsContainer = _root.getElementById('month-overview-budgets');
    const ovBudgetsGrid = _root.getElementById('month-overview-budgets-grid');

    if (ovBudgetsContainer && ovBudgetsGrid && spendingBudgets.length > 0) {
        ovBudgetsContainer.style.display = 'block';

        // Calculate budget status for each
        const budgetSummaries = spendingBudgets.map(budget => {
            const budgeted = getBudgetAmount(budget);
            const spent = (budget.expenses || []).reduce((s, e) => s + e.amount, 0);
            const remaining = budgeted - spent;
            const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            return { name: budget.name, budgeted, spent, remaining, percentUsed };
        });

        // Render grid
        ovBudgetsGrid.innerHTML = budgetSummaries.map(b => {
            const colorClass = b.percentUsed > 100 ? 'color: var(--danger-color);' :
                              b.percentUsed > 80 ? 'color: var(--warning-color);' :
                              'color: var(--success-color);';
            const statusIcon = b.percentUsed > 100 ? '🔴' : b.percentUsed > 80 ? '⚡' : '✓';

            return `
                <div style="background: rgba(7,6,26,0.4); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(99,102,241,0.2);">
                    <div style="font-size: 0.65rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.name}</div>
                    <div style="font-size: 0.9rem; font-weight: 600; ${colorClass}">${statusIcon} ${formatMoney(b.remaining)}</div>
                    <div style="font-size: 0.6rem; color: var(--text-secondary);">of ${formatMoney(b.budgeted)}</div>
                </div>
            `;
        }).join('');

        // Add total row
        const totalBudgeted = budgetSummaries.reduce((s, b) => s + b.budgeted, 0);
        const totalSpent = budgetSummaries.reduce((s, b) => s + b.spent, 0);
        const totalRemaining = totalBudgeted - totalSpent;

        ovBudgetsGrid.innerHTML += `
            <div style="background: rgba(168,85,247,0.1); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(168,85,247,0.3);">
                <div style="font-size: 0.65rem; color: var(--text-secondary);">TOTAL BUDGETS</div>
                <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${formatMoney(totalRemaining)}</div>
                <div style="font-size: 0.6rem; color: var(--text-secondary);">remaining</div>
            </div>
        `;
    } else if (ovBudgetsContainer) {
        ovBudgetsContainer.style.display = 'none';
    }

    section.style.display = 'block';

    // --- UI CREATION: Build the visual rows ---
    let todayMarkerInserted = isArchiveView; // skip in archive view
    schedule.forEach((item, index) => {
        // Insert "Today" marker before the first item on or after today
        if (!todayMarkerInserted && (item.day || 1) >= currentDay) {
            todayMarkerInserted = true;
            const marker = document.createElement('div');
            marker.className = 'schedule-today-marker';
            marker.innerHTML = `<span class="schedule-today-label">Today — ${today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>`;
            list.appendChild(marker);
        }

        const itemPaid = _paidStatus[item.id];
        const row      = document.createElement('div');

        let icon, typeBadge = '', amountClass, dayLabel, rowBgClass;

        if (item.type === 'checkpoint') {
            const isDay1 = item.day === 1;
            icon        = isDay1 ? '🏁' : '⚖️';
            typeBadge   = isDay1
                ? '<span class="schedule-badge schedule-badge-start" style="background:rgba(99,102,241,0.15);color:var(--accent-color);border-color:rgba(99,102,241,0.3);">Day 1 Balance</span>'
                : '<span class="schedule-badge schedule-badge-start" style="background:rgba(168,85,247,0.15);color:var(--promo-light);border-color:rgba(168,85,247,0.3);">Manual Sync</span>';
            amountClass = '';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = isDay1 ? 'schedule-starting' : 'schedule-checkpoint';

        } else if (item.type === 'income') {
            icon        = '💵';
            typeBadge   = '<span class="schedule-badge schedule-badge-income">Deposit</span>';
            amountClass = 'schedule-amount-income';
            dayLabel    = item.date.toLocaleDateString(undefined, { month:'short', day:'numeric' });
            rowBgClass  = 'schedule-income';

        } else if (item.type === 'recurring') {
            const isCard = item.paymentMethod === 'card' || item.isCard;
            icon = isCard ? '💳' : '🏦';

            const methodBadge = isCard
                ? '<span class="schedule-badge card-badge" style="border: 1px solid rgba(99, 102, 241, 0.45);">💳 Card</span>'
                : '<span class="schedule-badge direct-badge" style="border: 1px solid rgba(20, 184, 166, 0.45);">🏦 Direct</span>';

            const amtBadge = item.amountType === 'flexible'
                ? '<span class="schedule-badge flexible-badge">〜 Flexible</span>'
                : '<span class="schedule-badge fixed-badge">= Fixed</span>';

            typeBadge = methodBadge + amtBadge;

            if (item.autoPay && !itemPaid) {
                typeBadge += '<span class="schedule-badge schedule-badge-autopay">⚡ Auto</span>';
            }

            amountClass = 'schedule-amount-expense';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = isCard ? 'schedule-recurring-card' : 'schedule-recurring-direct';

        } else {
            icon        = '🧾';
            const directBadge = '<span class="schedule-badge direct-badge" style="border: 1px solid rgba(20, 184, 166, 0.45);">🏦 Direct</span>';
            const targetBadge = item.isSnowballTarget
                ? `<span class="snowball-badge">${strategy==='snowball'?'❄️':'🌊'} ${strategy==='snowball'?'Snowball':'Avalanche'} Target</span>`
                : '';

            typeBadge = directBadge + targetBadge;

            if (item.autoPay && !itemPaid) {
                typeBadge += '<span class="schedule-badge schedule-badge-autopay">⚡ Auto</span>';
            }

            amountClass = 'schedule-amount-expense';
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = 'schedule-debt';
        }

        row.className  = `schedule-row ${rowBgClass}${itemPaid ? ' schedule-row-paid' : ''}`;
        row.style.animation = `fadeIn 0.4s ease backwards ${index * 0.04}s`;

        let statusBadges = '';
        if (item.deferred) statusBadges += '<span class="schedule-badge schedule-badge-deferred">⏳ Deferred</span>';
        if (item.partial)  statusBadges += '<span class="schedule-badge schedule-badge-partial">⚠ Partial</span>';
        if (item.unpaid)   statusBadges += '<span class="schedule-badge schedule-badge-unpaid">❌ Unpaid</span>';

        let paidBadge = '';
        if (item.type !== 'income' && item.type !== 'checkpoint') {
            if (itemPaid) paidBadge = '<span class="schedule-badge schedule-badge-paid">✓ Paid</span>';
        }

        const sign     = item.type === 'income' ? '+' : (item.type === 'checkpoint') ? '' : '−';
        const balClass = item.balance <= 0 ? 'balance-zero' : item.balance < 500 ? 'balance-low' : 'balance-healthy';

        const amountLabel = item.type === 'income'           ? 'Deposit'
            : item.type === 'checkpoint'                       ? 'Synced to'
            : 'Payment';

        // Archive view is read-only — no edit or mark-paid buttons
        const editBtnHtml = (!isArchiveView)
            ? `<button class="btn-edit-inline" data-id="${item.id}" data-type="${item.type}" title="Edit entry">Edit</button>`
            : '';

        let paidBtnHtml = '';
        if (!isArchiveView && item.type !== 'income' && item.type !== 'checkpoint') {
            const isPastDue = (item.day || 1) <= currentDay;

            if (itemPaid) {
                paidBtnHtml = `<button class="btn-mark-paid btn-mark-paid-done" data-id="${item.id}" data-autopay="${item.autoPay ? '1' : '0'}" title="Mark as unpaid">✓ Paid</button>`;
            } else if (item.autoPay) {
                if (isPastDue) {
                    paidBtnHtml = `<button class="btn-mark-paid" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-color: rgba(245, 158, 11, 0.35);" data-id="${item.id}" data-autopay="1" title="Confirm auto-payment">⚡ Auto-Paid</button>`;
                } else {
                    paidBtnHtml = `<button disabled style="opacity: 0.5; cursor: not-allowed; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); border-radius: 6px; padding: 0.25rem 0.6rem; font-size: 0.75rem; font-weight: 600;">⚡ Scheduled</button>`;
                }
            } else {
                paidBtnHtml = `<button class="btn-mark-paid" data-id="${item.id}" data-autopay="0" title="Mark as paid">Mark Paid</button>`;
            }
        }

        // Override badge + button (debt rows in current month only)
        const overrideBadge = (!isArchiveView && item.type === 'debt' && item.hasOverride)
            ? `<span class="schedule-badge schedule-badge-override" title="Min payment overridden this month">✏ Override</span>`
            : '';

        const overrideBtnHtml = (!isArchiveView && item.type === 'debt')
            ? `<button class="btn-override-min" data-id="${item.id}" data-min="${item.minPayment}" data-current="${item.effMin}" title="${item.hasOverride ? 'Edit or clear override' : 'Override minimum payment'}">${item.hasOverride ? 'Override ✏' : 'Override'}</button>`
            : '';

        // Inline override form (rendered into row, shown/hidden via JS)
        const overrideFormHtml = (!isArchiveView && item.type === 'debt') ? `
            <div class="override-form" id="override-form-${item.id}" style="display:none;">
                <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-top:0.5rem; padding:0.5rem 0.75rem; background:rgba(91,127,255,0.07); border:1px solid rgba(91,127,255,0.25); border-radius:6px;">
                    <span style="font-size:0.78rem; color:var(--text-secondary); white-space:nowrap;">Min payment <span style="color:var(--text-primary);">($${item.minPayment.toFixed(2)})</span> →</span>
                    <input class="override-input" type="number" min="0" step="0.01" placeholder="${item.effMin.toFixed(2)}" value="${item.hasOverride ? item.effMin.toFixed(2) : ''}" style="width:90px; padding:0.2rem 0.4rem; border-radius:4px; border:1px solid rgba(91,127,255,0.4); background:rgba(7,6,26,0.6); color:var(--text-primary); font-size:0.85rem;">
                    <button class="btn-override-save" data-id="${item.id}" style="padding:0.2rem 0.6rem; font-size:0.78rem; font-weight:600; border-radius:4px; border:1px solid rgba(91,127,255,0.5); background:rgba(91,127,255,0.15); color:#c4d0ff; cursor:pointer;">Save</button>
                    ${item.hasOverride ? `<button class="btn-override-clear" data-id="${item.id}" style="padding:0.2rem 0.6rem; font-size:0.78rem; font-weight:600; border-radius:4px; border:1px solid rgba(239,68,68,0.4); background:rgba(239,68,68,0.1); color:#fca5a5; cursor:pointer;">Clear</button>` : ''}
                    <button class="btn-override-cancel" data-id="${item.id}" style="padding:0.2rem 0.5rem; font-size:0.78rem; background:transparent; border:none; color:var(--text-secondary); cursor:pointer;">✕</button>
                </div>
            </div>` : '';

        const detailText = item.type === 'debt' && item.isSnowballTarget ? 'Minimum + Snowball Extra'
            : item.type === 'debt' ? 'Minimum Payment'
            : item.type === 'recurring' && (item.isCard || item.paymentMethod === 'card') ? 'Charged to credit card'
            : item.type === 'recurring' ? 'Paid from bank account'
            : item.type === 'checkpoint' ? 'Resets the running balance for calculations below'
            : '';

        row.innerHTML = `
            <div class="schedule-date-col"><span class="schedule-icon">${icon}</span><span class="schedule-day">${dayLabel}</span></div>
            <div class="schedule-info-col">
                <div class="schedule-name" style="margin-bottom:0.25rem;">${escHtml(item.name)}</div>
                <div class="schedule-badges" style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.25rem;">
                    ${typeBadge} ${statusBadges} ${paidBadge} ${overrideBadge}
                </div>
                <div class="schedule-detail">${detailText}</div>
                ${overrideFormHtml}
            </div>
            <div class="schedule-right-col">
                <div class="schedule-amount-col ${amountClass}"><span class="col-label">${amountLabel}</span>${sign}$${item.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                <div class="schedule-balance-col ${balClass}"><span class="col-label">Balance</span>$${item.balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>

            <div class="schedule-action-col" style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-end; justify-content:center;">
                ${paidBtnHtml}
                ${overrideBtnHtml}
                ${editBtnHtml}
            </div>`;

        list.appendChild(row);
    });

    // If every item was before today (end-of-month edge case), append marker at the bottom
    if (!todayMarkerInserted) {
        const marker = document.createElement('div');
        marker.className = 'schedule-today-marker';
        marker.innerHTML = `<span class="schedule-today-label">Today — ${today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>`;
        list.appendChild(marker);
    }

    const totalIncEl  = _root.getElementById('payment-plan-total-income');
    const totalExpEl  = _root.getElementById('payment-plan-total-expenses');
    const nextMonthEl = _root.getElementById('payment-plan-next-month');

    if (totalIncEl) totalIncEl.textContent = formatMoney(totalInc);
    if (totalExpEl) totalExpEl.textContent = formatMoney(totalExpenses);
    if (nextMonthEl) {
        nextMonthEl.textContent = formatMoney(cashPool);
        nextMonthEl.style.color = cashPool < 0 ? 'var(--danger-color)' : 'var(--text-primary)';
    }
    return isArchiveView ? null : schedule;
}

// ─── Countdown Timer ─────────────────────────────────────────────────────────
function startCountdown(payoffDate) {
    stopCountdown();
    updateCountdownDisplay(payoffDate);
    countdownInterval = setInterval(() => updateCountdownDisplay(payoffDate), 60000);
}
function stopCountdown() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

function updateCountdownDisplay(payoffDate) {
    const el = _root.getElementById('stat-countdown');
    if (!el) return;
    const now  = new Date();
    const diff = payoffDate - now;
    if (diff <= 0) { el.textContent = '🎉 Debt Free!'; return; }
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    el.textContent = days.toLocaleString();
}

// ─── Auto Min-Payment Calculator (Credit Card formula) ───────────────────────
// Standard formula: max($25, 1% of balance + monthly interest)
function calcAutoMin(balance, aprPct) {
    if (!balance || balance <= 0) return null;
    const monthlyInterest = balance * (aprPct / 100 / 12);
    const onePercent      = balance * 0.01;
    return Math.max(25, parseFloat((onePercent + monthlyInterest).toFixed(2)));
}

function autoCalcMinPaymentCC() {
    const balance = parseFloat(_root.getElementById('debt-balance').value) || 0;
    const rate    = parseFloat(_root.getElementById('debt-rate').value) || 0;
    const min     = calcAutoMin(balance, rate);
    if (min !== null) {
        _root.getElementById('debt-min-payment').value = min.toFixed(2);
        showAutoMinHint(min, balance, rate);
    }
}

function updateAutoMinHint() {
    // Only show hint when both fields have values, don't overwrite the field
    const balance = parseFloat(_root.getElementById('debt-balance').value) || 0;
    const rate    = parseFloat(_root.getElementById('debt-rate').value) || 0;
    if (balance > 0 && rate >= 0) {
        const min = calcAutoMin(balance, rate);
        if (min !== null) showAutoMinHint(min, balance, rate);
    } else {
        const hint = _root.getElementById('auto-min-hint');
        hint.style.display = 'none';
    }
}

function showAutoMinHint(min, balance, rate) {
    const hint = _root.getElementById('auto-min-hint');
    hint.textContent  = `Suggested minimum: ${formatMoney(min)} (1% of balance + monthly interest, min $25)`;
    hint.style.display = 'block';
}

// Override promo autoCalcMinPayment to also clear hint
function autoCalcMinPayment() {
    if (!_root.getElementById('debt-promo-toggle').checked) return;
    const balance    = parseFloat(_root.getElementById('debt-balance').value) || 0;
    const expiryDate = _root.getElementById('debt-promo-expiry').value;
    if (!expiryDate || balance <= 0) return;
    const now    = new Date();
    const expiry = new Date(expiryDate + 'T00:00:00');
    const diff   = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    if (diff > 0) {
        _root.getElementById('debt-min-payment').value = (Math.ceil((balance / diff) * 100) / 100).toFixed(2);
    }
    _root.getElementById('auto-min-hint').style.display = 'none';
}

// ─── Windfall Planner ────────────────────────────────────────────────────────
function openWindfallModal() {
    _root.getElementById('windfall-amount').value = '';
    _root.getElementById('windfall-results').style.display = 'none';
    windfallModal.style.display = 'flex';
    void windfallModal.offsetWidth;
    windfallModal.classList.add('active');
    setTimeout(() => _root.getElementById('windfall-amount').focus(), 50);
}

function closeWindfallModal() {
    windfallModal.classList.remove('active');
    setTimeout(() => { windfallModal.style.display = 'none'; }, 300);
}

function calcWindfall() {
    const amount = parseFloat(_root.getElementById('windfall-amount').value);
    if (!amount || amount <= 0) { showNotificationToast('Enter a windfall amount first.', 'error'); return; }

    const baseResult = runSimulation(strategy);
    if (!baseResult.valid) { showNotificationToast('Fix your budget setup first.', 'error'); return; }

    // Run simulation with windfall applied optimally:
    // Distribute across debts in strategy order (strategy target gets it all first,
    // cascading remainder to the next if fully paid off)
    const windfallResult = runSimulationWithWindfall(amount, strategy);

    const today = new Date();
    const baseDateStr   = new Date(today.getFullYear(), today.getMonth() + baseResult.monthsElapsed, 1)
        .toLocaleDateString(undefined, { month:'short', year:'numeric' });
    const afterDateStr  = new Date(today.getFullYear(), today.getMonth() + windfallResult.monthsElapsed, 1)
        .toLocaleDateString(undefined, { month:'short', year:'numeric' });

    _root.getElementById('wf-before-date').textContent     = baseDateStr;
    _root.getElementById('wf-before-interest').textContent = formatMoney(baseResult.totalInterestPaid);
    _root.getElementById('wf-before-months').textContent   = baseResult.monthsElapsed;
    _root.getElementById('wf-after-date').textContent      = afterDateStr;
    _root.getElementById('wf-after-interest').textContent  = formatMoney(windfallResult.totalInterestPaid);
    _root.getElementById('wf-after-months').textContent    = windfallResult.monthsElapsed;

    const monthsSaved    = baseResult.monthsElapsed - windfallResult.monthsElapsed;
    const interestSaved  = baseResult.totalInterestPaid - windfallResult.totalInterestPaid;
    const banner         = _root.getElementById('windfall-savings-banner');

    if (monthsSaved > 0 || interestSaved > 0.01) {
        banner.className   = 'windfall-savings-banner windfall-savings-positive';
        banner.innerHTML   = `🎉 You'd be debt-free <strong>${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner</strong> and save <strong>${formatMoney(interestSaved)}</strong> in interest!`;
    } else {
        banner.className   = 'windfall-savings-banner';
        banner.innerHTML   = `This windfall would fully eliminate your debt — congratulations!`;
    }

    // Show per-debt allocation
    const alloc = _root.getElementById('windfall-allocation');
    alloc.innerHTML = '<div class="windfall-alloc-title">Optimal allocation:</div>';
    windfallResult.allocation.forEach(a => {
        const pct = Math.min(100, (a.applied / amount) * 100);
        alloc.innerHTML += `
            <div class="windfall-alloc-row">
                <span class="windfall-alloc-name">${escHtml(a.name)}</span>
                <span class="windfall-alloc-amount">${formatMoney(a.applied)}</span>
                <div class="windfall-alloc-bar"><div class="windfall-alloc-fill" style="width:${pct}%"></div></div>
            </div>`;
    });

    _root.getElementById('windfall-results').style.display = 'block';
}

function runSimulationWithWindfall(windfall, strat) {
    // Clone debts and apply windfall in strategy order before simulating
    let simDebts = debts.map(d => ({ ...d }));
    const ordered = getStrategyOrder(simDebts, strat);
    let remaining = windfall;
    const allocation = [];

    for (const debt of ordered) {
        if (remaining <= 0) break;
        const apply = Math.min(remaining, debt.balance);
        const live  = simDebts.find(d => d.id === debt.id);
        if (live) { live.balance = Math.max(0, live.balance - apply); }
        allocation.push({ name: debt.name, applied: apply });
        remaining -= apply;
    }

    // Now run the full simulation on the reduced balances
    // Temporarily swap debts, run simulation, restore
    const originalDebts = debts;
    debts = simDebts.filter(d => d.balance > 0.01);
    const result = runSimulation(strat);
    debts = originalDebts;

    result.allocation = allocation;
    return result;
}

// ─── Monthly Check-In Prompt ──────────────────────────────────────────────────
function maybeShowCheckin() {
    if (debts.length === 0) return;
    const dismissed  = localStorage.getItem('snowball_checkin_dismissed');
    const thisMonth  = currentMonthKey();
    if (dismissed === thisMonth) return;

    // Populate debt list in the modal
    const listEl = _root.getElementById('checkin-debt-list');
    listEl.innerHTML = '';
    debts.forEach(d => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;font-size:0.85rem;';
        row.innerHTML = `<span style="color:var(--text-primary);font-weight:500;">${escHtml(d.name)}</span>
                         <span style="color:var(--text-secondary);">Current: ${formatMoney(d.balance)}</span>`;
        listEl.appendChild(row);
    });

    checkinModal.style.display = 'flex';
    void checkinModal.offsetWidth;
    checkinModal.classList.add('active');
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function launchConfetti() {
    const canvas  = _root.getElementById('confetti-canvas');
    const ctx     = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const COLORS  = ['#3b82f6','#10b981','#f59e0b','#ef4444','#a855f7','#ec4899','#14b8a6','#f97316'];
    const PIECES  = 140;
    const particles = [];

    for (let i = 0; i < PIECES; i++) {
        particles.push({
            x:    canvas.width  * Math.random(),
            y:    -20 - Math.random() * canvas.height * 0.3,
            w:    6  + Math.random() * 8,
            h:    10 + Math.random() * 8,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * Math.PI * 2,
            vx:   (Math.random() - 0.5) * 4,
            vy:   2.5 + Math.random() * 4,
            vr:   (Math.random() - 0.5) * 0.25,
            opacity: 1,
        });
    }

    let frame = 0;
    const MAX_FRAMES = 160;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frame++;
        const fadeStart = MAX_FRAMES * 0.6;

        particles.forEach(p => {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += 0.12; // gravity
            p.rotation += p.vr;
            if (frame > fadeStart) p.opacity = Math.max(0, 1 - (frame - fadeStart) / (MAX_FRAMES - fadeStart));

            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            // Alternate between rect and circle shapes
            if (p.w > 11) {
                ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            } else {
                ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
            ctx.fill();
            ctx.restore();
        });

        if (frame < MAX_FRAMES) {
            requestAnimationFrame(draw);
        } else {
            canvas.style.display = 'none';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    requestAnimationFrame(draw);
}


// ─── Tab Navigation ───────────────────────────────────────────────────────────
function initTabs() {
    const tabBtns   = _root.querySelectorAll('.tab-btn');
    const tabPanels = _root.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const panel = _root.getElementById('tab-' + target);
            if (panel) panel.classList.add('active');

            // Persist active tab
            localStorage.setItem('snowball_active_tab', target);
        });
    });

    // Restore last active tab
    const savedTab = localStorage.getItem('snowball_active_tab');
    if (savedTab) {
        const savedBtn = _root.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
        if (savedBtn) savedBtn.click();
    }
}

// ─── Bootstrap App ────────────────────────────────────────────────────────
    setupEventListeners();

    // Home Assistant pushes the 'hass' object asynchronously. 
    // We wait a few milliseconds for it to arrive, then pull our data and render!
    const waitForHass = setInterval(() => {
        if (_root._hass) {
            clearInterval(waitForHass);
            loadBackendData();
        }
    }, 50);

  } // <-- Closes _initApp()

  // Lovelace Card API
  setConfig(config) {
    // No config needed for this card
    this._config = config;
  }

  getCardSize() {
    return 12; // Tall card - takes full height
  }

  static getConfigElement() {
    return document.createElement('div');
  }

  static getStubConfig() {
    return {};
  }
} // <-- Closes the DebtSnowballCard class

customElements.define('debt-snowball-card', DebtSnowballCard);

// This registers your card in the Home Assistant UI card picker!
window.customCards = window.customCards || [];
window.customCards.push({
  type: "debt-snowball-card",
  name: "Debt Snowball Tracker",
  description: "A full-screen interactive debt snowball and avalanche tracker. Add to a 'Panel' view for best experience.",
  preview: false,
  documentationURL: "https://github.com/raffenit/debt-snowball-tracker"
});