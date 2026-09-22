// Data health — universal sanitizer for data crossing a trust boundary
// (stored config on load, file backup import, server backup restore).
//
// Instead of hard-rejecting imperfect data, every managed field is checked
// against its spec and repaired in place: wrong types reset to defaults,
// malformed entries are dropped from lists. Each repair is reported as an
// issue so the UI can disclose exactly what was changed. Only completely
// unrecognizable input is fatal.
//
// Issue severity:
//   'fatal'    — input is unusable; data is null
//   'repaired' — a value was wrong and was reset/dropped (disclose to user)
//   'info'     — a field was absent; a default is used (context-dependent)

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

// Managed fields and the shape each must have. 'default' is used both when
// the field is absent (info) and when it must be reset (repaired).
export const FIELD_SPECS = [
    { name: 'debts',            kind: 'records', default: () => [] },
    { name: 'recurringCosts',   kind: 'records', default: () => [] },
    { name: 'oneTimeCosts',     kind: 'records', default: () => [] },
    { name: 'incomeEntries',    kind: 'records', default: () => [] },
    { name: 'checkpoints',      kind: 'records', default: () => [] },
    { name: 'monthlyArchives',  kind: 'records', default: () => [] },
    { name: 'spendingBudgets',  kind: 'records', default: () => [] },
    { name: 'cardExpenseSkips', kind: 'strings', default: () => [] },
    { name: 'paidStatus',       kind: 'object',  default: () => ({}) },
    { name: 'minPayOverrides',  kind: 'object',  default: () => ({}) },
    { name: 'expenseDefaults',  kind: 'object',  default: () => ({}) },
    { name: 'startingBalance',  kind: 'number',  default: () => 0 },
    { name: 'showMortgage',     kind: 'boolean', default: () => true },
    { name: 'strategy',         kind: 'enum',    default: () => 'snowball', values: ['snowball', 'avalanche'] },
];

// Keys that identify a payload as ours even when every spec field is absent.
const RECOGNIZED_KEYS = new Set([
    ...FIELD_SPECS.map(s => s.name), 'paidMonth', '_meta', 'monthlyBudget',
]);

function sanitizeField(spec, value) {
    const kind = {
        records: v => Array.isArray(v) && v.every(isPlainObject),
        strings: v => Array.isArray(v) && v.every(i => typeof i === 'string'),
        object:  isPlainObject,
        number:  v => typeof v === 'number' && Number.isFinite(v),
        boolean: v => typeof v === 'boolean',
        enum:    v => spec.values.includes(v),
    }[spec.kind];

    if (kind(value)) return { value, dropped: 0 };

    // Partially repairable lists: keep the entries that are well-formed.
    if ((spec.kind === 'records' || spec.kind === 'strings') && Array.isArray(value)) {
        const ok = spec.kind === 'records' ? isPlainObject : i => typeof i === 'string';
        const kept = value.filter(ok);
        return { value: kept, dropped: value.length - kept.length };
    }
    return { value: spec.default(), dropped: -1 }; // -1: whole field reset
}

/**
 * Repair a raw payload field-by-field.
 * @param {*} raw - untrusted input (stored config, parsed backup JSON)
 * @returns {{data: Object|null, issues: Array<{field: string, severity: string, detail: string}>}}
 *   data is null when a fatal issue was found.
 */
export function sanitizeData(raw) {
    if (!isPlainObject(raw)) {
        return { data: null, issues: [{ field: '(data)', severity: 'fatal',
            detail: 'Not a data object — expected a Debt Snowball backup or stored config.' }] };
    }
    if (!Object.keys(raw).some(k => RECOGNIZED_KEYS.has(k))) {
        return { data: null, issues: [{ field: '(data)', severity: 'fatal',
            detail: 'No recognizable fields — this does not look like a Debt Snowball backup.' }] };
    }

    const data = { ...raw };
    const issues = [];
    for (const spec of FIELD_SPECS) {
        const value = raw[spec.name];
        if (value === undefined || value === null) {
            data[spec.name] = spec.default();
            issues.push({ field: spec.name, severity: 'info',
                detail: 'Not present — using default.' });
            continue;
        }
        const { value: fixed, dropped } = sanitizeField(spec, value);
        if (dropped === 0) continue; // valid as-is
        data[spec.name] = fixed;
        issues.push({ field: spec.name, severity: 'repaired',
            detail: dropped > 0
                ? `Malformed entries — dropped ${dropped} of ${value.length}.`
                : 'Wrong shape — reset to default.' });
    }
    return { data, issues };
}

/** Issues that mean actual data was touched (not just absent fields). */
export function countRepairs(issues) {
    return (issues || []).filter(i => i.severity === 'repaired').length;
}
