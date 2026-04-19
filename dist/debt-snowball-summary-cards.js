/**
 * Debt Snowball Tracker — Summary Cards
 * 
 * Additional Lovelace cards for quick summary views:
 * - Monthly Summary Card
 * - Yearly Summary Card  
 * - Debt Payoff Progress Card
 * 
 * Installation: Add as resource alongside the main debt-snowball-card.js
 */

const SUMMARY_CSS = `
:host {
  display: block;
  width: 100%;
  height: 100%;
}

ha-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:root {
  --ds-bg: #0f0d2a;
  --ds-card-bg: #13113a;
  --ds-text: #ede9ff;
  --ds-text-secondary: #7b74a8;
  --ds-accent: #5b7fff;
  --ds-success: #34c97a;
  --ds-warning: #f0a050;
  --ds-danger: #f4587a;
  --ds-border: #1e2255;
  --ds-radius: 12px;
}

.ds-summary-card {
  background: var(--ds-card-bg);
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius);
  padding: 1rem;
  color: var(--ds-text);
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
}

.ds-summary-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ds-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ds-summary-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--ds-text);
  margin-bottom: 0.25rem;
}

.ds-summary-label {
  font-size: 0.8rem;
  color: var(--ds-text-secondary);
}

.ds-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--ds-border);
}

.ds-summary-row:last-child {
  border-bottom: none;
}

.ds-progress-bar {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 0.75rem 0;
}

.ds-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ds-accent), #9b6dff);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.ds-progress-text {
  font-size: 0.85rem;
  color: var(--ds-text-secondary);
  text-align: center;
  margin-top: 0.25rem;
}

.ds-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.ds-metric-box {
  background: rgba(7,6,26,0.4);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--ds-border);
}

.ds-metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ds-text);
}

.ds-metric-value.positive { color: var(--ds-success); }
.ds-metric-value.negative { color: var(--ds-danger); }
.ds-metric-value.warning { color: var(--ds-warning); }

.ds-metric-label {
  font-size: 0.75rem;
  color: var(--ds-text-secondary);
  margin-top: 0.2rem;
}

.ds-countdown {
  font-size: 2rem;
  font-weight: 800;
  color: var(--ds-accent);
  text-align: center;
  margin: 0.5rem 0;
}

.ds-loading {
  text-align: center;
  color: var(--ds-text-secondary);
  padding: 1rem;
  font-size: 0.9rem;
}

.ds-error {
  text-align: center;
  color: var(--ds-danger);
  padding: 1rem;
  font-size: 0.85rem;
}
`;

// ============================================
// MONTHLY SUMMARY CARD
// ============================================
class DebtSnowballMonthlyCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._data = null;
  }

  setConfig(config) {
    this._config = config;
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 3;
  }

  set hass(hass) {
    if (!hass) return;
    this._hass = hass;
    this._loadData();
  }

  async _loadData() {
    try {
      // Try to get data from the main debt snowball entity
      const entityId = this._config.entity || 'sensor.debt_snowball_data';
      const state = this._hass.states[entityId];
      
      if (state && state.attributes) {
        this._data = this._calculateMonthlyData(state.attributes);
        this._render();
      } else {
        this._renderEmpty();
      }
    } catch (e) {
      this._renderError();
    }
  }

  _calculateMonthlyData(attrs) {
    const income = attrs.income_entries || [];
    const costs = attrs.recurring_costs || [];
    const debts = attrs.debts || [];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const monthlyIncome = income
      .filter(e => e.date && e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const monthlyCosts = costs
      .filter(c => c.dueDay)
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const debtPayments = debts
      .reduce((sum, d) => sum + (d.minPayment || 0), 0);

    const totalExpenses = monthlyCosts + debtPayments;
    const remaining = monthlyIncome - totalExpenses;

    // Days until next income
    const today = new Date();
    const futureIncome = income
      .map(e => ({ ...e, dateObj: new Date(e.date + 'T00:00:00') }))
      .filter(e => e.dateObj > today)
      .sort((a, b) => a.dateObj - b.dateObj)[0];

    const daysUntilIncome = futureIncome 
      ? Math.ceil((futureIncome.dateObj - today) / (1000 * 60 * 60 * 24))
      : null;

    return {
      income: monthlyIncome,
      expenses: totalExpenses,
      remaining,
      debtPayments,
      daysUntilIncome,
      nextIncomeLabel: futureIncome?.label || null
    };
  }

  _render() {
    if (!this._data) return;
    
    const { income, expenses, remaining, debtPayments, daysUntilIncome, nextIncomeLabel } = this._data;
    const remainingClass = remaining >= 0 ? 'positive' : 'negative';
    const remainingIcon = remaining >= 0 ? '+' : '';

    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-summary-header">
          📅 ${new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        
        <div class="ds-metric-grid">
          <div class="ds-metric-box">
            <div class="ds-metric-value positive">$${income.toLocaleString()}</div>
            <div class="ds-metric-label">Income</div>
          </div>
          <div class="ds-metric-box">
            <div class="ds-metric-value negative">$${expenses.toLocaleString()}</div>
            <div class="ds-metric-label">Expenses</div>
          </div>
          <div class="ds-metric-box">
            <div class="ds-metric-value ${remainingClass}">${remainingIcon}$${remaining.toLocaleString()}</div>
            <div class="ds-metric-label">Remaining</div>
          </div>
          <div class="ds-metric-box">
            <div class="ds-metric-value">$${debtPayments.toLocaleString()}</div>
            <div class="ds-metric-label">Debt Min.</div>
          </div>
        </div>
        
        ${daysUntilIncome !== null ? `
        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--ds-border); text-align: center;">
          <span style="color: var(--ds-text-secondary); font-size: 0.85rem;">
            ${daysUntilIncome === 0 ? '🎉 ' + (nextIncomeLabel || 'Income') + ' today!' : 
              daysUntilIncome + ' days until ' + (nextIncomeLabel || 'next income')}
          </span>
        </div>
        ` : ''}
      </div>
    `;
  }

  _renderEmpty() {
    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-loading">Open Debt Snowball Tracker to initialize data</div>
      </div>
    `;
  }

  _renderError() {
    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-error">Unable to load monthly data</div>
      </div>
    `;
  }
}

customElements.define('debt-snowball-monthly-card', DebtSnowballMonthlyCard);

// ============================================
// DEBT PAYOFF PROGRESS CARD
// ============================================
class DebtSnowballProgressCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = config;
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 4;
  }

  set hass(hass) {
    if (!hass) return;
    this._hass = hass;
    this._loadData();
  }

  async _loadData() {
    try {
      const entityId = this._config.entity || 'sensor.debt_snowball_data';
      const state = this._hass.states[entityId];
      
      if (state && state.attributes) {
        this._render(state.attributes);
      } else {
        this._renderEmpty();
      }
    } catch (e) {
      this._renderError();
    }
  }

  _render(attrs) {
    const debts = attrs.debts || [];
    const originalTotal = attrs.original_total_debt || 0;
    
    const currentTotal = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
    const totalPaid = originalTotal - currentTotal;
    const percentPaid = originalTotal > 0 ? Math.round((totalPaid / originalTotal) * 100) : 0;
    
    // Find next debt to pay off
    const sortedDebts = [...debts]
      .filter(d => d.balance > 0)
      .sort((a, b) => (a.balance || 0) - (b.balance || 0));
    const nextDebt = sortedDebts[0];

    // Estimate payoff date (simplified)
    const monthlyPayment = debts.reduce((sum, d) => sum + (d.minPayment || 0), 0);
    const monthsToPayoff = monthlyPayment > 0 ? Math.ceil(currentTotal / monthlyPayment) : 0;
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff);

    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-summary-header">
          🎯 Debt Free Progress
        </div>
        
        <div class="ds-progress-bar">
          <div class="ds-progress-fill" style="width: ${percentPaid}%"></div>
        </div>
        <div class="ds-progress-text">${percentPaid}% paid off</div>
        
        <div style="text-align: center; margin: 1rem 0;">
          <div style="font-size: 1.5rem; font-weight: 700;">$${currentTotal.toLocaleString()}</div>
          <div style="font-size: 0.8rem; color: var(--ds-text-secondary);">remaining of $${originalTotal.toLocaleString()}</div>
        </div>
        
        ${nextDebt ? `
        <div style="background: rgba(91,127,255,0.1); padding: 0.75rem; border-radius: 8px; margin-top: 0.75rem; border: 1px solid rgba(91,127,255,0.2);">
          <div style="font-size: 0.75rem; color: var(--ds-text-secondary); margin-bottom: 0.25rem;">Next milestone</div>
          <div style="font-weight: 600; color: var(--ds-text);">${nextDebt.name}</div>
          <div style="font-size: 0.9rem; color: var(--ds-accent);">$${nextDebt.balance.toLocaleString()}</div>
        </div>
        ` : debts.length > 0 ? `
        <div style="text-align: center; padding: 1rem; color: var(--ds-success); font-weight: 600;">
          🎉 All debts paid off!
        </div>
        ` : ''}
        
        ${monthsToPayoff > 0 ? `
        <div style="margin-top: 0.75rem; text-align: center; padding-top: 0.75rem; border-top: 1px solid var(--ds-border);">
          <div style="font-size: 0.8rem; color: var(--ds-text-secondary);">Estimated payoff</div>
          <div style="font-size: 1.1rem; font-weight: 600;">${payoffDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</div>
          <div style="font-size: 0.75rem; color: var(--ds-text-secondary);">(${monthsToPayoff} months)</div>
        </div>
        ` : ''}
      </div>
    `;
  }

  _renderEmpty() {
    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-loading">Open Debt Snowball Tracker to see progress</div>
      </div>
    `;
  }

  _renderError() {
    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-error">Unable to load progress data</div>
      </div>
    `;
  }
}

customElements.define('debt-snowball-progress-card', DebtSnowballProgressCard);

// ============================================
// YEARLY SUMMARY CARD
// ============================================
class DebtSnowballYearlyCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = config;
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 3;
  }

  set hass(hass) {
    if (!hass) return;
    this._hass = hass;
    this._loadData();
  }

  async _loadData() {
    try {
      const entityId = this._config.entity || 'sensor.debt_snowball_data';
      const state = this._hass.states[entityId];
      
      if (state && state.attributes) {
        this._render(state.attributes);
      } else {
        this._renderEmpty();
      }
    } catch (e) {
      this._renderError();
    }
  }

  _render(attrs) {
    const currentYear = new Date().getFullYear();
    const yearStart = attrs.year_start_debt || attrs.original_total_debt || 0;
    const debts = attrs.debts || [];
    const currentTotal = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
    
    const paidThisYear = yearStart - currentTotal;
    const percentChange = yearStart > 0 ? Math.round((paidThisYear / yearStart) * 100) : 0;

    // Calculate interest paid (simplified estimate)
    const totalInterestEstimate = debts.reduce((sum, d) => {
      const rate = (d.apr || 0) / 100;
      const balance = d.balance || 0;
      return sum + (balance * rate / 12); // Monthly interest
    }, 0);

    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-summary-header">
          📊 ${currentYear} Year to Date
        </div>
        
        <div style="text-align: center; margin-bottom: 1rem;">
          <div style="font-size: 0.8rem; color: var(--ds-text-secondary);">Debt Reduced</div>
          <div class="ds-metric-value positive" style="font-size: 2rem;">$${paidThisYear.toLocaleString()}</div>
          <div style="font-size: 0.85rem; color: var(--ds-success);">↓ ${percentChange}% this year</div>
        </div>
        
        <div class="ds-metric-grid">
          <div class="ds-metric-box">
            <div class="ds-metric-value">$${yearStart.toLocaleString()}</div>
            <div class="ds-metric-label">Jan 1 Balance</div>
          </div>
          <div class="ds-metric-box">
            <div class="ds-metric-value">$${currentTotal.toLocaleString()}</div>
            <div class="ds-metric-label">Current Balance</div>
          </div>
          <div class="ds-metric-box">
            <div class="ds-metric-value negative">~$${Math.round(totalInterestEstimate).toLocaleString()}</div>
            <div class="ds-metric-label">Est. Monthly Interest</div>
          </div>
          <div class="ds-metric-box">
            <div class="ds-metric-value">${debts.filter(d => d.balance <= 0).length}</div>
            <div class="ds-metric-label">Debts Paid Off</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderEmpty() {
    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-loading">Open Debt Snowball Tracker to initialize yearly data</div>
      </div>
    `;
  }

  _renderError() {
    this.innerHTML = `
      <style>${SUMMARY_CSS}</style>
      <div class="ds-summary-card">
        <div class="ds-error">Unable to load yearly data</div>
      </div>
    `;
  }
}

customElements.define('debt-snowball-yearly-card', DebtSnowballYearlyCard);

// Register all cards in the card picker
window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: "debt-snowball-monthly-card",
    name: "Debt Snowball - Monthly Summary",
    description: "Current month income, expenses, and cash flow summary",
    preview: false,
    documentationURL: "https://github.com/raffenit/debt-snowball-tracker"
  },
  {
    type: "debt-snowball-progress-card",
    name: "Debt Snowball - Payoff Progress",
    description: "Overall debt payoff progress with visual progress bar",
    preview: false,
    documentationURL: "https://github.com/raffenit/debt-snowball-tracker"
  },
  {
    type: "debt-snowball-yearly-card",
    name: "Debt Snowball - Yearly Summary",
    description: "Year-to-date debt reduction and interest summary",
    preview: false,
    documentationURL: "https://github.com/raffenit/debt-snowball-tracker"
  }
);

console.info('📊 Debt Snowball Summary Cards loaded (Monthly, Progress, Yearly)');
