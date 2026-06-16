#!/usr/bin/env node
/**
 * Module Integrity Validator
 *
 * Pre-build validation that checks:
 *   1. Every top-level declaration (function, async function, const, class) has an export
 *   2. Every import resolves to an actual export in the source module
 *   3. No duplicate declarations across modules (same name in two files)
 *
 * Usage: node scripts/validate-modules.js [directory]
 *   Default directory: src/app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const APP_DIR = process.argv[2] ? path.resolve(ROOT, process.argv[2]) : path.join(ROOT, 'src', 'app');

let errors = 0;
let warnings = 0;

function logError(msg) { console.error(`  ❌ ${msg}`); errors++; }
function logWarn(msg)  { console.warn(`  ⚠️  ${msg}`); warnings++; }
function logOk(msg)    { console.log(`  ✅ ${msg}`); }

// ─── 1. Collect all exports per file ────────────────────────────────────────

const files = fs.readdirSync(APP_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

const exportsPerFile = {};
const allExports = new Map();       // name -> file
const allDecls = new Map();         // name -> file (for detecting duplicates)

for (const file of files) {
    const content = fs.readFileSync(path.join(APP_DIR, file), 'utf-8');
    const exported = new Set();
    const declared = new Set();

    // function declarations (including async)
    const funcDeclRegex = /^(?:async\s+)?function\s+(\w+)\s*\(/gm;
    let m;
    while ((m = funcDeclRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // const declarations at top level
    const constDeclRegex = /^const\s+(\w+)\s*=/gm;
    while ((m = constDeclRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // class declarations
    const classDeclRegex = /^class\s+(\w+)/gm;
    while ((m = classDeclRegex.exec(content)) !== null) {
        declared.add(m[1]);
    }

    // export blocks: export { a, b, c };
    const exportBlockRegex = /export\s*\{([^}]+)\}/g;
    while ((m = exportBlockRegex.exec(content)) !== null) {
        m[1].split(',').forEach(s => exported.add(s.trim()));
    }

    // export const/function declarations
    const exportDeclRegex = /^export\s+(?:const|function|class|async\s+function)\s+(\w+)/gm;
    while ((m = exportDeclRegex.exec(content)) !== null) {
        exported.add(m[1]);
    }

    // export { name } from './module.js' (re-exports)
    const reExportRegex = /export\s*\{([^}]+)\}\s+from\s+['"]/g;
    while ((m = reExportRegex.exec(content)) !== null) {
        m[1].split(',').forEach(s => exported.add(s.trim()));
    }

    exportsPerFile[file] = exported;

    for (const name of declared) {
        allDecls.set(name, file);
        if (exported.has(name)) {
            allExports.set(name, file);
        }
    }
}

// ─── 2. Check for missing exports ───────────────────────────────────────────

console.log('\n📦 Module Integrity Validator\n');
console.log('Checking directory:', APP_DIR);
console.log(`Files found: ${files.length}\n`);

console.log('━━━ 1. Missing Exports ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let missingCount = 0;
for (const file of files) {
    const content = fs.readFileSync(path.join(APP_DIR, file), 'utf-8');
    const declared = new Set();

    const funcDeclRegex = /^(?:async\s+)?function\s+(\w+)\s*\(/gm;
    let m;
    while ((m = funcDeclRegex.exec(content)) !== null) declared.add(m[1]);

    const constDeclRegex = /^const\s+(\w+)\s*=/gm;
    while ((m = constDeclRegex.exec(content)) !== null) declared.add(m[1]);

    const classDeclRegex = /^class\s+(\w+)/gm;
    while ((m = classDeclRegex.exec(content)) !== null) declared.add(m[1]);

    const exported = exportsPerFile[file];

    // Check for classes used in customElements.define() — they don't need export
    const usedInCustomElementsDefine = new Set();
    const ceRegex = /customElements\.define\s*\(\s*['"][^'"]+['"]\s*,\s*(\w+)\s*\)/g;
    while ((m = ceRegex.exec(content)) !== null) {
        usedInCustomElementsDefine.add(m[1]);
    }

    for (const name of declared) {
        if (!exported.has(name) && !usedInCustomElementsDefine.has(name)) {
            logError(`${file}: '${name}' is declared but not exported`);
            missingCount++;
        }
    }
}

if (missingCount === 0) {
    logOk('All top-level declarations are exported');
}

// ─── 3. Check for unresolved imports ────────────────────────────────────────

console.log('\n━━━ 2. Unresolved Imports ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let unresolvedCount = 0;
for (const file of files) {
    const content = fs.readFileSync(path.join(APP_DIR, file), 'utf-8');
    const importRegex = /import\s*\{([^}]+)\}\s*from\s+['"]([^'"]+)['"]/g;
    let m;

    while ((m = importRegex.exec(content)) !== null) {
        const names = m[1].split(',').map(s => s.trim());
        const sourcePath = m[2];

        // Resolve relative imports
        if (sourcePath.startsWith('.')) {
            let resolved;
            if (sourcePath.endsWith('.js')) {
                resolved = path.resolve(APP_DIR, sourcePath);
            } else {
                resolved = path.resolve(APP_DIR, sourcePath + '.js');
            }

            // Handle ../core/ imports (outside app dir)
            if (!resolved.startsWith(APP_DIR)) {
                // Check if file exists
                if (!fs.existsSync(resolved)) {
                    logError(`${file}: import from '${sourcePath}' — file not found`);
                    unresolvedCount++;
                    continue;
                }
                // For core imports, we trust they exist and are correct
                continue;
            }

            const sourceFile = path.basename(resolved);
            const sourceExports = exportsPerFile[sourceFile] || new Set();

            for (const name of names) {
                if (!sourceExports.has(name)) {
                    logError(`${file}: imports '${name}' from '${sourcePath}' but '${name}' is not exported by ${sourceFile}`);
                    unresolvedCount++;
                }
            }
        }
    }
}

if (unresolvedCount === 0) {
    logOk('All imports resolve to exported names');
}

// ─── 4. Check for duplicate declarations ────────────────────────────────────

console.log('\n━━━ 3. Duplicate Declarations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const nameToFiles = {};
for (const [name, file] of allDecls) {
    nameToFiles[name] = nameToFiles[name] || [];
    nameToFiles[name].push(file);
}

let dupCount = 0;
for (const [name, fileList] of Object.entries(nameToFiles)) {
    if (fileList.length > 1) {
        logError(`'${name}' declared in ${fileList.length} files: ${fileList.join(', ')}`);
        dupCount++;
    }
}

if (dupCount === 0) {
    logOk('No duplicate declarations across modules');
}

// ─── Summary ────────────────────────────────────────────────────────────────

console.log('\n━━━ Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0) {
    console.log('\n❌ Validation failed. Fix errors before building.');
    process.exit(1);
} else if (warnings > 0) {
    console.log('\n⚠️  Validation passed with warnings.');
    process.exit(0);
} else {
    console.log('\n✅ All checks passed.');
    process.exit(0);
}
