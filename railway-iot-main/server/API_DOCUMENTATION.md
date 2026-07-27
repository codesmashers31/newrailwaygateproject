# 📖 API Documentation

This document explicitly defines every API available to the React Native team.

---

## 🔐 Authentication

### 1. Register User
- **Method:** `POST`
- **URL:** `/api/auth/register`
- **Auth Required:** ❌ No
- **Body:**
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com"
}
```
- **Success (201):** `{ "success": true, "message": "User registered successfully" }`

### 2. Login (Request OTP)
- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Auth Required:** ❌ No
- **Body:** `{ "phone": "+919876543210" }`
- **Success (200):** `{ "success": true, "data": { "otp": "123456" } }`

### 3. Verify OTP
- **Method:** `POST`
- **URL:** `/api/auth/verify-otp`
- **Auth Required:** ❌ No
- **Body:** `{ "phone": "+919876543210", "otp": "123456" }`
- **Success (200):** Returns `accessToken` and `refreshToken`. **Save both.**

### 4. Logout
- **Method:** `POST`
- **URL:** `/api/auth/logout`
- **Auth Required:** ✅ Yes (Any Role)
- **Body:** `{ "token": "<your_refresh_token_here>" }`

---

## 👤 Users

### 1. Get Profile
- **Method:** `GET`
- **URL:** `/api/users/profile`
- **Auth Required:** ✅ Yes (USER or ADMIN)
- **Success (200):** Returns user details and an array of `favouriteGates`.

### 2. Update Profile
- **Method:** `PATCH`
- **URL:** `/api/users/profile`
- **Auth Required:** ✅ Yes
- **Body:** `{ "name": "New Name" }`

### 3. Update Favourite Gates
- **Method:** `PUT`
- **URL:** `/api/users/favourite-gates`
- **Auth Required:** ✅ Yes
- **Body:** `{ "gates": ["<gate_object_id_1>", "<gate_object_id_2>"] }`
- **Success (200):** Overwrites the user's favourite gates array.

---

## 🚂 Railway Gates

### 1. Get All Gates
- **Method:** `GET`
- **URL:** `/api/gates`
- **Auth Required:** ✅ Yes (ALL)
- **Success (200):** Returns array of all gates and their `currentStatus` (OPEN/CLOSED).

### 2. Get Gate History
- **Method:** `GET`
- **URL:** `/api/gates/:id/history`
- **Auth Required:** ✅ Yes (ALL)
- **Success (200):** Returns array of `GateEventLog`s for that specific gate.

---

## 📡 IoT / Hardware (NO JWT REQUIRED)

### 1. Send Gate Status
- **Method:** `POST`
- **URL:** `/api/iot/status`
- **Auth Required:** ❌ No (Uses hardware identification)
- **Body:**
```json
{
  "deviceCode": "ESP001",
  "status": "OPEN",
  "sensorType": "REED_SWITCH"
}
```

### 2. Send Heartbeat
- **Method:** `POST`
- **URL:** `/api/iot/heartbeat`
- **Auth Required:** ❌ No
- **Body:**
```json
{
  "deviceCode": "ESP001",
  "rssi": -50,
  "freeHeap": 120000
}
```
