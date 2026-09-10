#include "WiFi.h"
#include <PubSubClient.h>
#include <Wire.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

//define sound speed in cm/uS
#define SOUND_SPEED 0.034
//define the relay module
#define RELAY_NO false
#define NUM_RELAYS  1

//set up the wifi client and the MQTT client
WiFiClient espClient;
PubSubClient client(espClient);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

long lastMsg = 0;
char msg[50];
int value = 0;
const char* ssid = "";
const char* password = "";
const char* mqttServer = "";
long duration;
float distanceCm;
const int trigPin = 2;
const int echoPin = 15;
const int relay = 13;
const char* lightOutputTopic = "izac/devices/esp32/1/light/1/output";
const char* lightStatusTopic = "izac/devices/esp32/1/light/1/status";
const char* deviceName = "esp32_1_light_1";
// Variables for automatic light control
bool presenceDetected = false;
bool lightsOn = false;
unsigned long lastPresenceTime = 0;
const unsigned long lightOffDelay = 25000; // 25 seconds
const int presenceDistance = 50;
const char* deviceClientId = "ESP32_01_Light_01_";

String getIsoTimestamp() {
  if (!timeClient.isTimeSet()) {
    Serial.println("[NTP] Time not set yet");
    if (!timeClient.update()) {
      Serial.println("[NTP] update() failed");
      return String(""); // better than millis() for a missing timestamp
    }
  }

  time_t now = timeClient.getEpochTime();
  if (now <= 0) {
    Serial.println("[NTP] invalid epoch time");
    return String(""); // or fallback to millis() only if you truly want a numeric fallback
  }

  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
  return String(buffer);
}

String getMemorySummary() {
  uint32_t freeHeap = ESP.getFreeHeap();
  uint32_t totalHeap = ESP.getHeapSize();
  float usedPercent = ((float)(totalHeap - freeHeap) / totalHeap) * 100.0f;
  return String(usedPercent, 1) + "% used | " +
         String(freeHeap / 1024.0, 1) + " KB free | " +
         String(totalHeap / 1024.0, 1) + " KB total";
}

String buildLightStatusPayload(String value) {
  String payload = "{";
  payload += "\"deviceName\":\"" + String(deviceName) + "\",";
  payload += "\"value\":\"" + value + "\",";
  payload += "\"status\":\"online\",";
  payload += "\"location\":\"Kitchen\",";
  payload += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  payload += "\"uptime\":\"" + String(millis() / 1000) + "\",";
  payload += "\"memory\":\"" + getMemorySummary() + "\",";
  payload += "\"timestamp\":\"" + getIsoTimestamp() + "\"";
  payload += "}";
  return payload;
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("[MQTT] Message arrived on topic: '");
  Serial.print(topic);
  Serial.print("' with message: '");
  String messageTemp;
  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.print("' (length: ");
  Serial.print(length);
  Serial.println(")");
  // Convert message to lowercase for case-insensitive comparison
  messageTemp.toLowerCase();
  if (String(topic) == lightOutputTopic) {
    Serial.print("[MQTT] Processing light control command: ");
    Serial.println(messageTemp);
    if(messageTemp == "on"){
      Serial.println("[MQTT] Turning lights ON via MQTT");
      digitalWrite(relay, HIGH);
      lightsOn = true;
      lastPresenceTime = millis(); // Reset timer when manually turned on
      publishLightStatus("on");
    }
    else if(messageTemp == "off"){
      Serial.println("[MQTT] Turning lights OFF via MQTT");
      digitalWrite(relay, LOW);
      lightsOn = false;
      publishLightStatus("off");
    }
    else {
      Serial.print("[MQTT] Unknown command: '");
      Serial.print(messageTemp);
      Serial.println("'. Expected 'on' or 'off'");
    }
  } else {
    Serial.print("[MQTT] Ignored message on unexpected topic: ");
    Serial.println(topic);
  }
}

void turnOnLights() {
  if (!lightsOn) {
    digitalWrite(relay, HIGH);
    lightsOn = true;
    Serial.println("Lights turned ON automatically!");
    publishLightStatus(lightsOn ? "on" : "off");
  }
}

void publishLightStatus(String value) {
  String payload = buildLightStatusPayload(value);
  Serial.print("[MQTT] Publishing status: ");
  Serial.println(payload);
  bool ok = client.publish(lightStatusTopic, payload.c_str());
  Serial.print("[MQTT] Publish result: ");
  Serial.println(ok ? "SUCCESS" : "FAILED");
  Serial.print("[MQTT] Connection state: ");
  Serial.println(client.state());
}

void turnOffLights() {
  digitalWrite(relay, LOW);
  lightsOn = false;
  Serial.println("Lights turned OFF automatically - No presence for 15 seconds");
  publishLightStatus(lightsOn ? "on" : "off");
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.println("[MQTT] Attempting MQTT connection...");
    // Create unique client ID using MAC address
    String clientId = deviceClientId + WiFi.macAddress();
    clientId.replace(":", "");
    Serial.print("[MQTT] Client ID: ");
    Serial.println(clientId);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("[MQTT] Connected successfully!");
      // Subscribe to control topic
      Serial.print("[MQTT] Subscribing to topic:");
      Serial.print(lightOutputTopic);
      if (client.subscribe(lightOutputTopic)) {
        Serial.println("SUCCESS");
      } else {
        Serial.println("FAILED");
      }
      // Publish connection status
      publishLightStatus("Connected");
      publishLightStatus(lightsOn ? "on" : "off");
      Serial.println("[MQTT] Ready to receive commands on");
      Serial.println(lightOutputTopic);
      Serial.println("[MQTT] Send 'on' or 'off' to control lights");
    } else {
      Serial.print("[MQTT] Connection failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(relay, OUTPUT);
  pinMode(echoPin, INPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
  Serial.println(WiFi.localIP());
  client.setServer(mqttServer, 1883);
  client.setCallback(callback);
  timeClient.begin();
  timeClient.setTimeOffset(0);
  Serial.println("Waiting for NTP time...");
  while (!timeClient.update()) {
    delay(1000);
  }
}

void loop() {
  // Read ultrasonic sensor
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * SOUND_SPEED/2;
  
  // Check for presence detection (within 40cm)
  if (distanceCm < presenceDistance && distanceCm > 0) {
    if (!presenceDetected) {
      presenceDetected = true;
      Serial.println("Presence detected!");
    }
    lastPresenceTime = millis(); // Update last presence time
    turnOnLights(); // Turn on lights immediately
  } else {
    presenceDetected = false;
  }
  
  // Check if lights should be turned off due to no presence
  unsigned long currentTime = millis();
  if (lightsOn && !presenceDetected && (currentTime - lastPresenceTime > lightOffDelay)) {
    turnOffLights();
  }
  
  // MQTT connection management
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publish status updates every 5 seconds
  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    // Publish relay status
    int relayValue = digitalRead(relay);
    String value = relayValue ? "on" : "off";
    publishLightStatus(value);
  }
  delay(200); // Reduced delay for more responsive detection
}