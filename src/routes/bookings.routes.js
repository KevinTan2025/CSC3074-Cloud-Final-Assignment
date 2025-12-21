const express = require('express');
const router = express.Router();
const { Booking, Room, User } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { Op } = require('sequelize'); // Import Op for operators

// GET /api/bookings - Get all bookings (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, attributes: ['id', 'full_name', 'email'] },
        { model: Room, attributes: ['id', 'room_number', 'type'] }
      ]
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/my-bookings - Get current user's bookings
router.get('/my-bookings', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Room, attributes: ['id', 'room_number', 'type', 'price_per_night'] }
      ]
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const { room_id, check_in_date, check_out_date, notes } = req.body;

    // 1. Check if room exists
    const room = await Room.findByPk(room_id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 1.5 Check for Double Booking (Overlap Check)
    // Logic: A new booking overlaps if:
    // (NewStart < ExistingEnd) AND (NewEnd > ExistingStart)
    // AND status is NOT 'cancelled'
    const conflictingBooking = await Booking.findOne({
      where: {
        room_id,
        status: { [Op.ne]: 'cancelled' }, // Ignore cancelled bookings
        [Op.and]: [
          { check_in_date: { [Op.lt]: check_out_date } }, // Existing Start < New End
          { check_out_date: { [Op.gt]: check_in_date } }  // Existing End > New Start
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({ 
        message: 'Room is already booked for these dates',
        conflict: {
          check_in: conflictingBooking.check_in_date,
          check_out: conflictingBooking.check_out_date
        }
      });
    }

    // 
    // 2. Calculate total price
    const start = new Date(check_in_date);
    const end = new Date(check_out_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays <= 0) {
        return res.status(400).json({ message: 'Invalid dates' });
    }

    const total_price = diffDays * room.price_per_night;

    // 3. Create booking
    const booking = await Booking.create({
      user_id: req.user.id,
      room_id,
      check_in_date,
      check_out_date,
      total_price,
      status: 'pending',
      notes
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/bookings/:id/status - Update booking status (Admin only)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'confirmed', 'cancelled', 'completed'
    
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
