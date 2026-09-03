# HƯỚNG DẪN CHỤP ẢNH MINH CHỨNG TỪNG BƯỚC (SCREENSHOT GUIDE)

**Dự án:** Smart Dormitory IoT & AI Management System  
**Mục đích:** Cung cấp hướng dẫn thao tác chi tiết (click-by-click) để chụp đầy đủ toàn bộ ảnh minh chứng hệ thống, phục vụ báo cáo Đồ án tốt nghiệp / Luận văn.  
**Thư mục đích:** `latex_source/media/test-evidence/`

---

## 1. QUY CHUẨN CHỤP ẢNH MINH CHỨNG

1. **Độ phân giải chuẩn:** Khuyến nghị màn hình 1920x1080 (hoặc tối thiểu 1440x900).
2. **Trình duyệt:** Google Chrome / Microsoft Edge ở chế độ chuẩn, zoom 100%.
3. **Che giấu thông tin nhạy cảm:** Tuyệt đối không để lộ mật khẩu, JWT token đầy đủ, hoặc connection string nhạy cảm.
4. **Định dạng file:** Lưu định dạng `.png` (khuyến nghị) hoặc `.jpg` chuẩn.

---

## 2. HƯỚNG DẪN CHI TIẾT THEO TỪNG ẢNH

### 2.1. Phân hệ Admin Portal (`admin/`)

#### 📷 Ảnh 1: `admin/admin_01_login.png`
- **Địa chỉ URL:** `http://localhost:3000/login`
- **Các bước:**
  1. Mở trình duyệt, nhập URL `http://localhost:3000/login`.
  2. Nhập Email: `admin@ktx.edu.vn`.
  3. Nhập Mật khẩu: `admin123`.
  4. Chụp toàn màn hình trước khi nhấn nút "Đăng Nhập".

#### 📷 Ảnh 2: `admin/admin_02_dashboard_overview.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard`
- **Các bước:**
  1. Sau khi đăng nhập bằng tài khoản Admin, chuyển tới Dashboard.
  2. Đảm bảo dữ liệu thời gian thực (nhiệt độ, số phòng, cảnh báo) hiển thị đầy đủ.
  3. Chụp toàn màn hình gồm Sidebar, Top Header, Thẻ số liệu và Biểu đồ môi trường.

#### 📷 Ảnh 3: `admin/admin_03_room_list.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/rooms`
- **Các bước:**
  1. Nhấp chuột vào menu **Quản Lý Phòng (Rooms)** trên Sidebar.
  2. Xem danh sách các phòng thuộc Tòa A, Tòa B, Tòa C.
  3. Chụp màn hình bảng danh sách phòng và thanh tìm kiếm/lọc.

#### 📷 Ảnh 4: `admin/admin_04_room_detail_A101.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/rooms` -> Chọn phòng `A-101`
- **Các bước:**
  1. Nhấp vào phòng `A-101` trong danh sách.
  2. Màn hình chi tiết hiển thị: Thiết bị trong phòng (Đèn, Quạt, Khóa), Danh sách sinh viên (Nguyễn Văn An, Trần Thị Bình...), và Đồ thị cảm biến phòng A-101.
  3. Chụp lại toàn bộ giao diện chi tiết phòng.

#### 📷 Ảnh 5: `admin/admin_05_device_controls.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/devices`
- **Các bước:**
  1. Nhấp vào menu **Thiết Bị (Devices)** trên Sidebar.
  2. Chọn phòng `A-101`.
  3. Nhấp nút Bật/Tắt công tắc **Đèn Chiếu Sáng** hoặc **Quạt Thông Gió**.
  4. Quan sát switch đổi trạng thái sang Xanh (BẬT) và toast thông báo thành công. Chụp ảnh lại.

#### 📷 Ảnh 6: `admin/admin_06_command_history_undo.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/devices`
- **Các bước:**
  1. Sau khi gửi lệnh bật thiết bị, kéo xuống phần **Lịch Sử Lệnh Điều Khiển (Command History)**.
  2. Nhấn nút **Hoàn Tác Lệnh (Undo Last Command)**.
  3. Quan sát thông báo hoàn tác thành công và thiết bị quay về trạng thái cũ. Chụp ảnh lại.

#### 📷 Ảnh 7: `admin/admin_07_access_logs.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/access-log`
- **Các bước:**
  1. Nhấp vào menu **Nhật Ký Ra Vào (Access Logs)** trên Sidebar.
  2. Quan sát danh sách các sự kiện quẹt thẻ: Thẻ xanh `CARD_A1B2C3D4` (Hợp lệ - Entry) và Thẻ đỏ `CARD_INVALID99` (Từ chối - Denied).
  3. Chụp lại bảng dữ liệu có phân biệt màu sắc rõ ràng.

#### 📷 Ảnh 8: `admin/admin_08_emergency_active.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/emergency`
- **Các bước:**
  1. Kích hoạt sự cố rò rỉ gas (chạy script giả lập gas 86%).
  2. Banner đỏ cảnh báo khẩn cấp xuất hiện trên đầu màn hình và trong trang Emergency.
  3. Chụp lại màn hình cảnh báo đỏ đang kích hoạt.

#### 📷 Ảnh 9: `admin/admin_09_emergency_resolved.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/emergency`
- **Các bước:**
  1. Tại thẻ sự cố Gas Leak đang báo động, nhấn nút **Đánh Dấu Đã Xử Lý (Resolve / Acknowledge)**.
  2. Trạng thái sự cố chuyển sang màu xanh lá (Resolved) kèm mốc thời gian xử lý.
  3. Chụp lại màn hình sau khi đã giải quyết sự cố.

#### 📷 Ảnh 10: `admin/admin_10_analytics_charts.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/analytics`
- **Các bước:**
  1. Nhấp vào menu **Phân Tích & Báo Cáo (Analytics)** trên Sidebar.
  2. Quan sát các biểu đồ Recharts đường xu hướng nhiệt độ, độ ẩm và điện năng theo thời gian.
  3. Chụp lại màn hình trực quan hóa dữ liệu.

#### 📷 Ảnh 11: `admin/admin_11_energy_monitoring.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/energy`
- **Các bước:**
  1. Nhấp vào menu **Năng Lượng (Energy)**.
  2. Quan sát mức tiêu thụ điện năng từng tòa nhà và từng phòng.
  3. Chụp lại giao diện phân tích năng lượng.

#### 📷 Ảnh 12: `admin/admin_12_intelligence_models.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/intelligence/models`
- **Các bước:**
  1. Nhấp vào **Trung Tâm AI (Intelligence)** -> **Mô Hình ML (Models)**.
  2. Xem bảng danh sách các mô hình: `energy-prophet`, `device-anomaly-iforest`, `occupancy-proxy-classifier` kèm chỉ số MAE, RMSE, F1-Score, Inference Latency.
  3. Chụp lại bảng quản trị mô hình AI.

#### 📷 Ảnh 13: `admin/admin_13_ai_recommendations.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/intelligence/recommendations`
- **Các bước:**
  1. Nhấp vào mục **Đề Xuất AI (Recommendations)**.
  2. Xem danh sách các khuyến nghị tiết kiệm năng lượng và cảnh báo bảo trì thiết bị.
  3. Chụp lại giao diện thẻ đề xuất có nút **Chấp Nhận (Accept)** và **Bỏ Qua (Dismiss)**.

#### 📷 Ảnh 14: `admin/admin_14_ai_anomalies.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/intelligence/anomalies`
- **Các bước:**
  1. Nhấp vào mục **Bất Thường Thiết Bị (Anomalies)**.
  2. Xem danh sách thiết bị có mức tải điện bất thường được phát hiện bởi thuật toán Isolation Forest.
  3. Chụp lại màn hình danh sách sự cố bất thường.

#### 📷 Ảnh 15: `admin/admin_15_ai_copilot_assistant.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard/intelligence/assistant`
- **Các bước:**
  1. Nhấp vào mục **AI Copilot Assistant**.
  2. Nhập câu hỏi vào khung chat: *"Tình trạng phòng 101 hiện tại thế nào?"*.
  3. Quan sát câu trả lời thông minh của Copilot trích xuất dữ liệu cảm biến thực tế.
  4. Chụp lại màn hình đoạn hội thoại.

---

### 2.2. Phân hệ Sinh viên (Student Portal - `student/`)

#### 📷 Ảnh 16: `student/student_01_login.png`
- **Địa chỉ URL:** `http://localhost:3000/login`
- **Các bước:**
  1. Đăng xuất tài khoản Admin.
  2. Nhập Email: `sv001@student.edu.vn`.
  3. Nhập Mật khẩu: `sinhvien123`.
  4. Chụp màn hình đăng nhập sinh viên.

#### 📷 Ảnh 17: `student/student_02_dashboard.png`
- **Địa chỉ URL:** `http://localhost:3000/student/dashboard`
- **Các bước:**
  1. Sau khi đăng nhập, chuyển tới Dashboard sinh viên.
  2. Hiển thị thông tin: Phòng KTX A-101 của sinh viên, nhiệt độ/độ ẩm hiện tại phòng mình, trạng thái thiết bị phòng mình.
  3. Chụp lại toàn bộ giao diện sinh viên.

#### 📷 Ảnh 18: `student/student_03_room_view.png`
- **Địa chỉ URL:** `http://localhost:3000/student/room`
- **Các bước:**
  1. Nhấp menu **Phòng Của Tôi (My Room)**.
  2. Xem danh sách bạn cùng phòng trong phòng A-101.
  3. Chụp lại giao diện.

#### 📷 Ảnh 19: `student/student_04_device_control.png`
- **Địa chỉ URL:** `http://localhost:3000/student/devices`
- **Các bước:**
  1. Nhấp menu **Thiết Bị Phòng (Devices)**.
  2. Bật/Tắt đèn hoặc quạt trong phạm vi phòng mình.
  3. Chụp lại giao diện điều khiển của sinh viên.

#### 📷 Ảnh 20: `student/student_05_access_history.png`
- **Địa chỉ URL:** `http://localhost:3000/student/access-history`
- **Các bước:**
  1. Nhấp menu **Lịch Sử Quẹt Thẻ (Access History)**.
  2. Xem lịch sử ra vào chỉ thuộc về sinh viên Nguyễn Văn An (SV2024001).
  3. Chụp lại giao diện lịch sử cá nhân.

#### 📷 Ảnh 21: `student/student_06_energy_view.png`
- **Địa chỉ URL:** `http://localhost:3000/student/energy`
- **Các bước:**
  1. Nhấp menu **Tiêu Thụ Điện (Energy)**.
  2. Xem biểu đồ điện năng tiêu thụ của phòng A-101.
  3. Chụp lại giao diện.

#### 📷 Ảnh 22: `student/student_07_profile.png`
- **Địa chỉ URL:** `http://localhost:3000/student/profile`
- **Các bước:**
  1. Nhấp menu **Hồ Sơ Cá Nhân (Profile)**.
  2. Xem thông tin cá nhân: Họ tên, MSSV, Mã thẻ RFID, Số điện thoại, Phòng ở.
  3. Chụp lại giao diện hồ sơ.

#### 📷 Ảnh 23: `student/student_08_rbac_blocked.png`
- **Địa chỉ URL:** `http://localhost:3000/dashboard` (trong khi đang đăng nhập role STUDENT)
- **Các bước:**
  1. Trong phiên đăng nhập sinh viên, nhập thủ công lên thanh địa chỉ: `http://localhost:3000/dashboard`.
  2. Hệ thống RBAC chặn lại và tự động chuyển hướng về `/student/dashboard` hoặc hiển thị thông báo không có quyền truy cập.
  3. Chụp lại màn hình chứng minh RBAC bảo vệ dữ liệu.

---

### 2.3. Wokwi Simulator, MQTT & Testing (`wokwi/`, `mqtt/`, `testing/`)

- Sử dụng các file terminal log và ảnh mạch điện tử thực tế:
  - `wokwi/ss_wokwi_simulator_circuit.png`: Mạch điện ESP32 Wokwi.
  - `mqtt/mqtt_01_telemetry_publish.png`: Terminal log gói tin MQTT.
  - `testing/testing_04_e2e_verification_pass.png`: Kết quả 15/15 E2E Tests Pass.

---
*Hướng dẫn chụp ảnh click-by-click hoàn tất, sẵn sàng áp dụng trong toàn bộ tài liệu minh chứng.*
