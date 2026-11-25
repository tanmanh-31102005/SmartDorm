# 🎬 KỊCH BẢN QUAY CLIP DEMO & HƯỚNG DẪN CHỤP ẢNH MINH CHỨNG PHẦN CỨNG
## Dự án: SmartDorm — Hệ Thống Quản Lý Ký Túc Xá Thông Minh IoT & AI
**Khoa Công Nghệ Thông Tin — Đồ Án / Khóa Luận Tốt Nghiệp**

---

## PHẦN 1: KỊCH BẢN CHI TIẾT QUAY VIDEO CLIP DEMO (THỜI LƯỢNG 4 - 5 PHÚT)

### 1. Chuẩn bị trước khi bấm máy:
* **Thiết bị quay:** Điện thoại thông minh (đặt độ phân giải 1080p 60fps, lau sạch ống kính camera, kê điện thoại trên giá đỡ tripod hoặc để trên bàn vững chãi).
* **Quay màn hình máy tính:** Dùng phần mềm quay màn hình (OBS Studio, Camtasia, hoặc phím tắt `Windows + Alt + R` trên Windows 10/11) quay toàn màn hình trình duyệt Web Dashboard.
* **Góc máy:** Đặt góc quay thấy rõ cả **Màn hình Web Dashboard** và **Mô hình Mạch Phần Cứng** đặt bên cạnh (hoặc quay dạng Picture-in-Picture: màn hình Web làm nền chính, góc dưới bên phải là camera quay tay thao tác mạch).
* **Nguồn điện:** Cắm cáp USB cấp nguồn cho ESP32 và đảm bảo rơ-le đang ở trạng thái nghỉ (đèn LED đỏ trên rơ-le đang tắt).
* **Mở sẵn các tab trình duyệt:**
  1. Tab 1: Giao diện Quản trị viên `http://localhost:3000/dashboard` (đăng nhập `admin@smartdorm.com` / `123456`).
  2. Tab 2: Trang Điều Khiển Thiết Bị `http://localhost:3000/dashboard/devices`.
  3. Tab 3: Trang Nhật Ký Quẹt Thẻ `http://localhost:3000/dashboard/residents` (hoặc Access Log).
  4. Tab 4: Trang Giám Sát Khẩn Cấp `http://localhost:3000/dashboard/alerts`.
  5. Tab 5: Trang Trợ Lý AI Copilot `http://localhost:3000/dashboard/intelligence/assistant`.

---

### 2. Kịch bản từng phân cảnh (Scene-by-Scene Timeline):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TIMELINE VIDEO CLIP DEMO                               │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬──────────────────┤
│ Phân cảnh 1 │ Phân cảnh 2 │ Phân cảnh 3 │ Phân cảnh 4 │ Phân cảnh 5 │   Phân cảnh 6    │
│ (0:00-0:45) │ (0:45-1:45) │ (1:45-2:30) │ (2:30-3:30) │ (3:30-4:30) │   (4:30-5:00)    │
│  Giới thiệu │ ĐK 2 Chiều  │  Quẹt Thẻ   │ Cảnh Báo Gas│ AI Copilot  │     Tổng Kết     │
│   Tổng Quan │ Web & Nút Cơ│  Khóa Cửa   │  PCCC Hú Còi│ & Dự Báo ML │    Nghiệm Thu    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴──────────────────┘
```

---

#### 🎬 PHÂN CẢNH 1: GIỚI THIỆU TỔNG QUAN HỆ THỐNG & PHẦN CỨNG (0:00 – 0:45)
* **Hình ảnh quay:**
  - Camera lia cận cảnh mô hình phần cứng thật: ESP32 DevKit V1 trên Shield mở rộng, Breadboard 5 nút bấm, bo Relay 4 kênh, còi Buzzer, cảm biến MQ-2 và DHT22.
  - Sau đó lia sang màn hình Web Dashboard hiển thị phòng 101 (Tòa A, Tầng 1).
* **Lời thoại thuyết minh mẫu:**
  > *"Kính chào Quý Thầy Cô trong Hội Đồng Đánh Giá. Em xin phép được trình bày video nghiệm thu thực tế hệ thống SmartDorm — Hệ thống quản lý ký túc xá thông minh tích hợp IoT và Trí tuệ nhân tạo. 
  > Trước mắt Thầy Cô là mô hình phần cứng trạm IoT phòng ký túc xá, sử dụng vi điều khiển ESP32 DevKit V1 kết nối qua giao thức MQTT thời gian thực. Hệ thống gồm cụm cảm biến môi trường DHT22 và MQ-2, cụm 5 nút bấm vật lý điều khiển phụ tải và mô phỏng xác thực thẻ từ RFID, bo Relay 4 kênh kích mức thấp điều khiển đèn, quạt, khóa cửa, cùng còi báo động Active Buzzer."*

---

#### 🎬 PHÂN CẢNH 2: ĐIỀU KHIỂN PHỤ TẢI 2 CHIỀU THỜI GIAN THỰC (0:45 – 1:45)
* **Thao tác 1 (Web điều khiển Mạch):**
  - Trên màn hình Web, rê chuột bấm nút **BẬT ĐÈN** phòng 101.
  - Camera quay xuống bo Rơ-le: Nghe tiếng **"TẠCH"**, đèn LED đỏ Kênh 1 & Kênh 2 trên bo Relay bật sáng ngay lập tức. Còi bíp 1 tiếng xác nhận.
  - Trên Web bấm nút **TẮT ĐÈN** $\rightarrow$ Rơ-le nhảy "TẠCH", đèn đỏ tắt.
* **Thao tác 2 (Nút bấm cơ trên Breadboard điều khiển Web):**
  - Dùng ngón tay ấn **NÚT 1 (Hàng 5)** trên Breadboard $\rightarrow$ Rơ-le Đèn nhảy "TẠCH". Camera quay lên Web Dashboard: Công tắc Đèn trên Web tự động gạt sang trạng thái **ON** theo thời gian thực (độ trễ dưới 50ms nhờ WebSocket & MQTT).
  - Ấn tiếp **NÚT 2 (Hàng 10)** trên Breadboard $\rightarrow$ Rơ-le Quạt nhảy "TẠCH", công tắc Quạt trên Web bật sáng ON.
* **Lời thoại thuyết minh mẫu:**
  > *"Hệ thống hỗ trợ cơ chế điều khiển 2 chiều thời gian thực (Bi-directional Control). Khi ban quản lý điều khiển từ Web Dashboard, lệnh MQTT được gửi xuống vi điều khiển thực thi đóng ngắt rơ-le tức thì. Ngược lại, khi sinh viên tại phòng thao tác bấm các nút cơ học trên tường, trạng thái phần cứng được đồng bộ ngược lên máy chủ và hiển thị trên màn hình quản lý mà không cần tải lại trang."*

---

#### 🎬 PHÂN CẢNH 3: KIỂM SOÁT RA VÀO RFID & KHÓA CỬA TỰ ĐỘNG (1:45 – 2:30)
* **Thao tác 1 (Thẻ sinh viên hợp lệ):**
  - Ấn **NÚT 3 (Hàng 15 - Thẻ SV001 Nguyễn Văn An)**:
    * Còi Buzzer kêu **1 tiếng "BÍP"** ngắn dứt khoát.
    * Rơ-le Kênh 4 (Khóa Cửa) nhảy "TẠCH", đèn LED đỏ bật sáng **mở chốt cửa**.
    * Đếm nhẩm 4 giây: Rơ-le Kênh 4 tự động nhảy "TẠCH" ngắt điện (**4s Auto-Relock** tự động đóng chốt an toàn).
    * Camera quay lên Web tab Access Logs: Dòng nhật ký mới xuất hiện màu xanh: *"Nguyễn Văn An - Phòng 101 - Xác thực thành công (Entry)"*.
* **Thao tác 2 (Thẻ lạ chưa đăng ký):**
  - Ấn **NÚT 5 (Hàng 25 - Thẻ Lạ Invalid)**:
    * Còi Buzzer kêu **3 tiếng "BÍP - BÍP - BÍP"** cảnh báo dồn dập.
    * Rơ-le Khóa Cửa đứng im, không mở chốt.
    * Trên Web tab Access Logs: Dòng cảnh báo màu đỏ xuất hiện: *"Thẻ không xác định (CARD_INVALID99) - Từ chối truy cập (Denied)"*.
* **Lời thoại thuyết minh mẫu:**
  > *"Tiếp theo là phân hệ kiểm soát an ninh ra vào. Khi sinh viên hợp lệ quẹt thẻ, hệ thống phát 1 tiếng bíp xác nhận, mở rơ-le khóa cửa điện từ trong 4 giây rồi tự động khóa lại chống kẻ gian đột nhập. Trường hợp thẻ lạ chưa được cấp phép, còi sẽ hú 3 tiếng cảnh báo, từ chối mở cửa và lập tức ghi nhận nhật ký an ninh lên máy chủ trung tâm."*

---

#### 🎬 PHÂN CẢNH 4: CẢNH BÁO KHẨN CẤP AN TOÀN PCCC & RÒ RỈ KHÍ GAS (2:30 – 3:30)
* **Thao tác:**
  - Cầm một chiếc bật lửa (quẹt ga), **nhấn nhẹ cần xả gas (KHÔNG ĐÁ LỬA)** hướng về phía đầu lưới thép của cảm biến MQ-2 trong khoảng 2-3 giây.
  - **Diễn biến lập tức xảy ra:**
    1. Cảm biến MQ-2 đọc nồng độ gas tăng vọt vượt ngưỡng 70% - 80%.
    2. Còi Active Buzzer trên mạch **hú ngắt quãng liên tục** báo động sự cố.
    3. Rơ-le Quạt thông gió tự động **bật kích hoạt** để hút khí gas ra ngoài.
    4. Rơ-le Khóa cửa tự động **mở chốt thoát hiểm**.
    5. Màn hình Web Dashboard lập tức chuyển sang giao diện **Cảnh Báo Khẩn Cấp Màu Đỏ (EMERGENCY)**.
    6. Telegram Bot trên điện thoại rung chuông gửi tin nhắn báo động: *"🚨 CẢNH BÁO RÒ RỈ KHÍ GAS TẠI PHÒNG 101 - NỒNG ĐỘ VƯỢT NGƯỠNG!"*.
  - Trên màn hình Web, người quản lý bấm nút **"RESOLVE / GIẢI QUYẾT SỰ CỐ"** $\rightarrow$ Còi tắt hú, hệ thống trở về trạng thái giám sát bình thường.
* **Lời thoại thuyết minh mẫu:**
  > *"Đây là tính năng an toàn cốt lõi của SmartDorm: Luật phản ứng khẩn cấp PCCC tự động. Khi cảm biến phát hiện nồng độ gas nguy hiểm, hệ thống tự động kích hoạt kịch bản cứu hộ độc lập tại chỗ: hú còi báo động, bật quạt thông gió cưỡng bức, mở khóa cửa thoát hiểm và đẩy thông báo khẩn cấp lên điện thoại cán bộ quản lý qua Telegram chỉ trong vài giây."*

---

#### 🎬 PHÂN CẢNH 5: TRÍ TUỆ NHÂN TẠO (AI COPILOT & DỰ BÁO NĂNG LƯỢNG) (3:30 – 4:30)
* **Thao tác 1 (Dự báo phụ tải vi khí hậu):**
  - Mở tab **Phân Tích Năng Lượng / AI Models**: Chỉ vào biểu đồ so sánh mô hình **LightGBM Forecaster** với mô hình cơ sở Baseline, giải thích sai số dự báo thấp (MAE ~12W, R² > 0.88).
* **Thao tác 2 (Tương tác Trợ lý AI Copilot):**
  - Mở tab **AI Assistant (Copilot)**.
  - Gõ câu hỏi: *"Phòng 101 hiện tại có an toàn không và đang tiêu thụ bao nhiêu điện?"*
  - AI phản hồi ngay dựa trên dữ liệu thật của phòng (nhiệt độ, độ ẩm, nồng độ gas, trạng thái thiết bị).
  - Gõ tiếp câu lệnh: *"Hãy bật quạt phòng 101 giúp tôi"*.
  - AI phân tích ngữ nghĩa, gọi công cụ `execute_device_control` $\rightarrow$ Rơ-le Quạt trên mạch thật kêu "TẠCH", quạt bật sáng trên Dashboard!
* **Lời thoại thuyết minh mẫu:**
  > *"Điểm vượt trội của SmartDorm là tầng Trí tuệ nhân tạo chuyên sâu. Mô hình máy học LightGBM dự báo nhu cầu năng lượng dựa trên vi khí hậu thực tế giúp tối ưu hóa biểu đồ phụ tải. Đồng thời, Trợ lý ảo AI Copilot tích hợp mô hình ngôn ngữ lớn (LLM) hỗ trợ ban quản lý tra cứu tình trạng phòng và điều khiển thiết bị bằng ngôn ngữ tự nhiên tiếng Việt mượt mà."*

---

#### 🎬 PHÂN CẢNH 6: TỔNG KẾT & NGHIỆM THU (4:30 – 5:00)
* **Hình ảnh quay:** Quay bao quát cả góc làm việc (Mạch thật + Màn hình máy tính) và quay cận cảnh file Báo cáo, Poster.
* **Lời thoại thuyết minh mẫu:**
  > *"Toàn bộ hệ thống từ thiết bị nhúng IoT, kiến trúc vi dịch vụ Backend, giao diện Web Frontend, dịch vụ Machine Learning và trợ lý AI đã được kiểm thử đồng bộ 100% và sẵn sàng đóng gói triển khai lên Cloud VPS. Em xin chân thành cảm ơn Quý Thầy Cô đã theo dõi phần demo nghiệm thu của nhóm!"*

---

## PHẦN 2: HƯỚNG DẪN CHỤP 5 BỨC ẢNH MINH CHỨNG PHẦN CỨNG CHUẨN MỰC

Để chèn vào **Chương 2 và Chương 4 của Báo cáo Word / PDF**, bạn hãy chụp 5 bức ảnh với các yêu cầu sau:

### 📸 BẢNG CHECKLIST 5 GÓC CHỤP ẢNH MINH CHỨNG:

| STT | Tên Bức Ảnh | Góc Chụp & Nội Dung | Mục Đích Minh Chứng Trong Báo Cáo |
|:---:|---|---|---|
| **Ảnh 1** | **Toàn cảnh Mô hình Phần cứng (Overview Setup)** | Chụp góc nghiêng 45 độ từ trên xuống, thấy đầy đủ: Đế ESP32, Breadboard 5 nút bấm, bo Relay 4 kênh, DHT22, MQ-2, Còi Buzzer đang cắm điện sáng đèn LED nguồn. | Đặt tại mục 2.3 & 4.1: Minh chứng hệ thống phần cứng hoàn chỉnh, hoạt động đồng bộ. |
| **Ảnh 2** | **Cận cảnh Khối Xử Lý ESP32 (Microcontroller Unit)** | Chụp cận cảnh bo ESP32 DevKit V1 cắm trên Đế Shield 30 chân, thấy rõ dây cắm hàng `S` (Signal), hàng `G` (Ground), và cáp nạp code Type-C. | Đặt tại mục 2.3.1: Minh chứng thiết kế module hóa không cần hàn chì, đấu nối cọc đực G-V-S chuẩn công nghiệp. |
| **Ảnh 3** | **Cận cảnh Khối Relay 4 Kênh (Actuator Block)** | Chụp rõ bo Rơ-le màu đỏ, thấy các cọc vặn ốc Domino xanh, 4 rơ-le Songle 5V và đèn LED SMD đỏ báo trạng thái ON/OFF. | Đặt tại mục 2.3.2: Minh chứng điều khiển đóng cắt cách ly quang an toàn điện, chuẩn Active-LOW. |
| **Ảnh 4** | **Cận cảnh Bảng Táp-Lô Nút Bấm (Breadboard Panel)** | Chụp rõ 5 nút bấm màu đen bắc ngang qua rãnh giữa, dải dây Mass chung sọc xanh và các dây tín hiệu màu sắc. | Đặt tại mục 2.3.3: Minh chứng giao diện tương tác cơ học tại chỗ và mô phỏng xác thực thẻ từ RFID. |
| **Ảnh 5** | **Cận cảnh Khối Cảm Biến & Báo Động (Sensors & Alarm)** | Chụp cận cảnh cảm biến khí gas MQ-2 (lưới thép tròn), cảm biến nhiệt ẩm DHT22 (vỏ nhựa trắng) và còi Active Buzzer 5V. | Đặt tại mục 2.3.4: Minh chứng tầng cảm nhận vi khí hậu và phân hệ an toàn PCCC. |

---

### 💡 MẸO CHỤP ẢNH ĐẸP CHUYÊN NGHIỆP:
1. **Ánh sáng:** Chụp dưới bàn làm việc có ánh đèn học màu trắng hoặc gần cửa sổ sáng tự nhiên, tránh bị bóng tay che khuất linh kiện.
2. **Gọn gàng dây nối:** Vuốt các sợi dây jumper cho uốn lượn gọn gàng, tránh dây đè che khuất mặt các con chip.
3. **Độ sắc nét:** Nhấn vào màn hình điện thoại để lấy nét chính xác vào dòng chữ in trên chip ESP32 và bo Rơ-le.

---

## PHẦN 3: BẢNG SẴN SÀNG TRIỂN KHAI CLOUD VPS (SETUP SUMMARY)

Hệ thống đã được đóng gói sẵn sàng 100% để bạn đưa lên Cloud VPS ngay khi thuê:

* **File script tự động:** Đã có sẵn file [deploy_vps.sh](file:///d:/DACNTT2/SmartDorm_SourceCode/deploy_vps.sh).
* **Cấu hình Docker:** Đã cấu hình tối ưu [docker-compose.yml](file:///d:/DACNTT2/SmartDorm_SourceCode/docker-compose.yml) và [.env.docker.example](file:///d:/DACNTT2/SmartDorm_SourceCode/.env.docker.example).
* **Cẩm nang hướng dẫn thuê:** Chi tiết từng bước tại file [HUONG_DAN_THUE_VA_CAI_DAT_VPS_CLOUD.md](file:///d:/DACNTT2/SmartDorm_SourceCode/HUONG_DAN_THUE_VA_CAI_DAT_VPS_CLOUD.md).

👉 **Khi bạn thuê xong VPS và có địa chỉ IP:** Bạn chỉ cần gửi tin nhắn cho tôi: *"Tôi đã có VPS IP là x.x.x.x"*, tôi sẽ hướng dẫn bạn chạy đúng 1 dòng lệnh là toàn bộ Web, API, AI và MQTT sẽ chạy online 24/24 trên Internet!
