document.addEventListener('DOMContentLoaded', () => {
    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    document.getElementById('checkIn').valueAsDate = today;
    document.getElementById('checkOut').valueAsDate = tomorrow;

    // Initial load
    loadRooms();

    // Handle search
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const type = document.getElementById('roomType').value;
        
        loadRooms({ check_in: checkIn, check_out: checkOut, type });
    });
});

async function loadRooms(filters = {}) {
    const container = document.getElementById('roomsContainer');
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
        let rooms = await response.json();

        // Client-side filtering for type if we didn't use the search endpoint
        if (filters.type && !url.includes('search')) {
            rooms = rooms.filter(room => room.type === filters.type);
        }

        if (rooms.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p class="lead">No rooms found matching your criteria.</p></div>';
            return;
        }

        container.innerHTML = rooms.map(room => {
            const imageUrl = room.RoomImages && room.RoomImages.length > 0 
                ? room.RoomImages[0].image_url 
                : 'https://via.placeholder.com/400x300?text=No+Image';

            return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <img src="${imageUrl}" class="card-img-top" alt="${room.type}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title">${room.type} Room</h5>
                                <span class="badge bg-success">${room.room_number}</span>
                            </div>
                            <p class="card-text text-muted small">${room.description.substring(0, 100)}...</p>
                            
                            <div class="mb-3">
                                ${(function() {
                                    let features = [];
                                    let raw = room.features;
                                    
                                    if (typeof raw === 'string') {
                                        try { raw = JSON.parse(raw); } catch(e) {}
                                    }
                                    
                                    if (Array.isArray(raw)) {
                                        features = raw;
                                    }
                                    
                                    return features.map(f => 
                                        `<span class="badge bg-light text-dark border me-1">${f}</span>`
                                    ).join('');
                                })()}
                            </div>

                            <div class="d-flex justify-content-between align-items-center mt-auto">
                                <span class="h5 mb-0 text-primary">$${room.price_per_night}<small class="text-muted fs-6">/night</small></span>
                                <a href="/room-details.html?id=${room.id}" class="btn btn-outline-primary">View Details</a>
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
