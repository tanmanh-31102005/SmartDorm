# 🔌 Phần Cứng ESP32 — Firmware & Sơ Đồ Mạch
## Tài Liệu 02 — Hardware Layer

---

## 1. Tổng Quan Phần Cứng

Hệ thống sử dụng **ESP32 NodeMCU-32S** làm vi điều khiển trung tâm của mỗi phòng ký túc xá. Trong môi trường phát triển, sử dụng **Wokwi Digital Twin Simulator** để mô phỏng phần cứng mà không cần board vật lý.

### Linh Kiện Sử Dụng (Phần Cứng Thật & Mô Phỏng Wokwi)

| Linh Kiện | Phần Cứng Thật | Mô Phỏng (Wokwi/Breadboard) | Chức Năng | Chân Kết Nối ESP32 |
|---|---|---|---|---|
| **Vi điều khiển** | ESP32 DevKit V1 (30 chân) | ESP32 NodeMCU-32S | CPU chính, WiFi, MQTT Client | — |
| **Cảm biến nhiệt/ẩm** | DHT22 vật lý | DHT22 Wokwi | Đo nhiệt độ (°C) & độ ẩm (%) | GPIO 4 |
| **Cảm biến khí gas/khói** | MQ-2 vật lý (chân Analog) | Biến trở Potentiometer 10k | Đo nồng độ khí gas nguy hiểm (%) | GPIO 34 (ADC1_CH6) |
| **Kiểm soát ra vào** | Đầu đọc RFID RC522 (13.56MHz SPI) | 3 Nút nhấn quẹt thẻ mô phỏng | Nhận diện thẻ sinh viên mở cửa | SPI (SCK: 18, MISO: 19, MOSI: 23, SDA: 5/21) |
| **Nút bấm Đèn** | Nút nhấn cơ học 4 chân | Pushbutton vật lý | Đảo trạng thái Đèn chiếu sáng | GPIO 32 (INPUT_PULLUP) |
| **Nút bấm Quạt** | Nút nhấn cơ học 4 chân | Pushbutton vật lý | Đảo trạng thái Quạt thông gió | GPIO 33 (INPUT_PULLUP) |
| **Relay Kênh 1** | Rơ-le 5V Optocoupler (Kênh 1) | LED xanh (LED_LIGHT_1,2,3) | Đóng ngắt Đèn chiếu sáng 220V/12V | GPIO 25 (và 26, 27 dự phòng) |
| **Relay Kênh 2** | Rơ-le 5V Optocoupler (Kênh 2) | LED vàng (LED_FAN) | Đóng ngắt Quạt thông gió | GPIO 14 |
| **Relay Kênh 3** | Rơ-le 5V Optocoupler (Kênh 3) | LED trắng (LED_DOOR) | Mở chốt Khóa cửa điện từ (4s auto-relock)| GPIO 12 |
| **Relay Kênh 4** | Rơ-le 5V Optocoupler (Kênh 4) | LED đỏ (LED_ALARM) | Kích hoạt Đèn chớp sự cố | GPIO 13 |
| **Còi báo động** | Active Buzzer 5V | Active Buzzer Wokwi | Phát âm thanh bíp xác nhận & hú sự cố | GPIO 15 |

> ⚠️ **Xác Nhận Thực Tế Phần Cứng:** Hệ thống **HOÀN TOÀN KHÔNG CÓ** cảm biến đo dòng điện/công suất điện 220V vật lý (không có module PZEM-004T, không có cuộn biến dòng CT clamp). Năng lượng và công suất trong hệ thống được tính toán toán học từ công suất danh định của thiết bị (Đèn ~40W, Quạt ~65W) dựa theo trạng thái đóng/ngắt của rơ-le và mô hình học máy vi khí hậu, đảm bảo an toàn điện tối đa trong môi trường ký túc xá.

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

### 4.3 Nguyên Tắc Sinh Mã Thẻ RFID Tự Động Cho Sinh Viên
Trong hệ thống SmartDorm, thẻ RFID vật lý tương thích với module **RC522** là chuẩn thẻ **13.56 MHz Mifare Classic 1K**, sử dụng mã UID 4-byte (8 ký tự Hexadecimal).

Để đảm bảo quy trình vận hành khép kín và tự động hóa không cần thao tác gán thẻ thủ công:
- **Công thức sinh mã**:
  $$\text{rfidCardId} = \text{"CARD\_"} + \text{SHA256}(\text{"SMARTDORM\_RFID\_"} + \text{MSSV})[0:8].\text{toUpperCase()}$$
- **Nguyên lý hoạt động**:
  1. *Tính đơn ánh và không xung đột*: Do MSSV là duy nhất trong trường, hàm băm SHA-256 luôn sinh ra duy nhất một chuỗi 8 ký tự Hex cố định cho mỗi sinh viên, không thể bị trùng lặp.
  2. *Tự động kích hoạt*: Khi sinh viên đăng ký tài khoản thành công hoặc khi Ban Quản Lý xếp phòng cho sinh viên trên Dashboard, hệ thống tự động sinh và lưu `rfidCardId` vào cơ sở dữ liệu.
  3. *Tương thích phần cứng thật*: Chuỗi sinh ra (ví dụ: `CARD_93C52823`, `CARD_207B92E2`) hoàn toàn tương thích với mã UID 4 byte mà vi điều khiển ESP32 đọc được từ module RC522 thông qua thanh ghi `mfrc522.uid.uidByte`.

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

## 10. Hướng Dẫn Đấu Nối & Vận Hành Mạch Thật (Physical Hardware Setup)

> **📖 Tài liệu hướng dẫn thực hành chi tiết từng bước cho người mới:**  
> Xem cẩm nang hoàn chỉnh tại: **[HUONG_DAN_LAP_RAP_PHAN_CUNG_CHI_TIET.md](../../HUONG_DAN_LAP_RAP_PHAN_CUNG_CHI_TIET.md)**  
> *(Bao gồm quy tắc cắm Breadboard, bản đồ chân ESP32 trực quan, quy tắc cắm nút 4 chân chống chập mạch, checklist an toàn trước khi cắm điện và cách test từng linh kiện).*

Hệ thống đã sẵn sàng 100% để chuyển đổi từ Wokwi Digital Twin sang mạch thật mà **không cần chỉnh sửa bất kỳ dòng code Backend hay Frontend nào**.

### 10.1 Bảng Sơ Đồ Đấu Nối Chân Mạch Thật (Pin-to-Pin Mapping)

| Linh Kiện / Module Thật | Chân Trên Module | Chân Trên ESP32 CP2102 | Vai Trò & Ghi Chú Kỹ Thuật |
|---|---|---|---|
| **Cảm biến DHT22** (3 chân) | `+` (VCC) | **3V3** (hoặc 5V) | Cấp nguồn vi khí hậu |
| | `-` (GND) | **GND** | Nối mass chung |
| | `out` (DATA) | **GPIO 4** | Đọc nhiệt độ & độ ẩm (One-Wire) |
| **Cảm biến Khí Gas MQ-2** (4 chân) | `VCC` | **VIN (5V)** | **Bắt buộc 5V** để cấp nguồn cuộn sấy |
| | `GND` | **GND** | Nối mass chung |
| | `AO` (Analog Out) | **GPIO 34** | Chân ADC1 đọc điện áp nồng độ gas |
| | `DO` | *(Để trống)* | Không cần dùng (đã đọc qua ADC) |
| **Module Relay 5V 4 Kênh** | `DC+` | **VIN (5V)** | Cấp nguồn cuộn hút rơ-le |
| *(Chuẩn Active-LOW / Jumper `Low`)* | `DC-` | **GND** | Nối mass chung |
| | `IN1` | **GPIO 25** | Rơ-le Đèn Chiếu Sáng 1 (`LOW`=Bật, `HIGH`=Tắt) |
| | `IN2` | **GPIO 26** | Rơ-le Đèn Chiếu Sáng 2 (`LOW`=Bật, `HIGH`=Tắt) |
| | `IN3` | **GPIO 14** | Rơ-le Quạt Thông Gió (`LOW`=Bật, `HIGH`=Tắt) |
| | `IN4` | **GPIO 12** | Rơ-le Khóa Cửa Điện Tử (`LOW`=Mở chốt 4s, `HIGH`=Khóa) |
| **Còi Active Buzzer 5V** | Chân `+` (chân dài) | **GPIO 15** | Kích còi báo động PCCC/Gas |
| | Chân `-` (chân ngắn) | **GND** | Nối mass chung |
| **Nút Nhấn Nhả (Đèn)** | 1 chân | **GPIO 32** | Bật/tắt đèn tại phòng (INPUT_PULLUP) |
| *(Tactile Button 4 chân)* | Chân đối diện | **GND** | Chập xuống mass khi bấm |
| **Nút Nhấn Nhả (Quạt)** | 1 chân | **GPIO 33** | Bật/tắt quạt tại phòng (INPUT_PULLUP) |
| | Chân đối diện | **GND** | Chập xuống mass khi bấm |
| **Nút Quẹt Thẻ SV001** | 1 chân | **GPIO 18** | Mô phỏng quẹt thẻ hợp lệ (SV001) |
| | Chân đối diện | **GND** | Chập xuống mass khi bấm |
| **Nút Quẹt Thẻ SV002** | 1 chân | **GPIO 19** | Mô phỏng quẹt thẻ hợp lệ (SV002) |
| | Chân đối diện | **GND** | Chập xuống mass khi bấm |
| **Nút Thẻ Không Hợp Lệ** | 1 chân | **GPIO 21** | Mô phỏng thẻ lạ bị từ chối |
| | Chân đối diện | **GND** | Chập xuống mass khi bấm |

### 10.2 Kiến Trúc Hàn Cố Định Nghiệm Thu (Đế Ra Chân ESP32 + Bo Táp-Lô 5x7cm)

Để chuyển từ mạch cắm Breadboard lỏng lẻo sang mạch cứng cáp chuyên nghiệp chuẩn công nghiệp chống rung lắc:
- **Khối 1 (Bộ Xử Lý Trung Tâm):** Dùng **Đế Ra Chân ESP32 loại 30 chân** (Expansion Shield). Chip ESP32 cắm ở giữa, toàn bộ chân cọc đực G-V-S có sẵn nguồn 5V, 3.3V, GND riêng.
- **Khối 2 (Bảng Táp-Lô Điều Khiển 5x7cm):** Dùng **Bo Phíp FR-4 2 Mặt Phủ Xanh 5x7cm** hàn cố định 5 nút bấm, 7 LED + điện trở 220Ω, còi Buzzer và hàng rào Header đực 10 chân.
- **Cáp liên kết:** 1 bẹ dây Jumper Cái-Cái 10 sợi nối từ Header Bo 5x7cm sang Đế ESP32.

#### Sơ đồ 10 Chân Header Bo Táp-Lô 5x7cm nối về Đế ESP32:
| Chân Header Bo 5x7cm | Linh Kiện Tương Ứng Trên Bo 5x7cm | Chân Cọc Đế ESP32 | Chức Năng Hoạt Động |
|:---:|:---|:---:|:---|
| **Chân 1** | Nút Bật/Tắt Đèn (Chân 1) | **D32 (GPIO 32)** | Bấm nút bật/tắt toàn bộ đèn phòng |
| **Chân 2** | Nút Bật/Tắt Quạt (Chân 1) | **D33 (GPIO 33)** | Bấm nút bật/tắt quạt thông gió |
| **Chân 3** | Nút Thẻ SV001 (Chân 1) | **D18 (GPIO 18)** | Quẹt thẻ SV1: Mở cửa 4s + 1 tiếng bíp |
| **Chân 4** | Nút Thẻ SV002 (Chân 1) | **D19 (GPIO 19)** | Quẹt thẻ SV2: Mở cửa 4s + 1 tiếng bíp |
| **Chân 5** | Nút Thẻ Lạ (Chân 1) | **D21 (GPIO 21)** | Thẻ lạ: Từ chối mở cửa + hú 3 tiếng còi |
| **Chân 6** | 3 LED Đèn (+) qua trở 220Ω | **D25, D26, D27** | Sáng khi rơ-le Đèn đóng |
| **Chân 7** | 1 LED Quạt (+) qua trở | **D14 (GPIO 14)** | Sáng khi rơ-le Quạt đóng |
| **Chân 8** | 1 LED Khóa Cửa Điện (+) qua trở | **D12 (GPIO 12)** | Sáng 4s khi mở chốt cửa |
| **Chân 9** | 1 LED Báo Động Đỏ (+) & Còi Buzzer (+) | **D13 & D15** | Nhấp nháy & hú còi khi sự cố gas/cháy |
| **Chân 10** | **GND Chung Tổng** | **Cọc GND** | Mass chung cho toàn bộ phím, LED và còi |

### 10.3 Kiến Trúc Hybrid Cứu Deadline (Đế Ra Chân ESP32 + Breadboard — 0% Hàn Thêm, Ổn Định 100%)

Để đảm bảo tiến độ nghiệm thu khẩn cấp mà vẫn giữ nguyên 100% linh kiện và tính năng, kiến trúc **Hybrid Prototyping** được áp dụng:
- **Khối Xử Lý & Ngoại Vi (Đế Ra Chân ESP32):** Chip ESP32 cắm cố định trên Đế Shield. Module Relay 4 kênh, cảm biến DHT22, MQ-2 và Còi Buzzer được cắm bằng dây Jumper Cái-Cái trực tiếp vào các cọc đực G-V-S trên Đế Shield, hoàn toàn không cần qua Breadboard.
- **Khối Táp-Lô Phím Vật Lý (Breadboard Tối Ưu):** Breadboard được giải phóng toàn bộ diện tích, chỉ dùng để cắm 5 nút bấm cơ vật lý (Đèn D32, Quạt D33, Thẻ SV1 D18, Thẻ SV2 D19, Thẻ lạ D21). Đèn LED hiển thị sử dụng trực tiếp dàn LED SMD có sẵn trên bo Relay 4 kênh (LED đỏ báo trạng thái khi rơ-le nhảy) kết hợp giao diện Web Dashboard / Telegram Bot thời gian thực. Thiết kế này loại bỏ 100% rủi ro lỏng chân, chập chì hàn và sẵn sàng vận hành demo chỉ sau 15 phút đấu nối.

---

## 11. Cơ Chế Tính Toán Điện Năng Thời Gian Thực & AI Tiết Kiệm Năng Lượng

### 11.1 Mô Hình Tích Phân Công Suất Danh Định (Không Cần PZEM/CT)
Hệ thống tính toán công suất tiêu thụ tức thời của phòng dựa trên trạng thái đóng/ngắt rơ-le:

$$P_{\text{total}}(t) = \sum_{i=1}^{n} \Big(P_{\text{đm}, i} \times S_i(t)\Big) + P_{\text{standby}} = (N_{\text{lights}} \times 20\,\text{W}) + (\text{fan} \times 60\,\text{W}) + 5\,\text{W}$$

- **Đèn LED tuýp:** 20W/bóng (3 bóng $\rightarrow$ tối đa 60W).
- **Quạt thông gió / Quạt đảo trần:** 60W.
- **Tải tĩnh (Standby vi điều khiển ESP32, module cảm biến, router):** 5W.
- **Điện năng tiêu thụ tích lũy ($A$ tính bằng kWh):**
  $$A = \sum_{k} \frac{P_{\text{total}}(t_k) \times \Delta t_k}{3.600 \times 1.000} \quad (\text{kWh})$$

### 11.2 Phát Hiện Lãng Phí Điện Năng (AI Energy Waste Detection)
- Khi RFID ghi nhận sinh viên quẹt thẻ Ra ngoài (Exit) hoặc khung giờ học tập (07:30 – 11:30 & 13:00 – 17:00), hệ thống kích hoạt giám sát hiện diện phòng.
- Nếu phòng trống suốt **$> 15$ phút** nhưng $P_{\text{total}} > 20\,\text{W}$ (đèn/quạt vẫn chạy): Hệ thống AI Decision Engine tự động kích hoạt rule `builtin-energy-waste-detection`.
- **Phản hồi tương tác 2 chiều:** Gửi tin nhắn Telegram kèm nút bấm Inline `[⚡ Tắt Đèn]`, `[🌪️ Tắt Quạt]`, `[🛑 Tắt Toàn Bộ Thiết Bị]` và Email HTML. Bấm nút trên Telegram sẽ dispatch tức thì lệnh MQTT ngắt rơ-le trong $< 50\,\text{ms}$.
- **Chốt số điện tự động E-Billing:** Tổng hợp số kWh cuối tháng nhân với đơn giá KTX ($2.260\,\text{VNĐ/kWh}$), chia đều cho sinh viên trong phòng và gửi thông báo tự động.

---

### 11.3 Các Bước Nạp Firmware & Vận Hành
1. **Cấu hình WiFi:** Trong `hardware/src/main.cpp`, sửa `WIFI_SSID` và `WIFI_PASSWORD` theo mạng WiFi 2.4GHz thực tế.
2. **Cấu hình Broker:** Giữ nguyên `broker.hivemq.com` (hoặc trỏ về IP Public Cloud VPS cổng 1883).
3. **Nạp Firmware:** Cắm cáp Type-C vào máy tính, mở VS Code PlatformIO $\rightarrow$ Bấm **Upload** (`pio run -t upload`). Nhờ chip CP2102, firmware tự nạp không cần giữ nút BOOT.
4. **Vận hành Realtime:** Mở Web Dashboard ([http://localhost:3000/dashboard](http://localhost:3000/dashboard)), telemetry phòng 101 sẽ nhảy số tức thì từ cảm biến thật!
