# 🚀 Hướng Dẫn Cài Đặt & Vận Hành
## Tài Liệu 07 — Setup & Operations Guide

---

## 1. Yêu Cầu Hệ Thống

### Phần Cứng
| Thành phần | Tối thiểu | Khuyến nghị |
|---|---|---|
| RAM | 8 GB | 16 GB |
| CPU | 4 cores | 8 cores |
| Disk | 20 GB free | 40 GB free |
| OS | Windows 10/11, Ubuntu 20.04+, macOS 12+ |

### Phần Mềm Bắt Buộc
| Phần mềm | Phiên bản | Mục đích |
|---|---|---|
| Docker Desktop | 24.0+ | Chạy containers |
| Docker Compose | v2.20+ | Orchestration |
| Node.js | 20 LTS | Backend + Frontend dev |
| Python | 3.11+ | ML Service dev |
| Git | 2.40+ | Clone source |

### Phần Mềm Tùy Chọn
| Phần mềm | Mục đích |
|---|---|
| PlatformIO (VSCode extension) | Build firmware ESP32 |
| Wokwi VSCode extension | Mô phỏng phần cứng |
| DBeaver / TablePlus | Xem database |
| MQTT Explorer | Debug MQTT topics |

---

## 2. Cài Đặt Nhanh (Docker — Khuyến Nghị)

### Bước 1: Clone Repository
```bash
git clone <repo-url>
cd SmartDorm_SourceCode
```

### Bước 2: Chạy Toàn Bộ Hệ Thống
```bash
# Windows (PowerShell)
.\start.ps1

# Hoặc Docker Compose trực tiếp
docker compose up -d

# Theo dõi logs
docker compose logs -f
```

### Bước 3: Kiểm Tra Containers
```bash
docker compose ps
```

Kết quả mong đợi:
```
NAME                    STATUS          PORTS
smartdorm-postgres      healthy         0.0.0.0:5432->5432/tcp
smartdorm-mqtt          running         0.0.0.0:1883->1883/tcp
smartdorm-influxdb      healthy         0.0.0.0:8086->8086/tcp
smartdorm-ml-service    running         0.0.0.0:8000->8000/tcp
smartdorm-backend       running         0.0.0.0:3001->3001/tcp
smartdorm-frontend      running         0.0.0.0:3000->3000/tcp
```

### Bước 4: Seed Dữ Liệu Demo

```bash
# Seed cơ bản
docker exec smartdorm-backend npx ts-node prisma/seed.ts

# Seed demo đầy đủ (AI data, anomalies, predictions)
docker exec smartdorm-backend npx ts-node prisma/seed-demo.ts
```

### Bước 5: Mở Trình Duyệt
```
Frontend:  http://localhost:3000
Swagger:   http://localhost:3001/api/docs
ML Docs:   http://localhost:8000/docs
InfluxDB:  http://localhost:8086
```

---

## 3. Cài Đặt Phát Triển (Development)

### 3.1 Backend (NestJS)

```bash
cd backend

# Cài dependencies
npm install

# Tạo Prisma client
npx prisma generate

# Tạo database và áp dụng schema
npx prisma db push

# Seed dữ liệu demo
npx ts-node prisma/seed.ts

# Chạy ở chế độ watch (auto-reload)
npm run start:dev
# → Backend: http://localhost:3001
# → Swagger: http://localhost:3001/api/docs
```

**Cấu hình `.env`:**
```env
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
MQTT_BROKER_URL=mqtt://localhost:1883
ML_SERVICE_URL=http://localhost:8000
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=smart-dormitory-super-secret-token-12345
INFLUXDB_ORG=smart-dormitory
INFLUXDB_BUCKET=smart-dormitory-raw
PORT=3001
```

### 3.2 ML Service (FastAPI)

```bash
cd ml-service

# Tạo virtual environment
python -m venv .venv
.venv\Scripts\activate    # Windows
source .venv/bin/activate  # Linux/macOS

# Cài dependencies
pip install -r requirements.txt

# Tạo dataset (nếu chưa có)
python generate_dataset.py

# Validate dataset
python validate_dataset.py

# Huấn luyện models
python -m training.train_forecast
python -m training.train_anomaly
python -m training.train_occupancy

# Chạy server
uvicorn app.main:app --reload --port 8000
# → ML Docs: http://localhost:8000/docs
```

**Cấu hình `.env.example` → `.env`:**
```env
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=smart-dormitory-super-secret-token-12345
INFLUXDB_ORG=smart-dormitory
INFLUXDB_BUCKET=smart-dormitory-raw
DATABASE_URL=sqlite:///./prisma/dev.db
ML_HOST=0.0.0.0
ML_PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3.3 Frontend (Next.js)

```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server
npm run dev
# → Frontend: http://localhost:3000
```

**Cấu hình `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 3.4 Chạy InfluxDB & MQTT (Docker cho Dev)

```bash
# Chỉ chạy database và broker
docker compose up -d postgres influxdb mosquitto

# Kiểm tra InfluxDB health
curl http://localhost:8086/health
```

---

## 4. Chạy Wokwi Simulator

### Option A: Wokwi.com (Online)
1. Vào [wokwi.com](https://wokwi.com)
2. Import `hardware/diagram.json`
3. Copy code từ `hardware/src/main.cpp`
4. Nhấn ▶ Play

### Option B: PlatformIO + Wokwi VSCode
```bash
# Cài PlatformIO CLI
pip install platformio

cd hardware

# Build firmware
pio run

# Mô phỏng Wokwi (cần Wokwi VSCode extension)
pio run -t wokwi
```

### Option C: Python Simulator (Không cần phần cứng)
```bash
cd simulator
pip install -r requirements.txt

# Mô phỏng 24 phòng song song
python simulate_rooms.py

# Mô phỏng nhanh (demo)
python demo_quick.py
```

---

## 5. Script Quản Lý

### `start.ps1` — Khởi Động Hệ Thống
```powershell
# Tự động:
# 1. Kill các process cũ trên port 3000, 3001, 8000
# 2. Clean Docker containers cũ
# 3. Docker compose up -d
# 4. Chờ health check
# 5. Seed database
.\start.ps1
```

### `clean_docker.ps1` — Dọn Dẹp Docker
```powershell
# Dừng và xóa tất cả containers + volumes SmartDorm
.\clean_docker.ps1
```

### `dong_goi_du_an.ps1` — Đóng Gói Bàn Giao
```powershell
# Tạo file ZIP toàn bộ source code (loại bỏ node_modules)
.\dong_goi_du_an.ps1
```

---

## 6. Cấu Hình MQTT

**File:** `mosquitto.conf`
```conf
listener 1883
listener 9001
protocol websockets
allow_anonymous true
```

**Test MQTT connection:**
```bash
# Subscribe (theo dõi)
mosquitto_sub -h localhost -p 1883 -t "dormitory/#" -v

# Publish (gửi lệnh test)
mosquitto_pub -h localhost -p 1883 \
  -t "dormitory/A/1/101/command/light" \
  -m '{"action":"on","command_id":"test123"}'
```

---

## 7. Cấu Hình InfluxDB

**Truy cập:** `http://localhost:8086`  
**Login:** admin / adminpassword123

**Bucket:** `smart-dormitory-raw`  
**Organization:** `smart-dormitory`  
**Token:** `smart-dormitory-super-secret-token-12345`  
**Retention:** 30 ngày

**Kiểm tra dữ liệu qua Flux:**
```flux
from(bucket: "smart-dormitory-raw")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "room_telemetry")
  |> limit(n: 10)
```

---

## 8. Troubleshooting

### Lỗi Port đã được dùng

**Windows (PowerShell):**
```powershell
# Tìm process chiếm cổng 3000
netstat -ano | findstr :3000

# Kill process (thay PID)
taskkill /F /PID 12345
```

**Linux/macOS:**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Backend không kết nối được Database
```bash
# Kiểm tra SQLite file
ls backend/prisma/dev.db

# Nếu không có, tạo lại
cd backend
npx prisma db push
npx ts-node prisma/seed.ts
```

### ML Service lỗi "Model not found"
```bash
cd ml-service
# Chạy lại training
python -m training.train_forecast
python -m training.train_anomaly
python -m training.train_occupancy
```

### Docker container restart loop
```bash
# Xem logs container cụ thể
docker logs smartdorm-backend --tail 50
docker logs smartdorm-ml-service --tail 50

# Rebuild container
docker compose build --no-cache backend
docker compose up -d backend
```

### MQTT không nhận được dữ liệu
```bash
# Kiểm tra Mosquitto đang chạy
docker logs smartdorm-mqtt

# Kiểm tra kết nối với MQTT Explorer
# Topic pattern: dormitory/#
```

### Frontend không load được
```bash
# Xóa cache Next.js
cd frontend
rm -rf .next
npm run dev
```

---

## 9. Verify Hệ Thống Hoạt Động

### Checklist sau khi cài đặt:
```bash
# 1. Backend API
curl http://localhost:3001/api
# Expect: {"message": "Smart Dormitory API"}

# 2. ML Service
curl http://localhost:8000/ml/health
# Expect: {"status": "healthy"}

# 3. InfluxDB
curl http://localhost:8086/health
# Expect: {"status": "pass"}

# 4. Đăng nhập Admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartdorm.com","password":"admin123"}'
# Expect: {"access_token": "eyJ..."}
```

---

## 10. Cấu Hình Production

### Environment Variables Production

**Backend:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://smartdorm:password@postgres:5432/smartdorm_db
JWT_SECRET=<strong-random-secret>
MQTT_BROKER_URL=mqtt://mosquitto:1883
ML_SERVICE_URL=http://ml-service:8000
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_WS_URL=https://api.yourdomain.com
```

### HTTPS Setup (Nginx Reverse Proxy)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
    }
    
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 11. Backup & Restore

### Backup Database
```bash
# SQLite
cp backend/prisma/dev.db backup/dev_$(date +%Y%m%d).db

# PostgreSQL (Docker)
docker exec smartdorm-postgres pg_dump -U smartdorm smartdorm_db > backup/pg_$(date +%Y%m%d).sql

# InfluxDB
docker exec smartdorm-influxdb influx backup /backup
docker cp smartdorm-influxdb:/backup ./backup/influx_$(date +%Y%m%d)
```

### Restore Database
```bash
# SQLite
cp backup/dev_20260826.db backend/prisma/dev.db

# PostgreSQL
cat backup/pg_20260826.sql | docker exec -i smartdorm-postgres psql -U smartdorm smartdorm_db
```
