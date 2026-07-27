# IoT Hardware Flow (ESP32)

This document dictates how the C++ firmware behaves.

## 1. Network Setup
The ESP32 connects to WiFi using `WiFi.h` and includes `HTTPClient.h`.

## 2. Pushing State Changes
When the hardware Reed Switch triggers (magnet separates or joins), the ESP32 must instantly send an HTTP POST:

```http
POST /api/iot/status
Content-Type: application/json

{
  "deviceCode": "ESP001",
  "status": "OPEN",
  "sensorType": "REED_SWITCH",
  "source": "HTTP"
}
```
**Backend Action:** Finds the gate linked to `ESP001`, updates `RailwayGate.currentStatus = OPEN`, and creates a `GateEventLog`.

## 3. Heartbeats
Every 60 seconds, on a non-blocking `millis()` timer, the ESP32 must ping the server:

```http
POST /api/iot/heartbeat
Content-Type: application/json

{
  "deviceCode": "ESP001",
  "rssi": -65,
  "freeHeap": 240000,
  "uptimeSeconds": 3600
}
```
**Backend Action:** Updates `ESP32Device.lastSeen` to the current timestamp. A future cron-job will mark devices `OFFLINE` if `lastSeen` is older than 5 minutes.
