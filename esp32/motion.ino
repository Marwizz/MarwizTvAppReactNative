#include <WiFi.h>
#include <WebSocketsServer.h>

#define timeSeconds 0.5
const int motionSensor = 13;  // GPIO Pin for motion sensor
boolean motion = false;
unsigned long motionStartTime = 0;

// Hardcoded WiFi credentials
const char* ssid = "";
const char* password = "";

WebSocketsServer webSocket(81); // WebSocket Server on port 81

// Function to send motion data over WebSocket
void sendMotionData() {
  String data = "{ \"motion\": " + String(motion ? "1" : "0") + " }";
  webSocket.broadcastTXT(data); // Send data to all connected clients
}

// WebSocket event handler
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("Client connected");
      break;
    case WStype_DISCONNECTED:
      Serial.println("Client disconnected");
      break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(motionSensor, INPUT);

  // Connect to WiFi
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi!");
  Serial.print("WebSocket Server Address: ");
  Serial.println(WiFi.localIP());

  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop(); // Handle WebSocket clients

  int motionDetected = digitalRead(motionSensor);

  if (motionDetected == HIGH) {
    if (!motion) {
      motionStartTime = millis();
      motion = true;
    }
    
    if (millis() - motionStartTime > (timeSeconds * 1000)) {
      Serial.println("MOTION DETECTED!");
      sendMotionData();
      motion = false;
    }
  } else {
    motion = false;
  }

  delay(100);
}
