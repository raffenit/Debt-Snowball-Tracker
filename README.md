# 💳 Debt Snowball Tracker for Home Assistant

A fully interactive, theme-aware, full-screen Debt Snowball and Avalanche tracker built natively for Home Assistant.

Track your bank balances, manage recurring costs, visualize your payoff timeline, and run "Windfall" scenarios—all without your financial data ever leaving your local network.

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation-zero-yaml)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Summary Cards](#summary-cards-optional)
- [Actionable Notifications](#actionable-notifications-optional)
- [Tech Stack](#tech-stack)
- [Development & Deployment](#development--deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- 💰 **Two Strategies** — Instantly toggle between Debt Snowball (lowest balance first) and Debt Avalanche (highest interest first)
- 📊 **Smart Timeline** — Visualizes exactly when you will be debt-free based on your real monthly budget
- 💵 **Windfall Planner** — See how much time and interest you'll save with extra payments
- 🏦 **Bank Balance Sync** — Mid-month checkpoints for accurate cash-flow scheduling
- 📅 **Recurring Costs** — Track bills, subscriptions, utilities with one-time and interval support
- 📱 **Zero-YAML Install** — Runs entirely in the frontend. No `configuration.yaml` editing required!
- 🔒 **100% Local Data** — All financial data stored securely in your Home Assistant instance
- 🎨 **Theme Aware** — Automatically adapts to your Home Assistant Light/Dark mode
- 📈 **Home Assistant Sensors** — Exposes total debt, payoff date, and next payment sensors
- 🔔 **Payment Reminders** — Optional blueprint for actionable due-date notifications

---

## Prerequisites

- [Home Assistant](https://www.home-assistant.io/) (2023.4 or newer)
- [HACS](https://hacs.xyz/) (for easy installation)
- A modern web browser (Chrome, Firefox, Safari, Edge)

---

## Installation (Zero YAML)

This tracker installs entirely through the Home Assistant UI using HACS and Lovelace. **No `configuration.yaml` editing required!**

### Step 1: Download via HACS

1. Open **HACS** in Home Assistant.
2. Go to **Frontend**.
3. Click the three dots in the top right corner and select **Custom repositories**.
4. Add the URL to this repository and select **Lovelace** as the category.
5. Click **Download** in the bottom right corner.
6. *When prompted, reload your browser.*

### Step 2: Add to your Dashboard

Because this is a full-screen app, it works best on its own dedicated Dashboard.

1. Go to **Settings > Dashboards** and click **Add Dashboard**.
2. Name it something like "Debt Snowball" and pick an icon (e.g., `mdi:cash-multiple`).
3. Open your new dashboard, click the **Pencil icon** in the top right to edit.
4. Click the **Pencil icon** again next to the dashboard name and toggle **Panel Mode** ON.
5. Click **Add Card**, search for **Debt Snowball Tracker**, and hit Save!

### Migrating from the old `panel_custom` version?

If you previously used the `panel_custom` YAML configuration:
1. Remove the `panel_custom` entry from your `configuration.yaml`
2. Restart Home Assistant
3. Follow the steps above to add it as a Lovelace card

---

## Project Structure

```
debt-snowball-tracker/
├── dist/
│   └── debt-snowball-card.js      # Built browser bundle (from src/app/*.js)
├── src/
│   ├── app/                       # Browser bundle source modules (ES modules)
│   │   ├── card.js, index.js, state.js, template.js, storage.js, …
│   ├── constants.js               # App constants
│   ├── date-utils.js              # Month key utilities & date math
│   ├── pure-utils.js              # Formatting, calcAutoMin, escHtml
│   ├── simulation.js              # Core payoff simulation engine
│   └── README.md                  # Source module docs
├── tests/                         # Test suite
│   ├── app.test.js                # Core simulation tests
│   ├── app.extended.test.js       # Extended edge-case tests
│   ├── build.test.js              # Build validation tests
│   ├── date-utils.test.js         # Date utility tests
│   └── helpers.js                 # Test helper re-exports
├── scripts/
│   └── build-esbuild.js           # Bundles src/app/*.js → dist/ with esbuild
├── docs/
│   └── MODULAR_ARCHITECTURE.md    # Architecture documentation
├── package.json                   # Node test scripts & build command
└── README.md                      # This file
```

---

## Architecture

### Data Storage

The tracker uses a dedicated hidden Lovelace dashboard (`snowball-store`) as a JSON-backed persistent store.

**Why this works:**
- ✓ Zero setup — no YAML, no helpers, no config changes required
- ✓ Truly persistent — written to disk in `.storage/`, survives restarts
- ✓ Shared — all users on the server read the same data
- ✓ No size limits — the full payload is one JSON object
- ✓ Standard HA API — same mechanism Lovelace itself uses for dashboards

**Note:** Only the active-tab UI preference is kept in `localStorage`. All financial data lives in the server-side store.

### Simulation Engine

The core engine (`src/core/simulation.js`) runs a month-by-month cash-flow simulation:

1. **Income Scheduling** — Paychecks arrive on specific days; bills are paid only after sufficient cash has arrived
2. **Strategy Sorting** — Snowball (smallest balance first) or Avalanche (highest rate first)
3. **Interest Accrual** — Monthly compounding with promo-rate handling
4. **Payment Queue** — Debts paid in due-day order with extra applied to the strategy target
5. **Cascade** — When a debt is paid off, its payment rolls to the next target

### Home Assistant Sensors

The tracker pushes three sensors to your Home Assistant state:

| Sensor | State | Attributes |
|--------|-------|------------|
| `sensor.snowball_total_debt` | Current total balance | `friendly_name`, `unit_of_measurement`, `icon` |
| `sensor.snowball_payoff_date` | Estimated payoff date | `friendly_name`, `device_class: date`, `icon` |
| `sensor.snowball_next_payment` | Next upcoming payment | `friendly_name`, `debt_name`, `due_day`, `icon` |

---

## Development Setup

If you want to run the test suite or make changes:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/debt-snowball-tracker.git
cd debt-snowball-tracker

# Run tests
npm test

# Or run individual test suites
npm run test:unit       # Core simulation tests
npm run test:extended   # Extended edge-case tests
npm run test:dates      # Date utility tests
```

### Keeping `dist/` in Sync

The `dist/debt-snowball-card.js` is built automatically by esbuild from the ES modules in `src/app/`. Run `npm run build` to regenerate it after any source change.

Key functions to keep in sync:
1. `runSimulation()` — Core simulation logic
2. Date utilities — `isCostDueThisMonth()`, `monthKeyToIndex()`, etc.
3. Pure utilities — `formatMoney()`, `calcAutoMin()`, etc.

---

## Summary Cards (Optional)

In addition to the main tracker, three optional **summary cards** are available for quick at-a-glance views:

| Card | Description | Card Type |
|------|-------------|-----------|
| **Monthly Summary** | Current month income, expenses, remaining cash flow, and days until next paycheck | `debt-snowball-monthly-card` |
| **Payoff Progress** | Visual progress bar, percent paid off, next milestone debt, estimated payoff date | `debt-snowball-progress-card` |
| **Yearly Summary** | Year-to-date debt reduction, interest estimates, debts paid off | `debt-snowball-yearly-card` |

### Installing Summary Cards

Summary cards are automatically included with HACS installation. To add them to any dashboard:

1. Edit your dashboard → **Add Card**
2. Search for "Debt Snowball"
3. Select one of the summary cards

These cards work great on your main home dashboard for quick checks without opening the full tracker!

---

## Actionable Notifications (Optional)

Want Home Assistant to remind you the day before a credit card or loan payment is due?

You can install the official Debt Snowball Payment Reminder Blueprint with one click. This automation will send an actionable notification to your phone. When you tap it, it will deep-link you straight into your tracker so you can mark the bill as paid.

[![Open your Home Assistant instance and show the blueprint import dialog.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https://github.com/raffenit/debt-snowball-tracker/blob/main/debt_snowball_reminder.yaml)

---

## Tech Stack

- **Vanilla JavaScript** — No framework dependencies for the main card
- **Chart.js** — Paydown timeline visualization
- **Home Assistant Lovelace API** — Card framework and persistent storage
- **ES Modules** — Modern `import`/`export` syntax throughout `src/`
- **Node.js Test Runner** — Built-in `node --test` for unit tests

---

## Development & Deployment

### Local Testing

Test the card in a browser without Home Assistant:

```bash
npm run build       # Build dist/debt-snowball-card.js
python3 -m http.server 8765
# Open http://localhost:8765/test.html
```

The test page mocks the HA API and stores data in browser `localStorage`.

### Running Tests

```bash
npm test            # All 180 tests across 37 suites
npm run test:unit   # Core simulation engine only
npm run test:dates  # Date utility functions
npm run test:build  # Build system validation
```

### Releasing to Home Assistant

```bash
npm version patch   # Bump version (patch|minor|major)
npm run release     # Tests → Build → Git tag → GitHub Release
```

Then in Home Assistant:
1. **HACS → Frontend → Debt Snowball Tracker → Update**
2. **Ctrl+Shift+R** on your dashboard to clear cache

See `.devin/workflows/hacs-deployment.md` for the full deployment guide.

---

## Troubleshooting

**"I just updated the plugin via HACS, but nothing changed!"**

Home Assistant aggressively caches custom frontend panels. If you recently updated the app, you will likely need to clear your cache.

- **Windows/Linux:** Press `Ctrl` + `F5` or `Ctrl` + `Shift` + `R`
- **Mac:** Press `Cmd` + `Shift` + `R`
- **Companion App:** Go to App Configuration > Debugging > Clear Frontend Cache.

**"Where is my data saved?"**

All data is saved locally in the `.storage/` directory of your home assistant server. **Please use the "Export Data" button in the app to periodically save a backup file to your computer in case the data becomes corrupted!**

**"The month navigation buttons don't update the whole view"**

The Previous / Current Month navigation buttons in the Payment Plan tab now correctly trigger a full UI re-render (debts, costs, income, and timeline). If you still see stale data after clicking, reload the page.

**"Sensors are not appearing"**

The tracker pushes sensors via `callApi`. Ensure your user has API access and check the browser console for any permission errors.

---

## License

MIT — use freely for your personal self-hosted setup.
