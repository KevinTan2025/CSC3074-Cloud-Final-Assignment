# Hotel Booking System API Documentation

Base URL: `http://localhost:3000`

## Authentication

### Register
Create a new user account.
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }
  ```
- **Response**: `201 Created`

### Login
Authenticate user and get JWT token.
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "customer"
    }
  }
  ```

---

## Users

### List All Users
Get a list of all registered users.
- **URL**: `/api/users`
- **Method**: `GET`
- **Auth**: Bearer Token (Admin Only)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "user@example.com",
      "role": "customer",
      "created_at": "2025-12-21T10:00:00.000Z"
    }
  ]
  ```

---

## Rooms

### Search Available Rooms
Find rooms available for a specific date range.
- **URL**: `/api/rooms/search`
- **Method**: `GET`
- **Auth**: None
- **Query Parameters**:
  - `check_in`: Date (YYYY-MM-DD) - Required
  - `check_out`: Date (YYYY-MM-DD) - Required
  - `type`: String - Optional (e.g., "Single")
- **Example**: `/api/rooms/search?check_in=2025-12-25&check_out=2025-12-28`
- **Response**: `200 OK` (List of Room objects)

### Get All Rooms
List all rooms in the system.
- **URL**: `/api/rooms`
- **Method**: `GET`
- **Auth**: None
- **Response**: `200 OK`

### Get Single Room
Get details of a specific room.
- **URL**: `/api/rooms/:id`
- **Method**: `GET`
- **Auth**: None
- **Response**: `200 OK`

### Create Room
Add a new room to the system. Room number is auto-generated.
- **URL**: `/api/rooms`
- **Method**: `POST`
- **Auth**: Bearer Token (Admin Only)
- **Body**:
  ```json
  {
    "type": "Single",
    "price_per_night": 100.00,
    "description": "A cozy room",
    "features": ["Wifi", "AC"]
  }
  ```
- **Response**: `201 Created`

### Update Room
Update details of an existing room.
- **URL**: `/api/rooms/:id`
- **Method**: `PUT`
- **Auth**: Bearer Token (Admin Only)
- **Body**:
  ```json
  {
    "room_number": "101",
    "type": "Double",
    "price_per_night": 150.00,
    "status": "maintenance",
    "description": "Updated description",
    "features": ["Wifi", "AC", "TV"]
  }
  ```
- **Response**: `200 OK`

### Delete Room
Remove a room from the system.
- **URL**: `/api/rooms/:id`
- **Method**: `DELETE`
- **Auth**: Bearer Token (Admin Only)
- **Response**: `200 OK`

### Upload Room Images
Upload one or more images for a specific room.
- **URL**: `/api/rooms/:id/images`
- **Method**: `POST`
- **Auth**: Bearer Token (Admin Only)
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `images`: File (Multiple files allowed, max 5)
- **Response**: `201 Created`
  ```json
  {
    "message": "Images uploaded successfully",
    "images": [
      {
        "id": 1,
        "room_id": 1,
        "image_url": "https://my-bucket.s3.region.amazonaws.com/image.jpg",
        "is_primary": false
      }
    ]
  }
  ```

### Delete Room Image
Delete a specific image from a room (and from S3).
- **URL**: `/api/rooms/images/:imageId`
- **Method**: `DELETE`
- **Auth**: Bearer Token (Admin Only)
- **Response**: `200 OK`

---

## Bookings

### Create Booking
Book a room. Checks for availability automatically.
- **URL**: `/api/bookings`
- **Method**: `POST`
- **Auth**: Bearer Token
- **Body**:
  ```json
  {
    "room_id": 1,
    "check_in_date": "2025-12-25",
    "check_out_date": "2025-12-28",
    "notes": "Late check-in"
  }
  ```
- **Response**: `201 Created`
- **Error Response (Conflict)**: `409 Conflict` (If room is already booked)

### Get My Bookings
Get bookings for the currently logged-in user.
- **URL**: `/api/bookings/my-bookings`
- **Method**: `GET`
- **Auth**: Bearer Token
- **Response**: `200 OK`

### Get All Bookings
List all bookings in the system.
- **URL**: `/api/bookings`
- **Method**: `GET`
- **Auth**: Bearer Token (Admin Only)
- **Response**: `200 OK`

### Update Booking Status
Change the status of a booking (e.g., confirm, cancel).
- **URL**: `/api/bookings/:id/status`
- **Method**: `PUT`
- **Auth**: Bearer Token (Admin Only)
- **Body**:
  ```json
  {
    "status": "confirmed" 
  }
  ```
  Allowed values: `pending`, `confirmed`, `cancelled`, `completed`
- **Response**: `200 OK`

---

## Health Check
Check if the API is running.
- **URL**: `/health`
- **Method**: `GET`
- **Response**: `200 OK`
