# Railway Gate Live Monitoring - Backend API

This is the Node.js Express Backend for the Smart Railway Gate IoT System.

## 1. Project Overview
This server acts as the central hub. It receives hardware signals (OPEN/CLOSED) from ESP32 sensors at railway gates, logs them in MongoDB, and serves that live status to the passenger-facing React Native mobile app.

## 2. Tech Stack
- **Node.js + Express.js**
- **MongoDB Atlas + Mongoose**
- **JWT (OTP Based Auth)**
- **Security:** Helmet, Compression, Express Rate Limit

## 3. Folder Structure
- `config/` - Database connection
- `controllers/` - Business logic
- `models/` - Mongoose Schemas
- `routes/` - API endpoints
- `docs/` - Advanced Documentation (Read these!)

## 4. Installation
```bash
git clone <repository-url>
cd server
npm install
```

## 5. Environment Variables
Copy the `.env.example` file and create a `.env` file in the root of `server/`.
```bash
cp .env.example .env
```
Ensure you add a valid `MONGO_URI`.

## 6. Seed Database (Crucial First Step)
Before starting the server, you **must** seed the database to create the default Admin and mock IoT gates.
```bash
npm run seed
```

## 7. Start Server
To run the server with hot-reloading:
```bash
npm run dev
```

## 8. Documentation Links
For React Native Developers:
1. ⭐ [API Documentation](./API_DOCUMENTATION.md)
2. ⭐ [Frontend Integration Guide](./docs/FRONTEND_INTEGRATION.md)
3. [Authentication Flow](./docs/AUTHENTICATION_FLOW.md)

For Architecture & General Team:
1. [Team Handover](./docs/TEAM_HANDOVER.md)
2. [Database Schema](./docs/DATABASE_SCHEMA.md)
3. [IoT Hardware Flow](./docs/IOT_FLOW.md)
