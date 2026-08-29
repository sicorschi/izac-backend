#include "DHT.h"
#include <WiFi.h>
extern "C" {
  #include "freertos/FreeRTOS.h"
  #include "freertos/timers.h"
}
#include <AsyncMqttClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

#define WIFI_SSID ""
#define WIFI_PASSWORD ""
// Raspberry Pi Mosquitto MQTT Broker
#define MQTT_HOST IPAddress(192, 168, 0, 50)
#define MQTT_PORT 1883
// Digital pin connected to the DHT sensor
#define DHTPIN 4  
#define DHTTYPE DHT11   // DHT 11
//#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
//#define DHTTYPE DHT21   // DHT 21 (AM2301)   

// Initialize DHT sensor
DHT dht(DHTPIN, DHTTYPE);

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

// Variables to hold sensor readings
float temp;
float hum;

AsyncMqttClient mqttClient;
TimerHandle_t mqttReconnectTimer;
TimerHandle_t wifiReconnectTimer;
unsigned long previousMillis = 0;   // Stores last time temperature was published
const long interval = 10000;        // Interval at which to publish sensor readings

#define FIRMWARE_VERSION "1.0.0"

String getIsoTimestamp() {
  timeClient.update();
  time_t now = timeClient.getEpochTime();
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
  return String(buffer);
}

void connectToWifi() {
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void connectToMqtt() {
  Serial.println("Connecting to MQTT...");
  mqttClient.connect();
}

void WiFiEvent(WiFiEvent_t event) {
  Serial.printf("[WiFi-event] event: %d\n", event);
  switch(event) {
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
      Serial.println("WiFi connected");
      Serial.println("IP address: ");
      Serial.println(WiFi.localIP());
      connectToMqtt();
      break;
    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
      Serial.println("WiFi lost connection");
      xTimerStop(mqttReconnectTimer, 0); // ensure we don't reconnect to MQTT while reconnecting to Wi-Fi
      xTimerStart(wifiReconnectTimer, 0);
      break;
  }
}

void onMqttConnect(bool sessionPresent) {
  Serial.println("Connected to MQTT.");
  Serial.print("Session present: ");
  Serial.println(sessionPresent);
}

void onMqttDisconnect(AsyncMqttClientDisconnectReason reason) {
  Serial.println("Disconnected from MQTT.");
  if (WiFi.isConnected()) {
    xTimerStart(mqttReconnectTimer, 0);
  }
}

/*void onMqttSubscribe(uint16_t packetId, uint8_t qos) {
  Serial.println("Subscribe acknowledged.");
  Serial.print("  packetId: ");
  Serial.println(packetId);
  Serial.print("  qos: ");
  Serial.println(qos);
}
void onMqttUnsubscribe(uint16_t packetId) {
  Serial.println("Unsubscribe acknowledged.");
  Serial.print("  packetId: ");
  Serial.println(packetId);
}*/

void onMqttPublish(uint16_t packetId) {
  Serial.print("Publish acknowledged.");
  Serial.print("  packetId: ");
  Serial.println(packetId);
}

void setup() {
  Serial.begin(115200);
  Serial.println();

  dht.begin();
  
  mqttReconnectTimer = xTimerCreate("mqttTimer", pdMS_TO_TICKS(2000), pdFALSE, (void*)0, reinterpret_cast<TimerCallbackFunction_t>(connectToMqtt));
  wifiReconnectTimer = xTimerCreate("wifiTimer", pdMS_TO_TICKS(2000), pdFALSE, (void*)0, reinterpret_cast<TimerCallbackFunction_t>(connectToWifi));

  WiFi.onEvent(WiFiEvent);

  mqttClient.onConnect(onMqttConnect);
  mqttClient.onDisconnect(onMqttDisconnect);
  //mqttClient.onSubscribe(onMqttSubscribe);
  //mqttClient.onUnsubscribe(onMqttUnsubscribe);
  mqttClient.onPublish(onMqttPublish);
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  // If your broker requires authentication (username and password), set them below
  //mqttClient.setCredentials("REPlACE_WITH_YOUR_USER", "REPLACE_WITH_YOUR_PASSWORD");
  connectToWifi();
  timeClient.begin();
  timeClient.update();
}

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    hum = dht.readHumidity();
    temp = dht.readTemperature();
    if (isnan(temp) || isnan(hum)) {
      Serial.println(F("Failed to read from DHT sensor!"));
      return;
    }
    // Publish temperature
    String tempPayload = "{";
    tempPayload += "\"deviceName\":\"esp32\",";
    tempPayload += "\"temperatureValue\":" + String(temp, 2) + ",";
    tempPayload += "\"timestamp\":\"" + getIsoTimestamp() + "\"";
    tempPayload += "}";
    mqttClient.publish("izac/devices/status/esp32/temperature", 0, false, tempPayload.c_str());
    // Status with extra details
    uint32_t freeHeap = ESP.getFreeHeap();
    uint32_t totalHeap = ESP.getHeapSize();
    float usedPercent = ((float)(totalHeap - freeHeap) / totalHeap) * 100.0f;

    String memorySummary = String(usedPercent, 1) + "% used | " +
                           String(freeHeap / 1024.0, 1) + " KB free | " +
                           String(totalHeap / 1024.0, 1) + " KB total";
    String statusPayload = "{";
    statusPayload += "\"deviceName\":\"esp32\",";
    statusPayload += "\"status\":\"online\",";
    statusPayload += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    statusPayload += "\"location\":\"primaryRoom\",";
    statusPayload += "\"uptime\":\"" + String(millis() / 1000) + "\",";
    statusPayload += "\"memory\":\"" + memorySummary + "\",";
     statusPayload += "\"version\":\"" + String(FIRMWARE_VERSION) + "\",";
    statusPayload += "\"timestamp\":\"" + getIsoTimestamp() + "\"";
    statusPayload += "}";
    mqttClient.publish("izac/devices/status", 0, false, statusPayload.c_str());
    // Publish humidity
    String humPayload = "{";
    humPayload += "\"deviceName\":\"esp32\",";
    humPayload += "\"humidityValue\":" + String(hum, 2) + ",";
    humPayload += "\"timestamp\":\"" + getIsoTimestamp() + "\"";
    humPayload += "}";
    mqttClient.publish("izac/devices/status/esp32/humidity", 0, false, humPayload.c_str());
    Serial.printf("Published temperature: %.2f C\n", temp);
    Serial.println("Published status: online");
    Serial.printf("Published humidity: %.2f C\n", hum);
  }
}
