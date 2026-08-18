# 🏢 SMARTDORM — Nền Tảng Ký Túc Xá Thông Minh & AI Copilot

> **Smart Dormitory Monitoring, Management & AI Copilot System**  
> Hệ thống IoT & Trí tuệ Nhân tạo toàn diện phục vụ quản lý vi khí hậu, an ninh RFID, năng lượng và hỗ trợ ra quyết định thông minh.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

- 🤖 **SmartDorm AI Copilot (Google Gemini Grounded)**:
  - Kiến trúc trợ lý đa tầng: Intent Router, Phân quyền RBAC, 12 Công cụ Grounding (Read-Only), Cơ chế Fallback cục bộ.
  - Phân quyền nghiêm ngặt: Sinh viên chỉ truy vấn dữ liệu phòng của chính mình; Ban quản lý tra cứu toàn trường.
  - Tách biệt an toàn sinh mạng PCCC (Zero Hardware Control from LLM).
- ⚡ **Quản Lý Năng Lượng & Dự Báo Phụ Tải (Energy & ML Forecasting)**:
  - Dự báo phụ tải đỉnh 24h & 7 ngày bằng **LSTM Neural Network** và **Prophet** (MAE 0.38 kW).
  - Tự động phát hiện dị thường thiết bị (quá tải, kẹt tiếp điểm) qua **Isolation Forest**.
- 👥 **Dự Báo Hiện Diện Sinh Viên (Occupancy Prediction)**:
  - Mô hình **Random Forest Classifier** dự báo tỷ lệ có mặt (89.2%) và danh sách phòng trống.
- 🌡️ **Giám Sát Vi Khí Hậu & An Toàn PCCC (Environmental Safety)**:
  - Cảm biến nhiệt độ, độ ẩm **DHT22** và nồng độ khí gas **MQ-2**.
  - Quy tắc ngắt khẩn cấp và cảnh báo tức thời qua WebSocket / Telegram.
- 🔐 **Kiểm Soát An Ninh Thẻ Từ (RFID RC522 Access Control)**:
  - Nhật ký quẹt thẻ thời gian thực, khóa chốt cửa điện tử tử động.
- 🌐 **Mô Phỏng Wokwi ESP32 Digital Twin**:
  - Tích hợp Digital Twin mô phỏng đầy đủ cảm biến, actuator và kết nối MQTT broker.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

- **Frontend**: Next.js 16 (Turbopack, TypeScript, TailwindCSS, Lucide Icons, Recharts, Framer Motion).
- **Backend**: NestJS 10 (TypeScript, Prisma ORM, Socket.IO Gateway, MQTT Client, Swagger UI).
- **Database**: PostgreSQL & InfluxDB (Time-series telemetry).
- **AI/ML Microservice**: FastAPI Python (Prophet, Scikit-learn, Isolation Forest, Random Forest).
- **Firmware & Simulator**: ESP32 C++ (Wokwi Digital Twin) & Python Device Simulator.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Hệ Thống (Quick Start)

### 1. Khởi động 1 chạm bằng PowerShell:
```powershell
.\start.ps1
```

### 2. Khởi động từng phần thủ công:

#### A. Backend (NestJS):
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev
```
*Backend API: `http://localhost:3001` | Swagger UI: `http://localhost:3001/api/docs`*

#### B. Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```
*Web App: `http://localhost:3000`*

#### C. ML Microservice (FastAPI):
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*ML Service: `http://localhost:8000`*

---

## 🧪 Kiểm Thử Tự Động (Testing)

```bash
# Kiểm thử toàn diện SmartDorm AI Copilot (15 kịch bản)
npm --prefix backend test src/intelligence/copilot/copilot.spec.ts

# Kiểm thử tầng Intelligence & Automation
npm --prefix backend test src/intelligence/intelligence.spec.ts
```

---

## 📖 Tài Liệu Chi Tiết

- [Kiến trúc SmartDorm AI Copilot](docs/SMARTDORM_AI_COPILOT.md)
