#!/usr/bin/env node
/**
 * Build script for debt-snowball-card.js
 *
 * Concatenates modular source files into a single self-contained
 * Home Assistant Lovelace card that can be loaded as a JavaScript module.
 *
 * Usage: node scripts/build.js
 * Output: dist/debt-snowball-card.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'app');
const OUT_FILE = path.join(ROOT, 'dist', 'debt-snowball-card.js');

function build() {
    console.log('Building debt-snowball-card.js...');

    // Auto-discover modules from src/app/ — alphabetical order enforces dependency chain
    // Exclude ES module files (index.js, state.js) used by the new esbuild build.
    const files = fs.readdirSync(SRC_DIR)
        .filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'state.js')
        .sort();

    if (files.length === 0) {
        console.error(`No .js files found in ${SRC_DIR}`);
        process.exit(1);
    }

    let output = '';

    for (const file of files) {
        const filePath = path.join(SRC_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        output += `// ─── ${file} ─────────────────────────────────────────────────────────────────\n`;
        output += content;
        output += '\n\n';
        console.log(`  ✓  ${file}`);
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, output, 'utf-8');

    const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
    console.log(`\n✅ Built ${OUT_FILE} (${sizeKb} KB)`);
}

build();
