# Railway Gate Live Monitoring MVP - Enterprise API Documentation

## Cover

**Project Name:** Railway Gate Live Monitoring MVP
**Version:** 1.0.0
**Backend URL:** (Defined per environment, see Base URL section)
**Author:** Backend Architecture Team
**Last Updated:** June 2026
**API Version:** v1

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Base URL](#2-base-url)
3. [REST API Overview](#3-rest-api-overview)
4. [Common Headers](#4-common-headers)
5. [Standard Response Format](#5-standard-response-format)
6. [HTTP Status Codes](#6-http-status-codes)
7. [Authentication Flow](#7-authentication-flow)
8. [API Documentation](#8-api-documentation)
9. [Screen-wise Integration](#9-screen-wise-integration)
10. [Axios Integration Guide](#10-axios-integration-guide)
11. [Complete REST Flow Diagrams](#11-complete-rest-flow-diagrams)
12. [MongoDB Impact](#12-mongodb-impact)
13. [Error Reference](#13-error-reference)
14. [Security](#14-security)
15. [QA Testing Guide](#15-qa-testing-guide)
16. [Postman Guide](#16-postman-guide)
17. [Thunder Client Guide](#17-thunder-client-guide)
18. [Frontend Checklist](#18-frontend-checklist)

---

## 1 Project Overview

### Purpose

The Railway Gate Live Monitoring MVP is designed to track and manage the real-time physical status (OPEN/CLOSED) of railway level crossings. It aims to prevent accidents and improve traffic management by providing live data to users and administrators.

### Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Security:** JSON Web Tokens (JWT), Crypto, bcrypt (where applicable)
- **Hardware Integration:** ESP32 Microcontrollers sending HTTP POST requests over WiFi/GSM

### Backend Architecture

The backend follows a standard MVC (Model-View-Controller) architecture tailored for RESTful APIs:

- **Models:** Define the MongoDB schema and Mongoose schemas (e.g., `User.js`, `RailwayGate.js`).
- **Controllers:** Contain business logic, coordinate models, and handle HTTP request/response lifecycles.
- **Routes:** Map HTTP endpoints to specific controller functions.
- **Middleware:** Intercept requests for authentication, role validation, and payload formatting.

### Authentication & RBAC

Authentication is strictly JWT-based. It relies on a two-token system:

- **Access Token:** Short-lived JWT (e.g., 1 day) used for all protected API calls.
- **Refresh Token:** Long-lived secure string stored in MongoDB, used to securely obtain new Access Tokens without forcing the user to log in again.
- **Role-Based Access Control (RBAC):** Users are assigned a `role` (e.g., `USER`, `ADMIN`). Admin-only endpoints are protected by `adminMiddleware`.

### IoT Integration

Physical ESP32 devices are treated as standalone entities (`ESP32Device` collection). They are linked to a logical `RailwayGate`.
Devices send periodic heartbeats (health checks) and status events (gate opened/closed).
When a device sends a status event, the system updates the `RailwayGate`'s current status and appends a record to the `GateEventLog` for historical tracking.

### React Native Communication

The React Native mobile app communicates with this backend entirely through RESTful HTTP requests over HTTPS. Axios is the recommended HTTP client for handling interceptors, token injection, and global error handling.

---

## 2 Base URL

### Production URL

`https://api.your-production-domain.com/api`

### Development URL

`http://localhost:5000/api` (assuming default port)

### Environment Variables

For local setup, create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/railway-iot
JWT_SECRET=your_super_secret_key
ACCESS_TOKEN_EXPIRE=1d
```

### Frontend Configuration (Axios)

The React Native frontend should configure Axios with the base URL loaded from a configuration file (like `react-native-config` or `.env`):

```javascript
import axios from "axios";
import Config from "react-native-config";

const api = axios.create({
  baseURL: Config.BASE_URL || "http://10.0.2.2:5000/api", // 10.0.2.2 is localhost for Android Emulator
  timeout: 10000,
});
```

---

## 3 REST API Overview

The architecture enforces a strict unidirectional flow of data for every REST API call.

### The Flow

```text
Client (React Native / ESP32)
       â†“
     Axios (Network Request)
       â†“
Express Router (Endpoint matching)
       â†“
Middleware (Auth / Admin checks)
       â†“
  Controller (Business Logic)
       â†“
   Mongoose (ODM Layer)
       â†“
    MongoDB (Database)
       â†“
   Response (Standardized JSON)
```

---

## 4 Common Headers

For every endpoint, specific headers may be required based on the route's protection level.

### Content-Type

- **Value:** `application/json`
- **When required:** For all `POST`, `PUT`, and `PATCH` requests containing a request body.

### Authorization (Bearer Token)

- **Value:** `Bearer <JWT_ACCESS_TOKEN>`
- **When required:** For all protected endpoints (e.g., fetching profile, updating gates). If missing or invalid, the server returns `401 Unauthorized`.

---

## 5 Standard Response Format

The project enforces a strict, standardized JSON response structure for ALL endpoints. The frontend can rely on this predictable format.

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "key": "value"
  }
}
```

### Validation / Client Error (400)

```json
{
  "success": false,
  "message": "Name and phone are required"
}
```

### Authentication Error (401)

```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Failed to process request",
  "error": "Detailed error string (usually omitted in production)"
}
```

---

## 6 HTTP Status Codes

| Code    | Status                | Explanation                                                                                                                       |
| ------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **200** | OK                    | The request succeeded. Used for `GET`, `PUT`, `PATCH`, and successful logins.                                                     |
| **201** | Created               | A new resource was successfully created (e.g., Registration, Create Gate).                                                        |
| **204** | No Content            | The request succeeded but returns no data (e.g., successful delete, though this project often returns 200 with soft-delete data). |
| **400** | Bad Request           | The client sent invalid data (missing required fields, malformed JSON).                                                           |
| **401** | Unauthorized          | Missing or invalid Authentication token. The client must log in or refresh token.                                                 |
| **403** | Forbidden             | The user is authenticated but lacks permission (e.g., USER trying to access ADMIN route).                                         |
| **404** | Not Found             | The requested resource (User, Gate, Device) does not exist in the database.                                                       |
| **409** | Conflict              | The resource already exists (e.g., registering an existing phone number).                                                         |
| **422** | Unprocessable Entity  | Validation failed on the server side.                                                                                             |
| **429** | Too Many Requests     | Rate limiting (if implemented) exceeded.                                                                                          |
| **500** | Internal Server Error | An unexpected error occurred on the backend (e.g., database connection failure).                                                  |

---

## 7 Authentication Flow

The system uses OTP-based passwordless authentication.

### Flow Diagram

```text
React Native App                  Express Backend                     MongoDB
      |                                 |                                |
      |-- 1. POST /api/auth/login ----->|                                |
      |   (phone number)                |-- Generate OTP                 |
      |                                 |-- Save OTP ------------------->|
      |<-- 2. Success (200 OK) ---------|                                |
      |                                 |                                |
      |-- 3. POST /auth/verify-otp ---->|                                |
      |   (phone + otp)                 |-- Validate OTP against DB ---->|
      |                                 |-- Generate JWT (Access)        |
      |                                 |-- Generate Refresh Token ----->|
      |<-- 4. Success (Tokens) ---------|                                |
      |                                 |                                |
      |-- 5. GET /api/users/profile --->|                                |
      |   (Header: Bearer JWT)          |-- Verify JWT Middleware        |
      |                                 |-- Fetch User ----------------->|
      |<-- 6. Success (User Data) ------|                                |
      |                                 |                                |
      |-- 7. (Token Expires)            |                                |
      |-- 8. GET /api/users/profile --->|                                |
      |<-- 9. 401 Unauthorized ---------|                                |
      |                                 |                                |
      |-- 10. POST /auth/refresh-token->|                                |
      |   (Refresh Token)               |-- Validate Refresh Token ----->|
      |                                 |-- Generate NEW JWT             |
      |<-- 11. Success (New JWT) -------|                                |
```

---

## 8 API Documentation

---

### Authentication APIs

#### 1. Register User

**Purpose:** Creates a new user account in the system.
**Screen Calling API:** Registration / Sign Up Screen
**Who Can Access:** Public
**Method:** `POST`
**URL:** `/api/auth/register`
**Authentication Required:** No

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com",
  "role": "USER"
}
```

**Validation Rules:**

- **Required Fields:** `name`, `phone`
- **Optional Fields:** `email`, `role` (defaults to `USER`)

**Backend Flow:**

- **Controller Used:** `registerUser` in `authController.js`
- **MongoDB Collections Used:** `User`
- **Business Logic:** Checks if a user with the same phone number already exists. If not, inserts a new document into the `User` collection.

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4b1a1",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2026-06-25T08:00:00.000Z"
  }
}
```

**Failure Responses:**

- **400 Bad Request:** Missing `name` or `phone`.
- **400 Bad Request:** User with this phone number already exists.
- **500 Internal Server Error:** Database creation failed.

**Frontend Handling:**

- **Loading State:** Show spinner on register button.
- **Error UI:** Show toast/alert if phone number is duplicate.
- **Navigation after success:** Navigate to Login screen.

**QA Test Cases:**

- _Positive:_ Register with valid name and phone.
- _Negative:_ Register without name.
- _Negative:_ Register with an already existing phone number.

---

#### 2. Login (Send OTP)

**Purpose:** Initiates the login process by generating and storing a short-lived OTP.
**Screen Calling API:** Login Screen
**Who Can Access:** Public
**Method:** `POST`
**URL:** `/api/auth/login`
**Authentication Required:** No

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "phone": "+919876543210"
}
```

**Validation Rules:**

- **Required Fields:** `phone`

**Backend Flow:**

- **Controller Used:** `loginUser` in `authController.js`
- **MongoDB Collections Used:** `User`, `OTP`
- **Business Logic:** Validates the user exists. Generates a random 6-digit OTP. Saves it in the `OTP` collection with a 1-minute expiration TTL.
  _(Developer Note: Real SMS integration like Twilio would occur here)._

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp": "459812"
  }
}
```

**Failure Responses:**

- **400 Bad Request:** Phone number is required.
- **404 Not Found:** User not found (must register first).

**Frontend Handling:**

- **Navigation after success:** Navigate to Verify OTP screen, passing the phone number via route params.

---

#### 3. Verify OTP

**Purpose:** Validates the OTP and returns authentication tokens.
**Screen Calling API:** Verify OTP Screen
**Who Can Access:** Public
**Method:** `POST`
**URL:** `/api/auth/verify-otp`
**Authentication Required:** No

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "phone": "+919876543210",
  "otp": "459812"
}
```

**Validation Rules:**

- **Required Fields:** `phone`, `otp`

**Backend Flow:**

- **Controller Used:** `verifyOTP` in `authController.js`
- **MongoDB Collections Used:** `OTP`, `User`, `RefreshToken`
- **Business Logic:** Finds the active OTP for the phone. Validates it hasn't expired. Marks it verified. Updates user's `lastLoginAt`. Generates a JWT (Access Token) and a secure crypto string (Refresh Token). Saves the Refresh Token to DB.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60d5ec49f1b2c8b1f8e4b1a1",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "USER"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "8f7a2b..."
  }
}
```

**Failure Responses:**

- **400 Bad Request:** Invalid or expired OTP.

**Frontend Handling:**

- **Storage:** Securely store `accessToken` and `refreshToken` in `AsyncStorage` or `SecureStore`.
- **Axios:** Update Axios default `Authorization` header with the new `accessToken`.
- **Navigation after success:** Navigate to the Main App (Dashboard).

---

#### 4. Refresh Token

**Purpose:** Obtain a new Access Token when the old one expires, without asking the user to log in again.
**Screen Calling API:** Global / Axios Interceptor (Invisible to user)
**Who Can Access:** Public (Requires valid refresh token in body)
**Method:** `POST`
**URL:** `/api/auth/refresh-token`
**Authentication Required:** No (Uses Refresh Token)

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "token": "8f7a2b..."
}
```

**Validation Rules:**

- **Required Fields:** `token` (the refresh token string)

**Backend Flow:**

- **Controller Used:** `refreshAccessToken` in `authController.js`
- **MongoDB Collections Used:** `RefreshToken`, `User`
- **Business Logic:** Finds the refresh token in the DB. Ensures it is not revoked and not expired. Generates a NEW JWT Access Token using the populated user data.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJuZXd..."
  }
}
```

**Failure Responses:**

- **401 Unauthorized:** Invalid, expired, or revoked refresh token.

**Frontend Handling:**

- **Axios Interceptor:** When an API returns 401, the interceptor should call this endpoint, save the new `accessToken`, and retry the failed request.
- **Error UI:** If this endpoint fails, the user MUST be forced to the Login screen (session expired).

---

#### 5. Logout

**Purpose:** Invalidates the user's current session by revoking the refresh token.
**Screen Calling API:** Profile / Settings Screen
**Who Can Access:** Authenticated Users
**Method:** `POST`
**URL:** `/api/auth/logout`
**Authentication Required:** Yes

**Headers:**

- `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "token": "8f7a2b..."
}
```

**Validation Rules:**

- **Required Fields:** `token` (the refresh token string)

**Backend Flow:**

- **Controller Used:** `logout` in `authController.js`
- **MongoDB Collections Used:** `RefreshToken`
- **Business Logic:** Finds the exact refresh token belonging to `req.user.id`. Marks it as `revoked: true`.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Frontend Handling:**

- **Storage:** Clear tokens from `AsyncStorage`.
- **Navigation:** Navigate to Login screen.

---

### User APIs

#### 1. Get Current User Profile

**Purpose:** Fetches the logged-in user's profile details.
**Screen Calling API:** Profile Screen, Dashboard
**Who Can Access:** Authenticated Users
**Method:** `GET`
**URL:** `/api/users/profile` (also mapped to `/api/auth/me`)
**Authentication Required:** Yes

**Headers:**

- `Authorization: Bearer <JWT_ACCESS_TOKEN>`

**Backend Flow:**

- **Controller Used:** `getProfile` in `userController.js`
- **MongoDB Collections Used:** `User`
- **Business Logic:** Uses `req.user.id` (extracted from JWT by `authMiddleware`) to fetch the user document.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "_id": "60d5...",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "role": "USER",
    "notificationEnabled": true
  }
}
```

---

#### 2. Update Profile

**Purpose:** Modifies user details like email or name.
**Screen Calling API:** Edit Profile Screen
**Method:** `PATCH`
**URL:** `/api/users/profile`
**Authentication Required:** Yes

**Request Body:**

```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

**Backend Flow:**

- **Controller Used:** `updateProfile` in `userController.js`
- **MongoDB Collections Used:** `User`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated",
  "data": { "..." }
}
```

---

#### 3. Update Favourite Gates

**Purpose:** Allows users to bookmark specific gates for quick access.
**Screen Calling API:** Gate Details Screen (Heart icon)
**Method:** `PUT`
**URL:** `/api/users/favourite-gates`
**Authentication Required:** Yes

**Request Body:**

```json
{
  "gateId": "60d5ec49f1b2c8b1f8e4b2a2",
  "action": "ADD"
}
```

_Note: `action` should be "ADD" or "REMOVE"._

---

#### 4. Notification Settings

**Purpose:** Toggle global push notifications.
**Endpoints:**

- `PATCH /api/users/notifications/enable`
- `PATCH /api/users/notifications/disable`
  **Authentication Required:** Yes
  **Controller:** `enableNotifications`, `disableNotifications` in `userController.js`

---

### Railway Gate APIs

#### 1. Get All Gates

**Method:** `GET`
**URL:** `/api/gates`
**Authentication:** Yes (User/Admin)
**Controller:** `getAllGates` in `railwayGateController.js`
**Success (200):** Returns array of active gates populated with `currentDevice` info.

#### 2. Get Gate By ID

**Method:** `GET`
**URL:** `/api/gates/:id`
**Authentication:** Yes
**Controller:** `getGateById`

#### 3. Get Current Status

**Purpose:** Fetch just the live status and timestamp, optimizing bandwidth for polling.
**Method:** `GET`
**URL:** `/api/gates/:id/current-status`
**Authentication:** Yes
**Success (200):**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "currentStatus": "CLOSED",
    "lastOpenedAt": "2026-06-25T10:05:00Z",
    "lastClosedAt": "2026-06-25T09:58:00Z",
    "lastStatusChangedAt": "2026-06-25T10:05:00Z"
  }
}
```

**Fields Explanation:**

- `lastOpenedAt`: The exact timestamp when the gate was last recorded as OPEN.
- `lastClosedAt`: The exact timestamp when the gate was last recorded as CLOSED.

#### 4. Get Gate History

**Purpose:** Fetch the timeline of when a gate opened and closed.
**Method:** `GET`
**URL:** `/api/gates/:id/history?limit=50`
**Authentication:** Yes
**MongoDB Collection:** `GateEventLog` sorted by `eventTime` descending.
**Success (200):** Returns an array of historical events.

#### 5. Create Gate (Admin Only)

**Method:** `POST`
**URL:** `/api/gates`
**Authentication:** Yes (Requires Admin role)
**Body Requirements:** `gateCode`, `gateName`, `latitude`, `longitude`.

#### 6. Update / Delete Gate (Admin Only)

**Update Method:** `PATCH /api/gates/:id`
**Delete Method:** `DELETE /api/gates/:id` (Performs soft-delete `isActive: false`)

#### 7. Assign ESP32 Device to Gate (Admin Only)

**Method:** `PUT`
**URL:** `/api/gates/:id/assign-device`
**Authentication:** Yes (Admin)
**Request Body:**

```json
{
  "deviceId": "60d5ec49f1b2c8b1f8e4b3a3"
}
```

**Business Logic:** Updates the `currentDevice` on the `RailwayGate` document, AND updates the `railwayGate` reference on the `ESP32Device` document.

#### 8. Manual Override Status (Admin Only)

**Method:** `PATCH`
**URL:** `/api/gates/:id/status`
**Request Body:** `{"status": "OPEN"}`

---

### ESP32 Device APIs (Admin Only)

_All routes in `/api/devices` require the `ADMIN` role._

#### 1. Register Device

**Method:** `POST`
**URL:** `/api/devices`
**Body:** `deviceCode` (Required), `deviceName`, `macAddress`.

#### 2. Get All Devices

**Method:** `GET`
**URL:** `/api/devices`

#### 3. Update Firmware Version

**Method:** `PATCH`
**URL:** `/api/devices/:id/firmware`
**Body:** `{"firmwareVersion": "v2.0.1"}`

#### 4. Device Management

- `PATCH /api/devices/:id/online`
- `PATCH /api/devices/:id/offline`
- `PATCH /api/devices/:id/rssi`
- `PATCH /api/devices/:id/heartbeat`

---

### IoT APIs

These APIs are designed specifically to be consumed by the physical ESP32 Hardware boards.

#### 1. Post Gate Status Event

**Purpose:** Transmits real-time OPEN/CLOSED status changes from the physical hardware to the cloud.
**Screen Calling API:** None (Called by ESP32 C++ Code)
**Who Can Access:** Hardware Devices
**Method:** `POST`
**URL:** `/api/iot/status`
**Authentication Required:** None (Currently open; relies on `deviceCode`. Future enhancement: Hardware API Keys).

**Headers:**

- `Content-Type: application/json`

**Request Body (Hardware Payload):**

```json
{
  "deviceCode": "ESP-9988",
  "status": "CLOSED",
  "sensorType": "REED_SWITCH",
  "source": "HTTP",
  "eventTime": "2026-06-25T10:04:59Z",
  "firmwareVersion": "v1.2.4"
}
```

**Payload Explanation:**

- **deviceCode:** The unique identifier burnt into the ESP32 firmware.
- **status:** Must be exact string `OPEN`, `CLOSED`, or `UNKNOWN`.
- **sensorType:** Indicates hardware trigger. E.g., `REED_SWITCH`, `LIMIT_SWITCH`, or `MANUAL`.
- **source:** Communication protocol used (`HTTP`).

**Backend Flow & MongoDB Impact:**

1. **Validation:** Checks if `deviceCode` exists in `ESP32Device` collection.
2. **Lookup:** Finds the `RailwayGate` assigned to this device.
3. **Gate Update:** Updates `RailwayGate.currentStatus` = `CLOSED` and `RailwayGate.lastStatusChangedAt` = `eventTime`. (1 Document Updated).
4. **Event Logging (Append-Only):** Inserts a BRAND NEW document into `GateEventLog` capturing the exact payload, IP address, and timestamps. (1 Document Created).

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Status event processed successfully",
  "data": {
    "gateStatus": "CLOSED",
    "eventId": "60d5..."
  }
}
```

---

#### 2. Post Device Heartbeat

**Purpose:** Routine health check sent every X minutes by the ESP32 to prove it has network connectivity and power.
**Method:** `POST`
**URL:** `/api/iot/heartbeat`

**Request Body:**

```json
{
  "deviceCode": "ESP-9988",
  "rssi": -65,
  "freeHeap": 150000,
  "uptimeSeconds": 3600,
  "firmwareVersion": "v1.2.4"
}
```

**Backend Flow:**

- Updates the `ESP32Device` document's `onlineStatus` to `true` and `lastHeartbeatAt` to `Date.now()`.
- Inserts a NEW document into the `DeviceHeartbeat` collection for time-series health monitoring.

---

### Notification APIs

#### 1. Get User Notifications

**Method:** `GET`
**URL:** `/api/notifications`
**Authentication:** Yes

#### 2. Get Unread Count

**Method:** `GET`
**URL:** `/api/notifications/unread-count`

#### 3. Mark Notification as Read

**Method:** `PATCH`
**URL:** `/api/notifications/:id/read`

#### 4. Delete Notification

**Method:** `DELETE`
**URL:** `/api/notifications/:id`

---

## 9 Screen-wise Integration

A guide for React Native developers on which APIs to call per screen.

### 1. Splash Screen

- **Logic:** Check `AsyncStorage` for `accessToken` and `refreshToken`.
- **If Tokens exist:** Attempt `GET /api/users/profile`.
  - **Success:** Navigate to **Dashboard**.
  - **401 Error:** Interceptor attempts `POST /api/auth/refresh-token`.
    - **Refresh Success:** Navigate to **Dashboard**.
    - **Refresh Fail:** Navigate to **Login**.
- **If No Tokens:** Navigate to **Login**.

### 2. Login Screen

- **Action:** User enters phone number and taps "Send OTP".
- **API Call:** `POST /api/auth/login`
- **Expected Response:** `200 OK` with OTP.
- **Navigation:** Navigate to **Verify OTP Screen**.

### 3. Verify OTP Screen

- **Action:** User enters 6-digit OTP.
- **API Call:** `POST /api/auth/verify-otp`
- **Expected Response:** `200 OK` with `accessToken`, `refreshToken`, and user object.
- **Redux/Context Update:** Store user data globally.
- **Navigation:** Navigate to **Dashboard**.

### 4. Dashboard (Map / List View)

- **Triggered On:** Screen Mount (`useEffect`).
- **API Call:** `GET /api/gates`
- **Loading State:** Show skeleton loader.
- **Redux/Context:** Populate gates list.

### 5. Gate Details Screen

- **Triggered On:** Screen Mount, and pull-to-refresh.
- **API Calls:**
  1. `GET /api/gates/:id/current-status` (Live polling every 30s)
  2. `GET /api/gates/:id/history` (Initial load for timeline)
- **Action:** Tapping Heart Icon.
- **API Call:** `PUT /api/users/favourite-gates` (Optimistic UI update recommended).

---

## 10 Axios Integration Guide

Create a file named `src/services/api.js` (or similar) in the React Native project.

```javascript
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://your-backend.com/api",
  timeout: 10000,
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle 401 & Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        // Call refresh endpoint
        const res = await axios.post(
          "https://your-backend.com/api/auth/refresh-token",
          {
            token: refreshToken,
          },
        );

        const newAccessToken = res.data.data.accessToken;

        // Save new token
        await AsyncStorage.setItem("accessToken", newAccessToken);

        // Update default headers and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid. Force logout.
        await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
        // TODO: Dispatch global Redux action to navigate to Login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

## 11 Complete REST Flow Diagrams

### Gate Status Flow (IoT to Mobile)

```text
ESP32 Hardware
      |
      |-- 1. POST /api/iot/status ({"status": "CLOSED"})
      |
Express.js Router
      |
iotController.processStatusEvent()
      |
      |-- 2. Find ESP32Device
      |-- 3. Find RailwayGate
      |-- 4. Update RailwayGate {currentStatus: "CLOSED"}
      |-- 5. Insert GateEventLog {status: "CLOSED"}
      |
MongoDB (Saves Data)
      |
Express.js responds 201 Created to ESP32
      |
=============================================
      |
React Native App (Polling / Websocket)
      |
      |-- 6. GET /api/gates/123/current-status
      |
Express.js
      |
railwayGateController.getCurrentStatus()
      |
      |-- 7. Fetch Gate from MongoDB
      |
Express.js responds 200 OK ({"currentStatus": "CLOSED"})
      |
React Native UI updates to Red (Closed State)
```

---

## 12 MongoDB Impact

Understanding how the database mutates during API calls.

### Example: `POST /api/auth/login`

- **Collections Updated:** `OTP`
- **Action:** A new document is created in the `OTP` collection. A TTL index ensures it is deleted automatically after 1 minute.

### Example: `POST /api/auth/verify-otp`

- **Collections Updated:** `OTP`, `User`, `RefreshToken`
- **Action:**
  1. `OTP` document updated (`verified: true`).
  2. `User` document updated (`lastLoginAt` modified).
  3. `RefreshToken` document inserted (New session created).

### Example: `POST /api/iot/status`

- **Collections Updated:** `RailwayGate`, `GateEventLog`
- **Action:**
  1. `RailwayGate` document updated (Fields modified: `currentStatus`, `lastStatusChangedAt`).
  2. `GateEventLog` document inserted (New historical record created).

---

## 13 Error Reference

### Common Error JSON

```json
{
  "success": false,
  "message": "Human readable error message"
}
```

### Handling Strategies

- **400 Bad Request:** Form validation failed. Display `error.response.data.message` under the relevant UI input fields or in a Toast.
- **401 Unauthorized:** Handled globally by Axios interceptor (attempt refresh, else redirect to Login). Do not handle at the component level.
- **404 Not Found:** Display Empty State UI (e.g., "Gate not found" illustration).
- **500 Internal Server Error:** Display "Something went wrong. Please try again later." Do not expose raw server errors to the user.

---

## 14 Security

1. **JWT (JSON Web Tokens):** Used for stateless, fast API authorization. Signed with a secure `JWT_SECRET`.
2. **Refresh Tokens:** Long-lived tokens stored in the database. Allows for session invalidation (revocation) from the server side.
3. **OTP:** Passwords are not used, mitigating brute-force dictionary attacks on user accounts. OTPs expire strictly after 1 minute.
4. **RBAC:** Admin endpoints explicitly verify the user's role via `adminMiddleware`. A standard user token cannot access `/api/gates (POST)`.
5. **No Database History Mutation:** `GateEventLog` and `DeviceHeartbeat` are append-only. Past hardware events cannot be altered, ensuring a cryptographically sound audit trail if investigated post-accident.

---

## 15 QA Testing Guide

### Endpoint: `POST /api/auth/register`

- **Positive Test:** Send valid `name` and `phone`. Expect 201. Verify user created in DB.
- **Negative Test (Missing Field):** Omit `phone`. Expect 400.
- **Negative Test (Duplicate):** Send phone number of already registered user. Expect 400.

### Endpoint: `POST /api/iot/status`

- **Positive Test:** Send valid `deviceCode` and `status: "CLOSED"`. Expect 201. Check `RailwayGate` document is updated. Check `GateEventLog` has new document.
- **Negative Test (Invalid Status):** Send `status: "PARTIAL"`. Expect 400 (Validation rule failure).
- **Negative Test (Unassigned Device):** Send `deviceCode` of a device not linked to any gate. Expect 400.

---

## 16 Postman Guide

1. **Import:** Import `postman_collection.json` located in the `/server` directory into Postman.
2. **Environment Variables:** Set up a Postman Environment with:
   - `BASE_URL`: `http://localhost:5000/api`
   - `ACCESS_TOKEN`: (leave blank initially)
   - `REFRESH_TOKEN`: (leave blank initially)
3. **Automated Tokens:** The collection is configured to automatically parse the `verify-otp` response and set the `ACCESS_TOKEN` variable globally, applying it to all protected routes.

---

## 17 Thunder Client Guide

If using VS Code Thunder Client:

1. Create a New Environment named `Railway-IoT-Local`.
2. Add `BASE_URL` variable.
3. Use the `Tests` tab on the Login/Verify requests to extract `json.data.accessToken` and set it as an environment variable using `tc.setVar("ACCESS_TOKEN", token)`.

---

## 18 Frontend Checklist

React Native developers must ensure the following are complete before marking integration as done:

- [ ] **Axios Instance Configured:** Custom instance created with Base URL.
- [ ] **Token Storage:** Access and Refresh tokens securely saved using `AsyncStorage`.
- [ ] **Auth Interceptor:** `Authorization: Bearer` header automatically injected.
- [ ] **Refresh Interceptor:** 401 errors automatically trigger a silent refresh-token call.
- [ ] **Logout Handling:** App clears storage and routes to Login when refresh token expires.
- [ ] **Error UI:** Global Toast/Alert system connected to Axios response errors for 400/500 codes.
- [ ] **Loading States:** UI blocked or spinners shown during asynchronous POST/PUT calls.
- [ ] **Optimistic Updates:** UI responds instantly for toggle actions (like Favourite Gates) before API returns success.

---

_End of Documentation_
