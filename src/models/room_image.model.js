const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RoomImage = sequelize.define('RoomImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Stores the public URL from AWS S3'
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'room_images',
  timestamps: false
});

module.exports = RoomImage;
