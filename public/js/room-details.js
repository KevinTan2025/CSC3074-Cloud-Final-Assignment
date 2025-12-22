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
            const features = JSON.parse(room.features);
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

    // Check auth status
    if (!auth.isLoggedIn()) {
        form.classList.add('d-none');
        loginPrompt.classList.remove('d-none');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const btn = document.getElementById('bookBtn');

        // Basic validation
        if (new Date(checkIn) >= new Date(checkOut)) {
            showAlert('Check-out date must be after check-in date', 'danger');
            return;
        }

        try {
            btn.disabled = true;
            btn.textContent = 'Processing...';

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({
                    room_id: roomId,
                    check_in_date: checkIn,
                    check_out_date: checkOut
                })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Booking successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/my-bookings.html'; // We'll create this later
                }, 2000);
            } else {
                showAlert(data.message || 'Booking failed', 'danger');
                btn.disabled = false;
                btn.textContent = 'Book Now';
            }
        } catch (error) {
            console.error(error);
            showAlert('Network error', 'danger');
            btn.disabled = false;
            btn.textContent = 'Book Now';
        }
    });

    function showAlert(msg, type) {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = msg;
        alertBox.classList.remove('d-none');
    }
}
