document.addEventListener('DOMContentLoaded', () => {
    if (!auth.isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }
    loadBookings();
});

async function loadBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    
    try {
        const response = await fetch('/api/bookings/my-bookings', {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch bookings');

        const bookings = await response.json();

        if (bookings.length === 0) {
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
            const checkIn = new Date(booking.check_in_date).toLocaleDateString();
            const checkOut = new Date(booking.check_out_date).toLocaleDateString();
            const statusBadge = getStatusBadge(booking.status);
            
            return `
                <tr>
                    <td>#${booking.id}</td>
                    <td>
                        <strong>${booking.Room.type}</strong><br>
                        <small class="text-muted">Room ${booking.Room.room_number}</small>
                    </td>
                    <td>${checkIn}</td>
                    <td>${checkOut}</td>
                    <td>$${booking.total_price}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${booking.status !== 'cancelled' ? 
                            `<button class="btn btn-sm btn-outline-danger" onclick="openCancelModal(${booking.id})">Cancel</button>` 
                            : '-'}
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

function getStatusBadge(status) {
    const colors = {
        'confirmed': 'success',
        'pending': 'warning',
        'cancelled': 'danger',
        'completed': 'secondary'
    };
    const color = colors[status] || 'primary';
    return `<span class="badge bg-${color}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

let bookingIdToCancel = null;
const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));

function openCancelModal(id) {
    bookingIdToCancel = id;
    cancelModal.show();
}

document.getElementById('confirmCancelBtn').addEventListener('click', async () => {
    if (!bookingIdToCancel) return;

    try {
        const response = await fetch(`/api/bookings/${bookingIdToCancel}/cancel`, {
            method: 'PUT', // Assuming cancel is a status update, usually PUT or PATCH
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });

        if (response.ok) {
            cancelModal.hide();
            loadBookings(); // Reload table
        } else {
            alert('Failed to cancel booking');
        }
    } catch (error) {
        console.error(error);
        alert('Network error');
    }
});
