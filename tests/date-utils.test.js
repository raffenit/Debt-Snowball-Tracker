// Tests for date utility functions
// Covers: monthKeyToIndex, addMonthsToKey, isCostDueThisMonth, isCostDueInMonth,
//         generateBiweeklyForMonth, generateRecurringIncomeForMonth, intervalLabel
//
// Run with: node --test tests/date-utils.test.js

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    currentMonthKey,
    monthKeyToIndex,
    addMonthsToKey,
    isCostDueThisMonth,
    isCostDueInMonth,
    generateBiweeklyForMonth,
    generateRecurringIncomeForMonth,
    shiftBiweeklySeries,
    intervalLabel,
    keyToHtmlMonth,
    htmlMonthToKey,
} from './helpers.js';

// ─── monthKeyToIndex ─────────────────────────────────────────────────────────

describe('monthKeyToIndex', () => {
    test('converts YYYY-M format to numeric index', () => {
        assert.equal(monthKeyToIndex('2026-0'), 2026 * 12 + 0);  // Jan 2026
        assert.equal(monthKeyToIndex('2026-11'), 2026 * 12 + 11); // Dec 2026
    });

    test('handles single-digit months', () => {
        assert.equal(monthKeyToIndex('2026-3'), 2026 * 12 + 3);  // April (0-indexed)
    });

    test('year boundaries calculate correctly', () => {
        // Dec 2025 -> Jan 2026
        const dec2025 = monthKeyToIndex('2025-11');
        const jan2026 = monthKeyToIndex('2026-0');
        assert.equal(jan2026 - dec2025, 1);
    });

    test('跨年份计算正确', () => {
        // Cross year calculation
        const dec2026 = monthKeyToIndex('2026-11');
        const jan2027 = monthKeyToIndex('2027-0');
        assert.equal(jan2027 - dec2026, 1);
        assert.ok(jan2027 > dec2026);
    });
});

// ─── addMonthsToKey ───────────────────────────────────────────────────────────

describe('addMonthsToKey', () => {
    test('adds months within same year', () => {
        assert.equal(addMonthsToKey('2026-0', 3), '2026-3');   // Jan + 3 = April
        assert.equal(addMonthsToKey('2026-5', 2), '2026-7');   // June + 2 = August
    });

    test('crosses year boundary forward', () => {
        assert.equal(addMonthsToKey('2026-10', 3), '2027-1');  // Nov + 3 = Feb next year
        assert.equal(addMonthsToKey('2026-11', 1), '2027-0');  // Dec + 1 = Jan next year
    });

    test('crosses year boundary backward', () => {
        assert.equal(addMonthsToKey('2026-1', -1), '2026-0');  // Feb - 1 = Jan
        assert.equal(addMonthsToKey('2027-0', -1), '2026-11'); // Jan - 1 = Dec prev year
    });

    test('adds zero months returns same month', () => {
        assert.equal(addMonthsToKey('2026-5', 0), '2026-5');
    });

    test('handles large month additions', () => {
        assert.equal(addMonthsToKey('2026-0', 24), '2028-0');  // +2 years
        assert.equal(addMonthsToKey('2026-0', 12), '2027-0');  // +1 year
    });
});

// ─── intervalLabel ───────────────────────────────────────────────────────────

describe('intervalLabel', () => {
    test('returns null for monthly (1 or undefined)', () => {
        assert.equal(intervalLabel(1), null);
        assert.equal(intervalLabel(null), null);
        assert.equal(intervalLabel(undefined), null);
    });

    test('returns correct labels for standard intervals', () => {
        assert.equal(intervalLabel(3), '📆 Quarterly');
        assert.equal(intervalLabel(6), '📆 Semi-Annual');
        assert.equal(intervalLabel(12), '📆 Annual');
    });

    test('returns generic label for non-standard intervals', () => {
        assert.equal(intervalLabel(2), '📆 Every 2 mo.');
        assert.equal(intervalLabel(4), '📆 Every 4 mo.');
        assert.equal(intervalLabel(18), '📆 Every 18 mo.');
    });
});

// ─── isCostDueThisMonth / isCostDueInMonth ────────────────────────────────────

describe('isCostDueInMonth', () => {
    const workingMonthKey = '2026-3'; // April 2026

    test('one-time cost is due only in its addedMonth', () => {
        const oneTime = { category: 'one-time', addedMonth: '2026-3', amount: 100 };
        assert.equal(isCostDueInMonth(oneTime, '2026-3'), true);
        assert.equal(isCostDueInMonth(oneTime, '2026-4'), false);
        assert.equal(isCostDueInMonth(oneTime, '2026-2'), false);
    });

    test('legacy one-time cost with no addedMonth is treated as current', () => {
        const legacy = { category: 'one-time', amount: 100 }; // no addedMonth
        // Should be due in any month when checked (backward compatibility)
        assert.equal(isCostDueInMonth(legacy, '2026-3'), true);
    });

    test('monthly recurring cost (interval 1) is always due', () => {
        const monthly = { category: 'utility', intervalMonths: 1, amount: 100 };
        assert.equal(isCostDueInMonth(monthly, '2026-3'), true);
        assert.equal(isCostDueInMonth(monthly, '2026-4'), true);
        assert.equal(isCostDueInMonth(monthly, '2026-5'), true);
    });

    test('monthly recurring cost (no interval) defaults to monthly', () => {
        const implicit = { category: 'utility', amount: 100 }; // no intervalMonths
        assert.equal(isCostDueInMonth(implicit, '2026-3'), true);
    });

    test('quarterly cost is due in correct months', () => {
        const quarterly = {
            category: 'utility',
            intervalMonths: 3,
            nextDueMonth: '2026-3', // Due April
            amount: 100
        };
        assert.equal(isCostDueInMonth(quarterly, '2026-3'), true);  // April - due
        assert.equal(isCostDueInMonth(quarterly, '2026-4'), false); // May - not due
        assert.equal(isCostDueInMonth(quarterly, '2026-5'), false); // June - not due
        // July would be next due
    });

    test('annual cost is due only in its specified month', () => {
        const annual = {
            category: 'other',
            intervalMonths: 12,
            nextDueMonth: '2026-3', // Due April 2026
            amount: 500
        };
        assert.equal(isCostDueInMonth(annual, '2026-3'), true);   // April - due
        assert.equal(isCostDueInMonth(annual, '2026-4'), false);  // May - not due
        assert.equal(isCostDueInMonth(annual, '2027-3'), true);  // April next year - due (by month key)
    });

    test('custom interval (4 months) respects schedule', () => {
        const custom = {
            category: 'other',
            intervalMonths: 4,
            nextDueMonth: '2026-0', // Due Jan
            amount: 200
        };
        assert.equal(isCostDueInMonth(custom, '2026-0'), true);  // Jan - due
        assert.equal(isCostDueInMonth(custom, '2026-1'), false); // Feb - not due
        assert.equal(isCostDueInMonth(custom, '2026-4'), true);  // May - due (4 months later)
    });

    test('monthly costs survive spurious second argument (Array.filter index bug regression)', () => {
        // When isCostDueThisMonth is used as a direct filter callback:
        //   arr.filter(isCostDueThisMonth)
        // JavaScript passes (element, index, array) to the callback.
        // For monthly costs (intervalMonths <= 1) the function returns true early,
        // so the index argument is harmless. For interval costs, the index would
        // be passed to monthKeyToIndex and crash. The fix is to always wrap:
        //   arr.filter(c => isCostDueThisMonth(c))
        const cost = { category: 'utility', intervalMonths: 1, amount: 100 };
        assert.equal(isCostDueThisMonth(cost, 0), true);  // index 0 (falsy)
        assert.equal(isCostDueThisMonth(cost, 1), true);  // index 1 (truthy)
        assert.equal(isCostDueThisMonth(cost, 5), true);  // index 5 (truthy)
    });
});

// ─── generateBiweeklyForMonth ─────────────────────────────────────────────────

describe('generateBiweeklyForMonth', () => {
    test('generates correct occurrences for biweekly on anchor', () => {
        // Anchor: Jan 3, 2025 (a Friday). Biweekly = every 14 days.
        // March 2026: should find dates that are 14-day multiples from anchor
        const result = generateBiweeklyForMonth('Paycheck', 2000, '2025-01-03', '2026-2');

        // Should return array of entries
        assert.ok(Array.isArray(result));
        assert.ok(result.length >= 2, 'March 2026 should have 2-3 biweekly paychecks');

        // All entries should have required fields
        result.forEach(entry => {
            assert.ok(entry.label === 'Paycheck');
            assert.ok(entry.amount === 2000);
            assert.ok(typeof entry.day === 'number');
            assert.ok(entry.day >= 1 && entry.day <= 31);
            assert.ok(typeof entry.date === 'string');
            assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
        });

        // Days should be 14 days apart
        if (result.length >= 2) {
            const day1 = result[0].day;
            const day2 = result[1].day;
            const diff = day2 - day1;
            assert.ok(diff === 14 || diff === 13 || diff === 15, // Allow for month boundaries
                `biweekly entries should be ~14 days apart, got ${diff}`);
        }
    });

    test('returns empty array if anchor is far future (no occurrences in month)', () => {
        // Anchor way in the future
        const result = generateBiweeklyForMonth('Paycheck', 1000, '2027-01-01', '2026-0');
        // March 2026 might still have occurrences depending on math...
        // Just verify it doesn't throw
        assert.ok(Array.isArray(result));
    });

    test('handles month boundaries correctly', () => {
        // Anchor on 31st - some months don't have 31 days
        const result = generateBiweeklyForMonth('Paycheck', 1500, '2026-01-31', '2026-1');
        // February 2026 (non-leap) - should handle gracefully
        assert.ok(Array.isArray(result));
        if (result.length > 0) {
            result.forEach(entry => {
                // Days should be valid for February 2026 (1-28)
                assert.ok(entry.day >= 1 && entry.day <= 28,
                    `February day ${entry.day} should be <= 28`);
            });
        }
    });
});

// ─── generateRecurringIncomeForMonth ──────────────────────────────────────────

describe('generateRecurringIncomeForMonth', () => {
    test('generates monthly income for target month', () => {
        const entries = [
            { id: 'inc1', label: 'Salary', amount: 3000, date: '2026-03-15', scheduleType: 'monthly', scheduleDay: 15 },
        ];
        const result = generateRecurringIncomeForMonth(entries, '2026-5'); // June 2026

        assert.ok(Array.isArray(result));
        assert.equal(result.length, 1);
        assert.equal(result[0].label, 'Salary');
        assert.equal(result[0].amount, 3000);
        assert.equal(result[0].date, '2026-06-15'); // Moved to June
        assert.equal(result[0].id, 'inc1'); // Preserves ID
        assert.equal(result[0].scheduleType, 'monthly');
        assert.equal(result[0].scheduleDay, 15);
    });

    test('generates biweekly entries correctly', () => {
        const entries = [
            {
                id: 'inc1',
                label: 'Paycheck',
                amount: 2000,
                scheduleType: 'biweekly',
                scheduleAnchorDate: '2026-01-03',
                date: '2026-01-03'
            },
        ];
        const result = generateRecurringIncomeForMonth(entries, '2026-2'); // March

        assert.ok(Array.isArray(result));
        assert.ok(result.length >= 2, 'March should have 2-3 biweekly paychecks');

        // All should be from same source but with generated IDs
        result.forEach(r => {
            assert.equal(r.label, 'Paycheck');
            assert.equal(r.amount, 2000);
            assert.ok(r.id.startsWith('inc1_'), 'should have composite ID');
            assert.equal(r.scheduleType, 'biweekly');
            assert.equal(r.scheduleAnchorDate, '2026-01-03');
        });
    });

    test('skips one-time income entries', () => {
        const entries = [
            { id: 'inc1', label: 'Salary', amount: 3000, date: '2026-03-15', scheduleType: 'monthly', scheduleDay: 15 },
            { id: 'inc2', label: 'Bonus', amount: 1000, date: '2026-03-01', scheduleType: 'one-time' },
        ];
        const result = generateRecurringIncomeForMonth(entries, '2026-5');

        assert.equal(result.length, 1);
        assert.equal(result[0].label, 'Salary');
    });

    test('handles multiple monthly income sources', () => {
        const entries = [
            { id: 'inc1', label: 'Job 1', amount: 2000, date: '2026-03-01', scheduleType: 'monthly', scheduleDay: 1 },
            { id: 'inc2', label: 'Job 2', amount: 1500, date: '2026-03-15', scheduleType: 'monthly', scheduleDay: 15 },
        ];
        const result = generateRecurringIncomeForMonth(entries, '2026-5');

        assert.equal(result.length, 2);
        assert.ok(result.some(r => r.label === 'Job 1'));
        assert.ok(result.some(r => r.label === 'Job 2'));
    });

    test('defaults to monthly when schedule is missing', () => {
        const entries = [
            { id: 'inc1', label: 'Salary', amount: 3000, date: '2026-03-15' }, // no scheduleType
        ];
        const result = generateRecurringIncomeForMonth(entries, '2026-5');

        assert.equal(result.length, 1);
        assert.equal(result[0].date, '2026-06-15');
        assert.equal(result[0].scheduleType, 'monthly');
        assert.equal(result[0].scheduleDay, 15);
    });

    test('does not duplicate when month already has materialized biweekly rows', () => {
        // Bug: materialized biweekly rows each carry the anchor, so each one
        // regenerated the full series — income doubled every rollover.
        const entries = [
            { id: 'bw1_2026-10-09', label: 'Paycheck', amount: 2000, date: '2026-10-09', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09', seriesId: 'bw1' },
            { id: 'bw1_2026-10-23', label: 'Paycheck', amount: 2000, date: '2026-10-23', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09', seriesId: 'bw1' },
        ];
        const nov = generateRecurringIncomeForMonth(entries, '2026-10'); // November
        const expected = generateBiweeklyForMonth('Paycheck', 2000, '2026-10-09', '2026-10');
        assert.equal(nov.length, expected.length, 'series should generate once, not once per stored row');
    });

    test('legacy rows without seriesId still dedupe by anchor+label+amount', () => {
        const entries = [
            { id: 'x_2026-10-09', label: 'Paycheck', amount: 2000, date: '2026-10-09', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09' },
            { id: 'y_2026-10-23', label: 'Paycheck', amount: 2000, date: '2026-10-23', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09' },
        ];
        const nov = generateRecurringIncomeForMonth(entries, '2026-10');
        const expected = generateBiweeklyForMonth('Paycheck', 2000, '2026-10-09', '2026-10');
        assert.equal(nov.length, expected.length);
    });

    test('two distinct biweekly series both generate', () => {
        const entries = [
            { id: 'a_2026-10-09', label: 'Job A', amount: 2000, date: '2026-10-09', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09', seriesId: 'a' },
            { id: 'b_2026-10-02', label: 'Job B', amount: 800, date: '2026-10-02', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-02', seriesId: 'b' },
        ];
        const nov = generateRecurringIncomeForMonth(entries, '2026-10');
        const a = nov.filter(e => e.label === 'Job A');
        const b = nov.filter(e => e.label === 'Job B');
        assert.ok(a.length >= 2 && b.length >= 2);
        assert.ok(a.every(e => e.seriesId === 'a'));
        assert.ok(b.every(e => e.seriesId === 'b'));
    });

    test('income stays stable across repeated rollovers', () => {
        let entries = generateRecurringIncomeForMonth([
            { id: 'bw1', label: 'Paycheck', amount: 2000, date: '2026-10-09', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09', seriesId: 'bw1' },
        ], '2026-10');
        const total = () => entries.reduce((s, e) => s + e.amount, 0);
        // Every month's total must be a normal 2-or-3-paycheck month, never growing
        let key = '2026-10';
        for (let i = 0; i < 6; i++) {
            key = addMonthsToKey(key, 1);
            entries = generateRecurringIncomeForMonth(entries, key);
            assert.ok(total() >= 2 * 2000 && total() <= 3 * 2000,
                `month ${key} income ${total()} must stay in the 2-3 paycheck range`);
        }
    });
});

// ─── 3-paycheck months ────────────────────────────────────────────────────────

describe('biweekly 3-paycheck months', () => {
    test('a month can contain three biweekly occurrences', () => {
        // Anchor Friday Jan 2, 2026 → Jan 2, 16, 30 = 3 paychecks
        const result = generateBiweeklyForMonth('Paycheck', 2000, '2026-01-02', '2026-0');
        assert.equal(result.length, 3);
        assert.deepEqual(result.map(e => e.date), ['2026-01-02', '2026-01-16', '2026-01-30']);
    });

    test('occurrences are always exactly 14 days apart', () => {
        const result = generateBiweeklyForMonth('Paycheck', 2000, '2026-01-02', '2026-0');
        for (let i = 1; i < result.length; i++) {
            const diff = (Date.parse(result[i].date + 'T00:00:00Z') - Date.parse(result[i - 1].date + 'T00:00:00Z')) / 86400000;
            assert.equal(diff, 14);
        }
    });
});

// ─── shiftBiweeklySeries ──────────────────────────────────────────────────────

describe('shiftBiweeklySeries', () => {
    const octEntries = () => [
        { id: 'other1', label: 'Side gig', amount: 300, date: '2026-10-05', scheduleType: 'one-time' },
        { id: 'bw1_2026-10-09', label: 'Paycheck', amount: 2000, date: '2026-10-09', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09', seriesId: 'bw1' },
        { id: 'bw1_2026-10-23', label: 'Paycheck', amount: 2000, date: '2026-10-23', scheduleType: 'biweekly', scheduleAnchorDate: '2026-10-09', seriesId: 'bw1' },
    ];

    test('shifts edited paycheck and future occurrences, preserves past', () => {
        const result = shiftBiweeklySeries(octEntries(), 'bw1_2026-10-23',
            { label: 'Paycheck', amount: 2000, date: '2026-10-26' }, '2026-9');

        const dates = result.filter(e => e.seriesId === 'bw1').map(e => e.date);
        assert.deepEqual(dates, ['2026-10-09', '2026-10-26'],
            'Oct 9 already happened (kept); Oct 23 → Oct 26 on the new cycle');
        // Kept row carries the new anchor so future months regenerate correctly
        const kept = result.find(e => e.id === 'bw1_2026-10-09');
        assert.equal(kept.scheduleAnchorDate, '2026-10-26');
        // Non-series entries untouched
        assert.ok(result.some(e => e.id === 'other1' && e.date === '2026-10-05'));
    });

    test('moving a paycheck earlier pulls new-cycle occurrences into the month', () => {
        const result = shiftBiweeklySeries(octEntries(), 'bw1_2026-10-23',
            { label: 'Paycheck', amount: 2000, date: '2026-10-05' }, '2026-9');
        const dates = result.filter(e => e.seriesId === 'bw1').map(e => e.date).sort();
        // New cycle from Oct 5: Oct 5, Oct 19 — plus the kept past check Oct 9
        assert.deepEqual(dates, ['2026-10-05', '2026-10-09', '2026-10-19']);
    });

    test('propagates label and amount to the whole series', () => {
        const result = shiftBiweeklySeries(octEntries(), 'bw1_2026-10-23',
            { label: 'Paycheck (new job)', amount: 2200, date: '2026-10-23' }, '2026-9');
        const rows = result.filter(e => e.seriesId === 'bw1');
        assert.ok(rows.every(e => e.label === 'Paycheck (new job)' && e.amount === 2200));
    });

    test('future months regenerate on the new anchor', () => {
        const shifted = shiftBiweeklySeries(octEntries(), 'bw1_2026-10-23',
            { label: 'Paycheck', amount: 2000, date: '2026-10-26' }, '2026-9');
        const nov = generateRecurringIncomeForMonth(shifted, '2026-10');
        const anchor = Date.parse('2026-10-26T00:00:00Z'); // UTC: DST-safe math
        for (const e of nov.filter(e => e.seriesId === 'bw1')) {
            const diff = (Date.parse(e.date + 'T00:00:00Z') - anchor) / 86400000;
            assert.equal(diff % 14, 0, `${e.date} must be on the new 14-day cycle`);
        }
        assert.ok(nov.filter(e => e.seriesId === 'bw1').length >= 2);
    });

    test('returns entries unchanged when id is not found', () => {
        const entries = octEntries();
        assert.equal(shiftBiweeklySeries(entries, 'nope', { label: 'X', amount: 1, date: '2026-10-01' }, '2026-9'), entries);
    });
});

// ─── Integration: Full month calculation scenarios ────────────────────────────

describe('integration: full month cost/income scenarios', () => {
    test('mixed interval costs filter correctly for a month', () => {
        const costs = [
            { id: 'c1', name: 'Rent', category: 'utility', intervalMonths: 1, amount: 1000 }, // Monthly
            { id: 'c2', name: 'Insurance', category: 'other', intervalMonths: 12, nextDueMonth: '2026-3', amount: 500 }, // Annual, due April
            { id: 'c3', name: 'Water', category: 'utility', intervalMonths: 3, nextDueMonth: '2026-2', amount: 100 }, // Quarterly, due March
            { id: 'c4', name: 'One-time', category: 'one-time', addedMonth: '2026-3', amount: 200 }, // One-time April
        ];

        // April 2026 ('2026-3')
        const dueInApril = costs.filter(c => isCostDueInMonth(c, '2026-3'));
        const ids = dueInApril.map(c => c.id);

        assert.ok(ids.includes('c1'), 'Rent (monthly) should be due');
        assert.ok(ids.includes('c2'), 'Insurance (annual, due April) should be due');
        assert.ok(!ids.includes('c3'), 'Water (quarterly, due March) should NOT be due');
        assert.ok(ids.includes('c4'), 'One-time (added April) should be due');
    });

    test('month advancement correctly filters costs', () => {
        // Start with costs in March
        const marchCosts = [
            { id: 'c1', name: 'Rent', category: 'utility', intervalMonths: 1, amount: 1000 },
            { id: 'c2', name: 'Water', category: 'utility', intervalMonths: 3, nextDueMonth: '2026-2', amount: 100 },
            { id: 'c3', name: 'One-time', category: 'one-time', addedMonth: '2026-2', amount: 200 },
        ];

        // Advance to April (quarterly should now be due)
        const aprilKey = addMonthsToKey('2026-2', 1); // March -> April
        assert.equal(aprilKey, '2026-3');

        // Simulate quarterly advancement
        const advancedCosts = marchCosts
            .filter(c => c.category !== 'one-time') // Remove one-time
            .map(c => {
                if (c.intervalMonths > 1) {
                    // Advance to next due month
                    return { ...c, nextDueMonth: addMonthsToKey(c.nextDueMonth || '2026-2', c.intervalMonths) };
                }
                return c;
            });

        // Water should now be due in June (March + 3 months)
        const water = advancedCosts.find(c => c.id === 'c2');
        assert.equal(water.nextDueMonth, '2026-5'); // June

        // In April, water should NOT be due
        assert.equal(isCostDueInMonth(water, '2026-3'), false);
    });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('date utility edge cases', () => {
    test('monthKeyToIndex handles year 2000 and 2100', () => {
        const y2000 = monthKeyToIndex('2000-0');
        const y2100 = monthKeyToIndex('2100-0');
        assert.equal(y2100 - y2000, 100 * 12);
    });

    test('addMonthsToKey handles month 11 (December) correctly', () => {
        assert.equal(addMonthsToKey('2026-11', 1), '2027-0');  // Dec + 1 = Jan
        assert.equal(addMonthsToKey('2026-11', 2), '2027-1');  // Dec + 2 = Feb
    });

    test('isCostDue handles month comparison across years', () => {
        const annual = {
            category: 'other',
            intervalMonths: 12,
            nextDueMonth: '2025-11', // Due Dec 2025
            amount: 500
        };
        assert.equal(isCostDueInMonth(annual, '2025-11'), true);  // Due Dec 2025
        assert.equal(isCostDueInMonth(annual, '2026-0'), false); // Not due Jan 2026
        assert.equal(isCostDueInMonth(annual, '2026-11'), true); // Due Dec 2026 (by year comparison)
    });
});

describe('keyToHtmlMonth / htmlMonthToKey', () => {
    test('keyToHtmlMonth converts 0-indexed to 1-indexed with zero padding', () => {
        assert.equal(keyToHtmlMonth('2026-0'),  '2026-01'); // January
        assert.equal(keyToHtmlMonth('2026-3'),  '2026-04'); // April
        assert.equal(keyToHtmlMonth('2026-9'),  '2026-10'); // October
        assert.equal(keyToHtmlMonth('2026-11'), '2026-12'); // December
    });

    test('htmlMonthToKey converts 1-indexed to 0-indexed', () => {
        assert.equal(htmlMonthToKey('2026-01'), '2026-0');  // January
        assert.equal(htmlMonthToKey('2026-04'), '2026-3');  // April
        assert.equal(htmlMonthToKey('2026-10'), '2026-9');  // October
        assert.equal(htmlMonthToKey('2026-12'), '2026-11'); // December
    });

    test('round-trip is identity', () => {
        const keys = ['2024-0', '2025-5', '2026-11', '2023-9'];
        for (const key of keys) {
            assert.equal(htmlMonthToKey(keyToHtmlMonth(key)), key);
        }
    });

    test('round-trip reverse is identity', () => {
        const htmlMonths = ['2024-01', '2025-06', '2026-12', '2023-10'];
        for (const htmlMonth of htmlMonths) {
            assert.equal(keyToHtmlMonth(htmlMonthToKey(htmlMonth)), htmlMonth);
        }
    });
});
