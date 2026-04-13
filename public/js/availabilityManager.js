/*********************************************************************************************************
*	Availability Manager - Client-side JavaScript
*   Handles provider availability CRUD operations
*   Author: MosalaPro Development Team
*	Date: 2025-01-20
**********************************************************************************************************/

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Load availability on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('recurringScheduleList')) {
        loadRecurringSchedule();
        loadSpecificDates();
    }
});

// Load recurring schedule
async function loadRecurringSchedule() {
    try {
        const response = await fetch('/api/availability/my');
        const data = await response.json();

        if (data.success) {
            const recurring = data.availabilities.filter(a => a.type === 'recurring');
            displayRecurringSchedule(recurring);
        }
    } catch (error) {
        console.error('Error loading recurring schedule:', error);
        showError('Failed to load schedule');
    }
}

// Display recurring schedule
function displayRecurringSchedule(availabilities) {
    const container = document.getElementById('recurringScheduleList');

    if (availabilities.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-times fa-3x mb-3"></i>
                <p>No recurring schedule set. Add your regular working hours.</p>
            </div>
        `;
        return;
    }

    // Group by day of week
    const byDay = {};
    availabilities.forEach(slot => {
        if (!byDay[slot.dayOfWeek]) {
            byDay[slot.dayOfWeek] = [];
        }
        byDay[slot.dayOfWeek].push(slot);
    });

    let html = '';
    for (let day = 0; day <= 6; day++) {
        if (byDay[day]) {
            html += `
                <div class="day-schedule mb-3">
                    <h6 class="text-primary mb-2">${dayNames[day]}</h6>
                    ${byDay[day].map(slot => renderTimeSlot(slot)).join('')}
                </div>
            `;
        }
    }

    container.innerHTML = html;
}

// Load specific dates
async function loadSpecificDates() {
    try {
        const response = await fetch('/api/availability/my');
        const data = await response.json();

        if (data.success) {
            const specific = data.availabilities.filter(a => a.type === 'specific');
            displaySpecificDates(specific);
        }
    } catch (error) {
        console.error('Error loading specific dates:', error);
        showError('Failed to load specific dates');
    }
}

// Display specific dates
function displaySpecificDates(availabilities) {
    const container = document.getElementById('specificDatesList');

    if (availabilities.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-times fa-3x mb-3"></i>
                <p>No specific dates set. Add exceptions or special availability.</p>
            </div>
        `;
        return;
    }

    // Sort by date
    availabilities.sort((a, b) => new Date(a.date) - new Date(b.date));

    let html = availabilities.map(slot => {
        const date = new Date(slot.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="time-slot">
                <div>
                    <div class="fw-bold">${formattedDate}</div>
                    <div class="time-range">
                        <i class="fas fa-clock"></i> ${slot.startTime} - ${slot.endTime}
                    </div>
                    ${slot.note ? `<small class="text-muted">${slot.note}</small>` : ''}
                </div>
                <div class="slot-actions">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSlot('${slot._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// Render a time slot
function renderTimeSlot(slot) {
    return `
        <div class="time-slot">
            <div>
                <div class="time-range">
                    <i class="fas fa-clock"></i> ${slot.startTime} - ${slot.endTime}
                </div>
                ${slot.note ? `<small class="text-muted">${slot.note}</small>` : ''}
            </div>
            <div class="slot-actions">
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSlot('${slot._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Show add recurring modal
function showAddRecurringModal() {
    const modal = new bootstrap.Modal(document.getElementById('addRecurringModal'));
    document.getElementById('addRecurringForm').reset();
    modal.show();
}

// Show add specific modal
function showAddSpecificModal() {
    const modal = new bootstrap.Modal(document.getElementById('addSpecificModal'));
    document.getElementById('addSpecificForm').reset();
    // Set min date to today
    document.getElementById('specific_date').min = new Date().toISOString().split('T')[0];
    modal.show();
}

// Add recurring slot
async function addRecurringSlot() {
    const dayOfWeek = document.getElementById('recurring_dayOfWeek').value;
    const startTime = document.getElementById('recurring_startTime').value;
    const endTime = document.getElementById('recurring_endTime').value;
    const note = document.getElementById('recurring_note').value;

    if (!startTime || !endTime) {
        showError('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/api/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'recurring',
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                note
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Time slot added successfully');
            bootstrap.Modal.getInstance(document.getElementById('addRecurringModal')).hide();
            loadRecurringSchedule();
        } else {
            showError(data.error || 'Failed to add time slot');
        }
    } catch (error) {
        console.error('Error adding recurring slot:', error);
        showError('Failed to add time slot');
    }
}

// Add specific slot
async function addSpecificSlot() {
    const date = document.getElementById('specific_date').value;
    const startTime = document.getElementById('specific_startTime').value;
    const endTime = document.getElementById('specific_endTime').value;
    const note = document.getElementById('specific_note').value;

    if (!date || !startTime || !endTime) {
        showError('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/api/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'specific',
                date,
                startTime,
                endTime,
                note
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Specific date added successfully');
            bootstrap.Modal.getInstance(document.getElementById('addSpecificModal')).hide();
            loadSpecificDates();
        } else {
            showError(data.error || 'Failed to add specific date');
        }
    } catch (error) {
        console.error('Error adding specific slot:', error);
        showError('Failed to add specific date');
    }
}

// Delete slot
async function deleteSlot(slotId) {
    if (!confirm('Are you sure you want to delete this time slot?')) {
        return;
    }

    try {
        const response = await fetch(`/api/availability/${slotId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Time slot deleted successfully');
            loadRecurringSchedule();
            loadSpecificDates();
        } else {
            showError(data.error || 'Failed to delete time slot');
        }
    } catch (error) {
        console.error('Error deleting slot:', error);
        showError('Failed to delete time slot');
    }
}

// Show success message
function showSuccess(message) {
    // Use your existing notification system
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    } else {
        console.log(message);
    }
}

// Show error message
function showError(message) {
    // Use your existing notification system
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        console.log(message);
    }
}
