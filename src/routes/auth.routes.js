const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function verifyTurnstile(token) {
    try {
        console.log('Verifying Turnstile Token:', token);
        console.log('Using Secret Key:', process.env.TURNSTILE_SECRET_KEY);

        const formData = new URLSearchParams();
        formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
        formData.append('response', token);

        const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', formData);
        
        console.log('Cloudflare Response:', response.data);

        if (!response.data.success) {
            console.error('Turnstile verification failed:', response.data);
        }
        
        return response.data.success;
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return false;
    }
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, turnstileToken } = req.body;

    if (!await verifyTurnstile(turnstileToken)) {
        return res.status(400).json({ message: 'Security check failed' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      full_name
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, turnstileToken } = req.body;

    if (!await verifyTurnstile(turnstileToken)) {
        return res.status(400).json({ message: 'Security check failed' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT (You need to set JWT_SECRET in .env)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_key', // Fallback for dev
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
