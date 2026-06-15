// ─── Checkpoints ─────────────────────────────────────────────────────────────
// Focused module for checkpoint list rendering and CRUD modal.
// Extracted from 80-render-modals.js to keep the modals module focused on
// debt, cost, income, budget, and expense modals.

function renderCheckpointsList() {
    const container = _root.getElementById('checkpoints-list');
    if (!container) return;

    if (checkpoints.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Sort by day
    const sorted = [...checkpoints].sort((a, b) => a.day - b.day);

    const formatMoneyLocal = (n) => {
        const currency = _root._currency || 'USD';
        const locale = _root._locale || 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    };

    const listHtml = sorted.map(cp => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; background: rgba(168,85,247,0.06); border-radius: 6px; border: 1px solid rgba(168,85,247,0.2);">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.75rem; color: var(--text-secondary); background: rgba(168,85,247,0.15); padding: 0.2rem 0.4rem; border-radius: 4px;">Day ${cp.day}</span>
                <span style="font-weight: 500; color: var(--text-primary);">${formatMoneyLocal(cp.amount)}</span>
            </div>
            <button class="btn btn-icon delete-checkpoint-btn" data-id="${cp.id}" title="Remove checkpoint" style="padding: 0.25rem; font-size: 0.75rem; background: transparent; color: var(--danger-color); border: none; cursor: pointer;">
                ✕
            </button>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Mid-month checkpoints:</div>
        ${listHtml}
    `;
}

function openCheckpointModal(cpId = null) {
    checkpointForm.reset();
    _root.getElementById('checkpoint-id').value = '';

    if (cpId) {
        _root.getElementById('checkpoint-modal-title').textContent = 'Edit Checkpoint';
        const cp = checkpoints.find(c => c.id === cpId);
        if (cp) {
            _root.getElementById('checkpoint-id').value = cp.id;
            _root.getElementById('checkpoint-day').value = cp.day;
            _root.getElementById('checkpoint-amount').value = cp.amount.toFixed(2);
        }
    } else {
        _root.getElementById('checkpoint-modal-title').textContent = 'Add Checkpoint';
    }

    checkpointModal.style.display = 'flex';
    setTimeout(() => checkpointModal.classList.add('active'), 10);
    setTimeout(() => _root.getElementById('checkpoint-amount').focus(), 50);
}

function closeCheckpointModal() {
    checkpointModal.classList.remove('active');
    setTimeout(() => { checkpointModal.style.display = 'none'; }, 300);
}

function saveCheckpoint() {
    try {
        const id      = _root.getElementById('checkpoint-id').value;
        const day     = parseInt(_root.getElementById('checkpoint-day').value);
        const amount  = parseFloat(_root.getElementById('checkpoint-amount').value);

        if (!day || day < 1 || day > 31) throw new Error('Please select a valid day (1-31).');
        if (!Number.isFinite(amount) || amount < 0) throw new Error('Please enter a valid amount.');

        // Check for duplicate day (if adding new or changing day)
        const existingSameDay = checkpoints.find(cp => cp.day === day && cp.id !== id);
        if (existingSameDay) throw new Error(`A checkpoint for day ${day} already exists.`);

        if (id) {
            // Edit existing
            const idx = checkpoints.findIndex(cp => cp.id === id);
            if (idx !== -1) {
                checkpoints[idx] = { id, day, amount };
            }
        } else {
            // Add new
            const newCp = {
                id: 'cp_' + Date.now(),
                day,
                amount
            };
            checkpoints.push(newCp);
        }

        checkpoints.sort((a, b) => a.day - b.day);

        saveData().then(() => {
            renderCheckpointsList();
            renderUI();
            closeCheckpointModal();
            showSavedToast(id ? 'Checkpoint updated ✓' : 'Checkpoint added ✓');
        }).catch(err => console.error('Debt Snowball: save failed —', err));
    } catch (err) {
        showErrorToast(err.message || 'Failed to save checkpoint.');
    }
}
