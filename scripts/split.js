#!/usr/bin/env node
/**
 * Split script for debt-snowball-card.js
 *
 * Reads dist/debt-snowball-card.js and breaks it into logical
 * modules under src/app/. Run this once to seed the modular structure.
 *
 * Usage: node scripts/split.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_FILE = path.join(ROOT, 'dist', 'debt-snowball-card.js');
const APP_DIR = path.join(ROOT, 'src', 'app');
const LOG_FILE = path.join(ROOT, 'scripts', 'split.log');

let logLines = [];
function log(msg) {
    logLines.push(msg);
    console.log(msg);
}

function flushLog() {
    fs.writeFileSync(LOG_FILE, logLines.join('\n') + '\n', 'utf-8');
}

try {
    if (!fs.existsSync(DIST_FILE)) {
        log(`ERROR: Missing dist file: ${DIST_FILE}`);
        flushLog();
        process.exit(1);
    }

    const raw = fs.readFileSync(DIST_FILE, 'utf-8');
    const lines = raw.split('\n');
    const totalLines = lines.length;

    log(`Splitting ${DIST_FILE} (${totalLines} lines)...`);
    log(`Output dir: ${APP_DIR}`);
    log('');

    fs.mkdirSync(APP_DIR, { recursive: true });

    function writeModule(name, startLine, endLine) {
        const safeEnd = Math.min(endLine, totalLines);
        const outPath = path.join(APP_DIR, name);
        const chunk = lines.slice(startLine - 1, safeEnd).join('\n') + '\n';
        fs.writeFileSync(outPath, chunk, 'utf-8');
        log(`  ✓  ${name} (${safeEnd - startLine + 1} lines, lines ${startLine}-${safeEnd})`);
    }

    // These line numbers were determined by manual inspection of the dist file.
    const SECTIONS = [
        { name: '00-header.js',     start: 1,    end: 29   },
        { name: '10-template.js',   start: 30,   end: 4472 },
        { name: '20-state.js',      start: 4473, end: 4521 },
        { name: '30-storage.js',    start: 4522, end: 4710 },
        { name: '40-advance.js',    start: 4711, end: 4788 },
        { name: '50-pure.js',       start: 4789, end: 4898 },
        { name: '60-modals.js',     start: 4899, end: 5059 },
        { name: '70-events.js',     start: 5060, end: 5434 },
        { name: '80-render.js',     start: 5435, end: totalLines },
    ];

    for (const section of SECTIONS) {
        writeModule(section.name, section.start, section.end);
    }

    log('');
    log(`✅ Split complete. Modules written to ${APP_DIR}`);
    log('');
    log('Next steps:');
    log('  1. Review the generated modules in src/app/');
    log('  2. Run: node scripts/build.js');
    log('  3. Verify dist/debt-snowball-card.js was regenerated correctly');
} catch (err) {
    log(`ERROR: ${err.message}`);
    log(err.stack);
    process.exitCode = 1;
} finally {
    flushLog();
}
