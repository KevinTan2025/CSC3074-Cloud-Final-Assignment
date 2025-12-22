const express = require("express");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const roomRoutes = require("./routes/room.routes");
const bookingRoutes = require("./routes/bookings.routes");
const userRoutes = require("./routes/users.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

// Serve static files from public directory
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json());

// Routes
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);

module.exports = app;
