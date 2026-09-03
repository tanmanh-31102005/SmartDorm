# BÁO CÁO THẨM ĐỊNH CHẤT LƯỢNG TẬP DỮ LIỆU (DATASET QUALITY REPORT)

**Tập dữ liệu:** `smartdorm-wokwi-v1`  
**Thời điểm thẩm định:** `2026-08-21T04:03:30.948180+00:00`  
**Kết quả chứng nhận:** `✅ TRAINING_ELIGIBLE (VERIFIED)`  
**Nguồn dữ liệu:** `WOKWI SIMULATION`  

---

## 1. CHỈ SỐ ĐO LƯỜNG CHẤT LƯỢNG CỐT LÕI

| Tiêu chí chất lượng | Giá trị thực tế | Ngưỡng yêu cầu | Đánh giá |
|---|:---:|:---:|:---:|
| **Độ hoàn chỉnh (Completeness)** | **100.0%** | $\ge 99.9\%$ | ✅ ĐẠT |
| **Tỷ lệ trùng lặp (Duplicate Rate)** | **0.0** | $0.000000$ | ✅ ĐẠT |
| **Tỷ lệ sai thứ tự thời gian** | **0.0** | $0.000000$ | ✅ ĐẠT |
| **Tuân thủ vật lý (Physics Compliance)** | **100.0%** | $100.0\%$ | ✅ ĐẠT |

---

## 2. BẢNG CHI TIẾT KIỂM TRA LỖI VI PHẠM

| Hạng mục kiểm tra | Số lượng lỗi phát hiện | Rủi ro kỹ thuật |
|---|:---:|---|
| Giá trị Null trên các cột trọng yếu | **0** | Tránh lỗi NaN khi train model |
| Trùng mốc thời gian trong cùng phòng | **0** | Tránh lệch phân phối tần số lấy mẫu |
| Lỗi đảo lộn thứ tự thời gian | **0** | Bảo toàn tính nhân quả chuỗi thời gian |
| Nhiệt độ ngoài dải vật lý [$15^\circ\\text{C} - 50^\circ\\text{C}$] | **0** | Loại trừ dữ liệu nhiễu cảm biến hỏng |
| Độ ẩm ngoài dải vật lý [$20\\% - 100\\%$] | **0** | Ngăn ngừa ngoại lai cảm biến DHT22 |
| Công suất điện âm ($P_W < 0$) | **0** | Ràng buộc định luật bảo toàn năng lượng |
| Điện năng delta âm ($\\Delta E < 0$) | **0** | Đảm bảo tích lũy không âm từng chu kỳ |
| Điện năng tích lũy không đơn điệu | **0** | Mô phỏng chính xác đồng hồ cơ/điện tử |
| Lưu trú vượt quá dung lượng phòng | **0** | Bảo toàn tính logic của sĩ số phòng KTX |
| Giá trị MQ-2 ngoài biên [$0 - 100$] | **0** | Bảo đảm tương thích analog ADC ESP32 |

---

## 3. THỐNG KÊ TỔNG QUAN TẬP DỮ LIỆU

- **Tổng số bản ghi:** `103,680`
- **Số phòng theo dõi:** `24` phòng
- **Khoảng thời gian:** `2026-06-17T00:00:00+00:00` đến `2026-07-31T23:45:00+00:00`
- **Công suất trung bình:** `207.82` W (Đỉnh: `1904.3` W)
- **Nhiệt độ trung bình:** `29.29` °C

---
*Tập dữ liệu đã vượt qua 100% các cổng thẩm định và đủ điều kiện huấn luyện mô hình ML.*
