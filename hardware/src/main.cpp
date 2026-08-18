/**
 * SMART DORMITORY — ESP32 FIRMWARE
 * 
 * Linh kiện:
 *  - DHT22 (Nhiệt độ & Độ ẩm) -> GPIO 4
 *  - Biến trở Potentiometer (Mô phỏng Khí Gas MQ-2) -> GPIO 34
 *  - 3 Nút bấm (Mô phỏng 3 Thẻ RFID: SV001, SV002, Thẻ lạ) -> GPIO 18, 19, 21 (PULLUP)
 *  - 3 LED Đèn chiếu sáng -> GPIO 25, 26, 27
 *  - 1 LED Quạt thông gió -> GPIO 14
 *  - 1 LED Khóa cửa điện tử -> GPIO 12
 *  - 1 LED Báo động đỏ -> GPIO 13
 *  - 1 Còi Buzzer -> GPIO 15
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <SPIFFS.h>

// ==================== CẤU HÌNH ====================
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// Primary and Fallback MQTT Brokers for maximum reliability in Wokwi
const char* MQTT_BROKER_PRIMARY  = "broker.hivemq.com";
const char* MQTT_BROKER_FALLBACK = "broker.emqx.io";
const int   MQTT_PORT            = 1883;
const char* MQTT_USER            = "";
const char* MQTT_PASSWORD        = "";


const char* BUILDING  = "A";
const char* FLOOR     = "1";
const char* ROOM      = "101";

String topicBase = String("dormitory/") + BUILDING + "/" + FLOOR + "/" + ROOM;

// ==================== CHÂN GPIO ====================
#define DHT_PIN         4
#define DHT_TYPE        DHT22
#define GAS_ANALOG_PIN  34

#define BTN_RFID_1      18
#define BTN_RFID_2      19
#define BTN_RFID_INV    21
#define BTN_LIGHT       32
#define BTN_FAN         33


#define LED_LIGHT_1     25
#define LED_LIGHT_2     26
#define LED_LIGHT_3     27
#define LED_FAN         14
#define LED_DOOR        12
#define LED_ALARM       13
#define BUZZER_PIN      15

// ==================== BIẾN TRẠNG THÁI ====================
bool lightOn[3] = {false, false, false};
bool fanOn      = false;
bool doorOpen   = false;
bool alarmActive = false;
unsigned long doorUnlockTime = 0;

// Debounce & Timers
unsigned long lastBtnPress[3] = {0, 0, 0};
const unsigned long DEBOUNCE_MS = 250;

unsigned long lastSensorPublish = 0;
const unsigned long SENSOR_INTERVAL = 3000;
unsigned long lastMqttRetry = 0;
bool useFallbackBroker = false;

// ==================== KHỞI TẠO ĐỐI TƯỢNG ====================
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);
Preferences preferences;

// ==================== KHAI BÁO HÀM ====================
void connectWiFi();
void connectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishSensorData();
void publishDeviceStatus(String triggerSource);
void handleRFID(int btnIndex);

void setLight(int index, bool state);
void setFan(bool state);
void setDoor(bool state);
void setAlarm(bool state);
void beepBuzzer(int times, int durationMs);

// Offline Mode Functions
bool isAuthorizedCardOffline(String cardId);
void logAccessEvent(String cardId, bool authorized, String action);
void syncOfflineQueue();

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n==========================================");
  Serial.println("🏠 Smart Dormitory — ESP32 Fast Engine");
  Serial.println("==========================================");

  pinMode(LED_LIGHT_1, OUTPUT);
  pinMode(LED_LIGHT_2, OUTPUT);
  pinMode(LED_LIGHT_3, OUTPUT);
  pinMode(LED_FAN,     OUTPUT);
  pinMode(LED_DOOR,    OUTPUT);
  pinMode(LED_ALARM,   OUTPUT);
  pinMode(BUZZER_PIN,  OUTPUT);

  pinMode(BTN_RFID_1,   INPUT_PULLUP);
  pinMode(BTN_RFID_2,   INPUT_PULLUP);
  pinMode(BTN_RFID_INV, INPUT_PULLUP);
  pinMode(BTN_LIGHT,    INPUT_PULLUP);
  pinMode(BTN_FAN,      INPUT_PULLUP);

  setDoor(false);
  setAlarm(false);
  dht.begin();

  // Khởi tạo SPIFFS cho Offline Queue
  if (!SPIFFS.begin(true)) {
    Serial.println("❌ SPIFFS Mount Failed");
  } else {
    Serial.println("✅ SPIFFS Mounted (Offline Queue Ready)");
  }

  // Khởi tạo Preferences cho Offline RFID Cache
  preferences.begin("rfid_cache", false);
  if (preferences.getString("CARD_A1B2C3D4", "") == "") {
    preferences.putString("CARD_A1B2C3D4", "SV001");
    preferences.putString("CARD_E5F6G7H8", "SV002");
  }

  connectWiFi();
  mqttClient.setServer(MQTT_BROKER_PRIMARY, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);
  mqttClient.setKeepAlive(15);
  mqttClient.setSocketTimeout(3);

  Serial.println("✅ ESP32 Ready! Room: " + String(BUILDING) + String(FLOOR) + String(ROOM));
}

// Debounce for Physical Toggle Buttons
unsigned long lastLightBtnPress = 0;
unsigned long lastFanBtnPress = 0;

// ==================== LOOP ====================
void loop() {
  // 1. Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastMqttRetry > 4000) {
      connectWiFi();
      lastMqttRetry = millis();
    }
    return;
  }

  // 2. Maintain MQTT connection
  if (!mqttClient.connected()) {
    if (millis() - lastMqttRetry > 2000) {
      connectMQTT();
      lastMqttRetry = millis();
    }
  } else {
    mqttClient.loop();
  }

  // 3. Auto lock door after 4s
  if (doorOpen && millis() - doorUnlockTime > 4000) {
    setDoor(false);
    Serial.println("🔒 Door Auto-Locked");
  }

  // 4. Instant RFID Button Polling (High Priority)
  if (digitalRead(BTN_RFID_1) == LOW && millis() - lastBtnPress[0] > DEBOUNCE_MS) {
    lastBtnPress[0] = millis();
    handleRFID(0);
  }
  if (digitalRead(BTN_RFID_2) == LOW && millis() - lastBtnPress[1] > DEBOUNCE_MS) {
    lastBtnPress[1] = millis();
    handleRFID(1);
  }
  if (digitalRead(BTN_RFID_INV) == LOW && millis() - lastBtnPress[2] > DEBOUNCE_MS) {
    lastBtnPress[2] = millis();
    handleRFID(2);
  }

  // 5. Physical Toggle Buttons on Wokwi (Light & Fan)
  if (digitalRead(BTN_LIGHT) == LOW && millis() - lastLightBtnPress > DEBOUNCE_MS) {
    lastLightBtnPress = millis();
    bool nextState = !(lightOn[0] || lightOn[1] || lightOn[2]);
    setLight(0, nextState);
    setLight(1, nextState);
    setLight(2, nextState);
    publishDeviceStatus("PHYSICAL_BTN_LIGHT");
    Serial.println("💡 [WOKWI NÚT BẤM] Đèn -> " + String(nextState ? "BẬT" : "TẮT"));
  }
  if (digitalRead(BTN_FAN) == LOW && millis() - lastFanBtnPress > DEBOUNCE_MS) {
    lastFanBtnPress = millis();
    bool nextState = !fanOn;
    setFan(nextState);
    Serial.println("🌀 [WOKWI NÚT BẤM] Quạt -> " + String(nextState ? "BẬT" : "TẮT"));
  }

  // 6. Periodic Sensor Telemetry
  if (millis() - lastSensorPublish >= SENSOR_INTERVAL) {
    publishSensorData();
    lastSensorPublish = millis();
  }
}


// ==================== WI-FI & MQTT ====================
void connectWiFi() {
  Serial.print("📶 Connecting WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(200);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ WiFi retrying in background...");
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  const char* activeBroker = useFallbackBroker ? MQTT_BROKER_FALLBACK : MQTT_BROKER_PRIMARY;
  mqttClient.setServer(activeBroker, MQTT_PORT);
  
  Serial.print("🔌 Connecting MQTT to ");
  Serial.print(activeBroker);
  Serial.print("...");

  // Generate unique client ID to prevent broker kick-out
  String clientId = "smartdorm_esp32_A101_" + String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
    Serial.println(" ✅ CONNECTED!");
    mqttClient.subscribe((topicBase + "/command/#").c_str());
    syncOfflineQueue();
  } else {
    Serial.println(" ❌ (rc=" + String(mqttClient.state()) + ")");
    // Switch to fallback broker on next retry
    useFallbackBroker = !useFallbackBroker;
  }
}


// ==================== XỬ LÝ LỆNH MQTT ====================
void mqttCallback(char* topicChar, byte* payload, unsigned int length) {
  String topic = String(topicChar);
  String message = "";
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  Serial.println("\n📥 [MQTT Command Received]: " + topic);
  Serial.println("   Payload: " + message);

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, message) != DeserializationError::Ok) {
    Serial.println("❌ Failed to parse JSON command");
    return;
  }

  String action = doc["action"].as<String>();
  String commandId = doc["command_id"] | "unknown";

  if (topic.endsWith("/command/light") || topic.endsWith("/command/light1") || topic.endsWith("/command/light2") || topic.endsWith("/command/light3")) {
    bool state = (action == "on");
    setLight(0, state);
    setLight(1, state);
    setLight(2, state);
    publishDeviceStatus("LIGHT_TOGGLE");
    Serial.println("💡 [ACTION] 3 Đèn Chiếu Sáng (GPIO 25, 26, 27) -> " + String(state ? "BẬT (HIGH)" : "TẮT (LOW)"));
  }

  else if (topic.endsWith("/command/fan")) {
    bool state = (action == "on");
    setFan(state);
    Serial.println("🌀 [ACTION] Quạt Thông Gió (GPIO 14) -> " + String(state ? "BẬT (HIGH)" : "TẮT (LOW)"));
  }
  else if (topic.endsWith("/command/door")) {
    bool state = (action == "unlock" || action == "open");
    setDoor(state);
    Serial.println("🚪 [ACTION] Khóa Cửa Điện Tử (GPIO 12) -> " + String(state ? "MỞ KHÓA (HIGH)" : "KHÓA CHỐT (LOW)"));
  }
  else if (topic.endsWith("/command/alarm")) {
    bool state = (action == "on");
    setAlarm(state);
    if (state) beepBuzzer(3, 500);
    else digitalWrite(BUZZER_PIN, LOW);
    Serial.println("🚨 [ACTION] Báo Động (GPIO 13 & 15) -> " + String(state ? "BẬT CÒI (HIGH)" : "TẮT (LOW)"));
  }

  // ACK
  String ackTopic = topicBase + "/command/ack";
  StaticJsonDocument<128> ack;
  ack["command_id"] = commandId;
  ack["status"] = "success";
  String ackStr; serializeJson(ack, ackStr);
  mqttClient.publish(ackTopic.c_str(), ackStr.c_str());
}

// ==================== XỬ LÝ SENSOR ====================
void publishSensorData() {
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  float gasPercent  = (analogRead(GAS_ANALOG_PIN) / 4095.0) * 100.0;

  if (isnan(temperature)) temperature = 27.5;
  if (isnan(humidity))    humidity = 64.0;

  bool gasAlert = gasPercent > 70.0;
  bool tempAlert = temperature > 55.0;

  StaticJsonDocument<256> doc;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"]    = round(humidity * 10) / 10.0;
  doc["gas_level"]   = round(gasPercent * 10) / 10.0;
  doc["gas_alert"]   = gasAlert;
  doc["temp_alert"]  = tempAlert;
  doc["room"]        = String(ROOM);

  String payload; serializeJson(doc, payload);

  if (mqttClient.connected()) {
    mqttClient.publish((topicBase + "/sensor/data").c_str(), payload.c_str());
    Serial.println("📊 Telemetry: " + String(temperature) + "C | " + String(humidity) + "% | Gas: " + String(gasPercent) + "%");
  }

  // Auto trigger alarm if gas or temp over critical limit
  if (gasAlert || tempAlert) {
    setAlarm(true);
  }
}

// ==================== OFFLINE RFID CACHE ====================
bool isAuthorizedCardOffline(String cardId) {
  if (cardId == "CARD_INVALID99") return false;
  String studentId = preferences.getString(cardId.c_str(), "");
  return studentId.length() > 0;
}

// ==================== GHI LOG QUẸT THẺ ====================
void logAccessEvent(String cardId, bool authorized, String action) {
  StaticJsonDocument<200> doc;
  doc["card_id"]    = cardId;
  doc["authorized"] = authorized;
  doc["action"]     = action;
  doc["room"]       = String(ROOM);
  doc["timestamp"]  = millis();

  String payload; serializeJson(doc, payload);

  if (mqttClient.connected()) {
    mqttClient.publish((topicBase + "/access/rfid").c_str(), payload.c_str());
    Serial.println("📤 Access Log Published: " + cardId + " (" + (authorized ? "AUTHORIZED" : "DENIED") + ")");
  } else {
    File f = SPIFFS.open("/offline_events.jsonl", FILE_APPEND);
    if (f) {
      f.println(payload);
      f.close();
      Serial.println("💾 Access Log Queued Offline");
    }
  }
}

void syncOfflineQueue() {
  if (!SPIFFS.exists("/offline_events.jsonl")) return;
  
  File f = SPIFFS.open("/offline_events.jsonl", FILE_READ);
  if (!f) return;
  
  Serial.println("🔄 Syncing Offline Queue...");
  int syncedCount = 0;

  while (f.available()) {
    String payload = f.readStringUntil('\n');
    if (payload.length() > 5) {
      if (mqttClient.publish((topicBase + "/access/rfid").c_str(), payload.c_str())) {
        syncedCount++;
        delay(50);
      }
    }
  }
  f.close();
  SPIFFS.remove("/offline_events.jsonl");
  Serial.println("✅ Synced " + String(syncedCount) + " offline events.");
}

// ==================== XỬ LÝ THẺ ====================
void handleRFID(int btnIndex) {
  String cardIds[] = {"CARD_A1B2C3D4", "CARD_E5F6G7H8", "CARD_INVALID99"};
  String cardId = cardIds[btnIndex];
  Serial.println("\n🪪 RFID: " + cardId);

  bool authorized = isAuthorizedCardOffline(cardId);

  if (authorized) {
    setDoor(true);
    beepBuzzer(1, 100);
    logAccessEvent(cardId, true, "entry");
    doorUnlockTime = millis(); // Non-blocking timer
  } else {
    beepBuzzer(3, 200);
    logAccessEvent(cardId, false, "denied");
  }
}

void publishDeviceStatus(String triggerSource) {
  StaticJsonDocument<256> doc;
  doc["room"] = String(ROOM);
  doc["building"] = String(BUILDING);
  doc["floor"] = String(FLOOR);
  doc["light"] = lightOn[0] || lightOn[1] || lightOn[2];
  doc["light_1"] = lightOn[0];
  doc["light_2"] = lightOn[1];
  doc["light_3"] = lightOn[2];
  doc["fan"] = fanOn;
  doc["door"] = doorOpen ? "unlocked" : "locked";
  doc["door_lock"] = !doorOpen;
  doc["alarm"] = alarmActive;
  doc["trigger"] = triggerSource;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);
  if (mqttClient.connected()) {
    mqttClient.publish((topicBase + "/status").c_str(), payload.c_str());
    Serial.println("📡 [STATUS SYNC] -> Web UI: Light=" + String(lightOn[0] ? "ON" : "OFF") + " | Fan=" + String(fanOn ? "ON" : "OFF") + " | Door=" + String(doorOpen ? "UNLOCKED" : "LOCKED") + " | Alarm=" + String(alarmActive ? "ON" : "OFF"));
  }
}

// ==================== ĐIỀU KHIỂN THIẾT BỊ ====================
void setLight(int index, bool state) {
  int pins[] = {LED_LIGHT_1, LED_LIGHT_2, LED_LIGHT_3};
  lightOn[index] = state;
  digitalWrite(pins[index], state ? HIGH : LOW);
}

void setFan(bool state) {
  fanOn = state;
  digitalWrite(LED_FAN, state ? HIGH : LOW);
  publishDeviceStatus("FAN_TOGGLE");
}

void setDoor(bool state) {
  doorOpen = state;
  digitalWrite(LED_DOOR, state ? HIGH : LOW);
  publishDeviceStatus("DOOR_TOGGLE");
}

void setAlarm(bool state) {
  alarmActive = state;
  digitalWrite(LED_ALARM, state ? HIGH : LOW);
  if (!state) digitalWrite(BUZZER_PIN, LOW);
  publishDeviceStatus("ALARM_TOGGLE");
}

void beepBuzzer(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) delay(100);
  }
}

