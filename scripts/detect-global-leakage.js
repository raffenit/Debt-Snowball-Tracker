#!/usr/bin/env node
/**
 * Global Leakage Detector
 *
 * After extracting functions from closures to module top-level, variables that were
 * previously closure-scoped become undeclared globals. This tool flags them.
 *
 * Checks: For each JS module, finds identifiers used as values that are:
 *   - Not declared in the file (var/let/const/function)
 *   - Not imported
 *   - Not a known global (window, document, console, etc.)
 *
 * Usage: node scripts/detect-global-leakage.js [directory]
 *   Default directory: src/app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APP_DIR = process.argv[2] ? path.resolve(ROOT, process.argv[2]) : path.join(ROOT, 'src', 'app');

const GLOBALS = new Set([
    'window', 'document', 'navigator', 'console', 'localStorage', 'sessionStorage',
    'history', 'location', 'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
    'requestAnimationFrame', 'cancelAnimationFrame', 'Promise', 'Error', 'TypeError', 'RangeError',
    'Math', 'Date', 'JSON', 'RegExp', 'String', 'Number', 'Boolean', 'Array', 'Object',
    'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'BigInt', 'parseInt', 'parseFloat',
    'isNaN', 'isFinite', 'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
    'escape', 'unescape', 'eval', 'undefined', 'Infinity', 'NaN', 'null', 'true', 'false',
    'this', 'arguments', 'super', 'import', 'export', 'default', 'from', 'as',
    // DOM API
    'HTMLElement', 'customElements', 'Chart', 'Event', 'MouseEvent', 'KeyboardEvent',
    'confirm', 'prompt', 'alert',
    // Node.js test globals (skip these in app/)
    'test', 'describe', 'before', 'beforeEach', 'after', 'afterEach',
    'global', 'process', 'Buffer', 'require', 'module', 'exports', '__dirname', '__filename',
    // Intl
    'Intl',
]);

const BUILTIN_METHODS = new Set([
    'map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every', 'includes',
    'indexOf', 'lastIndexOf', 'slice', 'splice', 'concat', 'push', 'pop', 'shift',
    'unshift', 'sort', 'reverse', 'join', 'split', 'replace', 'match', 'search',
    'trim', 'toFixed', 'toLocaleString', 'toString', 'valueOf', 'hasOwnProperty',
    'toUpperCase', 'toLowerCase', 'charAt', 'charCodeAt', 'padStart', 'padEnd',
    'startsWith', 'endsWith', 'substring', 'substr', 'repeat', 'codePointAt',
    'fromCharCode', 'fromCodePoint', 'trimStart', 'trimEnd', 'replaceAll',
    'at', 'flat', 'flatMap', 'fill', 'copyWithin', 'entries', 'keys', 'values',
    'add', 'delete', 'has', 'clear', 'get', 'set', 'forEach', 'abs', 'ceil',
    'floor', 'round', 'max', 'min', 'pow', 'sqrt', 'log', 'exp', 'sin', 'cos',
    'tan', 'random', 'PI', 'E', 'now', 'UTC', 'parse', 'getFullYear', 'getMonth',
    'getDate', 'getDay', 'getTime', 'setFullYear', 'setMonth', 'setDate', 'setHours',
    'setMinutes', 'getElementById', 'querySelector', 'querySelectorAll',
    'createElement', 'appendChild', 'removeChild', 'insertBefore',
    'addEventListener', 'removeEventListener', 'classList', 'toggle', 'contains',
    'getAttribute', 'setAttribute', 'removeAttribute', 'hasAttribute',
    'focus', 'blur', 'click', 'preventDefault', 'stopPropagation',
    'getBoundingClientRect', 'closest', 'dispatchEvent', 'getComputedStyle',
    'then', 'catch', 'finally', 'resolve', 'reject', 'all', 'race', 'allSettled',
]);

function getDeclaredNames(content) {
    const declared = new Set();

    // var/let/const simple declarations: const x = ...
    const declRegex = /\b(?:var|let|const)\s+(\w+)\s*[=;]/g;
    let m;
    while ((m = declRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // const destructured array: const [moved] = ... or const [a, b] = ...
    const constArrayRegex = /\bconst\s+\[([^\]]+)\]\s*=/g;
    while ((m = constArrayRegex.exec(content)) !== null) {
        m[1].split(',').forEach(item => {
            const name = item.trim().split(/\s*=/)[0].trim();
            if (name) declared.add(name);
        });
    }

    // const destructured object: const {a, b} = ... or const {a: x, b: y} = ...
    const constObjRegex = /\bconst\s+\{([^}]+)\}\s*=/g;
    while ((m = constObjRegex.exec(content)) !== null) {
        m[1].split(',').forEach(item => {
            const name = item.trim().split(':')[0].trim();
            if (name) declared.add(name);
        });
    }

    // function declarations (including async)
    const funcRegex = /\b(?:async\s+)?function\s+(\w+)\s*\(/g;
    while ((m = funcRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // class methods at start of line: connectedCallback() { or async _loadChartJs() {
    const methodRegex = /^\s*(?:async\s+)?(?:static\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
    while ((m = methodRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // setter parameters: set hass(hass) {
    const setterRegex = /set\s+\w+\s*\(\s*(\w+)\s*\)/g;
    while ((m = setterRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // class declarations
    const classRegex = /\bclass\s+(\w+)/g;
    while ((m = classRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // import { a, b } from '...'
    const importRegex = /import\s*\{([^}]+)\}\s*from/g;
    while ((m = importRegex.exec(content)) !== null) {
        m[1].split(',').forEach(s => declared.add(s.trim()));
    }

    // import name from '...'
    const defaultImportRegex = /import\s+(\w+)\s+from/g;
    while ((m = defaultImportRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // import * as name from '...'
    const namespaceRegex = /import\s*\*\s+as\s+(\w+)\s+from/g;
    while ((m = namespaceRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // for (let x of ...) / for (const x of ...)
    const forRegex = /for\s*\(\s*(?:let|const|var)\s+(\w+)/g;
    while ((m = forRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // catch (err) { ... }
    const catchRegex = /catch\s*\(\s*(\w+)\s*\)/g;
    while ((m = catchRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // function parameters: function foo(a, b, c)
    const funcParamRegex = /function\s+\w+\s*\(([^)]*)\)/g;
    while ((m = funcParamRegex.exec(content)) !== null) {
        const params = m[1];
        if (params.trim()) {
            params.split(',').forEach(p => {
                const name = p.trim().split(/\s*[=:]/)[0].trim();
                if (name) declared.add(name);
            });
        }
    }

    // arrow function params with parens: (a, b, c) => ... or ({a}, [b]) =>
    // For nested calls like reduce((a,b) => ...), the capture may include inner parens
    const arrowParamRegex = /\(([^)]*)\)\s*=>/g;
    while ((m = arrowParamRegex.exec(content)) !== null) {
        let params = m[1].trim();
        if (!params) continue;
        // Strip a leading '(' that comes from nested callback like reduce((a,b) => ...)
        if (params.startsWith('(')) {
            params = params.slice(1);
            if (params.endsWith(')')) params = params.slice(0, -1);
        }

        // Handle destructured object that may have been split: { key, label, cls }
        if (params.startsWith('{') && params.includes('}')) {
            // Extract everything between { and }
            const endBrace = params.indexOf('}');
            const inner = params.substring(1, endBrace);
            inner.split(',').forEach(item => {
                const name = item.trim().split(':')[0].trim();
                if (name) declared.add(name);
            });
            // Also handle any params after }
            const after = params.substring(endBrace + 1).trim();
            if (after.startsWith(',')) {
                after.substring(1).split(',').forEach(item => {
                    const name = item.trim().split(/\s*[=:]/)[0].trim();
                    if (name) declared.add(name);
                });
            }
        }
        // Handle destructured array that may have been split: [a, b]
        else if (params.startsWith('[') && params.includes(']')) {
            const endBracket = params.indexOf(']');
            const inner = params.substring(1, endBracket);
            inner.split(',').forEach(item => {
                const name = item.trim().split(/\s*=/)[0].trim();
                if (name) declared.add(name);
            });
        }
        // Simple comma-separated params: a, b, c
        else {
            params.split(',').forEach(p => {
                let trimmed = p.trim();
                if (!trimmed) return;
                const name = trimmed.split(/\s*[=:]/)[0].trim();
                if (name) declared.add(name);
            });
        }
    }

    // arrow function params without parens: x => ...
    const simpleArrowRegex = /\b(\w+)\s*=>/g;
    while ((m = simpleArrowRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    return declared;
}

function stripStringsAndComments(content) {
    // Replace string literals and template literals with spaces to preserve line numbers
    // Single-quoted strings
    let result = content.replace(/'(?:[^'\\]|\\.)*'/g, m => ' '.repeat(m.length));
    // Double-quoted strings
    result = result.replace(/"(?:[^"\\]|\\.)*"/g, m => ' '.repeat(m.length));
    // Template literals (may contain ${...} which we keep)
    result = result.replace(/`(?:[^`\\]|\\.|\$\{[^}]*\})*`/g, m => ' '.repeat(m.length));
    // Single-line comments
    result = result.replace(/\/\/.*$/gm, m => ' '.repeat(m.length));
    // Multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
    return result;
}

function findLeakage(filePath, content, declared) {
    const leakage = new Set();
    const cleanContent = stripStringsAndComments(content);
    const lines = cleanContent.split('\n');

    const idRegex = /\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];

        // Skip import/export lines
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) continue;

        let m;
        while ((m = idRegex.exec(line)) !== null) {
            const name = m[1];
            const pos = m.index;

            // Skip if declared locally
            if (declared.has(name)) continue;

            // Skip known globals
            if (GLOBALS.has(name)) continue;

            // Skip builtin methods
            if (BUILTIN_METHODS.has(name)) continue;

            // Skip if it's a property access: obj.name or obj?.name
            if (pos > 0) {
                const prev = line[pos - 1];
                if (prev === '.' || (pos > 1 && line.substring(pos - 2, pos) === '?.')) continue;
            }

            // Skip if followed by colon (object key in object literal)
            const after = line.substring(pos + name.length).trim();
            if (after.startsWith(':') && !after.startsWith('::')) continue;

            // Skip if preceded by 'new' (it's a constructor call)
            const before = line.substring(0, pos).trim();
            if (before.endsWith('new')) continue;

            // Skip common false positives (JS keywords, HTML tags, CSS properties)
            if (/^(return|typeof|instanceof|new|await|yield|delete|void|in|of|if|else|while|for|do|switch|case|break|continue|try|catch|finally|throw|with|debugger|default|extends|implements|interface|package|private|protected|public|static|var|let|const|function|class|import|export|from|as|true|false|null|undefined|async)$/.test(name)) continue;
            // HTML tags
            if (/^(div|span|p|h[1-6]|a|button|input|form|label|select|option|textarea|ul|ol|li|table|tr|td|th|thead|tbody|canvas|style|script|link|meta|head|body|html|header|footer|nav|section|article|aside|main|figure|figcaption|details|summary|dialog|template|slot|br|hr|img|svg|path|circle|rect|g|defs|use|clipPath|mask|filter|fe|stop|linearGradient|radialGradient)$/.test(name)) continue;
            // CSS properties / values
            if (/^(display|position|color|background|border|margin|padding|width|height|font|text|align|flex|grid|top|left|right|bottom|overflow|cursor|opacity|transform|transition|animation|z-index|pointer-events|min-width|max-width|min-height|max-height|white-space|line-height|font-size|font-weight|border-radius|box-shadow|text-align|justify-content|align-items|flex-direction|flex-wrap|gap|grid-template|grid-column|grid-row|box-sizing|content|float|clear|visibility|vertical-align|list-style|outline|border-color|border-width|border-style|background-color|background-image|background-size|background-position|color-scheme|accent-color|caret-color|column-count|column-gap|column-width|flex-basis|flex-grow|flex-shrink|order|perspective|perspective-origin|backface-visibility|clip|clip-path|mask-image|mask-size|mask-position|filter|backdrop-filter|mix-blend-mode|isolation|shape-outside|shape-margin|shape-image-threshold|writing-mode|direction|unicode-bidi|text-orientation|dominant-baseline|alignment-baseline|baseline-shift|vector-effect|paint-order|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|stroke-dashoffset|stroke-opacity|fill|fill-opacity|fill-rule|marker-start|marker-mid|marker-end|stop-color|stop-opacity|flood-color|flood-opacity|lighting-color|color-interpolation|color-interpolation-filters|color-rendering|image-rendering|shape-rendering|text-rendering|clip-rule)$/.test(name)) continue;
            // CSS class name suffixes commonly used in template literals
            if (/^(value|label|text|title|name|icon|badge|count|amount|total|sum|hint|error|success|warning|info|primary|secondary|tertiary|neutral|dark|light|muted|subtle|accent|highlight|overlay|backdrop|shadow|gradient|blur|focus|hover|active|disabled|selected|checked|indeterminate|empty|loading|skeleton|shimmer|pulse|bounce|fade|slide|zoom|flip|rotate|scale|translate|skew|origin|center|middle|start|end|between|around|evenly|stretch|baseline|auto|none|hidden|visible|scroll|fixed|sticky|relative|absolute|static|inherit|initial|revert|unset|normal|nowrap|pre|pre-line|pre-wrap|break-all|keep-all|break-word|uppercase|lowercase|capitalize|ellipsis|clip|decimal|disc|circle|square|lower-alpha|upper-alpha|lower-roman|upper-roman|lower-greek|upper-greek|armenian|georgian|none)$/.test(name)) continue;
            // Common UI action/state words found in template strings
            if (/^(Add|Edit|Delete|Save|Cancel|Confirm|Submit|Close|Open|Show|Hide|Toggle|Update|Create|Remove|Move|Copy|Paste|Cut|Undo|Redo|Refresh|Reload|Reset|Clear|Search|Filter|Sort|Export|Import|Download|Upload|Print|Share|Send|Reply|Forward|Archive|Restore|Merge|Split|Join|Link|Unlink|Lock|Unlock|Enable|Disable|Activate|Deactivate|Publish|Unpublish|Draft|Pending|Approved|Rejected|Completed|Failed|Success|Error|Warning|Info|Note|Tip|Help|Loading|Processing|Done|Pending|Scheduled|Expired|Overdue|Due|Remaining|Available|Selected|All|None|Any|Some|Many|Few|More|Less|Most|Least|Other|Another|Same|Different|New|Old|Current|Previous|Next|First|Last|Initial|Final|Total|Partial|Full|Empty|Valid|Invalid|Required|Optional|Default|Custom|Standard|Premium|Basic|Advanced|Simple|Complex|Easy|Hard|Fast|Slow|Quick|Long|Short|Small|Large|Big|Tiny|Mini|Max|Min|High|Low|Up|Down|Left|Right|Top|Bottom|Front|Back|Inside|Outside|Above|Below|Under|Over|Between|Among|Through|Across|Along|Around|Behind|Beyond|Before|After|Since|Until|While|During|Within|Without|Against|Toward|Upon|Onto|Into|Out|Off|On|In|At|By|For|From|Of|To|With|About|Above|Across|After|Against|Along|Among|Around|As|At|Before|Behind|Below|Beneath|Beside|Between|Beyond|But|By|Concerning|Considering|Despite|Down|During|Except|Following|For|From|In|Inside|Into|Like|Near|Next|Of|Off|On|Onto|Out|Outside|Over|Past|Regarding|Round|Since|Through|Throughout|Till|To|Toward|Under|Underneath|Unlike|Until|Up|Upon|With|Within|Without|And|Or|Nor|But|Yet|So|Because|Since|As|While|Although|Though|Even|If|Unless|Until|Before|After|Whether|Either|Neither|Both|All|Any|Each|Every|Few|Less|Little|Many|More|Most|Much|Neither|None|One|Other|Same|Several|Some|Such|That|These|This|Those|What|Which|Who|Whom|Whose|Why|How|When|Where|data|tab|last|config|by|remaining)$/.test(name)) continue;
            // Single-letter variables (common in callbacks and loops)
            if (/^[a-zA-Z]$/.test(name)) continue;

            leakage.add(`${name} (line ${lineNum + 1})`);
        }
    }

    return leakage;
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log('\n🌍 Global Leakage Detector\n');
console.log('Checking directory:', APP_DIR);

const files = fs.readdirSync(APP_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

let totalLeakage = 0;

for (const file of files) {
    const filePath = path.join(APP_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const declared = getDeclaredNames(content);
    const leakage = findLeakage(filePath, content, declared);

    if (leakage.size > 0) {
        console.log(`\n  ⚠️  ${file} — ${leakage.size} potential undeclared reference(s):`);
        for (const item of leakage) {
            console.log(`      ${item}`);
        }
        totalLeakage += leakage.size;
    }
}

if (totalLeakage === 0) {
    console.log(`\n  ✅ No potential global leakage detected in ${files.length} files.`);
    process.exit(0);
} else {
    console.log(`\n  ⚠️  Found ${totalLeakage} potential issue(s) across ${files.length} files.`);
    console.log('     Review each — some may be false positives (e.g., object keys, template literals).');
    process.exit(0); // warnings, not errors
}
