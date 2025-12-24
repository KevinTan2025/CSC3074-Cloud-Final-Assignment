document.addEventListener('DOMContentLoaded', () => {
    // Set default dates (today and tomorrow) when the inputs exist.
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const checkInEl = document.getElementById('checkIn');
        const checkOutEl = document.getElementById('checkOut');
        if (checkInEl && checkOutEl && 'valueAsDate' in checkInEl) {
            checkInEl.valueAsDate = today;
            checkOutEl.valueAsDate = tomorrow;
        }
    } catch (e) {
        // Ignore if elements are not present on the page
        console.warn('Date inputs not present or inaccessible:', e);
    }

    // Initial load of rooms (graceful if container not on page)
    try { loadRooms(); } catch (e) { console.warn('loadRooms init failed:', e); }

    // Hook up search form submission if the form exists
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const checkInEl = document.getElementById('checkIn');
            const checkOutEl = document.getElementById('checkOut');
            const typeEl = document.getElementById('roomType');

            const checkIn = checkInEl ? checkInEl.value : '';
            const checkOut = checkOutEl ? checkOutEl.value : '';
            const type = typeEl ? typeEl.value : '';

            loadRooms({ check_in: checkIn, check_out: checkOut, type });
        });
    }
});

async function loadRooms(filters = {}) {
    const container = document.getElementById('roomsContainer');
    if (!container) return; // nothing to render on pages without the container

    container.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    try {
        let url = '/api/rooms';
        
        // If filtering by date, use the search endpoint
        if (filters.check_in && filters.check_out) {
            const params = new URLSearchParams({
                check_in: filters.check_in,
                check_out: filters.check_out
            });
            if (filters.type) {
                params.append('type', filters.type);
            }
            url = `/api/rooms/search?${params.toString()}`;
        } else if (filters.type) {
            // Client-side filtering if only type is selected (or add backend support)
            // For now, let's just fetch all and filter client side if not using the search endpoint
            // But wait, the search endpoint requires dates. 
            // If user just wants to see "Single" rooms without dates, we might need to fetch all and filter.
        }

        const response = await fetch(url);
        if (!response.ok) {
            console.error('Rooms fetch failed with status', response.status);
            container.innerHTML = '<div class="col-12 text-center"><p class="lead">No rooms found matching your criteria.</p></div>';
            return;
        }

        let rooms = await response.json();
        if (!Array.isArray(rooms)) rooms = [];

        // Client-side filtering for type if we didn't use the search endpoint
        if (filters.type && !url.includes('search')) {
            rooms = rooms.filter(room => room && room.type === filters.type);
        }

        if (rooms.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p class="lead">No rooms found matching your criteria.</p></div>';
            return;
        }

        container.innerHTML = rooms.map(room => {
            // Defensive guards for missing fields
            const imageUrl = (room && room.RoomImages && room.RoomImages.length > 0)
                ? room.RoomImages[0].image_url
                : 'https://via.placeholder.com/400x300?text=No+Image';

            const roomType = room && room.type ? String(room.type) : 'Room';
            const roomNumber = room && room.room_number != null ? String(room.room_number) : '';
            const description = room && room.description ? String(room.description).substring(0, 100) : '';
            const price = room && room.price_per_night != null ? String(room.price_per_night) : '';
            const id = room && room.id != null ? encodeURIComponent(room.id) : '';

            // Normalize features to an array (server may store as JSON string)
            let features = [];
            try {
                let raw = room && room.features;
                if (typeof raw === 'string') {
                    try { raw = JSON.parse(raw); } catch (e) { raw = []; }
                }
                if (Array.isArray(raw)) features = raw;
            } catch (e) { features = []; }

            return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <img src="${imageUrl}" class="card-img-top" alt="${roomType}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title">${roomType} Room</h5>
                                <span class="badge bg-success">${roomNumber}</span>
                            </div>
                            <p class="card-text text-muted small">${description}...</p>
                            <div class="mb-3">${features.map(f => `<span class="badge bg-light text-dark border me-1">${f}</span>`).join('')}</div>
                            <div class="d-flex justify-content-between align-items-center mt-auto">
                                <span class="h5 mb-0 text-primary">$${price}<small class="text-muted fs-6">/night</small></span>
                                <a href="/room-details.html?id=${id}" class="btn btn-outline-primary">View Details</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading rooms:', error);
        container.innerHTML = `<div class="col-12 text-center text-danger"><p>Failed to load rooms: ${error.message}</p></div>`;
    }
}
