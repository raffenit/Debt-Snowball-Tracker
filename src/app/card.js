import { appState, initDomRefs } from './state.js';
import { setupEventListeners } from './events.js';
import { loadBackendData } from './storage.js';
import { PANEL_CSS, PANEL_HTML } from './template.js';

class DebtSnowballCard extends HTMLElement {
    set hass(hass) {
        this._hass = hass;
        this._currency = hass.config?.currency || 'USD';
        this._language = hass.locale?.language || hass.language || navigator.language;
    }

    connectedCallback() {
        if (this._initialized) return;
        this._initialized = true;

        if (!document.querySelector('link[data-debt-snowball-font]')) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.setAttribute('data-debt-snowball-font', '1');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap';
            document.head.appendChild(fontLink);
        }

        const styleEl = document.createElement('style');
        styleEl.textContent = PANEL_CSS;
        this.appendChild(styleEl);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = PANEL_HTML;
        while (wrapper.firstChild) this.appendChild(wrapper.firstChild);

        this._loadChartJs().then(() => {
            this._initApp();
        });
    }

    disconnectedCallback() {
        if (appState.countdownInterval) {
            clearInterval(appState.countdownInterval);
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
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    _initApp() {
        initDomRefs(this);
        setupEventListeners();

        const waitForHass = setInterval(() => {
            if (appState._root._hass) {
                clearInterval(waitForHass);
                loadBackendData();
            }
        }, 50);
    }

    setConfig(config) {
        this._config = config;
    }

    getCardSize() {
        return 12;
    }

    static getConfigElement() {
        return document.createElement('div');
    }

    static getStubConfig() {
        return {};
    }
}

export { DebtSnowballCard };

customElements.define('debt-snowball-card', DebtSnowballCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'debt-snowball-card',
    name: 'Debt Snowball Tracker',
    description: 'Track debts, income, and costs with payoff simulation',
});
