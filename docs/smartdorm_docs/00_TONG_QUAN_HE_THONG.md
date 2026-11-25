# 🏠 SmartDorm — Hệ Thống Quản Lý Ký Túc Xá Thông Minh
## Tài Liệu Tổng Quan Toàn Hệ Thống

> **Dự án:** Đề tài nghiên cứu khoa học ĐACNTT2  
> **Phạm vi:** Hệ thống IoT + AI quản lý ký túc xá thông minh đầu-cuối  
> **Trạng thái:** Production-Ready | Docker Containerized | 100% Test Pass  
> **Cập nhật:** 2026-08-26

---

## 📑 Mục Lục Toàn Bộ Tài Liệu

| # | File Tài Liệu | Nội Dung |
|---|---|---|
| 00 | **Tài liệu này** | Tổng quan, kiến trúc, stack công nghệ |
| 01 | 01_KIEN_TRUC_HE_THONG.md | Sơ đồ kiến trúc, luồng dữ liệu, design patterns |
| 02 | 02_PHAN_CUNG_ESP32.md | Firmware ESP32, sơ đồ mạch, GPIO, MQTT |
| 03 | 03_BACKEND_NESTJS.md | API endpoints, modules, WebSocket, MQTT |
| 04 | 04_DATABASE_SCHEMA.md | Schema CSDL đầy đủ, quan hệ, indexes |
| 05 | 05_ML_SERVICE.md | AI/ML models, training, inference API |
| 06 | 06_FRONTEND_NEXTJS.md | UI/UX, các trang, components |
| 07 | 07_HUONG_DAN_CAI_DAT.md | Hướng dẫn cài đặt, chạy, cấu hình |
| 08 | 08_API_REFERENCE.md | Tham chiếu API đầy đủ |
| 09 | 09_DU_LIEU_VA_ML_PIPELINE.md | Dataset, feature engineering, benchmark |
| 10 | 10_KIEM_THU_VA_CHAT_LUONG.md | Test suites, kết quả kiểm thử |

---

## 1. Giới Thiệu Dự Án

**SmartDorm** là hệ thống quản lý ký túc xá thông minh tích hợp IoT + AI được phát triển như một đề tài nghiên cứu khoa học cấp trường. Hệ thống giải quyết các vấn đề thực tiễn trong quản lý ký túc xá:

### Bài Toán Được Giải Quyết

| Vấn Đề | Giải Pháp SmartDorm |
|---|---|
| Lãng phí điện năng khi phòng trống | AI dự báo phụ tải + tự động tắt thiết bị |
| Quản lý an ninh kiểm soát ra vào | Hệ thống RFID + nhật ký thời gian thực |
| Phát hiện sự cố cháy/khí gas chậm | Cảm biến IoT + cảnh báo < 50ms |
| Thiết bị hư hỏng không được phát hiện | AI Isolation Forest giám sát bất thường |
| Quản lý phòng thủ công | Dashboard tập trung + điều khiển từ xa |
| Sinh viên không biết tình trạng phòng | Cổng thông tin riêng với dữ liệu realtime |

---

## 2. Stack Công Nghệ

```
┌─────────────────────────────────────────────────────────────────┐
│                     SMARTDORM TECH STACK                        │
├─────────────────┬───────────────────────────────────────────────┤
│ Tầng           │ Công nghệ                                      │
├─────────────────┼───────────────────────────────────────────────┤
│ Phần cứng      │ ESP32 DevKit V1 (C++/PlatformIO)              │
│                 │ Cảm biến nhiệt độ & độ ẩm DHT22 (GPIO 4)      │
│                 │ Cảm biến khí gas/khói MQ-2 (GPIO 34 ADC)       │
│                 │ Đầu đọc thẻ RFID RC522 (13.56MHz SPI)         │
│                 │ Rơ-le 4 kênh (Đèn GPIO 25, Quạt GPIO 14,      │
│                 │ Khóa cửa GPIO 12, Còi buzzer GPIO 13/15)      │
│                 │ 4 nút bấm điều khiển vật lý (GPIO 32, 33...)  │
│                 │ *Lưu ý: Không có cảm biến đo điện 220V vật lý │
│                 │ (PZEM-004T); điện năng được tính toán từ công │
│                 │ suất định mức thiết bị & vi khí hậu AI.       │
│                 │ Wokwi Digital Twin & Python Room Simulator    │
├─────────────────┼───────────────────────────────────────────────┤
│ Messaging       │ MQTT (Eclipse Mosquitto 2.0) · HiveMQ Fallback│
├─────────────────┼───────────────────────────────────────────────┤
│ Backend API     │ NestJS 10.x (TypeScript)                      │
│                 │ Prisma ORM · Socket.IO WebSocket              │
│                 │ Passport JWT · Swagger/OpenAPI                │
├─────────────────┼───────────────────────────────────────────────┤
│ Cơ sở dữ liệu  │ SQLite (dev) · PostgreSQL 16 (prod)           │
│                 │ InfluxDB 2.7 (time-series telemetry)         │
├─────────────────┼───────────────────────────────────────────────┤
│ AI / ML         │ FastAPI (Python) · Gradient Boosting (GBM)    │
│                 │ Scikit-learn Champion Forecaster              │
│                 │ Isolation Forest · Pandas · NumPy             │
├─────────────────┼───────────────────────────────────────────────┤
│ Frontend UI     │ Next.js 16.3 (React 19, Turbopack)            │
│                 │ TailwindCSS · Recharts · Socket.IO Client     │
│                 │ Lucide Icons                                   │
├─────────────────┼───────────────────────────────────────────────┤
│ DevOps          │ Docker Compose (6 containers)                 │
│                 │ PlatformIO (ESP32 build system)               │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## 3. Các Thành Phần Chính

### 3.1 Phần Cứng & Simulator
- **ESP32 Firmware** (C++/PlatformIO): Chạy trên Wokwi hoặc phần cứng thật
- **Python Room Simulator**: Mô phỏng song song 24 phòng ký túc xá

### 3.2 Backend (NestJS)
- **16 modules** chuyên trách (Auth, Rooms, Devices, Sensors, Emergency, Analytics, Intelligence...)
- **REST API** với prefix `/api` và Swagger UI tại `/api/docs`
- **WebSocket Gateway**: Phát sóng realtime đến tất cả clients
- **MQTT Service**: Nhận dữ liệu từ ESP32, parse và lưu vào DB

### 3.3 AI/ML Microservice (FastAPI Python)
- **Mô hình dự báo năng lượng Champion (GBM)**: Gradient Boosting Machine với Huber Loss (R²=0.961, MAE=8.28 kW)
- **Isolation Forest**: Phát hiện bất thường thiết bị
- **Rule-Proxy Occupancy**: Suy luận mật độ người trong phòng
- **MLOps Pipeline**: Tự động tái huấn luyện và theo dõi độ lệch

### 3.4 Frontend (Next.js)
- **Admin Dashboard**: Quản lý toàn campus
- **Student Portal**: Giao diện riêng cho sinh viên
- **AI Intelligence Center**: 6 phân hệ AI chuyên sâu
- **Copilot Assistant**: Trợ lý AI hỗ trợ phân tích dữ liệu

### 3.5 Cơ Sở Dữ Liệu
- **SQLite** (dev.db): Phát triển cục bộ
- **PostgreSQL 16**: Production (Docker)
- **InfluxDB 2.7**: Chuỗi dữ liệu thời gian (telemetry, sensor data)

---

## 4. Sơ Đồ Kiến Trúc Tổng Quan

```
                    ┌─────────────────────────────────┐
                    │         USERS (Browser)         │
                    │   Admin UI  │  Student Portal   │
                    └──────────────────┬──────────────┘
                                       │ HTTPS / WebSocket
                    ┌──────────────────▼──────────────┐
                    │        FRONTEND (Next.js)        │
                    │         Port 3000               │
                    └──────────────────┬──────────────┘
                                       │ REST API + WS
                    ┌──────────────────▼──────────────┐
                    │       BACKEND (NestJS)           │
                    │         Port 3001               │
                    │  ┌──────────────────────────┐   │
                    │  │  JWT Auth │ REST API      │   │
                    │  │  MQTT Sub │ WebSocket GW  │   │
                    │  └──────────────────────────┘   │
                    └──┬──────────────┬───────────────┘
                       │              │
          ┌────────────▼────┐  ┌──────▼──────────────┐
          │  ML Service     │  │   Databases         │
          │  (FastAPI)      │  │ SQLite/PostgreSQL   │
          │  Port 8000      │  │ InfluxDB Port 8086  │
          └─────────────────┘  └─────────────────────┘
                                         ▲
                    ┌────────────────────┤
                    │   MQTT Broker      │
                    │  (Mosquitto 2.0)   │
                    │   Port 1883        │
                    └────────┬───────────┘
                             │ MQTT Publish
          ┌──────────────────▼─────────────────────┐
          │           ESP32 / Wokwi Simulator       │
          │  DHT22  │  MQ-2  │  RFID  │  LEDs/Buzzer│
          └─────────────────────────────────────────┘
```

---

## 5. Luồng Dữ Liệu Chính

### 5.1 Luồng Telemetry (Sensor → Dashboard)
```
ESP32 DHT22/MQ-2
    → MQTT Publish: dormitory/A/1/101/sensor/data
    → Mosquitto Broker
    → NestJS MQTT Service (subscribe)
    → Parse JSON + Validate
    → Lưu SensorData (SQLite/PostgreSQL)
    → Lưu Measurement (InfluxDB)
    → Emit WebSocket: "sensor:update"
    → Frontend Dashboard cập nhật realtime
```

### 5.2 Luồng Điều Khiển (Dashboard → ESP32)
```
Admin nhấn nút "Bật đèn" trên Dashboard
    → POST /api/devices/{id}/command {action: "on"}
    → Backend xác thực JWT + phân quyền
    → Tạo CommandLog (pending)
    → MQTT Publish: dormitory/A/1/101/command/light {action: "on"}
    → ESP32 nhận lệnh
    → Bật LED GPIO 25,26,27
    → MQTT Publish ACK: dormitory/A/1/101/command/ack
    → Cập nhật CommandLog (success)
    → WebSocket broadcast trạng thái mới
```

### 5.3 Luồng RFID (Quẹt Thẻ → Log)
```
Sinh viên quẹt thẻ RFID tại ESP32
    → Kiểm tra Offline Cache (Preferences NVS)
    → Nếu hợp lệ: Mở cửa (GPIO 12 HIGH), Beep 1 lần
    → MQTT Publish: dormitory/A/1/101/access/rfid
    → Backend: Tìm User theo rfidCardId
    → Lưu AccessLog (authorized: true/false)
    → WebSocket emit: "access:log"
    → Dashboard hiển thị realtime
    → Nếu thẻ lạ: Trigger cảnh báo bảo mật
```

### 5.4 Luồng AI/ML (Dự Báo & Đề Xuất)
```
Backend IntelligenceService
    → POST http://ml-service:8000/ml/forecast/energy
    → ML FastAPI: Gradient Boosting Regressor (GBM Champion) inference
    → Trả về 24-168 điểm dự báo + confidence interval
    → Backend lưu MlPrediction
    → Backend tạo AiRecommendation (nếu cần)
    → WebSocket emit: "ai:forecast-updated"
    → Dashboard hiển thị biểu đồ dự báo
```

---

## 6. Phân Quyền Hệ Thống

```
┌────────────────────────────────────────────────────┐
│                  PHÂN QUYỀN NGƯỜI DÙNG             │
├───────────────┬────────────────────────────────────┤
│ ROLE: ADMIN   │ Quản trị toàn diện campus          │
│               │ - Quản lý phòng, cư dân, thiết bị  │
│               │ - Phân bổ & điều chuyển phòng SV   │
│               │ - Điều khiển tất cả thiết bị từ xa │
│               │ - Xem AI Intelligence & MLOps      │
│               │ - Quản lý an ninh & nhật ký RFID   │
│               │ - Cấu hình Automation Rules        │
│               │ - Phê duyệt AI Recommendations     │
├───────────────┼────────────────────────────────────┤
│ ROLE: STUDENT │ Giới hạn trong phạm vi phòng mình  │
│               │ - Xem cảm biến phòng (realtime)    │
│               │ - Xem thông tin phòng & bạn phòng  │
│               │ - ĐƯỢC điều khiển Đèn/Quạt phòng   │
│               │ - Xem lịch sử quẹt thẻ RFID của mình│
│               │ - Tự cập nhật SĐT, thông tin cá nhân│
│               │ - KHÔNG được xem hoặc điều khiển   │
│               │   thiết bị của các phòng khác      │
└───────────────┴────────────────────────────────────┘
```

---

## 7. Phân Cấp An Toàn (Safety Precedence Hierarchy)

```
Mức 1 CRITICAL SAFETY
       → Cháy nổ, Gas rò rỉ, Thoát hiểm khẩn cấp
       → 100% tất định (Deterministic), KHÔNG bị ML/AI can thiệp
       → Phản hồi < 50ms

Mức 2 SECURITY
       → RFID Access Control (RC522 UID 8 hex), JWT Authentication
       → RBAC (Role-Based Access Control)

Mức 3 OPERATIONAL RULES
       → Rule Engine (nhiệt độ, threshold cứng)
       → Automation Rules (Admin cấu hình)

Mức 4 AI RECOMMENDATIONS
       → Tư vấn tối ưu năng lượng & vi khí hậu
       → Yêu cầu Admin phê duyệt trước khi thực thi
```

---

## 8. Môi Trường Chạy

| Service | Port | URL |
|---|---|---|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (NestJS) | 3001 | http://localhost:3001 |
| ML Service (FastAPI) | 8000 | http://localhost:8000 |
| InfluxDB | 8086 | http://localhost:8086 (Tùy chọn) |
| MQTT Broker | 1883 | mqtt://broker.hivemq.com:1883 (hoặc local:1883) |
| SQLite Database | — | `backend/prisma/dev.db` (chạy trực tiếp) |
| PostgreSQL | 5432 | postgresql://localhost:5432 (Docker prod) |
| Swagger API Docs | 3001 | http://localhost:3001/api/docs |
| ML API Docs | 8000 | http://localhost:8000/docs |

---

## 9. Tài Khoản Chuẩn Của Hệ Thống

| Vai trò | Email | Mật khẩu | MSSV | Phòng mặc định | Mã Thẻ RFID |
|---|---|---|---|---|---|
| **Admin (Quản trị viên)** | `admin@ktx.edu.vn` | `admin123` | ADMIN001 | Toàn quyền quản trị | — |
| **Sinh viên 1** | `sv001@student.edu.vn` | `sinhvien123` | SV2024001 | Phòng A-101 | `CARD_A1B2C3D4` |
| **Sinh viên 2** | `sv002@student.edu.vn` | `sinhvien123` | SV2024002 | Phòng A-101 | `CARD_E5F6G7H8` |
| **Sinh viên 3** | `sv003@student.edu.vn` | `sinhvien123` | SV2024003 | Phòng A-102 | `CARD_I9J0K1L2` |

> *Ghi chú đăng ký mới:* Khi sinh viên mới đăng ký qua Cổng Đăng Ký, hệ thống sẽ tự động gán vai trò `STUDENT`, sinh tự động mã thẻ `CARD_XXXXXXXX` theo thuật toán SHA-256 từ MSSV và chuyển về trang đăng nhập để đăng nhập chính thức.

---

## 10. Thống Kê Hệ Thống

| Chỉ số | Giá trị |
|---|---|
| Tổng số modules Backend | 16 modules NestJS |
| Tổng số API endpoints | ~50 REST endpoints |
| Tổng số trang Frontend | 32 routes Next.js 16 (App Router) |
| Mô hình AI/ML chính thức | 1 Champion GBM (R²=0.9607, MAE=8.28 kW) + 1 Isolation Forest + 1 Occupancy Classifier |
| Dataset training | 103,680 records (12.8 MB) chuẩn hóa |
| Test coverage | 100% (36 Python pytest + 33 NestJS Jest + 15 Integration scenarios) |
| Khởi động nhanh 1-Click | Script PowerShell `start.ps1` giải phóng port và mở đồng bộ toàn bộ service |
| Thời gian build Frontend | ~2.5 giây (Turbopack Next.js 16.3) |
| Tái huấn luyện MLOps | ~10.69 giây |
