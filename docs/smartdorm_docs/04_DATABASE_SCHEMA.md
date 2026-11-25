# 🗄️ Database Schema — Cơ Sở Dữ Liệu
## Tài Liệu 04 — Data Layer

---

## 1. Kiến Trúc Cơ Sở Dữ Liệu

SmartDorm sử dụng **Hybrid Database Architecture** — kết hợp 2 loại CSDL cho 2 mục đích khác nhau:

```
┌─────────────────────────────────────────────────────────┐
│              HYBRID DATABASE ARCHITECTURE               │
├─────────────────────────┬───────────────────────────────┤
│  SQLite / PostgreSQL    │  InfluxDB 2.7 (TSDB)          │
│  (Relational DB)        │  (Time-Series DB)             │
├─────────────────────────┼───────────────────────────────┤
│ • Dữ liệu quan hệ       │ • Chuỗi thời gian tần suất cao│
│ • Users, Rooms, Devices │ • Nhiệt độ, Độ ẩm, Gas MQ-2   │
│ • Access Logs, Alerts   │ • Công suất & Năng lượng      │
│ • AI Predictions        │ • Tier 1 Raw: 30 ngày (3s)    │
│ • Feature Store (180d)  │ • Tier 2 Aggregate: 180 ngày  │
│ • Automation Rules      │ • Bucket: smart-dormitory-raw │
└─────────────────────────┴───────────────────────────────┘
```

- **Môi trường Dev / Demo / Edge:** SQLite (`backend/prisma/dev.db`) — Khởi chạy 1-click tức thì, zero-configuration.
- **Môi trường Production:** PostgreSQL 16 (Hỗ trợ multi-tenant, connection pooling và transaction an toàn cao).
- **Chiến lược Telemetry Retention:** Tầng thô (Raw) lưu 30 ngày để tối ưu dung lượng RAM/Disk; Tầng tổng hợp (Aggregated/Feature Store trong Relational DB và InfluxDB task) lưu 180 ngày để phục vụ chu kỳ Retraining AI 45–90 ngày.

---

## 2. Schema Đầy Đủ (Prisma)

### 2.1 User (Người Dùng)

```prisma
model User {
  id           String   @id @default(cuid())
  studentId    String   @unique         // Mã sinh viên: "SV001", "ADMIN001"
  fullName     String                   // Họ và tên đầy đủ
  email        String   @unique         // Email đăng nhập
  passwordHash String                   // bcrypt hash
  role         String   @default("STUDENT")  // "ADMIN" | "STUDENT"
  rfidCardId   String?  @unique         // Mã thẻ RFID: "CARD_A1B2C3D4"
  phone        String?                  // Số điện thoại
  isActive     Boolean  @default(true)  // Trạng thái tài khoản
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  roomId String?
  room   Room?   @relation(...)

  accessLogs  AccessLog[]
  commandLogs CommandLog[]
}
```

**Ví dụ dữ liệu:**
| id | studentId | fullName | email | role | rfidCardId |
|---|---|---|---|---|---|
| cmv... | ADMIN001 | Nguyễn Tấn Mạnh | admin@ktx.edu.vn | ADMIN | null |
| cmv... | SV2024001 | Nguyễn Văn An | sv001@student.edu.vn | STUDENT | CARD_A1B2C3D4 |
| cmv... | SV2024002 | Trần Thị Bình | sv002@student.edu.vn | STUDENT | CARD_E5F6G7H8 |

### 2.2 Building (Tòa Nhà)

```prisma
model Building {
  id        String   @id @default(cuid())
  name      String   @unique    // "Tòa A", "Tòa B"
  address   String?             // Địa chỉ
  floors    Int      @default(5) // Số tầng
  createdAt DateTime @default(now())

  rooms Room[]
}
```

### 2.3 Room (Phòng Ở)

```prisma
model Room {
  id               String   @id @default(cuid())
  roomNumber       String              // "101", "102", ...
  floor            Int                 // Số tầng
  capacity         Int      @default(4) // Sức chứa tối đa
  espDeviceId      String?  @unique    // ID thiết bị ESP32 liên kết
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  buildingId String
  building   Building @relation(...)

  users       User[]
  devices     Device[]
  sensorData  SensorData[]
  accessLogs  AccessLog[]
  emergencies Emergency[]

  @@unique([buildingId, roomNumber])  // Số phòng unique trong tòa nhà
}
```

### 2.4 Device (Thiết Bị)

```prisma
model Device {
  id        String   @id @default(cuid())
  name      String              // "Đèn chiếu sáng", "Quạt thông gió"
  type      String              // "LIGHT" | "FAN" | "DOOR_LOCK" | "BUZZER" | "AIR_CON"
  isOn      Boolean  @default(false)    // Trạng thái bật/tắt hiện tại
  isOnline  Boolean  @default(false)    // Có đang kết nối không
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  roomId String
  room   Room   @relation(...)

  commandLogs CommandLog[]
}
```

### 2.5 SensorData (Dữ Liệu Cảm Biến — SQLite)

```prisma
model SensorData {
  id             String   @id @default(cuid())
  temperature    Float?              // Nhiệt độ (°C), nullable nếu đọc lỗi
  humidity       Float?              // Độ ẩm (%)
  gasLevel       Float?              // Nồng độ khí gas (%)
  gasAlert       Boolean  @default(false)  // Đang trong trạng thái báo động gas
  tempAlert      Boolean  @default(false)  // Đang trong trạng thái báo động nhiệt
  motionDetected Boolean  @default(false)  // Phát hiện chuyển động
  recordedAt     DateTime @default(now())

  roomId String
  room   Room   @relation(...)

  @@index([roomId, recordedAt])  // Index để query nhanh theo phòng + thời gian
}
```

> **Lưu ý:** Dữ liệu tần suất cao (mỗi 3 giây từ ESP32) được lưu **chủ yếu vào InfluxDB**. Bảng `SensorData` trong SQLite chỉ lưu snapshot mới nhất để phục vụ API nhanh.

### 2.6 AccessLog (Nhật Ký Ra Vào)

```prisma
model AccessLog {
  id         String   @id @default(cuid())
  rfidCardId String              // Mã thẻ RFID vừa quẹt
  action     String              // "entry" | "denied"
  authorized Boolean  @default(true)  // Được phép hay bị từ chối
  timestamp  DateTime @default(now())

  userId String?
  user   User?   @relation(...)   // null nếu thẻ lạ

  roomId String
  room   Room   @relation(...)

  @@index([roomId, timestamp])
}
```

### 2.7 CommandLog (Lịch Sử Lệnh Thiết Bị)

```prisma
model CommandLog {
  id          String   @id @default(cuid())
  commandType String              // "TURN_ON" | "TURN_OFF" | "UNLOCK" | "LOCK"
  payload     String              // JSON: {"action": "on", "command_id": "..."}
  status      String   @default("pending")  // "pending" | "success" | "failed"
  executedAt  DateTime @default(now())

  deviceId String
  device   Device @relation(...)

  userId String
  user   User   @relation(...)
}
```

### 2.8 Emergency (Sự Cố Khẩn Cấp)

```prisma
model Emergency {
  id          String    @id @default(cuid())
  type        String    // "FIRE" | "GAS_LEAK" | "INTRUSION" | "POWER_OUTAGE"
  level       String    // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  description String?
  sensorValue Float?    // Giá trị cảm biến tại thời điểm phát hiện
  isResolved  Boolean   @default(false)
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())

  roomId String
  room   Room   @relation(...)

  @@index([roomId, createdAt])
}
```

---

## 3. Schema AI/ML

### 3.1 MlModel (Registry Model AI)

```prisma
model MlModel {
  id           String    @id @default(cuid())
  modelName    String    // "energy-baseline" | "energy-gbm" (Champion) | "device-anomaly-iforest" | "occupancy-classifier"
  modelType    String    // "FORECAST" | "ANOMALY" | "OCCUPANCY"
  version      String    @default("v1")
  status       String    @default("EXPERIMENTAL")  // "EXPERIMENTAL" | "ACTIVE" | "DEPRECATED"
  trainedAt    DateTime  @default(now())
  datasetStart DateTime? // Dữ liệu training từ ngày...
  datasetEnd   DateTime? // Dữ liệu training đến ngày...
  metrics      String?   // JSON: {mae, rmse, mape, f1, accuracy, inferenceMs}
  artifactPath String?   // Đường dẫn file .joblib model
  inferenceMs  Int?      // Độ trễ suy luận (ms)
  notes        String?

  predictions MlPrediction[]
}
```

**Ví dụ metrics:**
```json
{
  "mae": 28.73,
  "rmse": 37.21,
  "mape": 20.91,
  "r2": 0.6517,
  "inferenceMs": 12
}
```

### 3.2 MlPrediction (Kết Quả Dự Báo)

```prisma
model MlPrediction {
  id             String   @id @default(cuid())
  modelId        String
  model          MlModel  @relation(...)
  roomId         String?
  buildingId     String?
  predictionType String   // "ENERGY_FORECAST" | "ANOMALY_SCORE" | "OCCUPANCY"
  inputData      String   // JSON — input features
  outputData     String   // JSON — prediction result
  confidence     Float?   // 0.0 - 1.0
  dataSource     String   @default("SIMULATION_DATA")  // "SIMULATION_DATA" | "WOKWI" | "REAL_DEVICE"
  createdAt      DateTime @default(now())

  @@index([roomId, createdAt])
  @@index([predictionType, createdAt])
}
```

### 3.3 DeviceAnomaly (Bất Thường Thiết Bị)

```prisma
model DeviceAnomaly {
  id             String    @id @default(cuid())
  deviceId       String?
  deviceName     String
  roomId         String
  anomalyScore   Float     // 0.0 - 1.0 (Isolation Forest output)
  severity       String    @default("WARNING")  // "NORMAL" | "WARNING" | "HIGH" | "CRITICAL"
  features       String    // JSON: {powerW, responseMs, failureRate, uptime}
  status         String    @default("OPEN")  // "OPEN" | "ACKNOWLEDGED" | "RESOLVED"
  recommendation String?   // Hành động gợi ý
  detectedAt     DateTime  @default(now())
  resolvedAt     DateTime?

  @@index([roomId, detectedAt])
  @@index([status, severity])
}
```

**Ví dụ features JSON:**
```json
{
  "powerW": 450.0,
  "responseMs": 2800,
  "failureRate": 0.23,
  "uptime": 168.5
}
```

### 3.4 OccupancyPrediction (Dự Báo Lưu Trú)

```prisma
model OccupancyPrediction {
  id                  String   @id @default(cuid())
  roomId              String
  occupiedProbability Float    // 0.0 - 1.0 (xác suất có người)
  predictedState      String   // "OCCUPIED" | "VACANT"
  features            String   // JSON: {rfidEntries, deviceState, hour, dayOfWeek}
  source              String   @default("RULE_PROXY")  // "RULE_PROXY" | "ML_MODEL"
  createdAt           DateTime @default(now())

  @@index([roomId, createdAt])
}
```

### 3.5 AiRecommendation (Đề Xuất AI)

```prisma
model AiRecommendation {
  id             String    @id @default(cuid())
  type           String    // "ENERGY" | "DEVICE" | "SECURITY" | "OCCUPANCY" | "MAINTENANCE"
  severity       String    @default("WARNING")  // "INFO" | "WARNING" | "CRITICAL"
  title          String
  description    String
  location       String?   // buildingId hoặc roomId
  reason         String    // Lý do tại sao được tạo
  recommendation String    // Hành động cần thực hiện
  confidence     Float?    // 0.0 - 1.0
  evidence       String?   // JSON: raw data
  status         String    @default("PENDING")  // "PENDING" | "ACCEPTED" | "DISMISSED" | "EXECUTED"
  acceptedBy     String?
  acceptedAt     DateTime?
  dismissedAt    DateTime?
  executedAt     DateTime?
  executionResult String?
  expiresAt      DateTime? // Hết hạn (không còn liên quan sau thời điểm này)
  createdAt      DateTime  @default(now())

  @@index([status, createdAt])
  @@index([type, status])
}
```

**Ví dụ:**
```json
{
  "type": "ENERGY",
  "severity": "WARNING",
  "title": "Phòng B202 tiêu thụ điện bất thường",
  "description": "Phòng B202 tiêu thụ 145 W lúc 2:00 sáng trong khi phòng có khả năng đang trống.",
  "reason": "AI phát hiện công suất > baseline 23% trong 3 giờ liên tiếp khi xác suất lưu trú < 15%",
  "recommendation": "Kiểm tra xem quạt/đèn có đang được để bật không. Tắt thiết bị nếu phòng trống.",
  "confidence": 0.87,
  "status": "PENDING"
}
```

### 3.6 AutomationRule (Quy Tắc Tự Động)

```prisma
model AutomationRule {
  id          String    @id @default(cuid())
  name        String
  description String?
  conditions  String    // JSON array điều kiện
  actions     String    // JSON array hành động
  priority    Int       @default(50)    // 1 = cao nhất, 100 = thấp nhất
  enabled     Boolean   @default(false) // PHẢI Admin bật thủ công
  cooldownMs  Int       @default(300000) // 5 phút cooldown giữa 2 lần kích hoạt
  lastTriggeredAt DateTime?
  createdBy   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  executions AutomationExecution[]
}
```

**Ví dụ conditions/actions:**
```json
// Điều kiện
[
  {"field": "occupancy.probability", "operator": "lt", "value": 0.1},
  {"field": "duration_minutes", "operator": "gt", "value": 30}
]

// Hành động
[
  {"action": "turn_off_device", "deviceType": "LIGHT"},
  {"action": "turn_off_device", "deviceType": "FAN"},
  {"action": "send_notification", "message": "Tự động tắt thiết bị phòng trống"}
]
```

---

## 4. InfluxDB — Time-Series Data

### Bucket: `smart-dormitory-raw`

**Cấu trúc measurement:**
```
Measurement: "room_telemetry"
Tags:
  - room_id:       ID phòng (filter nhanh)
  - building_name: Tên tòa nhà
  - source:        "WOKWI" | "SIMULATOR" | "REAL_DEVICE"

Fields:
  - temperature:   float (°C)
  - humidity:      float (%)
  - gas_level:     float (%)
  - power_w:       float (Watts)
  - energy_kwh:    float (kWh, cumulative)
  - light_on:      boolean
  - fan_on:        boolean
  - door_locked:   boolean
  - motion:        boolean

Timestamp: Unix nanoseconds (UTC)
```

**Ví dụ Flux Query:**
```flux
// Lấy dữ liệu nhiệt độ phòng A101 trong 24 giờ qua
from(bucket: "smart-dormitory-raw")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "room_telemetry")
  |> filter(fn: (r) => r.room_id == "cla...")
  |> filter(fn: (r) => r._field == "temperature")
  |> aggregateWindow(every: 15m, fn: mean)
```

**Retention Policy (Chính sách lưu trữ phân tầng):**
- **Bucket `smart-dormitory-raw`:** 30 ngày (Dữ liệu chuỗi thời gian chi tiết 3s để phân tích realtime & cảnh báo khẩn cấp).
- **Relational DB Feature Store (`SensorData`) / InfluxDB Downsampled:** 180 ngày (Dữ liệu lấy mẫu trung bình 15m/1h để đảm bảo pipeline retraining AI có đủ cửa sổ huấn luyện 45–90 ngày mà không bị giới hạn bởi chu kỳ dọn dẹp raw data).

---

## 5. Quan Hệ Giữa Các Bảng

```
Building ──< Room ──< User
                 ├──< Device ──< CommandLog
                 ├──< SensorData
                 ├──< AccessLog >── User
                 └──< Emergency

MlModel ──< MlPrediction
DeviceAnomaly (standalone, roomId as string ref)
OccupancyPrediction (standalone, roomId as string ref)
AiRecommendation (standalone, location as string ref)
AutomationRule ──< AutomationExecution
```

---

## 6. Indexes & Performance

| Bảng | Index | Mục đích |
|---|---|---|
| `sensor_data` | `(roomId, recordedAt)` | Query sensor theo phòng + thời gian |
| `access_logs` | `(roomId, timestamp)` | Lọc nhật ký theo phòng + thời gian |
| `emergencies` | `(roomId, createdAt)` | Truy vấn sự cố theo phòng |
| `ml_predictions` | `(roomId, createdAt)` | Lấy prediction mới nhất theo phòng |
| `ml_predictions` | `(predictionType, createdAt)` | Lọc theo loại prediction |
| `device_anomalies` | `(roomId, detectedAt)` | Truy vấn bất thường theo phòng |
| `device_anomalies` | `(status, severity)` | Lọc theo trạng thái + mức độ |
| `ai_recommendations` | `(status, createdAt)` | Lấy pending recommendations |
| `ai_recommendations` | `(type, status)` | Lọc theo loại + trạng thái |
| `automation_executions` | `(ruleId, executedAt)` | Lịch sử thực thi theo quy tắc |

---

## 7. Seed Data

### Demo Users (từ `prisma/seed.ts`)
| Tài khoản | Họ và Tên | Vai trò | MSSV | Phòng | Mã RFID |
|---|---|---|---|---|---|
| `admin@ktx.edu.vn` | Nguyễn Tấn Mạnh | ADMIN | ADMIN001 | — | — |
| `sv001@student.edu.vn` | Nguyễn Văn An | STUDENT | SV2024001 | A101 | CARD_A1B2C3D4 |
| `sv002@student.edu.vn` | Trần Thị Bình | STUDENT | SV2024002 | A101 | CARD_E5F6G7H8 |
| `sv003@student.edu.vn` | Lê Văn Cường | STUDENT | SV2024003 | A102 | CARD_I9J0K1L2 |
| `sv004@student.edu.vn` | Phạm Minh Đức | STUDENT | SV2024004 | A101 | CARD_M3N4O5P6 |

### Demo Rooms
- **Tòa A:** A101, A102, A103 (Tầng 1)
- **Tòa B:** B204 (Tầng 2)
- **Tòa C:** C301 (Tầng 3)

### Demo Devices (mỗi phòng)
- 1 đèn chiếu sáng (LIGHT)
- 1 quạt thông gió (FAN)
- 1 khóa cửa (DOOR_LOCK)
- 1 còi báo động (BUZZER)

---

## 8. Migrations

```bash
# Development — áp dụng schema mới (có thể mất dữ liệu)
npx prisma db push

# Production — tạo và áp dụng migration files
npx prisma migrate dev --name "add_ai_tables"
npx prisma migrate deploy

# Xem trạng thái migration
npx prisma migrate status

# Reset database (xóa toàn bộ, tạo lại)
npx prisma migrate reset
```
