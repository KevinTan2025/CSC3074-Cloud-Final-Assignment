# 🏨 BookingKaKa.store - Cloud-Native Hotel Booking System

![Status](https://img.shields.io/badge/Status-Active-success)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![Express](https://img.shields.io/badge/Express-v4.18-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![AI](https://img.shields.io/badge/AI-DeepSeek-purple)

## 👥 Authors
-   **Tan Kok Feng**
-   **Wong Wen Ru**

**BookingKaKa.store** is a modern, full-stack hotel booking platform designed for cloud deployment. It features a robust Node.js backend, a responsive Bootstrap frontend, and integrates advanced features like AI customer support and Cloudflare security.

---

## ✨ Key Features

### 🛡️ Security & Architecture
-   **Cloudflare Turnstile Integration**: Protects Login and Register forms from bot attacks using smart CAPTCHA.
-   **JWT Authentication**: Stateless, secure user sessions.
-   **Database Security**: MySQL configured for internal access (localhost), preventing external exposure.
-   **Environment Isolation**: Full configuration via `.env` for Development/Production separation.

### 🤖 AI-Powered Customer Support
-   **Virtual Assistant**: Integrated Chatbot (powered by DeepSeek/OpenAI SDK) to answer user queries 24/7.
-   **Context Awareness**: Remembers conversation history and user identity.
-   **System Prompting**: Strictly defined persona to ensure professional responses.

### 🏨 Core Functionality
-   **Room Management**: View details, amenities, and real-time availability.
-   **Smart Booking System**:
    -   Date blocking for already booked rooms.
    -   Flatpickr integration for intuitive date selection.
-   **Admin Dashboard**: Manage rooms and view bookings.
-   **Payment Simulation**: Mock payment gateway integration.

### 🚀 DevOps & Deployment
-   **`appctl.sh` Control Script**: One-click management to Start, Stop, Restart, and Update the application.
-   **Systemd Integration**: Ready for production with auto-start on boot.
-   **No-Downtime Architecture**: Designed for stateless operation (Node.js).

---

## 🛠️ Tech Stack

-   **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript.
-   **Backend**: Node.js, Express.js.
-   **Database**: MySQL (via Sequelize ORM).
-   **External Services**:
    -   AWS S3 (Image Storage).
    -   Cloudflare Turnstile (Security).
    -   DeepSeek API (AI Chat).

---

## 🚀 Quick Start

### 1. Prerequisites
-   Node.js (v16 or higher)
-   MySQL Server
-   Git

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/KevinTan2025/CSC3074-Cloud-Final-Assignment.git
cd CSC3074-Cloud-Final-Assignment

# Install dependencies
npm install
```

### 3. Configuration (.env)
Create a `.env` file in the root directory:

```dotenv
# Environment
enviroment=development

# Server
SERVER_PORT=3000
DOMAIN_BASE=localhost

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=booking-db
DB_USER=root
DB_PASSWORD=your_password

# Security (JWT)
JWT_SECRET=your_super_secret_key_123

# Cloudflare Turnstile (Get keys from Cloudflare Dashboard)
TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# AI Support (DeepSeek/OpenAI)
OPENAI_API_KEY=your_api_key
OPENAI_API_BASE=https://api.deepseek.com/
OPENAI_MODEL=deepseek-chat

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=...
```

### 4. Database Initialization
Initialize the database schema and seed initial data:

```bash
# Create tables
node src/scripts/init-db.js

# Seed demo data (Rooms, Users)
node src/scripts/seed.js
```

### 5. Run the Application

**Development Mode:**
```bash
npm run dev
```
Access at: `http://localhost:3000`

---

## ⚙️ Production Deployment

### Using `appctl.sh` (Recommended)
We provide a powerful control script for managing the application process in the background.

```bash
# Make script executable
chmod +x appctl.sh

# Start the application (Background mode)
./appctl.sh start

# Check status
./appctl.sh status

# Stop the application
./appctl.sh stop

# Pull latest code from Git and restart
./appctl.sh update
```

### Systemd Auto-Start (Linux)
To ensure the app starts automatically when the server reboots, create a systemd service.

1.  **Create Service File**: `/etc/systemd/system/booking-app.service`

```ini
[Unit]
Description=BookingKaKa Node.js App
After=network.target mysql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/CSC3074-Cloud-Final-Assignment
ExecStart=/usr/bin/npm run dev
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

2.  **Enable and Start**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable booking-app
sudo systemctl start booking-app
```

---

## 📂 Project Structure

```
CSC3074-Cloud-Final-Assignment/
├── appctl.sh              # Process management script
├── package.json           # Dependencies
├── server.js              # Entry point
├── src/
│   ├── app.js             # Express app setup
│   ├── config/            # DB & System Prompts
│   ├── controllers/       # (Optional) Logic separation
│   ├── middleware/        # Auth & Upload middleware
│   ├── models/            # Sequelize Models (User, Room, Booking)
│   ├── routes/            # API Routes (Auth, Chat, Rooms)
│   └── services/          # S3 & External services
├── public/                # Static Frontend Files
│   ├── css/               # Styles (chat.css, etc.)
│   ├── js/                # Client logic (auth.js, chat.js)
│   ├── admin/             # Admin pages
│   └── *.html             # HTML Pages
└── planning/              # Project documentation
```

---

## 🔒 API Security & Best Practices

1.  **Internal Database**: The MySQL database listens on `localhost` (3306), ensuring it is not accessible from the public internet.
2.  **Turnstile Verification**: Backend strictly verifies the Turnstile token with Cloudflare before processing any Login/Register request.
3.  **Sanitization**: All user inputs (Chat, Forms) are processed to prevent XSS and Injection attacks.
4.  **Stateless Backend**: The Node.js app stores no session state in memory, making it perfectly suitable for horizontal scaling (Load Balancers).

---

*© 2025 BookingKaKa.store. All Rights Reserved.*