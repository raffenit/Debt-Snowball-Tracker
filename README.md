# Debt Snowball Tracker for Home Assistant

A fully-featured debt payoff tracker panel for Home Assistant, installable via [HACS](https://hacs.xyz/). Track your debts using the Snowball or Avalanche strategy, visualize your payoff timeline, plan monthly payments, and celebrate milestones — all from your HA sidebar.

## Features

- 📅 **Payment Plan** — Day-by-day schedule showing income, bills, and debt payments with running balance
- 💰 **Income & Budget** — Add paychecks and recurring costs (direct or card-charged)
- 💳 **Debts** — Track balances, interest rates, due dates, promo 0% periods, and auto-pay
- 📊 **Timeline** — Interactive payoff chart with Snowball vs. Avalanche comparison
- 🎉 **Windfall Planner** — See how a lump sum would accelerate your payoff
- ✅ **Mark as Paid** — Track what you've paid this month with undo support
- 💾 **Export / Import** — Backup and restore your data as JSON
- 🔒 **All data stored locally** — Uses browser `localStorage`, nothing leaves your device

---

## Installation via HACS

1. Go to **HACS → Frontend → Explore & Download Repositories**
2. Search for **Debt Snowball Tracker**
3. Click **Download**
4. Add the following to your `configuration.yaml`:

```yaml
panel_custom:
  - name: debt-snowball-panel
    sidebar_title: Debt Snowball
    sidebar_icon: mdi:credit-card-minus
    url_path: debt-snowball
    module_url: /hacsfiles/debt-snowball-ha/debt-snowball-panel.js
```

5. Restart Home Assistant
6. The **Debt Snowball** item will appear in your sidebar

---

## Manual Installation

1. Copy `dist/debt-snowball-panel.js` to your `/config/www/` directory
2. Add the following to your `configuration.yaml`:

```yaml
panel_custom:
  - name: debt-snowball-panel
    sidebar_title: Debt Snowball
    sidebar_icon: mdi:credit-card-minus
    url_path: debt-snowball
    module_url: /local/debt-snowball-panel.js
```

3. Restart Home Assistant

---

## Data & Privacy

All data is stored in your browser's `localStorage`. Nothing is sent to any server. Use the **Export Data** button regularly to keep backups.

---

## Repository Structure

```
debt-snowball-ha/
├── .gitignore
├── LICENSE
├── README.md
├── hacs.json
├── package.json
└── dist/
    └── debt-snowball-panel.js
    └── debt-snowball-panel.css
└── tests/
    └── app.extended.test.js
    └── app.test.js
    └── helpers.js

```
