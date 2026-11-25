# 🖥️ Frontend Next.js — Giao Diện Người Dùng
## Tài Liệu 06 — Frontend Layer

---

## 1. Tổng Quan

Frontend được xây dựng bằng **Next.js 16.3** với App Router, React 19, và TailwindCSS. Giao diện bao gồm 2 phân hệ người dùng chính:
1. **Admin Dashboard (`/dashboard`)** — Quản trị toàn campus (Phòng, Cư dân, Thiết bị, An ninh, AI Center)
2. **Student Portal (`/student`)** — Cổng thông tin & điều khiển thiết bị phòng dành cho sinh viên

**Port:** `3000`  
**Build time:** ~2.5 giây (Turbopack Next.js 16.3)  
**Total routes:** 32 routes tĩnh & động

---

## 2. Cấu Trúc Routes Chuẩn Hóa

```
frontend/src/app/
├── page.tsx                      # Trang chủ (redirect thông minh đến /login)
├── layout.tsx                    # Root layout (ToastProvider, Inter Font)
├── globals.css                   # Core Design System & Tokens
│
├── login/
│   └── page.tsx                  # Đăng nhập & Đăng ký sinh viên mới
│
├── dashboard/                    # CỔNG QUẢN TRỊ (ADMIN DASHBOARD)
│   ├── layout.tsx                # Admin layout (Topbar, Sidebar, Realtime Indicator)
│   ├── page.tsx                  # Trang tổng quan campus (KPIs, Biểu đồ)
│   │
│   ├── rooms/
│   │   └── page.tsx              # Quản lý phòng KTX & Phân bổ trực tiếp SV
│   ├── residents/
│   │   └── page.tsx              # Quản lý hồ sơ cư dân sinh viên
│   ├── buildings/
│   │   └── page.tsx              # Quản lý các tòa nhà A, B, C
│   ├── devices/
│   │   └── page.tsx              # Giám sát & Điều khiển thiết bị IoT toàn campus
│   ├── security/
│   │   └── page.tsx              # Giám sát an ninh thẻ RFID & cảnh báo thẻ lạ
│   ├── environment/
│   │   └── page.tsx              # Giám sát vi khí hậu (DHT22, Gas MQ-2)
│   ├── emergency/
│   │   └── page.tsx              # Quản lý sự cố khẩn cấp (PCCC, Rò rỉ khí gas)
│   ├── analytics/
│   │   └── page.tsx              # Phân tích phụ tải & tỷ lệ lấp đầy phòng
│   ├── alerts/
│   │   └── page.tsx              # Trung tâm cảnh báo sự cố toàn trường
│   ├── access-log/
│   │   └── page.tsx              # Nhật ký quẹt thẻ RFID chi tiết thời gian thực
│   ├── reports/
│   │   └── page.tsx              # Báo cáo định kỳ & Xuất dữ liệu
│   ├── settings/
│   │   └── page.tsx              # Cấu hình ngưỡng cảnh báo & hệ thống
│   │
│   └── intelligence/             # TRUNG TÂM TRÍ TUỆ NHÂN TẠO (AI CENTER)
│       ├── page.tsx              # Tổng quan các phân hệ AI
│       ├── anomalies/
│       │   └── page.tsx          # Danh sách thiết bị bất thường (Isolation Forest)
│       ├── occupancy/
│       │   └── page.tsx          # Bản đồ lưu trú & hiện diện phòng (Classifier)
│       ├── models/
│       │   └── page.tsx          # MLOps — Giám sát chỉ số Champion GBM
│       ├── recommendations/
│       │   └── page.tsx          # Đề xuất tối ưu hóa vi khí hậu & tải điện
│       └── assistant/
│           └── page.tsx          # Trợ lý AI Copilot hỗ trợ phân tích dữ liệu
│
└── student/                      # CỔNG DỊCH VỤ SINH VIÊN (STUDENT PORTAL)
    ├── layout.tsx                # Student layout (Đồng bộ thời gian thực thông tin phòng)
    ├── dashboard/
    │   └── page.tsx              # Bảng điều khiển sinh viên (Telemetry phòng mình)
    ├── room/
    │   └── page.tsx              # Hồ sơ phòng KTX & Danh sách bạn cùng phòng
    ├── devices/
    │   └── page.tsx              # Điều khiển Đèn & Quạt phòng của tôi
    ├── access-history/
    │   └── page.tsx              # Lịch sử quẹt thẻ RFID cá nhân
    ├── alerts/
    │   └── page.tsx              # Cảnh báo sự cố phòng mình
    ├── profile/
    │   └── page.tsx              # Thông tin cá nhân, cập nhật SĐT, xem mã RFID
    └── settings/
        └── page.tsx              # Cài đặt giao diện & thông báo cá nhân
```

---

## 3. Admin Dashboard — Mô Tả Chi Tiết

### 3.1 Trang Tổng Quan (`/dashboard`)

**Thông tin hiển thị:**
- **KPI Cards (realtime):**
  - Tổng số phòng / Phòng đang có người
  - Tổng sinh viên / Thiết bị đang hoạt động
  - Nhiệt độ trung bình / Độ ẩm trung bình
  - Điện năng tiêu thụ hôm nay
  - Số sự cố đang mở / Đề xuất AI chờ duyệt

- **Bản đồ Phòng (Room Grid):**
  - Hiển thị trạng thái tất cả phòng theo màu sắc
  - Xanh lá: Phòng bình thường
  - Vàng: Phòng có cảnh báo nhẹ
  - Đỏ: Phòng có sự cố khẩn cấp

- **Biểu đồ Nhiệt độ Realtime:** Line chart cập nhật mỗi 3 giây
- **Biểu đồ Năng lượng (24h/7d/30d):** Area chart với filter period
- **Feed Sự kiện Realtime:** 20 sự kiện gần nhất (RFID, sensor alerts)
- **Wokwi Panel:** Nhúng iframe điều khiển ESP32 Wokwi trực tiếp

**WebSocket Events Lắng Nghe:**
```typescript
socket.on('sensor:update', updateSensorDisplay);
socket.on('access:log', addToRealtimeFeed);
socket.on('emergency:alert', showRedAlert);
socket.on('device:status', updateRoomStatus);
```

### 3.2 Quản Lý Phòng (`/dashboard/rooms`)

**Tính năng:**
- Danh sách phòng với filter theo tòa nhà, tầng, trạng thái
- Chi tiết từng phòng: sinh viên đang ở, thiết bị, cảm biến
- Xem lịch sử cảm biến 24h của phòng
- Thêm/Sửa/Xóa phòng (ADMIN)
- Gán sinh viên vào phòng
- Liên kết ESP32 Device ID

### 3.3 Điều Khiển Thiết Bị (`/dashboard/devices`)

**Tính năng:**
- Grid tất cả thiết bị, filter theo phòng / loại / trạng thái
- Toggle bật/tắt từng thiết bị với 1 click
- Nút "Hoàn tác" (Undo) lệnh vừa thực hiện
- Xem lịch sử lệnh của từng thiết bị
- Trạng thái online/offline của từng thiết bị

**Component điều khiển:**
```typescript
// Gửi lệnh bật đèn
const handleCommand = async (deviceId: string, action: 'on' | 'off') => {
  await api.post(`/devices/${deviceId}/command`, { action });
  // WebSocket sẽ cập nhật UI tự động
};

// Hoàn tác lệnh cuối
const handleUndo = async (deviceId: string) => {
  await api.post(`/devices/${deviceId}/undo`);
};
```

### 3.4 Bảo Mật & RFID (`/dashboard/security`)

**Tính năng:**
- Feed nhật ký quẹt thẻ realtime (cập nhật qua WebSocket)
- Màu xanh: Thẻ hợp lệ được vào
- Màu đỏ: Thẻ lạ bị từ chối
- Lọc theo phòng, ngày, trạng thái authorized
- Bộ lọc tìm kiếm theo mã thẻ, sinh viên
- Export CSV lịch sử ra vào

### 3.5 Giám Sát Môi Trường (`/dashboard/environment`)

**Tính năng:**
- Dashboard tổng hợp nhiệt độ/độ ẩm/gas của tất cả phòng
- Heatmap phòng theo nhiệt độ
- Biểu đồ trend 24h/7 ngày
- Cảnh báo realtime khi vượt ngưỡng:
  - Gas > 70%: Alert đỏ
  - Nhiệt độ > 55°C: Alert cam

### 3.6 Sự Cố Khẩn Cấp (`/dashboard/emergency`)

**Tính năng:**
- Danh sách tất cả sự cố (lọc: đang mở / đã giải quyết)
- Chi tiết sự cố: Loại, mức độ, phòng, thời gian phát hiện, giá trị cảm biến
- Đánh dấu đã xử lý với ghi chú
- Timeline sự cố của từng phòng
- Thống kê loại sự cố phổ biến

---

## 4. AI Intelligence Center — 6 Phân Hệ

### 4.1 Tổng Quan AI (`/dashboard/intelligence`)

**Hiển thị:**
- KPI AI: Số models đang active, anomalies mở, pending recommendations
- Trạng thái kết nối ML Service (healthy / offline)
- Badge "WOKWI SIMULATION" — nhắc nhở đây là môi trường mô phỏng
- Quick actions: Chạy scan, refresh predictions

### 4.2 Dự Báo Năng Lượng (`/dashboard/intelligence/energy`)

**Biểu đồ & Hiển thị:**
```
[Area Chart] Dự báo 24h tiếp theo:
  - Đường thực tế: màu xanh đậm (Actual kW)
  - Dự báo Champion GBM: màu xanh navy (GBM Forecast kW)
  - Dải tin cậy ±10%: vùng màu nhạt (Residual Quantile Bounds)
  
[Single Champion Highlights]:
  - Gradient Boosting Machine (GBM Champion v2.0)
  - MAE: 8.28 kW · MAPE: 4.69% · R² Score: 0.961 · Latency: 8ms
  
[Model Status Badge]:
  - CHAMPION → Gradient Boosting Forecaster (màu xanh lá Active)
```

**Tính năng:**
- Chọn phòng cụ thể để dự báo
- Chọn horizon: 24h / 7 ngày / 30 ngày
- Biểu đồ phụ tải thực tế song hành cùng đường cong dự báo Champion GBM
- Phân bổ phụ tải đỉnh và đề xuất Pre-cooling cắt giảm chi phí giờ cao điểm

### 4.3 Phát Hiện Bất Thường (`/dashboard/intelligence/anomalies`)

**Hiển thị:**
- Danh sách thiết bị bất thường với Anomaly Score (0.0 - 1.0)
- Severity badge: NORMAL / WARNING / HIGH / CRITICAL
- Features được sử dụng để phát hiện (Power, Response, Failure Rate, Uptime)
- Recommendation từ AI
- Actions: Acknowledge / Resolve

**Ví dụ hiển thị:**
```
┌──────────────────────────────────────────────────┐
│ 🔴 Quạt thông gió B202 [CRITICAL]               │
│ Anomaly Score: 0.89                              │
│ Power: 450W (baseline: 45W) ↑ 900%             │
│ Uptime: 168h không tắt                          │
│ AI: "Thiết bị có thể bị kẹt bật. Kiểm tra ngay"│
│                    [Acknowledge] [Resolve]        │
└──────────────────────────────────────────────────┘
```

### 4.4 Bản Đồ Lưu Trú (`/dashboard/intelligence/occupancy`)

**Hiển thị:**
- Grid tất cả phòng với xác suất có người (0% - 100%)
- Màu sắc: Xanh (trống) → Đỏ (đông đúc)
- Chi tiết: Xác suất, tín hiệu motion, tín hiệu điện, RFID gần đây
- Tổng: X/24 phòng đang có người

### 4.5 Quản Trị Mô Hình AI & MLOps (`/dashboard/intelligence/models`)

**Tính năng & Giao diện:**
- **Tab 1: Kiến Trúc Mô Hình Champion (GBM)**:
  - Hero Card chi tiết: Gradient Boosting Regressor (200 Trees, Huber Loss, Max Depth 4, LR 0.05).
  - Biểu đồ phân tích **13 Feature Importances** (Chu kỳ Sin/Cos 24h, rơ-le Đèn/Quạt, nhiệt độ DHT22, tín hiệu hiện diện...).
  - Chỉ số hiệu năng: R² = 0.9607, MAE = 8.28 kW, RMSE = 12.50 kW, Latency = 8ms.
  - Pipeline tái huấn luyện trực tiếp với Modal tiến độ 4 bước.
- **Tab 2: Model Registry (3 Mô Hình)**:
  - Gradient Boosting Forecaster (`energy_gbm_v2.0.joblib` - Champion).
  - Isolation Forest Anomaly Detector (`isolation_forest_v1.joblib`).
  - Spatial Occupancy XGBoost Classifier (`occupancy_xgb_v1.json`).
- **Tab 3: Giám Sát Độ Trôi Dữ Liệu & Sensor Health**:
  - Giám sát độ trôi sai số MAE của GBM (+1.2%, Healthy).
  - Tỷ lệ báo động giả của Isolation Forest (0.38%).
  - Trạng thái luồng gói tin cảm biến ESP32 (100% arrival rate).

### 4.6 Đề Xuất AI (`/dashboard/intelligence/recommendations`)

**Hiển thị:**
- Danh sách đề xuất đang chờ duyệt (PENDING)
- Mỗi đề xuất: Tiêu đề, mô tả, lý do, confidence score, thời gian
- Actions: ✅ Chấp nhận | ❌ Từ chối
- Filter: Theo loại (ENERGY/DEVICE/SECURITY), severity, trạng thái
- Lịch sử đề xuất đã xử lý

**Luồng khi Admin "Chấp nhận":**
```
Admin click "Chấp nhận"
  → PATCH /api/intelligence/recommendations/:id/accept
  → Backend: status = "ACCEPTED", acceptedBy = userId
  → Nếu có AutomationRule liên quan → Execute
  → WebSocket broadcast: recommendation status updated
```

### 4.7 AI Copilot Assistant (`/dashboard/intelligence/assistant`)

**Giao diện:** Chat UI với input box và lịch sử hội thoại

**Khả năng:**
- Hỏi về dữ liệu cảm biến: "Phòng A101 nhiệt độ hôm nay thế nào?"
- Hỏi về thiết bị: "Đèn tầng 2 tòa B có đang bật không?"
- Hỏi về bất thường: "Thiết bị nào đang có vấn đề?"
- Hỏi về dự báo: "Dự báo điện năng tuần tới?"
- Giải thích AI: "Tại sao Isolation Forest lại phát hiện quạt B202 bất thường?"

**Giới hạn (Read-Only):**
- Copilot CHỈ phân tích và trả lời — KHÔNG thực thi lệnh
- KHÔNG tự bật/tắt thiết bị
- KHÔNG tự tạo đề xuất

---

## 5. Student Portal

### 5.1 Dashboard Sinh Viên (`/student/dashboard`)

**Thông tin hiển thị (chỉ phòng mình):**
- Cảm biến phòng realtime: Nhiệt độ, Độ ẩm, Gas
- Trạng thái thiết bị: Đèn, Quạt, Cửa
- Lịch sử ra vào của mình (quẹt thẻ)
- Dự báo năng lượng phòng 24h tiếp theo
- Thông báo từ Ban quản lý

**Bảo mật:**
```typescript
// Backend middleware kiểm tra quyền sinh viên
if (user.role === 'STUDENT') {
  // Chỉ cho phép xem data của room mình
  if (requestedRoomId !== user.roomId) {
    throw new ForbiddenException('Access denied to other rooms');
  }
}
```

---

## 6. Components Tái Sử Dụng

### 6.1 UI Components (`frontend/src/components/ui/`)

| Component | Chức năng |
|---|---|
| `MetricCard` | Thẻ hiển thị KPI với icon và trend |
| `Badge` | Badge màu sắc (status, severity) |
| `Button` | Nút bấm với variants |
| `Skeleton` | Loading skeleton placeholder |

### 6.2 Feature Components

| Component | Chức năng |
|---|---|
| `WokwiPanel` | Nhúng iframe Wokwi simulator |
| `AiAssistantWidget` | Widget chat AI Copilot |

---

## 7. Kết Nối WebSocket

**File:** `frontend/src/lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('access_token'),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}
```

**Sử dụng trong component:**
```typescript
useEffect(() => {
  const socket = getSocket();
  
  socket.on('sensor:update', (data) => {
    setTemperature(data.temperature);
    setHumidity(data.humidity);
  });
  
  socket.on('emergency:alert', (alert) => {
    toast.error(`🚨 ${alert.type}: ${alert.description}`);
  });
  
  return () => {
    socket.off('sensor:update');
    socket.off('emergency:alert');
  };
}, []);
```

---

## 8. API Client

**File:** `frontend/src/lib/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

// Tự động gắn JWT token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động redirect về /login khi token hết hạn
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 9. Cấu Hình Mạng & Biến Môi Trường (Network Configuration)

### 9.1 Môi Trường Phát Triển Cục Bộ (Local Development)
**File:** `frontend/.env.local` (Tự động tạo bởi `start.ps1` hoặc sao chép từ `frontend/.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 9.2 Môi Trường Triển Khai Thực Tế (Production / Campus LAN / HTTPS Domain)
**File:** `frontend/.env.production`:
```env
# Khi chạy qua Domain HTTPS chính thức
NEXT_PUBLIC_API_URL=https://smartdorm.ktx.edu.vn/api
NEXT_PUBLIC_WS_URL=https://smartdorm.ktx.edu.vn

# Hoặc khi triển khai qua Mạng Nội Bộ Ký Túc Xá (LAN Static IP)
# NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
# NEXT_PUBLIC_WS_URL=http://192.168.1.100:3001
```

---

## 10. Chạy Frontend

### Development
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

### Build Production
```bash
npm run build    # ~9 giây (Turbopack)
npm run start    # Production server
```

### Docker
```bash
docker compose up -d frontend
```
