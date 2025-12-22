const bcrypt = require('bcrypt');
const { User, Room, Booking, Review, RoomImage } = require('../models');

const seedData = async () => {
  try {
    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Data already exists. Skipping seeding.');
      return;
    }

    console.log('Seeding dummy data...');

    // 1. Create Users
    // Let bcrypt generate a new salt for each password automatically
    // Changing default passwords to 'password123' as requested
    const adminPassword = await bcrypt.hash('password123', 10);
    const userPassword = await bcrypt.hash('password123', 10);

    const admin = await User.create({
      email: 'admin@hotel.com',
      password_hash: adminPassword,
      full_name: 'Admin User',
      role: 'admin'
    });

    const customer = await User.create({
      email: 'customer@hotel.com',
      password_hash: userPassword,
      full_name: 'John Doe',
      role: 'customer'
    });

    console.log('Users created.');

    // 2. Create Rooms
    const roomsData = [
      {
        room_number: '101',
        type: 'Single',
        price_per_night: 80.00,
        description: 'A cozy single room with a city view.',
        features: ['Wifi', 'TV', 'City View'],
        status: 'available'
      },
      {
        room_number: '102',
        type: 'Double',
        price_per_night: 120.00,
        description: 'Spacious double room perfect for couples.',
        features: ['Wifi', 'TV', 'AC', 'Mini Bar'],
        status: 'available'
      },
      {
        room_number: '201',
        type: 'Suite',
        price_per_night: 250.00,
        description: 'Luxury suite with separate living area and jacuzzi.',
        features: ['Wifi', 'TV', 'AC', 'Jacuzzi', 'Ocean View'],
        status: 'available'
      }
    ];

    const rooms = await Room.bulkCreate(roomsData);
    console.log('Rooms created.');

    // 3. Create Room Images (Dummy URLs)
    await RoomImage.bulkCreate([
      { room_id: rooms[0].id, image_url: 'https://placehold.co/600x400?text=Single+Room', is_primary: true },
      { room_id: rooms[1].id, image_url: 'https://placehold.co/600x400?text=Double+Room', is_primary: true },
      { room_id: rooms[2].id, image_url: 'https://placehold.co/600x400?text=Luxury+Suite', is_primary: true },
      { room_id: rooms[2].id, image_url: 'https://placehold.co/600x400?text=Suite+Bathroom', is_primary: false }
    ]);
    console.log('Room images created.');

    // 4. Create Bookings
    // Booking for next week
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 3);

    await Booking.create({
      user_id: customer.id,
      room_id: rooms[1].id, // Book the Double Room
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_price: 360.00, // 3 * 120
      status: 'confirmed',
      notes: 'Anniversary trip'
    });
    console.log('Bookings created.');

    // 5. Create Reviews
    await Review.create({
      user_id: customer.id,
      room_id: rooms[0].id, // Review for Single Room (assuming past stay)
      rating: 5,
      comment: 'Great value for money! Very clean.'
    });
    console.log('Reviews created.');

    console.log('Dummy data seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
};

module.exports = seedData;
