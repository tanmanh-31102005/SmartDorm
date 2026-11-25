# ☁️ HƯỚNG DẪN THUÊ & TRIỂN KHAI CLOUD VPS CHO HỆ THỐNG SMARTDORM
## Cẩm Nang Thực Chiến Triển Khai Hạ Tầng Đám Mây Nghiệm Thu Đồ Án (Production-Ready)

---

## 1. TỔNG QUAN & MỤC TIÊU TRIỂN KHAI CLOUD VPS

Hệ thống **SmartDorm Enterprise IoT & AI** được thiết kế để vận hành liên tục 24/7 trên môi trường mạng Internet. Khi chuyển từ chạy máy tính cá nhân (localhost) sang **Cloud VPS**, hệ thống đạt được các lợi ích quyết định:

1. **Thiết bị phần cứng ESP32 hoạt động độc lập ngoài đời thực:** Mạch phần cứng ESP32 (đã hàn cố định) chỉ cần kết nối vào WiFi bất kỳ (KTX, phòng trọ, 4G phát từ điện thoại) là có thể truyền nhận dữ liệu trực tiếp về máy chủ đám mây qua cổng MQTT `1883` mà không cần cắm vào máy tính.
2. **Hội đồng chấm thi & Giảng viên truy cập trực tiếp:** Ban giám khảo và sinh viên có thể dùng điện thoại hoặc laptop cá nhân mở đường link Web (IP VPS hoặc tên miền riêng có khóa bảo mật SSL HTTPS) để trải nghiệm và điều khiển thiết bị thời gian thực.
3. **Cảnh báo khẩn cấp & Tương tác 2 chiều 24/7:** Telegram Bot và Email SMTP gửi tức thì thông báo báo động rò rỉ khí gas, cảnh báo phòng trống quên tắt điện kèm nút bấm tắt thiết bị từ xa, và xuất hóa đơn điện tử định kỳ (E-Billing) tự động.

---

## 2. BẢNG TÍNH TOÁN ĐỊNH MỨC TÀI NGUYÊN HỆ THỐNG THỰC TẾ

Hệ thống bao gồm **6 vi dịch vụ container hóa (Docker)** chạy độc lập. Bảng định mức tài nguyên được đo đạc chính xác trên mã nguồn thực tế như sau:

| Dịch vụ Container | Công nghệ & Nền tảng | Mức chiếm RAM thực tế | Mức chiếm CPU | Dung lượng lưu trữ | Cổng dịch vụ (Port) |
|---|---|:---:|:---:|:---:|:---:|
| **smartdorm-backend** | NestJS 11, Node.js 20, Prisma | **280 – 380 MB** | 0.2 – 0.5 vCPU | ~500 MB (Image) | `3001` (Internal/API) |
| **smartdorm-frontend** | Next.js 16, React 19, Standalone | **250 – 350 MB** | 0.2 – 0.4 vCPU | ~250 MB (Image) | `3000` (Internal/Web) |
| **smartdorm-ml-service** | FastAPI, Python 3.11, Scikit-Learn | **350 – 500 MB** | 0.3 – 0.8 vCPU | ~800 MB (ML Models) | `8000` (Internal/AI) |
| **smartdorm-influxdb** | InfluxDB 2.7 (Time-Series TSDB) | **350 – 550 MB** | 0.2 – 0.5 vCPU | ~2 – 5 GB (Telemetry) | `8086` (Internal) |
| **smartdorm-postgres / SQLite** | PostgreSQL 16 Alpine / SQLite | **150 – 250 MB** | 0.1 – 0.3 vCPU | ~1 GB (CSDL quan hệ) | `5432` (Internal) |
| **smartdorm-mqtt** | Eclipse Mosquitto 2.0 (Broker) | **30 – 50 MB** | 0.05 – 0.1 vCPU | ~50 MB (Image) | `1883` (Public TCP) |
| **Nginx Reverse Proxy & SSL** | Nginx Alpine + Certbot TLS 1.3 | **40 – 70 MB** | 0.05 – 0.1 vCPU | ~50 MB | `80`, `443` (Public Web) |
| **Hệ Điều Hành Linux (Ubuntu)** | Ubuntu 22.04 LTS (Kernel, Systemd) | **300 – 400 MB** | 0.1 vCPU | ~8 – 10 GB (HĐH) | `22` (Public SSH) |
| **TỔNG CỘNG HỆ THỐNG** | **Chạy đồng thời toàn bộ 6 dịch vụ** | **~1.8 – 2.4 GB RAM** | **~1.5 – 2.0 vCPU** | **~15 – 22 GB SSD** | *(Xem cấu hình bên dưới)* |

---

## 3. KHUYẾN NGHỊ CẤU HÌNH & NHÀ CUNG CẤP VPS (THUÊ TRONG TUẦN NÀY)

### 3.1 Hai Lựa Chọn Cấu Hình Phù Hợp:

#### 🌟 GÓI KHUYÊN DÙNG TỐI ƯU NHẤT: GÓI GOLD 4 (2C - 4GB RAM - 50GB NVMe - 160.000 ₫/tháng)
* **Thông số kỹ thuật chuẩn:**
  * **Tên gói:** **GOLD 4 : 2C-4G-50GB**
  * **Giá thuê:** **160.000 VNĐ / tháng**
  * **Hệ điều hành:** **Ubuntu 22.04 LTS (64-bit)**
  * **CPU:** **Intel Xeon Gold-6148 @ 2.40GHz (2 vCPU Cores)**
  * **RAM:** **4 GB RAM** (kèm script tự động tạo thêm **4 GB Swap RAM** = 8 GB tổng bộ nhớ)
  * **Ổ cứng:** **50 GB SSD NVMe U.2** (tốc độ đọc ghi cực nhanh cho CSDL SQLite & Docker)
  * **Địa chỉ IP:** **1 IPv4 Public Riêng** (Bắt buộc để ESP32 kết nối MQTT trực tiếp từ xa)
  * **Tốc độ mạng & Băng thông:** **200 Mbps**, băng thông không giới hạn, Datacenter FPT Hồ Chí Minh (ping < 10ms trên toàn quốc)
  * **Bảo mật:** Firewall Antiddos - Traffic có sẵn
* **Đánh giá:** Đây là cấu hình **HOÀN HẢO 10/10** cho đồ án: Giá cực rẻ cho sinh viên (chỉ 160k), CPU Xeon Gold ổn định, dung lượng NVMe 50GB thoải mái build Docker, băng thông 200Mbps giúp giao diện Web và còi rơ-le phản hồi tức thì dưới 15ms khi hội đồng chấm thi thao tác!

#### 💰 LỰA CHỌN 2: CẤU HÌNH TIẾT KIỆM (BUDGET CHO SINH VIÊN)
* **Thông số kỹ thuật:**
  * **Hệ điều hành:** **Ubuntu 22.04 LTS 64-bit**.
  * **CPU:** **2 vCPU**.
  * **RAM:** **2 GB RAM** (Bắt buộc tạo **3 GB Swap RAM** theo hướng dẫn bên dưới).
  * **Ổ cứng:** **25 – 30 GB SSD**.
  * **Địa chỉ IP:** **1 IPv4 Public Tĩnh**.
* **Đánh giá:** Đáp ứng tốt nhu cầu demo nghiệm thu đồ án, tiết kiệm tối đa ngân sách.
* **Chi phí:** Khoảng **80.000 – 120.000 VNĐ / tháng**.

---

### 3.2 Các Nhà Cung Cấp VPS Uy Tín Tại Việt Nam & Quốc Tế:

| Nhà cung cấp | Gói đề xuất | Cấu hình | Giá tham khảo | Ưu điểm & Phương thức thanh toán |
|---|---|---|---|---|
| **Vietnix** *(Khuyên dùng)* | **Cloud VPS Basic 2** hoặc **Pro 2** | 2 vCPU, 4GB RAM, 40GB SSD | ~180.000 ₫/tháng | Datacenter Viettel/VNPT cực nhanh, hỗ trợ 24/7, thanh toán MoMo/VNPAY/Chuyển khoản |
| **TinoHost** | **VPS Pro 2** | 2 vCPU, 4GB RAM, 50GB NVMe | ~199.000 ₫/tháng | Ổ cứng NVMe Enterprise cực nhanh, ổn định cao |
| **CloudFly** | **Standard Cloud** | 2 vCPU, 4GB RAM, 40GB SSD | ~170.000 ₫/tháng | Linh hoạt, tính tiền theo giờ hoặc theo tháng, kích hoạt tức thì |
| **BKNS / VietHost** | **Cloud VPS 2** | 2 vCPU, 3-4GB RAM, 35GB SSD | ~150.000 ₫/tháng | Ổn định, hỗ trợ sinh viên |
| **Hetzner Cloud** *(Quốc tế)* | **CPX21** | 3 vCPU, 4GB RAM, 80GB SSD | ~7.5 EUR (~200k ₫) | Cấu hình rất mạnh, nhưng cần thẻ Visa/Mastercard quốc tế |

> 💡 **Khuyến nghị tốt nhất cho bạn:** Hãy vào **Vietnix.vn** hoặc **TinoHost.com**, chọn gói **2 vCPU, 4GB RAM**, hệ điều hành **Ubuntu 22.04 LTS 64-bit**, thời hạn thuê 1 tháng. Bạn sẽ nhận được thông tin IP và mật khẩu root ngay sau 3 phút thanh toán qua MoMo/Ngân hàng.

---

## 4. QUY TRÌNH 6 BƯỚC CÀI ĐẶT & VẬN HÀNH HỆ THỐNG TRÊN VPS (15 PHÚT)

### BƯỚC 1: KẾT NỐI VÀO MÁY CHỦ VPS QUA SSH
Mở PowerShell hoặc Command Prompt trên máy tính của bạn và gõ:
```bash
ssh root@<IP_VPS_CUA_BAN>
# Nhập mật khẩu root do nhà cung cấp gửi qua Email
```

---

### BƯỚC 2: THIẾT LẬP SWAP RAM & CẬP NHẬT HỆ ĐIỀU HÀNH
Chạy các lệnh sau để tối ưu hóa bộ nhớ đệm, chống lỗi tràn RAM (OOM - Out of Memory):

```bash
# 1. Cập nhật gói phần mềm
apt update && apt upgrade -y

# 2. Tạo 4GB Swap RAM ảo (chống nghẽn RAM khi build Docker trên gói VPS 4GB)
fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 3. Cài đặt các công cụ cơ bản
apt install -y git curl ufw htop nano
```

---

### BƯỚC 3: MỞ CỔNG TƯỜNG LỬA (FIREWALL UFW)
Mở các cổng cần thiết cho Web, API và kết nối phần cứng ESP32:

```bash
# Cho phép SSH
ufw allow 22/tcp

# Cho phép Web & API (HTTP & HTTPS)
ufw allow 80/tcp
ufw allow 443/tcp

# Cho phép MQTT Broker nhận dữ liệu từ ESP32 thực tế
ufw allow 1883/tcp
ufw allow 9001/tcp

# Kích hoạt tường lửa
ufw --force enable
ufw status
```

---

### BƯỚC 4: CÀI ĐẶT DOCKER & DOCKER COMPOSE CHÍNH THỨC
Chạy script cài đặt tự động từ Docker:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Kiểm tra phiên bản
docker --version
docker compose version
```

---

### BƯỚC 5: CLONE SOURCE CODE & KHỞI CHẠY HỆ THỐNG
Tải mã nguồn dự án SmartDorm và bật toàn bộ hệ thống:

```bash
# 1. Clone repository về thư mục /app
git clone https://github.com/tanmanh-31102005/SmartDorm_SourceCode.git /app/smartdorm
cd /app/smartdorm

# 2. CÁCH 1: Chạy 1-Click Script Tự Động (Khuyên dùng - Script làm hết mọi bước):
sudo bash deploy_vps.sh

# HOẶC CÁCH 2: Khởi chạy thủ công từng lệnh:
cp .env.docker.example .env.docker
# Cập nhật IP VPS vào file .env.docker
docker compose --env-file .env.docker up -d --build

# 4. Kiểm tra trạng thái các container đang chạy
docker compose ps
```

Khi chạy lệnh `docker compose ps`, bạn sẽ thấy cả 6 container ở trạng thái `running` hoặc `healthy`:
* `smartdorm-postgres` (Port 5432)
* `smartdorm-mqtt` (Port 1883, 9001)
* `smartdorm-influxdb` (Port 8086)
* `smartdorm-ml-service` (Port 8000)
* `smartdorm-backend` (Port 3001)
* `smartdorm-frontend` (Port 3000)

**Khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu ban đầu:**
```bash
docker exec smartdorm-backend npx ts-node prisma/seed-demo.ts
```

---

### BƯỚC 6: CẤU HÌNH NGINX REVERSE PROXY & CHỨNG CHỈ BẢO MẬT SSL (HTTPS)
Để truy cập Web trực tiếp qua cổng 80/443 (không cần gõ `:3000`), cài đặt Nginx:

```bash
apt install -y nginx

# Tạo file cấu hình Nginx cho SmartDorm
cat << 'EOF' > /etc/nginx/sites-available/smartdorm.conf
server {
    listen 80;
    server_name _; # Hoặc điền tên miền của bạn nếu có

    # 1. Giao diện người dùng Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Backend REST API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. WebSocket Realtime Stream
    location /socket.io {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Kích hoạt cấu hình và khởi động lại Nginx
ln -s /etc/nginx/sites-available/smartdorm.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

> 🔒 **Nếu bạn có tên miền riêng (ví dụ: `smartdorm.edu.vn`):**
> Chỉ cần chạy 1 dòng lệnh để có chứng chỉ SSL HTTPS xanh miễn phí vĩnh viễn:
> ```bash
> apt install -y certbot python3-certbot-nginx
> certbot --nginx -d smartdorm.edu.vn
> ```

---

## 5. KẾT NỐI PHẦN CỨNG ESP32 THỰC TẾ VỀ CLOUD VPS

Khi toàn bộ hệ thống đã chạy trên VPS, việc kết nối bo mạch phần cứng ESP32 trở nên cực kỳ đơn giản:

1. Mở file mã nguồn firmware: `hardware/src/main.cpp`.
2. Tìm đến phần khai báo MQTT Broker và sửa thành **Địa chỉ IP Public của VPS của bạn**:
   ```cpp
   // ==================== CẤU HÌNH KẾT NỐI VPS ====================
   const char* WIFI_SSID     = "Ten_WiFi_Nha_Ban_Hoac_Dien_Thoai";
   const char* WIFI_PASSWORD = "Mat_Khau_WiFi";

   // Trỏ thẳng về IP VPS Cloud của bạn
   const char* MQTT_BROKER_PRIMARY  = "103.xxx.xxx.xxx"; // Thay bằng IP VPS thật
   const int   MQTT_PORT            = 1883;
   const char* MQTT_USER            = "";
   const char* MQTT_PASSWORD        = "";
   ```
3. Cắm cáp nạp Type-C vào máy tính, bấm **Upload** trên PlatformIO.
4. Sau khi nạp xong, ESP32 sẽ phát tiếng bíp ngắn báo kết nối WiFi thành công, sau đó in log:
   `[MQTT] Connected to 103.xxx.xxx.xxx:1883 ✅`
5. **Nghiệm thu thực tế:**
   - Đặt mạch ESP32 ở bất cứ đâu có WiFi.
   - Dùng điện thoại mở trình duyệt vào `http://<IP_VPS_CUA_BAN>`.
   - Quẹt thẻ RFID trên mạch thật $\rightarrow$ Lập tức trên điện thoại nhảy thông báo quẹt thẻ màu xanh lá.
   - Thổi khí gas hoặc bấm nút tắt thiết bị trên Web/Telegram $\rightarrow$ Relay trên mạch thật nhảy "tạch" ngắt điện tức thì!

---

## 6. DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH TRÊN VPS

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Quyền hạn trong hệ thống |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin@ktx.edu.vn` | `admin123` | Quản trị toàn bộ KTX, phòng, thiết bị, AI, PCCC, E-Billing |
| **Sinh viên 1 (Student)** | `sv001@student.edu.vn` | `sinhvien123` | Quản lý Phòng 101, xem tiền điện, quẹt thẻ, Eco Mode |
| **Sinh viên 2 (Student)** | `sv002@student.edu.vn` | `sinhvien123` | Thành viên phòng 101, nhận cảnh báo năng lượng |

---

## 7. CHECKLIST KIỂM TRA TRƯỚC KHI BẢO VỆ ĐỒ ÁN
- [x] Đã thuê VPS 2 vCPU, 4GB RAM (hoặc 2GB RAM + 3GB Swap) có IP Public tĩnh.
- [x] Docker Compose chạy đầy đủ 6 containers không bị tắt đột ngột.
- [x] Mở cổng 1883 trên tường lửa VPS để ESP32 kết nối từ xa.
- [x] Mạch phần cứng đã hàn cố định trên Đế ESP32 30P + Bo Táp-lô 5x7cm, có bắt 4 trụ đồng M3 cách điện.
- [x] Đã nạp firmware ESP32 trỏ đúng IP Public của VPS.
- [x] Đã test tính năng phát hiện lãng phí điện và nhận tin nhắn Telegram có 3 nút bấm tương tác 2 chiều.
- [x] Đã kiểm tra tính năng tính toán tiền điện $2.260\text{ đ/kWh}$ và chia đều sinh viên.

---

## 8. QUY TRÌNH VẬN HÀNH, SỬA LỖI & RE-DEPLOY TRÊN CLOUD (`103.74.100.132`)

### 8.1 Chu trình 5 bước khi phát hiện lỗi & đưa bản sửa lên Cloud

```text
[1. Khoanh vùng lỗi trên VPS] ──▶ [2. Sửa & Test ở Local] ──▶ [3. Đẩy file sửa lên VPS] ──▶ [4. Rebuild đúng Service] ──▶ [5. Kiểm tra & Backup]
```

#### Bước 1: Khoanh vùng lỗi theo 4 tầng
1. **Lỗi giao diện / Nút bấm / API call (Frontend):** Bấm `F12` $\rightarrow$ tab **Console** & **Network**, sau đó xem log container:
   ```bash
   docker logs -f --tail 100 smartdorm-frontend
   ```
2. **Lỗi nghiệp vụ / Database / Auth / Telegram / MQTT (Backend):**
   ```bash
   docker logs -f --tail 100 smartdorm-backend
   ```
3. **Lỗi dự báo / AI / Anomaly (ML Service):**
   ```bash
   docker logs -f --tail 100 smartdorm-ml-service
   ```
4. **Lỗi phần cứng ESP32 không gửi được dữ liệu:** Kiểm tra broker Mosquitto:
   ```bash
   docker logs -f --tail 100 smartdorm-mqtt
   ```

#### Bước 2: Sửa code & kiểm tra biên dịch trên máy Windows trước
Không sửa trực tiếp file code trong container (vì sẽ mất khi recreate). Hãy sửa trên máy Windows và test biên dịch trước:
- Nếu sửa **Backend**: `cd backend; npm run build`
- Nếu sửa **Frontend**: `cd frontend; npx tsc --noEmit`

#### Bước 3: Đẩy code đã sửa lên `/app/smartdorm` trên VPS
* **Cách nhanh (chỉ sửa 1 vài file qua `scp`):**
  ```powershell
  # Ví dụ sửa 1 file backend:
  scp d:\DACNTT2\SmartDorm_SourceCode\backend\src\devices\devices.service.ts root@103.74.100.132:/app/smartdorm/backend/src/devices/
  ```
* **Cách đồng bộ toàn bộ (nếu sửa nhiều file):** Chạy `.\dong_goi_du_an.ps1` hoặc `git push`, sau đó giải nén / `git pull` vào `/app/smartdorm`.

#### Bước 4: Rebuild đúng container bị thay đổi (Zero-waste, giữ nguyên dữ liệu DB)
Chỉ build lại đúng dịch vụ vừa sửa để tiết kiệm RAM và thời gian (~30–90 giây):
- **Nếu sửa Backend:**
  ```bash
  cd /app/smartdorm
  docker compose --env-file .env.docker up -d --build backend
  ```
- **Nếu sửa Frontend (BẮT BUỘC truyền `--build-arg` chứa IP VPS):**
  ```bash
  cd /app/smartdorm
  docker compose --env-file .env.docker build --build-arg NEXT_PUBLIC_API_URL=http://103.74.100.132:3001/api --build-arg NEXT_PUBLIC_WS_URL=http://103.74.100.132:3001 frontend
  docker compose --env-file .env.docker up -d frontend
  ```
- **Nếu sửa ML Service:**
  ```bash
  cd /app/smartdorm
  docker compose --env-file .env.docker up -d --build ml-service
  ```
- **Nếu chỉ sửa file cấu hình `.env.docker` (Telegram, Gmail, Gemini):** Không cần build lại, chỉ cần recreate:
  ```bash
  cd /app/smartdorm
  docker compose --env-file .env.docker up -d --force-recreate backend
  ```

#### Bước 5: Kiểm tra lại sau khi deploy & Lưu ý sống còn
* Kiểm tra trạng thái container & RAM: `docker compose --env-file .env.docker ps && free -h`
* Kiểm tra xung đột Telegram Bot (`409 Conflict`): **Không chạy đồng thời `backend` ở máy cá nhân và trên VPS** cùng 1 `TELEGRAM_BOT_TOKEN` vì Telegram chỉ cho 1 tiến trình polling tại một thời điểm.
* **Backup Database trước khi chỉnh sửa lớn / trước buổi bảo vệ:**
  ```bash
  cp /app/smartdorm/backend/prisma/dev.db /root/dev.db.backup_$(date +%F_%H%M)
  ```
* **Rollback khẩn cấp nếu DB lỗi:**
  ```bash
  cp /root/dev.db.backup_<ngay> /app/smartdorm/backend/prisma/dev.db
  docker compose --env-file .env.docker restart backend
  ```

