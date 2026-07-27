# Database Schema Overview

We use **MongoDB** (NoSQL) with **Mongoose**. 

## Collections
### 1. User
Stores passengers and admins.
- Fields: `phone`, `name`, `role` (`USER` | `ADMIN`), `favouriteGates` (Array of ObjectIds).
- Indexes: `phone` (Unique).

### 2. RailwayGate
The physical location.
- Fields: `gateCode`, `gateName`, `latitude`, `longitude`, `currentStatus` (`OPEN` | `CLOSED`), `currentDevice` (ObjectId).
- Relationships: Links to an `ESP32Device`.

### 3. ESP32Device
The hardware microchip.
- Fields: `deviceCode` (Unique), `macAddress`, `firmwareVersion`, `onlineStatus` (`ONLINE` | `OFFLINE`), `lastSeen` (Timestamp).

### 4. GateEventLog
The history ledger. Every time a gate opens or closes, a new document is inserted here.
- Fields: `railwayGate` (ObjectId), `device` (ObjectId), `status`, `eventTime`.

### 5. DeviceHeartbeat
The health log. Tracks ESP32 uptime and WiFi signal strength (`rssi`).

## Relationship Diagram
```text
User
    │
    └── Favourite Gates
               │
               ▼
         RailwayGate  ◄──────┐
               │             │ (Assigned)
               ▼             │
         ESP32Device ────────┘
               │
               ▼
        GateEventLog (History)
```
