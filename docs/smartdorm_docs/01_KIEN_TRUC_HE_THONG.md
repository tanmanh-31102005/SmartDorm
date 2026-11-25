# 🏗️ Kiến Trúc Hệ Thống SmartDorm
## Tài Liệu 01 — Thiết Kế & Design Patterns

---

## 1. Tổng Quan Kiến Trúc

SmartDorm áp dụng **Kiến trúc Phân tầng IoT Chuẩn Quốc Tế (5-Tier Enterprise IoT Architecture)** kết hợp với **Event-Driven Architecture**. Hệ thống được chuẩn hóa thành 5 tầng rõ ràng với luồng dữ liệu 2 chiều (Telemetry Upstream & Actuator Downstream):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TẦNG 5: TRÌNH DIỄN & NGƯỜI DÙNG (PRESENTATION)           │
│     Next.js 16 (React 19) — Admin Control Center & Student Resident Portal  │
│  - Giám sát An toàn (Gas/Temp)   - Nhật ký quẹt thẻ RFID   - Điều khiển Đèn/Quạt│
└──────────────────────────────────────▲──────────────────────────────────────┘
                                       │ REST API (HTTPS) / WebSocket (Socket.IO)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    TẦNG 4: XỬ LÝ NGHIỆP VỤ & AI (APPLICATION & INTELLIGENCE)│
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │   NESTJS 10.x — BACKEND CORE        │  │  FASTAPI — AI SERVICE        │  │
│  │  - REST Controllers & Auth (JWT)    │  │  - Champion Model: GBM       │  │
│  │  - Strategy Pattern (Xử lý sự cố)   │◄─┤    (Gradient Boosting        │  │
│  │  - Command Pattern (Điều khiển relay│  │     Model - Vi khí hậu &     │  │
│  │  - WebSocket Gateway (Realtime push)│  │     Khả năng hiện diện phòng)│  │
│  │  - MQTT Ingestion Service           │  │  - Feature Pipeline siêu nhẹ │  │
│  └──────────────────┬──────────────────┘  └──────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────────────────────┘
                      │ ORM (Prisma) / Query Interface
┌─────────────────────▼───────────────────────────────────────────────────────┐
│                    TẦNG 3: DỮ LIỆU & LƯU TRỮ (PERSISTENCE & DATA LAYER)     │
│  - Relational Database (SQLite / PostgreSQL): User, Room, RFID Access Logs  │
│  - Time-Series Telemetry Data: Lịch sử Nhiệt độ, Độ ẩm, Khí Gas MQ-2        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       ▲
                                       │ MQTT Ingestion / Pub-Sub
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                    TẦNG 2: TRUYỀN THÔNG & MẠNG (COMMUNICATION / TRANSPORT)  │
│  - Message Broker: Eclipse Mosquitto 2.0 (MQTT Port 1883 / WS 9001)        │
│  - Mạng truyền thông: WiFi 802.11 b/g/n (2.4GHz WPA2)                       │
│  - Topic Taxonomy: dormitory/{building}/{floor}/{room}/[sensor|status|cmd]  │
└──────────────────────────────────────▲──────────────────────────────────────┘
                                       │ Telemetry Data / Actuator Commands
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    TẦNG 1: THIẾT BỊ BIÊN & CẢM BIẾN (PERCEPTION / EDGE)     │
│  - Kiến trúc phần cứng: 2 Khối Độc Lập chuẩn công nghiệp (Hàn cố định / Hybrid)│
│    + Khối 1: Đế Ra Chân ESP32 30 chân (Expansion Shield) cắm ESP32 DevKit V1│
│    + Khối 2: Bo Phíp FR-4 5x7cm (Hàn) HOẶC Breadboard Prototyping (0% hàn)  │
│  - Cảm biến đầu vào: DHT22 (Nhiệt/Ẩm - GPIO 4), MQ-2 (Gas/Khói - GPIO 34 ADC│
│  - Kiểm soát truy cập: Module RFID RC522 (13.56MHz SPI) + Thẻ từ sinh viên  │
│  - Điều khiển cơ: 5 nút nhấn (Đèn GPIO 32, Quạt GPIO 33, Thẻ SV1/SV2/Lạ)   │
│  - Cơ cấu chấp hành & Cảnh báo: Module Rơ-le 4 kênh (Đèn GPIO 25, Quạt      │
│    GPIO 14, Khóa cửa GPIO 12, Báo động GPIO 13), Active Buzzer (GPIO 15)    │
│  - *Nguyên lý năng lượng thời gian thực (Zero Hardware PZEM/CT cost):        │
│    P_total = (N_đèn x 20W) + (Quạt x 60W) + 5W Standby; tích phân kWh tự động│
│  - Bộ nhớ cục bộ: NVS Preferences (Offline Cache) & SPIFFS (Offline Queue)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Luồng dữ liệu chuẩn hóa trong hệ thống:**
1. **Dữ liệu cảm biến đẩy lên (Telemetry Upstream):** Cảm biến $\rightarrow$ ESP32 $\rightarrow$ MQTT (Port 1883) $\rightarrow$ NestJS MQTT Service $\rightarrow$ Prisma DB / TSDB $\rightarrow$ WebSocket Gateway $\rightarrow$ Next.js Dashboard.
2. **Lệnh điều khiển gửi xuống (Command Downstream):** Người dùng thao tác UI $\rightarrow$ REST API / WebSocket $\rightarrow$ NestJS Command Handler $\rightarrow$ MQTT Publish $\rightarrow$ ESP32 nhận lệnh $\rightarrow$ Kích Relay đóng ngắt thiết bị.
3. **Phân tích thông minh (Intelligence Pipeline):** Sensor & Event Data $\rightarrow$ FastAPI GBM Model $\rightarrow$ Dự báo Vi khí hậu & Hiện diện phòng $\rightarrow$ Gửi khuyến nghị tự động lên Web.

---

## 2. Design Patterns Được Áp Dụng

### 2.1 Observer Pattern — WebSocket Gateway
**Vị trí:** `backend/src/gateway/events.gateway.ts`

Tất cả các trình duyệt Frontend đóng vai trò **Observers** (người quan sát), còn `EventsGateway` là **Subject** (chủ thể phát sự kiện).

```
EventsGateway (Subject)
    ├── sensor:update    → Dashboard cập nhật biểu đồ nhiệt độ/độ ẩm/gas
    ├── access:log       → Dashboard hiển thị quẹt thẻ realtime
    ├── emergency:alert  → Dashboard bật cảnh báo đỏ khẩn cấp
    ├── device:status    → Dashboard cập nhật trạng thái đèn/quạt/cửa
    ├── ai:forecast-updated     → Dashboard cập nhật biểu đồ dự báo GBM
    └── ai:recommendation-created → Dashboard gợi ý tối ưu vi khí hậu & an toàn
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

---

## 7. Kiến Trúc Triển Khai Cloud VPS Sản Xuất (Production Cloud VPS Architecture)

Hệ thống SmartDorm được đóng gói theo kiến trúc vi dịch vụ container hóa (Docker Compose), sẵn sàng triển khai trên hạ tầng máy chủ ảo Cloud VPS (Ubuntu 22.04 / 24.04 LTS):

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │                     INTERNET                           │
                                    └──────────────┬──────────────────────────┬──────────────┘
                                                   │ HTTPS (Port 443)         │ MQTT (Port 1883)
                                                   ▼                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ MÁY CHỦ CLOUD VPS (Cấu hình chuẩn: 2 vCPU, 4GB RAM, 50GB NVMe SSD, 1 Static IPv4)         │
│                                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ NGINX REVERSE PROXY & SSL CERTBOT (Let's Encrypt TLS 1.3)                            │  │
│  │   - smartdorm.domain / IP ➔ Port 3000 (Next.js Frontend SSR)                         │  │
│  │   - smartdorm.domain/api ➔ Port 3001 (NestJS Backend REST API)                       │  │
│  │   - smartdorm.domain/socket.io ➔ Port 3001 (WebSocket Realtime Stream)               │  │
│  └──────────────────────┬───────────────────────────────┬───────────────────────────────┘  │
│                         │                               │                                  │
│  ┌──────────────────────▼───────┐  ┌────────────────────▼────────┐  ┌────────────────────┐ │
│  │ smartdorm-frontend           │  │ smartdorm-backend           │  │ smartdorm-mqtt     │ │
│  │ Next.js 16 (Port 3000)       │  │ NestJS 11 (Port 3001)       │  │ Mosquitto 2.0      │ │
│  │ RAM: ~250MB - 350MB          │  │ RAM: ~280MB - 400MB         │  │ (Port 1883 / 9001) │ │
│  └──────────────────────────────┘  └──────┬──────────────────────┘  │ RAM: ~30MB - 50MB  │ │
│                                           │                         └─────────▲──────────┘ │
│                                    ┌──────┴───────┬──────────────┐            │            │
│                                    ▼              ▼              ▼            │ (ESP32 WiFi)
│  ┌────────────────────────┐  ┌─────────────┐┌─────────────┐┌──────────────┐   │            │
│  │ smartdorm-ml-service   │  │ InfluxDB 2.7││ SQLite /    ││ Telegram Bot │   │            │
│  │ FastAPI (Port 8000)    │  │ (Port 8086) ││ PostgreSQL  ││ & SMTP Gmail │───┘            │
│  │ RAM: ~350MB - 500MB    │  │ RAM: ~450MB ││ RAM: ~200MB ││ (2-Way Alert)│                │
│  └────────────────────────┘  └─────────────┘└─────────────┘└──────────────┘                │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Bảng Định Mức Tài Nguyên VPS Thực Tế:
| Container / Dịch vụ | CPU Ước Tính | RAM Thực Tế | Dung Lượng Ổ Cứng | Vai Trò & Nhiệm Vụ |
|---|---|---|---|---|
| **smartdorm-backend** | 0.2 – 0.5 vCPU | ~300 MB | ~500 MB (Image) | API Core, Logic Rơ-le, WebSocket, E-Billing, Telegram |
| **smartdorm-frontend** | 0.2 – 0.4 vCPU | ~300 MB | ~250 MB (Standalone)| Giao diện Admin Control Center & Resident Portal PWA |
| **smartdorm-ml-service** | 0.3 – 0.8 vCPU | ~400 MB | ~800 MB (Scikit/ML) | Model GBM, Isolation Forest, Occupancy RF |
| **smartdorm-influxdb** | 0.2 – 0.5 vCPU | ~450 MB | ~2–5 GB (TSDB Data) | Lưu trữ chuỗi thời gian telemetry vi khí hậu |
| **smartdorm-postgres / SQLite** | 0.1 – 0.3 vCPU | ~200 MB | ~1 GB (Data) | CSDL quan hệ tài khoản, phòng, thiết bị, access log |
| **smartdorm-mqtt (Mosquitto)** | 0.05 – 0.1 vCPU | ~40 MB | ~50 MB (Image) | Broker trung gian nhận telemetry & phát lệnh phần cứng |
| **Nginx + OS Ubuntu 22.04** | 0.1 vCPU | ~350 MB | ~10 GB (HĐH & Logs)| Reverse proxy, định tuyến SSL và tường lửa UFW |
| **TỔNG HỆ THỐNG** | **2 vCPU** | **~2.1 GB RAM** | **~20 GB SSD** | **Khuyến nghị thuê gói 2 vCPU, 4GB RAM, 40-50GB SSD** |

