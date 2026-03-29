/**
 * Debt Snowball Tracker — Home Assistant Custom Panel
 * Install via HACS or manually under /config/www/
 * Then add to configuration.yaml:
 *
 *   panel_custom:
 *     - name: debt-snowball-panel
 *       sidebar_title: Debt Snowball
 *       sidebar_icon: mdi:credit-card-minus
 *       url_path: debt-snowball
 *       module_url: /local/debt-snowball-panel.js
 *
 * Or if installed via HACS:
 *       module_url: /hacsfiles/debt-snowball-ha/debt-snowball-panel.js
 */

const PANEL_CSS = `:root {
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
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'DM Sans', 'Outfit', ui-sans-serif, system-ui, sans-serif;
    background-color: var(--bg-color);
    background-image:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(60, 80, 220, 0.18) 0%, transparent 70%),
        radial-gradient(ellipse 40% 30% at 80% 80%, rgba(40, 60, 180, 0.12) 0%, transparent 60%);
    color: var(--text-primary);
    line-height: 1.5;
}

.app-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
}

.header h1 {
    font-size: 1.875rem;
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
}

.btn-primary:hover {
    background-color: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--accent-glow);
}

.btn-secondary {
    background-color: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
}

.btn-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.btn-danger {
    background-color: transparent;
    border: 1px solid var(--danger-color);
    color: var(--danger-color);
}

.btn-danger:hover {
    background-color: var(--danger-color);
    color: white;
}

.main-content {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
}

.card {
    background-color: var(--card-bg);
    background-image: linear-gradient(145deg, var(--card-bg-2), var(--card-bg));
    border-radius: var(--radius);
    padding: 1.5rem 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255,255,255,0.04) inset;
    border: 1px solid var(--border-color);
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

input[type="number"], input[type="text"], input[type="date"], select {
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
    transition: var(--transition);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.debt-card:hover {
    border-color: var(--accent-color);
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(91, 127, 255, 0.2);
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
}

/* ===== Tablet (≤ 1024px) ===== */
@media (max-width: 1024px) {
    .app-container {
        max-width: 100%;
        padding: 1.5rem 1.25rem;
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
    debt-snowball-panel .btn {
        padding: 0.75rem 1.375rem;
        min-height: 44px;
    }

    debt-snowball-panel .tab-btn {
        padding: 0.75rem 1.25rem;
        min-height: 44px;
    }

    debt-snowball-panel input[type="number"],
    debt-snowball-panel input[type="text"],
    debt-snowball-panel input[type="date"],
    debt-snowball-panel select {
        padding: 0.875rem 1rem;
        min-height: 48px;
    }
}

/* ===== Mobile (≤ 640px) ===== */
@media (max-width: 640px) {
    .app-container {
        padding: 1rem 0.875rem;
    }

    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.875rem;
        margin-bottom: 1.25rem;
    }

    .header h1 {
        font-size: 1.625rem;
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

    debt-snowball-panel input[type="number"],
    debt-snowball-panel input[type="text"],
    debt-snowball-panel input[type="date"],
    debt-snowball-panel select {
        padding: 0.875rem 1rem;
        font-size: 1rem;
        min-height: 48px;
    }

    .btn {
        min-height: 44px;
        font-size: 0.9rem;
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

    debt-snowball-panel .tab-panel.active {
        gap: 1.5rem;
    }

    .main-content {
        gap: 1.5rem;
    }
}

/* ===== Small phone (≤ 480px) ===== */
@media (max-width: 480px) {
    .app-container {
        padding: 0.875rem 0.75rem;
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

/* Animate section headers when tab becomes active */
debt-snowball-panel .tab-panel.active .section-header {
    animation: slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

debt-snowball-panel .tab-panel.active .section-header:nth-of-type(2) {
    animation-delay: 0.05s;
}

debt-snowball-panel .tab-panel.active .section-header:nth-of-type(3) {
    animation-delay: 0.1s;
}

/* Animate summary bars at the bottom of each section */
debt-snowball-panel .tab-panel.active .income-summary,
debt-snowball-panel .tab-panel.active .debt-payments-summary,
debt-snowball-panel .tab-panel.active .recurring-cost-summary {
    animation: fadeIn 0.4s ease backwards 0.3s;
}

/* Animate stat boxes on payment plan tab */
debt-snowball-panel .tab-panel.active .stat-box {
    animation: cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

debt-snowball-panel .tab-panel.active .stat-box:nth-child(1) { animation-delay: 0.05s; }
debt-snowball-panel .tab-panel.active .stat-box:nth-child(2) { animation-delay: 0.12s; }
debt-snowball-panel .tab-panel.active .stat-box:nth-child(3) { animation-delay: 0.19s; }
debt-snowball-panel .tab-panel.active .stat-box:nth-child(4) { animation-delay: 0.26s; }

/* ===== Warning Button ===== */
.btn-warning {
    background-color: var(--warning-color);
    color: #07061a;
    font-weight: 600;
}

.btn-warning:hover {
    background-color: var(--warning-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* ===== Success Button ===== */
.btn-success {
    background-color: var(--success-color);
    color: white;
    font-weight: 600;
}

.btn-success:hover {
    background-color: var(--success-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* ===== Recurring Cost Cards ===== */
.cost-card {
    border-left: 4px solid var(--warning-color) !important;
}

.cost-card:hover {
    border-color: var(--warning-color) !important;
    box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.15) !important;
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
    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.15) !important;
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
.income-section, .recurring-section, .debts-section {
    background-color: var(--card-bg);
    background-image: linear-gradient(145deg, var(--card-bg-2), var(--card-bg));
    border-radius: var(--radius);
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
}

.income-section {
    border-left: 4px solid var(--success-color);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(52,201,122,0.07) inset;
}

.recurring-section {
    border-left: 4px solid var(--warning-color);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(240,160,80,0.07) inset;
}

.debts-section {
    border-left: 4px solid var(--accent-color);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(91,127,255,0.07) inset;
}

/* Budget tab card color accents */
#bank-balances-card {
    border-left: 4px solid var(--success-color);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(52,201,122,0.07) inset;
}

#payment-plan-section {
    border-left: 4px solid var(--accent-color);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(91,127,255,0.07) inset;
}

/* ===== Cost Sub-section Headers ===== */
.cost-subsection {
    margin-bottom: 1.25rem;
}

.cost-subsection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.45rem 0.8rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
}

.cost-subsection-total {
    font-weight: 700;
    font-size: 0.85rem;
}

.cost-subsection-utility .cost-subsection-header {
    background: rgba(45,212,191,0.1);
    border-left: 3px solid var(--teal-color);
    color: var(--teal-color);
}

.cost-subsection-subscription .cost-subsection-header {
    background: rgba(129,140,248,0.1);
    border-left: 3px solid #818cf8;
    color: #a5b4fc;
}

.cost-subsection-other .cost-subsection-header {
    background: rgba(240,160,80,0.1);
    border-left: 3px solid var(--warning-color);
    color: var(--warning-color);
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

/* ===== Promo Card Accent ===== */
.promo-card {
    border-left: 4px solid var(--promo-color) !important;
}

.promo-card:hover {
    border-color: var(--promo-color) !important;
    box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.15) !important;
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

/* ===== Snowball Target Banner ===== */
.snowball-target-banner {
    background: linear-gradient(135deg, rgba(91,127,255,0.12), rgba(52,201,122,0.07));
    border: 1px solid rgba(91,127,255,0.28);
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #a5b8ff;
    margin-bottom: 0.75rem;
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
}

.btn-mark-paid-action:hover {
    background: rgba(16,185,129,0.2);
    border-color: var(--success-color);
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
    margin-bottom: 2rem;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 0.375rem;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
}

.tab-btn {
    flex-shrink: 0;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
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
debt-snowball-panel .tab-panel {
    display: none !important;
}

debt-snowball-panel .tab-panel.active {
    display: flex !important;
    flex-direction: column;
    gap: 2.5rem;
    animation: fadeIn 0.3s ease;
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
            <h1>Debt Snowball Tracker</h1>
            <div class="header-actions">
                <label for="import-file" class="btn btn-secondary" style="background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.4); color: #60a5fa;">
                    Import Data
                    <input type="file" id="import-file" accept=".json" style="display: none;">
                </label>
                <button id="export-btn" class="btn btn-secondary" style="background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.4); color: #4ade80;">Export Data</button>
            </div>
        </header>

        <nav class="tab-nav">
            <button class="tab-btn active" data-tab="payment-plan"><span class="tab-icon">&#128197;</span><span class="tab-label"> Plan</span></button>
            <button class="tab-btn" data-tab="income"><span class="tab-icon">&#128176;</span><span class="tab-label"> Budget</span></button>
            <button class="tab-btn" data-tab="debts"><span class="tab-icon">&#128179;</span><span class="tab-label"> Debts</span></button>
            <button class="tab-btn" data-tab="timeline"><span class="tab-icon">&#128202;</span><span class="tab-label"> Timeline</span></button>
        </nav>

        <main class="main-content">

            <div class="tab-panel active" id="tab-payment-plan">
                
                <section id="bank-balances-card" class="card" style="margin-bottom: 1.5rem;">
                    <div style="margin-bottom: 0.75rem;">
                        <h2 style="margin-bottom: 0;">Bank Balances</h2>
                        <p class="subtitle" style="margin-bottom:0; font-size: 0.85rem;">Set your day 1 balance, and add mid-month checkpoints to sync the app with reality.</p>
                    </div>
                    <div class="input-group" style="margin-bottom: 0.75rem;">
                        <input type="number" id="starting-bank-balance" min="0" step="0.01" placeholder="e.g. 1200" style="font-size: 1.25rem; font-weight: 600; color: var(--success-color);">
                    </div>
                    <div style="display: flex; gap: 0.625rem;">
                        <button id="add-checkpoint-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">+ Add Checkpoint</button>
                        <button id="update-plan-btn" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">↻ Update Plan</button>
                    </div>
                </section>

                <section id="payment-plan-section" class="card" style="display: none; margin-bottom: 1.5rem;">
                    <div class="section-header" style="margin-bottom: 1rem; align-items: flex-start;">
                        <div style="width: 100%;">
                            <h2 style="margin-bottom: 0.5rem;">This Month's Payment Plan</h2>
                            
                            <div class="forecast-bar" id="runway-dashboard">
                                <div class="forecast-item">
                                    <span class="forecast-label">Next Income:</span>
                                    <span id="runway-next-paycheck" class="forecast-value">-</span>
                                </div>
                                <div class="forecast-item">
                                    <span class="forecast-label">Lowest Balance Before Income:</span>
                                    <span id="runway-min-project" class="forecast-value">$0.00</span>
                                </div>
                                <div class="forecast-item">
                                    <span class="forecast-label">Status:</span>
                                    <span id="runway-status" class="forecast-value">Safe</span>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    <div id="payment-plan-list" class="payment-schedule">
                        </div>
                    <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; font-weight: 600; font-size: 1.25rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Total Income</span>
                            <span id="payment-plan-total-income" style="color: var(--success-color);">-</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                            <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Total Expenses</span>
                            <span id="payment-plan-total-expenses" style="color: var(--expense-color);">-</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                            <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Next Month Start</span>
                            <span id="payment-plan-next-month" style="color: var(--text-primary);">-</span>
                        </div>
                    </div>
                    </section>
            </div>

            <div class="tab-panel" id="tab-income">
                <section class="income-section">
                    <div class="section-header">
                        <div>
                            <h2>Monthly Income</h2>
                            <p class="subtitle" style="margin-bottom:0;">Add each paycheck, deposit, or other income for the current month with its expected date.</p>
                        </div>
                        <button id="add-income-btn" class="btn btn-success">+ Add Income</button>
                    </div>
                    <div id="income-list" class="debts-list">
                        </div>
                    <div id="income-summary" class="income-summary" style="display:none;"></div>
                </section>

                <section class="recurring-section">
                    <div class="section-header">
                        <div>
                            <h2>Recurring Costs</h2>
                            <p class="subtitle" style="margin-bottom:0;">Fixed monthly bills grouped by category. <strong>Direct</strong> reduces your cash budget; <strong>Card</strong> does not.</p>
                            <p id="recurring-summary" class="subtitle" style="margin-top:0.35rem; color: var(--text-secondary); font-size: 0.95rem;"></p>
                        </div>
                        <button id="add-cost-btn" class="btn btn-warning">+ Add Cost</button>
                    </div>
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
                        <button id="add-debt-btn" class="btn btn-primary">+ Add Debt</button>
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

    <div id="checkpoint-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="checkpoint-modal-title">Add Balance Checkpoint</h3>
                <button class="close-modal close-checkpoint-modal">&times;</button>
            </div>
            <form id="checkpoint-form">
                <input type="hidden" id="checkpoint-id">
                <div class="input-group">
                    <label for="checkpoint-day">Day of Month (1–31)</label>
                    <input type="number" id="checkpoint-day" min="1" max="31" step="1" required placeholder="e.g. 15">
                </div>
                <div class="input-group">
                    <label for="checkpoint-amount">Actual Bank Balance ($)</label>
                    <input type="number" id="checkpoint-amount" min="0" step="0.01" required placeholder="e.g. 850.50">
                </div>
                <div class="modal-actions" style="justify-content: space-between;">
                    <button type="button" class="btn btn-danger" id="delete-checkpoint-btn" style="display:none;">Delete</button>
                    <div style="display:flex; gap:0.75rem;">
                        <button type="button" class="btn btn-secondary close-checkpoint-modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Checkpoint</button>
                    </div>
                </div>
            </form>
        </div>
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
                    <label for="cost-category">Category</label>
                    <select id="cost-category">
                        <option value="utility">Utility</option>
                        <option value="subscription">Subscription</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="cost-name">Name</label>
                    <input type="text" id="cost-name" required placeholder="e.g. Electric Bill">
                </div>
                <div class="input-group">
                    <label for="cost-amount">Monthly Amount ($)</label>
                    <input type="number" id="cost-amount" min="0" step="0.01" required placeholder="e.g. 120">
                </div>
                <div class="input-group">
                    <label for="cost-amount-type">Amount Type</label>
                    <select id="cost-amount-type" required>
                        <option value="fixed">Fixed — same every month</option>
                        <option value="flexible">Flexible — varies month to month</option>
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
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary close-income-modal">Cancel</button>
                    <button type="submit" class="btn btn-success">Save Income</button>
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

    <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;display:none;"></canvas>`;

class DebtSnowballPanel extends HTMLElement {
    setConfig(config) {
        // Lovelace requires this method to exist, even if we don't use the config
        this.config = config;
    }

    getCardSize() {
        // Tells Lovelace this is a large card
        return 10;
    }

    set hass(hass) {
        // Just store the HA object and locale settings when HA pushes them
        this._hass = hass;
        this._currency = hass.config?.currency || 'USD';
        this._language = hass.locale?.language || hass.language || navigator.language;
    }
  
    connectedCallback() {
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
let paidStatus = {};       // { [id: 'paid' | 'autopay' } — resets each calendar month
let paydownChart = null;
let lastSimPayoffDate = null; // used for countdown ticker
let countdownInterval = null;

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
const checkpointModal       = _root.getElementById('checkpoint-modal');
const debtForm              = _root.getElementById('debt-form');
const costForm              = _root.getElementById('cost-form');
const incomeForm            = _root.getElementById('income-form');
const checkpointForm        = _root.getElementById('checkpoint-form');
const exportBtn             = _root.getElementById('export-btn');
const importFileInput       = _root.getElementById('import-file');
const windfallModal         = _root.getElementById('windfall-modal');
const checkinModal          = _root.getElementById('checkin-modal');

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
            startingBalance = result.startingBalance || 0;

            // Shared paid status — auto-reset when the month rolls over
            if (result.paidMonth === currentMonthKey() && result.paidStatus) {
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
            strategy, startingBalance,
            paidStatus, paidMonth: currentMonthKey(),
        },
    });
}

function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
function setupEventListeners() {
    addDebtBtn.addEventListener('click',   () => openDebtModal());
    addCostBtn.addEventListener('click',   () => openCostModal());
    addIncomeBtn.addEventListener('click', () => openIncomeModal());
    _root.getElementById('add-checkpoint-btn').addEventListener('click', () => openCheckpointModal());
    _root.getElementById('update-plan-btn').addEventListener('click',    () => renderUI());

    _root.querySelectorAll('.close-debt-modal').forEach(b       => b.addEventListener('click', closeDebtModal));
    _root.querySelectorAll('.close-cost-modal').forEach(b       => b.addEventListener('click', closeCostModal));
    _root.querySelectorAll('.close-income-modal').forEach(b     => b.addEventListener('click', closeIncomeModal));
    _root.querySelectorAll('.close-checkpoint-modal').forEach(b => b.addEventListener('click', closeCheckpointModal));

    debtForm.addEventListener('submit',       e => { e.preventDefault(); saveDebt(); });
    costForm.addEventListener('submit',       e => { e.preventDefault(); saveCost(); });
    incomeForm.addEventListener('submit',     e => { e.preventDefault(); saveIncome(); });
    checkpointForm.addEventListener('submit', e => { e.preventDefault(); saveCheckpoint(); });

    exportBtn.addEventListener('click', exportData);
    importFileInput.addEventListener('change', importData);

    const startingBalanceInput = _root.getElementById('starting-bank-balance');
    if (startingBalanceInput) {
        startingBalanceInput.value = startingBalance.toFixed(2);
        startingBalanceInput.addEventListener('input', () => {
            const value = parseFloat(startingBalanceInput.value);
            startingBalance = Number.isFinite(value) ? value : 0;
            saveData().catch(err => console.error("Debt Snowball: save failed —", err));
        });
    }

    // Checkpoints delete listener
    _root.getElementById('delete-checkpoint-btn').addEventListener('click', () => {
        const id = _root.getElementById('checkpoint-id').value;
        if (id) {
            checkpoints = checkpoints.filter(c => c.id !== id);
            saveData().catch(err => console.error("Debt Snowball: save failed —", err));
            closeCheckpointModal();
            showSavedToast('Checkpoint removed ✓');
        }
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

    // Auto min-payment calc
    _root.getElementById('auto-min-btn').addEventListener('click', autoCalcMinPaymentCC);
    _root.getElementById('debt-balance').addEventListener('input', updateAutoMinHint);
    _root.getElementById('debt-rate').addEventListener('input', updateAutoMinHint);

    // Strategy toggle
    _root.querySelectorAll('.strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            strategy = btn.dataset.strategy;
            _root.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveData().catch(err => console.error("Debt Snowball: save failed —", err));
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
        }
    });

    // Backdrop + Escape
    [debtModal, costModal, incomeModal, checkpointModal].forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                if (modal === debtModal)      closeDebtModal();
                else if (modal === costModal) closeCostModal();
                else if (modal === incomeModal) closeIncomeModal();
                else                          closeCheckpointModal();
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

// ─── Checkpoint Modal ────────────────────────────────────────────────────────
function openCheckpointModal(id = null) {
    checkpointForm.reset();
    _root.getElementById('checkpoint-id').value = '';
    _root.getElementById('delete-checkpoint-btn').style.display = 'none';

    if (id) {
        _root.getElementById('checkpoint-modal-title').textContent = 'Edit Checkpoint';
        const cp = checkpoints.find(c => c.id === id);
        if (cp) {
            _root.getElementById('checkpoint-id').value = cp.id;
            _root.getElementById('checkpoint-day').value = cp.day;
            _root.getElementById('checkpoint-amount').value = cp.amount;
            _root.getElementById('delete-checkpoint-btn').style.display = 'block';
        }
    } else {
        _root.getElementById('checkpoint-modal-title').textContent = 'Add Balance Checkpoint';
    }

    checkpointModal.style.display = 'flex';
    void checkpointModal.offsetWidth;
    checkpointModal.classList.add('active');
    setTimeout(() => _root.getElementById('checkpoint-day').focus(), 50);
}

function closeCheckpointModal() {
    checkpointModal.classList.remove('active');
    setTimeout(() => { checkpointModal.style.display = 'none'; }, 300);
}

async function saveCheckpoint() {
    try {
        const id     = _root.getElementById('checkpoint-id').value;
        const day    = parseInt(_root.getElementById('checkpoint-day').value);
        const amount = parseFloat(_root.getElementById('checkpoint-amount').value);

        if (isNaN(day) || day < 1 || day > 31) throw new Error('Please enter a valid day of the month (1-31).');
        if (isNaN(amount)) throw new Error('Please enter a valid amount.');

        if (id) {
            const idx = checkpoints.findIndex(c => c.id === id);
            if (idx !== -1) checkpoints[idx] = { id, day, amount };
        } else {
            checkpoints.push({ id: Date.now().toString(), day, amount });
        }

        await saveData();
        location.reload();
    } catch (err) {
        showErrorToast(err.message || 'Failed to save checkpoint.');
    }
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
        _root.getElementById('cost-modal-title').textContent = 'Edit Recurring Cost';
        const cost = recurringCosts.find(c => c.id === costId);
        if (cost) {
            _root.getElementById('cost-id').value          = cost.id;
            _root.getElementById('cost-name').value        = cost.name;
            _root.getElementById('cost-amount').value      = cost.amount;
            _root.getElementById('cost-due-day').value     = cost.dueDay || '';
            _root.getElementById('cost-category').value   = cost.category || 'other';
            _root.getElementById('cost-payment-method').value = cost.paymentMethod || 'direct';
            _root.getElementById('cost-amount-type').value = cost.amountType || 'fixed';
            _root.getElementById('cost-autopay-toggle').checked = !!cost.autoPay;
        }
    } else {
        _root.getElementById('cost-modal-title').textContent = 'Add Recurring Cost';
        _root.getElementById('cost-payment-method').value = 'direct';
        _root.getElementById('cost-amount-type').value = 'fixed';
    }

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

    if (incomeId) {
        _root.getElementById('income-modal-title').textContent = 'Edit Income Entry';
        const entry = incomeEntries.find(e => e.id === incomeId);
        if (entry) {
            _root.getElementById('income-id').value     = entry.id;
            _root.getElementById('income-label').value  = entry.label;
            _root.getElementById('income-date').value   = entry.date;
            _root.getElementById('income-amount').value = entry.amount;
        }
    } else {
        _root.getElementById('income-modal-title').textContent = 'Add Income Entry';
    }

    incomeModal.style.display = 'flex';
    void incomeModal.offsetWidth;
    incomeModal.classList.add('active');
    setTimeout(() => incomeModal.querySelector('input:not([type=hidden])').focus(), 50);
}

function closeIncomeModal() {
    incomeModal.classList.remove('active');
    setTimeout(() => { incomeModal.style.display = 'none'; }, 300);
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

        if (!name.trim())   throw new Error('Please enter a name for this cost.');
        if (isNaN(amount))  throw new Error('Please enter a valid amount.');

        if (id) {
            const idx = recurringCosts.findIndex(c => c.id === id);
            if (idx !== -1) recurringCosts[idx] = { id, name, amount, dueDay, category, paymentMethod, amountType, autoPay };
        } else {
            recurringCosts.push({ id: Date.now().toString(), name, amount, dueDay, category, paymentMethod, amountType, autoPay });
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

// ─── CRUD: Income ────────────────────────────────────────────────────────────
function saveIncome() {
    try {
        const id     = _root.getElementById('income-id').value;
        const label  = _root.getElementById('income-label').value;
        const date   = _root.getElementById('income-date').value;
        const amount = parseFloat(_root.getElementById('income-amount').value);

        if (!label.trim()) throw new Error('Please enter a label for this income entry.');
        if (!date)         throw new Error('Please select a date.');
        if (isNaN(amount)) throw new Error('Please enter a valid amount.');

        if (id) {
            const idx = incomeEntries.findIndex(e => e.id === id);
            if (idx !== -1) incomeEntries[idx] = { id, label, date, amount };
        } else {
            incomeEntries.push({ id: Date.now().toString(), label, date, amount });
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
    saveData().catch(err => console.error('Debt Snowball: save failed —', err));
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
    const startingBalanceInput = _root.getElementById('starting-bank-balance');
    if (startingBalanceInput && document.activeElement !== startingBalanceInput) {
        startingBalanceInput.value = startingBalance.toFixed(2);
    }

    _root.querySelectorAll('.strategy-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.strategy === strategy);
    });
    renderIncomeList();
    renderRecurringCostsList();
    
    const simResults = runSimulation(strategy);
    renderDebtsList(simResults);
    renderVisualization(simResults);
    
    // NOTE: renderPaymentPlan actually returns nothing right now. 
    // To grab the schedule, we need to let it return the array it builds.
    const schedule = renderPaymentPlan(); 
    
    // Fire our new HA Sensor function!
    updateHASensors(simResults, schedule); 
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
        incomeListContainer.innerHTML = '<div class="empty-state">No income entries yet. Click "+ Add Income" to add your paychecks and other income for this month.</div>';
        incomeListContainer.style.display = 'block';
        summaryEl.style.display = 'none';
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

    if (recurringCosts.length === 0) {
        if (recurringSummaryEl) {
            recurringSummaryEl.textContent = 'Total Monthly Recurring: $0.00 (direct $0.00, card $0.00)';
        }
        costsListContainer.innerHTML = '<div class="empty-state">No recurring costs added yet. Click "+ Add Cost" to get started.</div>';
        costsListContainer.style.display = 'block';
        return;
    }

    const totalRecurring = recurringCosts.reduce((sum, c) => sum + c.amount, 0);
    const directRecurring = recurringCosts.filter(c => c.paymentMethod === 'direct').reduce((sum, c) => sum + c.amount, 0);
    const cardRecurring = recurringCosts.filter(c => c.paymentMethod === 'card').reduce((sum, c) => sum + c.amount, 0);
    if (recurringSummaryEl) {
        recurringSummaryEl.textContent = `Total Monthly Recurring: $${totalRecurring.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (Direct $${directRecurring.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}, Card $${cardRecurring.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`;
    }

    costsListContainer.style.display = 'block';
    const sorted = [...recurringCosts].sort((a,b) => (a.dueDay||1) - (b.dueDay||1));
    const currentDay = new Date().getDate();

    const categories = [
        { key: 'utility',      label: '⚡ Utilities',     cls: 'cost-subsection-utility' },
        { key: 'subscription', label: '📱 Subscriptions',  cls: 'cost-subsection-subscription' },
        { key: 'other',        label: '📦 Other',          cls: 'cost-subsection-other' },
    ];

    let cardIndex = 0;
    categories.forEach(({ key, label, cls }) => {
        const group = sorted.filter(c => (c.category || 'other') === key);
        if (group.length === 0) return;

        const section = document.createElement('div');
        section.className = `cost-subsection ${cls}`;

        const header = document.createElement('div');
        header.className = 'cost-subsection-header';
        const groupTotal = group.reduce((s, c) => s + c.amount, 0);
        header.innerHTML = `<span>${label}</span><span class="cost-subsection-total">${formatMoney(groupTotal)}/mo</span>`;
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'debts-list';
        grid.style.display = 'grid';

        group.forEach(cost => {
            const isPastDue = (cost.dueDay || 1) <= currentDay;
            const isCard = cost.paymentMethod === 'card';
            const paymentMethodLabel = isCard ? 'Credit / Debit Card' : 'Direct Pay (Bank / Cash)';
            const paymentMethodBadge = isCard
                ? '<span class="debt-type-badge card-badge">💳 Card</span>'
                : '<span class="debt-type-badge direct-badge">🏦 Direct Pay</span>';
            const amountType = cost.amountType || 'fixed';
            const amountTypeBadge = amountType === 'flexible'
                ? '<span class="amount-type-badge flexible-badge">〜 Flexible</span>'
                : '<span class="amount-type-badge fixed-badge">= Fixed</span>';
            const paidState = paidStatus[cost.id];
            const el = document.createElement('div');
            el.className = 'debt-card cost-card' +
                (isCard ? ' cost-card-credit' : ' cost-card-direct') +
                (paidState ? ' card-paid' : '');
            el.style.animation = `cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards ${cardIndex * 0.08}s`;
            cardIndex++;
            const autoBadge   = cost.autoPay ? '<span class="autopay-badge">⚡ Auto-Pay</span>' : '';
            const paidOverlay = paidState ? buildPaidOverlay(cost.autoPay) : '';
            el.innerHTML = `
                ${paidOverlay}
                <div class="debt-name">${escHtml(cost.name)}<span class="recurring-badge">♻ Recurring</span>${paymentMethodBadge}${amountTypeBadge}${autoBadge}</div>
                <div class="debt-detail"><span class="debt-detail-label">Monthly Amount</span><span class="debt-detail-value cost-amount">${formatMoney(cost.amount)}</span></div>
                <div class="debt-detail"><span class="debt-detail-label">Due Day</span><span class="debt-detail-value">${formatOrdinal(cost.dueDay||1)} of each month</span></div>
                <div class="debt-detail"><span class="debt-detail-label">Payment Method</span><span class="debt-detail-value">${paymentMethodLabel}</span></div>
                <div class="paid-action-row">${buildPaidButton(cost.id, cost.autoPay, paidState, isPastDue)}</div>
                <div class="debt-actions">
                    <button class="btn btn-secondary btn-edit-cost" data-id="${cost.id}">Edit</button>
                    <button class="btn btn-danger btn-delete-cost" data-id="${cost.id}">Delete</button>
                </div>`;
            grid.appendChild(el);
        });

        section.appendChild(grid);
        costsListContainer.appendChild(section);
    });

    costsListContainer.querySelectorAll('.btn-edit-cost').forEach(b   => b.addEventListener('click', e => openCostModal(e.target.dataset.id)));
    costsListContainer.querySelectorAll('.btn-delete-cost').forEach(b => b.addEventListener('click', e => deleteCost(e.target.dataset.id)));
    costsListContainer.querySelectorAll('.btn-mark-paid').forEach(b   => b.addEventListener('click', e => togglePaid(e.currentTarget.dataset.id, e.currentTarget.dataset.autopay === 'true')));
}

// ─── Debts List ──────────────────────────────────────────────────────────────
function renderDebtsList(simResults) {
    debtsListContainer.innerHTML = '';
    const debtsSummaryEl = _root.getElementById('debts-summary');

    if (debts.length === 0) {
        if (debtsSummaryEl) debtsSummaryEl.textContent = 'Total Debt: $0.00';
        debtsListContainer.innerHTML = '<div class="empty-state">No debts added yet. Click "+ Add Debt" to get started.</div>';
        debtsListContainer.style.display = 'block';
        return;
    }

    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    if (debtsSummaryEl) {
        debtsSummaryEl.textContent = `Total Debt: $${totalDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    debtsListContainer.style.display = 'grid';
    const ordered = getStrategyOrder(debts, strategy);
    const currentDay = new Date().getDate(); // <-- Add this above the loop
    
    ordered.forEach((debt, idx) => {
        const isPastDue = (debt.dueDay || 1) <= currentDay; // <-- Add this inside the loop
        const payoffMonths = simResults?.debtPayoffMonths?.[debt.id];
        const isTarget     = idx === 0;
        const paidState    = paidStatus[debt.id];

        const debtElt   = document.createElement('div');
        debtElt.className = 'debt-card' +
            (debt.promoZeroInterest ? ' promo-card' : '') +
            (paidState ? ' card-paid' : '');
        debtElt.style.animation = `cardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards ${idx * 0.09}s`;

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
            <div class="debt-order-badge" title="${strategy === 'snowball' ? 'Payoff order: smallest balance first' : 'Payoff order: highest interest first'}">${idx + 1}</div>
            <div class="debt-name">${escHtml(debt.name)} ${typeBadge} ${promoBadge} ${autoBadge}</div>
            ${targetBadge}
            <div class="debt-detail"><span class="debt-detail-label">Balance</span><span class="debt-detail-value">${formatMoney(debt.balance)}</span></div>
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

        debtsListContainer.appendChild(debtElt);
    });

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
    const totalRecurringDirect = recurringCosts.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurringCard   = recurringCosts.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
    const totalRecurring       = recurringCosts.reduce((s,c) => s + c.amount, 0);
    // Only direct-payment costs reduce the immediate cash available for debt payoff;
    // card-charged costs are already folded into the card's minimum payment.
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

    while (simDebts.some(d => d.balance > 0) && monthsElapsed < MAX_MONTHS) {
        monthsElapsed++;
        // Add starting cash in first month to the monthly available amount
        let availableCash = effectiveBudget + (monthsElapsed === 1 ? startingBalance : 0); // eslint-disable-line no-unused-vars

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

    const initialTotalDebt = debts.reduce((s,d) => s + d.balance, 0);
    statTotalDebt.textContent = formatMoney(initialTotalDebt);

    stratDesc.textContent = strategy === 'snowball'
        ? 'Snowball: paying the smallest balance first. Quick wins build momentum and keep you motivated.'
        : 'Avalanche: paying the highest interest rate first. Mathematically optimal — minimises total interest paid.';

    if (debts.length === 0) {
        countdownBox.style.display    = 'none';
        payoffBoxAlt.style.display    = 'block';
        _root.getElementById('stat-payoff-date-alt').textContent = '-';
        statTotalInterest.textContent = '$0.00';
        statSavingsBox.style.display  = 'none';
        windfallBar.style.display     = 'none';
        timelineChart.innerHTML       = '<div class="empty-state">Add debts to see your payoff timeline.</div>';
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
        let msg = '';
        if ((totalIncome || 0) <= 0) {
            msg = '<strong>No Income:</strong> Add income entries to see a payoff timeline.';
        } else if ((effectiveBudget || 0) <= 0) {
            const totalRecurringDirect = recurringCosts.filter(c => c.paymentMethod !== 'card').reduce((s,c) => s + c.amount, 0);
            const totalRecurringCard   = recurringCosts.filter(c => c.paymentMethod === 'card').reduce((s,c) => s + c.amount, 0);
            msg = `<strong>Warning:</strong> Income (${formatMoney(totalIncome)}) is entirely consumed by direct recurring costs (${formatMoney(totalRecurringDirect)}).`
                + (totalRecurringCard > 0 ? ` Card-charged costs (${formatMoney(totalRecurringCard)}) are excluded from the cash budget.` : '')
                + ` Increase income or reduce direct costs to free up money for debt payoff.`;
        } else {
            msg = `<strong>Warning:</strong> Effective budget (${formatMoney(effectiveBudget)}) is less than minimum payments (${formatMoney(totalMinPayments)}).`;
        }
        timelineChart.innerHTML = `<div class="empty-state" style="color:var(--warning-color)">${msg}</div>`;
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
        timelineChart.innerHTML       = '<div class="empty-state">Debt will take over 100 years to pay off with this budget.</div>';
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

    list.innerHTML = '';

    if (incomeEntries.length === 0 && startingBalance <= 0) { section.style.display = 'none'; return; }

    const events = [];
    const today = new Date();
    const currentDay = today.getDate();

    incomeEntries.forEach(entry => {
        const day = parseInt(entry.date.split('-')[2]);
        events.push({ type:'income', id: entry.id, name: entry.label, day, date: new Date(entry.date+'T00:00:00'), amount: entry.amount, sortKey: day * 1000 });
    });

    checkpoints.forEach(cp => {
        // Sortkey +0.5 ensures checkpoints happen AFTER standard income on that day, but BEFORE bills are paid.
        events.push({ type: 'checkpoint', id: cp.id, name: 'Bank Balance Sync', day: cp.day, amount: cp.amount, sortKey: cp.day * 1000 + 0.5 });
    });

    recurringCosts.forEach(cost => {
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

    const sortedDebts   = getStrategyOrder(debts.filter(d => d.balance > 0), strategy);
    const totalMinPay   = sortedDebts.reduce((s,d) => s + d.minPayment, 0);
    const totalInc      = incomeEntries.reduce((s,e) => s + e.amount, 0);
    const totalRec      = recurringCosts.reduce((s,c) => s + c.amount, 0);
    const extra         = Math.max(0, totalInc - totalRec - totalMinPay);
    const targetId      = sortedDebts[0]?.id;

    sortedDebts.forEach(debt => {
        const day    = debt.dueDay || 1;
        const isTarget = debt.id === targetId;
        const amount = isTarget ? Math.min(debt.balance, debt.minPayment + extra) : Math.min(debt.balance, debt.minPayment);
        events.push({ type:'debt', id: debt.id, name: debt.name, day, amount, minPayment: debt.minPayment, balance: debt.balance, isSnowballTarget: isTarget, autoPay: !!debt.autoPay, sortKey: day * 1000 + 2 });
    });

    events.sort((a,b) => a.sortKey - b.sortKey);

    // Date-aware scheduling with card-passthrough logic
    let cashPool       = startingBalance;
    let incomeReleased = 0;
    const incomeSorted = events.filter(e => e.type === 'income').sort((a,b) => a.day - b.day);
    const schedule     = [];
    const deferred     = [];
    let totalExpenses  = 0;

    // Inject starting balance as a visible schedule row if non-zero
    if (startingBalance > 0) {
        schedule.push({ type: 'starting-balance', name: 'Day 1 Starting Balance', day: 1, amount: startingBalance, balance: cashPool, sortKey: 0 });
    }

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

    // --- MATH ONLY: Cash runway estimate ---
    const sortedFutureIncomes = incomeEntries
        .map(e => ({ date: new Date(e.date+'T00:00:00'), amount: e.amount, label: e.label }))
        .filter(e => e.date >= today)
        .sort((a,b) => a.date - b.date);
    const nextIncome = sortedFutureIncomes[0] || null;
    const targetDay  = nextIncome ? nextIncome.date.getDate() : 31;

    let testBalance  = startingBalance;
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

    section.style.display = 'block';

    // --- UI CREATION: Build the visual rows ---
    schedule.forEach((item, index) => {
        const itemPaid = paidStatus[item.id];
        const row      = document.createElement('div');
        
        let icon, typeBadge = '', amountClass, dayLabel, rowBgClass;

        if (item.type === 'starting-balance') {
            icon        = '🏁';
            typeBadge   = '<span class="schedule-badge schedule-badge-start">Starting Balance</span>';
            amountClass = 'schedule-amount-income';
            dayLabel    = formatOrdinal(item.day || 1);
            rowBgClass  = 'schedule-starting';
            
        } else if (item.type === 'checkpoint') {
            icon        = '⚖️';
            typeBadge   = '<span class="schedule-badge schedule-badge-start" style="background:rgba(168,85,247,0.15);color:var(--promo-light);border-color:rgba(168,85,247,0.3);">Manual Sync</span>';
            amountClass = ''; 
            dayLabel    = formatOrdinal(item.day);
            rowBgClass  = 'schedule-checkpoint';
            
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
        if (item.type !== 'income' && item.type !== 'checkpoint' && item.type !== 'starting-balance') {
            if (itemPaid) paidBadge = '<span class="schedule-badge schedule-badge-paid">✓ Paid</span>';
        }

        const sign     = item.type === 'income' ? '+' : (item.type === 'checkpoint' || item.type === 'starting-balance') ? '' : '−';
        const balClass = item.balance <= 0 ? 'balance-zero' : item.balance < 500 ? 'balance-low' : 'balance-healthy';
        
        const amountLabel = item.type === 'income'           ? 'Deposit'
            : item.type === 'checkpoint'                       ? 'Synced to'
            : item.type === 'starting-balance'                 ? 'Starting'
            : 'Payment';

        const editBtnHtml = (item.type !== 'starting-balance')
            ? `<button class="btn-edit-inline" data-id="${item.id}" data-type="${item.type}" title="Edit entry">Edit</button>`
            : '';

        let paidBtnHtml = '';
        if (item.type !== 'income' && item.type !== 'starting-balance' && item.type !== 'checkpoint') {
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

        row.innerHTML = `
            <div class="schedule-date-col"><span class="schedule-icon">${icon}</span><span class="schedule-day">${dayLabel}</span></div>
            <div class="schedule-info-col">
                <div class="schedule-name" style="margin-bottom:0.25rem;">${escHtml(item.name)}</div>
                <div class="schedule-badges" style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.25rem;">
                    ${typeBadge} ${statusBadges} ${paidBadge}
                </div>
                <div class="schedule-detail">${
                    item.type === 'debt' && item.isSnowballTarget ? 'Minimum + Snowball Extra'
                    : item.type === 'debt' ? 'Minimum Payment'
                    : item.type === 'recurring' && (item.isCard || item.paymentMethod === 'card') ? 'Charged to credit card'
                    : item.type === 'recurring' ? 'Paid from bank account'
                    : item.type === 'checkpoint' ? 'Resets the running balance for calculations below'
                    : ''
                }</div>
            </div>
            <div class="schedule-right-col">
                <div class="schedule-amount-col ${amountClass}"><span class="col-label">${amountLabel}</span>${sign}$${item.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                <div class="schedule-balance-col ${balClass}"><span class="col-label">Balance</span>$${item.balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>
            
            <div class="schedule-action-col" style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-end; justify-content:center;">
                ${paidBtnHtml}
                ${editBtnHtml}
            </div>`;

        list.appendChild(row);
    });

    const totalIncEl = _root.getElementById('payment-plan-total-income');
    const totalExpEl = _root.getElementById('payment-plan-total-expenses');
    const nextMonthEl = _root.getElementById('payment-plan-next-month');
    
    if (totalIncEl) totalIncEl.textContent = formatMoney(totalInc);
    if (totalExpEl) totalExpEl.textContent = formatMoney(totalExpenses);
    if (nextMonthEl) {
        nextMonthEl.textContent = formatMoney(cashPool);
        nextMonthEl.style.color = cashPool < 0 ? 'var(--danger-color)' : 'var(--text-primary)'; 
    }
    return schedule;
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
} // <-- Closes the DebtSnowballPanel class

customElements.define('debt-snowball-panel', DebtSnowballPanel);

// This registers your app in the Home Assistant UI card picker!
window.customCards = window.customCards || [];
window.customCards.push({
  type: "debt-snowball-panel",
  name: "Debt Snowball Tracker",
  description: "A full-screen interactive debt snowball and avalanche tracker.",
  preview: true,
});