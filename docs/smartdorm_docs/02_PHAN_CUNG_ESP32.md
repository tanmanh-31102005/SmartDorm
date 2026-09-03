# 🔌 Phần Cứng ESP32 — Firmware & Sơ Đồ Mạch
## Tài Liệu 02 — Hardware Layer

---

## 1. Tổng Quan Phần Cứng

Hệ thống sử dụng **ESP32 NodeMCU-32S** làm vi điều khiển trung tâm của mỗi phòng ký túc xá. Trong môi trường phát triển, sử dụng **Wokwi Digital Twin Simulator** để mô phỏng phần cứng mà không cần board vật lý.

### Linh Kiện Sử Dụng

| Linh Kiện | Mô Hình | Chức Năng | Kết Nối |
|---|---|---|---|
| Vi điều khiển | ESP32 NodeMCU-32S | CPU chính, WiFi, MQTT | — |
| Cảm biến nhiệt/ẩm | DHT22 | Đo nhiệt độ (°C) & độ ẩm (%) | GPIO 4 |
| Cảm biến khí gas | MQ-2 (mô phỏng Potentiometer) | Đo nồng độ khí gas (%) | GPIO 34 (ADC) |
| RFID thẻ 1 | Button mô phỏng `CARD_A1B2C3D4` | Sinh viên 1 (SV001) | GPIO 18 (PULLUP) |
| RFID thẻ 2 | Button mô phỏng `CARD_E5F6G7H8` | Sinh viên 2 (SV002) | GPIO 19 (PULLUP) |
| RFID thẻ lạ | Button mô phỏng `CARD_INVALID99` | Thẻ không hợp lệ | GPIO 21 (PULLUP) |
| Nút bật/tắt đèn | Button vật lý | Toggle đèn chiếu sáng | GPIO 32 (PULLUP) |
| Nút bật/tắt quạt | Button vật lý | Toggle quạt thông gió | GPIO 33 (PULLUP) |
| LED đèn 1 | LED xanh | Đèn chiếu sáng 1 | GPIO 25 |
| LED đèn 2 | LED xanh | Đèn chiếu sáng 2 | GPIO 26 |
| LED đèn 3 | LED xanh | Đèn chiếu sáng 3 | GPIO 27 |
| LED quạt | LED vàng | Quạt thông gió | GPIO 14 |
| LED cửa | LED trắng | Khóa cửa điện tử | GPIO 12 |
| LED báo động | LED đỏ | Cảnh báo khẩn cấp | GPIO 13 |
| Còi Buzzer | Active Buzzer | Chuông cảnh báo âm thanh | GPIO 15 |

---

## 2. Sơ Đồ GPIO

```
ESP32 NodeMCU-32S
┌────────────────────────────┐
│  GPIO 4  ──── DHT22 (DATA) │  ← Cảm biến nhiệt độ & độ ẩm
│  GPIO 34 ──── POT (ANALOG) │  ← Mô phỏng cảm biến khí gas MQ-2
│                             │
│  GPIO 18 ──── BTN_RFID_1  │  ← RFID SV001 (INPUT_PULLUP)
│  GPIO 19 ──── BTN_RFID_2  │  ← RFID SV002 (INPUT_PULLUP)
│  GPIO 21 ──── BTN_RFID_INV│  ← RFID Thẻ lạ (INPUT_PULLUP)
│  GPIO 32 ──── BTN_LIGHT   │  ← Nút vật lý bật/tắt đèn
│  GPIO 33 ──── BTN_FAN     │  ← Nút vật lý bật/tắt quạt
│                             │
│  GPIO 25 ──── LED_LIGHT_1 │  ← Đèn chiếu sáng 1 (OUTPUT)
│  GPIO 26 ──── LED_LIGHT_2 │  ← Đèn chiếu sáng 2 (OUTPUT)
│  GPIO 27 ──── LED_LIGHT_3 │  ← Đèn chiếu sáng 3 (OUTPUT)
│  GPIO 14 ──── LED_FAN     │  ← Quạt thông gió (OUTPUT)
│  GPIO 12 ──── LED_DOOR    │  ← Khóa cửa điện tử (OUTPUT)
│  GPIO 13 ──── LED_ALARM   │  ← Báo động đỏ (OUTPUT)
│  GPIO 15 ──── BUZZER      │  ← Còi báo động (OUTPUT)
└────────────────────────────┘
```

---

## 3. Cấu Trúc Firmware

**File nguồn:** `hardware/src/main.cpp`  
**Build system:** PlatformIO  
**Mô phỏng:** Wokwi (`wokwi.toml`, `diagram.json`)

### 3.1 Cấu Hình Kết Nối

```cpp
// WiFi
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// MQTT Brokers (Primary + Fallback)
const char* MQTT_BROKER_PRIMARY  = "broker.hivemq.com";
const char* MQTT_BROKER_FALLBACK = "broker.emqx.io";
const int   MQTT_PORT            = 1883;

// Cấu hình phòng
const char* BUILDING = "A";
const char* FLOOR    = "1";
const char* ROOM     = "101";
// → Topic: dormitory/A/1/101/...
```

### 3.2 Vòng Lặp Chính (Main Loop)

```
loop() {
  1. Duy trì kết nối WiFi (timeout 4s, retry)
  2. Duy trì kết nối MQTT (timeout 2s, retry)
  3. Xử lý RFID buttons (HIGH PRIORITY, polling 250ms debounce)
  4. Xử lý Physical buttons đèn/quạt (debounce 250ms)
  5. Gửi dữ liệu cảm biến (mỗi 3000ms = 3 giây)
  6. Kiểm tra auto-lock cửa (4 giây sau khi mở)
}
```

### 3.3 Xử Lý Lệnh MQTT (Callback)

```
mqttCallback(topic, payload) {
  Parse JSON payload
  
  IF topic endsWith "/command/light"  → setLight(ON/OFF)
  IF topic endsWith "/command/fan"    → setFan(ON/OFF)
  IF topic endsWith "/command/door"   → setDoor(UNLOCK/LOCK)
  IF topic endsWith "/command/alarm"  → setAlarm(ON/OFF) + beepBuzzer()
  
  → Gửi ACK: {command_id, status: "success"}
}
```

---

## 4. Logic Xử Lý RFID

```
handleRFID(buttonIndex) {
  cardIds = ["CARD_A1B2C3D4", "CARD_E5F6G7H8", "CARD_INVALID99"]
  cardId = cardIds[buttonIndex]
  
  authorized = isAuthorizedCardOffline(cardId)
  // → Kiểm tra Preferences NVS (không cần server)
  
  IF authorized:
    setDoor(OPEN)           // GPIO 12 HIGH
    beepBuzzer(1, 100ms)    // 1 tiếng beep ngắn
    doorUnlockTime = now()  // Bắt đầu timer auto-lock
    logAccessEvent(cardId, true, "entry")
  
  ELSE:
    beepBuzzer(3, 200ms)    // 3 tiếng beep từ chối
    logAccessEvent(cardId, false, "denied")
    // → Gửi cảnh báo bảo mật lên server
}
```

### Offline RFID Cache (NVS Preferences)
```cpp
// Khởi tạo khi setup
preferences.begin("rfid_cache", false);
preferences.putString("CARD_A1B2C3D4", "SV001");  // Card → StudentID
preferences.putString("CARD_E5F6G7H8", "SV002");

// Kiểm tra khi quẹt thẻ (không cần internet)
bool isAuthorizedCardOffline(String cardId) {
  if (cardId == "CARD_INVALID99") return false;
  String studentId = preferences.getString(cardId.c_str(), "");
  return studentId.length() > 0;
}
```

---

## 5. Logic Cảm Biến

### 5.1 DHT22 — Nhiệt Độ & Độ Ẩm
```cpp
void publishSensorData() {
  float temperature = dht.readTemperature();  // °C
  float humidity    = dht.readHumidity();     // %
  
  // Fallback nếu đọc lỗi
  if (isnan(temperature)) temperature = 27.5;
  if (isnan(humidity))    humidity = 64.0;
  
  bool tempAlert = temperature > 55.0;  // Ngưỡng nguy hiểm
}
```

### 5.2 MQ-2 (Mô Phỏng) — Nồng Độ Khí Gas
```cpp
// Đọc giá trị Potentiometer, quy đổi thành %
float gasPercent = (analogRead(GAS_ANALOG_PIN) / 4095.0) * 100.0;
bool gasAlert = gasPercent > 70.0;  // Ngưỡng báo động

// Tự động kích hoạt còi báo động
if (gasAlert || tempAlert) {
  setAlarm(true);
}
```

### 5.3 Payload Gửi Lên MQTT (mỗi 3 giây)
```json
{
  "temperature": 28.5,
  "humidity": 64.0,
  "gas_level": 18.2,
  "gas_alert": false,
  "temp_alert": false,
  "room": "101"
}
```

---

## 6. Auto-Lock Cửa (Non-Blocking Timer)

```
Khi cửa được mở (qua RFID hoặc lệnh từ Dashboard):
  → doorUnlockTime = millis()  // Ghi thời điểm mở cửa
  
Trong loop() mỗi lần lặp:
  IF doorOpen AND (millis() - doorUnlockTime > 4000ms):
    setDoor(LOCKED)  // Tự động khóa sau 4 giây
    Serial.println("Door Auto-Locked")
```

---

## 7. Offline Queue (SPIFFS)

Khi ESP32 mất kết nối MQTT, các sự kiện RFID được lưu vào bộ nhớ flash:

```cpp
// Ghi sự kiện vào hàng đợi offline
void logAccessEvent(String cardId, bool authorized, String action) {
  if (mqttClient.connected()) {
    // Gửi trực tiếp qua MQTT
    mqttClient.publish(topic_rfid, payload.c_str());
  } else {
    // Lưu vào SPIFFS
    File f = SPIFFS.open("/offline_events.jsonl", FILE_APPEND);
    f.println(payload);
    f.close();
  }
}

// Đồng bộ khi kết nối lại
void syncOfflineQueue() {
  if (!SPIFFS.exists("/offline_events.jsonl")) return;
  
  File f = SPIFFS.open("/offline_events.jsonl", FILE_READ);
  while (f.available()) {
    String payload = f.readStringUntil('\n');
    mqttClient.publish(topic_rfid, payload.c_str());
    delay(50);
  }
  SPIFFS.remove("/offline_events.jsonl");  // Xóa sau khi đồng bộ
}
```

---

## 8. Python Simulator — Mô Phỏng Đa Phòng

**File:** `simulator/simulate_rooms.py`

Khi không có phần cứng ESP32 thật, Python Simulator tạo môi trường Digital Twin:

### 8.1 Phạm Vi Mô Phỏng
```
- 24 phòng ký túc xá (Tòa A + B, Tầng 1-3)
- Gửi dữ liệu song song qua MQTT (multi-threaded)
- Mô phỏng các kịch bản:
  + Sinh viên ngủ (00:00 - 06:00): Tất cả thiết bị tắt
  + Thức dậy (06:00 - 07:30): Đèn bật, công suất thấp
  + Lên lớp (07:30 - 17:00): Phòng trống, tiêu thụ thấp
  + Sinh hoạt tối (17:00 - 23:30): Đèn + quạt + các thiết bị
```

### 8.2 Dữ Liệu Được Sinh Ra
```python
# Mỗi phòng gửi mỗi 15 phút
{
  "temperature": 27.5,   # Nhịp vi khí hậu tự nhiên
  "humidity": 68.0,
  "gas_level": 5.2,
  "power_w": 145.0,      # Công suất thực tế (W)
  "energy_kwh": 2.3456,  # Điện năng tích lũy (kWh, đơn điệu tăng)
  "motion_detected": true,
  "devices": {
    "light": true,
    "fan": false,
    "door_locked": true
  },
  "room": "A101",
  "timestamp": "2026-08-26T19:30:00Z"
}
```

### 8.3 Chạy Simulator
```bash
# Cài đặt
cd simulator
pip install -r requirements.txt

# Chạy mô phỏng
python simulate_rooms.py

# Mô phỏng nhanh (demo)
python demo_quick.py

# Test flow Wokwi
python test_wokwi_flow.py
```

---

## 9. Wokwi Digital Twin

**Files:**
- `hardware/wokwi.toml`: Cấu hình Wokwi project
- `hardware/diagram.json`: Sơ đồ kết nối linh kiện Wokwi
- `hardware/platformio.ini`: PlatformIO build config

**Cách chạy trên Wokwi:**
1. Mở [wokwi.com](https://wokwi.com)
2. Import `diagram.json` 
3. Code từ `hardware/src/main.cpp`
4. Nhấn "Play" để mô phỏng

**Trong Wokwi:**
- Kéo Potentiometer để thay đổi mức khí gas
- Nhấn nút để quẹt thẻ RFID
- Quan sát LED phản ứng với lệnh từ Dashboard

---

## 10. Migrating Sang Phần Cứng Thật

Khi chuyển từ Wokwi sang phần cứng ESP32 NodeMCU-32S thật:

### Chỉ Cần Thay Đổi 2 Dòng
```cpp
// Trong hardware/src/main.cpp:
const char* WIFI_SSID     = "TEN_WIFI_THUC_TE";  // Thay đổi
const char* WIFI_PASSWORD = "MAT_KHAU_WIFI";      // Thay đổi

// Và thay đổi MQTT broker sang local:
const char* MQTT_BROKER_PRIMARY = "192.168.1.100"; // IP máy chủ cục bộ
```

### Phần Cứng Thật (Tùy Chọn Mở Rộng)
```
Thay thế mô phỏng bằng phần cứng thật:
- Potentiometer → Cảm biến khí gas MQ-2 thật (SPI)
- Buttons → Module RFID RC522 (SPI: MOSI/MISO/SCK/SS)
- Thêm: Biến dòng PZEM-004T để đo điện năng thực tế

Toàn bộ Backend, ML Service, Database, Frontend
giữ nguyên 100% — KHÔNG cần sửa đổi.
```
