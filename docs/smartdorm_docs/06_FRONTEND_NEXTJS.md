# 🖥️ Frontend Next.js — Giao Diện Người Dùng
## Tài Liệu 06 — Frontend Layer

---

## 1. Tổng Quan

Frontend được xây dựng bằng **Next.js 16.3** với App Router, React 19, và TailwindCSS. Giao diện bao gồm 3 vùng chính:
1. **Admin Dashboard** — Quản lý toàn hệ thống
2. **Student Portal** — Cổng thông tin sinh viên
3. **AI Intelligence Center** — Trung tâm phân tích AI

**Port:** `3000`  
**Build time:** ~9 giây (Turbopack)  
**Total routes:** 35 pages

---

## 2. Cấu Trúc Routes

```
frontend/src/app/
├── page.tsx                      # Trang chủ (redirect đến /login)
├── layout.tsx                    # Root layout
├── globals.css                   # Global styles
│
├── login/
│   └── page.tsx                  # Trang đăng nhập (ADMIN + STUDENT)
│
├── dashboard/                    # Admin Dashboard
│   ├── layout.tsx               # Admin layout (Topbar + Sidebar)
│   ├── page.tsx                 # Trang tổng quan campus
│   │
│   ├── rooms/
│   │   └── page.tsx             # Quản lý phòng ký túc xá
│   │
│   ├── buildings/
│   │   └── page.tsx             # Quản lý tòa nhà
│   │
│   ├── devices/
│   │   └── page.tsx             # Điều khiển thiết bị
│   │
│   ├── residents/
│   │   └── page.tsx             # Quản lý sinh viên
│   │
│   ├── security/
│   │   └── page.tsx             # Nhật ký RFID, bảo mật
│   │
│   ├── environment/
│   │   └── page.tsx             # Giám sát môi trường (nhiệt/ẩm/gas)
│   │
│   ├── energy/
│   │   └── page.tsx             # Phân tích năng lượng
│   │
│   ├── emergency/
│   │   └── page.tsx             # Quản lý sự cố khẩn cấp
│   │
│   ├── analytics/
│   │   └── page.tsx             # Báo cáo & thống kê
│   │
│   ├── alerts/
│   │   └── page.tsx             # Trung tâm cảnh báo
│   │
│   ├── access-log/
│   │   └── page.tsx             # Lịch sử ra vào chi tiết
│   │
│   ├── reports/
│   │   └── page.tsx             # Tạo báo cáo
│   │
│   ├── settings/
│   │   └── page.tsx             # Cấu hình hệ thống
│   │
│   └── intelligence/            # AI Intelligence Center
│       ├── page.tsx             # Tổng quan AI
│       ├── energy/
│       │   └── page.tsx         # Dự báo năng lượng (biểu đồ so sánh models)
│       ├── anomalies/
│       │   └── page.tsx         # Danh sách thiết bị bất thường
│       ├── occupancy/
│       │   └── page.tsx         # Bản đồ lưu trú
│       ├── models/
│       │   └── page.tsx         # MLOps — quản lý models
│       ├── recommendations/
│       │   └── page.tsx         # AI recommendations
│       └── assistant/
│           └── page.tsx         # AI Copilot chat
│
└── student/                     # Student Portal
    ├── layout.tsx               # Student layout
    └── dashboard/
        └── page.tsx             # Dashboard sinh viên (chỉ phòng mình)
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

**Biểu đồ:**
```
[Area Chart] Dự báo 24h tiếp theo:
  - Đường thực tế: màu xanh đậm
  - Dự báo Prophet: màu tím
  - Dải tin cậy 95%: vùng màu nhạt (yhat_lower/upper)
  
[Bar Chart] So sánh 3 models:
  - Baseline, Prophet, LSTM
  - Các chỉ số: MAE, RMSE, MAPE, R², Inference Time
  
[Model Status Badges]:
  - CHAMPION → Prophet (màu vàng)
  - CHALLENGER → LSTM (màu cam)
  - FALLBACK → Baseline (màu xám)
```

**Tính năng:**
- Chọn phòng cụ thể để dự báo
- Chọn horizon: 24h / 48h / 168h (7 ngày)
- So sánh 3 models trên cùng biểu đồ
- Xuất dữ liệu dự báo CSV

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

### 4.5 Quản Trị Models (`/dashboard/intelligence/models`)

**Tính năng:**
- Bảng thông tin tất cả models: Version, Status, Metrics, Trained date
- Nút "Promote to Active" cho ADMIN
- Biểu đồ Drift Score theo thời gian
- Nút "Trigger Retraining" — khởi động tái huấn luyện ngay
- Log kết quả retraining

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

## 9. Environment Configuration

**File:** `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
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
