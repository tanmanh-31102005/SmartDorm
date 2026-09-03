# SMARTDORM — BÁO CÁO KIỂM TOÁN DỮ LIỆU MẪU (SAMPLE DATA AUDIT REPORT)
**Mã tài liệu:** `AUDIT-SMARTDORM-SAMPLE-DATA-2026`  
**Ngày thực hiện:** 21/08/2026  
**Kiểm toán viên:** Kiến trúc sư Cơ sở dữ liệu & Kỹ sư Tích hợp Toàn hệ thống  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. XÁC ĐỊNH HỆ CƠ SỞ DỮ LIỆU QUAN HỆ THỰC TẾ

- **Hệ quản trị CSDL Quan hệ đang chạy:** **SQLite**
- **Tệp cơ sở dữ liệu hoạt động:** `backend/prisma/dev.db` (Kích thước: `1,011,712 bytes`)
- **Schema Prisma đang áp dụng:** `backend/prisma/schema.prisma` (`datasource db { provider = "sqlite", url = env("DATABASE_URL") }`)
- **Tham chiếu môi trường / Production:**
  - `docker-compose.yml` chứa container `postgres:16-alpine` (`smartdorm-postgres`) trên cổng `5432` song song với volume mount `dev.db` cho backend và ml-service.
  - `backend/prisma/schema.postgresql.prisma` được lưu trữ làm schema tương đương cho PostgreSQL khi triển khai hạ tầng lớn.
  - **Kết luận:** Hệ thống runtime hiện tại hoạt động trên nền **SQLite (`dev.db`)**. Tất cả kịch bản nạp dữ liệu (seed), truy vấn và kiểm thử đều tương thích 100% với SQLite và đồng bộ với kiến trúc PostgreSQL.

---

## 2. TỔNG HỢP BẢN GHI HIỆN HỮU THEO MÔ HÌNH BẢNG (TABLE / MODEL)

Dữ liệu được truy vấn trực tiếp từ cơ sở dữ liệu SQLite thông qua Prisma Client:

| Mô hình (Model) | Tên bảng trong DB | Số lượng bản ghi | Khóa chính / Ràng buộc duy nhất | Trạng thái & Ghi chú |
|---|---|:---:|---|---|
| `User` | `users` | **19** | `id` (cuid), `studentId`, `email`, `rfidCardId` | 1 Quản trị viên (`admin@ktx.edu.vn`), 18 Sinh viên |
| `Building` | `buildings` | **3** | `id` (cuid), `name` | Tòa A, Tòa B, Tòa C |
| `Room` | `rooms` | **18** | `id` (cuid), `@@unique([buildingId, roomNumber])`, `espDeviceId` | 18 phòng phân bổ tại Tòa A (8 phòng), Tòa B (6 phòng), Tòa C (4 phòng) |
| `Device` | `devices` | **72** | `id` (cuid), Khóa ngoại `roomId` | 4 thiết bị/phòng (LIGHT, FAN, DOOR_LOCK, BUZZER) |
| `SensorData` | `sensor_data` | **2,565** | `id` (cuid), Chỉ mục `[roomId, recordedAt]` | Dữ liệu đo cảm biến chuỗi thời gian |
| `AccessLog` | `access_logs` | **213** | `id` (cuid), Chỉ mục `[roomId, timestamp]` | Lịch sử quẹt thẻ RFID (Hợp lệ / Từ chối) |
| `CommandLog` | `command_logs` | **444** | `id` (cuid), Khóa ngoại `deviceId`, `userId` | Nhật ký thực thi lệnh điều khiển thiết bị |
| `Emergency` | `emergencies` | **339** | `id` (cuid), Chỉ mục `[roomId, createdAt]` | Cảnh báo sự cố khẩn cấp (GAS_LEAK, FIRE) |
| `MlModel` | `ml_models` | **4** | `id` (cuid) | Prophet, Baseline, Isolation Forest, Occupancy |
| `MlPrediction` | `ml_predictions` | **0** | `id` (cuid), Chỉ mục `[roomId, createdAt]` | Bảng nhận dự đoán ML |
| `DeviceAnomaly` | `device_anomalies` | **44** | `id` (cuid), Chỉ mục `[roomId, detectedAt]` | Cảnh báo bất thường từ Isolation Forest |
| `OccupancyPrediction` | `occupancy_predictions` | **0** | `id` (cuid), Chỉ mục `[roomId, createdAt]` | Bảng dự đoán xác suất lưu trú |
| `AiRecommendation` | `ai_recommendations` | **107** | `id` (cuid), Chỉ mục `[status, createdAt]` | Khuyến nghị AI (Năng lượng, Thiết bị, Lưu trú) |
| `AutomationRule` | `automation_rules` | **2** | `id` (cuid) | Luật tự động tiết kiệm điện & Chống quá tải |
| `AutomationExecution` | `automation_executions` | **0** | `id` (cuid), Chỉ mục `[ruleId, executedAt]` | Nhật ký kích hoạt luật tự động |

---

## 3. TỔNG HỢP INFLUXDB BUCKET & ĐO LƯỜNG TIME-SERIES

- **Dịch vụ InfluxDB:** InfluxDB 2.7 (Container `smartdorm-influxdb`, Cổng `8086`)
- **Tổ chức (Org):** `smart-dormitory`
- **Bucket mặc định:** `smart-dormitory-raw`
- **Các Measurements hoạt động:**
  1. `environment_sensors`
     - **Tags:** `building`, `floor`, `room`, `deviceId`, `source` (`WOKWI`, `SIMULATOR`, `REAL_HARDWARE`)
     - **Fields:** `temperature` (float), `humidity` (float), `gas_level` (float)
  2. `energy_telemetry`
     - **Tags:** `building`, `floor`, `room`, `deviceId`, `source` (`WOKWI`, `SIMULATION_DATA`, `REAL_HARDWARE`)
     - **Fields:** `power_w` (float), `energy_kwh` (float), `occupancy_signal` (bool), `light_state` (bool), `fan_state` (bool)
- **Kiến trúc Hybrid Database:**
  - InfluxDB lưu trữ dữ liệu chuỗi thời gian tần số cao; CSDL Quan hệ lưu trữ thực thể, tài khoản, cấu hình và lịch sử sự kiện.
  - Liên kết logic thông qua bộ nhận diện tổng hợp `(building, floor, room, deviceId)` mà không tạo ràng buộc khóa ngoại chéo gây phụ thuộc cứng.

---

## 4. CHIẾN LƯỢC SEED DỮ LIỆU AN TOÀN & BẢO TOÀN DỮ LIỆU (IDEMPOTENCY)

1. **Nguyên tắc Idempotent 100%:** Sử dụng `upsert()` hoặc kiểm tra `findUnique()` / `findFirst()` trước khi chèn/cập nhật.
2. **Không phá hủy:** Tuyệt đối không chạy `prisma migrate reset`, không xóa bảng hoặc dữ liệu lịch sử.
3. **Phân loại nguồn dữ liệu:** Gắn nhãn rõ ràng `source: "WOKWI"`, `simulationRunId`, `datasetEligible: false` để không bị nhầm lẫn với dữ liệu phần cứng thực tế.
4. **Sao lưu trước khi ghi:** Đã tạo bản sao lưu nguyên vẹn tại `backups/dev_db_backup_20260821_105800.db`.
