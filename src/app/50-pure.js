
function formatMonthLabel(key) {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function monthKeyToIndex(key) {
    const [y, m] = key.split('-').map(Number);
    return y * 12 + m;
}

function addMonthsToKey(key, n) {
    const total = monthKeyToIndex(key) + n;
    return `${Math.floor(total / 12)}-${total % 12}`;
}

// Generate all biweekly occurrences of a paycheck within a given month.
// anchorDateStr is any past reference date on the correct two-week cycle (YYYY-MM-DD).
function generateBiweeklyForMonth(label, amount, anchorDateStr, monthKey) {
    const anchor = new Date(anchorDateStr + 'T00:00:00');
    const [y, m] = monthKey.split('-').map(Number);
    const monthStart = new Date(y, m, 1);
    const monthEnd   = new Date(y, m + 1, 0);
    const msPerDay   = 86400000;
    const entries    = [];

    // Step forward from anchor in 14-day increments until we enter the month
    let d = new Date(anchor);
    const daysToStart = Math.floor((monthStart - anchor) / msPerDay);
    if (daysToStart > 0) {
        d = new Date(anchor.getTime() + Math.floor(daysToStart / 14) * 14 * msPerDay);
    }

    while (d <= monthEnd) {
        if (d >= monthStart) {
            const mm = String(m + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            entries.push({
                id: `${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
                label, amount,
                date: `${y}-${mm}-${dd}`,
                scheduleType: 'biweekly',
                scheduleAnchorDate: anchorDateStr,
            });
        }
        d = new Date(d.getTime() + 14 * msPerDay);
    }
    return entries;
}

// Carry recurring income entries forward into monthKey.
// Monthly entries (and legacy entries with no scheduleType) get their date updated;
// biweekly entries are regenerated; explicit one-time entries are dropped.
function generateRecurringIncomeForMonth(entries, monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    const newEntries = [];

    // Monthly recurring: update date to same day in new month.
    // Legacy entries with no scheduleType are treated as monthly.
    entries.filter(e => !e.scheduleType || e.scheduleType === 'monthly').forEach(e => {
        const day     = e.scheduleDay || parseInt(e.date.split('-')[2]);
        const lastDay = new Date(y, m + 1, 0).getDate();
        const actual  = Math.min(day, lastDay);
        const mm = String(m + 1).padStart(2, '0');
        const dd = String(actual).padStart(2, '0');
        newEntries.push({ ...e, scheduleDay: day, date: `${y}-${mm}-${dd}` });
    });

    // Biweekly: deduplicate templates by (label|amount|anchorDate) then regenerate
    const seen = new Set();
    entries.filter(e => e.scheduleType === 'biweekly' && e.scheduleAnchorDate).forEach(e => {
        const key = `${e.label}|${e.amount}|${e.scheduleAnchorDate}`;
        if (!seen.has(key)) {
            seen.add(key);
            newEntries.push(...generateBiweeklyForMonth(e.label, e.amount, e.scheduleAnchorDate, monthKey));
        }
    });

    return newEntries;
}

// Convert app month key (YYYY-M, 0-indexed month) ↔ HTML month input value (YYYY-MM, 1-indexed)
function keyToHtmlMonth(key) {
    const [year, month] = key.split('-').map(Number);
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}
function htmlMonthToKey(htmlMonth) {
    const [year, month] = htmlMonth.split('-').map(Number);
    return `${year}-${month - 1}`;
}

function isCostDueThisMonth(cost, monthKey) {
    const key = monthKey || workingMonthKey || currentMonthKey();
    if ((cost.category || 'other') === 'one-time') {
        // One-time costs are only due in the month they were added (or legacy ones with no addedMonth)
        return !cost.addedMonth || cost.addedMonth === key;
    }
    if ((cost.intervalMonths || 1) <= 1) return true;
    const next = cost.nextDueMonth || key;
    const targetIdx = monthKeyToIndex(key);
    const nextIdx = monthKeyToIndex(next);
    return targetIdx >= nextIdx && (targetIdx - nextIdx) % cost.intervalMonths === 0;
}

function isCostDueInMonth(cost, monthKey) {
    if ((cost.category || 'other') === 'one-time') {
        return !cost.addedMonth || cost.addedMonth === monthKey;
    }
    if ((cost.intervalMonths || 1) <= 1) return true;
    const next = cost.nextDueMonth || monthKey;
    const targetIdx = monthKeyToIndex(monthKey);
    const nextIdx = monthKeyToIndex(next);
    return targetIdx >= nextIdx && (targetIdx - nextIdx) % cost.intervalMonths === 0;
}

function intervalLabel(n) {
    if (!n || n <= 1) return null;
    if (n === 3)  return '📆 Quarterly';
    if (n === 6)  return '📆 Semi-Annual';
    if (n === 12) return '📆 Annual';
    return `📆 Every ${n} mo.`;
}

function formatOrdinal(day) {
    const s = ['th','st','nd','rd'], v = day % 100;
    return day + (s[(v-20)%10] || s[v] || s[0]);
}

function formatMoney(n) {
    const currency = (typeof _root !== 'undefined' && _root._currency) ? _root._currency : 'USD';
    const language = (typeof _root !== 'undefined' && _root._language) ? _root._language : undefined;

    try {
        return new Intl.NumberFormat(language, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(n);
    } catch (e) {
        return Number(n).toLocaleString(language, { style: 'currency', currency: 'USD' });
    }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function calcAutoMin(balance, aprPct) {
    if (!balance || balance <= 0) return null;
    const monthlyInterest = balance * (aprPct / 100 / 12);
    const onePercent      = balance * 0.01;
    return Math.max(25, parseFloat((onePercent + monthlyInterest).toFixed(2)));
}

function getStrategyOrder(debtList, strat) {
    const copy = [...debtList];
    if (strat === 'avalanche') {
        copy.sort((a,b) => {
            const ra = a.promoZeroInterest ? (a.originalRate || 0) : a.rate;
            const rb = b.promoZeroInterest ? (b.originalRate || 0) : b.rate;
            return rb - ra || a.balance - b.balance;
        });
    } else {
        copy.sort((a,b) => a.balance - b.balance);
    }
    return copy;
}

function calculateMonthRollover(state, closingMonthKey, nextMonthKey) {
    const {
        debts,
        recurringCosts,
        oneTimeCosts = [],
        incomeEntries,
        checkpoints,
        startingBalance,
        paidStatus,
        spendingBudgets,
    } = state;

    const archive = {
        month: closingMonthKey,
        label: formatMonthLabel(closingMonthKey),
        incomeEntries: [...incomeEntries],
        recurringCosts: [...recurringCosts],
        oneTimeCosts: [...oneTimeCosts],
        checkpoints: [...checkpoints],
        debts: debts.map(d => ({ ...d })),
        startingBalance,
        paidStatus: { ...paidStatus },
        totalIncome: incomeEntries.reduce((s, e) => s + e.amount, 0),
        totalCosts: [
            ...recurringCosts.filter(c => isCostDueInMonth(c, closingMonthKey)),
            ...oneTimeCosts,
        ].reduce((s, c) => s + c.amount, 0),
    };

    const day1Cp = checkpoints.find(cp => cp.day === 1);
    let cashPool = day1Cp ? day1Cp.amount : 0;
    const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const totalCosts = [
        ...recurringCosts.filter(c => isCostDueInMonth(c, closingMonthKey)),
        ...oneTimeCosts,
    ].reduce((s, c) => s + c.amount, 0);
    const finalBalance = cashPool + totalIncome - totalCosts;
    archive.finalBalance = finalBalance;

    const nextIncome = generateRecurringIncomeForMonth(incomeEntries, nextMonthKey);
    const nextCheckpoints = finalBalance > 0
        ? [{ id: 'cp_' + Date.now(), day: 1, amount: finalBalance }]
        : [];
    // Defensive: strip any one-time costs that may still be in recurringCosts (backward compat)
    const cleanRecurring = recurringCosts.filter(c => (c.category || 'other') !== 'one-time');
    const nextCosts = cleanRecurring.map(c => {
        if ((c.intervalMonths || 1) <= 1) return c;
        let next = c.nextDueMonth || closingMonthKey;
        while (monthKeyToIndex(next) <= monthKeyToIndex(closingMonthKey)) {
            next = addMonthsToKey(next, c.intervalMonths);
        }
        return { ...c, nextDueMonth: next };
    });
    const nextBudgets = spendingBudgets.map(b => ({
        ...b,
        expenses: [],
        exception: (b.exception?.month === closingMonthKey) ? null : b.exception,
    }));

    return {
        archive,
        nextState: {
            incomeEntries: nextIncome,
            checkpoints: nextCheckpoints,
            recurringCosts: nextCosts,
            oneTimeCosts: [],
            paidStatus: {},
            minPayOverrides: {},
            spendingBudgets: nextBudgets,
        },
    };
}
