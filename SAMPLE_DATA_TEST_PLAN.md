# SMARTDORM — KẾ HOẠCH KIỂM THỬ XÁC THỰC TOÀN HỆ THỐNG
**Mã tài liệu:** `PLAN-SAMPLE-DATA-TESTING-2026`  
**Tác giả:** Kỹ sư QA & Kiến trúc sư Tích hợp Full-Stack  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. MỤC TIÊU VÀ PHẠM VI KIỂM THỬ

Kế hoạch này thiết lập quy trình kiểm thử toàn diện nhằm xác minh tất cả dữ liệu mẫu được nạp trên hệ CSDL quan hệ, cơ sở dữ liệu chuỗi thời gian InfluxDB, MQTT broker, WebSocket thời gian thực, giao diện người dùng Next.js và dịch vụ AI/ML FastAPI hoạt động chính xác 100%, bảo đảm tính an toàn, bảo mật phân quyền và không có lỗi hồi quy.

---

## 2. MA TRẬN VÀ PHƯƠNG PHÁP KIỂM THỬ

```
+-----------------------------------------------------------------------------------------------+
| Nhóm Kiểm Thử                | Mã Test        | Nội Dung Trọng Tâm                            |
+------------------------------+----------------+-----------------------------------------------+
| 1. Logic Quan Hệ & Nghiệp Vụ | TC-REL-01      | Cấu trúc Tòa nhà -> Phòng phân tầng           |
|                              | TC-REL-02      | Gán Sinh viên vào phòng & Ràng buộc sức chứa  |
|                              | TC-REL-03      | Ràng buộc 4 thiết bị IoT cho mỗi phòng        |
|                              | TC-REL-04      | Phân quyền RBAC (Quản trị viên vs Sinh viên)  |
| 2. Luồng Dữ Liệu Hybrid      | TC-IOT-01      | Xử lý Telemetry cảm biến từ MQTT & Gắn tag    |
|                              | TC-IOT-02      | Truy vấn InfluxDB & Cách ly chuỗi thời gian   |
|                              | TC-IOT-03      | Lan truyền dữ liệu qua WebSocket Realtime     |
| 3. Điều Khiển & Phản Hồi ACK | TC-CMD-01      | Thực thi lệnh Command Pattern (PENDING -> ACK)|
|                              | TC-CMD-02      | Cơ chế hoàn tác lệnh Undo & Khôi phục trạng thái|
| 4. Bảo Mật & Thẻ RFID        | TC-RFID-01     | Thẻ hợp lệ -> CHO PHÉP + Lưu Log + Map User   |
|                              | TC-RFID-02     | Thẻ lạ -> TỪ CHỐI + Phát cảnh báo bảo mật     |
|                              | TC-RFID-03     | Bảo mật lịch sử ra vào theo tài khoản sinh viên|
| 5. Xử Lý Sự Cố Khẩn Cấp      | TC-EMERG-01    | Kích hoạt Strategy Pattern: Rò rỉ khí Gas     |
|                              | TC-EMERG-02    | Kích hoạt Strategy Pattern: Báo Cháy          |
|                              | TC-EMERG-03    | Quy trình xác nhận và xử lý sự cố (Resolve)   |
| 6. Trí Tuệ Nhân Tạo AI / ML  | TC-ML-01       | Đánh giá bất thường thiết bị Isolation Forest |
|                              | TC-ML-02       | Dự báo phụ tải điện 24h mô hình Prophet       |
|                              | TC-ML-03       | Ước lượng xác suất lưu trú Bayesian           |
|                              | TC-ML-04       | Trợ lý ảo AI Copilot hỗ trợ tra cứu ngữ cảnh   |
+-----------------------------------------------------------------------------------------------+
```

---

## 3. CHI TIẾT TỪNG KỊCH BẢN KIỂM THỬ

### 3.1 Logic Quan Hệ & Nghiệp Vụ
- **TC-REL-01:** Truy vấn 3 tòa nhà (A, B, C), xác minh 18 phòng được lập chỉ mục chính xác với khóa ngoại và tầng lầu.
- **TC-REL-02:** Xác thực sức chứa phòng trên 18 sinh viên mẫu, hiển thị đúng các trạng thái đầy (A-101, A-103, B-204), đang ở một phần (A-102, A-201, B-101, C-301, C-302) và phòng trống.
- **TC-REL-03:** Xác thực mỗi phòng có đủ 4 thiết bị (`LIGHT`, `FAN`, `DOOR_LOCK`, `BUZZER`), tổng cộng 72 thiết bị.
- **TC-REL-04:** Đăng nhập Admin và Sinh viên; xác thực token Sinh viên chỉ truy cập được phòng của chính mình.

### 3.2 Luồng Dữ Liệu Hybrid Telemetry
- **TC-IOT-01:** Phát telemetry MQTT mô phỏng từ `dormitory/A/1/101/sensor/data` với tag `source: WOKWI`. Backend tính toán công suất và delta điện năng.
- **TC-IOT-02:** Truy vấn InfluxDB đo lường `environment_sensors` và `energy_telemetry`, xác minh các tag và trường giá trị không âm.
- **TC-IOT-03:** Xác thực client WebSocket nhận sự kiện `sensor:update` trong thời gian `< 200ms`.

### 3.3 Điều Khiển Cơ Cấu Chấp Hành & ACK
- **TC-CMD-01:** Gửi lệnh `LIGHT_ON` qua REST API. Xác nhận trạng thái `CommandLog` chuyển từ `PENDING_ACK` sang `ACK_SUCCESS` khi phần cứng xác nhận.
- **TC-CMD-02:** Kích hoạt `POST /api/devices/undo`, xác nhận trạng thái thiết bị quay lại trạng thái trước đó kèm bản ghi kiểm toán.

### 3.4 Bảo Mật & Thẻ RFID
- **TC-RFID-01:** Quẹt thẻ hợp lệ `CARD_A1B2C3D4` tại phòng 101. Xác nhận mở cửa, liên kết đúng sinh viên `Nguyễn Văn An`, ghi AccessLog và phát sóng WebSocket.
- **TC-RFID-02:** Quẹt thẻ lạ `CARD_INVALID99`. Xác nhận từ chối mở cửa, ghi AccessLog (`authorized: false`) và phát cảnh báo bảo mật.
- **TC-RFID-03:** Truy vấn `GET /api/access-log` với token sinh viên `SV2024001`, xác minh sinh viên chỉ thấy lịch sử cá nhân.

### 3.5 An Toàn & Sự Cố Khẩn Cấp
- **TC-EMERG-01:** Cảm biến gas đạt `86.4%` (vượt ngưỡng `70.0%`). Xác nhận `GasLeakEmergencyStrategy` chạy: tự động mở khóa cửa, bật còi, lưu sự cố và phát sóng `emergency:alert`.
- **TC-EMERG-02:** Cảm biến nhiệt độ đạt `68.0°C` (vượt ngưỡng `38.0°C`). Xác nhận `FireEmergencyStrategy` kích hoạt cảnh báo cháy CRITICAL.
- **TC-EMERG-03:** Gọi `PATCH /api/emergency/:id/resolve`, xác nhận `isResolved: true` và mốc thời gian xử lý được ghi nhận.

### 3.6 Trí Tuệ Nhân Tạo AI / ML
- **TC-ML-01:** Gọi `POST /ml/anomaly/device` với quạt quá tải (145W vs 60W định mức). Xác nhận Isolation Forest gắn cờ cảnh báo `anomalyScore > 0.7`.
- **TC-ML-02:** Gọi `POST /ml/forecast/energy` dự báo phụ tải 24h. Xác nhận chu kỳ ngày/đêm và không âm.
- **TC-ML-03:** Gọi `POST /ml/predict/occupancy`. Xác nhận ước lượng xác suất lưu trú Bayesian kết hợp chuyển động, công suất và thẻ quẹt.
- **TC-ML-04:** Gọi `POST /api/intelligence/copilot/chat` với câu hỏi tự nhiên và nhận phản hồi ngữ cảnh thời gian thực.
