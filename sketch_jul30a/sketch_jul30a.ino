/**
 * @file RailwayGateMonitor.ino
 * @brief Production-ready ESP32 Firmware for Railway Gate Monitoring
 * * Design Decisions & Architecture:
 * - FreeRTOS Queue: Used to securely store events offline without losing data during WiFi drops.
 * - NTP Time Sync: Ensures all events have true chronological context via ISO8601.
 * - WiFiClientSecure (setInsecure): Bypasses strict CA validation for MVP to prevent 
 * bricking if Render's Let's Encrypt certificates rotate. 
 * - Two-Stage Filtering: 100ms debounce protects against electrical noise; 1s stability 
 * protects against physical gate vibrations/hesitations.
 * - StaticJsonDocument: Pre-allocates memory on the stack to prevent heap fragmentation, 
 * crucial for long-term embedded uptime.
 * - Exponential Backoff: Prevents network flooding and IP blacklisting during server outages.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Ensure v6.x or adapt if using v7.x
#include <time.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

// Network
const char* WIFI_SSID           = "Mugund";
const char* WIFI_PASSWORD       = "12345678900";

// Device Identity
const char* DEVICE_CODE         = "ESP001";
const char* FIRMWARE_VERSION    = "v1.0.0";
const char* SENSOR_TYPE         = "IR_SENSOR";

// API Endpoints
const char* API_STATUS_URL      = "https://railway-iot-testing-2soh.onrender.com/api/iot/status";
const char* API_HEARTBEAT_URL   = "https://railway-iot-testing-2soh.onrender.com/api/iot/heartbeat";

// Hardware Pins
const int SENSOR_PIN            = 4; 

// Timing & Filtering (in milliseconds)
const unsigned long DEBOUNCE_DELAY_MS   = 50;
const unsigned long STABILITY_DELAY_MS  = 200;
const unsigned long HEARTBEAT_INTERVAL  = 60000;
const unsigned long NTP_TIMEOUT_MS      = 15000;

// Retry Settings
const int MAX_RETRIES           = 3;
const int QUEUE_SIZE            = 20; // Holds up to 20 offline events

// NTP Settings
const char* NTP_SERVER          = "pool.ntp.org";
const long  GMT_OFFSET_SEC      = 0;  // Store UTC
const int   DAYLIGHT_OFFSET_SEC = 0;

// ==========================================
// STATE & TYPES
// ==========================================

enum GateState {
    GATE_UNKNOWN,
    GATE_OPEN,
    GATE_CLOSED
};

struct GateEvent {
    GateState state;
    char timestamp[25]; // ISO8601 size: "2026-07-03T14:13:21Z" + null
};

// Global State Variables
GateState rawState          = GATE_UNKNOWN;
GateState debouncedState    = GATE_UNKNOWN;
GateState stableState       = GATE_UNKNOWN;
GateState publishedState    = GATE_UNKNOWN;

unsigned long lastDebounceTime  = 0;
unsigned long lastStableTime    = 0;
unsigned long lastHeartbeatTime = 0;

// FreeRTOS Queue Handle
QueueHandle_t eventQueue;

// ==========================================
// FUNCTION PROTOTYPES
// ==========================================
void connectWiFi();
void syncNTPTime();
void getISO8601Time(char* buffer, size_t maxLen);
GateState readSensorRaw();
void processStateMachine();
void queueEvent(GateState state);
void sendQueuedEvents();
bool postEventToBackend(const GateEvent& event);
void sendHeartbeat();
void printDiagnostics();
const char* stateToString(GateState state);

// ==========================================
// SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    while (!Serial) { delay(10); }
    
    Serial.println(F("\n--- Railway Gate Monitor Booting ---"));
    Serial.printf("Firmware: %s | Device: %s\n", FIRMWARE_VERSION, DEVICE_CODE);

    // Initialize Hardware
    pinMode(SENSOR_PIN, INPUT_PULLUP); // Using internal pullup as a fail-safe

    // Initialize Event Queue
    eventQueue = xQueueCreate(QUEUE_SIZE, sizeof(GateEvent));
    if (eventQueue == NULL) {
        Serial.println(F("FATAL: Failed to create FreeRTOS Queue."));
        while (true) { delay(1000); } // Halt execution
    }

    // Network & Time
    connectWiFi();
    syncNTPTime();

    // Initial Sensor Reading
    // Block briefly to establish stable initial state
    Serial.println(F("Evaluating initial sensor state..."));
    unsigned long startEval = millis();
    while (millis() - startEval < (DEBOUNCE_DELAY_MS + STABILITY_DELAY_MS + 100)) {
        processStateMachine();
        delay(10);
    }
    
    if (publishedState != GATE_UNKNOWN) {
        Serial.printf("Initial state determined: %s\n", stateToString(publishedState));
    } else {
        Serial.println(F("Warning: Could not determine initial state. Waiting for changes."));
    }
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
    // 1. Maintain WiFi Connection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println(F("WiFi Lost. Reconnecting..."));
        connectWiFi();
    }

    // 2. Read and Filter Sensor State
    processStateMachine();

    // 3. Process Pending Offline Queue (only if connected)
    if (WiFi.status() == WL_CONNECTED && uxQueueMessagesWaiting(eventQueue) > 0) {
        sendQueuedEvents();
    }

    // 4. Handle Heartbeat
    if (millis() - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
        lastHeartbeatTime = millis();
        if (WiFi.status() == WL_CONNECTED) {
            sendHeartbeat();
            printDiagnostics();
        }
    }

    // Yield to RTOS to prevent Watchdog Timer (WDT) resets
    vTaskDelay(10 / portTICK_PERIOD_MS);
}

// ==========================================
// SYSTEM FUNCTIONS
// ==========================================

void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.printf("Connecting to WiFi SSID: %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long startAttempt = millis();
    // Block up to 10 seconds for connection
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
        Serial.print(".");
        delay(500);
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(F("\nWiFi Connected."));
        Serial.print(F("IP Address: "));
        Serial.println(WiFi.localIP());
    } else {
        Serial.println(F("\nWiFi Connection Failed. Will retry next loop."));
    }
}

void syncNTPTime() {
    Serial.println(F("Synchronizing time via NTP..."));
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    
    time_t now = time(nullptr);
    unsigned long startWait = millis();
    
    // Time before year 2000 is invalid (Epoch 0 = 1970)
    while (now < 946684800 && (millis() - startWait < NTP_TIMEOUT_MS)) {
        delay(500);
        Serial.print(".");
        now = time(nullptr);
    }
    
    if (now > 946684800) {
        Serial.println(F("\nTime synchronized."));
    } else {
        Serial.println(F("\nNTP Sync failed. Timestamps will be incorrect until next sync."));
    }
}

void getISO8601Time(char* buffer, size_t maxLen) {
    time_t now;
    struct tm timeinfo;
    time(&now);
    gmtime_r(&now, &timeinfo);
    // Format: YYYY-MM-DDTHH:MM:SSZ
    strftime(buffer, maxLen, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
}

// ==========================================
// SENSOR & STATE LOGIC
// ==========================================

GateState readSensorRaw() {

    int sensor = digitalRead(SENSOR_PIN);

    Serial.print("IR Sensor Value: ");
    Serial.println(sensor);

    if (sensor == LOW) {
        return GATE_CLOSED;   // Hand detected
    } else {
        return GATE_OPEN;     // No hand
    }
}

void processStateMachine() {
    GateState currentRaw = readSensorRaw();

    // Stage 1: Debounce (100ms)
    // Ignore mechanical switch bouncing or RF noise
    if (currentRaw != rawState) {
        lastDebounceTime = millis();
        rawState = currentRaw;
    }

    if ((millis() - lastDebounceTime) >= DEBOUNCE_DELAY_MS) {
        // State is electrically stable
        if (rawState != debouncedState) {
            debouncedState = rawState;
            lastStableTime = millis(); // Reset stability timer
        }

        // Stage 2: Physical Stability (1000ms)
        // Ensure the gate is actually resting, not just shuddering mid-movement
        if ((millis() - lastStableTime) >= STABILITY_DELAY_MS) {
            if (debouncedState != stableState) {
                stableState = debouncedState;
                
                // Compare with published state to prevent duplicate HTTP POSTs
                if (stableState != publishedState) {
                    publishedState = stableState;
                    Serial.printf("State Stable & Changed to: %s\n", stateToString(publishedState));
                    queueEvent(publishedState);
                }
            }
        }
    }
}

void queueEvent(GateState state) {
    GateEvent newEvent;
    newEvent.state = state;
    getISO8601Time(newEvent.timestamp, sizeof(newEvent.timestamp));

    // Try to send to queue. If full, it drops the oldest to prevent memory crash,
    // though in standard implementations we just drop the newest. 
    // Here we drop the newest if full, prioritizing existing un-sent data.
    if (xQueueSend(eventQueue, &newEvent, (TickType_t)0) == pdPASS) {
        Serial.printf("Event queued. Total in queue: %d\n", uxQueueMessagesWaiting(eventQueue));
    } else {
        Serial.println(F("ERROR: Queue is full. Event dropped."));
    }
}

// ==========================================
// HTTP & BACKEND INTEGRATION
// ==========================================

void sendQueuedEvents() {
    GateEvent pendingEvent;
    
    // Peek at the first item. We only remove it if successful.
    if (xQueuePeek(eventQueue, &pendingEvent, (TickType_t)0) == pdPASS) {
        Serial.println(F("Processing queued event..."));
        
        bool success = false;
        int backoffDelay = 1000; // Start with 1 second

        // Exponential backoff retry loop
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            Serial.printf("POST Attempt %d/%d\n", attempt, MAX_RETRIES);
            
            if (postEventToBackend(pendingEvent)) {
                success = true;
                break;
            }
            
            if (attempt < MAX_RETRIES) {
                Serial.printf("Retry in %d ms...\n", backoffDelay);
                delay(backoffDelay); // Blocking delay is acceptable here to restrict network flooding
                backoffDelay *= 2;   // 1s, 2s, 4s
            }
        }

        if (success) {
            // Remove from queue since it was successfully sent
            xQueueReceive(eventQueue, &pendingEvent, (TickType_t)0);
            Serial.println(F("Event sent successfully and removed from queue."));
        } else {
            // Leave in queue, abort queue processing for now to allow normal loop execution.
            // Will try again next loop cycle.
            Serial.println(F("All retries failed. Event kept in queue for later."));
        }
    }
}

bool postEventToBackend(const GateEvent& event) {
    WiFiClientSecure client;
    // MVP design decision: Ignore cert validation to prevent firmware breaking 
    // when Render's auto-provisioned SSL cert rotates.
    client.setInsecure(); 

    HTTPClient http;
    http.begin(client, API_STATUS_URL);
    http.addHeader("Content-Type", "application/json");

    // Memory design decision: Using StaticJsonDocument prevents heap fragmentation
    StaticJsonDocument<256> doc;
    doc["deviceCode"] = DEVICE_CODE;
    doc["status"] = stateToString(event.state);
    doc["sensorType"] = SENSOR_TYPE;
    doc["source"] = "HTTP";
    doc["eventTime"] = event.timestamp;
    doc["firmwareVersion"] = FIRMWARE_VERSION;

    String payload;
    serializeJson(doc, payload);
    
    Serial.print(F("Payload: "));
    Serial.println(payload);

    int httpCode = http.POST(payload);
    
    Serial.printf("HTTP Code: %d\n", httpCode);
    
    bool result = false;
    if (httpCode > 0) {
        String response = http.getString();
        Serial.print(F("Server Response: "));
        Serial.println(response);
        
        // 200 OK or 201 Created indicate success
        if (httpCode == 200 || httpCode == 201) {
            result = true;
        }
    } else {
        Serial.printf("HTTP POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
    return result;
}

void sendHeartbeat() {
    Serial.println(F("Sending Heartbeat..."));
    
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    http.begin(client, API_HEARTBEAT_URL);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["deviceCode"] = DEVICE_CODE;
    doc["rssi"] = WiFi.RSSI();
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["uptime"] = millis() / 1000;
    doc["firmwareVersion"] = FIRMWARE_VERSION;

    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);
    
    if (httpCode > 0) {
        Serial.printf("Heartbeat Success. Code: %d\n", httpCode);
    } else {
        Serial.printf("Heartbeat Failed. Error: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
}

// ==========================================
// UTILITIES
// ==========================================

void printDiagnostics() {
    Serial.println(F("--- Diagnostics ---"));
    Serial.printf("Current RSSI: %d dBm\n", WiFi.RSSI());
    Serial.printf("Current Heap: %u bytes\n", ESP.getFreeHeap());
    Serial.printf("Current Uptime: %lu seconds\n", millis() / 1000);
    Serial.printf("Queue Count: %d\n", uxQueueMessagesWaiting(eventQueue));
    Serial.println(F("-------------------"));
}

const char* stateToString(GateState state) {
    switch (state) {
        case GATE_OPEN: return "OPEN";
        case GATE_CLOSED: return "CLOSED";
        default: return "UNKNOWN";
    }
}