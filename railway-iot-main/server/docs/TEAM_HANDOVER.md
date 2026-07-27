# Team Handover & Onboarding Guide

Welcome to the Railway Gate IoT Monitoring project! This document explains the high-level architecture so you can understand *why* things are built this way.

## 1. Project Overview
We are building a Live Monitoring System. Passengers can view if a railway gate is OPEN or CLOSED on their mobile app, while the railway admin provisions the hardware.

## 2. Core Architecture
- **ESP32 (C++)**: Sitting at the physical gate. Reads a magnetic reed switch. Pushes HTTP `POST /api/iot/status` over WiFi.
- **Node.js (Express)**: The brain. Validates the ESP32 traffic, logs it to MongoDB, and serves it to users.
- **MongoDB**: Stores the state.
- **React Native**: The passenger's viewport.

## 3. How Roles Work
We use **Role-Based Access Control (RBAC)** baked into the JSON Web Token (JWT).
- `USER`: The default. Can only view statuses and their own profile.
- `ADMIN`: Railway officials. Can create Gates and register ESP32 devices.
The Express middleware `adminMiddleware.js` automatically rejects `USER` tokens trying to hit Admin routes with a `403 Forbidden` error.

## 4. How IoT Works (Important)
ESP32 devices are tiny microcontrollers. They do **not** use JWTs or OTP logins.
Instead, they authenticate using a pre-burned string called the `deviceCode` (e.g. `ESP001`).
They ping two public endpoints:
- `/api/iot/status`: When the gate physically opens or closes.
- `/api/iot/heartbeat`: Every 60 seconds to prove they haven't lost WiFi.

## 5. Common Errors You Will Face
- **"401 Unauthorized"**: Your React Native app forgot to attach the `Authorization: Bearer <token>` header, or the token expired. Call `/api/auth/refresh`.
- **"403 Forbidden"**: You used a normal passenger's token to try and create a gate.
- **"400 Bad Request"**: You missed a required field in your JSON body. Read `API_DOCUMENTATION.md`.
