// my-bookings.js
// - Loads current user's bookings and allows cancellation

document.addEventListener('DOMContentLoaded', () => {
    // Defensive: ensure `auth` exists and provides isLoggedIn
    const hasAuth = typeof auth === 'object' && typeof auth.isLoggedIn === 'function';
    if (!hasAuth) {
        console.warn('auth helper not available; redirecting to login.');
        window.location.href = '/login.html';
        return;
    }

    try {
        if (!auth.isLoggedIn()) {
            window.location.href = '/login.html';
            return;
        }
    } catch (e) {
        console.warn('auth.isLoggedIn threw an error, redirecting to login.', e);
        window.location.href = '/login.html';
        return;
    }

    loadBookings();
});

// Fetch and render bookings into the table body
async function loadBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) {
        console.warn('Bookings table body not found; skipping render.');
        return;
    }

    try {
        const headers = {};
        if (typeof auth === 'object' && typeof auth.getToken === 'function') {
            const token = auth.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/bookings/my-bookings', { headers });
        if (!response.ok) {
            console.error('Failed to fetch bookings, status:', response.status);
            throw new Error('Failed to fetch bookings');
        }

        const bookings = await response.json();
        if (!Array.isArray(bookings) || bookings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <p class="text-muted mb-0">You have no bookings yet.</p>
                        <a href="/rooms.html" class="btn btn-primary mt-2">Browse Rooms</a>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = bookings.map(booking => {
            // Defensive access to nested objects
            const id = booking && booking.id != null ? booking.id : '';
            const room = booking && booking.Room ? booking.Room : {};
            const roomType = room.type || '';
            const roomNumber = room.room_number != null ? room.room_number : '';

            const checkIn = safeFormatDate(booking && booking.check_in_date);
            const checkOut = safeFormatDate(booking && booking.check_out_date);

            const status = booking && booking.status ? String(booking.status) : '';
            const statusBadge = getStatusBadge(status);
            const total = booking && booking.total_price != null ? String(booking.total_price) : '0.00';

            const notesHtml = booking && booking.notes ? `<br><small class="text-muted" style="font-size: 0.75rem;" title="${escapeHtml(booking.notes)}">View Payment Info</small>` : '';

            return `
                <tr>
                    <td>#${escapeHtml(id)}</td>
                    <td>
                        <strong>${escapeHtml(roomType)}</strong><br>
                        <small class="text-muted">Room ${escapeHtml(roomNumber)}</small>
                    </td>
                    <td>${escapeHtml(checkIn)}</td>
                    <td>${escapeHtml(checkOut)}</td>
                    <td>$${escapeHtml(total)}</td>
                    <td>
                        ${statusBadge}
                        ${notesHtml}
                    </td>
                    <td>
                        ${status !== 'cancelled' ? `<button class="btn btn-sm btn-outline-danger" onclick="openCancelModal(${escapeJs(id)})">Cancel</button>` : '-'}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    Failed to load bookings. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Helpers
function safeFormatDate(value) {
    try {
        const d = new Date(value);
        if (isNaN(d)) return '-';
        return d.toLocaleDateString();
    } catch (e) {
        return '-';
    }
}

function getStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    const colors = {
        'confirmed': 'success',
        'pending': 'warning',
        'cancelled': 'danger',
        'completed': 'secondary'
    };
    const color = colors[s] || 'primary';
    const label = s ? (s.charAt(0).toUpperCase() + s.slice(1)) : 'Unknown';
    return `<span class="badge bg-${color}">${escapeHtml(label)}</span>`;
}

// Simple HTML escape for small values inserted into the table
function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// When injecting into an onclick handler, make sure numeric ids are safe. For non-numeric use quotes.
function escapeJs(val) {
    if (typeof val === 'number') return val;
    return `'${String(val).replace(/'/g, "\\'")}'`;
}

let bookingIdToCancel = null;
let cancelModal = null;
const cancelModalEl = document.getElementById('cancelModal');
if (cancelModalEl && window.bootstrap && typeof bootstrap.Modal === 'function') {
    cancelModal = new bootstrap.Modal(cancelModalEl);
}

function openCancelModal(id) {
    bookingIdToCancel = id;
    if (cancelModal && typeof cancelModal.show === 'function') cancelModal.show();
}

const confirmBtn = document.getElementById('confirmCancelBtn');
if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
        if (!bookingIdToCancel) return;

        try {
            const headers = {};
            if (typeof auth === 'object' && typeof auth.getToken === 'function') {
                const token = auth.getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/bookings/${bookingIdToCancel}/cancel`, {
                method: 'PUT', // or PATCH depending on API
                headers
            });

            if (response.ok) {
                if (cancelModal && typeof cancelModal.hide === 'function') cancelModal.hide();
                // Refresh bookings list
                loadBookings();
            } else {
                const data = await response.json().catch(() => ({}));
                alert('Failed to cancel booking: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    });
}
