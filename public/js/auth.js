// auth.js - simple client-side auth helpers that interact with server API
// Exposes: auth.login, auth.register, auth.logout, auth.isLoggedIn, auth.getUser, auth.getToken

const API_URL = '/api';

const auth = {
    // Login function: sends credentials + Turnstile token to server and stores the returned token/user
    login: async (email, password, turnstileToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, turnstileToken })
            });

            // Defensive: attempt to parse JSON, but handle empty/non-JSON responses
            let data = {};
            try { data = await response.json(); } catch (_) {}

            if (response.ok && data.token) {
                // Save token and user info
                localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Register function: creates a new user account
    register: async (fullName, email, password, turnstileToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, email, password, turnstileToken })
            });

            let data = {};
            try { data = await response.json(); } catch (_) {}

            if (response.ok) return { success: true };
            return { success: false, message: data.message || 'Registration failed' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Logout: clear stored auth and send user to login page
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    // Check if user is logged in based on token presence
    isLoggedIn: () => !!localStorage.getItem('token'),

    // Get current user info (parsed) or null
    getUser: () => {
        const userStr = localStorage.getItem('user');
        try { return userStr ? JSON.parse(userStr) : null; } catch (_) { return null; }
    },

    // Get auth token string
    getToken: () => localStorage.getItem('token')
};
