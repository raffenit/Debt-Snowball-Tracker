// Sanity checks — semantic anomaly detection on live data.
//
// sanitizeData() (health.js) fixes *structural* problems; this module flags
// data that is shaped correctly but looks wrong — the class of bug that
// silently corrupts state (e.g. the biweekly-series bug that duplicated
// income every rollover: every row was valid, but 3 identical paychecks on
// one date is not).
//
// Warnings are advisory: nothing is auto-changed. The UI discloses them via
// the health modal and a header badge so a bad pattern is loud but never
// blocks the app.
//
// Each warning: { id, field, severity: 'warning'|'notice', detail }
//   'warning' — almost certainly a bug or data corruption
//   'notice'  — suspicious but plausibly legitimate

import { keyToHtmlMonth } from './date-utils.js';

const w = (id, field, severity, detail) => ({ id, field, severity, detail });

// Group items by a key fn; return [key, items] pairs having duplicates.
function dupGroups(items, keyFn) {
    const m = new Map();
    for (const item of items) {
        const k = keyFn(item);
        if (!k) continue;
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(item);
    }
    return [...m.entries()].filter(([, v]) => v.length > 1);
}

function dupIds(listName, items, out) {
    const seen = new Set();
    const dups = new Set();
    for (const item of items || []) {
        if (item?.id == null) continue;
        (seen.has(item.id) ? dups : seen).add(item.id);
    }
    if (dups.size) {
        out.push(w(`dup-ids-${listName}`, listName, 'warning',
            `${dups.size} duplicate id(s) in ${listName} — edits may hit the wrong entry.`));
    }
}

/**
 * Check live state for suspicious patterns.
 * @param {Object} s - subset of appState: debts, recurringCosts, oneTimeCosts,
 *   incomeEntries, spendingBudgets, paidStatus, cardExpenseSkips,
 *   monthlyArchives, startingBalance, workingMonthKey
 * @returns {Array} warnings
 */
export function checkDataSanity(s) {
    const out = [];
    const debts          = s.debts          || [];
    const recurringCosts = s.recurringCosts || [];
    const oneTimeCosts   = s.oneTimeCosts   || [];
    const incomeEntries  = s.incomeEntries  || [];
    const budgets        = s.spendingBudgets || [];
    const archives       = s.monthlyArchives || [];

    // ─── Duplicate ids ───────────────────────────────────────────────────────
    dupIds('debts',           debts,           out);
    dupIds('recurringCosts',  recurringCosts,  out);
    dupIds('oneTimeCosts',    oneTimeCosts,    out);
    dupIds('incomeEntries',   incomeEntries,   out);
    dupIds('checkpoints',     s.checkpoints,   out);
    dupIds('spendingBudgets', budgets,         out);

    // ─── Duplicate content rows ──────────────────────────────────────────────
    // The signature of the biweekly regeneration bug: same paycheck on the
    // same date more than once.
    for (const [key, rows] of dupGroups(incomeEntries,
        e => `${e.seriesId || e.label}|${e.amount}|${e.date}`)) {
        const label = rows[0].label || 'income';
        out.push(w(`dup-income-${key}`, 'incomeEntries', 'warning',
            `${rows.length} identical income entries "${label}" ($${rows[0].amount} on ${rows[0].date || 'no date'}).`));
    }
    for (const [key, rows] of dupGroups(recurringCosts,
        c => `${c.name}|${c.amount}|${c.dueDay}`)) {
        out.push(w(`dup-cost-${key}`, 'recurringCosts', 'warning',
            `${rows.length} identical bills "${rows[0].name}" ($${rows[0].amount}, day ${rows[0].dueDay}).`));
    }
    for (const b of budgets) {
        for (const [key, rows] of dupGroups((b.expenses || []).filter(e => !e.autoCard),
            e => `${e.description}|${e.amount}|${e.date || ''}`)) {
            out.push(w(`dup-exp-${b.id}-${key}`, 'spendingBudgets', 'warning',
                `${rows.length} identical expenses "${rows[0].description}" ($${rows[0].amount}) in budget "${b.name}".`));
        }
    }

    // ─── Bad amounts ─────────────────────────────────────────────────────────
    const negCheck = (list, field, noun) => {
        const neg = list.filter(x => typeof x.amount === 'number' && x.amount < 0);
        if (neg.length) out.push(w(`neg-${field}`, field, 'warning',
            `${neg.length} ${noun} with negative amounts (e.g. "${neg[0].name || neg[0].label || neg[0].description}" $${neg[0].amount}).`));
        const huge = list.filter(x => typeof x.amount === 'number' && x.amount > 1_000_000);
        if (huge.length) out.push(w(`huge-${field}`, field, 'notice',
            `${huge.length} ${noun} over $1M — verify these aren't typos.`));
    };
    negCheck(recurringCosts, 'recurringCosts', 'bill(s)');
    negCheck(oneTimeCosts,   'oneTimeCosts',   'cost(s)');
    negCheck(incomeEntries,  'incomeEntries',  'income entrie(s)');

    for (const d of debts) {
        if (typeof d.balance === 'number' && d.balance < 0) {
            out.push(w(`neg-debt-${d.id}`, 'debts', 'warning',
                `Debt "${d.name}" has a negative balance ($${d.balance}).`));
        }
        if (typeof d.apr === 'number' && (d.apr < 0 || d.apr > 60)) {
            out.push(w(`apr-${d.id}`, 'debts', 'warning',
                `Debt "${d.name}" has an unusual APR (${d.apr}%).`));
        }
    }

    // ─── Dangling references ─────────────────────────────────────────────────
    const knownIds = new Set([
        ...debts.map(d => d.id), ...recurringCosts.map(c => c.id), ...oneTimeCosts.map(c => c.id),
    ]);
    const danglingPaid = Object.keys(s.paidStatus || {}).filter(id => !knownIds.has(id));
    if (danglingPaid.length) {
        out.push(w('dangling-paid', 'paidStatus', 'notice',
            `${danglingPaid.length} paid mark(s) reference bills/debts that no longer exist.`));
    }
    const danglingSkips = (s.cardExpenseSkips || []).filter(k => !knownIds.has(String(k).split(':')[1]));
    if (danglingSkips.length) {
        out.push(w('dangling-skips', 'cardExpenseSkips', 'notice',
            `${danglingSkips.length} card-expense skip(s) reference deleted bills — they can never match.`));
    }
    // Manual expenses charged to a card that no longer exists
    const danglingCard = budgets.reduce((n, b) =>
        n + (b.expenses || []).filter(e => e.cardDebtId && !knownIds.has(e.cardDebtId)).length, 0);
    if (danglingCard) {
        out.push(w('dangling-carddebt', 'spendingBudgets', 'notice',
            `${danglingCard} expense(s) charged to a card that no longer exists — they won't count toward any card's total.`));
    }
    // A bill linked to a card but marked 'direct' is silently misclassified:
    // excluded from card totals AND wrongly counted as a cash outflow.
    const misrouted = [...recurringCosts, ...oneTimeCosts]
        .filter(c => c.cardDebtId && c.paymentMethod !== 'card');
    if (misrouted.length) {
        out.push(w('card-method-mismatch', 'recurringCosts', 'warning',
            `${misrouted.length} bill(s) linked to a card but marked "direct" (e.g. "${misrouted[0].name}") — they're excluded from card totals and counted as cash. Edit the bill's Payment Method to Card.`));
    }

    // ─── Month-scoped consistency ────────────────────────────────────────────
    const htmlMk = s.workingMonthKey ? keyToHtmlMonth(s.workingMonthKey) : null;
    if (htmlMk) {
        let stray = 0;
        for (const b of budgets) {
            for (const e of b.expenses || []) {
                if (e.date && !e.autoCard && e.date.slice(0, 7) !== htmlMk) stray++;
            }
        }
        if (stray) out.push(w('stray-expenses', 'spendingBudgets', 'warning',
            `${stray} manual expense(s) dated outside the working month — they won't count against budgets or cash flow.`));
    }

    // ─── Month-over-month drift (vs most recent archive) ────────────────────
    // Reconstructed (retro) months are partial rebuilds, not real snapshots —
    // comparing against them produces false "10× jump" warnings.
    const prev = archives.find(a => !a.retro) || null;
    if (prev) {
        const countJump = (curr, old, field, noun) => {
            if (old > 0 && curr > Math.max(3, old * 2)) {
                out.push(w(`count-${field}`, field, 'warning',
                    `${noun} count jumped from ${old} last month to ${curr} — possible duplication bug.`));
            }
        };
        countJump(incomeEntries.length,  (prev.incomeEntries  || []).length, 'incomeEntries',  'Income entries');
        countJump(recurringCosts.length, (prev.recurringCosts || []).length, 'recurringCosts', 'Bill');

        const incomeTotal = incomeEntries.reduce((x, e) => x + (e.amount || 0), 0);
        if (prev.totalIncome > 0 && incomeTotal > prev.totalIncome * 2.5) {
            out.push(w('income-jump', 'incomeEntries', 'warning',
                `This month's income ($${Math.round(incomeTotal)}) is ${(incomeTotal / prev.totalIncome).toFixed(1)}× last month's — possible duplication.`));
        }
        if (prev.totalIncome > 0 && incomeTotal > 0 && incomeTotal < prev.totalIncome * 0.4) {
            out.push(w('income-drop', 'incomeEntries', 'notice',
                `This month's income ($${Math.round(incomeTotal)}) is less than half of last month's — worth verifying.`));
        }
        const costTotal = recurringCosts.reduce((x, c) => x + (c.amount || 0), 0);
        if (prev.totalCosts > 0 && costTotal > prev.totalCosts * 2.5) {
            out.push(w('cost-jump', 'recurringCosts', 'warning',
                `This month's bills ($${Math.round(costTotal)}) are ${(costTotal / prev.totalCosts).toFixed(1)}× last month's — possible duplication.`));
        }

        // A manual expense repeated from last month's archive is probably a
        // recurring bill the user forgot to convert — suggest it.
        const prevExpKeys = new Set((prev.spendingBudgets || [])
            .flatMap(b => (b.expenses || []).filter(e => !e.autoCard)
                .map(e => `${(e.description || '').toLowerCase().trim()}|${e.amount}`)));
        if (prevExpKeys.size) {
            const repeats = budgets.flatMap(b => (b.expenses || [])
                .filter(e => !e.autoCard && prevExpKeys.has(`${(e.description || '').toLowerCase().trim()}|${e.amount}`)));
            if (repeats.length) {
                out.push(w('repeat-expenses', 'spendingBudgets', 'notice',
                    `${repeats.length} expense(s) also appeared in ${prev.label || 'last month'} (e.g. "${repeats[0].description}") — if recurring, hit 🔁 on the row to make it a bill.`));
            }
        }
    }

    // ─── Coverage ────────────────────────────────────────────────────────────
    if (!incomeEntries.length && (recurringCosts.length || debts.length)) {
        out.push(w('no-income', 'incomeEntries', 'notice',
            'Bills/debts exist but no income is configured — the cash flow will only ever go down.'));
    }

    return out;
}
