// main.js - small UI helpers for public pages
// - updateAuthUI: populate nav with login/register or user menu
// - loadFeaturedRooms: fetches rooms and shows a few featured cards on homepage

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadFeaturedRooms();
});

async function loadFeaturedRooms() {
    const container = document.getElementById('featuredRooms');
    if (!container) return; // nothing to do on non-home pages

    try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Failed to fetch rooms');
        const rooms = await response.json();

        if (!Array.isArray(rooms) || rooms.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>No rooms available at the moment.</p></div>';
            return;
        }

        // Display first 3 rooms as featured (defensive: ensure description exists)
        const featuredRooms = rooms.slice(0, 3);
        
        container.innerHTML = featuredRooms.map(room => {
            const imageUrl = room.RoomImages && room.RoomImages.length > 0 
                ? room.RoomImages[0].image_url 
                : 'https://via.placeholder.com/400x300?text=No+Image';

            const description = room.description ? String(room.description).substring(0, 100) : '';

            return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <img src="${imageUrl}" class="card-img-top" alt="${room.type || 'Room'}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${String(room.type || '')} Room</h5>
                            <p class="card-text text-muted">${description}...</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="h5 mb-0 text-primary">$${String(room.price_per_night || '')}/night</span>
                                <a href="/room-details.html?id=${encodeURIComponent(room.id)}" class="btn btn-outline-primary">View Details</a>
                            </div>
                        </div>
                        <div class="card-footer bg-white border-top-0">
                            <small class="text-muted">
                                <i class="bi bi-people"></i> ${room.type === 'Single' ? '1 Person' : '2 People'}
                                <span class="mx-2">|</span>
                                <i class="bi bi-wifi"></i> Free Wifi
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading rooms:', error);
        container.innerHTML = '<div class="col-12 text-center text-danger"><p>Failed to load rooms.</p></div>';
    }
}

function updateAuthUI() {
    const authNav = document.getElementById('authNav');
    if (!authNav) return; // no nav on some pages

    if (auth.isLoggedIn()) {
        const user = auth.getUser() || { full_name: 'User', role: '' };
        authNav.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                    ${user.full_name} (${user.role})
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="/my-bookings.html">My Bookings</a></li>
                    ${user.role === 'admin' ? '<li><a class="dropdown-item" href="/admin/dashboard.html">Admin Dashboard</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="auth.logout()">Logout</a></li>
                </ul>
            </li>
        `;
    } else {
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/login.html">Login</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/register.html">Register</a>
            </li>
        `;
    }
}
