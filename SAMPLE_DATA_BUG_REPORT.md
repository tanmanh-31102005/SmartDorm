# SMARTDORM — BÁO CÁO KIỂM SOÁT VÀ XỬ LÝ LỖI DỮ LIỆU
**Mã tài liệu:** `BUG-REPORT-SAMPLE-DATA-2026`  
**Ngày thực hiện:** 21/08/2026  
**Tác giả:** Kỹ sư QA & Kiến trúc sư Backend  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. DANH MỤC LỖI TIỀM ẨN & GIẢI PHÁP ĐÃ XỬ LÝ

| Mã Lỗi | Mức Độ | Thành Phần | Nguyên Nhân & Nguy Cơ | Giải Pháp Đã Triển Khai | Trạng Thái |
|---|:---:|---|---|---|:---:|
| **BUG-001** | Trung bình | Script Seed Prisma | Chạy lại `prisma/seed.ts` nhiều lần có nguy cơ phát sinh lỗi trùng khóa nếu dùng lệnh `create()` trực tiếp. | Thay thế hoàn toàn bằng script [`backend/prisma/seed-demo.ts`](file:///d:/DACNTT2/SmartDorm_SourceCode/backend/prisma/seed-demo.ts) với cơ chế `upsert()` / `findFirst()` bất biến 100%. | **ĐÃ XỬ LÝ** |
| **BUG-002** | Thấp | Ánh Xạ RFID Log | Sự kiện quẹt thẻ lạ chưa đăng ký có thể gây lỗi `null pointer` khi lấy tên sinh viên `user.fullName`. | Xử lý an toàn trong [`access-log.service.ts`](file:///d:/DACNTT2/SmartDorm_SourceCode/backend/src/access-log/access-log.service.ts) với toán tử `user?.fullName || null` và ghi log `authorized: false`. | **ĐÃ XỬ LÝ** |
| **BUG-003** | Trung bình | Đồng Bộ Trạng Thái Lệnh | Lệnh phát qua MQTT có thể bị kẹt ở trạng thái `PENDING_ACK` nếu vi điều khiển mất kết nối. | Bổ sung cơ chế hòa giải trạng thái thông qua listener đồng bộ trạng thái phần cứng trong [`devices.service.ts`](file:///d:/DACNTT2/SmartDorm_SourceCode/backend/src/devices/devices.service.ts). | **ĐÃ XỬ LÝ** |
| **BUG-004** | Thấp | Tràn Cảnh Báo Khẩn Cấp | Cảm biến gas vượt ngưỡng liên tục trong nhiều giây có thể tạo hàng loạt bản ghi sự cố trùng lặp. | Xác thực và duy trì bộ lọc thời gian chờ 30 giây (`COOLDOWN_MS = 30000`) trong [`emergency.service.ts`](file:///d:/DACNTT2/SmartDorm_SourceCode/backend/src/emergency/emergency.service.ts). | **ĐÃ XỬ LÝ** |
| **BUG-005** | Cao | Cổng Thẩm Định Dữ Liệu ML | Nguy cơ mô hình ML được huấn luyện trên dữ liệu điện năng âm hoặc không đơn điệu. | Thiết lập Cổng Thẩm Định 12 chiều [`DataQualityGate`](file:///d:/DACNTT2/SmartDorm_SourceCode/ml-service/validate_dataset.py), chỉ cấp phép tập dữ liệu đạt chuẩn (`datasetEligible = true`). | **ĐÃ XỬ LÝ** |

---

## 2. KẾT LUẬN KIỂM ĐỊNH TOÀN HỆ THỐNG

- Không còn bất kỳ lỗi nghiêm trọng (Critical) hoặc mức độ cao (High) nào chưa được xử lý.
- Toàn bộ cơ chế nạp dữ liệu và lan truyền trạng thái vận hành ổn định, chính xác và có cơ chế bảo vệ an toàn chủ động.
