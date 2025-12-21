const sequelize = require('../config/db');
const User = require('./user.model');
const Room = require('./room.model');
const Booking = require('./booking.model');
const RoomImage = require('./room_image.model');
const Review = require('./review.model');
const Payment = require('./payment.model');

// Define Associations

// User <-> Booking
User.hasMany(Booking, { foreignKey: 'user_id' });
Booking.belongsTo(User, { foreignKey: 'user_id' });

// Room <-> Booking
Room.hasMany(Booking, { foreignKey: 'room_id' });
Booking.belongsTo(Room, { foreignKey: 'room_id' });

// Room <-> RoomImage
Room.hasMany(RoomImage, { foreignKey: 'room_id' });
RoomImage.belongsTo(Room, { foreignKey: 'room_id' });

// User <-> Review
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// Room <-> Review
Room.hasMany(Review, { foreignKey: 'room_id' });
Review.belongsTo(Room, { foreignKey: 'room_id' });

// Booking <-> Payment
Booking.hasMany(Payment, { foreignKey: 'booking_id' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Sync all models
    // force: false means it will NOT drop the table if it already exists
    // alter: true checks what is the current state of the table in the database (which columns it has, what are their data types, etc), and then performs the necessary changes in the table to make it match the model.
    await sequelize.sync({ force: false, alter: false }); 
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Room,
  Booking,
  RoomImage,
  Review,
  Payment,
  initDB
};
