# SMARTDORM — KẾ HOẠCH SAO LƯU VÀ PHÂN TẦNG CÁCH LY DỮ LIỆU
**Mã tài liệu:** `BACKUP-ISOLATION-SMARTDORM-2026`  
**Thời gian tạo:** 21/08/2026 10:58:00 (UTC+7)  
**Tác giả:** Kiến trúc sư Cơ sở dữ liệu & Kỹ sư Tích hợp IoT  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. THÔNG TIN BẢN SAO LƯU (BACKUP MANIFEST)

| Thuộc tính | Chi tiết |
|---|---|
| **Tệp sao lưu chính** | `backups/dev_db_backup_20260821_105800.db` |
| **Nguồn gốc tệp gốc** | `backend/prisma/dev.db` |
| **Thời gian tạo sao lưu** | `21/08/2026 10:58:00 (UTC+7)` |
| **Kích thước tệp** | `1,011,712 bytes` (Khớp 100% tệp gốc) |
| **Dữ liệu được bảo toàn** | Toàn bộ các bảng (`User`, `Building`, `Room`, `Device`, `SensorData`, `AccessLog`, `CommandLog`, `Emergency`, `MlModel`, `DeviceAnomaly`, `AiRecommendation`, `AutomationRule`) |
| **Dữ liệu không nằm trong SQLite** | Bộ đệm InfluxDB trong RAM (được lưu tại volume `smartdorm_influxdb_data`), gói tin MQTT in-flight |

---

## 2. QUY TRÌNH PHỤC HỒI NHANH (ROLLBACK PROCEDURE)

Nếu phát sinh sự cố trong quá trình thử nghiệm và cần khôi phục lại trạng thái ban đầu:

1. **Dừng các tiến trình Node.js backend đang truy cập SQLite:**
   ```powershell
   Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
2. **Khôi phục tệp CSDL từ bản sao lưu:**
   ```powershell
   Copy-Item -Path "backups/dev_db_backup_20260821_105800.db" -Destination "backend/prisma/dev.db" -Force
   ```
3. **Kiểm tra tính toàn vẹn sau khi khôi phục:**
   ```powershell
   node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(c => console.log('Số người dùng phục hồi:', c)).finally(() => p.$disconnect());"
   ```

---

## 3. KIẾN TRÚC PHÂN TẦNG CÁCH LY DỮ LIỆU (3 TẦNG LOGIC)

```
+-----------------------------------------------------------------------------------+
|                        CÁC TẦNG DỮ LIỆU CỦA SMARTDORM                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ TẦNG A: CORE_DEMO_DATA — DỮ LIỆU MẪU CỐT LÕI ]                                 |
|  * Thực thể quan hệ: Tòa nhà, Phòng, Thiết bị, Sinh viên đã đăng ký, Admin        |
|  * Lưu trữ: SQLite (dev.db) / PostgreSQL thông qua Prisma                         |
|  * Vòng đời: Seed bất biến (idempotent), phục vụ giao diện & luồng demo chuẩn     |
|                                                                                   |
|  [ TẦNG B: SIMULATION_TEST_DATA — DỮ LIỆU MÔ PHỎNG KIỂM THỬ ]                     |
|  * Nguồn dữ liệu: "WOKWI" (mạch ESP32 ảo) | "SIMULATOR" (Python giả lập đa phòng)  |
|  * Lưu trữ: InfluxDB (gắn tag source=WOKWI) + Bảng cảm biến/sự cố trong SQLite   |
|  * Truy xuất nguồn gốc: simulationRunId, scenarioId, datasetEligible=false        |
|                                                                                   |
|  [ TẦNG C: REAL_HARDWARE_DATA — DỮ LIỆU PHẦN CỨNG THẬT ]                         |
|  * Nguồn dữ liệu: "REAL_HARDWARE" (Vi điều khiển ESP32 vật lý triển khai tại KTX) |
|  * Lưu trữ: InfluxDB & SQLite bảng vận hành thực                                  |
|  * Cách ly nghiêm ngặt: Mã script mô phỏng KHÔNG BAO GIỜ gắn nhãn REAL_HARDWARE   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 4. QUY CHUẨN GẮN NHÃN NGUỒN GỐC DỮ LIỆU (PROVENANCE)

Mọi điểm dữ liệu đo lường hoặc sự kiện được sinh ra đều tuân thủ cấu trúc chuẩn:

```json
{
  "source": "WOKWI",
  "simulationRunId": "simrun-20260821-001",
  "scenarioId": "normal-day-a101",
  "scenarioType": "NORMAL_DAY",
  "datasetEligible": false,
  "building": "A",
  "floor": "1",
  "room": "101",
  "deviceId": "ESP32-A101"
}
```

### Nguyên tắc quản lý:
1. `source`: Mặc định là `WOKWI` cho vi điều khiển ảo và `SIMULATOR` cho kịch bản giả lập tải.
2. `datasetEligible`: Mặc định nghiêm ngặt là `false`. Chỉ được chuyển thành `true` sau khi vượt qua Cổng Thẩm Định Chất Lượng 12 chiều (`validate_dataset.py`).
3. **Không trộn lẫn:** Dữ liệu phần cứng thật và dữ liệu mô phỏng được phân vùng hoàn toàn độc lập thông qua siêu dữ liệu.
