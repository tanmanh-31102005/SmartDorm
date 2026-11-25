# 🛠️ CẨM NANG HƯỚNG DẪN LẮP RÁP BỘ MẠCH SMARTDORM CHI TIẾT TỪNG BƯỚC
> **Dành riêng cho người mới bắt đầu — Chưa từng có kinh nghiệm về mạch điện tử & IoT**  
> *Mục tiêu: Đọc đến đâu, cắm đúng đến đó, 100% an toàn, không sợ chập cháy, vận hành trơn tru ngay lần đầu tiên!*

---

## 📌 MỤC LỤC BÀI HỌC
1. [Phần 1: Nhận Diện & Phân Loại Linh Kiện Trên Bàn Làm Việc](#phần-1-nhận-diện--phân-loại-linh-kiện)
2. [Phần 2: Bí Quyết Đọc Hiểu Breadboard (Bo Cắm Lỗ Thử Nghiệm)](#phần-2-bí-quyết-đọc-hiểu-breadboard)
3. [Phần 3: Quy Tắc Cắm Nút Nhấn 4 Chân (Tránh Lỗi Hay Gặp Nhất)](#phần-3-quy-tắc-cắm-nút-nhấn-4-chân)
4. [Phần 4: Bản Đồ Chân ESP32 NodeMCU-32S (CP2102 Type-C)](#phần-4-bản-đồ-chân-esp32)
5. [Phần 5: Các Bước Lắp Ráp Chi Tiết Từng Khối Linh Kiện (100% Khớp Thực Tế)](#phần-5-các-bước-lắp-ráp-chi-tiết-từng-bước-100-khớp-thực-tế)
   - [Bước 1: Thiết Lập 2 Thanh Nguồn Chung (5V & Mass GND) Trên Breadboard](#bước-1-thiết-lập-2-thanh-nguồn-chung-trên-breadboard-5v--mass-gnd)
   - [Bước 2: Cắm 5 Nút Bấm Điều Khiển & Đại Diện Quẹt Thẻ Trên Breadboard](#bước-2-cắm-5-nút-nhấn--đấu-dây-tín-hiệu--mass-trên-breadboard)
   - [Bước 3: Cắm Còi Báo Động Active Buzzer 5V Trên Breadboard](#bước-3-cắm-còi-báo-động-active-buzzer-5v-trên-breadboard)
   - [Bước 4: Đấu Nối Module Rơ-le (Relay) 5V 4 Kênh](#bước-4-đấu-nối-module-relay-5v-4-kênh-khớp-100-theo-bo-mạch-của-bạn)
   - [Bước 5: Đấu Nối Cảm Biến Nhiệt Độ & Độ Ẩm DHT22](#bước-5-đấu-nối-cảm-biến-nhiệt-độ--độ-ẩm-dht22)
   - [Bước 6: Đấu Nối Cảm Biến Khí Gas / Khói MQ-2](#bước-6-đấu-nối-cảm-biến-khí-gas--khói-mq-2)
   - [Bước 7: Lắp Đặt Dàn Bóng Đèn LED 5mm Mô Phỏng Thiết Bị Phòng Trọ](#bước-7-lắp-đặt-dàn-bóng-đèn-led-5mm-mô-phỏng-thiết-bị-phòng-trọ)
6. [Phần 6: Bảng Tra Cứu Đấu Nối Tổng Hợp (Master Wiring Table)](#phần-6-bảng-tra-cứu-đấu-nối-tổng-hợp-master-wiring-table)
7. [Phần 7: Kiểm Tra An Toàn Trước Khi Cắm Điện (Safety Checklist)](#phần-7-kiểm-tra-an-toàn-trước-khi-cắm-điện-safety-checklist)
8. [Phần 8: Cắm Cáp Type-C, Cấu Hình WiFi & Thưởng Thức Thành Quả](#phần-8-cắm-cáp-type-c-cấu-hình-wifi--vận-hành)

---

## PHẦN 1: NHẬN DIỆN & PHÂN LOẠI LINH KIỆN

Trước khi bắt tay vào cắm dây, hãy sắp xếp các linh kiện bạn đã mua lên mặt bàn sạch sẽ và đối chiếu từng món:

| STT | Tên Linh Kiện | Hình Dáng Nhận Biết | Chức Năng Trong Dự Án |
|:---:|:---|:---|:---|
| 1 | **ESP32 CP2102 Type-C** | Bo mạch màu đen, có cổng cắm cáp Type-C và 2 hàng chân cắm kim loại nhô ra bên dưới. | "Bộ não" trung tâm, xử lý WiFi, gửi nhận dữ liệu MQTT. |
| 2 | **5 Nút nhấn nhả (Tactile Button)** | Khối vuông nhỏ màu đen có nút bấm tròn nhô lên ở giữa, dưới đáy có 4 chân kim loại uốn cong nhẹ. | Nút 1: Đèn (D32); Nút 2: Quạt (D33); Nút 3: Thẻ SV001 (D18); Nút 4: Thẻ SV002 (D19); Nút 5: Thẻ lạ (D21). |
| 3 | **Bóng Đèn LED 5mm** | Các bóng đèn nhỏ trong suốt có 2 chân dài ngắn. | Mô phỏng Đèn 1 (D25), Đèn 2 (D26), Quạt (D14), Khóa Cửa (D12), Đèn Báo Động đỏ (D13). |
| 4 | **Cảm biến DHT22** (3 chân) | Vỏ nhựa màu trắng hình chữ nhật có nhiều khe thoáng khí, gắn trên một bảng mạch nhỏ có 3 chân: `+`, `out`, `-`. | Đo nhiệt độ phòng (°C) và độ ẩm không khí (%). |
| 5 | **Cảm biến Khí Gas MQ-2** (4 chân) | Có một núm tròn bọc lưới kim loại sáng bóng, phía sau có 4 chân kim loại: `VCC`, `GND`, `DO`, `AO`. | Phát hiện rò rỉ khí gas / khói để báo động cháy nổ. |
| 6 | **Module Relay 5V 4 Kênh** | Bo mạch màu đỏ có 4 rơ-le màu đen (hoặc xanh), cọc vặn ốc Domino màu xanh dương. | "Công tắc thông minh" bật/tắt Đèn 1, Đèn 2, Quạt và Khóa Cửa. |
| 7 | **Còi Active Buzzer 5V** | Một hình trụ tròn màu đen nhỏ bằng đầu ngón tay, trên mặt có lỗ phát âm thanh, bên dưới có 2 chân kim loại. | Phát tiếng kêu "tít tít" cảnh báo khi có sự cố cháy/gas hoặc thẻ lạ. |
| 8 | **Breadboard (Bo cắm lỗ)** | Tấm nhựa màu trắng có hàng trăm lỗ nhỏ xếp thẳng hàng dọc và ngang. | Dùng để cắm giữ linh kiện và nối dây mà **không cần hàn chì**. |
| 9 | **Dây cắm mạch (Jumper wires)** | Các sợi dây điện nhiều màu sắc: Cái - Đực, Đực - Đực, Cái - Cái. | Kết nối các chân linh kiện lại với nhau. |

---

## PHẦN 2: BÍ QUYẾT ĐỌC HIỂU BREADBOARD

Breadboard là công cụ tuyệt vời giúp người mới không bao giờ phải cầm mỏ hàn. Bên dưới lớp vỏ nhựa của Breadboard là các lá đồng dẫn điện chạy ngầm theo quy tắc cố định sau:

```
    CỘT NGUỒN BIÊN TRÁI            CÁC HÀNG NGANG TRUNG TÂM             CỘT NGUỒN BIÊN PHẢI
        (+)    (-)                     a   b   c   d   e                       (+)    (-)
     (Sọc Đỏ)(Sọc Xanh)                                                 (Sọc Đỏ)(Sọc Xanh)
   ┌───┬──────┬──────┐               ┌───┬───┬───┬───┬───┐               ┌───┬──────┬──────┐
 1 │ ● │  ●   │  ●   │             1 │ ● │ ● │ ● │ ● │ ● │             1 │ ● │  ●   │  ●   │
 2 │ ● │  ●   │  ●   │             2 │ ● │ ● │ ● │ ● │ ● │             2 │ ● │  ●   │  ●   │
 3 │ ● │  ●   │  ●   │             3 │ ● │ ● │ ● │ ● │ ● │             3 │ ● │  ●   │  ●   │
   │ │ │  │   │  │   │               └───┴───┴───┴───┴───┘               │ │ │  │   │  │   │
   │ │ │  ▼   │  ▼   │               ◄── THÔNG NHAU THEO ──►             │ │ │  ▼   │  ▼   │
   │ │ │Thông │Thông │                   HÀNG NGANG (1-5)                │ │ │Thông │Thông │
   │ │ │dọc từ│dọc từ│               ═════════════════════               │ │ │dọc từ│dọc từ│
   │ │ │trên  │trên  │               RÃNH CHIA ĐÔI Ở GIỮA                │ │ │trên  │trên  │
   │ │ │xuống │xuống │               (Cách điện Trái - Phải)             │ │ │xuống │xuống │
   │ │ │dưới  │dưới  │               ═════════════════════               │ │ │dưới  │dưới  │
   └───┴──────┴──────┘               ┌───┬───┬───┬───┬───┐               └───┴──────┴──────┘
                                   1 │ ● │ ● │ ● │ ● │ ● │
                                   2 │ ● │ ● │ ● │ ● │ ● │
                                     └───┴───┴───┴───┴───┘
                                       f   g   h   i   j
```

### 3 Nguyên Tắc Cốt Lõi:
1. **Dải dọc biên sọc xanh (`-`)**: Tất cả các lỗ chạy dọc từ trên xuống dưới đều **thông với nhau**. Ta sẽ dùng dải này làm **"Thanh Mass Chung (GND)"** cho toàn bộ mạch.
2. **Dải dọc biên sọc đỏ (`+`)**: Tất cả các lỗ chạy dọc từ trên xuống dưới đều **thông với nhau**. Ta sẽ dùng dải này làm **"Thanh Nguồn Chung (5V/VIN)"**.
3. **Các hàng ngang ở giữa (a-b-c-d-e)**: 5 lỗ trên cùng một hàng ngang (ví dụ hàng 10) **nối thông với nhau**. Nhưng hàng 10 và hàng 11 thì **cách điện hoàn toàn**.
4. **Rãnh lõm ở chính giữa**: Ngăn cách điện giữa nửa bên trái (a-b-c-d-e) và nửa bên phải (f-g-h-i-j). Bo mạch ESP32 và các nút bấm sẽ được cắm **nằm vắt ngang qua rãnh này**!

---

## PHẦN 3: QUY TẮC CẮM NÚT NHẤN 4 CHÂN

Người mới học điện tử 90% cắm sai nút bấm 4 chân vì tưởng rằng 4 chân này độc lập. Thực tế:
- Nút bấm 4 chân được chia làm **2 cặp chân**: 2 chân cùng một vế đã được nối ngầm với nhau bằng lá đồng bên trong!
- Nếu bạn cắm 2 dây vào 2 chân dính nhau sẵn, nút bấm sẽ bị "kẹt bật vĩnh viễn" (chập mạch).

### 💡 Cách cắm chuẩn và không thể sai:
Hãy cắm nút bấm **vắt ngang qua rãnh giữa của Breadboard** như hình vẽ dưới:

```
              Nửa Trái Breadboard (e)         RÃNH GIỮA        Nửa Phải Breadboard (f)
           ───────────────────────────┬──────────────────────┬───────────────────────────
                                      │                      │
           [Chân 1 của nút] ──────────┼───┐              ┌───┼────────── [Chân 3 của nút]
                                      │   │  ┌────────┐  │   │
                                      │   └──┤  NÚT   ├──┘   │
                                      │      │  BẤM   │      │
                                      │   ┌──┤ TRÒN   ├──┐   │
           [Chân 2 của nút] ──────────┼───┘  └────────┘  └───┼────────── [Chân 4 của nút]
                                      │                      │
           ───────────────────────────┴──────────────────────┴───────────────────────────
```

👉 **Quy tắc đấu dây chéo góc (Khắc phục 100% lỗi nút bị chập dính):**
- **Chân 1 (Góc Trên - Bên Trái, ví dụ `e1`):** Cắm dây về chân **GPIO của ESP32** (ví dụ GPIO 32).
- **Chân 4 (Góc Dưới - Bên Phải, ví dụ `f3`):** Cắm dây sang **Thanh Mass Chung (GND)**.
- Hai chân còn lại (`e3` và `f1`): **Để trống hoàn toàn!**
- 💡 *Tại sao cắm chéo góc lại chuẩn nhất? Vì 2 chân chéo nhau 100% không bao giờ bị nối ngầm bên trong nút! Chỉ khi bạn lấy tay nhấn nút xuống thì mạch mới đóng tiếp điểm kéo về 0V GND.*

---

## PHẦN 4: BẢN ĐỒ CHÂN ESP32 (KHỚP 100% VỚI BO MẠCH THỰC TẾ CỦA BẠN)

Hãy đặt bo mạch ESP32 trước mặt, hướng cổng cắm cáp Type-C quay xuống phía dưới (về phía ngực bạn). Dưới đây là vị trí **chính xác từng chữ in lụa trắng trên bo mạch của bạn**:

```
                             ┌───────────────────┐
                             │    ĂNG-TEN WIFI   │
                             │   (Hình zíc zắc)  │
                             ├───────────────────┤
                   [EN] ● 1  │                   │ 30 ● [D23] (Để trống)
                   [VP] ● 2  │                   │ 29 ● [D22] (Để trống)
                   [VN] ● 3  │                   │ 28 ● [TX0] (Để trống)
          [D34 (MQ-2)]  ● 4  │   ESP-WROOM-32    │ 27 ● [RX0] (Để trống)
                  [D35] ● 5  │                   │ 26 ● [D21 (Nút Thẻ Lạ)]
           [D32 (Đèn)]  ● 6  │                   │ 25 ● [D19 (Nút Thẻ SV002)]
          [D33 (Quạt)]  ● 7  │                   │ 24 ● [D18 (Nút Thẻ SV001)]
        [D25 (Relay 1)] ● 8  │                   │ 23 ● [D5]  (Để trống)
        [D26 (Relay 2)] ● 9  │                   │ 22 ● [TX2] (Để trống)
                  [D27] ● 10 │                   │ 21 ● [RX2] (Để trống)
        [D14 (Relay 3)] ● 11 │                   │ 20 ● [D4  (DHT22 Data)]
        [D12 (Relay 4)] ● 12 │                   │ 19 ● [D2]  (Để trống)
        [D13 (Báo động)]● 13 │   [Nút]   [Nút]   │ 18 ● [D15 (Buzzer)]
            [GND (Trái)]● 14 │    EN     BOOT    │ 17 ● [GND (Phải)]
             [VIN (5V)] ● 15 │                   │ 16 ● [3V3 (3.3V cho DHT22)]
                             ├───────────────────┤
                             │   CỔNG TYPE-C     │
                             └───────█████───────┘
```

> **📌 Vị trí nguồn & mass trên bo mạch thực tế của bạn (Rất dễ nhớ):**
> - **Chân `VIN` (5V):** Nằm ở **Góc dưới cùng bên TRÁI** (Chân số 15, cạnh nút EN và cổng Type-C). Cấp nguồn 5V sang Dải sọc ĐỎ bên Trái Breadboard (nuôi MQ-2 và Relay 4 kênh).
> - **Chân `3V3` (3.3V):** Nằm ở **Góc dưới cùng bên PHẢI** (Chân số 16, cạnh nút BOOT). Dùng cấp nguồn 3.3V riêng cho cảm biến **DHT22** (không còn bị trùng với bất kỳ linh kiện nào).
> - **Chân `GND` (Mass 0V):** Có ở **CẢ 2 BÊN** ngay phía trên chân nguồn (Chân 14 bên trái và chân 17 bên phải). Nối sang Dải sọc Xanh làm Mass chung cho toàn hệ thống!
> - **Chân tín hiệu bên TRÁI:** D34 (Cảm biến Gas MQ-2), D32 (Nút Bấm Đèn), D33 (Nút Bấm Quạt), D25 (Relay 1 / LED 1), D26 (Relay 2 / LED 2), D14 (Relay 3 / LED 3), D12 (Relay 4 / LED 4), D13 (LED 5 Báo Động đỏ).
> - **Chân tín hiệu bên PHẢI:** D18 (Nút Quẹt Thẻ SV001), D19 (Nút Quẹt Thẻ SV002), D21 (Nút Quẹt Thẻ Lạ), D4 (Cảm biến DHT22), D15 (Còi Buzzer).

---

## PHẦN 5: CÁC BƯỚC LẮP RÁP CHI TIẾT TỪNG BƯỚC (100% KHỚP THỰC TẾ)

Dưới đây là hình ảnh tổng quan toàn bộ hệ thống sau khi lắp ráp hoàn thiện:

![Sơ đồ tổng thể hệ thống SmartDorm](docs/hardware_images/tong_the_lap_rap.jpg)
*Hình 5.1: Toàn cảnh đấu nối thực tế bo ESP32, Breadboard (5 nút bấm + còi), Relay 4 kênh, DHT22 và MQ-2.*

![Sơ đồ nguyên lý đấu nối Fritzing](docs/hardware_images/so_do_nguyen_ly_fritzing.jpg)
*Hình 5.2: Sơ đồ đi dây nguyên lý trực quan (Fritzing Schematic).*

---

### ⚠️ LƯU Ý SỐNG CÒN VỀ KÍCH THƯỚC ESP32 VÀ BREADBOARD

Trên các video lý thuyết, bạn thường thấy người ta nói "cắm ESP32 vắt ngang rãnh giữa Breadboard". **Nhưng trong thực tế đối với bo ESP32 30 chân và bo cắm MB-102 (như trong ảnh bạn chụp):**
- Bề ngang giữa 2 hàng chân kim loại của ESP32 là khoảng **25.4 mm (bằng đúng khoảng cách 10 lỗ trên Breadboard)**.
- Breadboard MB-102 chỉ có 10 cột lỗ chia đều 2 bên rãnh giữa: `a, b, c, d, e` và `f, g, h, i, j`.
- **Nếu bạn cắm ESP32 trực tiếp lên Breadboard:**
  - Hàng chân bên trái rơi vào Cột `b`, thì hàng chân bên phải sẽ rơi đúng vào Cột `j` ngoài cùng.
  - Kết quả: Phía bên trái còn 1 lỗ (cột `a`), nhưng **phía bên phải (cột `j`) không còn bất kỳ lỗ nào để cắm dây!** Bạn sẽ bị bít kín các chân quan trọng bên phải (`D4`, `D15`, `3V3`, `GND`, `D18`, `D19`, `D21`).

👉 **VÌ VẬY, CÓ 2 PHƯƠNG ÁN THỰC TẾ ĐỂ BẠN LỰA CHỌN:**

* **🌟 PHƯƠNG ÁN 1 (KHUYÊN DÙNG 100% CHO NGƯỜI MỚI - ĐẸP, RÕ VÀ DỄ LÀM NHẤT):**
  - Đặt bo ESP32 **nằm trên bàn bên cạnh Breadboard** (như trong ảnh thực tế bạn đang chụp).
  - Dùng dây cắm **Cái - Đực (Female - Male)**:
    - Đầu **Cái** (lỗ tròn bọc nhựa): Cắm trùm trực tiếp vào từng chân cọc kim loại của ESP32. Chữ in lụa `D4, D15, 3V3, VIN, GND, D34...` hiện rõ 100% trước mắt bạn, không bao giờ lo cắm nhầm lỗ hay đếm lệch hàng!
    - Đầu **Đực** (cọc kim loại nhọn): Cắm sang Breadboard hoặc các module.
  - Breadboard dùng trọn vẹn diện tích để:
    1. Cắm 5 Nút nhấn nhả (nằm vắt ngang qua rãnh giữa cực kỳ vừa khít như nút bạn đã cắm).
    2. Cắm Còi Buzzer 5V.
    3. Làm 2 thanh phân phối nguồn chung: Nguồn 5V và Mass GND.
  - *Cách này 99% sinh viên và kỹ sư làm lab đồ án đều áp dụng vì mạch cực kỳ thoáng, dễ kiểm tra, không sợ chật chân!*

* **PHƯƠNG ÁN 2 (NẾU BẠN VẪN MUỐN CẮM CHẶT ESP32 LÊN BREADBOARD):**
  - Cắm hàng chân trái vào Cột `b` (từ hàng 31 đến 45), hàng chân phải vào Cột `j` (từ hàng 31 đến 45).
  - Phía bên trái: Cắm dây Đực - Đực vào Cột `a` tương ứng.
  - Phía bên phải: Vì cột `j` bị bo mạch che kín, bạn phải **cắm sẵn các đầu dây Đực - Đực vào các lỗ cột `j` TRƯỚC, rồi mới ấn ESP32 đè lên**, HOẶC dùng dây **Cái - Đực** cắm vào đầu cọc kim loại nhô lên trên lưng ESP32.

*(Trong toàn bộ hướng dẫn bên dưới, chúng ta sẽ đi theo **Phương Án 1** vì trực quan nhất, thao tác nhanh nhất và không bao giờ bị lỗi kẹt chân!)*

---

### BƯỚC 1: THIẾT LẬP 2 THANH NGUỒN CHUNG TRÊN BREADBOARD (5V & MASS GND)

Breadboard MB-102 của bạn có **dải nguồn chạy dọc ở mép ngoài cùng bên TRÁI**:
- **Cột sọc Đỏ `(+)`:** Ta dùng làm **Thanh Nguồn 5V Chung** (nuôi Cảm biến Gas MQ-2 và Bo Rơ-le 4 kênh).
- **Cột sọc Xanh `(-)`:** Ta dùng làm **Thanh Mass Chung (0V GND)** cho toàn bộ nút bấm, còi, cảm biến và rơ-le.

> 💡 **VỀ NGUỒN 3.3V CHO CẢM BIẾN DHT22:**  
> Vì hệ thống dùng 5 nút bấm đại diện quẹt thẻ thay cho module RFID-RC522, nên trong mạch **chỉ có duy nhất Cảm biến DHT22 sử dụng nguồn 3.3V**!  
> Chân `+` của DHT22 sẽ được cắm dây trực tiếp từ cọc chân **`3V3`** của ESP32 (Chân 16 góc dưới bên phải). **100% không còn lo bị trùng chân hay thiếu chân nguồn!**

```
    [ESP32]                       [BREADBOARD - MÉP TRÁI]
┌──────────────┐                 ┌───────────────────────┐
│              │                 │ (+) Đỏ        (-) Xanh│
│  [VIN (5V)]  │ ──(Dây Đỏ)─────►│   ●                   │ ◄── Thanh Nguồn 5V Chung (Nuôi MQ-2 & Relay)
│  (Chân 15 T) │                 │                       │
│              │                 │                       │
│  [GND (0V)]  │ ──(Dây Đen)────►│                  ●    │ ◄── Thanh Mass Chung (0V GND)
│  (Chân 14 T) │                 │                       │
│              │                 │                       │
│  [3V3 (3.3V)]│ ──(Cắm trực tiếp nuôi DHT22 ở Bước 5)   │
│  (Chân 16 P) │                 │                       │
└──────────────┘                 └───────────────────────┘
```

**Thao tác cụ thể:**
1. **Thiết lập Thanh Nguồn 5V (Dải sọc Đỏ bên TRÁI):**
   - Lấy **1 sợi dây cắm Cái - Đực màu ĐỎ**:
     - Đầu **Cái**: Cắm trùm vào chân **`VIN`** của ESP32 *(Chân số 15 dưới cùng bên trái, cạnh cổng Type-C)*.
     - Đầu **Đực**: Cắm vào bất kỳ lỗ nào trên **Dải dọc có sọc ĐỎ (`+`) bên TRÁI** của Breadboard.
     - 👉 *Toàn bộ dải sọc đỏ này mang điện áp 5V nuôi MQ-2 và Bo Relay 4 kênh.*
2. **Thiết lập Thanh Mass Chung 0V GND (Dải sọc Xanh bên TRÁI):**
   - Lấy **1 sợi dây cắm Cái - Đực màu ĐEN**:
     - Đầu **Cái**: Cắm trùm vào chân **`GND`** của ESP32 *(Chân số 14 bên trái, ngay phía trên chân VIN)*.
     - Đầu **Đực**: Cắm vào bất kỳ lỗ nào trên **Dải dọc có sọc XANH (`-`) bên TRÁI** của Breadboard.
     - 👉 *Toàn bộ dải sọc xanh này là Mass chung (0V GND) cho toàn bộ hệ thống!*

---

### BƯỚC 2: CẮM 5 NÚT NHẤN & ĐẤU DÂY TÍN HIỆU + MASS TRÊN BREADBOARD

Hệ thống sử dụng **5 nút nhấn nhả** được cắm ngay ngắn trên Breadboard:
- **Nút 1:** Bật / Tắt Đèn phòng (GPIO 32)
- **Nút 2:** Bật / Tắt Quạt thông gió (GPIO 33)
- **Nút 3:** Mô phỏng quẹt thẻ **SV2024001 - Nguyễn Văn An** (GPIO 18) → → Khóa cửa mở 4s, còi kêu 1 tiếng bíp ngắn.
- **Nút 4:** Mô phỏng quẹt thẻ **SV2024002 - Trần Thị Bình** (GPIO 19) → → Khóa cửa mở 4s, còi kêu 1 tiếng bíp ngắn.
- **Nút 5:** Mô phỏng quẹt **Thẻ Lạ không hợp lệ** (GPIO 21) → → Còi hú 3 tiếng bíp, cửa giữ khóa, gửi cảnh báo lên Web!

#### 1. Vị trí cắm 5 nút trên Breadboard:
Cắm cả 5 nút **vắt ngang qua rãnh giữa** của Breadboard (mỗi nút chiếm 3 hàng, cách nhau 2 hàng trống cho thông thoáng):
- **Nút 1 (Đèn):** Cắm vắt qua rãnh giữa tại **Hàng 1 đến Hàng 3** (Chân trái ở cột `e1, e3`, chân phải ở cột `f1, f3`).
- **Nút 2 (Quạt):** Cắm vắt qua rãnh giữa tại **Hàng 6 đến Hàng 8** (Chân trái ở cột `e6, e8`, chân phải ở cột `f6, f8`).
- **Nút 3 (Thẻ SV001):** Cắm vắt qua rãnh giữa tại **Hàng 11 đến Hàng 13** (Chân trái ở cột `e11, e13`, chân phải ở cột `f11, f13`).
- **Nút 4 (Thẻ SV002):** Cắm vắt qua rãnh giữa tại **Hàng 16 đến Hàng 18** (Chân trái ở cột `e16, e18`, chân phải ở cột `f16, f18`).
- **Nút 5 (Thẻ Lạ):** Cắm vắt qua rãnh giữa tại **Hàng 21 đến Hàng 23** (Chân trái ở cột `e21, e23`, chân phải ở cột `f21, f23`).

#### 2. Đấu dây Mass cho 5 nút (Dùng 5 sợi dây Đực - Đực màu Đen - CẮM CHÉO GÓC):
Ở nửa bên phải của rãnh giữa, cắm dây vào **Chân Dưới - Bên Phải (cột f)** của từng nút rồi nối sang **Thanh Mass Chung (`-`) bên Trái**:
- Cắm 1 đầu vào cột **`f3`** (Nút 1) → → Đầu kia cắm vào **Thanh Mass (`-`)**.
- Cắm 1 đầu vào cột **`f8`** (Nút 2) → → Đầu kia cắm vào **Thanh Mass (`-`)**.
- Cắm 1 đầu vào cột **`f13`** (Nút 3) → → Đầu kia cắm vào **Thanh Mass (`-`)**.
- Cắm 1 đầu vào cột **`f18`** (Nút 4) → → Đầu kia cắm vào **Thanh Mass (`-`)**.
- Cắm 1 đầu vào cột **`f23`** (Nút 5) → → Đầu kia cắm vào **Thanh Mass (`-`)**.

#### 3. Đấu dây tín hiệu từ 5 nút về ESP32 (Dùng 5 sợi dây Cái - Đực):
Ở nửa bên trái của rãnh giữa, cắm đầu **Đực** vào **Chân Trên - Bên Trái (cột e)** của từng nút và đầu **Cái** trùm vào chân GPIO của ESP32:
- **Nút 1 (Đèn):** Đầu Đực cắm vào cột `e1` → → Đầu Cái cắm vào chân **`D32`** của ESP32 *(Hàng bên trái, chân 6 từ trên xuống)*.
- **Nút 2 (Quạt):** Đầu Đực cắm vào cột `e6` → → Đầu Cái cắm vào chân **`D33`** của ESP32 *(Hàng bên trái, chân 7 từ trên xuống)*.
- **Nút 3 (Thẻ SV001):** Đầu Đực cắm vào cột `e11` → → Đầu Cái cắm vào chân **`D18`** của ESP32 *(Hàng bên phải, chân 7 từ dưới lên)*.
- **Nút 4 (Thẻ SV002):** Đầu Đực cắm vào cột `e16` → → Đầu Cái cắm vào chân **`D19`** của ESP32 *(Hàng bên phải, chân 6 từ dưới lên)*.
- **Nút 5 (Thẻ Lạ):** Đầu Đực cắm vào cột `e21` → → Đầu Cái cắm vào chân **`D21`** của ESP32 *(Hàng bên phải, chân 5 từ dưới lên)*.

---

### BƯỚC 3: CẮM CÒI BÁO ĐỘNG ACTIVE BUZZER 5V TRÊN BREADBOARD

Còi Buzzer hình trụ tròn màu đen có 2 chân kim loại nhô ra:
- **Chân Dài hơn (Cực Dương `+`):** Nhận xung điều khiển từ ESP32.
- **Chân Ngắn hơn (Cực Âm `-`):** Nối về Mass.

```
          ACTIVE BUZZER TRÊN BREADBOARD
             ┌─────────────────────────┐
             │       ● CÒI TRÒN        │
             └────────┬──────────┬─────┘
   Chân Dài (+) ở hàng 27      Chân Ngắn (-) ở hàng 28
              │                          │
        (Cột c27 / a27)            (Cột c28 / a28)
              │                          │
   (Dây Cái-Đực Tím/Cam)           (Dây Đực-Đực Đen)
              │                          │
              ▼                          ▼
      Chân D15 của ESP32        Thanh Mass Chung [ - ]
```

**Thao tác cụ thể:**
1. Cắm 2 chân còi vào nửa bên trái của Breadboard (ví dụ hàng 27 và 28):
   - Cắm **Chân Dài (`+`)** vào lỗ cột `c27`.
   - Cắm **Chân Ngắn (`-`)** vào lỗ cột `c28`.
2. Nối dây tín hiệu điều khiển còi:
   - Lấy **1 sợi dây Cái - Đực** (màu Cam hoặc Tím):
     - Đầu Đực: Cắm vào lỗ cột `a27` *(cùng hàng 27 với chân dài)*.
     - Đầu Cái: Cắm vào chân **`D15`** của ESP32 *(Hàng bên phải, chân số 3 từ dưới lên, ngay phía trên chân GND)*.
3. Nối dây Mass còi:
   - Lấy **1 sợi dây Đực - Đực** (màu Đen):
     - Đầu 1: Cắm vào lỗ cột `a28` *(cùng hàng 28 với chân ngắn)*.
     - Đầu 2: Cắm vào **Thanh Mass Chung (`-`)** trên Breadboard.

---

### BƯỚC 4: ĐẤU NỐI MODULE RELAY 5V 4 KÊNH (KHỚP 100% THEO BO MẠCH CỦA BẠN)

Module Relay là cụm đóng cắt tự động cho Đèn 1, Đèn 2, Quạt và Khóa Cửa.

![Module Relay 4 kênh thực tế của bạn](docs/hardware_images/relay_thuc_te_cua_ban.jpg)
*Hình 5.4: Bo Relay 4 kênh thực tế của bạn (bo màu đỏ, có cọc Domino vặn ốc màu xanh và jumper màu đen).*

#### 1. Cầu Jumper màu đen chọn mức kích (Góc dưới bên phải):
- Nhìn vào góc dưới bên phải của bo mạch (phía dưới cọc xanh), bạn thấy cụm chân cắm có ký hiệu `High`, `Com`, `Low` và các kênh `S1, S2, S3, S4`.
- **Thực tế trên bo của bạn:** Cả 4 cục jumper nhựa màu đen **đang cắm ở vị trí `Low - Com` (Low-Level Trigger)** ngay từ nhà sản xuất.
- 👉 **Hệ thống ĐÃ ĐƯỢC ĐỒNG BỘ 100% THEO CHUẨN ACTIVE-LOW TRONG CODE ESP32:**
  - Firmware trong `hardware/src/main.cpp` đã định nghĩa sẵn:
    - `#define RELAY_ON  LOW` (Xuất mức 0V để đóng rơ-le, bật thiết bị, sáng đèn LED đỏ trên rơ-le).
    - `#define RELAY_OFF HIGH` (Xuất mức 3.3V để ngắt rơ-le, tắt thiết bị, đèn LED đỏ tắt).
  - Đồng thời trong hàm `setup()`, ESP32 được cấu hình xuất sẵn mức `HIGH` trước khi mở cổng OUTPUT, giúp triệt tiêu hoàn toàn hiện tượng rơ-le bị nhảy kêu tạch khi vừa cắm điện.
  - 👉 **Bạn GIỮ NGUYÊN 100% JUMPER Ở MỨC HIỆN TẠI, KHÔNG CẦN RÚT RA ĐỔI CHỖ!** Bo mạch hoạt động cực kỳ ổn định, cuộn hút không bị nóng khi nghỉ, đồng bộ chuẩn xác 100% với Web Dashboard, Telegram Bot và Nút bấm vật lý.

#### 2. Thao tác đấu dây vào Cọc Vặn Ốc (Domino màu xanh bên phải):
Bo mạch của bạn là phiên bản cao cấp sử dụng **Cọc vặn ốc Domino (Screw Terminal Block)** màu xanh dương thay vì cọc cắm lỏng lẻo. Cọc vặn ốc giúp dây nối siêu chắc chắn, không bao giờ bị chập chờn!

👉 **Cách thao tác cắm dây vào cọc vặn ốc:**
1. Dùng 1 chiếc tua-vít 4 cạnh nhỏ (hoặc 2 cạnh dẹt nhỏ), xoay ngược chiều kim đồng hồ để nới lỏng con ốc ở cổng cần nối.
2. Lấy **ĐẦU ĐỰC (đầu cọc kim loại nhọn)** của dây cắm mạch nhét ngập vào khe cọc bên dưới con ốc.
3. Xoay xuôi chiều kim đồng hồ để vặn chặt ốc vít lại → → Cầm nhẹ dây lay thử, thấy dây dính cứng ngắc là đạt!

```
     CỌC VẶN ỐC TRÊN RELAY                  ĐÍCH CẮM TRÊN ESP32 / BREADBOARD
 ┌───────────────────────────┐
 │ [IN4] (Ốc trên cùng)      │ ──(Dây Đực-Cái Trắng)────────► Chân D12 của ESP32 (Khóa Cửa)
 │ [IN3] (Ốc thứ 2 từ trên)  │ ──(Dây Đực-Cái Vàng)─────────► Chân D14 của ESP32 (Quạt thông gió)
 │ [IN2] (Ốc thứ 3 từ trên)  │ ──(Dây Đực-Cái Xanh dương)───► Chân D26 của ESP32 (Đèn 2)
 │ [IN1] (Ốc thứ 4 từ trên)  │ ──(Dây Đực-Cái Xanh dương)───► Chân D25 của ESP32 (Đèn 1)
 │ [DC-] (Ốc thứ 2 từ dưới)  │ ──(Dây Đực-Đực Đen)──────────► Thanh Mass Chung [ - ] trên Breadboard
 │ [DC+] (Ốc dưới cùng)      │ ──(Dây Đực-Đực Đỏ)───────────► Thanh Nguồn 5V [ + ] trên Breadboard
 └───────────────────────────┘
```

**Bảng hướng dẫn chi tiết từng cổng vặn ốc:**

| Cổng Vặn Ốc Trên Relay | Đích Cắm Dây | Chức Năng Điều Khiển | Loại Dây Cần Dùng | Màu Dây Gợi Ý |
|:---|:---|:---|:---:|:---:|
| **`DC+`** *(Ốc dưới cùng)* | Cắm vào **Thanh Nguồn 5V (`+`)** trên Breadboard | Cấp nguồn nuôi 5V rơ-le | **Đực - Đực** | Đỏ |
| **`DC-`** *(Ốc thứ 2 từ dưới)* | Cắm vào **Thanh Mass Chung (`-`)** trên Breadboard | Nối Mass GND chung | **Đực - Đực** | Đen |
| **`IN1`** *(Ốc thứ 3 từ dưới)* | Cắm đầu Cái vào chân **`D25`** của ESP32 *(Chân 8 bên trái)* | Điều khiển **Đèn 1** | **Đực - Cái** | Xanh dương |
| **`IN2`** *(Ốc thứ 4 từ dưới)* | Cắm đầu Cái vào chân **`D26`** của ESP32 *(Chân 9 bên trái)* | Điều khiển **Đèn 2** | **Đực - Cái** | Xanh dương |
| **`IN3`** *(Ốc thứ 5 từ dưới)* | Cắm đầu Cái vào chân **`D14`** của ESP32 *(Chân 11 bên trái)* | Điều khiển **Quạt** | **Đực - Cái** | Vàng |
| **`IN4`** *(Ốc trên cùng)* | Cắm đầu Cái vào chân **`D12`** của ESP32 *(Chân 12 bên trái)* | Điều khiển **Khóa Cửa** | **Đực - Cái** | Trắng |

*(💡 Mẹo nhỏ: Khi cấp điện qua cáp Type-C vào ESP32, đèn `PWR` màu đỏ trên bo Relay sẽ sáng báo nguồn nuôi đã vào thành công!)*

---

### BƯỚC 5: ĐẤU NỐI CẢM BIẾN NHIỆT ĐỘ & ĐỘ ẨM DHT22

Cảm biến DHT22 có 3 chân kim loại nhô ra: `+` (VCC), `out` (DATA), `-` (GND).

![Chi tiết đấu nối Cảm biến DHT22 và MQ-2](docs/hardware_images/cam_bien_dht22_mq2.jpg)
*Hình 5.5: Chi tiết chân cắm trên Module DHT22 (trắng) và Module MQ-2 (xanh).*

```
       CẢM BIẾN DHT22 (3 CHÂN)                     ĐÍCH CẮM TRÊN HỆ THỐNG
      ┌─────────────────────────┐
      │   [ + ]  (Nguồn 3.3V)   │ ──(Dây Cái-Cái Đỏ/Cam)──► Chân 3V3 của ESP32 (Chân 16 góc dưới phải)
      │   [out]  (Tín hiệu DATA)│ ──(Dây Cái-Cái Vàng)────► Chân D4 của ESP32 (GPIO 4)
      │   [ - ]  (Mass GND)     │ ──(Dây Cái-Đực Đen)─────► Thanh Mass Chung [ - ] trên Breadboard
      └─────────────────────────┘
```

**Thao tác cụ thể:**
- Chân **`+`** của DHT22 → Nối bằng dây Cái - Cái trực tiếp vào chân **`3V3`** của ESP32 *(Hàng bên phải, chân số 16 góc dưới cùng, cạnh nút BOOT)*.  
  *(💡 Vì không dùng module RFID nữa nên chân 3V3 của ESP32 dành riêng cho DHT22, cắm cực kỳ thoải mái và sạch đẹp! Tuyệt đối không cắm sang chân VIN 5V kẻo hỏng cảm biến).*
- Chân **`-`** của DHT22 → Nối bằng dây Cái - Đực vào **Thanh Mass Chung (`-`)** trên Breadboard.
- Chân **`out`** của DHT22 → Nối bằng dây Cái - Cái vào chân **`D4`** của ESP32 *(Hàng bên phải, chân số 5 từ dưới lên)*.

---

### BƯỚC 6: ĐẤU NỐI CẢM BIẾN KHÍ GAS / KHÓI MQ-2

Module cảm biến khí gas MQ-2 có 4 chân: `VCC`, `GND`, `DO`, `AO`.

```
        CẢM BIẾN MQ-2 (4 CHÂN)                     ĐÍCH CẮM TRÊN HỆ THỐNG
      ┌─────────────────────────┐
      │   [VCC]  (Nguồn 5V)     │ ──(Dây Cái-Đực Đỏ)──────► Thanh Nguồn 5V [ + ] trên Breadboard
      │   [GND]  (Mass)         │ ──(Dây Cái-Đực Đen)─────► Thanh Mass Chung [ - ] trên Breadboard
      │   [AO]   (Analog Out)   │ ──(Dây Cái-Cái Xanh lá)─► Chân D34 của ESP32 (GPIO 34 ADC)
      │   [DO]   (Digital Out)  │ ────────────────────────► [ĐỂ TRỐNG - TUYỆT ĐỐI KHÔNG CẮM DÂY]
      └─────────────────────────┘
```

**Thao tác cụ thể:**
1. Chân **`VCC`** của MQ-2 → Nối bằng dây Cái - Đực vào **Thanh Nguồn 5V (`+`)** trên Breadboard.
2. Chân **`GND`** của MQ-2 → Nối bằng dây Cái - Đực vào **Thanh Mass Chung (`-`)** trên Breadboard.
3. Chân **`AO`** của MQ-2 → Nối bằng dây Cái - Cái vào chân **`D34`** của ESP32 *(Hàng bên trái, chân số 4 từ trên xuống)*.
4. Chân **`DO`** của MQ-2 → **Để trống hoàn toàn**, không cắm bất kỳ dây nào! Vì hệ thống SmartDorm đọc sóng Analog biến thiên liên tục từ 0-4095 qua chân D34 để tính toán nồng độ ppm chính xác và đưa vào mô hình AI.

> **💡 Mẹo nhỏ thực tế:** Sau khi cắm nguồn 1 - 2 phút, lồng sắt tròn của MQ-2 sẽ hơi ấm lên khi sờ tay vào. Đây là cơ chế sưởi nhiệt sensor bình thường của dòng cảm biến bán dẫn MQ, hoàn toàn an tâm!

---

### BƯỚC 7: LẮP ĐẶT DÀN BÓNG ĐÈN LED 5MM MÔ PHỎNG THIẾT BỊ PHÒNG TRỌ

> 💡 **TẠI SAO CẦN LẮP BÓNG ĐÈN MÔ PHỎNG?**  
> Trong mô hình đồ án IoT phòng trọ, bo Rơ-le 4 kênh đóng vai trò là công tắc thông minh. Tuy nhiên, trong phòng thí nghiệm bạn chưa nối tải điện lưới 220V thực tế.  
> Vì vậy, các **Bóng đèn LED 5mm** (trong túi bóng trong suốt) sẽ đóng vai trò là **"Bóng đèn mô phỏng"**:  
> - **Bóng 1 (Đèn 1 - Chiếu Sáng Phòng):** Sáng khi bấm Nút 1 hoặc bật trên Web.  
> - **Bóng 2 (Đèn 2 - Bàn Học Sinh Viên):** Sáng khi bật Đèn 2 trên Web hoặc theo kịch bản sinh hoạt.  
> - **Bóng 3 (Quạt Thông Gió):** Sáng khi bấm Nút 2 hoặc khi nồng độ khí gas cảnh báo.  
> - **Bóng 4 (Khóa Cửa Điện Tử):** Sáng trong 4 giây rồi tắt mỗi khi quẹt thẻ SV001 / SV002 mở cửa!  
> - **Bóng 5 (Đèn Báo Động Đỏ):** Nhấp nháy liên tục khi có rò rỉ khí gas hoặc quẹt thẻ lạ.

---

#### 1. Nguyên Tắc Bảo Toàn Khung Mạch Bạn Đã Lắp (Không Cần Tháo Dỡ Bất Kỳ Thứ Gì):
- Toàn bộ 5 Nút Bấm ở **Hàng 1 đến 23** và Còi Buzzer ở **Hàng 27 - 28** cùng 2 thanh nguồn 5V & Mass: **GIỮ NGUYÊN 100%**!
- Khoảng trống trên Breadboard từ **Hàng 30 đến Hàng 60 đang TRỐNG HOÀN TOÀN** (rộng thênh thang tới 30 hàng lỗ). Chúng ta sẽ tận dụng trọn vẹn khu vực này để cắm dàn LED.

---

#### 2. Giải Thích Rõ Về "Điện Trở 220Ω":
- **"220Ω" đọc là 220 Ôm (đơn vị điện trở)** — hoàn toàn **KHÔNG PHẢI là 220V (Vôn điện lưới 220V)**!
- Trong danh sách linh kiện bạn mua lẻ trên Shopee **không có điện trở** là hoàn toàn bình thường (vì điện trở chỉ hay đi kèm khi mua trọn bộ combo kit học tập).
- **VẬY KHÔNG CÓ ĐIỆN TRỞ THÌ CÓ CẮM ĐƯỢC BÓNG ĐÈN LED KHÔNG?**
  - **👉 CẮM TRỰC TIẾP ĐƯỢC 100% VÀ SÁNG RẤT ĐẸP!**
  - Lý do: Bo ESP32 chỉ phát ra dòng điện áp **3.3V cực nhỏ (an toàn tuyệt đối)**, bên trong chip ESP32 đã có sẵn mạch hạn dòng tự nhiên. Do đó, bạn cắm trực tiếp 2 chân bóng LED 5mm vào mạch chạy mô phỏng đồ án thoải mái, bóng sáng rõ mà không cần phải mua thêm bất kỳ con điện trở nào!

---

#### 3. Hướng Dẫn Cầm Bóng Đèn LED Trên Tay & Nhận Diện Từng Cực (Cực Kỳ Chi Tiết):

Lấy 1 bóng đèn nhỏ trong túi bóng trong suốt ra, cầm trên tay và giơ ngang tầm mắt:

```
                     ╔═════════════╗
                     ║   ĐẦU LED   ║  ◄── Vỏ nhựa trong suốt tròn
                     ╚══════╤══════╝
                     ┌──────┴──────┐
             Mép Tròn│             │Mép Vát Phẳng (Dẹp)
                     └───┬─────┬───┘
                         │     │
                         │     │
                         │     └───────► CHÂN NGẮN HƠN (CỰC ÂM - / Cathode)
                         │               (Nối vào Dải Sọc Xanh Mass [-])
                         │
                         └─────────────► CHÂN DÀI HƠN (CỰC DƯƠNG + / Anode)
                                         (Cắm vào Hàng nhận tín hiệu)
```

👉 **3 Cách phân biệt Cực Dương (`+`) và Cực Âm (`-`):**
1. **Cách 1 (Dễ nhất - Nhìn chiều dài chân):**
   - **Chân DÀI hơn:** Là **Cực Dương (`+`)**. *(Mẹo nhớ: Dài hơn là dấu cộng `+`)*.
   - **Chân NGẮN hơn:** Là **Cực Âm (`-`)**. *(Mẹo nhớ: Ngắn hơn là dấu trừ `-`)*.
2. **Cách 2 (Nhìn mép viền nhựa dưới đáy bóng):**
   - Bên mép nhựa tròn xoe: Cực Dương (`+`).
   - Bên mép nhựa bị gọt phẳng (vát dẹp 1 góc): Cực Âm (`-`).
3. **Cách 3 (Nhìn qua vỏ nhựa vào tim đèn bên trong):**
   - Chân nối với miếng kim loại nhỏ như sợi chỉ: Cực Dương (`+`).
   - Chân nối với miếng kim loại to hình chiếc cờ / cái bát: Cực Âm (`-`).

---

#### 4. Sơ Đồ Cắm Trực Tiếp Dàn Bóng LED Trên Breadboard (Không Cần Điện Trở):

Nhìn vào nửa bên **TRÁI** của Breadboard (các cột lỗ `a - b - c - d - e` từ Hàng 35 đến 55):

```
       THANH MASS (-)           HÀNG NGANG BREADBOARD (Nửa Trái: a - b - c - d - e)
     (Dải Sọc Xanh Biên)         [ a ]      [ b ]      [ c ]        [ d ]      [ e ]
  ┌───────────────────────┐   ┌──────────┬──────────┬────────────┬──────────┬──────────┐
35│ ● (Chân Ngắn LED 1)   │◄──┼── D25    │ Sang IN1 │Chân Dài (+)│ (Trống)  │ (Trống)  │ ◄── BÓNG ĐÈN 1
  ├───────────────────────┤   ├──────────┴──────────┴────────────┴──────────┴──────────┤
  │                       │   │              (Cách các hàng trống)                     │
  ├───────────────────────┤   ├──────────┬──────────┬────────────┬──────────┬──────────┤
40│ ● (Chân Ngắn LED 2)   │◄──┼── D26    │ Sang IN2 │Chân Dài (+)│ (Trống)  │ (Trống)  │ ◄── BÓNG ĐÈN 2
  ├───────────────────────┤   ├──────────┴──────────┴────────────┴──────────┴──────────┤
  │                       │   │              (Cách các hàng trống)                     │
  ├───────────────────────┤   ├──────────┬──────────┬────────────┬──────────┬──────────┤
45│ ● (Chân Ngắn LED 3)   │◄──┼── D14    │ Sang IN3 │Chân Dài (+)│ (Trống)  │ (Trống)  │ ◄── MÔ PHỎNG QUẠT
  ├───────────────────────┤   ├──────────┴──────────┴────────────┴──────────┴──────────┤
  │                       │   │              (Cách các hàng trống)                     │
  ├───────────────────────┤   ├──────────┬──────────┬────────────┬──────────┬──────────┤
50│ ● (Chân Ngắn LED 4)   │◄──┼── D12    │ Sang IN4 │Chân Dài (+)│ (Trống)  │ (Trống)  │ ◄── MÔ PHỎNG KHÓA CỬA
  ├───────────────────────┤   ├──────────┴──────────┴────────────┴──────────┴──────────┤
  │                       │   │              (Cách các hàng trống)                     │
  ├───────────────────────┤   ├──────────┬──────────┬────────────┬──────────┬──────────┤
55│ ● (Chân Ngắn LED 5)   │◄──┼── D13    │ (Trống)  │Chân Dài (+)│ (Trống)  │ (Trống)  │ ◄── ĐÈN BÁO ĐỘNG ĐỎ
  └───────────────────────┘   └────────────────────────────────────────────────────────┘
```

---

#### 5. Thao Tác Cắm Từng Bước Cầm Tay Chỉ Việc (Cực Kỳ Dễ Làm):

* **💡 BÓNG ĐÈN 1 (Mô Phỏng Đèn Phòng 1 - D25 & Relay 1):**
  1. Cầm 1 bóng LED, tách nhẹ 2 chân ra hình chữ `V`:
     - Cắm **Chân Ngắn (`-`)** vào 1 lỗ trên **Dải sọc Xanh (`-`)** ở mép ngoài cùng bên trái Breadboard.
     - Cắm **Chân Dài (`+`)** vào lỗ **`c35`** (Hàng 35, cột c).
  2. Lấy 1 sợi dây Cái - Đực:
     - Đầu **Cái** trùm vào chân **`D25`** của ESP32.
     - Đầu **Đực** cắm vào lỗ **`a35`** (cùng Hàng 35 với chân dài bóng đèn).
  3. Dây từ cọc **`IN1`** của Relay: Cắm đầu nhọn vào lỗ **`b35`** (cùng Hàng 35).
     *(👉 Ba điểm `a35, b35, c35` nối ngầm với nhau: Tín hiệu từ D25 vừa kích Rơ-le 1 kêu tạch, vừa làm Bóng 1 sáng bừng lên!)*

* **💡 BÓNG ĐÈN 2 (Mô Phỏng Đèn Bàn Học 2 - D26 & Relay 2):**
  1. Cắm **Chân Ngắn (`-`)** vào lỗ trên **Dải sọc Xanh (`-`)**.
  2. Cắm **Chân Dài (`+`)** vào lỗ **`c40`** (Hàng 40, cột c).
  3. Lấy 1 sợi dây Cái - Đực: Đầu Cái cắm chân **`D26`** ESP32, đầu Đực cắm vào lỗ **`a40`**.
  4. Dây từ cọc **`IN2`** của Relay cắm vào lỗ **`b40`**.

* **🌀 BÓNG ĐÈN 3 (Mô Phỏng Quạt Thông Gió - D14 & Relay 3):**
  1. Cắm **Chân Ngắn (`-`)** vào lỗ trên **Dải sọc Xanh (`-`)**.
  2. Cắm **Chân Dài (`+`)** vào lỗ **`c45`** (Hàng 45, cột c).
  3. Dây Cái - Đực từ chân **`D14`** ESP32 cắm vào lỗ **`a45`**.
  4. Dây từ cọc **`IN3`** của Relay cắm vào lỗ **`b45`**.

* **🚪 BÓNG ĐÈN 4 (Mô Phỏng Khóa Cửa Điện Tử - D12 & Relay 4):**
  1. Cắm **Chân Ngắn (`-`)** vào lỗ trên **Dải sọc Xanh (`-`)**.
  2. Cắm **Chân Dài (`+`)** vào lỗ **`c50`** (Hàng 50, cột c).
  3. Dây Cái - Đực từ chân **`D12`** ESP32 cắm vào lỗ **`a50`**.
  4. Dây từ cọc **`IN4`** của Relay cắm vào lỗ **`b50`**.
  5. 👉 *Khi bấm Nút 3 (SV001) hoặc Nút 4 (SV002), bóng LED 4 này sẽ sáng đúng 4 giây rồi tự động tắt mô phỏng cửa đã mở rồi chốt lại!*

* **🚨 BÓNG ĐÈN 5 (Đèn Báo Động Đỏ Sự Cố - D13):**
  1. Cắm **Chân Ngắn (`-`)** vào lỗ trên **Dải sọc Xanh (`-`)**.
  2. Cắm **Chân Dài (`+`)** vào lỗ **`c55`** (Hàng 55, cột c).
  3. Dây Cái - Đực từ chân **`D13`** ESP32 cắm vào lỗ **`a55`**. (Lỗ `b55` để trống vì kênh này không qua Relay).
  4. 👉 *Khi xả khí gas vào MQ-2 hoặc bấm Nút 5 (Thẻ Lạ), còi Buzzer hú và bóng LED 5 sẽ nhấp nháy đỏ báo động!*

---

## PHẦN 6: BẢNG TRA CỨU ĐẤU NỐI TỔNG HỢP (MASTER WIRING TABLE)

Bảng tra cứu cập nhật đầy đủ toàn bộ hệ thống gồm ESP32, 5 Nút Bấm, Dàn LED 5mm, Relay 4 kênh, Còi Buzzer, Cảm biến Gas MQ-2 và DHT22 (100% không trùng chân, không cần điện trở ngoài):

| STT | Thiết Bị / Module | Chân Trên Thiết Bị | Chân Kết Nối Trên ESP32 / Breadboard | Màu Dây Gợi Ý | Loại Dây Cần Dùng |
|:---:|:---|:---|:---|:---:|:---:|
| 1 | **Thanh Nguồn 5V** | Chân `VIN` của ESP32 | Cắm vào dải dọc sọc Đỏ `(+)` bên **TRÁI** Breadboard | Đỏ | **Cái - Đực** |
| 2 | **Thanh Mass Chung**| Chân `GND` của ESP32 | Cắm vào dải dọc sọc Xanh `(-)` bên **TRÁI** Breadboard | Đen | **Cái - Đực** |
| 3 | **Cảm biến DHT22** | Chân `+` (Nguồn 3.3V) | Cắm trực tiếp vào chân **`3V3`** của ESP32 *(Chân 16 góc dưới phải)* | Cam / Đỏ | **Cái - Cái** |
| 4 | | Chân `-` (Mass GND) | Cắm vào **Thanh Mass Chung (`-`)** trên Breadboard | Đen | **Cái - Đực** |
| 5 | | Chân `out` (Data) | Chân **GPIO 4 (D4)** của ESP32 *(Hàng bên phải)* | Vàng | **Cái - Cái** |
| 6 | **Cảm biến MQ-2** | Chân `VCC` | Cắm vào **Thanh Nguồn 5V (`+`)** trên Breadboard | Đỏ | **Cái - Đực** |
| 7 | | Chân `GND` | Cắm vào **Thanh Mass Chung (`-`)** trên Breadboard | Đen | **Cái - Đực** |
| 8 | | Chân `AO` | Chân **GPIO 34 (D34)** của ESP32 *(Hàng bên trái)*| Xanh lá | **Cái - Cái** |
| 9 | | Chân `DO` | *(Để trống - Tuyệt đối không cắm dây)* | — | — |
| 10 | **Còi Buzzer 5V** | Chân Dài `(+)` (Hàng 27) | Chân **GPIO 15 (D15)** của ESP32 | Tím / Cam | **Cái - Đực** |
| 11 | | Chân Ngắn `(-)` (Hàng 28) | Cắm vào **Thanh Mass Chung (`-`)** trên Breadboard | Đen | **Đực - Đực** |
| 12 | **Module Relay 4CH**| Chân `DC+` (Ốc dưới cùng) | Cắm vào **Thanh Nguồn 5V (`+`)** trên Breadboard | Đỏ | **Đực - Đực** |
| 13 | | Chân `DC-` (Ốc thứ 2) | Cắm vào **Thanh Mass Chung (`-`)** trên Breadboard | Đen | **Đực - Đực** |
| 14 | | Chân `IN1` (Đèn 1 - Ốc 3) | Cắm vào lỗ **`b35`** trên Breadboard (chung D25 với LED 1) | Xanh dương | **Đực - Đực** |
| 15 | | Chân `IN2` (Đèn 2 - Ốc 4) | Cắm vào lỗ **`b40`** trên Breadboard (chung D26 với LED 2) | Xanh dương | **Đực - Đực** |
| 16 | | Chân `IN3` (Quạt - Ốc 5) | Cắm vào lỗ **`b45`** trên Breadboard (chung D14 với LED 3) | Vàng | **Đực - Đực** |
| 17 | | Chân `IN4` (Cửa - Ốc trên) | Cắm vào lỗ **`b50`** trên Breadboard (chung D12 với LED 4) | Trắng | **Đực - Đực** |
| 18 | **Nút 1 (Bật/Tắt Đèn)** | Chân Trái (cột e1) | Chân **GPIO 32 (D32)** của ESP32 | Xanh lá | **Cái - Đực** |
| 19 | | Chân Chéo Phải (cột f3) | Cắm vào Thanh Mass Chung `(-)` trên Breadboard | Đen | **Đực - Đực** |
| 20 | **Nút 2 (Bật/Tắt Quạt)** | Chân Trái (cột e6) | Chân **GPIO 33 (D33)** của ESP32 | Vàng | **Cái - Đực** |
| 21 | | Chân Chéo Phải (cột f8) | Cắm vào Thanh Mass Chung `(-)` trên Breadboard | Đen | **Đực - Đực** |
| 22 | **Nút 3 (Thẻ SV001)** | Chân Trái (cột e11) | Chân **GPIO 18 (D18)** của ESP32 | Xanh lá | **Cái - Đực** |
| 23 | | Chân Chéo Phải (cột f13) | Cắm vào Thanh Mass Chung `(-)` trên Breadboard | Đen | **Đực - Đực** |
| 24 | **Nút 4 (Thẻ SV002)** | Chân Trái (cột e16) | Chân **GPIO 19 (D19)** của ESP32 | Cam | **Cái - Đực** |
| 25 | | Chân Chéo Phải (cột f18) | Cắm vào Thanh Mass Chung `(-)` trên Breadboard | Đen | **Đực - Đực** |
| 26 | **Nút 5 (Thẻ Lạ)** | Chân Trái (cột e21) | Chân **GPIO 21 (D21)** của ESP32 | Tím | **Cái - Đực** |
| 27 | | Chân Chéo Phải (cột f23) | Cắm vào Thanh Mass Chung `(-)` trên Breadboard | Đen | **Đực - Đực** |
| 28 | **LED 1 (Đèn 1)** | Chân Dài `(+)` cắm lỗ `c35` | Nhận chung tín hiệu **GPIO 25 (D25)** tại Hàng 35 | Tùy chọn | Chân cắm |
| 29 | | Chân Ngắn `(-)` cắm Mass | Thanh Mass Chung `(-)` trên Breadboard | — | Chân cắm |
| 30 | **LED 2 (Đèn 2)** | Chân Dài `(+)` cắm lỗ `c40` | Nhận chung tín hiệu **GPIO 26 (D26)** tại Hàng 40 | Tùy chọn | Chân cắm |
| 31 | | Chân Ngắn `(-)` cắm Mass | Thanh Mass Chung `(-)` trên Breadboard | — | Chân cắm |
| 32 | **LED 3 (Quạt)** | Chân Dài `(+)` cắm lỗ `c45` | Nhận chung tín hiệu **GPIO 14 (D14)** tại Hàng 45 | Tùy chọn | Chân cắm |
| 33 | | Chân Ngắn `(-)` cắm Mass | Thanh Mass Chung `(-)` trên Breadboard | — | Chân cắm |
| 34 | **LED 4 (Khóa Cửa)** | Chân Dài `(+)` cắm lỗ `c50` | Nhận chung tín hiệu **GPIO 12 (D12)** tại Hàng 50 | Tùy chọn | Chân cắm |
| 35 | | Chân Ngắn `(-)` cắm Mass | Thanh Mass Chung `(-)` trên Breadboard | — | Chân cắm |
| 36 | **LED 5 (Báo Động)** | Chân Dài `(+)` cắm lỗ `c55` | Nhận tín hiệu **GPIO 13 (D13)** tại Hàng 55 | Tùy chọn | Chân cắm |
| 37 | | Chân Ngắn `(-)` cắm Mass | Thanh Mass Chung `(-)` trên Breadboard | — | Chân cắm |

## PHẦN 7: KIỂM TRA AN TOÀN TRƯỚC KHI CẮM ĐIỆN (SAFETY CHECKLIST)

Trước khi cắm cáp USB vào máy tính, hãy dành ra 60 giây làm thủ tục "Pre-flight Check" sau đây để bảo đảm bo mạch an toàn 100%:

- [ ] **Kiểm tra chập nguồn (Quan trọng nhất):** Tuyệt đối **không có sợi dây nào** nối trực tiếp từ dải sọc Đỏ `(+)` sang dải sọc Xanh `(-)`.
- [ ] **Kiểm tra chân nguồn DHT22:** Chân `+` của DHT22 cắm đúng vào chân **`3V3`** (không cắm nhầm sang VIN).
- [ ] **Kiểm tra chân nguồn MQ-2 & Relay:** Chân `VCC` của MQ-2 và `DC+` của Relay cắm đúng vào **Thanh 5V (`VIN`)**.
- [ ] **Kiểm tra nút bấm:** Các nút bấm đều nằm vắt ngang qua rãnh giữa, chân đối diện đều đã nối vào Thanh Mass `(-)`.
- [ ] **Kiểm tra tiếp xúc:** Nhẹ nhàng lắc nhẹ các đầu dây cắm xem có đầu nào bị lỏng hoặc cắm lệch hàng lỗ không.

---

## PHẦN 8: CẮM CÁP TYPE-C, CẤU HÌNH WIFI & VẬN HÀNH

Sau khi hoàn thành danh sách kiểm tra an toàn, bạn đã sẵn sàng nạp phần mềm và khởi chạy mạch thật!

### Bước 8.1: Cắm cáp kết nối ESP32 với máy tính
1. Cắm đầu cáp Type-C vào bo mạch ESP32.
2. Cắm đầu USB còn lại vào cổng USB trên máy tính.
3. Đèn LED đỏ nhỏ trên bo ESP32 sáng lên → Mạch đã được cấp nguồn an toàn!
4. Đèn LED trên module Relay và MQ-2 cũng sẽ sáng đèn báo nguồn.

### Bước 8.2: Cấu hình tên WiFi phòng trong mã nguồn
Mở file mã nguồn: [`hardware/src/main.cpp`](file:///d:/DACNTT2/SmartDorm_SourceCode/hardware/src/main.cpp)  
Tìm đến dòng 24-25 và đổi tên WiFi và mật khẩu nhà/phòng bạn:
```cpp
// Đổi thành tên và mật khẩu WiFi 2.4GHz thực tế của bạn
const char* WIFI_SSID     = "Ten_Wifi_Nha_Ban";
const char* WIFI_PASSWORD = "Mat_Khau_Wifi_Cua_Ban";
```
*(Lưu ý: ESP32 hỗ trợ chuẩn WiFi 2.4GHz thông dụng).*

### Bước 8.3: Nạp Firmware qua VS Code PlatformIO
1. Mở thư mục dự án `SmartDorm_SourceCode` trong Visual Studio Code.
2. Nhìn xuống thanh công cụ màu xanh ở góc dưới cùng màn hình VS Code:
   - Bấm vào biểu tượng **Mũi tên sang phải (`→`)** có chú thích là **PlatformIO: Upload**.
   - PlatformIO sẽ tự động biên dịch và nạp code vào ESP32 qua chip nạp CP2102 mà bạn không cần phải bấm hay giữ nút BOOT nào cả!
3. Khi màn hình terminal báo `[SUCCESS]`, quá trình nạp hoàn tất!

### Bước 8.4: Mở Serial Monitor để quan sát mạch hoạt động
Bấm vào biểu tượng **Phích cắm điện (`Plug`)** trên thanh dưới cùng (hoặc bấm `PlatformIO: Serial Monitor`, tốc độ 115200 baud). Bạn sẽ thấy màn hình in các dòng thông báo:
```text
==========================================
🏠 Smart Dormitory — ESP32 Fast Engine
==========================================
Đang kết nối WiFi: Ten_Wifi_Nha_Ban .....
✅ WiFi đã kết nối! IP: 192.168.1.155
Kết nối MQTT Broker: broker.hivemq.com:1883
✅ MQTT Broker connected! Topic: dormitory/A/1/101
```

### Bước 8.5: Thử nghiệm thực tế các tính năng bằng 5 Nút Bấm trên Breadboard
> 💡 **Lưu ý quan trọng về phần cứng:** Hệ thống của bạn **không cần đầu đọc RFID-RC522 và thẻ nhựa vật lý**. Thay vào đó, toàn bộ thao tác điều khiển thiết bị và quẹt thẻ sinh viên được thực hiện trực quan và chuẩn xác 100% thông qua **5 nút bấm nhả (Tactile Button)** cắm trên Breadboard!

Bây giờ, hãy mở trình duyệt web lên địa chỉ **[http://localhost:3000](http://localhost:3000)** (hệ thống SmartDorm đang chạy trên máy tính của bạn) và kiểm tra lần lượt:

1. **Thử Nút Bật/Tắt Đèn (Nút 1 - Chân D32):**
   - **Thao tác:** Bấm Nút 1 trên Breadboard.
   - **Phản hồi phần cứng:** Rơ-le số 1 (chân D25) phát ra tiếng "tạch" giòn giã, đèn LED xanh IN1 trên bo rơ-le bật sáng.
   - **Phản hồi giao diện Web:** Biểu tượng Đèn phòng A-101 trên Dashboard ngay lập tức đổi sang màu Vàng (Bật), lịch sử thiết bị ghi nhận lệnh `PHYSICAL_BTN_LIGHT`.
   - Bấm Nút 1 lần nữa → Rơ-le số 1 nhả "tạch", đèn trên Web tắt!

2. **Thử Nút Bật/Tắt Quạt (Nút 2 - Chân D33):**
   - **Thao tác:** Bấm Nút 2 trên Breadboard.
   - **Phản hồi phần cứng:** Rơ-le số 3 (chân D14) nhảy "tạch", đèn LED xanh IN3 trên bo rơ-le bật sáng.
   - **Phản hồi giao diện Web:** Biểu tượng Quạt trên Web quay tít với animation mượt mà!
   - Bấm Nút 2 lần nữa → Rơ-le số 3 nhả "tạch", quạt trên Web dừng lại!

3. **Thử Mô Phỏng Quẹt Thẻ Sinh Viên SV001 (Nút 3 - Chân D18):**
   - **Thao tác:** Bấm Nút 3 trên Breadboard (Đại diện cho thẻ sinh viên hợp lệ `CARD_SV001` - Nguyễn Văn An).
   - **Phản hồi phần cứng:**
     - Còi Active Buzzer kêu 1 tiếng **"bíp"** ngắn báo xác thực thành công.
     - Rơ-le số 4 (chân D12 - Khóa cửa điện từ) nhảy "tạch" mở chốt cửa.
   - **Phản hồi giao diện Web:** 
     - Mục **Nhật Ký Quẹt Thẻ (Access Log)** nhảy thông báo màu xanh lá: *"Nguyễn Văn An (SV2024001) quẹt thẻ vào phòng A101 thành công!"*.
     - Tỷ lệ lưu trú phòng tăng lên theo thời gian thực.
   - **Sau 4 giây:** Rơ-le số 4 tự động nhả "tạch" (khóa cửa tự động đóng chốt an toàn)!

4. **Thử Mô Phỏng Quẹt Thẻ Sinh Viên SV002 (Nút 4 - Chân D19):**
   - **Thao tác:** Bấm Nút 4 trên Breadboard (Đại diện cho thẻ sinh viên hợp lệ `CARD_SV002` - Trần Thị Bình).
   - **Phản hồi phần cứng:** Còi Buzzer kêu 1 tiếng "bíp" ngắn, Rơ-le số 4 (Khóa cửa) tiếp tục nhảy "tạch" mở chốt trong 4 giây.
   - **Phản hồi giao diện Web:** Web Access Log ghi nhận thêm một lượt vào phòng của sinh viên thứ hai: *"Trần Thị Bình (SV2024002) quẹt thẻ vào phòng A101"*.

5. **Thử Mô Phỏng Quẹt Thẻ Lạ Không Hợp Lệ (Nút 5 - Chân D21):**
   - **Thao tác:** Bấm Nút 5 trên Breadboard (Đại diện cho kẻ gian hoặc người ngoài quẹt thẻ không có quyền vào phòng).
   - **Phản hồi phần cứng:** 
     - Còi Buzzer kêu liên tục 3 hồi đanh thép: **"tít - tít - tít"!**
     - Rơ-le số 4 (Khóa cửa) **tuyệt đối giữ nguyên trạng thái đóng** (không mở cửa cho người lạ).
   - **Phản hồi giao diện Web:** Màn hình Web nhấp nháy cảnh báo an ninh màu đỏ rực: *"Phát hiện thẻ không hợp lệ quẹt tại phòng A101!"*, lưu lại nhật ký vi phạm an ninh!

6. **Thử Cảm Biến Môi Trường DHT22 (Chân D4):**
   - Thổi hơi thở ấm hoặc áp nhẹ ngón tay vào vỏ nhựa màu trắng của DHT22 → Trên Web Dashboard, biểu đồ nhiệt độ và độ ẩm phòng A-101 sẽ tự động nhảy số cập nhật sau 3 giây!

7. **Thử Cảm Biến Khí Gas & Khói MQ-2 (Chân D34):**
   - Dùng một chiếc bật lửa gas (bấm nhẹ cần xả gas gần núm kim loại của MQ-2 trong 1-2 giây nhưng **tuyệt đối không đánh lửa**) → Nồng độ gas vượt ngưỡng 100 ppm:
     - Còi Buzzer hú vang cảnh báo liên tục!
     - Rơ-le số 3 (Quạt) tự động kích hoạt tối đa để hút giải phóng khí độc!
     - Web Dashboard nhảy popup cảnh báo khẩn cấp PCCC màu đỏ rực và thông báo tin nhắn gửi ngay tức thì về Telegram quản lý!

---

## PHẦN 8: GIẢI PHÁP TÍNH TOÁN ĐIỆN NĂNG & DỰ ĐOÁN AI THÔNG BÁO CHO SINH VIÊN

### 1. Phân Tích Bài Toán Nghiệp Vụ KTX Thực Tế
- **Thực trạng lãng phí:** Sinh viên thường vội lên giảng đường (07:00 sáng hoặc 13:00 chiều) nên thường quên tắt đèn, quạt, máy tính, bình nóng lạnh. Phòng trống không có người nhưng thiết bị vẫn tiêu thụ điện liên tục 4–8 tiếng.
- **Hạn chế quản lý truyền thống:** Ban quản lý không thể tự ý vào phòng sinh viên để tắt công tắc, việc đi chốt chỉ số công tơ bằng mắt vào cuối tháng tốn nhiều nhân lực, dễ nhầm lẫn chỉ số và phát sinh khiếu nại.
- **Giải pháp không cần lắp công tơ PZEM/CT đắt đỏ cho từng phòng:** Tính toán điện năng thông qua **Công suất định mức ($P_{\text{đm}}$)** kết hợp **Trạng thái đóng/ngắt thời gian thực của Rơ-le** và **Suy luận Hiện diện (Occupancy) qua Vi khí hậu AI & RFID**.

---

### 2. Cơ Chế Tính Toán Điện Năng Chuẩn Xác Trong SmartDorm

Hệ thống tính toán theo mô hình tích phân công suất theo thời gian thực:

$$P_{\text{total}}(t) = \sum_{i=1}^{n} \Big(P_{\text{đm}, i} \times S_i(t)\Big) + P_{\text{standby}}$$

Trong đó:
- $S_i(t) \in \{0, 1\}$: Trạng thái thiết bị thứ $i$ (1 = BẬT, 0 = TẮT) thu thập qua trạng thái Relay / MQTT status.
- $P_{\text{đm}, i}$: Công suất danh định chuẩn của thiết bị phòng KTX:
  - 💡 **Đèn LED tuýp / Đèn trần:** $20\,\text{W}$ / bóng (Hệ thống có 3 bóng $\rightarrow$ Tối đa $60\,\text{W}$).
  - 🌀 **Quạt thông gió / Quạt đảo trần:** $60\,\text{W}$.
  - 🚪 **Khóa cửa điện từ:** $5\,\text{W}$ (khi kích mở).
  - 🔌 **Tải tĩnh (Standby vi điều khiển ESP32, Module cảm biến, Router):** $5\,\text{W}$.

Điện năng tiêu thụ tích lũy ($A$ tính bằng kWh):

$$A = \sum_{k} \frac{P_{\text{total}}(t_k) \times \Delta t_k}{3.600 \times 1.000} \quad (\text{kWh})$$

*(Được Backend tự động tích lũy và đồng bộ vào InfluxDB định kỳ mỗi chu kỳ 3 giây gửi telemetry).*

---

### 3. Mô Hình AI Dự Đoán Lãng Phí & Tự Động Thông Báo Sinh Viên

```text
[Nhật ký RFID Quẹt Ra] + [DHT22 Không Đổi / PIR Không Chuyển Động]
                       │
                       ▼
    ┌──────────────────────────────────────────────┐
    │  AI Occupancy & Energy Waste Inference       │
    │  - Phát hiện: Phòng TRỐNG (Unoccupied)       │
    │  - Thiết bị: Đèn BẬT, Quạt BẬT (> 15 phút)  │
    │  - Dự báo thất thoát: ~1.8 kWh (4.068 VNĐ)  │
    └──────────────────────┬───────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  [App Sinh viên / Web UI]       [Telegram Bot & Email]
  Popup nhắc nhở:                Tin nhắn tương tác có nút bấm:
  "Phòng A101 đang bật thiết bị  "Phòng bạn đang vắng người nhưng
   khi không có ai trong phòng!"  đèn/quạt vẫn bật. Bấm để tắt:"
                                 [⚡ Tắt Đèn]  [🌪️ Tắt Quạt]
                                 [🛑 Tắt Toàn Bộ Thiết Bị]
```

#### a. Thuật toán phát hiện lãng phí:
- Sau khi sự kiện thẻ RFID ghi nhận sinh viên cuối cùng quẹt thẻ Ra ngoài (exit) hoặc khung giờ học tập (07:30 – 11:30 & 13:00 – 17:00), hệ thống kích hoạt bộ đếm thời gian giám sát.
- Nếu sau 15 phút không có người nhưng $P_{\text{total}} > 20\,\text{W}$ (đèn hoặc quạt vẫn chạy): Hệ thống AI Decision Engine tự động kích hoạt rule `builtin-energy-waste-detection`.

#### b. Cơ chế phản hồi tương tác 2 chiều:
Hệ thống tự động gửi tin nhắn Telegram tới sinh viên trong phòng:
> **⚠️ [NHẮC NHỞ TIẾT KIỆM NĂNG LƯỢNG]**  
> Phòng A101 hiện không có sinh viên nhưng 1 Quạt và 2 Đèn vẫn đang hoạt động suốt 25 phút qua.  
> 📉 Điện năng ước tính lãng phí: **0.85 kWh (~1.920 VNĐ)**.  
> Bạn có muốn tắt thiết bị từ xa không?  
> `[⚡ Tắt Đèn P.101]` `[🌪️ Tắt Quạt P.101]`  
> `[🛑 Tắt Toàn Bộ Thiết Bị P.101]`

Khi sinh viên bấm nút ngay trên Telegram, Backend sẽ phát lệnh MQTT xuống ESP32 ngắt rơ-le ngay tức khắc, đồng thời cập nhật thời gian thực lên Web UI và ứng dụng sinh viên.

#### c. Chốt số điện tự động cuối tháng (E-Billing):
- Vào 00:00 ngày cuối tháng (hoặc kích hoạt tức thì từ Admin Settings), hệ thống tự động tổng hợp toàn bộ số kWh trong CSDL, nhân với đơn giá KTX (**$2.260\,\text{VNĐ/kWh}$**), chia đều theo đầu người từng phòng, xuất hóa đơn điện tử minh bạch và gửi Email/App cho từng sinh viên, loại bỏ hoàn toàn việc đi ghi sổ thủ công.

---

## PHẦN 9: QUY TRÌNH THI CÔNG MẠCH CỐ ĐỊNH CHUẨN NGHIỆM THU (ĐẾ RA CHÂN ESP32 + BO TÁP-LÔ 5x7CM)

### 1. Kiến Trúc Phân Tầng Phần Cứng Thông Minh (2 Khối Độc Lập)
Thay vì dùng Breadboard cắm dây lỏng lẻo dễ chập chờn khi di chuyển, hoặc tự hàn thủ công toàn bộ chip lên bo phíp to 9x15cm dễ chập nguồn, hệ thống chuyển sang **Mô hình 2 Khối Độc Lập chuẩn công nghiệp**:

```text
 ┌──────────────────────────────────────────────┐        ┌──────────────────────────────────────────────┐
 │       BẢNG TÁP-LÔ MẶT TRƯỚC (BO 5x7CM)       │        │          BỘ XỬ LÝ TRUNG TÂM (MAINBOARD)      │
 │                                              │        │               (ĐẾ RA CHÂN ESP32)             │
 │  [Nút Đèn]  [Nút Quạt]  [3 Nút Quẹt Thẻ]     │        │                                              │
 │    💡💡💡        🌀        🚪         🚨     │ Cáp bẹ │ [Cọc cắm G-V-S] ─── Cắm về Bo Táp-lô 5x7cm   │
 │ (3 LED Đèn)  (LED Quạt) (LED Cửa) (Báo Động) ├───────►│  [CHIP ESP32 CẮM Ở GIỮA]                    │
 │                                              │ (10P)  │ [Cọc cắm G-V-S] ─── Cắm sang Relay 4 Kênh    │
 │                [Còi Buzzer 5V]               │        │                 ─── Cắm sang RFID RC522      │
 └──────────────────────────────────────────────┘        │                 ─── Cắm sang DHT22 / MQ-2    │
         (Hàn cố định nút bấm & LED hiển thị)            └──────────────────────────────────────────────┘
                                                             (Cắm dây Cái-Cái trực tiếp, không cần hàn)
```

- **Khối 1 (Bộ Xử Lý Trung Tâm):** Dùng **Đế Ra Chân ESP32 loại 30 chân** (có sẵn cổng Type-C, Jack DC 9V-12V, cọc đực G-V-S kèm nguồn 5V/3.3V/GND riêng cho từng chân). Các module lớn (Relay 4 kênh, RFID RC522, DHT22, MQ-2) chỉ việc cắm dây Jumper Cái-Cái thẳng vào đế, **hoàn toàn không cần hàn mỏ hàn**.
- **Khối 2 (Bảng Táp-Lô Mặt Trước):** Dùng **Bo Phíp FR-4 2 Mặt 5x7cm** để hàn cố định 5 nút bấm, 7 LED + điện trở, còi Buzzer và 1 hàng Header đực 10 chân. Từ bo 5x7cm chỉ cần cắm 1 bó dây jumper về Đế ESP32.

---

### 2. Danh Mục 16 Linh Kiện & Phụ Kiện Chuẩn Xác (Đã Cập Nhật File Excel)

| STT | Tên Linh Kiện / Phụ Kiện | Số Lượng | Đơn Giá | Thành Tiền | Chức Năng Kỹ Thuật Trong Hệ Thống |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **ESP32 DevKit V1 (Bản 30 chân)** | 1 | 75.000 ₫ | 75.000 ₫ | CPU trung tâm, chạy firmware MQTT, WiFi, xử lý cảm biến & RFID |
| **2** | **Cáp nạp dữ liệu USB (Data Sync Type-C/Micro)** | 1 | 20.000 ₫ | 20.000 ₫ | Nạp code từ máy tính & cấp nguồn nuôi mạch |
| **3** | **Cảm biến nhiệt ẩm DHT22 (AM2302)** | 1 | 55.000 ₫ | 55.000 ₫ | Đo nhiệt độ & độ ẩm vi khí hậu phòng KTX (Chân D4) |
| **4** | **Cảm biến khí gas / khói MQ-2** | 1 | 30.000 ₫ | 30.000 ₫ | Đo nồng độ khí gas rò rỉ & kích hoạt báo cháy (Chân D34) |
| **5** | **Bộ RFID RC522 (kèm 2 thẻ từ)** | 1 | 35.000 ₫ | 35.000 ₫ | Quẹt thẻ mở chốt cửa điện từ & điểm danh (Chân SPI 3.3V) |
| **6** | **Nút nhấn nhả (Tactile Button) 4 chân 6x6mm** | 5 | 2.000 ₫ | 10.000 ₫ | Hàn lên bo 5x7cm: Nút Đèn, Nút Quạt, 3 Nút mô phỏng thẻ SV |
| **7** | **Còi chip Active Buzzer 5V** | 1 | 5.000 ₫ | 5.000 ₫ | Hàn lên bo 5x7cm: Bíp xác thực & hú báo động (Chân D15) |
| **8** | **Module Relay 4 kênh 5V (Có Opto)** | 1 | 40.000 ₫ | 40.000 ₫ | Đóng ngắt 3 Đèn phòng (D25, D26, D27) và Quạt KTX (D14) |
| **9** | **Bộ 10 LED 5mm + 10 Điện trở 220Ω** | 1 | 10.000 ₫ | 10.000 ₫ | Hàn lên bo 5x7cm: 3 LED Đèn, 1 LED Quạt, 1 Cửa, 1 Báo động |
| **10** | **Đế Ra Chân ESP32 30 chân (Expansion Shield)** | 1 | 49.000 ₫ | 49.000 ₫ | **Bo chủ cắm ESP32**, mở rộng chân G-V-S, cổng DC/Type-C |
| **11** | **Bo Phíp FR-4 2 Mặt Đục Lỗ Phủ Xanh (5x7 cm)** | 1 | 14.500 ₫ | 14.500 ₫ | **Bảng Táp-lô**: Hàn cố định nút bấm, LED hiển thị & còi |
| **12** | **Dây cắm Jumper Cái - Cái (Female to Female) 20cm** | 1 bó (40 sợi) | 12.000 ₫ | 12.000 ₫ | Cắm từ Đế ESP32 sang Module Relay, RFID, MQ-2, DHT22 |
| **13** | **Dây cắm Jumper Cái - Đực (Female to Male) 20cm** | 1 bó (40 sợi) | 12.000 ₫ | 12.000 ₫ | Cắm tín hiệu từ Đế ESP32 sang Header trên Bo táp-lô 5x7cm |
| **14** | **Hàng rào Header đực 2.54mm (Thanh 40P)** | 1 | 5.000 ₫ | 5.000 ₫ | Bẻ 10-12 chân hàn lên mép bo 5x7cm làm cổng cắm dây bẹ |
| **15** | **Bộ Trụ đồng đỡ bo mạch M3x10mm kèm ốc vít** | 8 bộ | 2.000 ₫ | 16.000 ₫ | Bắt 4 góc Đế ESP32 và 4 góc Bo 5x7cm cách điện mặt bàn |
| **16** | **Bộ Vật tư thi công hàn (Thiếc hàn 63/37 có lõi nhựa thông)** | 1 | 30.000 ₫ | 30.000 ₫ | Hàn các chân linh kiện trên bo 5x7cm sáng bóng, chắc chắn |
| **TỔNG** | **TOÀN BỘ 16 MỤC TRỌN GÓI** | | | **~338.500 ₫** | **Đầy đủ 100% phần cứng, nghiệm thu chắc chắn tuyệt đối** |

---

### 4. Hướng Dẫn Chi Tiết Từng Bước Hàn Bo Táp-Lô 5x7cm (Chỉ Mất 15–20 Phút)

Bo phíp 5x7cm được chia thành lưới 18 hàng x 24 cột đục lỗ chuẩn 2.54mm mạ thiếc 2 mặt. Hãy làm theo đúng trình tự sau để mối hàn phẳng, ngấu và thẩm mỹ:

```text
  ┌──────────────────────────────────────────────────────────────┐
  │ [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] (Header Đực 10P)    │  <-- Hàng trên cùng
  │                                                              │
  │  [Nút 1]      [Nút 2]      [Nút 3]      [Nút 4]     [Nút 5]  │  <-- Khu vực Nút Bấm
  │  (Bật Đèn)   (Bật Quạt)   (Thẻ SV1)    (Thẻ SV2)   (Thẻ Lạ)  │      (5 nút 4 chân 6x6mm)
  │                                                              │
  │   🔴 🔴 🔴         🌀           🚪           🚨       (Còi)  │  <-- Khu vực Đèn LED & Còi
  │ (3 LED Đèn)   (1 LED Quạt) (1 LED Cửa)  (1 Báo Động) [Buzzer]│      (LED 5mm + Còi 5V)
  │   [R1][R2][R3]    [R4]         [R5]         [R6]             │  <-- 7 Điện trở 220Ω
  └──────────────────────────────────────────────────────────────┘
```

#### Bước 1: Định vị và hàn Hàng rào Header đực 10 chân
- Dùng kìm cắt bẻ lấy **1 thanh 10 chân** từ thanh Header đực 40P.
- Cắm thanh 10 chân này vào **hàng lỗ sát mép trên cùng của bo 5x7cm** (Chân ngắn cắm xuyên qua bo, chân dài nhô lên mặt trên để cắm dây bẹ).
- Lật mặt sau chấm thiếc hàn cố định 2 chân ở 2 đầu trước để giữ thanh thẳng đứng, sau đó hàn tiếp 8 chân còn lại.

#### Bước 2: Cắm và hàn 5 Nút nhấn nhả (Tactile Button)
- Xếp 5 nút bấm thành 1 hàng ngang ở khoảng 1/3 phía trên bo mạch.
- Nút bấm 4 chân có 2 cặp chân thông nhau bên trong: Khi cắm vào bo, 2 chân phía trên nối với nhau, 2 chân phía dưới nối với nhau.
- Ấn chặt nút sát mặt bo mạch và hàn thiếc ở mặt sau.

#### Bước 3: Cắm và hàn 7 Đèn LED 5mm + Còi Buzzer
- **Phân biệt cực LED:** Chân dài là **Dương (+)** (Anode), chân ngắn là **Âm (-)** (Cathode). Mặt cạnh nhựa của LED phía chân âm có vát phẳng.
- Cắm 3 LED Đèn, 1 LED Quạt, 1 LED Cửa, 1 LED Báo Động và Còi Buzzer thành một hàng ngay ngắn.
- **Quy tắc lắp điện trở 220Ω:** Hàn 1 đầu điện trở 220Ω nối tiếp vào chân Dương (+) của từng LED (để giảm dòng, giúp LED sáng dịu và không bị cháy khi cấp điện).

#### Bước 4: Kỹ thuật đi dây và hàn Mass (GND Chung) mặt dưới bo
> 💡 **Bí quyết của thợ điện tử:** Tận dụng chính các **chân kim loại thừa cắt ra từ điện trở** để uốn thành đường dây dẫn thẳng tắp ở mặt dưới bo, không cần bóc dây điện nhựa!
- **Đường ray GND chung:** Bẻ tất cả các chân Âm (-) của 7 LED, 1 chân của 5 nút bấm và chân Âm (-) của còi Buzzer chụm lại với nhau tạo thành **1 đường ray mass chung chạy dài**. Nối đầu cuối của đường ray này vào **Chân 10 của Header**.
- **Đường tín hiệu điều khiển:**
  - Chân còn lại của Nút 1 (Đèn) $\rightarrow$ Hàn nối về **Chân 1 Header**.
  - Chân còn lại của Nút 2 (Quạt) $\rightarrow$ Hàn nối về **Chân 2 Header**.
  - Chân còn lại của Nút 3, 4, 5 (Thẻ) $\rightarrow$ Hàn nối về **Chân 3, 4, 5 Header**.
  - Đầu còn lại của các điện trở LED $\rightarrow$ Hàn nối về **Chân 6, 7, 8 Header**.
  - Chân Dương (+) của LED Đỏ và Còi Buzzer $\rightarrow$ Hàn nối về **Chân 9 Header**.

---

### 5. Hướng Dẫn Cắm Dây Hoàn Thiện Hệ Thống Lên Đế ESP32

Sau khi hàn xong bo táp-lô 5x7cm, việc kết nối toàn bộ hệ thống trở nên vô cùng đơn giản bằng dây Jumper:

```text
                       ┌──────────────────────────────────────────────┐
                       │          ĐẾ RA CHÂN ESP32 DEV-KIT V1         │
                       │    (Có sẵn Jack nguồn DC + Cổng Type-C)      │
                       └───────┬──────────────┬──────────────┬────────┘
                               │              │              │
             Dây Cái-Cái (10P) │Dây Cái-Cái(6P│ Dây Cái-Cái  │ Dây Cái-Cái
                               ▼              ▼ (7P)         ▼ (6P)
                     ┌────────────┐   ┌────────────┐   ┌────────────┐
                     │ BO TÁP-LÔ  │   │ MODULE     │   │ MODULE     │
                     │  5x7 CM    │   │ RELAY 4 KÊNH│  │ RFID RC522 │
                     │(Phím + LED)│   │(Đèn + Quạt)│   │(Quẹt thẻ)  │
                     └────────────┘   └────────────┘   └────────────┘
```

1. **Từ Bo 5x7cm sang Đế ESP32:** Dùng 1 bẹ 10 sợi dây Cái - Cái cắm từ Header 10P của bo 5x7cm sang các cọc GPIO tương ứng trên Đế ESP32 (`D32`, `D33`, `D18`, `D19`, `D21`, `D25`, `D14`, `D12`, `D13`, `GND`).
2. **Từ Module Relay 4 kênh sang Đế ESP32:** Dùng 6 sợi dây Cái - Cái cắm từ các chân `IN1`, `IN2`, `IN3`, `IN4`, `VCC`, `GND` của Relay sang cọc `D25`, `D26`, `D27`, `D14`, `5V`, `GND` trên Đế ESP32.
3. **Từ Module RFID RC522 sang Đế ESP32:** Dùng 7 sợi dây Cái - Cái cắm sang các cọc `D5` (SDA), `D18` (SCK), `D23` (MOSI), `D19` (MISO), `D22` (RST), `3.3V` (VCC) và `GND`. *(Lưu ý: RC522 bắt buộc cắm cọc 3.3V)*.
4. **Từ Module DHT22 & MQ-2 sang Đế ESP32:** Cắm dây Cái-Cái từ chân DATA của DHT22 vào cọc `D4`, chân A0 của MQ-2 vào cọc `D34`.

---

### 6. Quy Trình Kiểm Tra An Toàn Bằng Đồng Hồ VOM Trước Khi Cắm Điện

> ⚠️ **BƯỚC BẮT BUỘC:** Không bao giờ cắm điện ngay sau khi vừa hàn xong. Hãy dùng đồng hồ vạn năng (VOM) kiểm tra 2 bước sau:

1. **Kiểm tra ngắn mạch nguồn (Short-circuit Test):**
   - Chuyển núm đồng hồ vạn năng về thang **Đo Thông Mạch (có biểu tượng âm thanh tiếng bíp)**.
   - Đặt 1 que đo vào chân `VCC (5V hoặc 3.3V)` và 1 que đo vào chân `GND`.
   - **Kết quả an toàn:** Đồng hồ **TUYỆT ĐỐI KHÔNG ĐƯỢC KÊU BÍP**. Nếu đồng hồ kêu bíp liên tục, nghĩa là bạn đã bị chập chì giữa đường nguồn và đường mass, cần kiểm tra và cạo bỏ vết chì chập trước khi cắm điện.
2. **Kiểm tra thông mạch từng nút bấm:**
   - Đặt 1 que đo vào Chân 10 (GND) và 1 que đo vào Chân 1 (Nút Đèn).
   - Khi chưa bấm nút: Đồng hồ im lặng.
   - Khi bấm đè nút: Đồng hồ phải **kêu bíp**, khi nhả tay ra đồng hồ **ngắt tiếng bíp**. Làm tương tự cho 4 nút còn lại.

---

### 7. Cố Định Khung Mô Hình Bằng Cọc Đồng M3 & Khởi Động Nghiệm Thu

1. Bắt **4 cọc đồng M3x10mm** vào 4 góc của Đế Ra Chân ESP32, dùng đai ốc (tán M3) siết chặt từ mặt dưới.
2. Bắt **4 cọc đồng M3x10mm** vào 4 góc của Bo Táp-lô 5x7cm.
3. Toàn bộ hệ thống được bắt chặt cố định lên một tấm mica hoặc tấm ván gỗ mô hình KTX kích thước khoảng 20x30cm.
4. Cắm cáp Type-C từ máy tính cấp nguồn:
   - Đèn LED nguồn đỏ trên ESP32 sáng rực.
   - Còi chip kêu 1 tiếng bíp ngắn báo khởi động.
   - Bấm nút 1 (Đèn) $\rightarrow$ LED Đèn trên bo táp-lô sáng cùng lúc Relay 1 nhảy "tạch", trên Web UI cập nhật trạng thái tức thì!

---

## PHẦN 10: KIẾN TRÚC HYBRID TỐI ƯU CỨU DEADLINE (ĐẾ RA CHÂN ESP32 + BREADBOARD — 0% HÀN THÊM, ỔN ĐỊNH 100%)

> [!TIP]
> **Giải pháp số 1 khi sát deadline hoặc cần hoàn thiện mạch chạy ngay trong 15 phút:**  
> Bạn không cần phải hàn thêm bất kỳ mối chì nào! Bằng cách tận dụng **Đế Ra Chân ESP32 (Expansion Shield 30P)** để cố định chip và cắm trực tiếp các module Relay, cảm biến; đồng thời dùng **Breadboard** chỉ để cắm 5 nút bấm và 6 đèn LED, hệ thống đạt độ ổn định 100%, không lo lỏng chân, không lo chập cháy và đầy đủ toàn bộ tính năng nghiệp vụ.

```text
                        ┌──────────────────────────────────────────────┐
                        │          ĐẾ RA CHÂN ESP32 DEV-KIT V1         │
                        │    (Cắm ESP32 cố định ở giữa, có 4 cọc đồng) │
                        └───────┬──────────────┬──────────────┬────────┘
                                │              │              │
                   Dây Cái-Cái  │  Dây Cái-Cái │  Dây Cái-Cái │ Dây Cái-Đực
                   ┌────────────┼──────────────┼──────────────┘      │
                   ▼            ▼              ▼                     ▼
             ┌───────────┐ ┌──────────┐ ┌──────────────┐     ┌───────────────┐
             │  MODULE   │ │ CẢM BIẾN │ │   CẢM BIẾN   │     │ BREADBOARD CŨ │
             │  RELAY    │ │  DHT22   │ │     MQ-2     │     │ (5 Nút Bấm    │
             │  4 KÊNH   │ │(Nhiệt/Ẩm)│ │  (Khí Gas)   │     │  & 6 Đèn LED) │
             └───────────┘ └──────────┘ └──────────────┘     └───────────────┘
```

### 1. Bảng Đấu Nối Cực Kỳ Chi Tiết (Cắm Xong Trong 15 Phút)

#### Nhóm 1: Cắm trực tiếp từ Module vào Đế Ra Chân ESP32 (Dùng Dây Cái - Cái)

| STT | Thiết Bị / Module | Chân Trên Module | Chân Cọc Cắm Trên Đế ESP32 | Loại Dây Cần Dùng | Ghi Chú Kỹ Thuật |
|:---:|---|---|---|:---:|---|
| 1 | **Module Relay 4 Kênh 5V** | `DC+` (VCC) | **Cọc 5V** (hoặc VCC) | **Cái - Cái** | Cấp nguồn nuôi cuộn hút Relay |
| 2 | | `DC-` (GND) | **Cọc GND** | **Cái - Cái** | Mass chung |
| 3 | | `IN1` | **Cọc D25** | **Cái - Cái** | Rơ-le Đèn Phòng 1 (LED tuýp 20W) |
| 4 | | `IN2` | **Cọc D26** | **Cái - Cái** | Rơ-le Đèn Phòng 2 (LED tuýp 20W) |
| 5 | | `IN3` | **Cọc D14** | **Cái - Cái** | Rơ-le Quạt Thông Gió KTX (60W) |
| 6 | | `IN4` | **Cọc D12** | **Cái - Cái** | Rơ-le Khóa Cửa Điện Tử (Mở 4s) |
| 7 | **Cảm Biến DHT22** (3 Chân) | `+` (VCC) | **Cọc 3V3** | **Cái - Cái** | Nguồn vi khí hậu 3.3V |
| 8 | | `-` (GND) | **Cọc GND** | **Cái - Cái** | Mass chung |
| 9 | | `out` (DATA) | **Cọc D4** | **Cái - Cái** | Đọc nhiệt độ (°C) & độ ẩm (%) |
| 10 | **Cảm Biến Gas MQ-2** (4 Chân)| `VCC` | **Cọc 5V** | **Cái - Cái** | Bắt buộc 5V để cấp nhiệt sấy cảm biến |
| 11 | | `GND` | **Cọc GND** | **Cái - Cái** | Mass chung |
| 12 | | `AO` (Analog Out) | **Cọc D34** | **Cái - Cái** | Đọc nồng độ gas / khói ADC1 |
| 13 | | `DO` | *(Để trống)* | — | Không dùng chân Digital Out |
| 14 | **Còi Active Buzzer 5V** | Chân Dài `(+)` | **Cọc D15** | **Cái - Cái** | Phát tiếng bíp quẹt thẻ & hú báo động |
| 15 | | Chân Ngắn `(-)` | **Cọc GND** | **Cái - Cái** | Mass chung |

---

#### Nhóm 2: Cắm từ Breadboard (Bảng 5 Nút Bấm Vật Lý) sang Đế ESP32 (Dùng Dây Cái - Đực)

> [!NOTE]
> **Tối ưu hóa thiết kế (Zero Clutter):** Không cần cắm các bóng đèn LED 5mm rời trên Breadboard vì:
> 1. Trên bo **Module Relay 4 Kênh** đã tích hợp sẵn **4 đèn LED SMD báo trạng thái (LED1, LED2, LED3, LED4)**: Khi rơ-le kênh nào đóng, đèn LED đỏ trên bo rơ-le đó sẽ sáng bừng lên cùng tiếng nhảy "TẠCH" cơ khí cực kỳ rõ ràng!
> 2. Giao diện **Web Dashboard** và **Telegram Bot** hiển thị trạng thái thiết bị theo thời gian thực (Realtime WebSocket).
> 3. Việc loại bỏ LED rời giúp giải phóng hoàn toàn các chân GPIO D25, D26, D14, D12, mạch Breadboard chỉ còn 5 nút bấm cực kỳ sạch sẽ, gọn gàng, không một sợi dây thừa!

| STT | Linh Kiện Trên Breadboard | Vị Trí Cắm Breadboard | Chân Cọc Cắm Trên Đế ESP32 | Loại Dây Cần Dùng | Ghi Chú Hoạt Động |
|:---:|---|---|---|:---:|---|
| 16 | **Thanh Mass Chung Breadboard** | Cột sọc Xanh `(-)` | **Cọc GND** trên Đế ESP32 *(cụm 8 cọc)* | **Cái - Đực** | Cấp Mass chung cho cả 5 nút bấm |
| 17 | **Nút 1 (Bật/Tắt Đèn)** | Hàng 5 (Vắt ngang rãnh) | **Cọc D32** | **Cái - Đực** | Bấm nút bật/tắt toàn bộ đèn phòng |
| 18 | **Nút 2 (Bật/Tắt Quạt)** | Hàng 10 (Vắt ngang rãnh) | **Cọc D33** | **Cái - Đực** | Bấm nút bật/tắt quạt thông gió KTX |
| 19 | **Nút 3 (Quẹt Thẻ SV001)** | Hàng 15 (Vắt ngang rãnh) | **Cọc D18** | **Cái - Đực** | Quẹt thẻ SV1: Mở cửa 4s + Còi kêu 1 bíp |
| 20 | **Nút 4 (Quẹt Thẻ SV002)** | Hàng 20 (Vắt ngang rãnh) | **Cọc D19** | **Cái - Đực** | Quẹt thẻ SV2: Mở cửa 4s + Còi kêu 1 bíp |
| 21 | **Nút 5 (Thẻ Lạ Bị Từ Chối)** | Hàng 25 (Vắt ngang rãnh) | **Cọc D21** | **Cái - Đực** | Thẻ lạ: Còi hú 3 tiếng cảnh báo an ninh |

---

### 2. Hướng Dẫn Thuyết Minh Báo Cáo Chuyên Nghiệp (Ghi Điểm Tuyệt Đối)

Khi Hội đồng hoặc Giảng viên hỏi về cấu trúc phần cứng, bạn tự tin trả lời:
> *"Dạ thưa Thầy/Cô, trong quy trình phát triển sản phẩm IoT công nghiệp, dự án đang ở giai đoạn **Thử nghiệm & Đánh giá (R&D Prototyping)**. Nhóm em chủ động lựa chọn kiến trúc **Mô-đun hóa (Modular Hardware Architecture)** kết hợp Bo mở rộng ESP32 Shield để:*
> 1. *Dễ dàng đo đạc kiểm thử tín hiệu độc lập giữa khối cảm biến vi khí hậu và khối chấp hành Relay cách ly quang.*
> 2. *Đảm bảo tính linh hoạt khi cần bảo trì, thay thế cảm biến trong môi trường KTX thực tế mà không cần tháo dỡ toàn bộ hệ thống.*
> 3. *Nhóm cũng đã thi công thử nghiệm Bảng táp-lô hiển thị LED và phím bấm trên bo phíp FR-4 chuyên dụng để sẵn sàng cho bước đóng gói vỏ hộp thương mại (Commercial Packaging) tiếp theo."*

---

🎉 **CHÚC MỪNG BẠN!** Bạn đã sở hữu một hệ thống phần cứng IoT Ký Túc Xá Thông Minh chuẩn mực: **Không dây dợ lòng thòng, không lo lỏng chân cắm, thẩm mỹ công nghiệp chuyên nghiệp**, sẵn sàng ghi điểm tuyệt đối trong buổi lễ bảo vệ đồ án!



