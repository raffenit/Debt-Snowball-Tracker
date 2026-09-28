// Pure cash-flow helpers shared by Month Overview, runway status, and tests.
// Event construction remains responsible for deciding which transactions
// affect cash; this module reads the resulting stream.

export function lowestCashFlowBalance(schedule = [], fallback = 0) {
    let lowest = null;
    for (const item of schedule) {
        const balance = Number(item.balance);
        if (!Number.isFinite(balance)) continue;
        lowest = lowest === null ? balance : Math.min(lowest, balance);
    }
    return lowest === null ? fallback : lowest;
}

export function summarizeCashFlowEvents(events = []) {
    return events.reduce((totals, event) => {
        const amount = Number(event.amount);
        if (!Number.isFinite(amount)) return totals;

        if (event.type === 'income') {
            totals.income += amount;
        } else if (event.type !== 'checkpoint' && event.type !== 'starting-balance') {
            totals.expenditures += amount;
        }

        return totals;
    }, { income: 0, expenditures: 0 });
}
