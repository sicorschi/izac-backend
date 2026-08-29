#include "WiFi.h"
#include <PubSubClient.h>
#include <Wire.h>

#define RELAY_NO false
#define NUM_RELAYS  1

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;
const char* ssid = "";
const char* password = "";
const char* mqtt_server = "192.168.0.50";
const int relay = 13;
const char* status_topic = "izac/devices/esp32.1/light/1/status";
const char* status_output_topic = "izac/devices/esp32.1/light/1/output";
const char* status_connection_topic = "izac/devices/esp32.1/light/1/connection";

// Variables for automatic light control
bool lightsOn = false;

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
  if (String(topic) == status_output_topic) {
    Serial.print("[MQTT] Processing light control command: ");
    Serial.println(messageTemp);
    if(messageTemp == "on"){
      Serial.println("[MQTT] Turning lights ON via MQTT");
      digitalWrite(relay, HIGH);
      lightsOn = true;
      client.publish(status_topic, "1");
    }
    else if(messageTemp == "off"){
      Serial.println("[MQTT] Turning lights OFF via MQTT");
      digitalWrite(relay, LOW);
      lightsOn = false;
      client.publish(status_topic, "0");
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

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.println("[MQTT] Attempting MQTT connection...");
    // Create unique client ID using MAC address
    String clientId = "ESP32Light_01_" + WiFi.macAddress();
    clientId.replace(":", "");
    Serial.print("[MQTT] Client ID: ");
    Serial.println(clientId);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("[MQTT] Connected successfully!");
      // Subscribe to control topic
      Serial.print("[MQTT] Subscribing to topic: ");
      Serial.println(status_output_topic);
      if (client.subscribe(status_output_topic)) {
        Serial.println("SUCCESS");
      } else {
        Serial.println("FAILED");
      }
      // Publish connection status
      client.publish(status_connection_topic, "Connected");
      client.publish(status_topic, lightsOn ? "1" : "0");
      Serial.println("[MQTT] Ready to receive commands on: ");
      Serial.println(status_output_topic);
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
  pinMode(relay, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
  Serial.println(WiFi.localIP());
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {  
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
    char relayString[8];
    dtostrf(relayValue, 1, 0, relayString);
    client.publish(status_topic, relayString);
  }
  delay(200);
}
