# 🏗️ Kiến Trúc Hệ Thống SmartDorm
## Tài Liệu 01 — Thiết Kế & Design Patterns

---

## 1. Tổng Quan Kiến Trúc

SmartDorm áp dụng kiến trúc **Microservices** kết hợp với **Event-Driven Architecture**. Hệ thống được chia thành 5 tầng rõ ràng:

```
┌──────────────────────────────────────────────────────────────────┐
│                    TẦNG PRESENTATION                             │
│          Next.js 16.3 — Admin Dashboard & Student Portal         │
│                    Port 3000 | React 19                          │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ REST / WebSocket (Socket.IO)
┌──────────────────────────────────▼───────────────────────────────┐
│                      TẦNG APPLICATION                            │
│              NestJS 10.x — Backend API Server                    │
│                    Port 3001 | TypeScript                        │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────────┐  │
│   │ REST API│ │WebSocket│ │  MQTT   │ │  Intelligence/ML-    │  │
│   │ /api/*  │ │ Gateway │ │ Service │ │  Client Integration  │  │
│   └─────────┘ └─────────┘ └─────────┘ └──────────────────────┘  │
└────────┬─────────────────────────────────┬───────────────────────┘
         │                                 │
┌────────▼────────┐            ┌───────────▼───────────────────────┐
│  TẦNG AI/ML     │            │        TẦNG DỮ LIỆU              │
│  FastAPI Python │            │  SQLite / PostgreSQL              │
│  Port 8000      │            │  InfluxDB 2.7 (TSDB)             │
│                 │            │  Port 5432 / 8086                │
│  - Prophet      │            └───────────────────────────────────┘
│  - LSTM Neural  │
│  - Isolation    │
│    Forest       │
│  - Occupancy    │
└─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TẦNG IoT / MESSAGING                         │
│                  MQTT Broker (Mosquitto 2.0)                    │
│                   Port 1883 (MQTT) / 9001 (WS)                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   TẦNG PHẦN CỨNG / EDGE                         │
│               ESP32 NodeMCU-32S / Wokwi Simulator               │
│     DHT22 · MQ-2 · RFID BUTTONS · LEDs · Buzzer                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Design Patterns Được Áp Dụng

### 2.1 Observer Pattern — WebSocket Gateway
**Vị trí:** `backend/src/gateway/events.gateway.ts`

Tất cả các trình duyệt Frontend đóng vai trò **Observers** (người quan sát), còn `EventsGateway` là **Subject** (chủ thể phát sự kiện).

```
EventsGateway (Subject)
    ├── sensor:update    → Dashboard cập nhật biểu đồ nhiệt độ/độ ẩm
    ├── access:log       → Dashboard hiển thị quẹt thẻ realtime
    ├── emergency:alert  → Dashboard bật cảnh báo đỏ khẩn cấp
    ├── device:status    → Dashboard cập nhật trạng thái đèn/quạt/cửa
    ├── ai:forecast-updated     → Dashboard cập nhật biểu đồ dự báo
    ├── ai:anomaly-detected     → Dashboard hiển thị thiết bị bất thường
    └── ai:recommendation-created → Dashboard gợi ý tiết kiệm điện
```

**Cách hoạt động:**
1. ESP32 gửi dữ liệu qua MQTT
2. NestJS MQTT Service nhận, xử lý, lưu DB
3. MQTT Service gọi `EventsGateway.emit(event, data)`
4. Tất cả client đang kết nối nhận sự kiện ngay lập tức
5. Frontend React state update → UI render lại

### 2.2 Strategy Pattern — Xử Lý Khẩn Cấp
**Vị trí:** `backend/src/emergency/`

Mỗi loại sự cố có một **Strategy** (chiến lược) xử lý riêng, có thể thay thế nhau mà không ảnh hưởng code gốc:

```typescript
// Cấu trúc Strategy
interface EmergencyStrategy {
  handle(roomId: string, sensorValue: number): Promise<void>;
}

// Các chiến lược cụ thể
class GasLeakStrategy implements EmergencyStrategy {
  // Khi gas > 70%:
  // 1. Mở khóa cửa (thoát hiểm)
  // 2. Bật quạt thông gió tối đa
  // 3. Hú còi báo động
  // 4. Broadcast thông báo sơ tán
  // 5. Ghi Emergency log
}

class FireStrategy implements EmergencyStrategy {
  // 1. Cắt toàn bộ nguồn điện phụ tải
  // 2. Mở tất cả cửa thoát hiểm
  // 3. Gửi thông báo đỏ khẩn cấp
}

class HighTempStrategy implements EmergencyStrategy {
  // Cảnh báo nguy cơ cháy âm ỉ (nhiệt độ > 55°C)
}
```

**Ngưỡng kích hoạt:**
| Loại sự cố | Điều kiện | Mức độ |
|---|---|---|
| Rò rỉ khí gas | `gasLevel > 70%` | CRITICAL |
| Nguy cơ cháy (gas) | `gasLevel > 50%` | HIGH |
| Nhiệt độ nguy hiểm | `temperature > 55°C` | HIGH |
| Cháy nổ | `gasLevel > 90% AND tempAlert = true` | CRITICAL |

### 2.3 Command Pattern — Điều Khiển Thiết Bị
**Vị trí:** `backend/src/devices/command/`

Mọi thao tác điều khiển thiết bị được đóng gói thành **Command objects**:

```typescript
// Interface Command
interface DeviceCommand {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

// Các Command cụ thể
class TurnOnLightCommand implements DeviceCommand {
  constructor(private deviceId: string, private mqttService: MqttService) {}
  
  async execute() {
    await this.mqttService.publish(`${topic}/command/light`, {action: "on"});
  }
  
  async undo() {
    await this.mqttService.publish(`${topic}/command/light`, {action: "off"});
  }
}

// CommandInvoker — quản lý lịch sử và Undo
class CommandInvoker {
  private history: DeviceCommand[] = [];
  
  async executeCommand(cmd: DeviceCommand) {
    await cmd.execute();
    this.history.push(cmd);      // Lưu vào ngăn xếp
  }
  
  async undoLast() {
    const cmd = this.history.pop();
    if (cmd) await cmd.undo();   // Đảo ngược lệnh cuối
  }
}
```

**Các Command được hỗ trợ:**
- `TurnOnLightCommand` / `TurnOffLightCommand`
- `TurnOnFanCommand` / `TurnOffFanCommand`
- `UnlockDoorCommand` / `LockDoorCommand`
- `TurnOnAlarmCommand` / `TurnOffAlarmCommand`

### 2.4 Rule Engine & Decision Engine
**Vị trí:** `backend/src/intelligence/decision-engine/`

#### Rule Engine (Điều Kiện Cứng)
Kiểm tra ngưỡng vật lý để bảo vệ thiết bị — **không thể bị ghi đè**:
```
IF gasLevel > 70 THEN triggerGasLeakProtocol()
IF temperature > 55 THEN triggerFireAlert()
IF rfidCard NOT IN authorizedList THEN denyAccess() + securityAlert()
```

#### Decision Engine (Ba Chế Độ Chính Sách)

| Chế độ | Hành vi | Khi nào dùng |
|---|---|---|
| `RECOMMENDATION_ONLY` | Chỉ đề xuất, Admin duyệt mới thực thi | **Mặc định** — an toàn tuyệt đối |
| `SIMULATION` | Ghi nhật ký ảo, không thực thi | Thống kê tiềm năng tiết kiệm điện |
| `LOW_RISK_AUTO` | Tự động tắt đèn/quạt phòng trống > 30 phút | Tiết kiệm điện tự động |

**Anti-Spam Cooldown:** Ngăn chặn đề xuất giống nhau trong vòng **60 phút**.

---

## 3. Kiến Trúc Module NestJS

```
backend/src/
├── app.module.ts           # Root module — import tất cả modules
├── main.ts                 # Entry point — CORS, Swagger, Global Pipes
│
├── auth/                   # Authentication & Authorization
│   ├── auth.controller.ts  # POST /api/auth/login, /register, /profile
│   ├── auth.service.ts     # JWT generation & validation
│   ├── jwt.strategy.ts     # Passport JWT strategy
│   ├── jwt-auth.guard.ts   # Guard bảo vệ routes
│   ├── roles.guard.ts      # RBAC guard (ADMIN/STUDENT)
│   └── roles.decorator.ts  # @Roles() decorator
│
├── gateway/
│   └── events.gateway.ts   # Socket.IO WebSocket Gateway
│
├── mqtt/
│   └── mqtt.service.ts     # MQTT client — Subscribe & Publish
│
├── prisma/
│   └── prisma.service.ts   # Prisma ORM database client
│
├── telemetry/              # Xử lý dữ liệu telemetry từ MQTT
│   └── telemetry.module.ts # Kết nối MQTT → DB → WebSocket
│
├── rooms/                  # Quản lý phòng ký túc xá
├── buildings/              # Quản lý tòa nhà
├── devices/                # Quản lý & điều khiển thiết bị
├── sensors/                # Dữ liệu cảm biến
├── access-log/             # Nhật ký ra vào RFID
├── emergency/              # Xử lý sự cố khẩn cấp
├── analytics/              # Thống kê & báo cáo
├── notifications/          # Hệ thống thông báo
├── settings/               # Cấu hình hệ thống
│
└── intelligence/           # Trung tâm AI Intelligence
    ├── intelligence.controller.ts  # API endpoints AI
    ├── intelligence.service.ts     # Orchestration logic
    ├── ml-client/          # HTTP client gọi ML Service
    ├── recommendation/     # Quản lý AI Recommendations
    ├── decision-engine/    # Rule Engine + Decision Engine
    ├── automation/         # Automation Rules
    ├── llm/                # AI Copilot Assistant
    └── copilot/            # Chat interface logic
```

---

## 4. Luồng Kết Nối Giữa Các Services

```
                  ┌─────────────────────────────────┐
                  │    IntelligenceService (NestJS)  │
                  │                                 │
                  │  ┌──────────────────────────┐   │
                  │  │     MlClientService      │   │
                  │  │  HTTP → FastAPI :8000    │   │
                  │  └──────────┬───────────────┘   │
                  │             │                   │
                  │  POST /ml/forecast/energy        │
                  │  POST /ml/anomaly/device         │
                  │  POST /ml/predict/occupancy      │
                  │  GET  /ml/model-status           │
                  │  GET  /ml/health                 │
                  └─────────────────────────────────┘
                               │
                  ┌────────────▼────────────────────┐
                  │        ML FastAPI Service        │
                  │         Port 8000               │
                  │                                 │
                  │  ┌────────────────────────────┐  │
                  │  │  InfluxDB Reader           │  │
                  │  │  → smart-dormitory-raw     │  │
                  │  └────────────────────────────┘  │
                  │  ┌────────────────────────────┐  │
                  │  │  SQLite Reader             │  │
                  │  │  → backend/prisma/dev.db   │  │
                  │  └────────────────────────────┘  │
                  └─────────────────────────────────┘
```

---

## 5. MQTT Topic Convention

```
Cấu trúc topic: dormitory/{building}/{floor}/{room}/{type}/{subtopic}

Ví dụ:
  dormitory/A/1/101/sensor/data      ← ESP32 gửi cảm biến
  dormitory/A/1/101/access/rfid      ← ESP32 gửi sự kiện RFID
  dormitory/A/1/101/status           ← ESP32 gửi trạng thái thiết bị
  dormitory/A/1/101/command/light    ← Backend gửi lệnh điều khiển đèn
  dormitory/A/1/101/command/fan      ← Backend gửi lệnh điều khiển quạt
  dormitory/A/1/101/command/door     ← Backend gửi lệnh điều khiển cửa
  dormitory/A/1/101/command/alarm    ← Backend gửi lệnh báo động
  dormitory/A/1/101/command/ack      ← ESP32 xác nhận đã thực hiện lệnh
```

**Payload Sensor Data (JSON):**
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

**Payload Command (JSON):**
```json
{
  "action": "on",
  "command_id": "cmd_abc123"
}
```

**Payload ACK (JSON):**
```json
{
  "command_id": "cmd_abc123",
  "status": "success"
}
```

---

## 6. Cơ Chế Dự Phòng (Fallback & Resilience)

### ESP32 Broker Fallback
```
Primary Broker:  broker.hivemq.com (Port 1883)
Fallback Broker: broker.emqx.io (Port 1883)
Local Broker:    localhost:1883 (Docker Mosquitto)

Cơ chế: Nếu kết nối Primary thất bại 2 lần liên tiếp
         → Tự động chuyển sang Fallback Broker
         → Tiếp tục xoay vòng cho đến khi kết nối thành công
```

### ESP32 Offline Mode
```
Vấn đề: ESP32 mất kết nối WiFi/MQTT tạm thời

Giải pháp:
1. RFID Cache: Lưu danh sách thẻ authorized vào NVS (Preferences)
   - Không cần server → Vẫn mở/khóa cửa được
   
2. Offline Queue: Ghi sự kiện vào SPIFFS (/offline_events.jsonl)
   - Khi kết nối lại → Tự động đồng bộ toàn bộ hàng đợi
```

### ML Service Fallback
```
Nếu FastAPI ML Service không khả dụng:
  → Backend dùng Baseline forecasting nội tại
  → Emergency alerts vẫn hoạt động bình thường (Rule Engine)
  → Dữ liệu cảm biến vẫn lưu đầy đủ
```
