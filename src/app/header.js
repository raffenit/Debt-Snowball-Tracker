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

export { PANEL_BUILD_DATE, PANEL_VERSION, currentScript, installType, scriptSrc };
