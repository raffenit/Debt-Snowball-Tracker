// ─── Chart Rendering ─────────────────────────────────────────────────────────
// Focused module for Chart.js visualization: paydown chart and timeline.
// Extracted from 82-render-payment.js to keep the payment module focused
// on plan logic and visualization orchestration.

const DEBT_COLORS = [
    { border: 'rgba(59,130,246,1)',  bg: 'rgba(59,130,246,0.08)'  },
    { border: 'rgba(16,185,129,1)',  bg: 'rgba(16,185,129,0.08)'  },
    { border: 'rgba(245,158,11,1)',  bg: 'rgba(245,158,11,0.08)'  },
    { border: 'rgba(239,68,68,1)',   bg: 'rgba(239,68,68,0.08)'   },
    { border: 'rgba(168,85,247,1)',  bg: 'rgba(168,85,247,0.08)'  },
    { border: 'rgba(236,72,153,1)',  bg: 'rgba(236,72,153,0.08)'  },
    { border: 'rgba(20,184,166,1)',  bg: 'rgba(20,184,166,0.08)'  },
    { border: 'rgba(249,115,22,1)',  bg: 'rgba(249,115,22,0.08)'  },
];

function renderPaydownChart(monthlyTotals, perDebtMonthly) {
    const canvas = _root.getElementById('paydown-chart');
    if (!canvas) return;

    if (paydownChart) { try { paydownChart.destroy(); } catch(e) {} paydownChart = null; }

    const maxLen = monthlyTotals.length;
    if (maxLen === 0) { canvas.style.height = '0'; return; }
    canvas.style.height = '300px';

    const labels = monthlyTotals.map((_,i) => {
        const d = new Date();
        d.setMonth(d.getMonth() + i + 1);
        return d.toLocaleDateString(undefined, { month:'short', year:'numeric' });
    });

    const datasets = [];
    const orderedDebts = getStrategyOrder(debts, strategy);

    orderedDebts.forEach((debt, idx) => {
        const color  = DEBT_COLORS[idx % DEBT_COLORS.length];
        const series = perDebtMonthly[debt.id] || [];
        const data   = Array.from({ length: maxLen }, (_,i) => Number((series[i] ?? 0).toFixed(2)));
        datasets.push({
            label:           debt.name,
            data,
            borderColor:     color.border,
            backgroundColor: color.bg,
            fill:            true,
            tension:         0.3,
            pointRadius:     0,
            borderWidth:     2,
        });
    });

    // Dashed total line
    datasets.push({
        label:           'Total Remaining',
        data:            monthlyTotals.map(v => Number(v.toFixed(2))),
        borderColor:     'rgba(248,250,252,0.4)',
        backgroundColor: 'transparent',
        fill:            false,
        tension:         0.3,
        pointRadius:     0,
        borderWidth:     1.5,
        borderDash:      [5,4],
    });

    paydownChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            interaction:         { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 16 }
                },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}` } }
            },
            scales: {
                x: { display: true, ticks: { color: '#64748b', maxTicksLimit: 10 }, grid: { color: 'rgba(51,65,85,0.4)' } },
                y: { display: true, ticks: { color: '#64748b', callback: v => '$'+Number(v).toLocaleString() }, grid: { color: 'rgba(51,65,85,0.4)' } }
            }
        }
    });
}

function renderTimelineChart(payoffLog, totalMonths) {
    const timelineChart = _root.getElementById('timeline-chart');
    timelineChart.innerHTML = '';
    const today = new Date();
    payoffLog.sort((a,b) => a.payoffMonth - b.payoffMonth);

    payoffLog.forEach((log, idx) => {
        const d          = new Date(today.getFullYear(), today.getMonth() + log.payoffMonth, 1);
        const dateString = d.toLocaleDateString(undefined, { month:'short', year:'numeric' });
        const pct        = Math.min(100, Math.max(0, (log.payoffMonth / totalMonths) * 100));
        const color      = DEBT_COLORS[idx % DEBT_COLORS.length];

        const item = document.createElement('div');
        item.className    = 'timeline-item';
        item.style.animation = `fadeIn 0.5s ease backwards ${idx * 0.1}s`;
        item.innerHTML = `
            <div class="timeline-header">
                <span class="timeline-name">${escHtml(log.name)}</span>
                <span class="timeline-date">Paid off ${dateString} · ${log.payoffMonth} mo</span>
            </div>
            <div class="timeline-interest">Interest paid: ${formatMoney(log.interestPaid)}</div>
            <div class="progress-track">
                <div class="progress-fill" style="width:0%;background:${color.border};transition:width 1s cubic-bezier(0.4,0,0.2,1) ${0.2+idx*0.1}s;"></div>
            </div>`;
        timelineChart.appendChild(item);
        setTimeout(() => { const f = item.querySelector('.progress-fill'); if(f) f.style.width=`${pct}%`; }, 50);
    });
}
