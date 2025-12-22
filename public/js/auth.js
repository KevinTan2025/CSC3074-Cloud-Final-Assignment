const API_URL = '/api';

const auth = {
    // Login function
    login: async (email, password, turnstileToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, turnstileToken })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Register function
    register: async (fullName, email, password, turnstileToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ full_name: fullName, email, password, turnstileToken })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Logout function
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    // Check if user is logged in
    isLoggedIn: () => {
        return !!localStorage.getItem('token');
    },

    // Get current user info
    getUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Get auth token
    getToken: () => {
        return localStorage.getItem('token');
    }
};
