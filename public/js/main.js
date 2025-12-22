document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

function updateAuthUI() {
    const authNav = document.getElementById('authNav');
    if (!authNav) return;

    if (auth.isLoggedIn()) {
        const user = auth.getUser();
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
