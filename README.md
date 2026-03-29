# 💳 Debt Snowball Tracker for Home Assistant

A fully interactive, theme-aware, full-screen Debt Snowball and Avalanche tracker built natively for Home Assistant. 

Track your bank balances, manage recurring costs, visualize your payoff timeline, and run "Windfall" scenarios—all without your financial data ever leaving your local network.

## ✨ Features
* **Two Strategies:** Instantly toggle between Debt Snowball (lowest balance first) and Debt Avalanche (highest interest first) to see which saves you more time and money.
* **Smart Timeline:** Visualizes exactly when you will be debt-free based on your real monthly budget and recurring costs.
* **Windfall Planner:** Got a tax refund or bonus? Enter the amount to see exactly how much time and interest you'll save if you apply it to your debt.
* **Zero-YAML Install:** Runs entirely in the frontend. No `configuration.yaml` editing required!
* **100% Local Data:** All financial data is stored securely in your browser/app's local storage.
* **Theme Aware:** Automatically adapts to your Home Assistant Light/Dark mode and primary accent colors.

---

## 🚀 Installation (Zero YAML)

This tracker installs entirely through the Home Assistant UI using HACS and Lovelace.

### Step 1: Download via HACS
1. Open **HACS** in Home Assistant.
2. Go to **Frontend**.
3. Click the three dots in the top right corner and select **Custom repositories**.
4. Add the URL to this repository and select **Dashboard** as the category.
5. Click **Download** in the bottom right corner.
6. *When prompted, reload your browser.*

### Step 2: Add to your Dashboard
Because this is a full-screen app, it works best on its own dedicated Dashboard.
1. Go to **Settings > Dashboards** and click **Add Dashboard**.
2. Name it something like "Debt Snowball" and pick an icon (e.g., `mdi:cash-multiple`).
3. Open your new dashboard, click the **Pencil icon** in the top right to edit.
4. Click the **Pencil icon** again next to the dashboard name and toggle **Panel Mode** ON.
5. Click **Add Card**, search for **Debt Snowball Tracker**, and hit Save!

---

## 📱 Actionable Notifications (Optional)

Want Home Assistant to remind you the day before a credit card or loan payment is due? 

You can install the official Debt Snowball Payment Reminder Blueprint with one click. This automation will send an actionable notification to your phone. When you tap it, it will deep-link you straight into your tracker so you can mark the bill as paid.

[![Open your Home Assistant instance and show the blueprint import dialog.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https://github.com/raffenit/debt-snowball-tracker/blob/main/debt_snowball_reminder.yaml)

---

## 🛠️ Troubleshooting

**"I just updated the plugin via HACS, but nothing changed!"**
Home Assistant aggressively caches custom frontend panels. If you recently updated the app, you will likely need to clear your cache. 
* **Windows/Linux:** Press `Ctrl` + `F5` or `Ctrl` + `Shift` + `R`
* **Mac:** Press `Cmd` + `Shift` + `R`
* **Companion App:** Go to App Configuration > Debugging > Clear Frontend Cache.

**"Where is my data saved?"**
All data is saved locally in the .storage/ directory of your home assistant server. **Please use the "Export Data" button in the app to periodically save a backup file to your computer in case the data becomes corrupted!**
