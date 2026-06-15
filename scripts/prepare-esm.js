#!/usr/bin/env node
/**
 * Preprocessor: converts src/app/*.js into a single ES module entry point
 * for esbuild bundling.
 *
 * Steps:
 *   1. Concatenate src/app/*.js in alphabetical order (preserving current semantics)
 *   2. Remove duplicated functions that exist in src/*.js
 *   3. Prepend import statements for those functions from src/*.js
 *   4. Write result to src/app/index.js
 *
 * Usage: node scripts/prepare-esm.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'src', 'app');
const OUT_FILE = path.join(APP_DIR, 'index.js');

// ─── Configuration: which functions to replace with imports ───────────────────

const IMPORTS = {
    // From ../simulation.js
    '../simulation.js': [
        'runSimulation',
        'runSimulationWithWindfall',
        'getStrategyOrder',
    ],
    // From ../pure-utils.js
    '../pure-utils.js': [
        'formatMoney',
        'formatOrdinal',
        'escHtml',
        'calcAutoMin',
    ],
    // From ../date-utils.js
    '../date-utils.js': [
        'currentMonthKey',
        'formatMonthLabel',
        'monthKeyToIndex',
        'addMonthsToKey',
        'isCostDueThisMonth',
        'isCostDueInMonth',
        'generateBiweeklyForMonth',
        'generateRecurringIncomeForMonth',
        'intervalLabel',
        'keyToHtmlMonth',
        'htmlMonthToKey',
    ],
    // From ../constants.js
    '../constants.js': [
        'MAX_SIMULATION_MONTHS',
    ],
};

// Functions that exist in 50-pure.js as duplicates — remove these definitions
const FUNCTIONS_TO_REMOVE = new Set([
    'formatMoney',
    'formatOrdinal',
    'escHtml',
    'calcAutoMin',
    'currentMonthKey',
    'formatMonthLabel',
    'monthKeyToIndex',
    'addMonthsToKey',
    'isCostDueThisMonth',
    'isCostDueInMonth',
    'generateBiweeklyForMonth',
    'generateRecurringIncomeForMonth',
    'intervalLabel',
    'keyToHtmlMonth',
    'htmlMonthToKey',
    'getStrategyOrder',
]);

// runSimulation and runSimulationWithWindfall are in 82-render-payment.js and 83-render-support.js
const EXTRA_REMOVE = new Set([
    'runSimulation',
    'runSimulationWithWindfall',
]);

// ─── Build import block ───────────────────────────────────────────────────────

function buildImportBlock() {
    const lines = [];
    for (const [modulePath, names] of Object.entries(IMPORTS)) {
        lines.push(`import { ${names.join(', ')} } from '${modulePath}';`);
    }
    return lines.join('\n') + '\n\n';
}

// ─── Parse and remove function definitions ──────────────────────────────────

/**
 * Remove function definitions for functions that are being imported.
 * Handles both:
 *   function name(...) { ... }
 *   const name = (...) => { ... }
 */
function removeDuplicateFunctions(source) {
    const allToRemove = new Set([...FUNCTIONS_TO_REMOVE, ...EXTRA_REMOVE]);
    let result = source;

    for (const name of allToRemove) {
        // Match function declarations: "function name(...) {" ... "}"
        // We need to find the matching closing brace, accounting for nested braces
        const funcRegex = new RegExp(
            `^(\\s*function\\s+${name}\\s*\\(.*?\\)\\s*\\{)`,
            'gm'
        );

        let match;
        while ((match = funcRegex.exec(result)) !== null) {
            const startIdx = match.index;
            const braceStart = result.indexOf('{', match.index);
            if (braceStart === -1) continue;

            let depth = 1;
            let endIdx = braceStart + 1;
            while (depth > 0 && endIdx < result.length) {
                if (result[endIdx] === '{') depth++;
                else if (result[endIdx] === '}') depth--;
                endIdx++;
            }

            // Remove from startIdx to endIdx, plus any trailing blank lines
            let removeEnd = endIdx;
            while (removeEnd < result.length && result[removeEnd] === '\n') removeEnd++;

            result = result.slice(0, startIdx) + result.slice(removeEnd);
            // Reset regex since we modified the string
            funcRegex.lastIndex = startIdx;
        }
    }

    return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function prepare() {
    console.log('Preparing ESM entry point...');

    // Read all .js files from src/app/ in alphabetical order
    const files = fs.readdirSync(APP_DIR)
        .filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'state.js')
        .sort();

    console.log(`  Found ${files.length} source modules`);

    // Concatenate
    let combined = '';
    for (const file of files) {
        const content = fs.readFileSync(path.join(APP_DIR, file), 'utf-8');
        combined += `// ─── ${file} ─────────────────────────────────────────────────────────────────\n`;
        combined += content;
        combined += '\n\n';
        console.log(`  ✓  ${file}`);
    }

    // Remove duplicated functions
    console.log('  Removing duplicated function definitions...');
    const deduped = removeDuplicateFunctions(combined);

    // Build final output with imports
    const importBlock = buildImportBlock();
    const output = importBlock + deduped;

    fs.writeFileSync(OUT_FILE, output, 'utf-8');

    const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
    console.log(`\n✅ Prepared ${OUT_FILE} (${sizeKb} KB)`);
}

try {
    prepare();
} catch (err) {
    console.error('Prepare failed:', err.message);
    process.exit(1);
}
