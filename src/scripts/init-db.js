require('dotenv').config();
const mysql = require('mysql2/promise');

async function initialize() {
  try {
    // 1. Create Database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' checked/created.`);
    await connection.end();

    // 2. Initialize Sequelize and Tables
    // We require this AFTER creating the DB, so Sequelize can connect to it
    const { initDB } = require('../models');
    await initDB();

    console.log('Initialization complete.');
    process.exit(0);
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
}

initialize();
