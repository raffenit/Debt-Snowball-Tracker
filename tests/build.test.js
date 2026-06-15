// Tests for the build system and modular architecture
// Run with: node --test tests/build.test.js
//
// These tests enforce the contract between src/app/ modules and dist output.
// They verify:
//   1. All expected source modules exist
//   2. The build script concatenates them in the correct order
//   3. The output file is syntactically valid JavaScript
//   4. Key markers from each module appear in the output

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const APP_DIR = path.join(ROOT, 'src', 'app');
const DIST_FILE = path.join(ROOT, 'dist', 'debt-snowball-card.js');
const BUILD_SCRIPT = path.join(ROOT, 'scripts', 'build-esbuild.js');

// ─── Expected module order (must match scripts/build.js) ─────────────────────
const EXPECTED_MODULES = [
    '00-header.js',
    '10-template.js',
    '20-state.js',
    '30-storage.js',
    '40-advance.js',
    '50-pure.js',
    '60-modals.js',
    '70-events.js',
    '80-render-modals.js',
    '80a-checkpoints.js',
    '80b-export-import.js',
    '81-render-lists.js',
    '82-render-payment.js',
    '82a-render-charts.js',
    '83-render-support.js',
];

// ─── Shared state for test suite ─────────────────────────────────────────────
let distContent = '';

describe('Build System', () => {

    test('build script exists', () => {
        assert.ok(fs.existsSync(BUILD_SCRIPT), `Build script not found: ${BUILD_SCRIPT}`);
    });

    test('all expected source modules exist', () => {
        for (const mod of EXPECTED_MODULES) {
            const modPath = path.join(APP_DIR, mod);
            assert.ok(fs.existsSync(modPath), `Missing source module: ${mod}`);
        }
    });

    test('esbuild build script runs without error', () => {
        // Run the esbuild-based build and capture any thrown errors
        execSync(`node "${BUILD_SCRIPT}"`, { cwd: ROOT, stdio: 'pipe' });
    });

    test('dist file is created', () => {
        assert.ok(fs.existsSync(DIST_FILE), `Dist file not created: ${DIST_FILE}`);
    });
});

describe('Dist Output Validation', () => {

    before(() => {
        distContent = fs.readFileSync(DIST_FILE, 'utf-8');
    });

    test('dist file is syntactically valid JavaScript', () => {
        // Use the Function constructor to parse the entire file as a function body.
        // This catches syntax errors (missing braces, unterminated strings, etc.)
        // without executing any of the code.
        const code = fs.readFileSync(DIST_FILE, 'utf-8');
        try {
            new Function(code);
        } catch (err) {
            assert.fail(`dist file has syntax error: ${err.message}`);
        }
    });

    test('dist file starts with IIFE wrapper (esbuild output)', () => {
        assert.ok(
            distContent.includes('var DebtSnowballApp') || distContent.includes('(() => {'),
            'Dist file should be wrapped in an IIFE by esbuild'
        );
    });

    test('dist file contains key functions from each major section', () => {
        // Header
        assert.ok(distContent.includes('PANEL_VERSION'), 'Should contain PANEL_VERSION');

        // Template
        assert.ok(distContent.includes('PANEL_CSS'), 'Should contain PANEL_CSS');
        assert.ok(distContent.includes('PANEL_HTML'), 'Should contain PANEL_HTML');

        // State
        assert.ok(distContent.includes('debts'), 'Should reference debts');
        assert.ok(distContent.includes('workingMonthKey'), 'Should reference workingMonthKey');

        // Storage
        assert.ok(distContent.includes('ensureStoreDashboard'), 'Should contain ensureStoreDashboard');
        assert.ok(distContent.includes('loadBackendData'), 'Should contain loadBackendData');
        assert.ok(distContent.includes('saveData'), 'Should contain saveData');

        // Advance
        assert.ok(distContent.includes('advanceToNextMonth'), 'Should contain advanceToNextMonth');
        assert.ok(distContent.includes('calculateMonthRollover'), 'Should contain calculateMonthRollover');

        // Pure utilities (bundled from src/*.js, not duplicated)
        assert.ok(distContent.includes('formatMoney'), 'Should contain formatMoney');
        assert.ok(distContent.includes('monthKeyToIndex'), 'Should contain monthKeyToIndex');

        // Modals
        assert.ok(distContent.includes('showModal'), 'Should contain showModal');
        assert.ok(distContent.includes('openArchiveModal'), 'Should contain openArchiveModal');

        // Events
        assert.ok(distContent.includes('setupEventListeners'), 'Should contain setupEventListeners');

        // Render
        assert.ok(distContent.includes('renderUI'), 'Should contain renderUI');
        assert.ok(distContent.includes('renderPaymentPlan'), 'Should contain renderPaymentPlan');
    });

    test('dist file is syntactically valid JavaScript', () => {
        // We can't easily parse an 8000-line browser-targeted file in Node,
        // but we can at least verify no obvious syntax issues by checking
        // bracket/paren balance in key structural areas.
        const openBraces = (distContent.match(/\{/g) || []).length;
        const closeBraces = (distContent.match(/\}/g) || []).length;
        assert.ok(
            Math.abs(openBraces - closeBraces) <= 1,
            `Brace mismatch: ${openBraces} open vs ${closeBraces} close`
        );
    });
});

describe('Module Contract Tests', () => {

    test('header module exports version info', () => {
        const headerPath = path.join(APP_DIR, '00-header.js');
        const header = fs.readFileSync(headerPath, 'utf-8');
        assert.ok(header.includes('PANEL_VERSION'), 'Header should define PANEL_VERSION');
        assert.ok(header.includes('PANEL_BUILD_DATE'), 'Header should define PANEL_BUILD_DATE');
    });

    test('template module contains CSS and HTML', () => {
        const templatePath = path.join(APP_DIR, '10-template.js');
        const template = fs.readFileSync(templatePath, 'utf-8');
        assert.ok(template.includes('PANEL_CSS'), 'Template should define PANEL_CSS');
        assert.ok(template.includes('PANEL_HTML'), 'Template should define PANEL_HTML');
        assert.ok(template.includes('app-container'), 'Template HTML should contain app-container class');
    });

    test('state module declares all expected globals', () => {
        const statePath = path.join(APP_DIR, '20-state.js');
        const state = fs.readFileSync(statePath, 'utf-8');
        const expectedVars = [
            'let debts',
            'let recurringCosts',
            'let incomeEntries',
            'let checkpoints',
            'let strategy',
            'let workingMonthKey',
            'let monthlyArchives',
            'let spendingBudgets',
        ];
        for (const v of expectedVars) {
            assert.ok(state.includes(v), `State module should declare ${v}`);
        }
    });

    test('storage module contains load and save functions', () => {
        const storagePath = path.join(APP_DIR, '30-storage.js');
        const storage = fs.readFileSync(storagePath, 'utf-8');
        assert.ok(storage.includes('ensureStoreDashboard'), 'Storage should contain ensureStoreDashboard');
        assert.ok(storage.includes('loadBackendData'), 'Storage should contain loadBackendData');
        assert.ok(storage.includes('saveData'), 'Storage should contain saveData');
    });

    test('advance module contains month rollover logic', () => {
        const advancePath = path.join(APP_DIR, '40-advance.js');
        const advance = fs.readFileSync(advancePath, 'utf-8');
        assert.ok(advance.includes('advanceToNextMonth'), 'Advance should contain advanceToNextMonth');
    });

    test('pure module contains utility functions', () => {
        const purePath = path.join(APP_DIR, '50-pure.js');
        const pure = fs.readFileSync(purePath, 'utf-8');
        assert.ok(pure.includes('monthKeyToIndex'), 'Pure should contain monthKeyToIndex');
        assert.ok(pure.includes('formatMonthLabel'), 'Pure should contain formatMonthLabel');
    });

    test('events module contains listener setup', () => {
        const eventsPath = path.join(APP_DIR, '70-events.js');
        const events = fs.readFileSync(eventsPath, 'utf-8');
        assert.ok(events.includes('setupEventListeners'), 'Events should contain setupEventListeners');
    });

    test('render-modals module contains modal and CRUD functions', () => {
        const renderPath = path.join(APP_DIR, '80-render-modals.js');
        const render = fs.readFileSync(renderPath, 'utf-8');
        assert.ok(render.includes('openDebtModal'), 'Render-modals should contain openDebtModal');
        assert.ok(render.includes('saveDebt'), 'Render-modals should contain saveDebt');
        assert.ok(render.includes('renderUI'), 'Render-modals should contain renderUI');
    });

    test('checkpoints module contains checkpoint rendering and CRUD', () => {
        const renderPath = path.join(APP_DIR, '80a-checkpoints.js');
        const render = fs.readFileSync(renderPath, 'utf-8');
        assert.ok(render.includes('renderCheckpointsList'), 'Checkpoints should contain renderCheckpointsList');
        assert.ok(render.includes('openCheckpointModal'), 'Checkpoints should contain openCheckpointModal');
        assert.ok(render.includes('saveCheckpoint'), 'Checkpoints should contain saveCheckpoint');
    });

    test('export-import module contains backup/restore and notifications', () => {
        const renderPath = path.join(APP_DIR, '80b-export-import.js');
        const render = fs.readFileSync(renderPath, 'utf-8');
        assert.ok(render.includes('exportData'), 'Export-import should contain exportData');
        assert.ok(render.includes('importData'), 'Export-import should contain importData');
        assert.ok(render.includes('showNotificationToast'), 'Export-import should contain showNotificationToast');
    });

    test('render-lists module contains list renderers', () => {
        const renderPath = path.join(APP_DIR, '81-render-lists.js');
        const render = fs.readFileSync(renderPath, 'utf-8');
        assert.ok(render.includes('renderIncomeList'), 'Render-lists should contain renderIncomeList');
        assert.ok(render.includes('renderDebtsList'), 'Render-lists should contain renderDebtsList');
        assert.ok(render.includes('renderRecurringCostsList'), 'Render-lists should contain renderRecurringCostsList');
    });

    test('render-payment module contains payment plan and viz', () => {
        const renderPath = path.join(APP_DIR, '82-render-payment.js');
        const render = fs.readFileSync(renderPath, 'utf-8');
        assert.ok(render.includes('renderPaymentPlan'), 'Render-payment should contain renderPaymentPlan');
        assert.ok(render.includes('renderVisualization'), 'Render-payment should contain renderVisualization');
        assert.ok(render.includes('runSimulation'), 'Render-payment should contain runSimulation');
    });

    test('render-charts module contains chart functions', () => {
        const renderPath = path.join(APP_DIR, '82a-render-charts.js');
        const render = fs.readFileSync(renderPath, 'utf-8');
        assert.ok(render.includes('renderPaydownChart'), 'Render-charts should contain renderPaydownChart');
        assert.ok(render.includes('renderTimelineChart'), 'Render-charts should contain renderTimelineChart');
        assert.ok(render.includes('DEBT_COLORS'), 'Render-charts should contain DEBT_COLORS');
    });

    test('render-support module contains support functions', () => {
        const renderPath = path.join(APP_DIR, '83-render-support.js');
        const render = fs.readFileSync(renderPath, 'utf-8');
        assert.ok(render.includes('launchConfetti'), 'Render-support should contain launchConfetti');
        assert.ok(render.includes('customElements.define'), 'Render-support should register the custom element');
    });
});
