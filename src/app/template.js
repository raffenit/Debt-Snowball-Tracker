import { PANEL_BUILD_DATE, PANEL_VERSION } from './header.js';

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
        overflow-x: auto;
    }

    .tab-btn {
        flex: 0 0 auto;
        justify-content: center;
        padding: 0.625rem 0.5rem;
        font-size: 0.8rem;
        min-height: 40px;
    }

    .tab-label {
        font-size: 0.75rem;
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

.cost-subsection-maintenance .cost-subsection-header {
    background: linear-gradient(90deg, rgba(251,146,60,0.12) 0%, rgba(251,146,60,0.04) 100%);
    border-left: 3px solid #fb923c;
    color: #fb923c;
    box-shadow: inset 0 1px 0 rgba(251,146,60,0.08);
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
            <button class="tab-btn" data-tab="budgets"><span class="tab-icon">&#128176;</span><span class="tab-label"> Budgets</span></button>
            <button class="tab-btn" data-tab="income"><span class="tab-icon">&#128181;</span><span class="tab-label"> Income & Expenses</span></button>
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

            <div class="tab-panel" id="tab-budgets">
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
            </div>

            <div class="tab-panel" id="tab-income">
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
                        <option value="maintenance">🔧 Maintenance (Home & Auto)</option>
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
                        <option value="monthly">Monthly (same day each month)</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="one-time">One-time (this month only)</option>
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


export { PANEL_CSS, PANEL_HTML };
