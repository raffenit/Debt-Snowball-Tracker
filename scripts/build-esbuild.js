#!/usr/bin/env node
/**
 * ESBuild-based bundler for debt-snowball-card.js
 *
 * Bundles the ES module graph in src/app/ into a single IIFE for Home Assistant.
 * App modules import shared logic directly from src/*.js (date-utils, pure-utils,
 * simulation, rollover, constants) instead of duplicating implementations.
 *
 * Usage: node scripts/build-esbuild.js
 * Output: dist/debt-snowball-card.js
 */

import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'dist', 'debt-snowball-card.js');

async function build() {
    console.log('Building debt-snowball-card.js with esbuild...');

    const result = await esbuild.build({
        entryPoints: [path.join(ROOT, 'src', 'app', 'index.js')],
        bundle: true,
        outfile: OUT_FILE,
        format: 'iife',
        globalName: 'DebtSnowballApp',
        sourcemap: true,
        minify: false, // Keep readable for debugging
        target: 'es2020',
        // Allow importing from parent directories (src/*.js from src/app/*.js)
        absWorkingDir: ROOT,
    });

    const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
    console.log(`\n✅ Built ${OUT_FILE} (${sizeKb} KB)`);

    if (result.errors.length > 0) {
        console.error('\n❌ Build errors:');
        result.errors.forEach(e => console.error(e.text));
        process.exit(1);
    }

    if (result.warnings.length > 0) {
        console.warn('\n⚠️  Build warnings:');
        result.warnings.forEach(w => console.warn(w.text));
    }
}

build().catch(err => {
    console.error('Build failed:', err.message);
    process.exit(1);
});
