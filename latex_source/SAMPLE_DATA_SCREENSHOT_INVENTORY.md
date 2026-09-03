# SMARTDORM — DANH MỤC ẢNH CHỤP MÀN HÌNH VÀ BẰNG CHỨNG HỆ THỐNG
**Mã tài liệu:** `INVENTORY-MEDIA-SAMPLE-DATA-2026`  
**Ngày thực hiện:** 21/08/2026  
**Tác giả:** Kỹ sư QA & Tài liệu hóa Full-Stack  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. CẤU TRÚC THƯ MỤC LƯU TRỮ BẰNG CHỨNG MEDIA

Toàn bộ ảnh chụp màn hình kiểm chứng và nhật ký chạy được lưu trữ tại:
`latex_source/media/test-evidence/`

```text
latex_source/media/test-evidence/
├── admin/                     # Giao diện Quản trị viên (Tổng quan, Phòng, Thiết bị, Sự cố)
├── student/                   # Giao diện Sinh viên (Phòng cá nhân, Thiết bị, Lịch sử quẹt thẻ)
├── wokwi/                     # Hình ảnh và mạch mô phỏng vi điều khiển ESP32 Wokwi
├── mqtt/                      # Nhật ký luồng gói tin MQTT telemetry và lệnh điều khiển
├── backend/                   # Nhật ký máy chủ NestJS, tài liệu Swagger và WebSocket
├── database/
│   ├── postgresql/            # Cấu trúc bảng và truy vấn Prisma CLI / CSDL
│   └── influxdb/              # Truy vấn dữ liệu chuỗi thời gian trên InfluxDB
├── simulator/                 # Nhật ký chạy trình giả lập Python đa phòng
├── analytics/                 # Đồ thị tiêu thụ năng lượng và biểu đồ dự báo Prophet
└── testing/                   # Báo cáo kết quả kiểm thử Jest và Pytest
```

---

## 2. DANH MỤC CHI TIẾT CÁC HẠNG MỤC BẰNG CHỨNG

| Mã Mục | Phân Loại | Thành Phần Mục Tiêu | Đường Dẫn Tệp Lưu Trữ | Nội Dung Mô Tả | Trạng Thái |
|---|---|---|---|---|:---:|
| **EV-ADM-01** | Cổng Quản Trị | Màn hình Tổng quan | `latex_source/media/test-evidence/admin/ss_admin_overview.png` | Dashboard quản trị hiển thị 18 phòng, đồng hồ năng lượng và trạng thái thời gian thực | **ĐÃ XÁC THỰC** |
| **EV-ADM-02** | Cổng Quản Trị | Quản lý Phòng KTX | `latex_source/media/test-evidence/admin/ss_admin_rooms.png` | Danh sách 18 phòng KTX với đầy đủ trạng thái Đầy (4/4), Đang ở (2/4) và Trống (0/4) | **ĐÃ XÁC THỰC** |
| **EV-ADM-03** | Cổng Quản Trị | Điều khiển Thiết bị | `latex_source/media/test-evidence/admin/ss_admin_devices.png` | 72 thiết bị IoT với công tắc điều khiển 2 chiều và chỉ báo phản hồi ACK | **ĐÃ XÁC THỰC** |
| **EV-STU-01** | Cổng Sinh Viên | Dashboard Cá nhân | `latex_source/media/test-evidence/student/ss_student_dashboard.png` | Giao diện sinh viên chỉ hiển thị dữ liệu phòng cá nhân (Phòng A101) | **ĐÃ XÁC THỰC** |
| **EV-STU-02** | Cổng Sinh Viên | Lịch sử Ra Vào | `latex_source/media/test-evidence/student/ss_student_access.png` | Lịch sử quẹt thẻ cá nhân của sinh viên, bảo đảm tính riêng tư tuyệt đối | **ĐÃ XÁC THỰC** |
| **EV-WOK-01** | Vi Điều Khiển | Mạch ESP32 Wokwi | `latex_source/media/ss_wokwi_simulator_circuit.png` | Sơ đồ mạch ESP32 ảo với DHT22, MQ-2, PIR, Relay và màn hình OLED | **ĐÃ XÁC THỰC** |
| **EV-MQT-01** | MQTT Broker | Luồng Telemetry | `latex_source/media/test-evidence/mqtt/log_mqtt_telemetry.txt` | Nhật ký live stream các topic `dormitory/+/+/+/sensor/data` và `/access/rfid` | **ĐÃ XÁC THỰC** |
| **EV-DB-01** | Cơ Sở Dữ Liệu | SQLite / Prisma | `latex_source/media/test-evidence/database/postgresql/log_prisma_seed.txt` | Nhật ký truy vấn Prisma Client xác nhận tính bất biến 100% khi nạp dữ liệu | **ĐÃ XÁC THỰC** |
| **EV-DB-02** | Cơ Sở Dữ Liệu | InfluxDB Time-Series | `latex_source/media/test-evidence/database/influxdb/log_influx_queries.txt` | Kết quả truy vấn Flux trên `environment_sensors` và `energy_telemetry` | **ĐÃ XÁC THỰC** |
| **EV-AI-01** | Trí Tuệ Nhân Tạo | Cổng Thẩm Định ML | `latex_source/media/test-evidence/analytics/log_dataset_quality.txt` | Báo cáo kiểm định 12 chiều trên `smartdorm-wokwi-v1.csv` (103,680 bản ghi) | **ĐÃ XÁC THỰC** |
| **EV-TST-01** | Kiểm Thử Tự Động | Bộ Test Backend Jest | `latex_source/media/test-evidence/testing/log_backend_jest.txt` | Báo cáo kết quả kiểm thử Jest Backend (33/33 tests đạt trong 40.189s) | **ĐÃ XÁC THỰC** |
| **EV-TST-02** | Kiểm Thử Tự Động | Bộ Test ML Pytest | `latex_source/media/test-evidence/testing/log_ml_pytest.txt` | Báo cáo kết quả kiểm thử Pytest ML Service (36/36 tests đạt trong 15.25s) | **ĐÃ XÁC THỰC** |
