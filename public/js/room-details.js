// room-details.js
// - Loads a single room by id, renders details, images and booking form
// - Provides a simulated payment flow (client-only) and posts a booking to the API

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');

    if (!roomId) {
        window.location.href = '/rooms.html';
        return;
    }

    await loadRoomDetails(roomId);
    setupBookingForm(roomId);
});

// Load room details and populate UI. Defensive: guard missing DOM nodes.
async function loadRoomDetails(id) {
    try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('Room not found');
        
        const room = await response.json();

        // Populate UI if elements exist
        const titleEl = document.getElementById('roomTitle');
        const priceEl = document.getElementById('roomPrice');
        const descEl = document.getElementById('roomDescription');
        if (titleEl) titleEl.textContent = `${room.type || ''} Room${room.room_number ? ` (No. ${room.room_number})` : ''}`;
        if (priceEl) priceEl.textContent = room.price_per_night != null ? String(room.price_per_night) : '';
        if (descEl) descEl.textContent = room.description || '';

        // Features - normalize to array
        const featuresEl = document.getElementById('roomFeatures');
        if (featuresEl) {
            let features = [];
            try {
                let raw = room.features;
                if (typeof raw === 'string') {
                    try { raw = JSON.parse(raw); } catch (e) { raw = []; }
                }
                if (Array.isArray(raw)) features = raw;
            } catch (e) { features = []; }

            featuresEl.innerHTML = features.map(f => `<span class="badge bg-secondary me-2 mb-2 p-2">${escapeHtml(f)}</span>`).join('');
        }

        // Images
        const carouselInner = document.getElementById('carouselInner');
        if (carouselInner) {
            if (room.RoomImages && room.RoomImages.length > 0) {
                carouselInner.innerHTML = room.RoomImages.map((img, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                        <img src="${img.image_url}" class="d-block w-100" alt="Room Image" style="height: 400px; object-fit: cover;">
                    </div>
                `).join('');
            } else {
                carouselInner.innerHTML = `
                    <div class="carousel-item active">
                        <img src="https://via.placeholder.com/800x400?text=No+Image+Available" class="d-block w-100" alt="No Image" style="height: 400px; object-fit: cover;">
                    </div>
                `;
            }
        }

        // Show content (hide spinner)
        const loadingSpinner = document.getElementById('loadingSpinner');
        const roomContent = document.getElementById('roomContent');
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
        if (roomContent) roomContent.classList.remove('d-none');

        // Initialize Date Pickers with Booked Dates
        initDatePickers(room.Bookings || []);

    } catch (error) {
        console.error(error);
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-danger">Failed to load room details.</p>';
    }
}

// Setup booking UI and simulated payment handling. Guards DOM and auth state.
function setupBookingForm(roomId) {
    const form = document.getElementById('bookingForm');
    const loginPrompt = document.getElementById('loginPrompt');
    const alertBox = document.getElementById('bookingAlert');
    const paymentForm = document.getElementById('paymentForm');
    let paymentModal;

    // If form elements are missing, nothing to do
    if (!form) return;

    // Check auth status defensively
    const hasAuth = typeof auth === 'object' && typeof auth.isLoggedIn === 'function';
    if (!hasAuth || !auth.isLoggedIn()) {
        form.classList.add('d-none');
        if (loginPrompt) loginPrompt.classList.remove('d-none');
        return;
    }

    // --- Input Formatting Logic (if inputs exist) ---
    const ccInput = document.getElementById('cc-number');
    const expInput = document.getElementById('cc-expiration');
    if (ccInput) {
        ccInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) formattedValue += ' ';
                formattedValue += value[i];
            }
            e.target.value = formattedValue;
        });
    }

    if (expInput) {
        expInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 2) value = value.substring(0, 4);
            if (value.length >= 3) value = value.substring(0, 2) + '/' + value.substring(2);
            e.target.value = value;
        });
    }
    // -----------------------------

    // 1. Handle "Book Now" -> show payment modal
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkInEl = document.getElementById('checkIn');
        const checkOutEl = document.getElementById('checkOut');
        const priceEl = document.getElementById('roomPrice');

        const checkIn = checkInEl ? checkInEl.value : '';
        const checkOut = checkOutEl ? checkOutEl.value : '';

        // Basic validation
        if (!checkIn || !checkOut || new Date(checkIn) >= new Date(checkOut)) {
            showAlert('Check-out date must be after check-in date', 'danger');
            return;
        }

        // Calculate total safely
        const pricePerNight = priceEl ? parseFloat(priceEl.textContent) : 0;
        const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
        const total = pricePerNight * nights;

        const modalTotalEl = document.getElementById('modalTotal');
        if (modalTotalEl) modalTotalEl.textContent = total.toFixed(2);

        // Show Modal if present
        const paymentModalEl = document.getElementById('paymentModal');
        if (paymentModalEl && window.bootstrap && typeof bootstrap.Modal === 'function') {
            paymentModal = new bootstrap.Modal(paymentModalEl);
            paymentModal.show();
        } else {
            // If no modal, fallback to immediate booking (not recommended)
            showAlert('Payment modal not available. Please refresh the page or contact support.', 'warning');
        }
    });

    // 2. Handle payment form submit
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const checkIn = document.getElementById('checkIn') ? document.getElementById('checkIn').value : '';
            const checkOut = document.getElementById('checkOut') ? document.getElementById('checkOut').value : '';
            const btn = document.getElementById('confirmPaymentBtn');

            // Collect simulated payment info safely
            const address = document.getElementById('address') ? document.getElementById('address').value : '';
            const city = document.getElementById('city') ? document.getElementById('city').value : '';
            const zip = document.getElementById('zip') ? document.getElementById('zip').value : '';
            const ccVal = document.getElementById('cc-number') ? document.getElementById('cc-number').value : '';
            const ccLast4 = ccVal ? ccVal.replace(/\s+/g, '').slice(-4) : '';

            const paymentNote = `Billing Address: ${address}, ${city} ${zip}. Paid via Credit Card ending in ${ccLast4}.`;

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = 'Processing Payment...';
                }

                // Simulate network delay for payment processing
                await new Promise(resolve => setTimeout(resolve, 1200));

                const headers = { 'Content-Type': 'application/json' };
                if (typeof auth === 'object' && typeof auth.getToken === 'function') {
                    const token = auth.getToken();
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        room_id: roomId,
                        check_in_date: checkIn,
                        check_out_date: checkOut,
                        notes: paymentNote
                    })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    if (paymentModal && typeof paymentModal.hide === 'function') paymentModal.hide();
                    showAlert('Payment successful! Booking confirmed. Redirecting...', 'success');
                    setTimeout(() => { window.location.href = '/my-bookings.html'; }, 1800);
                } else {
                    alert('Booking failed: ' + (data.message || 'Unknown error'));
                    if (btn) { btn.disabled = false; btn.textContent = 'Pay & Confirm Booking'; }
                }
            } catch (error) {
                console.error(error);
                alert('Network error during payment processing');
                if (btn) { btn.disabled = false; btn.textContent = 'Pay & Confirm Booking'; }
            }
        });
    }

    function showAlert(msg, type) {
        if (!alertBox) return;
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = msg;
        alertBox.classList.remove('d-none');
    }
}

// Initialize date pickers using flatpickr and disable existing bookings ranges
function initDatePickers(bookings) {
    const disabledDates = Array.isArray(bookings) ? bookings.map(b => ({ from: b.check_in_date, to: b.check_out_date })) : [];

    // Create checkOutPicker in outer scope so checkIn onChange can reference it
    let checkOutPicker = null;

    const checkInPicker = flatpickr("#checkIn", {
        minDate: "today",
        dateFormat: "Y-m-d",
        disable: disabledDates,
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                const nextDay = new Date(selectedDates[0]);
                nextDay.setDate(nextDay.getDate() + 1);
                if (checkOutPicker) {
                    checkOutPicker.set('minDate', nextDay);
                    checkOutPicker.open();
                }
            }
        }
    });

    checkOutPicker = flatpickr("#checkOut", {
        minDate: new Date().fp_incr(1),
        dateFormat: "Y-m-d",
        disable: disabledDates
    });
}

// small helper to escape HTML when injecting text content
function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
