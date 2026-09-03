# SMARTDORM — BÁO CÁO NẠP DỮ LIỆU QUAN HỆ MẪU CỐT LÕI
**Mã tài liệu:** `REPORT-CORE-DEMO-DATA-2026`  
**Ngày thực hiện:** 21/08/2026  
**Trạng thái:** **100% IDEMPOTENT & ĐÃ XÁC THỰC**  
**Thư mục dự án:** `d:\DACNTT2\SmartDorm_SourceCode`

---

## 1. TỔNG QUAN KẾT QUẢ THỰC HIỆN

Quy trình nạp dữ liệu mẫu cốt lõi được triển khai thông qua [`backend/prisma/seed-demo.ts`](file:///d:/DACNTT2/SmartDorm_SourceCode/backend/prisma/seed-demo.ts) và được kiểm thử chạy lặp lại 3 lần liên tiếp. Tính chất bất biến (idempotency) được chứng minh với **0 bản ghi trùng lặp, 0 lỗi khóa ngoại và 0 lỗi vi phạm ràng buộc dữ liệu**.

---

## 2. CẤU TRÚC DỮ LIỆU ĐÃ NẠP

### 2.1 Tòa Nhà (3 Bản Ghi)
- **Tòa A:** 5 tầng, `Khu A — Ký Túc Xá Đại Học Bách Khoa`
- **Tòa B:** 5 tầng, `Khu B — Ký Túc Xá Sinh Viên Quốc Tế`
- **Tòa C:** 6 tầng, `Khu C — Ký Túc Xá Sinh Viên Kỹ Thuật`

### 2.2 Phòng KTX (18 Bản Ghi Phân Bổ Nhiều Tầng)
| Tòa Nhà | Các Tầng | Danh Sách Phòng | Sức Chứa (Chỗ) | Mã Thiết Bị Vi Điều Khiển ESP32 |
|---|:---:|---|:---:|---|
| **Tòa A** | Tầng 1, 2, 3 | `101`, `102`, `103`, `201`, `202`, `203`, `301`, `302` | 2, 4, 6 | `esp32-room-A101` đến `esp32-room-A302` |
| **Tòa B** | Tầng 1, 2 | `101`, `102`, `201`, `202`, `203`, `204` | 2, 4, 6 | `esp32-room-B101` đến `esp32-room-B204` |
| **Tòa C** | Tầng 1, 2, 3 | `101`, `201`, `301`, `302` | 2, 4 | `esp32-room-C101` đến `esp32-room-C302` |

### 2.3 Thiết Bị IoT (72 Thiết Bị — Chuẩn 4 Thiết Bị Mỗi Phòng)
Mỗi phòng trong số 18 phòng KTX đều được gắn đủ 4 loại cơ cấu chấp hành:
1. `LIGHT` (`Đèn Chiếu Sáng P.{roomNumber}`)
2. `FAN` (`Quạt Thông Gió P.{roomNumber}`)
3. `DOOR_LOCK` (`Khóa Cửa Điện Tử P.{roomNumber}`)
4. `BUZZER` (`Còi Báo Động P.{roomNumber}`)

### 2.4 Tài Khoản Người Dùng (19 Tài Khoản: 1 Quản Trị Viên + 18 Sinh Viên)
- **Quản trị viên (Admin):** `admin@ktx.edu.vn` (`ADMIN001`) — Vai trò: `ADMIN`
- **Sinh viên (Students):** 18 sinh viên mẫu (`SV2024001` - `SV2024018`) với thẻ RFID riêng biệt (`CARD_A1B2C3D4`, `CARD_E5F6G7H8`, v.v.) được phân bổ vào các phòng để minh họa:
  - **Phòng Đầy (Full):** Phòng A-101 (4/4), Phòng A-103 (2/2), Phòng B-204 (4/4).
  - **Phòng Đang Ở Một Phần (Partial):** Phòng A-102 (2/4), Phòng A-201 (1/4), Phòng B-101 (2/4), Phòng C-301 (2/4), Phòng C-302 (1/2).
  - **Phòng Trống (Vacant):** Phòng A-202, A-203, A-301, A-302, B-102, B-201, B-202, B-203, C-101, C-201.

---

## 3. BẰNG CHỨNG KIỂM CHỨNG TÍNH BẤT BIẾN (IDEMPOTENCY)

| Chỉ số theo dõi | Trước khi Seed | Lần Chạy 1 (Tạo mới) | Lần Chạy 2 (Thử nghiệm Idempotent) | Lần Chạy 3 (Xác minh chốt) |
|---|:---:|:---:|:---:|:---:|
| **Users** | 6 | 19 (+13) | **19 (+0)** | **19 (+0)** |
| **Buildings** | 3 | 3 (+0) | **3 (+0)** | **3 (+0)** |
| **Rooms** | 7 | 18 (+11) | **18 (+0)** | **18 (+0)** |
| **Devices** | 21 | 72 (+51) | **72 (+0)** | **72 (+0)** |
| **ML Models** | 4 | 4 (+0) | **4 (+0)** | **4 (+0)** |
| **Automation Rules** | 2 | 2 (+0) | **2 (+0)** | **2 (+0)** |
| **Mã lỗi trả về** | — | `0` (Thành công) | `0` (Thành công) | `0` (Thành công) |

---

## 4. BẢO MẬT & TÍNH TOÀN VẸN
- Tất cả mật khẩu đều được băm an toàn bằng `bcrypt` (Salt Rounds = 10).
- Không có bất kỳ dữ liệu cá nhân hay thông tin bí mật nào bị rò rỉ.
- Không thực hiện bất kỳ lệnh `DELETE` hay reset CSDL nào.
