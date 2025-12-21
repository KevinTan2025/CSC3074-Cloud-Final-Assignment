const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  room_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  price_per_night: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'maintenance'),
    defaultValue: 'available'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  features: {
    type: DataTypes.JSON, // Stores features like ["Wifi", "AC"]
    allowNull: true
  }
}, {
  tableName: 'rooms',
  timestamps: false // The plan didn't specify timestamps for rooms, but usually good to have. I'll disable to match strict schema or enable? Plan didn't say. I'll disable for now.
});

module.exports = Room;
