// Initialize dashboard once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadRooms();
    loadBookings();

    // Handle Image Upload: attach submit handler for image uploads
    const uploadForm = document.getElementById('uploadImageForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const roomId = document.getElementById('imageRoomId').value;
            const fileInput = document.getElementById('newImages');
            const files = fileInput.files;

            if (!files || files.length === 0) return; // nothing to do

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }

            try {
                const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/images`, {
                    method: 'POST',
                    headers: {
                        // Let browser set Content-Type for FormData
                        'Authorization': `Bearer ${auth.getToken()}`
                    },
                    body: formData
                });

                if (response.ok) {
                    fileInput.value = ''; // Clear file input after successful upload
                    openImagesModal(roomId); // Refresh images list in modal
                } else {
                    // Try to show server-provided message if present
                    let msg = 'Failed to upload images';
                    try { const data = await response.json(); if (data && data.message) msg = data.message; } catch (_) {}
                    alert(msg);
                }
            } catch (error) {
                console.error('Image upload error:', error);
                alert('Error uploading images');
            }
        });
    }
});

function checkAdminAuth() {
    if (!auth.isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }
    const user = auth.getUser();
    if (user.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = '/';
        return;
    }
    document.getElementById('adminName').textContent = `Admin: ${user.full_name}`;
}

// --- Rooms Management ---

async function loadRooms() {
    const tbody = document.getElementById('roomsTableBody');
    try {
        const response = await fetch('/api/rooms');
        // guard: ensure we received JSON and an array
        const rooms = response.ok ? await response.json() : [];

        // Safely build HTML rows, minimizing direct injection of unexpected HTML
        tbody.innerHTML = (Array.isArray(rooms) ? rooms : []).map(room => {
            const statusBadge = room.status === 'available' ? 'success' : 'secondary';
            // Use textContent via template strings but keep markup simple
            return `
            <tr>
                <td>${String(room.id)}</td>
                <td>${String(room.room_number ?? '')}</td>
                <td>${String(room.type ?? '')}</td>
                <td>$${String(room.price_per_night ?? '')}</td>
                <td><span class="badge bg-${statusBadge}">${String(room.status ?? '')}</span></td>
                <td>
                    <button class="btn btn-sm btn-info text-white" onclick="openImagesModal(${room.id})" title="Manage images"><i class="bi bi-images"></i></button>
                    <button class="btn btn-sm btn-primary" onclick="openRoomModal(${room.id})" title="Edit room"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRoom(${room.id})" title="Delete room"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error(error);
    }
}

const roomModal = new bootstrap.Modal(document.getElementById('roomModal'));
const imagesModal = new bootstrap.Modal(document.getElementById('imagesModal'));

async function openRoomModal(roomId = null) {
    const title = document.getElementById('roomModalTitle');
    const form = document.getElementById('roomForm');
    
    if (roomId) {
        title.textContent = 'Edit Room';
        document.getElementById('roomId').value = roomId;
        
        // Fetch room details; handle non-OK responses
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
        if (!response.ok) {
            alert('Failed to fetch room details');
            return;
        }
        const room = await response.json();
        
        document.getElementById('roomType').value = room.type;
        document.getElementById('roomPrice').value = room.price_per_night;
        document.getElementById('roomDescription').value = room.description;
        document.getElementById('roomStatus').value = room.status;
        
        // Handle features array
        let features = room.features;
        if (typeof features === 'string') {
            try {
                features = JSON.parse(features);
            } catch (e) {
                features = [];
            }
        }
        document.getElementById('roomFeatures').value = Array.isArray(features) ? features.join(', ') : '';

    } else {
        title.textContent = 'Add New Room';
        form.reset();
        document.getElementById('roomId').value = '';
        document.getElementById('roomStatus').value = 'available';
    }
    
    roomModal.show();
}

async function saveRoom() {
    const id = document.getElementById('roomId').value;
    const type = document.getElementById('roomType').value;
    const price = document.getElementById('roomPrice').value;
    const description = document.getElementById('roomDescription').value;
    const status = document.getElementById('roomStatus').value;
    const featuresStr = document.getElementById('roomFeatures').value;
    
    const features = featuresStr.split(',').map(f => f.trim()).filter(f => f);

    // Prepare payload. Convert features to JSON string because backend expects a JSON string in current API.
    const data = {
        type,
        price_per_night: Number(price) || 0,
        description,
        status,
        features: JSON.stringify(features)
    };

    // Note: room_number is auto-generated on create, and we are not editing it here for simplicity, 
    // but the backend supports editing it if we added the field.

    try {
        let response;
        if (id) {
            // Update
            response = await fetch(`/api/rooms/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify(data)
            });
        } else {
            // Create
            response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            roomModal.hide();
            loadRooms();
        } else {
            let errMsg = 'Failed to save room';
            try { const err = await response.json(); if (err && err.message) errMsg = err.message; } catch (_) {}
            alert(errMsg);
        }
    } catch (error) {
        console.error(error);
        alert('Network error');
    }
}

async function deleteRoom(id) {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });

        if (response.ok) {
            loadRooms();
        } else {
            alert('Failed to delete room');
        }
    } catch (error) {
        console.error(error);
    }
}

// --- Images Management ---

// Open modal and list images for a room
async function openImagesModal(roomId) {
    document.getElementById('imageRoomId').value = roomId;
    const container = document.getElementById('currentImagesList');
    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary"></div></div>';
    
    imagesModal.show();

    try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch room images');
        }
        const room = await response.json();
        
        if (!room.RoomImages || room.RoomImages.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted">No images uploaded yet.</p></div>';
            return;
        }

        container.innerHTML = (room.RoomImages || []).map(img => `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="${String(img.image_url)}" class="card-img-top" style="height: 150px; object-fit: cover;" alt="Room image">
                    <div class="card-body p-2 text-center">
                        <button class="btn btn-sm btn-danger w-100" onclick="deleteImage(${img.id}, ${roomId})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-danger">Failed to load images</p>';
    }
}

async function deleteImage(imageId, roomId) {
    if (!confirm('Delete this image?')) return;

    try {
        const response = await fetch(`/api/rooms/images/${encodeURIComponent(imageId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });

        if (response.ok) {
            openImagesModal(roomId); // Reload
        } else {
            alert('Failed to delete image');
        }
    } catch (error) {
        console.error(error);
    }
}

// --- Bookings Management ---

async function loadBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    try {
        const response = await fetch('/api/bookings', {
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        const bookings = response.ok ? await response.json() : [];

        tbody.innerHTML = (Array.isArray(bookings) ? bookings : []).map(booking => {
            const userName = booking.User ? booking.User.full_name : 'Unknown';
            const roomNumber = booking.Room ? booking.Room.room_number : 'N/A';
            const checkIn = booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : '';
            const checkOut = booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : '';
            const disabled = status => booking.status === status ? 'disabled' : '';

            return `
            <tr>
                <td>${String(booking.id)}</td>
                <td>${String(userName)}</td>
                <td>Room ${String(roomNumber)}</td>
                <td>${checkIn} - ${checkOut}</td>
                <td>$${String(booking.total_price ?? '')}</td>
                <td><span class="badge bg-${getStatusColor(booking.status)}">${String(booking.status)}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-success" onclick="updateBookingStatus(${booking.id}, 'confirmed')" ${disabled('confirmed')}>Confirm</button>
                        <button class="btn btn-warning" onclick="updateBookingStatus(${booking.id}, 'completed')" ${disabled('completed')}>Complete</button>
                        <button class="btn btn-danger" onclick="updateBookingStatus(${booking.id}, 'cancelled')" ${disabled('cancelled')}>Cancel</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error(error);
    }
}

function getStatusColor(status) {
    const colors = { 'confirmed': 'success', 'pending': 'warning', 'cancelled': 'danger', 'completed': 'secondary' };
    return colors[status] || 'primary';
}

async function updateBookingStatus(id, status) {
    try {
        const response = await fetch(`/api/bookings/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadBookings();
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error(error);
    }
}
