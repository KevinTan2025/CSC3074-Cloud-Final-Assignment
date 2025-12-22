document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');

    if (!roomId) {
        window.location.href = '/rooms.html';
        return;
    }

    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('checkIn').valueAsDate = today;
    document.getElementById('checkOut').valueAsDate = tomorrow;

    await loadRoomDetails(roomId);
    setupBookingForm(roomId);
});

async function loadRoomDetails(id) {
    try {
        const response = await fetch(`/api/rooms/${id}`);
        if (!response.ok) throw new Error('Room not found');
        
        const room = await response.json();

        // Populate UI
        document.getElementById('roomTitle').textContent = `${room.type} Room (No. ${room.room_number})`;
        document.getElementById('roomPrice').textContent = room.price_per_night;
        document.getElementById('roomDescription').textContent = room.description;

        // Features
        if (room.features) {
            let features = [];
            let raw = room.features;
            
            if (typeof raw === 'string') {
                try { raw = JSON.parse(raw); } catch(e) {}
            }
            
            if (Array.isArray(raw)) {
                features = raw;
            }
            
            document.getElementById('roomFeatures').innerHTML = features.map(f => 
                `<span class="badge bg-secondary me-2 mb-2 p-2">${f}</span>`
            ).join('');
        }

        // Images
        const carouselInner = document.getElementById('carouselInner');
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

        // Show content
        document.getElementById('loadingSpinner').classList.add('d-none');
        document.getElementById('roomContent').classList.remove('d-none');

    } catch (error) {
        console.error(error);
        document.getElementById('loadingSpinner').innerHTML = '<p class="text-danger">Failed to load room details.</p>';
    }
}

function setupBookingForm(roomId) {
    const form = document.getElementById('bookingForm');
    const loginPrompt = document.getElementById('loginPrompt');
    const alertBox = document.getElementById('bookingAlert');
    const paymentForm = document.getElementById('paymentForm');
    let paymentModal;

    // Check auth status
    if (!auth.isLoggedIn()) {
        form.classList.add('d-none');
        loginPrompt.classList.remove('d-none');
        return;
    }

    // --- Input Formatting Logic ---
    const ccInput = document.getElementById('cc-number');
    const expInput = document.getElementById('cc-expiration');

    // Format Credit Card: xxxx xxxx xxxx xxxx
    ccInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    });

    // Format Expiration: MM/YY
    expInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
    // -----------------------------

    // 1. Handle "Book Now" click -> Show Payment Modal
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;

        // Basic validation
        if (new Date(checkIn) >= new Date(checkOut)) {
            showAlert('Check-out date must be after check-in date', 'danger');
            return;
        }

        // Calculate total
        const pricePerNight = parseFloat(document.getElementById('roomPrice').textContent);
        const nights = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
        const total = pricePerNight * nights;

        // Update Modal
        document.getElementById('modalTotal').textContent = total.toFixed(2);
        
        // Show Modal
        paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        paymentModal.show();
    });

    // 2. Handle "Pay & Confirm" click -> Send API Request
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const btn = document.getElementById('confirmPaymentBtn');
        
        // Collect simulated payment info
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zip = document.getElementById('zip').value;
        const ccLast4 = document.getElementById('cc-number').value.slice(-4);

        const paymentNote = `Billing Address: ${address}, ${city} ${zip}. Paid via Credit Card ending in ${ccLast4}.`;

        try {
            btn.disabled = true;
            btn.textContent = 'Processing Payment...';

            // Simulate network delay for payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({
                    room_id: roomId,
                    check_in_date: checkIn,
                    check_out_date: checkOut,
                    notes: paymentNote // Store payment info in notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                paymentModal.hide();
                showAlert('Payment successful! Booking confirmed. Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/my-bookings.html';
                }, 2000);
            } else {
                alert('Booking failed: ' + (data.message || 'Unknown error'));
                btn.disabled = false;
                btn.textContent = 'Pay & Confirm Booking';
            }
        } catch (error) {
            console.error(error);
            alert('Network error during payment processing');
            btn.disabled = false;
            btn.textContent = 'Pay & Confirm Booking';
        }
    });

    function showAlert(msg, type) {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = msg;
        alertBox.classList.remove('d-none');
    }
}
