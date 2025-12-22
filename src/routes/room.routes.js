const express = require('express');
const router = express.Router();
const { Room, RoomImage, Booking } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const upload = require('../middleware/upload.middleware');
const { uploadFile, deleteFile, getFileSignedUrl } = require('../services/s3.service');

// Helper to process rooms and sign image URLs
const processRoomImages = async (rooms) => {
  // Handle single room object or array of rooms
  const isArray = Array.isArray(rooms);
  const roomList = isArray ? rooms : [rooms];

  const processedRooms = await Promise.all(roomList.map(async (room) => {
    // Convert Sequelize instance to plain object to modify properties
    const roomData = room.toJSON();
    
    if (roomData.RoomImages && roomData.RoomImages.length > 0) {
      roomData.RoomImages = await Promise.all(roomData.RoomImages.map(async (img) => {
        img.image_url = await getFileSignedUrl(img.image_url);
        return img;
      }));
    }
    return roomData;
  }));

  return isArray ? processedRooms : processedRooms[0];
};

// GET /api/rooms/search - Search available rooms
router.get('/search', async (req, res) => {
  try {
    const { check_in, check_out, type } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ message: 'Please provide check_in and check_out dates' });
    }

    // 1. Find booked room IDs in the given range
    const bookedRooms = await Booking.findAll({
      attributes: ['room_id'],
      where: {
        status: { [Op.ne]: 'cancelled' },
        [Op.and]: [
          { check_in_date: { [Op.lt]: check_out } },
          { check_out_date: { [Op.gt]: check_in } }
        ]
      }
    });

    const bookedRoomIds = bookedRooms.map(b => b.room_id);

    // 2. Find rooms that are NOT in the booked list
    const whereClause = {
      id: { [Op.notIn]: bookedRoomIds },
      status: 'available' // Only show rooms that are not in maintenance
    };

    if (type) {
      whereClause.type = type;
    }

    const availableRooms = await Room.findAll({
      where: whereClause,
      include: [{ model: RoomImage }]
    });

    const roomsWithSignedUrls = await processRoomImages(availableRooms);
    res.json(roomsWithSignedUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms - Get all rooms (Public)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [{ model: RoomImage }] // Include images
    });
    const roomsWithSignedUrls = await processRoomImages(rooms);
    res.json(roomsWithSignedUrls);
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
    const roomWithSignedUrls = await processRoomImages(room);
    res.json(roomWithSignedUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms - Create a room (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { type, price_per_night, description, features } = req.body;

    // Auto-generate room number logic
    // Find the highest room number currently in the database
    const lastRoom = await Room.findOne({
      order: [['id', 'DESC']]
    });

    let nextRoomNumber = 101; // Default start
    if (lastRoom && lastRoom.room_number) {
        // Assuming room_number is numeric or ends in number. 
        // Simple logic: Try to parse int and add 1. 
        // If your room numbers are complex (e.g. "A-101"), this needs more logic.
        // For now, let's assume simple integer strings like "101", "102".
        const lastNum = parseInt(lastRoom.room_number, 10);
        if (!isNaN(lastNum)) {
            nextRoomNumber = lastNum + 1;
        }
    }

    // Double check if it exists (though unlikely with this logic unless race condition)
    const existingRoom = await Room.findOne({ where: { room_number: nextRoomNumber.toString() } });
    if (existingRoom) {
        return res.status(409).json({ message: `Room number ${nextRoomNumber} already exists. Please try again.` });
    }
    
    const newRoom = await Room.create({
      room_number: nextRoomNumber.toString(),
      type,
      price_per_night,
      description,
      features
    });

    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    // Handle Sequelize Unique Constraint Error specifically
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Room number already exists' });
    }
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

// POST /api/rooms/:id/images - Upload images for a room (Admin only)
router.post('/:id/images', verifyToken, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findByPk(roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const imageUrl = await uploadFile(file);
      
      const newImage = await RoomImage.create({
        room_id: roomId,
        image_url: imageUrl,
        is_primary: false // Default to false, can be updated later
      });
      
      uploadedImages.push(newImage);
    }

    res.status(201).json({ message: 'Images uploaded successfully', images: uploadedImages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// DELETE /api/rooms/images/:imageId - Delete a specific image (Admin only)
router.delete('/images/:imageId', verifyToken, isAdmin, async (req, res) => {
  try {
    const imageId = req.params.imageId;
    const image = await RoomImage.findByPk(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from S3
    await deleteFile(image.image_url);

    // Delete from DB
    await image.destroy();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
