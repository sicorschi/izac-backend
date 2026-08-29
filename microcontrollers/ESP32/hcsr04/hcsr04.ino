#include <PubSubClient.h>
#include "WiFi.h"

//define sound speed in cm/uS
#define SOUND_SPEED 0.034

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
long lastSensorMsg = 0;
char msg[50];
int value = 0;
const char* ssid = "";
const char* password = "";
const char* mqtt_server = "192.168.0.50";
long duration;
float distanceCm;
const int trigPin = 13;
const int echoPin = 12;
const char* status_topic = "izac/devices/esp32/hcsr04/1/status";
const char* distance_topic = "izac/devices/esp32/hcsr04/1/distance";

void reconnect() {
  // Loop until reconnected
  while (!client.connected()) {
    Serial.println("[MQTT] Attempting MQTT connection...");
    // Create unique client ID using MAC address
    String clientId = "ESP32_HCSR04_1_" + WiFi.macAddress();
    clientId.replace(":", "");
    Serial.print("[MQTT] Client ID: ");
    Serial.println(clientId);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("[MQTT] Connected successfully!");
      // Publish connection status and initial state
      client.publish(status_topic, "Connected");  
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
  pinMode(echoPin, INPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
  Serial.println(WiFi.localIP());
  client.setServer(mqtt_server, 1883);
}

void loop() {
  // MQTT connection management
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  // Read presence detection sensor
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * SOUND_SPEED/2;
  // Print sensor readings with proper formatting
  Serial.println("=====================================");
  Serial.println("[SENSORS] Current Readings:");
  Serial.print("[SENSORS]   Presence Detection: ");
  Serial.print(distanceCm, 2);
  Serial.println(" cm");
  // Publish regular status updates every 5 seconds
  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    // Publish distance readings
    char distanceMsg[10];
    dtostrf(distanceCm, 1, 2, distanceMsg);
    client.publish(distance_topic, distanceMsg);
  }
  delay(1000); // Reduced delay for more responsive detection
}
