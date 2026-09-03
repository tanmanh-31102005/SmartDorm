# SMARTDORM — NẠP DỮ LIỆU MẪU AN TOÀN, MÔ PHỎNG VÀ KIỂM THỬ XÁC THỰC HỆ THỐNG
# BÁO CÁO TỔNG KẾT TRIỂN KHAI TOÀN DIỆN (MASTER IMPLEMENTATION REPORT)

**Mã tài liệu:** `REPORT-SMARTDORM-SAMPLE-DATA-MASTER-2026`  
**Ngày thực hiện:** 21/08/2026  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`  
**Đội ngũ thực hiện:** Kiến trúc sư Cơ sở dữ liệu, Kỹ sư Backend, Chuyên gia IoT/MQTT, Kỹ sư QA & ML

---

## 1. XÁC ĐỊNH HỆ CƠ SỞ DỮ LIỆU QUAN HỆ THỰC TẾ

- **Hệ cơ sở dữ liệu quan hệ đang hoạt động:** **SQLite**
- **Tệp cơ sở dữ liệu:** `backend/prisma/dev.db` (Dung lượng: `1,011,712 bytes`)
- **Schema Prisma:** `backend/prisma/schema.prisma`
- **Tính tương đương với PostgreSQL:** Schema `backend/prisma/schema.postgresql.prisma` được duy trì đồng bộ để sẵn sàng chuyển giao khi triển khai hạ tầng quy mô lớn.
- **Thư viện ORM:** `@prisma/client` (Prisma 5.22.0) với kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt.

---

## 2. QUY TRÌNH SAO LƯU VÀ PHỤC HỒI NHANH (BACKUP & ROLLBACK)

### 2.1 Chi tiết bản sao lưu
- **Vị trí tệp sao lưu:** `backups/dev_db_backup_20260821_105800.db`
- **Thời gian tạo:** `21/08/2026 10:58:00 (UTC+7)`
- **Tính toàn vẹn:** Khớp 100% tệp gốc (`1,011,712 bytes`).

### 2.2 Lệnh phục hồi dữ liệu khi cần thiết
```powershell
# 1. Dừng các tiến trình Node.js đang truy cập file SQLite
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Khôi phục tệp CSDL từ bản sao lưu
Copy-Item -Path "backups/dev_db_backup_20260821_105800.db" -Destination "backend/prisma/dev.db" -Force

# 3. Xác minh tính toàn vẹn của CSDL
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(c => console.log('Số người dùng đã phục hồi:', c)).finally(() => p.$disconnect());"
```

---

## 3. CÁC TỆP TIN ĐÃ TẠO MỚI VÀ CHỈNH SỬA

### 3.1 Các tệp báo cáo và mã nguồn mới tạo:
1. [`SAMPLE_DATA_AUDIT.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/SAMPLE_DATA_AUDIT.md) — Báo cáo kiểm toán trước khi nạp dữ liệu.
2. [`BACKUP_AND_DATA_ISOLATION_PLAN.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/BACKUP_AND_DATA_ISOLATION_PLAN.md) — Kế hoạch sao lưu & kiến trúc phân tầng cách ly 3 lớp.
3. [`CORE_DEMO_DATA_REPORT.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/CORE_DEMO_DATA_REPORT.md) — Báo cáo nạp dữ liệu quan hệ cốt lõi và chứng minh tính bất biến.
4. [`SAMPLE_DATA_TEST_PLAN.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/SAMPLE_DATA_TEST_PLAN.md) — Kế hoạch kiểm thử toàn diện 17 kịch bản.
5. [`SAMPLE_DATA_TEST_RESULTS.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/SAMPLE_DATA_TEST_RESULTS.md) — Kết quả kiểm thử đạt 100% trên toàn bộ các bài test.
6. [`SAMPLE_DATA_EVIDENCE.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/SAMPLE_DATA_EVIDENCE.md) — Tổng hợp các bằng chứng, log truy vấn và sơ đồ ánh xạ.
7. [`SAMPLE_DATA_BUG_REPORT.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/SAMPLE_DATA_BUG_REPORT.md) — Nhật ký kiểm soát và xử lý các lỗi tiềm ẩn.
8. [`DATASET_QUALITY_REPORT.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/DATASET_QUALITY_REPORT.md) — Chứng nhận chất lượng tập dữ liệu 12 chiều cho mô hình ML.
9. [`latex_source/SAMPLE_DATA_SCREENSHOT_INVENTORY.md`](file:///d:/DACNTT2/SmartDorm_SourceCode/latex_source/SAMPLE_DATA_SCREENSHOT_INVENTORY.md) — Danh mục ảnh chụp màn hình và bằng chứng media.
10. [`backend/prisma/seed-demo.ts`](file:///d:/DACNTT2/SmartDorm_SourceCode/backend/prisma/seed-demo.ts) — Script nạp dữ liệu mẫu an toàn bất biến (idempotent).
11. `backups/dev_db_backup_20260821_105800.db` — Tệp sao lưu CSDL an toàn.

### 3.2 Tệp tin đã chỉnh sửa:
- [`backend/package.json`](file:///d:/DACNTT2/SmartDorm_SourceCode/backend/package.json) — Bổ sung lệnh script `"seed:demo": "ts-node prisma/seed-demo.ts"`.

---

## 4. DỮ LIỆU QUAN HỆ MẪU CỐT LÕI ĐÃ ĐƯỢC NẠP

- **Tòa nhà (3):** Tòa A, Tòa B, Tòa C (từ 5 đến 6 tầng mỗi tòa).
- **Phòng KTX (18):** 8 phòng tại Tòa A, 6 phòng tại Tòa B, 4 phòng tại Tòa C với đa dạng sức chứa (2, 4, 6 chỗ).
- **Thiết bị IoT (72):** Đúng 4 cơ cấu chấp hành cho mỗi phòng (`LIGHT`, `FAN`, `DOOR_LOCK`, `BUZZER`).
- **Tài khoản người dùng (19):** 1 Quản trị viên (`admin@ktx.edu.vn`) + 18 Sinh viên (`SV2024001` – `SV2024018`) gắn mã thẻ RFID duy nhất (`CARD_A1B2C3D4`, `CARD_E5F6G7H8`, v.v.).
- **Đa dạng tình trạng phòng:** Minh họa đầy đủ phòng Đầy (A-101, A-103, B-204), phòng Đang ở một phần (A-102, A-201, B-101, C-301, C-302) và phòng Trống.
- **Mô hình AI/ML (4):** Prophet Forecaster, Baseline Forecaster, Isolation Forest Anomaly Detector, Bayesian Occupancy Estimator.
- **Luật tự động hóa (2):** Tự động tắt thiết bị phòng trống & Cảnh báo quá tải công suất.
- **Đề xuất AI (3+):** Tối ưu hóa năng lượng, cảnh báo hỏng hóc động cơ quạt, tối ưu hóa chiếu sáng.

---

## 5. DỮ LIỆU MÔ PHỎNG ĐÃ NẠP (SIMULATION DATA)

- **Tập dữ liệu Wokwi được tuyển chọn:** `ml-service/data/curated/smartdorm-wokwi-v1.csv`
- **Tổng số bản ghi:** **103,680 bản ghi** trên 24 phòng trong 45 ngày (chu kỳ 15 phút).
- **Siêu dữ liệu nguồn gốc:** `smartdorm-wokwi-v1_metadata.json` (`simulationRunId: sim-smartdorm-wokwi-v1-42`, `generatorVersion: v1.2-scenario-engine`, `seed: 42`).
- **Cơ sở vật lý chặt chẽ:** Chu kỳ nhiệt độ ngày đêm (đạt đỉnh lúc 14:00), độ ẩm biến thiên ngược pha, công suất không âm ($P \ge 0\text{W}$), năng lượng tích lũy đơn điệu tăng ($\Delta E \ge 0\text{kWh}$).

---

## 6. CHIẾN LƯỢC CÁCH LY BUCKET VÀ GẮN TAG TRÊN INFLUXDB

- **Địa chỉ InfluxDB:** `http://localhost:8086` (Org: `smart-dormitory`, Bucket: `smart-dormitory-raw`)
- **Chiến lược cách ly:**
  - `source`: Được gắn nhãn rõ ràng là `"WOKWI"` hoặc `"SIMULATOR"` (Tuyệt đối không nhầm lẫn với `"REAL_HARDWARE"`).
  - `datasetEligible`: Thuộc tính boolean, chỉ gán `true` khi vượt qua kiểm định chất lượng.
- **Các Measurements:**
  1. `environment_sensors` (Tags: `building`, `floor`, `room`, `deviceId`, `source` | Fields: `temperature`, `humidity`, `gas_level`).
  2. `energy_telemetry` (Tags: `building`, `floor`, `room`, `deviceId`, `source` | Fields: `power_w`, `energy_kwh`, `occupancy_signal`, `light_state`, `fan_state`).

---

## 7. KẾT QUẢ KIỂM THỬ XÁC THỰC TOÀN HỆ THỐNG

- **Ma trận 17 bài kiểm thử tích hợp:** **17/17 ĐẠT (100%)** (Quan hệ, IoT, Điều khiển Lệnh/ACK, An ninh RFID, Sự cố Khẩn cấp, AI/ML).
- **Bộ kiểm thử tự động Backend Jest:** **33/33 ĐẠT (100%)** (`app.controller.spec.ts`, `copilot.spec.ts`, `intelligence.spec.ts`).
- **Bộ kiểm thử tự động ML Pytest:** **36/36 ĐẠT (100%)** (`test_ai_suite.py`, `test_anomaly.py`, `test_forecast.py`, `test_m1_data_foundation.py`, `test_occupancy.py`, `test_schemas.py`).
- **Cổng Thẩm Định Chất Lượng Dữ Liệu:** **ĐẠT (VERIFIED — TRAINING_ELIGIBLE)** với 0 null, 0 trùng lặp, 0 lỗi thứ tự thời gian và 100% tuân thủ vật lý.

---

## 8. CÁC LỆNH TÁI THỰC THI AN TOÀN KHI CẦN

### 8.1 Chạy lại Script Seed CSDL Quan Hệ
```powershell
cd d:\DACNTT2\SmartDorm_SourceCode\backend
npm run seed:demo
```

### 8.2 Sinh lại Tập Dữ Liệu ML & Kiểm Định Chất Lượng
```powershell
cd d:\DACNTT2\SmartDorm_SourceCode
python ml-service/generate_dataset.py --days 45 --rooms 24 --source WOKWI --seed 42 --version smartdorm-wokwi-v1
python ml-service/validate_dataset.py --dataset smartdorm-wokwi-v1
```

### 8.3 Chạy lại Toàn Bộ Bộ Test Backend
```powershell
cd d:\DACNTT2\SmartDorm_SourceCode\backend
npm test
```

### 8.4 Chạy lại Toàn Bộ Bộ Test ML Service
```powershell
cd d:\DACNTT2\SmartDorm_SourceCode
python -m pytest ml-service/tests
```
