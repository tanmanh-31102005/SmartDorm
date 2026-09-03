# SMARTDORM — BẰNG CHỨNG XÁC MINH DỮ LIỆU MẪU
**Mã tài liệu:** `EVIDENCE-SAMPLE-DATA-2026`  
**Ngày thực hiện:** 21/08/2026  
**Tác giả:** Kỹ sư QA & Tích hợp Dữ liệu  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. BẰNG CHỨNG TRUY VẤN CƠ SỞ DỮ LIỆU SQLITE

```text
Truy vấn: SELECT COUNT(*) FROM table
-------------------------------------
Người dùng (Users):        19 (1 Quản trị viên + 18 Sinh viên)
Tòa nhà (Buildings):       3  (Tòa A, Tòa B, Tòa C)
Phòng KTX (Rooms):         18 (8 phòng Tòa A, 6 phòng Tòa B, 4 phòng Tòa C)
Thiết bị IoT (Devices):    72 (18 Đèn, 18 Quạt, 18 Khóa cửa, 18 Còi báo động)
Dữ liệu cảm biến:          2,565 bản ghi
Nhật ký quẹt thẻ (Access): 213 bản ghi
  Nhật ký lệnh (Commands):   444 bản ghi
  Sự cố khẩn cấp:            339 bản ghi
  Mô hình AI/ML:             4 mô hình (Prophet, Baseline, Isolation Forest, Bayesian Proxy)
  Cảnh báo bất thường:       44 bản ghi
Đề xuất AI:                107 bản ghi
Luật tự động hóa:          2 luật (Tắt thiết bị phòng trống & Chống quá tải điện)
```

---

## 2. BẰNG CHỨNG ĐO LƯỜNG TIME-SERIES TRÊN INFLUXDB

```text
Measurement: environment_sensors
Tags:        building=A, floor=1, room=101, deviceId=ESP32-A101, source=WOKWI
Fields:      temperature=28.6, humidity=63.4, gas_level=18.2
Timestamp:   2026-08-21T04:03:00Z

Measurement: energy_telemetry
Tags:        building=A, floor=1, room=101, deviceId=ESP32-A101, source=WOKWI
Fields:      power_w=55.0, energy_kwh=16.42, occupancy_signal=true, light_state=true, fan_state=false
Timestamp:   2026-08-21T04:03:00Z
```

---

## 3. BẰNG CHỨNG ĐIỀU KHIỂN & XÁC NHẬN LỆNH MQTT (ACK)

```json
{
  "phatLenhDieuKhien": {
    "topic": "dormitory/A/1/101/command/light",
    "payload": { "action": "on", "command_id": "cmd_a101_light_001" },
    "thoiGianPhat": "2026-08-21T04:03:10.120Z",
    "trangThaiBanDau": "PENDING_ACK"
  },
  "phanHoiXacNhanPhanCung": {
    "topic": "dormitory/A/1/101/command/ack",
    "payload": { "command_id": "cmd_a101_light_001", "status": "success", "timestamp": 1787284990 },
    "trangThaiDongBo": "ACK_SUCCESS",
    "doTrePhanHoiMs": 42
  }
}
```

---

## 4. BẰNG CHỨNG XÁC THỰC THẺ RA VÀO RFID

```json
{
  "suKienTheHopLe": {
    "cardId": "CARD_A1B2C3D4",
    "authorized": true,
    "action": "entry",
    "user": { "fullName": "Nguyễn Văn An", "studentId": "SV2024001" },
    "room": "101",
    "building": "A",
    "thoiGian": "2026-08-21T04:03:15.000Z"
  },
  "suKienTheLaBiTuChoi": {
    "cardId": "CARD_INVALID99",
    "authorized": false,
    "action": "denied",
    "user": null,
    "room": "101",
    "building": "A",
    "canhBaoAnNinh": true,
    "thoiGian": "2026-08-21T04:03:18.000Z"
  }
}
```

---

## 5. BẰNG CHỨNG CHỨNG NHẬN CHẤT LƯỢNG TẬP DỮ LIỆU ML

```text
Tập dữ liệu:      ml-service/data/curated/smartdorm-wokwi-v1.csv
Tệp siêu dữ liệu: ml-service/data/curated/smartdorm-wokwi-v1_metadata.json
Tổng số bản ghi:  103,680 bản ghi trên 24 phòng trong 45 ngày
Điểm chất lượng:
  - Độ hoàn chỉnh (Completeness):    100.0% (0 giá trị null trọng yếu)
  - Tỷ lệ trùng lặp (Duplicate):     0.000000 (0 bản ghi trùng)
  - Thứ tự thời gian:               100.0% đơn điệu tăng dần
  - Tuân thủ vật lý:                100.0% (0 công suất âm, 0 giá trị nhiệt độ/gas bất khả thi)
Chứng nhận:       VERIFIED — ĐỦ TIÊU CHUẨN HUẤN LUYỆN ML
```
