// Pure cash-flow aggregation shared by the Month Overview and tests.
// Event construction remains responsible for deciding which transactions
// affect cash; this module totals the complete resulting stream.

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
