const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// GET /api/users - List all users (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'full_name', 'email', 'role', 'created_at'] // Exclude password_hash
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
