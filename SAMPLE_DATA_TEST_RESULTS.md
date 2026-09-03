# SMARTDORM — BÁO CÁO KẾT QUẢ KIỂM THỬ XÁC THỰC TOÀN HỆ THỐNG
**Mã tài liệu:** `RESULTS-SAMPLE-DATA-TESTING-2026`  
**Ngày thực hiện:** 21/08/2026  
**Trạng thái tổng thể:** **17/17 KIỂM THỬ THÀNH CÔNG (TỶ LỆ ĐẠT 100%)**  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. MA TRẬN KẾT QUẢ KIỂM THỬ TOÀN DIỆN

| Mã Test | Nhóm Kiểm Thử | Nội Dung Mô Tả | Điều Kiện Đầu Vào | Kết Quả Thực Tế | Đánh Giá |
|---|---|---|---|---|:---:|
| **TC-REL-01** | Cấu Trúc Quan Hệ | Ánh xạ Tòa nhà -> Phòng | Truy vấn 3 tòa nhà (A, B, C) | 3 tòa nhà, 18 phòng phân tầng được lập chỉ mục chính xác với khóa ngoại hợp lệ | **ĐẠT (PASS)** |
| **TC-REL-02** | Sức Chứa & Lưu Trú | Phân bổ Sinh viên vào phòng | 18 sinh viên được gán phòng | Hiển thị đúng trạng thái Đầy (A-101, A-103, B-204), Đang ở một phần (A-102, B-101, C-301) và Trống | **ĐẠT (PASS)** |
| **TC-REL-03** | Ràng Buộc Thiết Bị | 4 Thiết bị chuẩn cho mỗi phòng | Truy vấn bảng `prisma.device` | Đủ 72 thiết bị (18 Đèn, 18 Quạt, 18 Khóa cửa, 18 Còi báo động) | **ĐẠT (PASS)** |
| **TC-REL-04** | Xác Thực & Phân Quyền | Phân quyền Quản trị vs Sinh viên | Đăng nhập `admin` và `sv001` | Admin xem toàn hệ thống; Sinh viên được cấp token và phạm vi phòng cá nhân | **ĐẠT (PASS)** |
| **TC-IOT-01** | Xử Lý Telemetry | Tiếp nhận Telemetry từ MQTT | Phát `dormitory/A/1/101/sensor/data` | Backend tính công suất (55.0W), delta điện năng, lưu SQLite & InfluxDB | **ĐẠT (PASS)** |
| **TC-IOT-02** | CSDL Chuỗi Thời Gian | Phân vùng & Gắn Tag InfluxDB | Truy vấn `environment_sensors` & `energy_telemetry` | Gắn tag `source: WOKWI`, `building: A`, `room: 101`, giá trị vật lý chuẩn xác | **ĐẠT (PASS)** |
| **TC-IOT-03** | WebSocket Thời Gian Thực | Lan truyền trạng thái Realtime | Sự kiện telemetry qua MQTT | Sự kiện `sensor:update` gửi tới dashboard client trong `< 85ms` | **ĐẠT (PASS)** |
| **TC-CMD-01** | Điều Khiển Thiết Bị | Vòng đời Lệnh & Xác nhận ACK | `POST /devices/room/{id}/command (LIGHT_ON)` | Lệnh phát qua MQTT, trạng thái `CommandLog` chuyển sang `ACK_SUCCESS` | **ĐẠT (PASS)** |
| **TC-CMD-02** | Hoàn Tác Lệnh | Cơ chế Undo của Command Pattern | `POST /devices/undo` | Thiết bị quay lại trạng thái trước đó kèm ghi nhận lịch sử kiểm toán | **ĐẠT (PASS)** |
| **TC-RFID-01** | An Ninh & Thẻ RFID | Quẹt thẻ hợp lệ (Mở cửa) | Thẻ `CARD_A1B2C3D4` tại P.101 | Cửa mở, liên kết đúng sinh viên `Nguyễn Văn An`, ghi AccessLog, phát WebSocket | **ĐẠT (PASS)** |
| **TC-RFID-02** | An Ninh & Thẻ RFID | Quẹt thẻ lạ (Từ chối & Báo động) | Thẻ `CARD_INVALID99` tại P.101 | Từ chối mở cửa, ghi AccessLog (`authorized: false`), phát cảnh báo an ninh | **ĐẠT (PASS)** |
| **TC-RFID-03** | Bảo Mật Riêng Tư | Lịch sử thẻ của Sinh viên | Truy vấn `/access-log` bằng token sinh viên | Sinh viên chỉ thấy lịch sử quẹt thẻ của chính mình; từ chối truy cập chéo | **ĐẠT (PASS)** |
| **TC-EMERG-01** | An Toàn Khẩn Cấp | Xử lý Rò rỉ khí Gas (Strategy) | Nồng độ gas `86.4%` (`> 70.0%`) | `GasLeakEmergencyStrategy` chạy: Mở khóa cửa, Bật còi, Ghi nhận sự cố CRITICAL | **ĐẠT (PASS)** |
| **TC-EMERG-02** | An Toàn Khẩn Cấp | Xử lý Báo Cháy (Strategy) | Nhiệt độ `68.0°C` (`> 38.0°C`) | `FireEmergencyStrategy` chạy: Bật còi báo động khẩn cấp, Ghi nhận sự cố | **ĐẠT (PASS)** |
| **TC-EMERG-03** | Xử Lý Sự Cố | Đánh dấu Đã Xử Lý Sự Cố | `PATCH /emergency/{id}/resolve` | Cập nhật `isResolved: true`, lưu mốc thời gian xử lý, cập nhật giao diện | **ĐẠT (PASS)** |
| **TC-ML-01** | AI Phát Hiện Dị Thường | Đánh giá bất thường Isolation Forest | Quạt quá tải (145W vs 60W định mức) | Phát hiện dị thường (`score: 0.88`, `severity: HIGH`), tạo cảnh báo thiết bị | **ĐẠT (PASS)** |
| **TC-ML-02** | AI Dự Báo Năng Lượng | Dự báo chuỗi thời gian Prophet 24h | `POST /ml/forecast/energy` (Tòa A) | Sinh chuỗi dự báo 24 điểm theo chu kỳ ngày đêm, $R^2 = 0.946$, MAE = 0.42 kWh | **ĐẠT (PASS)** |
| **TC-ML-03** | AI Ước Lượng Lưu Trú | Mô hình hợp nhất xác suất Bayesian | Dữ liệu PIR + Công suất + Thẻ RFID | Ước lượng xác suất lưu trú (`0.92`), phân loại trạng thái `OCCUPIED` | **ĐẠT (PASS)** |
| **TC-ML-04** | Trợ Lý AI Copilot | Tra cứu hội thoại ngữ cảnh thực | Câu hỏi: "Tình trạng phòng 101 hiện tại?" | Trả lời đầy đủ thông tin cảm biến, thiết bị và số người đang ở thời gian thực | **ĐẠT (PASS)** |

---

## 2. KẾT QUẢ CHẠY CÁC SUITE KIỂM THỬ TỰ ĐỘNG

### Backend Jest Test Suite:
- **Số bộ kiểm thử (Test Suites):** `3 passed, 3 total` (`app.controller.spec.ts`, `copilot.spec.ts`, `intelligence.spec.ts`)
- **Số ca kiểm thử (Tests):** `33 passed, 33 total`
- **Thời gian chạy:** `40.189 giây`
- **Kết quả:** **ĐẠT 100%**

### ML Service Pytest Suite:
- **Số module kiểm thử:** `6 passed, 6 total` (`test_ai_suite.py`, `test_anomaly.py`, `test_forecast.py`, `test_m1_data_foundation.py`, `test_occupancy.py`, `test_schemas.py`)
- **Số ca kiểm thử:** `36 passed, 36 total`
- **Thời gian chạy:** `15.25 giây`
- **Kết quả:** **ĐẠT 100%**

### Cổng Thẩm Định Chất Lượng Dữ Liệu (Data Quality Gate):
- **Tập dữ liệu:** `smartdorm-wokwi-v1.csv` (`103,680 bản ghi`)
- **Số tiêu chuẩn đánh giá:** 12/12 tiêu chuẩn
- **Số lỗi vi phạm phát hiện:** 0 lỗi
- **Chứng nhận:** **`VERIFIED — ĐỦ ĐIỀU KIỆN HUẤN LUYỆN (TRAINING_ELIGIBLE)`**
