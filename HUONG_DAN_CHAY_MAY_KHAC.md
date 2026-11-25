# 🚀 HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG SMARTDORM TRÊN MÁY MỚI (1-CLICK SETUP)

Tài liệu này dành cho thành viên nhóm hoặc giảng viên/người chấm khi nhận được file zip mã nguồn `SmartDorm_SourceCode_Nhe.zip` để chạy toàn bộ hệ thống trên máy tính mới một cách **đầy đủ, mượt mà và tự động 100%**.

---

## 1. Yêu Cầu Cài Đặt Tối Thiểu Trên Máy (Prerequisites)

Trước khi chạy hệ thống, máy tính mới chỉ cần cài đặt sẵn 2 phần mềm phổ biến sau:

| Phần mềm | Phiên bản khuyến nghị | Link tải chính thức | Lưu ý quan trọng |
| :--- | :--- | :--- | :--- |
| **Node.js** | **v18.x** hoặc **v20.x LTS** | [https://nodejs.org](https://nodejs.org) | Cài bản LTS, kèm sẵn `npm` |
| **Python** | **v3.10** đến **v3.12+** | [https://python.org](https://python.org) | **Bắt buộc tick chọn `Add python.exe to PATH`** khi cài |

*(Không bắt buộc cài đặt Docker hay InfluxDB — hệ thống đã cấu hình sẵn chế độ Fallback SQLite & Cloud MQTT để chạy nhẹ nhàng ngay trên mọi máy tính).*

---

## 2. Quy Trình Khởi Động 1-Click (Siêu Đơn Giản)

### Bước 1: Giải nén mã nguồn
- Chuột phải vào file `SmartDorm_SourceCode_Nhe.zip` ➔ chọn **Extract All...** (hoặc dùng 7-Zip / WinRAR) để giải nén ra một thư mục bất kỳ trên máy.

### Bước 2: Mở PowerShell tại thư mục vừa giải nén
- Mở thư mục dự án vừa giải nén.
- Nhấn giữ phím `Shift` + chuột phải vào khoảng trống ➔ chọn **Open PowerShell window here** (hoặc gõ `powershell` vào thanh địa chỉ Explorer rồi ấn Enter).

> **💡 Mẹo:** Nếu máy tính lần đầu chạy script PowerShell và báo lỗi policy, hãy gõ 1 dòng sau vào PowerShell:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

### Bước 3: Chạy script tự động hóa
Gõ lệnh sau và nhấn **Enter**:

```powershell
.\start.ps1
```

---

## 3. Quá Trình Hệ Thống Tự Động Xử Lý

Khi bạn chạy `.\start.ps1`, script sẽ tự động thực hiện tất cả các bước chuẩn bị mà không cần bạn phải thao tác thủ công:

1. **Kiểm tra môi trường Node.js & Python:** Tự động phát hiện phiên bản trên máy.
2. **Tự động cài đặt thư viện Python:** Nếu máy chưa có `fastapi`, `uvicorn`, `paho-mqtt`, `scikit-learn`, `joblib`, `pandas`... script sẽ tự động chạy `pip install` ngầm.
3. **Tự động cài đặt dependencies Node.js:** Chạy `npm install` cho Backend và Frontend nếu chưa có thư mục `node_modules`.
4. **Tự động cấu hình file `.env`:** Tự động sinh các file `.env` từ template chuẩn đã nạp sẵn cấu hình Cloud MQTT HiveMQ, Gemini API, SMTP và Telegram.
5. **Khởi tạo cơ sở dữ liệu SQLite (`dev.db`):** Tự động đồng bộ schema và nạp sẵn dữ liệu demo (tòa nhà, phòng, thiết bị, tài khoản admin/sinh viên, ML model GBM Champion).
6. **Giải phóng cổng mạng (Port 3001, 3000, 8000):** Tự động đóng các tiến trình cũ nếu cổng đang bị chiếm.
7. **Khởi động 4 Terminal độc lập:**
   - 🟢 **Terminal 1:** Backend Server (NestJS - Port 3001)
   - 🟢 **Terminal 2:** ML Intelligence Service (FastAPI - Port 8000)
   - 🟢 **Terminal 3:** Frontend Web Dashboard (Next.js - Port 3000)
   - 🟢 **Terminal 4:** MQTT Room Simulator (Giả lập cảm biến IoT thời gian thực)

---

## 4. Địa Chỉ Truy Cập & Tài Khoản Trải Nghiệm Hệ Thống

Sau khi 4 cửa sổ bật lên (khoảng 10-15 giây), hãy mở trình duyệt web và truy cập:

### 🌐 Các đường dẫn chính:
- **Web Dashboard (Giao diện chính):** [http://localhost:3000](http://localhost:3000)
- **Backend API Swagger Docs:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **ML Intelligence API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Phân hệ AI & Machine Learning:** [http://localhost:3000/dashboard/intelligence](http://localhost:3000/dashboard/intelligence)

### 🔑 Tài khoản đăng nhập sẵn có:
| Vai trò | Email đăng nhập | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@ktx.edu.vn` | `admin123` | Quản lý toàn bộ KTX, phòng, thiết bị, AI, khẩn cấp, báo cáo |
| **Sinh viên (Student)** | `sv001@student.edu.vn` | `sinhvien123` | Điều khiển thiết bị phòng mình, xem lịch sử thẻ, gửi báo cáo sự cố |

---

## 5. Kiểm Tra Các Tính Năng Hoạt Động Mượt Mà

1. **Giám Sát Thời Gian Thực (Live IoT Telemetry):**
   - Vào `http://localhost:3000/dashboard/environment` hoặc `/dashboard/rooms`.
   - Các biểu đồ nhiệt độ, độ ẩm, nồng độ khí gas sẽ nhảy liên tục mỗi 3 giây nhờ Simulator và Cloud MQTT HiveMQ.
2. **Điều Khiển Thiết Bị (Device Remote Control):**
   - Vào `http://localhost:3000/dashboard/devices` hoặc trang phòng.
   - Bấm nút Bật/Tắt Đèn hoặc Quạt ➔ Terminal Simulator sẽ lập tức in log phản hồi lệnh và ACK!
3. **Phân Hệ Trí Tuệ Nhân Tạo (AI Intelligence Layer):**
   - Vào `http://localhost:3000/dashboard/intelligence`.
   - Xem mô hình **Gradient Boosting (GBM)** dự báo phụ tải điện, **Isolation Forest** phát hiện bất thường thiết bị, và **AI Assistant** tích hợp LLM giải thích dữ liệu.
4. **Cảnh Báo Khẩn Cấp (Emergency & Telegram Alert):**
   - Vào `http://localhost:3000/dashboard/emergency`.
   - Khi có sự cố rò rỉ khí gas hoặc hỏa hoạn, chuông báo động kêu và thông báo được gửi trực tiếp đến Telegram/Email.

---

## 6. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

- **PowerShell không cho chạy script (`running scripts is disabled`):**
  - Chạy lệnh: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` rồi thử lại.
- **Port 3000/3001/8000 báo "Already in use":**
  - Tắt các cửa sổ terminal cũ hoặc chạy lại `.\start.ps1`, script sẽ tự động giải phóng các port này.
- **Muốn làm mới cơ sở dữ liệu về ban đầu (Reset Database):**
  - Mở PowerShell trong thư mục `backend`, chạy:
    ```powershell
    npx prisma db push --force-reset
    npx ts-node prisma/seed.ts
    ```
- **Kết nối mạch thật ESP32:**
  - Cắm ESP32 qua cáp Type-C vào máy tính.
  - Xem sơ đồ nối dây tại [docs/smartdorm_docs/02_PHAN_CUNG_ESP32.md](file:///docs/smartdorm_docs/02_PHAN_CUNG_ESP32.md).
  - Mở thư mục `hardware` bằng VS Code PlatformIO và bấm nút **Upload**. Mạch sẽ tự động hòa mạng HiveMQ với web dashboard!
