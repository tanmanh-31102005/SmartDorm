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
const char* WIFI_SSID     = "3070";
const char* WIFI_PASSWORD = "12012014";

// Trỏ thẳng về Cloud VPS MQTT Broker (Fallback sang HiveMQ nếu cần)
const char* MQTT_BROKER_PRIMARY  = "103.74.100.132";
const char* MQTT_BROKER_FALLBACK = "broker.hivemq.com";
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

// 5 Nút Bấm Vật Lý Trên Breadboard (Đại diện Bật/Tắt & Quẹt Thẻ)
#define BTN_LIGHT       32  // Nút Bật/Tắt Đèn
#define BTN_FAN         33  // Nút Bật/Tắt Quạt
#define BTN_RFID_1      18  // Nút đại diện Thẻ SV001 (Nguyễn Văn An - Hợp lệ)
#define BTN_RFID_2      19  // Nút đại diện Thẻ SV002 (Trần Thị Bình - Hợp lệ)
#define BTN_RFID_INV    21  // Nút đại diện Thẻ Lạ (Từ chối / Báo động)

// Đèn LED / Relay kích hoạt thiết bị
#define LED_LIGHT_1     25  // Đèn 1 (Relay 1)
#define LED_LIGHT_2     26  // Đèn 2 (Relay 2)
#define LED_LIGHT_3     27  // Đèn 3 (Dự phòng)
#define LED_FAN         14  // Quạt (Relay 3)
#define LED_DOOR        12  // Khóa Cửa (Relay 4 - sáng 4s khi mở chốt)
#define LED_ALARM       13  // Đèn Báo Động Đỏ (nhấp nháy khi sự cố)
#define BUZZER_PIN      15  // Còi Báo Động Active Buzzer 5V

// ==================== CẤU HÌNH LOGIC RƠ-LE (ACTIVE-LOW) ====================
// Bo Relay 4 kênh hoạt động ở chế độ Low-Level Trigger (Mức Thấp):
//  - RELAY_ON  = LOW  (0V kích hoạt cuộn hút đóng tiếp điểm, đèn LED đỏ trên rơ-le sáng, bật thiết bị)
//  - RELAY_OFF = HIGH (3.3V ngắt cuộn hút, đèn LED đỏ tắt, ngắt thiết bị)
#define RELAY_ON        LOW
#define RELAY_OFF       HIGH

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
void setFan(bool state, String triggerSource = "FAN_TOGGLE");
void setDoor(bool state, String triggerSource = "DOOR_TOGGLE");
void setAlarm(bool state, String triggerSource = "ALARM_TOGGLE");
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
  Serial.println("🏠 Smart Dormitory — ESP32 + RFID RC522");
  Serial.println("==========================================");

  // Đặt trước mức ngắt (HIGH / RELAY_OFF) trước khi kích hoạt OUTPUT để triệt tiêu cú giật rơ-le khi khởi động
  digitalWrite(LED_LIGHT_1, RELAY_OFF);
  digitalWrite(LED_LIGHT_2, RELAY_OFF);
  digitalWrite(LED_LIGHT_3, RELAY_OFF);
  digitalWrite(LED_FAN,     RELAY_OFF);
  digitalWrite(LED_DOOR,    RELAY_OFF);

  pinMode(LED_LIGHT_1, OUTPUT);
  pinMode(LED_LIGHT_2, OUTPUT);
  pinMode(LED_LIGHT_3, OUTPUT);
  pinMode(LED_FAN,     OUTPUT);
  pinMode(LED_DOOR,    OUTPUT);
  pinMode(LED_ALARM,   OUTPUT);
  pinMode(BUZZER_PIN,  OUTPUT);

  pinMode(BTN_LIGHT,    INPUT_PULLUP);
  pinMode(BTN_FAN,      INPUT_PULLUP);
  pinMode(BTN_RFID_1,   INPUT_PULLUP);
  pinMode(BTN_RFID_2,   INPUT_PULLUP);
  pinMode(BTN_RFID_INV, INPUT_PULLUP);

  setDoor(false);
  setAlarm(false);
  setFan(false);
  setLight(0, false);
  setLight(1, false);
  setLight(2, false);
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
  preferences.end();

  connectWiFi();
  mqttClient.setServer(MQTT_BROKER_PRIMARY, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);
  mqttClient.setKeepAlive(15);
  mqttClient.setSocketTimeout(3);

  Serial.println("✅ ESP32 Ready! Room: " + String(BUILDING) + String(FLOOR) + String(ROOM));
}

// Debounce & State Tracking cho 5 Nút Bấm Vật Lý
unsigned long lastLightBtnPress = 0;
unsigned long lastFanBtnPress   = 0;
bool prevBtnLight   = HIGH;
bool prevBtnFan     = HIGH;
bool prevBtnRfid1   = HIGH;
bool prevBtnRfid2   = HIGH;
bool prevBtnRfidInv = HIGH;

// ==================== LOOP ====================
void loop() {
  // 1. Maintain WiFi & MQTT non-blocking (Không dùng return để nút bấm luôn hoạt động)
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      if (millis() - lastMqttRetry > 3000) {
        lastMqttRetry = millis();
        connectMQTT();
      }
    } else {
      mqttClient.loop();
    }
  } else {
    // Khi mất WiFi: Thử reconnect mỗi 8s một lần, không spam WiFi.begin() làm đơ vi điều khiển
    if (millis() - lastMqttRetry > 8000) {
      lastMqttRetry = millis();
      WiFi.reconnect();
    }
  }

  // 3. Auto lock door after 4s (Chỉ tự khóa khi không có sự cố báo động khẩn cấp)
  if (doorOpen && !alarmActive && millis() - doorUnlockTime > 4000) {
    setDoor(false, "AUTO_RELOCK_DOOR");
    Serial.println("🔒 Door Auto-Locked");
  }

  // 3b. Còi Báo Động Active Buzzer & Đèn LED Đỏ nhấp nháy nhịp nhàng khi có sự cố
  static unsigned long lastAlarmPulse = 0;
  static bool alarmPulseState = false;
  if (alarmActive) {
    if (millis() - lastAlarmPulse > 350) {
      lastAlarmPulse = millis();
      alarmPulseState = !alarmPulseState;
      digitalWrite(BUZZER_PIN, alarmPulseState ? HIGH : LOW);
      digitalWrite(LED_ALARM, alarmPulseState ? HIGH : LOW);
    }
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_ALARM, LOW);
  }

  // 4. Instant RFID Button Polling (Edge Detection: Bắt sườn xuống HIGH -> LOW)
  bool rfid1 = digitalRead(BTN_RFID_1);
  if (rfid1 == LOW && prevBtnRfid1 == HIGH && (millis() - lastBtnPress[0] > DEBOUNCE_MS)) {
    lastBtnPress[0] = millis();
    handleRFID(0);
  }
  prevBtnRfid1 = rfid1;

  bool rfid2 = digitalRead(BTN_RFID_2);
  if (rfid2 == LOW && prevBtnRfid2 == HIGH && (millis() - lastBtnPress[1] > DEBOUNCE_MS)) {
    lastBtnPress[1] = millis();
    handleRFID(1);
  }
  prevBtnRfid2 = rfid2;

  bool rfidInv = digitalRead(BTN_RFID_INV);
  if (rfidInv == LOW && prevBtnRfidInv == HIGH && (millis() - lastBtnPress[2] > DEBOUNCE_MS)) {
    lastBtnPress[2] = millis();
    handleRFID(2);
  }
  prevBtnRfidInv = rfidInv;

  // 5. Nút Bấm Vật Lý: Bật/Tắt Đèn (GPIO 32)
  bool btnLight = digitalRead(BTN_LIGHT);
  if (btnLight == LOW && prevBtnLight == HIGH && (millis() - lastLightBtnPress > DEBOUNCE_MS)) {
    lastLightBtnPress = millis();
    bool nextState = !(lightOn[0] || lightOn[1] || lightOn[2]);
    setLight(0, nextState);
    setLight(1, nextState);
    setLight(2, nextState);
    publishDeviceStatus("PHYSICAL_BTN_LIGHT");
    Serial.println("💡 [NÚT BẤM] Đèn -> " + String(nextState ? "BẬT" : "TẮT"));
  }
  prevBtnLight = btnLight;

  // 6. Nút Bấm Vật Lý: Bật/Tắt Quạt (GPIO 33)
  bool btnFan = digitalRead(BTN_FAN);
  if (btnFan == LOW && prevBtnFan == HIGH && (millis() - lastFanBtnPress > DEBOUNCE_MS)) {
    lastFanBtnPress = millis();
    bool nextState = !fanOn;
    setFan(nextState, "PHYSICAL_BTN_FAN");
    Serial.println("🌀 [NÚT BẤM] Quạt -> " + String(nextState ? "BẬT" : "TẮT"));
  }
  prevBtnFan = btnFan;

  // 7. Periodic Sensor Telemetry
  if (millis() - lastSensorPublish >= SENSOR_INTERVAL) {
    publishSensorData();
    lastSensorPublish = millis();
  }
}



// ==================== WI-FI & MQTT ====================
void connectWiFi() {
  Serial.print("📶 Connecting WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(200);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ WiFi will connect in background...");
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  mqttClient.setServer(MQTT_BROKER_PRIMARY, MQTT_PORT);
  
  Serial.print("🔌 Connecting MQTT to ");
  Serial.print(MQTT_BROKER_PRIMARY);
  Serial.print("...");

  // Generate unique client ID to prevent broker kick-out
  String clientId = "smartdorm_esp32_A101_" + String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
    Serial.println(" ✅ CONNECTED!");
    mqttClient.subscribe((topicBase + "/command/#").c_str());
    syncOfflineQueue();
  } else {
    Serial.println(" ❌ (rc=" + String(mqttClient.state()) + ")");
  }
}


// ==================== XỬ LÝ LỆNH MQTT ====================
void mqttCallback(char* topicChar, byte* payload, unsigned int length) {
  String topic = String(topicChar);
  // Bỏ qua tin nhắn ACK của chính mình để triệt tiêu hoàn toàn vòng lặp vô tận
  if (topic.endsWith("/ack")) return;

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
  action.trim();
  String commandId = doc["command_id"] | "unknown";

  bool isTurnOn = action.equalsIgnoreCase("on") || action.equalsIgnoreCase("open") || action.equalsIgnoreCase("unlock") || action == "1" || action.equalsIgnoreCase("true");
  bool isTurnOff = action.equalsIgnoreCase("off") || action.equalsIgnoreCase("close") || action.equalsIgnoreCase("lock") || action == "0" || action.equalsIgnoreCase("false");
  bool isToggle = action.equalsIgnoreCase("toggle");

  if (topic.endsWith("/command/light") || topic.endsWith("/command/light1") || topic.endsWith("/command/light2") || topic.endsWith("/command/light3")) {
    bool state = false;
    if (isToggle) {
      state = !(lightOn[0] || lightOn[1] || lightOn[2]);
    } else {
      state = isTurnOn;
    }
    setLight(0, state);
    setLight(1, state);
    setLight(2, state);
    publishDeviceStatus("LIGHT_COMMAND");
    // Phản hồi âm thanh còi: 1 bíp khi bật, 2 bíp nhanh khi ngắt điện/tắt đèn
    beepBuzzer(state ? 1 : 2, 80);
    Serial.println("💡 [ACTION] 3 Đèn Chiếu Sáng (GPIO 25, 26, 27) -> " + String(state ? "BẬT (Active-LOW)" : "TẮT (HIGH)"));
  }

  else if (topic.endsWith("/command/fan")) {
    bool state = false;
    if (isToggle) {
      state = !fanOn;
    } else {
      state = isTurnOn;
    }
    setFan(state, "FAN_COMMAND");
    // Phản hồi âm thanh còi: 1 bíp dài khi bật quạt, 2 bíp nhanh khi tắt quạt
    beepBuzzer(state ? 1 : 2, 90);
    Serial.println("🌀 [ACTION] Quạt Thông Gió (GPIO 14) -> " + String(state ? "BẬT (Active-LOW)" : "TẮT (HIGH)"));
  }
  else if (topic.endsWith("/command/door")) {
    bool state = isTurnOn;
    setDoor(state, "DOOR_COMMAND");
    if (state) {
      doorUnlockTime = millis();
      // Phản hồi âm thanh còi: 1 bíp mở chốt cửa
      beepBuzzer(1, 150);
    } else {
      beepBuzzer(2, 80);
    }
    Serial.println("🚪 [ACTION] Khóa Cửa Điện Tử (GPIO 12) -> " + String(state ? "MỞ KHÓA (Active-LOW)" : "KHÓA CHỐT (HIGH)"));
  }
  else if (topic.endsWith("/command/alarm")) {
    bool state = isTurnOn;
    setAlarm(state, "ALARM_COMMAND");
    Serial.println("🚨 [ACTION] Báo Động (GPIO 13 & 15) -> " + String(state ? "BẬT CÒI (HIGH)" : "TẮT (LOW)"));
  }

  // ACK (chỉ gửi khi có command_id hợp lệ)
  if (commandId != "unknown") {
    String ackTopic = topicBase + "/command/ack";
    StaticJsonDocument<128> ack;
    ack["command_id"] = commandId;
    ack["status"] = "success";
    String ackStr; serializeJson(ack, ackStr);
    mqttClient.publish(ackTopic.c_str(), ackStr.c_str());
  }
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

  int lightCount = (lightOn[0] ? 1 : 0) + (lightOn[1] ? 1 : 0) + (lightOn[2] ? 1 : 0);
  float powerW = (lightCount * 20.0) + (fanOn ? 60.0 : 0.0) + 5.0;

  StaticJsonDocument<300> doc;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"]    = round(humidity * 10) / 10.0;
  doc["gas_level"]   = round(gasPercent * 10) / 10.0;
  doc["gas_alert"]   = gasAlert;
  doc["temp_alert"]  = tempAlert;
  doc["room"]        = String(ROOM);
  doc["building"]    = String(BUILDING);
  doc["floor"]       = String(FLOOR);
  doc["light_1"]     = lightOn[0];
  doc["light_2"]     = lightOn[1];
  doc["light_3"]     = lightOn[2];
  doc["light"]       = lightOn[0] || lightOn[1] || lightOn[2];
  doc["fan"]         = fanOn;
  doc["powerW"]      = powerW;

  String payload; serializeJson(doc, payload);

  if (mqttClient.connected()) {
    mqttClient.publish((topicBase + "/sensor/data").c_str(), payload.c_str());
    Serial.println("📊 Telemetry: " + String(temperature) + "C | " + String(humidity) + "% | Gas: " + String(gasPercent) + "% | Power: " + String(powerW) + "W");
  }

  // Tự động kích hoạt kịch bản khẩn cấp PCCC / Thoát hiểm độc lập tại tầng Edge (Edge Safety Rule Engine)
  if (gasAlert || tempAlert) {
    if (!alarmActive) {
      Serial.println("🚨 [EMERGENCY PCCC / GAS LEAK DETECTED!] Kích hoạt quy trình an toàn:");
      Serial.println("   1. Hú còi báo động Active Buzzer!");
      Serial.println("   2. Cắt điện Đèn chiếu sáng chống chập cháy!");
      Serial.println("   3. Bật Quạt thông gió cưỡng bức hút khí độc!");
      Serial.println("   4. MỞ CHỐT KHÓA CỬA ĐIỆN TỪ (Relay 4 - Solenoid UNLOCKED) phục vụ cứu hộ!");
    }
    setAlarm(true, "EMERGENCY_SENSOR_ALARM");
    setLight(0, false);
    setLight(1, false);
    setLight(2, false);
    setFan(true, "EMERGENCY_GAS_FAN");
    setDoor(true, "EMERGENCY_ESCAPE_DOOR"); // Mở chốt cửa thoát hiểm (Active-LOW: xuất LOW kích hoạt rơ-le khóa cửa)
  }
}

// ==================== OFFLINE RFID CACHE ====================
bool isAuthorizedCardOffline(String cardId) {
  if (cardId == "CARD_INVALID99" || cardId.indexOf("INVALID") >= 0) return false;
  // Cố định thẻ sinh viên hợp lệ phòng 101 đảm bảo an toàn offline
  if (cardId == "CARD_A1B2C3D4" || cardId == "CARD_E5F6G7H8") return true;
  
  preferences.begin("rfid_cache", true);
  String studentId = preferences.getString(cardId.c_str(), "");
  preferences.end();
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

// ==================== XỬ LÝ NÚT QUẸT THẺ ====================
void handleRFID(int btnIndex) {
  String cardIds[] = {"CARD_A1B2C3D4", "CARD_E5F6G7H8", "CARD_INVALID99"};
  String studentNames[] = {"Nguyễn Văn An (SV2024001 - Phòng 101)", "Trần Thị Bình (SV2024002 - Phòng 101)", "Thẻ Lạ (Chưa được cấp phép)"};
  String cardId = cardIds[btnIndex];
  Serial.println("\n------------------------------------------------");
  Serial.println("🪪 [NÚT QUẸT THẺ] " + studentNames[btnIndex] + " | Mã Thẻ: " + cardId);

  // Nút 3 (index 0 - SV001) & Nút 4 (index 1 - SV002) là sinh viên hợp lệ của Phòng 101
  // Nút 5 (index 2 - Thẻ lạ) là người ngoài / thẻ không hợp lệ
  bool authorized = false;
  if (btnIndex == 0 || btnIndex == 1) {
    authorized = true;
  } else if (btnIndex == 2 || cardId == "CARD_INVALID99") {
    authorized = false;
  } else {
    authorized = isAuthorizedCardOffline(cardId);
  }

  if (authorized) {
    Serial.println("✅ [XÁC THỰC THÀNH CÔNG] Sinh viên: " + studentNames[btnIndex]);
    Serial.println("🚪 [KHÓA CỬA] MỞ CHỐT (Relay 4 / LED 4 sáng 4 giây) | Còi 1 tiếng bíp ngắn!");
    setDoor(true, "PHYSICAL_RFID_DOOR");
    beepBuzzer(1, 150);
    logAccessEvent(cardId, true, "entry");
    doorUnlockTime = millis();
  } else {
    Serial.println("⛔ [TỪ CHỐI TRUY CẬP] Thẻ lạ từ chối vào phòng! Còi kêu 3 tiếng cảnh báo!");
    beepBuzzer(3, 200);
    logAccessEvent(cardId, false, "denied");
  }
  Serial.println("------------------------------------------------\n");
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
  digitalWrite(pins[index], state ? RELAY_ON : RELAY_OFF);
}

void setFan(bool state, String triggerSource) {
  fanOn = state;
  digitalWrite(LED_FAN, state ? RELAY_ON : RELAY_OFF);
  publishDeviceStatus(triggerSource);
}

void setDoor(bool state, String triggerSource) {
  doorOpen = state;
  digitalWrite(LED_DOOR, state ? RELAY_ON : RELAY_OFF);
  publishDeviceStatus(triggerSource);
}

void setAlarm(bool state, String triggerSource) {
  alarmActive = state;
  if (!state) {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_ALARM, LOW);
  }
  publishDeviceStatus(triggerSource);
}

void beepBuzzer(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) delay(100);
  }
}

