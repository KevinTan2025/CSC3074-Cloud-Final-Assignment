const express = require('express');
const router = express.Router();
const { Room, RoomImage } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// GET /api/rooms - Get all rooms (Public)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [{ model: RoomImage }] // Include images
    });
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/:id - Get single room (Public)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [{ model: RoomImage }]
    });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms - Create a room (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { room_number, type, price_per_night, description, features } = req.body;
    
    const newRoom = await Room.create({
      room_number,
      type,
      price_per_night,
      description,
      features
    });

    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id - Update a room (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { room_number, type, price_per_night, status, description, features } = req.body;
    
    const room = await Room.findByPk(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.update({
      room_number,
      type,
      price_per_night,
      status,
      description,
      features
    });

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rooms/:id - Delete a room (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.destroy();
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
