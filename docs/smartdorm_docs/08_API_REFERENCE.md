# 📋 API Reference — Tham Chiếu API Đầy Đủ
## Tài Liệu 08 — API Documentation

---

## 1. Thông Tin Chung

| Thông số | Giá trị |
|---|---|
| Base URL | `http://localhost:3001/api` |
| Authentication | Bearer JWT Token |
| Content-Type | `application/json` |
| Swagger UI | `http://localhost:3001/api/docs` |

### Cấu Trúc Response Lỗi
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## 2. Authentication

### POST `/auth/login`
**Mô tả:** Đăng nhập và nhận JWT token

**Request Body:**
```json
{
  "email": "admin@ktx.edu.vn",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmvj0ajjj000pfrtqny0gztmn",
    "email": "admin@ktx.edu.vn",
    "fullName": "Nguyễn Tấn Mạnh",
    "role": "ADMIN",
    "studentId": "ADMIN001",
    "roomId": null
  }
}
```

**Response 401:** Email hoặc mật khẩu không đúng

---

### POST `/auth/register`
**Mô tả:** Đăng ký tài khoản sinh viên mới (Hệ thống tự động gán role `STUDENT` và tự sinh mã thẻ RFID chuẩn 8 hex UID)

**Request Body:**
```json
{
  "studentId": "523123456",
  "fullName": "Mạnh Nguyễn",
  "email": "523123456@student.edu.vn",
  "password": "password123",
  "phone": "0901234567",
  "roomId": "optional_room_id"
}
```

**Response 201:**
```json
{
  "message": "Đăng ký tài khoản thành công!",
  "user": {
    "id": "cmvj2k6ju0009shrtz3zbmyg2",
    "studentId": "523123456",
    "fullName": "Mạnh Nguyễn",
    "email": "523123456@student.edu.vn",
    "role": "STUDENT",
    "rfidCardId": "CARD_207B92E2"
  }
}
```

---

### GET `/auth/profile`
**Auth:** JWT required  
**Mô tả:** Lấy thông tin người dùng hiện tại kèm thông tin phòng lưu trú thời gian thực

**Response 200:**
```json
{
  "id": "cmvj0ajjj000pfrtqny0gztmn",
  "email": "sv001@student.edu.vn",
  "fullName": "Nguyễn Văn An",
  "role": "STUDENT",
  "studentId": "SV2024001",
  "rfidCardId": "CARD_A1B2C3D4",
  "phone": "0901234567",
  "roomId": "clroom001",
  "room": {
    "roomNumber": "101",
    "floor": 1,
    "building": { "name": "A" }
  }
}
```

---

## 3. Buildings (Tòa Nhà)

### GET `/buildings`
**Auth:** JWT  
**Response:** Danh sách tòa nhà với số phòng và sinh viên

```json
[
  {
    "id": "clbuild001",
    "name": "Tòa A",
    "address": "Khu A, Ký túc xá",
    "floors": 3,
    "_count": { "rooms": 12 }
  }
]
```

### POST `/buildings`
**Auth:** ADMIN only

```json
{ "name": "Tòa C", "address": "Khu C", "floors": 5 }
```

---

## 4. Rooms (Phòng)

### GET `/rooms`
**Auth:** JWT  
**Query params:**
- `buildingId`: Filter theo tòa nhà
- `floor`: Filter theo tầng
- `isActive`: `true` | `false`

```json
[
  {
    "id": "clroom001",
    "roomNumber": "101",
    "floor": 1,
    "capacity": 4,
    "isActive": true,
    "espDeviceId": "ESP32_A101",
    "building": { "id": "...", "name": "Tòa A" },
    "_count": { "users": 2, "devices": 4 }
  }
]
```

### GET `/rooms/overview`
**Auth:** JWT  
**Mô tả:** Chi tiết đầy đủ với cảm biến mới nhất

```json
[
  {
    "id": "clroom001",
    "roomNumber": "101",
    "floor": 1,
    "building": { "name": "Tòa A" },
    "users": [
      { "fullName": "Nguyễn Văn An", "studentId": "SV001" }
    ],
    "devices": [
      { "type": "LIGHT", "isOn": true, "isOnline": true },
      { "type": "FAN", "isOn": false, "isOnline": true },
      { "type": "DOOR_LOCK", "isOn": false, "isOnline": true }
    ],
    "latestSensor": {
      "temperature": 28.5,
      "humidity": 64.0,
      "gasLevel": 18.2,
      "gasAlert": false,
      "motionDetected": true,
      "recordedAt": "2026-08-26T19:30:00Z"
    }
  }
]
```

### GET `/rooms/residents/all`
**Auth:** JWT (ADMIN)  
**Mô tả:** Lấy danh sách toàn bộ cư dân sinh viên kèm phòng đang ở phục vụ phân bổ phòng

### PATCH `/rooms/residents/:userId/assign-room`
**Auth:** ADMIN only  
**Mô tả:** Phân bổ sinh viên vào phòng KTX hoặc gỡ sinh viên khỏi phòng (truyền `roomId: null`). Tự động bảo đảm mã thẻ RFID tồn tại.

**Request Body:**
```json
{
  "roomId": "cmsvuikqr0008oxv0v03i2odo"  // hoặc null để gỡ phòng
}
```

**Response 200:**
```json
{
  "id": "cmvj2k6ju0009shrtz3zbmyg2",
  "fullName": "Mạnh Nguyễn",
  "studentId": "523123456",
  "roomId": "cmsvuikqr0008oxv0v03i2odo",
  "rfidCardId": "CARD_207B92E2"
}
```

### GET `/rooms/:id`
**Auth:** JWT

### POST `/rooms`
**Auth:** ADMIN

```json
{
  "roomNumber": "104",
  "floor": 1,
  "capacity": 4,
  "buildingId": "clbuild001",
  "espDeviceId": "ESP32_A104"
}
```

### PATCH `/rooms/:id`
**Auth:** ADMIN  
**Body:** Partial room fields

### DELETE `/rooms/:id`
**Auth:** ADMIN

---

## 5. Devices (Thiết Bị)

### GET `/devices`
**Auth:** JWT  
**Query params:**
- `roomId`: Filter theo phòng
- `type`: `LIGHT` | `FAN` | `DOOR_LOCK` | `BUZZER` | `AIR_CON`
- `isOn`: `true` | `false`

```json
[
  {
    "id": "cldev001",
    "name": "Đèn chiếu sáng A101",
    "type": "LIGHT",
    "isOn": true,
    "isOnline": true,
    "roomId": "clroom001",
    "room": { "roomNumber": "101", "building": { "name": "Tòa A" } }
  }
]
```

### POST `/devices/:id/command`
**Auth:** ADMIN  
**Mô tả:** Gửi lệnh điều khiển thiết bị

**Request:**
```json
{ "action": "on" }
```
Hoặc:
```json
{ "action": "off" }
```
Hoặc (chỉ DOOR_LOCK):
```json
{ "action": "unlock" }
```

**Response 200:**
```json
{
  "success": true,
  "commandId": "cmd_abc123",
  "device": { "id": "cldev001", "type": "LIGHT", "isOn": true },
  "mqttPublished": true,
  "ackReceived": true
}
```

### POST `/devices/:id/undo`
**Auth:** ADMIN  
**Mô tả:** Hoàn tác lệnh cuối của thiết bị

### GET `/devices/:id/command-logs`
**Auth:** JWT  
**Mô tả:** Lịch sử lệnh của thiết bị

```json
[
  {
    "id": "clcmd001",
    "commandType": "TURN_ON",
    "payload": "{\"action\":\"on\"}",
    "status": "success",
    "executedAt": "2026-08-26T19:30:00Z",
    "user": { "fullName": "Admin SmartDorm" }
  }
]
```

---

## 6. Sensors (Cảm Biến)

### GET `/sensors/recent`
**Auth:** JWT  
**Query:** `limit` (default: 20)

```json
[
  {
    "id": "clsens001",
    "temperature": 28.5,
    "humidity": 64.0,
    "gasLevel": 18.2,
    "gasAlert": false,
    "tempAlert": false,
    "motionDetected": true,
    "recordedAt": "2026-08-26T19:30:00Z",
    "room": {
      "roomNumber": "101",
      "building": { "name": "Tòa A" }
    }
  }
]
```

### GET `/sensors/room/:roomId`
**Auth:** JWT  
**Query:** `limit`, `from` (ISO datetime), `to` (ISO datetime)

### GET `/sensors/history`
**Auth:** JWT  
**Query:** `roomId`, `from`, `to`, `page`, `limit`

---

## 7. Access Log (Nhật Ký RFID)

### GET `/access-log`
**Auth:** JWT  
**Query:**
- `roomId`: Filter theo phòng
- `authorized`: `true` | `false`
- `from`, `to`: Khoảng thời gian
- `page`, `limit`: Phân trang

```json
{
  "data": [
    {
      "id": "cllog001",
      "rfidCardId": "CARD_A1B2C3D4",
      "action": "entry",
      "authorized": true,
      "timestamp": "2026-08-26T19:30:00Z",
      "user": {
        "fullName": "Nguyễn Văn An",
        "studentId": "SV001"
      },
      "room": {
        "roomNumber": "101",
        "building": { "name": "Tòa A" }
      }
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20
}
```

---

## 8. Emergency (Sự Cố)

### GET `/emergency`
**Auth:** JWT  
**Query:** `resolved` (`true` | `false`), `type`, `level`

```json
[
  {
    "id": "clemerg001",
    "type": "GAS_LEAK",
    "level": "CRITICAL",
    "description": "Nồng độ khí gas vượt ngưỡng 70%",
    "sensorValue": 78.5,
    "isResolved": false,
    "createdAt": "2026-08-26T19:30:00Z",
    "room": {
      "roomNumber": "101",
      "building": { "name": "Tòa A" }
    }
  }
]
```

### PATCH `/emergency/:id/resolve`
**Auth:** ADMIN  
**Body:**
```json
{ "note": "Đã xử lý, mở cửa sổ thông gió" }
```

---

## 9. Analytics (Thống Kê)

### GET `/analytics/dashboard`
**Auth:** JWT  
**Mô tả:** KPI tổng quan campus

```json
{
  "totalRooms": 24,
  "activeRooms": 18,
  "occupiedRooms": 15,
  "totalResidents": 72,
  "activeDevices": 45,
  "avgTemperature": 28.3,
  "avgHumidity": 65.0,
  "totalEnergyToday": 145.6,
  "openEmergencies": 0,
  "pendingRecommendations": 3,
  "lastUpdated": "2026-08-26T19:30:00Z"
}
```

### GET `/analytics/energy`
**Auth:** JWT  
**Query:** `period` (`24h` | `7d` | `30d`), `buildingId`, `roomId`

---

## 10. Intelligence (AI/ML)

### GET `/intelligence/overview`
**Auth:** ADMIN  
**Mô tả:** Tổng quan AI Intelligence Center

```json
{
  "totalActiveRooms": 24,
  "totalActiveDevices": 45,
  "openAnomaliesCount": 3,
  "pendingRecommendationsCount": 5,
  "activeAutomationRulesCount": 2,
  "topRecommendations": [...],
  "modelHealth": [
    {
      "modelName": "energy-gbm-forecaster",
      "status": "ACTIVE",
      "inferenceMs": 8,
      "mae": 8.28,
      "r2Score": 0.9607
    }
  ],
  "occupancySummary": {
    "totalRooms": 24,
    "occupiedCount": 15,
    "vacantCount": 9
  }
}
```

### GET `/intelligence/forecast`
**Auth:** ADMIN  
**Query:** `roomId`, `horizonHours` (default: 24), `model` (`gbm`)

### GET `/intelligence/anomalies`
**Auth:** ADMIN  
**Query:** `status` (`OPEN` | `ACKNOWLEDGED` | `RESOLVED`), `severity`

### GET `/intelligence/occupancy`
**Auth:** JWT  
**Mô tả:** Bản đồ lưu trú tất cả phòng

### GET `/intelligence/models`
**Auth:** ADMIN  
**Mô tả:** Registry tất cả ML models

### GET `/intelligence/recommendations`
**Auth:** ADMIN  
**Query:** `status`, `type`, `severity`, `page`, `limit`

### PATCH `/intelligence/recommendations/:id/accept`
**Auth:** ADMIN

### PATCH `/intelligence/recommendations/:id/dismiss`
**Auth:** ADMIN

### GET `/intelligence/automation-rules`
**Auth:** ADMIN

### POST `/intelligence/automation-rules`
**Auth:** ADMIN

```json
{
  "name": "Auto tắt đèn phòng trống",
  "description": "Tắt đèn khi phòng trống > 30 phút",
  "conditions": [
    {"field": "occupancy.probability", "operator": "lt", "value": 0.1},
    {"field": "duration_minutes", "operator": "gt", "value": 30}
  ],
  "actions": [
    {"action": "turn_off_device", "deviceType": "LIGHT"},
    {"action": "turn_off_device", "deviceType": "FAN"}
  ],
  "priority": 50,
  "cooldownMs": 300000
}
```

### POST `/intelligence/copilot/chat`
**Auth:** JWT

**Request:**
```json
{
  "message": "Phòng A101 tiêu thụ điện hôm nay bao nhiêu?",
  "context": {
    "roomId": "clroom001",
    "timeRange": "24h"
  }
}
```

**Response:**
```json
{
  "reply": "Phòng A101 trong 24 giờ qua tiêu thụ **3.48 kWh** điện năng. Mức này cao hơn baseline trung bình 15% do đèn và quạt bật liên tục từ 18:00-23:00.",
  "sources": ["influxdb_telemetry", "ml_forecast"],
  "confidence": 0.87,
  "timestamp": "2026-08-26T19:30:00Z"
}
```

---

## 11. ML Service API (Port 8000)

### GET `/ml/health`
```json
{
  "status": "healthy",
  "influxdb": "connected",
  "sqlite": "available",
  "version": "1.0.0"
}
```

### POST `/ml/forecast/energy` (Champion GBM)
### POST `/ml/forecast/gbm` (Direct GBM Endpoint)
### POST `/ml/forecast/compare` (GBM Performance Benchmark)
### POST `/ml/anomaly/device`
### POST `/ml/predict/occupancy`
### GET `/ml/model-status`
### POST `/ml/models/promote`

*Chi tiết xem tại: [05_ML_SERVICE.md](./05_ML_SERVICE.md)*

---

## 12. WebSocket Events (Port 3001)

### Kết Nối
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'eyJ...' }  // JWT token
});
```

### Events Server → Client

| Event | Payload Schema |
|---|---|
| `sensor:update` | `{roomId, temp, humidity, gasLevel, gasAlert, motionDetected}` |
| `access:log` | `{rfidCardId, authorized, action, userId, roomId, timestamp}` |
| `emergency:alert` | `{id, type, level, roomId, description, sensorValue, createdAt}` |
| `device:status` | `{deviceId, type, isOn, isOnline, roomId}` |
| `ai:forecast-updated` | `{roomId, model, points, summary}` |
| `ai:anomaly-detected` | `{deviceId, deviceName, anomalyScore, severity, recommendation}` |
| `ai:recommendation-created` | `{id, type, title, severity, confidence, location}` |
