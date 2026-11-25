# 🖥️ Backend NestJS — API Server
## Tài Liệu 03 — Backend Layer

---

## 1. Tổng Quan

Backend được xây dựng bằng **NestJS 10.x** (TypeScript) — một framework Node.js kiến trúc enterprise. Backend đóng vai trò trung tâm điều phối toàn bộ hệ thống.

**Port:** `3001`  
**Swagger UI:** `http://localhost:3001/api/docs`  
**API prefix:** `/api`  
**Database ORM:** Prisma Client JS  

---

## 2. Danh Sách Modules

| Module | Đường dẫn | Chức năng |
|---|---|---|
| **AuthModule** | `src/auth/` | Đăng nhập JWT, phân quyền RBAC |
| **PrismaModule** | `src/prisma/` | Kết nối và query database |
| **TelemetryModule** | `src/telemetry/` | Xử lý dữ liệu MQTT → DB → WS |
| **MqttModule** | `src/mqtt/` | MQTT client publish/subscribe |
| **EventsModule** | `src/gateway/` | WebSocket Gateway (Socket.IO) |
| **NotificationsModule** | `src/notifications/` | Hệ thống thông báo |
| **SettingsModule** | `src/settings/` | Cấu hình hệ thống |
| **RoomsModule** | `src/rooms/` | CRUD phòng ký túc xá |
| **BuildingsModule** | `src/buildings/` | CRUD tòa nhà |
| **DevicesModule** | `src/devices/` | Điều khiển thiết bị, Command Pattern |
| **SensorsModule** | `src/sensors/` | Đọc dữ liệu cảm biến |
| **AccessLogModule** | `src/access-log/` | Nhật ký RFID ra vào |
| **EmergencyModule** | `src/emergency/` | Xử lý sự cố khẩn cấp |
| **AnalyticsModule** | `src/analytics/` | Thống kê, báo cáo |
| **IntelligenceModule** | `src/intelligence/` | Trung tâm AI/ML |

---

## 3. Authentication & Authorization

### 3.1 Đăng Nhập (Login)

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@ktx.edu.vn",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmvj0ajjj000pfrtqny0gztmn",
    "email": "admin@ktx.edu.vn",
    "fullName": "Nguyễn Tấn Mạnh",
    "role": "ADMIN",
    "studentId": "ADMIN001"
  }
}
```

**JWT Token:**
- Thuật toán: `HS256`
- Hết hạn: `7 ngày` (configurable)
- Secret: `JWT_SECRET` env variable

### 3.2 Sử Dụng Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Phân Quyền RBAC

```typescript
// Bảo vệ route chỉ cho ADMIN
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('/admin-only-endpoint')
async adminOnly() { ... }

// Route cho cả 2 roles
@UseGuards(JwtAuthGuard)
@Get('/any-authenticated')
async anyUser() { ... }
```

### 3.4 API Endpoints Auth

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | No | Đăng nhập, nhận JWT |
| POST | `/api/auth/register` | No | Đăng ký tài khoản sinh viên (auto role STUDENT & auto RFID UID) |
| GET | `/api/auth/profile` | JWT | Lấy thông tin tài khoản hiện tại kèm phòng lưu trú |
| PATCH | `/api/auth/profile` | JWT | Cập nhật thông tin tài khoản (SĐT, họ tên) |

---

## 4. Rooms API

### Tổng Quan
Quản lý toàn bộ phòng ký túc xá và phân bổ cư dân sinh viên trong hệ thống.

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/rooms` | JWT | Lấy danh sách tất cả phòng |
| GET | `/api/rooms/overview` | JWT | Tổng quan phòng + cảm biến vi khí hậu + thiết bị |
| GET | `/api/rooms/stats` | JWT | Thống kê số phòng, tỷ lệ lấp đầy campus |
| GET | `/api/rooms/residents/all` | JWT | Danh sách tất cả sinh viên lưu trú cho Admin |
| PATCH | `/api/rooms/residents/:userId/assign-room` | ADMIN | **Phân bổ hoặc điều chuyển phòng cho sinh viên** |
| GET | `/api/rooms/:id` | JWT | Chi tiết 1 phòng kèm thiết bị & sinh viên |
| POST | `/api/rooms` | ADMIN | Tạo phòng KTX mới |
| PATCH | `/api/rooms/:id` | ADMIN | Cập nhật thông tin phòng |
| DELETE | `/api/rooms/:id` | ADMIN | Xóa phòng |

**Response GET /api/rooms/overview:**
```json
[
  {
    "id": "clxxx...",
    "roomNumber": "101",
    "floor": 1,
    "capacity": 4,
    "building": { "name": "Tòa A", "address": "..." },
    "users": [
      { "fullName": "Nguyễn Văn An", "studentId": "SV001" }
    ],
    "devices": [
      { "type": "LIGHT", "isOn": true, "isOnline": true },
      { "type": "FAN", "isOn": false, "isOnline": true }
    ],
    "latestSensor": {
      "temperature": 28.5,
      "humidity": 64.0,
      "gasLevel": 18.2
    }
  }
]
```

---

## 5. Devices API

### Tổng Quan
Điều khiển thiết bị trong phòng — đây là tính năng trọng tâm nhất của hệ thống.

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/devices` | JWT | Danh sách thiết bị |
| GET | `/api/devices/:id` | JWT | Chi tiết thiết bị |
| POST | `/api/devices/:id/command` | ADMIN | **Gửi lệnh điều khiển** |
| POST | `/api/devices/:id/undo` | ADMIN | Hoàn tác lệnh cuối |
| GET | `/api/devices/:id/command-logs` | JWT | Lịch sử lệnh |

### Gửi Lệnh Điều Khiển
```http
POST /api/devices/{deviceId}/command
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "on"    // "on" | "off" | "unlock" | "lock"
}
```

**Luồng thực thi:**
```
1. Backend nhận request
2. Kiểm tra JWT + ADMIN role
3. Lấy thông tin thiết bị (loại, phòng)
4. Tạo CommandLog (status: "pending")
5. Build MQTT topic từ thông tin phòng
6. Publish MQTT command
7. Chờ ACK từ ESP32 (timeout 5s)
8. Cập nhật CommandLog (status: "success"/"failed")
9. Cập nhật Device.isOn
10. WebSocket broadcast: device:status
```

### Các Loại Thiết Bị

| Type | Mô Tả | Actions |
|---|---|---|
| `LIGHT` | Đèn chiếu sáng (3 LED) | `on`, `off` |
| `FAN` | Quạt thông gió | `on`, `off` |
| `DOOR_LOCK` | Khóa cửa điện tử | `unlock`, `lock` |
| `BUZZER` | Còi báo động | `on`, `off` |
| `AIR_CON` | Điều hòa không khí | `on`, `off` |

---

## 6. Sensors API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/sensors/recent` | JWT | Dữ liệu cảm biến gần nhất |
| GET | `/api/sensors/room/:id` | JWT | Cảm biến của phòng cụ thể |
| GET | `/api/sensors/history` | JWT | Lịch sử cảm biến (có phân trang) |

**Response GET /api/sensors/recent:**
```json
[
  {
    "id": "...",
    "roomId": "...",
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

---

## 7. Access Log API (RFID)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/access-log` | JWT | Danh sách lịch sử ra vào |
| GET | `/api/access-log/room/:id` | JWT | Lịch sử ra vào của phòng |
| GET | `/api/access-log/recent` | JWT | 20 sự kiện gần nhất |

**Response:**
```json
{
  "data": [
    {
      "id": "...",
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
  "page": 1
}
```

---

## 8. Emergency API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/emergency` | JWT | Danh sách sự cố (filter: resolved) |
| GET | `/api/emergency/:id` | JWT | Chi tiết sự cố |
| PATCH | `/api/emergency/:id/resolve` | ADMIN | Đánh dấu đã xử lý |
| POST | `/api/emergency/test-alert` | ADMIN | Kiểm tra hệ thống cảnh báo |

**Emergency Types:**
- `FIRE`: Cháy nổ
- `GAS_LEAK`: Rò rỉ khí gas
- `INTRUSION`: Xâm nhập trái phép (thẻ lạ)
- `POWER_OUTAGE`: Mất điện

**Emergency Levels:**
- `LOW`: Cảnh báo thông thường
- `MEDIUM`: Cần chú ý
- `HIGH`: Nguy hiểm, cần xử lý sớm
- `CRITICAL`: Khẩn cấp, cần xử lý ngay

---

## 9. Analytics API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/analytics/dashboard` | JWT | KPI tổng quan campus |
| GET | `/api/analytics/energy` | JWT | Thống kê điện năng |
| GET | `/api/analytics/occupancy` | JWT | Thống kê tỷ lệ lưu trú |
| GET | `/api/analytics/rooms` | JWT | Thống kê theo phòng |

**Response GET /api/analytics/dashboard:**
```json
{
  "totalRooms": 24,
  "occupiedRooms": 18,
  "totalResidents": 72,
  "activeDevices": 45,
  "avgTemperature": 28.3,
  "avgHumidity": 65.0,
  "totalEnergyToday": 145.6,
  "openEmergencies": 0,
  "pendingRecommendations": 3
}
```

---

## 10. Intelligence API (AI/ML)

### Tổng Quan

Module Intelligence là lõi AI của hệ thống — điều phối giao tiếp với ML Service và quản lý đề xuất thông minh.

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/intelligence/overview` | ADMIN | Tổng quan AI Intelligence |
| GET | `/api/intelligence/forecast` | ADMIN | Dự báo năng lượng |
| GET | `/api/intelligence/anomalies` | ADMIN | Danh sách thiết bị bất thường |
| GET | `/api/intelligence/occupancy` | JWT | Bản đồ lưu trú |
| GET | `/api/intelligence/models` | ADMIN | Trạng thái models AI |
| GET | `/api/intelligence/recommendations` | ADMIN | AI recommendations |
| PATCH | `/api/intelligence/recommendations/:id/accept` | ADMIN | Chấp nhận đề xuất |
| PATCH | `/api/intelligence/recommendations/:id/dismiss` | ADMIN | Từ chối đề xuất |
| GET | `/api/intelligence/automation-rules` | ADMIN | Danh sách quy tắc tự động |
| POST | `/api/intelligence/automation-rules` | ADMIN | Tạo quy tắc tự động |
| POST | `/api/intelligence/copilot/chat` | JWT | Chat với AI Copilot |

### AI Copilot Chat
```http
POST /api/intelligence/copilot/chat
Authorization: Bearer {token}

{
  "message": "Phòng A101 có đang tiêu thụ điện bất thường không?",
  "context": {
    "roomId": "clxxx...",
    "timeRange": "24h"
  }
}
```

**Response:**
```json
{
  "reply": "Phòng A101 trong 24 giờ qua tiêu thụ **145.6 kWh**, cao hơn mức bình thường **23%**...",
  "sources": ["sensor_data", "ml_forecast"],
  "confidence": 0.87
}
```

---

## 11. WebSocket Events

**Kết nối:** `ws://localhost:3001` (Socket.IO)

### Sự Kiện Server → Client

| Event | Mô Tả | Payload |
|---|---|---|
| `sensor:update` | Dữ liệu cảm biến mới | `{roomId, temperature, humidity, gasLevel, ...}` |
| `access:log` | Sự kiện quẹt thẻ RFID | `{rfidCardId, authorized, action, user, room, timestamp}` |
| `emergency:alert` | Cảnh báo khẩn cấp | `{type, level, roomId, description, ...}` |
| `device:status` | Trạng thái thiết bị thay đổi | `{deviceId, type, isOn, roomId}` |
| `ai:forecast-updated` | Dự báo AI mới | `{roomId, forecastPoints, model}` |
| `ai:anomaly-detected` | Phát hiện thiết bị bất thường | `{deviceId, anomalyScore, severity}` |
| `ai:recommendation-created` | AI tạo đề xuất mới | `{type, title, description, confidence}` |

### Sử Dụng Phía Frontend
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('sensor:update', (data) => {
  console.log('New sensor data:', data.temperature, '°C');
  updateDashboard(data);
});

socket.on('emergency:alert', (alert) => {
  showRedAlert(alert.type, alert.description);
});
```

---

### 12.1 Môi Trường Phát Triển & Demo Cục Bộ (Local Development / 1-Click)

**File:** `backend/.env` (Tự động sinh bởi `start.ps1` hoặc sao chép từ `backend/.env.example`):

```env
# Database (SQLite cục bộ - Zero setup)
DATABASE_URL="file:./dev.db"

# JWT Authentication (Placeholder - Thay bằng secret ngẫu nhiên)
JWT_SECRET=<YOUR_DEV_OR_PROD_JWT_SECRET>
JWT_EXPIRES_IN=7d

# MQTT Broker (HiveMQ Cloud hoặc Local Mosquitto)
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
# Khi chạy Mosquitto local: mqtt://localhost:1883

# ML Service (FastAPI)
ML_SERVICE_URL=http://localhost:8000

# InfluxDB (Tùy chọn - Tự động Fallback sang SQLite nếu chưa có Docker)
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=<YOUR_INFLUXDB_TOKEN>
INFLUXDB_ORG=smart-dormitory
INFLUXDB_BUCKET=smart-dormitory-raw

# Cấu hình Mạng & Server
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 12.2 Môi Trường Triển Khai Production (Cloud / Trường Học)

**File:** `backend/.env.production`:

```env
# Database (PostgreSQL Production với connection pooling)
DATABASE_URL="postgresql://smartdorm_user:<STRONG_DB_PASSWORD>@postgres:5432/smartdorm_db?schema=public&connection_limit=20"

# Bảo mật & Mã hóa
JWT_SECRET=<STRONG_64_CHAR_RANDOM_SECRET>
JWT_EXPIRES_IN=1d

# Cấu hình Mạng & Hostname Nội Bộ / Tên Miền HTTPS
PORT=3001
FRONTEND_URL=https://smartdorm.ktx.edu.vn
ML_SERVICE_URL=http://ml-service:8000
MQTT_BROKER_URL=mqtt://mosquitto:1883
NODE_ENV=production
```

---

## 13. Khởi Động Backend

### Development
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed         # Seed demo data
npm run start:dev          # Watch mode
```

### Production (Docker)
```bash
docker compose up -d backend
```

### Seed Database
```bash
# Seed dữ liệu cơ bản (users, rooms, buildings, devices)
npx ts-node prisma/seed.ts

# Seed dữ liệu demo đầy đủ (AI recommendations, anomalies, predictions)
npx ts-node prisma/seed-demo.ts
```
