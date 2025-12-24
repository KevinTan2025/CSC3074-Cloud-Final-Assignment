// main.js - small UI helpers for public pages
// - updateAuthUI: populate nav with login/register or authenticated user menu
// - loadFeaturedRooms: fetches rooms and shows a few featured cards on the homepage

// Run common initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wrap calls in try/catch to avoid breaking pages if auth or DOM is missing
    try { updateAuthUI(); } catch (e) { console.warn('updateAuthUI failed:', e); }
    try { loadFeaturedRooms(); } catch (e) { console.warn('loadFeaturedRooms failed:', e); }
});

// Load and render a small set of featured rooms on the homepage
async function loadFeaturedRooms() {
    const container = document.getElementById('featuredRooms');
    if (!container) return; // nothing to do on non-home pages

    try {
        const response = await fetch('/api/rooms');
        if (!response.ok) {
            console.error('Failed to fetch rooms, status:', response.status);
            container.innerHTML = '<div class="col-12 text-center"><p>No rooms available at the moment.</p></div>';
            return;
        }

        const rooms = await response.json();
        if (!Array.isArray(rooms) || rooms.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>No rooms available at the moment.</p></div>';
            return;
        }

        // Display first 3 rooms as featured (defensive: ensure description exists)
        const featuredRooms = rooms.slice(0, 3);

        container.innerHTML = featuredRooms.map(room => {
            const imageUrl = (room.RoomImages && room.RoomImages.length > 0)
                ? room.RoomImages[0].image_url
                : 'https://via.placeholder.com/400x300?text=No+Image';

            const description = room.description ? String(room.description).substring(0, 100) : '';
            const roomType = room.type ? String(room.type) : '';
            const price = room.price_per_night != null ? String(room.price_per_night) : '';
            const id = room.id != null ? encodeURIComponent(room.id) : '';

            return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <img src="${imageUrl}" class="card-img-top" alt="${roomType || 'Room'}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${roomType} Room</h5>
                            <p class="card-text text-muted">${description}...</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="h5 mb-0 text-primary">$${price}/night</span>
                                <a href="/room-details.html?id=${id}" class="btn btn-outline-primary">View Details</a>
                            </div>
                        </div>
                        <div class="card-footer bg-white border-top-0">
                            <small class="text-muted">
                                <i class="bi bi-people"></i> ${roomType === 'Single' ? '1 Person' : '2 People'}
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

// Update the nav area with authentication state. Relies on global `auth` helper.
function updateAuthUI() {
    const authNav = document.getElementById('authNav');
    if (!authNav) return; // no nav on some pages

    // Defensive: ensure `auth` is defined and has expected methods
    const hasAuth = typeof auth === 'object' && typeof auth.isLoggedIn === 'function';
    if (!hasAuth) {
        // fallback: show login/register links
        authNav.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="/login.html">Login</a></li>
            <li class="nav-item"><a class="nav-link" href="/register.html">Register</a></li>
        `;
        return;
    }

    if (auth.isLoggedIn()) {
        const user = auth.getUser() || { full_name: 'User', role: '' };
        const safeName = String(user.full_name || 'User');
        const safeRole = String(user.role || '');

        authNav.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                    ${safeName} ${safeRole ? `(${safeRole})` : ''}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="/my-bookings.html">My Bookings</a></li>
                    ${safeRole === 'admin' ? '<li><a class="dropdown-item" href="/admin/dashboard.html">Admin Dashboard</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="auth.logout()">Logout</a></li>
                </ul>
            </li>
        `;
    } else {
        authNav.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="/login.html">Login</a></li>
            <li class="nav-item"><a class="nav-link" href="/register.html">Register</a></li>
        `;
    }
}
