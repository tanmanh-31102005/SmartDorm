# SMARTDORM — KẾ HOẠCH TỐI ƯU TRƯỚC BẢO VỆ ĐỒ ÁN

> File này dành cho Claude Code. Đặt tại thư mục gốc `D:\DACNTT2\SmartDorm_SourceCode\`.
> Mục tiêu: hệ thống chạy ổn định khi demo trước hội đồng, mọi con số đều trung thực và tái lập được, mã nguồn và tài liệu nhất quán với nhau.

---

## QUY TẮC BẮT BUỘC (đọc trước mỗi giai đoạn)

1. **Làm từng giai đoạn một.** Xong giai đoạn nào thì dừng lại, báo cáo (đã sửa gì, file nào, test nào chạy, kết quả ra sao), và chờ người dùng gõ "tiếp tục" mới làm giai đoạn sau.
2. **Không bịa số liệu.** Mọi chỉ số (R², MAPE, F1, độ trễ, số test pass...) phải sinh ra từ script chạy thật. Không sửa tay file `ml-service/models/*.json`. Nếu chưa đo được thì ghi "chưa đo", không ước lượng.
3. **Không phá luồng demo hiện có.** Wokwi và phần cứng thật vẫn phải chạy. Trước khi xóa trang, xóa tính năng hoặc reset database, phải hỏi người dùng.
4. **Git:** đầu Giai đoạn 0 tạo nhánh `toi-uu-bao-ve`. Mỗi giai đoạn commit riêng với message tiếng Việt, ví dụ `GĐ1: siết bảo mật JWT và MQTT`.
5. **Không commit bí mật.** Mọi token, mật khẩu, khóa API đặt trong `.env` (đã có trong `.gitignore`). Chỉ commit file `.env.example`.
6. **Môi trường là Windows + PowerShell.** Lệnh hướng dẫn cho người dùng phải chạy được trên PowerShell.
7. **Sau mỗi giai đoạn bắt buộc chạy:**
   ```
   cd backend; npm run build; npm test; cd ..
   cd frontend; npx tsc --noEmit; npm run build; cd ..
   cd ml-service; python -m pytest -q; cd ..
   ```
   Lỗi do mình gây ra thì sửa trước khi báo cáo. Lỗi đã có từ trước thì ghi vào báo cáo.
8. **Giữ giao diện tiếng Việt.** Giọng văn trong README và docs trung tính, kỹ thuật. Không dùng các cụm như "cấp thương mại", "tuyệt đối", "100%", "siêu", "vượt trội", và không dùng emoji trong tiêu đề.
9. **Ghi nhật ký** mọi thay đổi vào `docs/NHAT_KY_TOI_UU.md` (giai đoạn, file, lý do).

---

## MÔI TRƯỜNG & QUY TRÌNH TRIỂN KHAI (đọc kỹ)

- **Local** (`D:\DACNTT2\SmartDorm_SourceCode`) là nơi sửa và kiểm thử. **VPS Cloud là production**: đang chạy thật, có người dùng thử và sẽ được dùng để demo. Tuyệt đối không sửa code trực tiếp trên VPS.
- Luồng bắt buộc: sửa ở local → build/test → commit → push git → người dùng tự kéo về VPS và rebuild theo **Giai đoạn 11**. Claude Code **không** tự SSH hay deploy lên VPS; chỉ chuẩn bị script, checklist và tài liệu.
- **Thứ tự rollout quan trọng.** Một số thay đổi làm production hỏng nếu đưa lên sai thứ tự:
  - Bỏ secret mặc định của JWT: phải đặt `JWT_SECRET` trong `.env.docker` trên VPS **trước** khi deploy, nếu không backend sẽ không khởi động.
  - Bật xác thực MQTT: ESP32 đang chạy sẽ mất kết nối cho tới khi nạp lại firmware có user/pass mới.
  - Frontend nhúng `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_WS_URL` lúc build, nên khi rebuild frontend phải truyền lại `--build-arg`.
  - Mỗi `TELEGRAM_BOT_TOKEN` chỉ cho một backend chạy cùng lúc: khi test local phải tắt Telegram (đặt token rỗng hoặc dùng bot test riêng).
- **Dữ liệu production là tài sản.** Mọi thay đổi schema Prisma phải tương thích ngược (thêm cột có giá trị mặc định, không đổi tên hay xóa cột đang dùng). Trước mỗi lần deploy phải có backup `dev.db` (xem Giai đoạn 11).
- Không đổi hệ quản trị CSDL trong đợt tối ưu này (xem Giai đoạn 4).
- **`CLAUDE.md`** ở thư mục gốc là tài liệu do `/init` sinh ra, các lệnh trong đó **chưa được chạy thử**. Đọc nó trước, nhưng coi mọi lệnh là giả thuyết cho tới khi Giai đoạn 0 xác nhận từng lệnh. Sửa lại `CLAUDE.md` cho đúng với thực tế và cập nhật nó sau mỗi giai đoạn nếu kiến trúc đổi. Không để tài khoản đăng nhập hay địa chỉ IP trong file này.

---

## GIAI ĐOẠN 0 — CHUẨN BỊ & ĐO HIỆN TRẠNG

- Tạo nhánh git `toi-uu-bao-ve`.
- Đọc `CLAUDE.md` và `frontend/AGENTS.md` (Next.js 16 có thay đổi so với bản cũ, phải theo hướng dẫn trong đó). Chạy thử **từng lệnh** liệt kê trong `CLAUDE.md` (chạy một test đơn lẻ bằng Jest và pytest, `dist/src/main.js`, các script) và ghi lệnh nào đúng, lệnh nào sai vào `docs/BASELINE.md`. Sửa `CLAUDE.md` cho khớp.
- Xác nhận bằng cách đọc code: backend đang dùng SQLite (`backend/prisma/dev.db`), ML service đọc thẳng file SQLite đó, và InfluxDB/PostgreSQL trong `docker-compose.yml` có thực sự được ghi/đọc không.
- Sao lưu `backend/prisma/dev.db` thành `backend/prisma/dev.db.bak`.
- Chạy toàn bộ lệnh build và test ở Quy tắc 7. Ghi kết quả thật vào `docs/BASELINE.md`: số test pass/fail của từng bộ, lỗi build nếu có, phiên bản Node, Python và các thư viện chính.
- Lập bảng **đối chiếu README ↔ mã nguồn** trong `docs/BASELINE.md`. Các điểm đã biết lệch:
  - README ghi NestJS 10, `package.json` là ^11.
  - README ghi PostgreSQL 16, nhưng `schema.prisma` dùng `provider = "sqlite"`.
  - README ghi Gemini 1.5 Pro, code gọi model khác (xem `backend/src/intelligence/llm/`).
  - README ghi occupancy là Random Forest ~89,2%, còn `occupancy_metrics.json` ghi Logistic v1.2.
  - README nhắc test tiền điện EVN; kiểm tra test này có tồn tại không.
  - README nhắc trang `/student/energy`, `/dashboard/energy`; kiểm tra có tồn tại không.

**Tiêu chí xong:** có `docs/BASELINE.md` với số liệu thật.

---

## GIAI ĐOẠN 1 — BẢO MẬT (ưu tiên cao nhất vì hệ thống đang public trên VPS)

> Production đang public, nên mọi thay đổi ở giai đoạn này phải đi kèm **ghi chú rollout** trong `docs/NHAT_KY_TOI_UU.md`: biến môi trường nào phải thêm vào `.env.docker` trên VPS, và thiết bị nào cần nạp lại firmware. Lập danh sách này để dùng ở Giai đoạn 11.
> Xóa tài khoản và IP khỏi `CLAUDE.md` cùng `README.md`. Nhắc người dùng rằng lịch sử git vẫn giữ nội dung cũ, nên **đổi mật khẩu thật trên production** mới là biện pháp có hiệu lực.

**Backend**
- `backend/src/auth/auth.module.ts` và `jwt.strategy.ts`: bỏ fallback `'smart_dormitory_secret'`. Thiếu `JWT_SECRET` thì ném lỗi khi khởi động.
- Thêm `helmet`. CORS chỉ cho phép origin lấy từ biến `FRONTEND_ORIGIN`.
- Throttler chặt hơn cho `POST /auth/login` (ví dụ 5 lần/phút/IP) và cho endpoint gửi lệnh thiết bị.
- Validate mọi payload MQTT nhận vào (DTO + class-validator hoặc kiểm tra thủ công): sai kiểu hoặc ngoài khoảng vật lý thì bỏ qua và ghi log, không được làm sập service.
- Kiểm tra RBAC: sinh viên gọi API điều khiển hoặc xem dữ liệu phòng khác phải nhận 403.

**Seed & tài khoản**
- Mật khẩu tài khoản demo đọc từ biến môi trường `SEED_ADMIN_PASSWORD`, `SEED_STUDENT_PASSWORD`; chỉ dùng giá trị mặc định khi `NODE_ENV=development`.

**MQTT**
- Bật `allow_anonymous false`, dùng file mật khẩu và **ACL**: tài khoản ESP32 chỉ publish `smartdorm/<building>/<room>/sensor|access|status|ack` và subscribe `.../command/#` của đúng phòng mình; tài khoản backend có toàn quyền.
- Cập nhật `mosquitto.conf`, `setup_mqtt_auth.ps1`, firmware (đọc user/pass từ `secrets.h`, có file `secrets.h.example`) và backend.

**Docker / VPS**
- `docker-compose.yml`: không publish cổng 8000 (ML) và cổng PostgreSQL/InfluxDB ra ngoài; chỉ giữ mạng nội bộ Docker. ML chỉ được gọi qua backend.
- **README:** xóa IP VPS, email/mật khẩu demo, lệnh `ssh root@...`. Chuyển nội dung vận hành VPS sang `docs/VAN_HANH_VPS.md` và thêm file này vào `.gitignore` (hoặc ghi chú cho người dùng tự lưu riêng).
- Viết `docs/CHECKLIST_BAO_MAT_VPS.md` cho người dùng **tự làm tay** trên server: đổi mật khẩu, SSH key, tắt đăng nhập mật khẩu root, `ufw` chỉ mở 22/80/443 (và 1883 nếu ESP32 kết nối từ ngoài), Nginx reverse proxy + HTTPS Let's Encrypt nếu có tên miền.

**Tiêu chí xong:** không còn secret mặc định trong code; MQTT không cho kết nối ẩn danh; README không lộ thông tin đăng nhập.

---

## GIAI ĐOẠN 2 — THỐNG NHẤT NGƯỠNG AN TOÀN

Lỗi hiện tại: firmware báo gas khi `> 70%`, còn backend dùng `gasLevel > 400` (`backend/src/intelligence/decision-engine/rules/device-rules.ts:21` và `backend/src/analytics/analytics.service.ts:354`), trong khi ESP32 gửi `gas_level` theo **phần trăm**.

- Tạo một nguồn cấu hình duy nhất, ví dụ `backend/src/common/safety-thresholds.ts` hoặc bảng `SystemSetting` trong Prisma:
  - `GAS_WARN_PCT = 50`, `GAS_CRITICAL_PCT = 70`
  - `TEMP_WARN_C = 40`, `TEMP_CRITICAL_C = 55`
- Mọi rule và analytics đọc từ nguồn đó. Grep toàn repo tìm các con số ngưỡng hard-code còn sót.
- Trang `/dashboard/settings` lưu ngưỡng thật vào DB (kiểm tra hiện tại có lưu thật không). Khi đổi ngưỡng, backend publish `smartdorm/<b>/<r>/config/thresholds`.
- Firmware subscribe topic config, lưu ngưỡng vào NVS (`Preferences`), và dùng giá trị mặc định khi chưa nhận được config.
- Viết unit test cho rule gas/nhiệt với các giá trị biên: 49, 50, 69, 70, 71.

**Tiêu chí xong:** chỉnh ngưỡng trên web thì cả backend lẫn ESP32 cùng đổi theo; test biên pass.

---

## GIAI ĐOẠN 3 — FRONTEND DÙNG DỮ LIỆU THẬT

Hiện trạng: các trang `dashboard/intelligence/*` (overview, models, anomalies, occupancy, recommendations) và `dashboard/buildings` hiển thị dữ liệu tĩnh từ `frontend/src/lib/intelligence-data.ts` và `smartdorm-data.ts`.

- Liệt kê các endpoint backend đã có (Swagger, `intelligence.controller`, `ml-client.service.ts`). Bổ sung GET còn thiếu: `/intelligence/models`, `/intelligence/anomalies`, `/intelligence/occupancy`, `/intelligence/forecast`, `/buildings`.
- `frontend/src/lib/intelligence-store.ts`: thêm action `fetchAll()` gọi API khi trang mount. Dữ liệu tĩnh **chỉ** dùng khi bật `NEXT_PUBLIC_DEMO_OFFLINE=true`.
- Mỗi trang cần đủ trạng thái loading, rỗng và lỗi (có nút thử lại).
- Mỗi khối AI hiển thị một nhãn nhỏ cho biết nguồn: `FastAPI · <tên model> <version>` hoặc `Fallback (luật)`. Backend trả kèm trường `source` trong response.
- Chỉ số mô hình trên trang Models phải đọc từ file metrics do script huấn luyện sinh ra (qua API), không hard-code.
- Grep và loại bỏ số liệu bịa trong UI: `94.6`, `0.9412`, `0.8120`, `11.45`, `38.4`, `14.2`, `89.2`, cùng các số "đẹp" khác không có nguồn.

**Tiêu chí xong:** tắt ML service thì UI chuyển sang nhãn "Fallback"; bật lại thì hiện số thật từ model.

---

## GIAI ĐOẠN 4 — CƠ SỞ DỮ LIỆU NHẤT QUÁN (giữ SQLite)

Hiện trạng đã xác nhận: backend chạy trên **SQLite** (`backend/prisma/dev.db`), ML service đọc trực tiếp file này, còn PostgreSQL trong Docker Compose không phải nguồn dữ liệu chính. Với quy mô demo, **không chuyển sang PostgreSQL** trong đợt này: việc đó đụng tới dữ liệu production, ML service và rủi ro vỡ demo, trong khi lợi ích với hội đồng rất ít.

- Giữ SQLite làm CSDL chính. Bật chế độ WAL và `busy_timeout` để backend và ML service cùng đọc/ghi file an toàn. ML service mở file ở chế độ **chỉ đọc** (`mode=ro`).
- Xác định InfluxDB và PostgreSQL có đang được dùng không. Nếu **không dùng**, bỏ khỏi `docker-compose.yml` để giải phóng RAM trên VPS (chỉ 4 GB) và sửa README, docs cho đúng. Việc gỡ container trên production chỉ ghi vào checklist Giai đoạn 11, không tự thực hiện.
- Viết `docs/ERD.md` (Mermaid `erDiagram`) sinh từ `schema.prisma`.
- Viết script sao lưu `scripts/backup-db.sh` (dùng `sqlite3 .backup`, không dùng `cp` khi DB đang ghi) và script khôi phục. Tài liệu hóa rõ trong `docs/VAN_HANH_VPS.md`.
- Mọi thay đổi schema (nếu cần) phải là migration thêm cột/bảng, không phá dữ liệu cũ, và kiểm thử trên **bản sao** của `dev.db` trước.
- Ghi vào `docs/MODEL_CARD.md` và README: "Hệ thống dùng SQLite, phù hợp quy mô demo; hướng mở rộng là PostgreSQL + TimescaleDB/InfluxDB khi lên quy mô nhiều tòa nhà." Đây là câu trả lời trung thực nếu hội đồng hỏi về khả năng mở rộng.

**Tiêu chí xong:** README, docs và compose cùng mô tả đúng CSDL đang dùng; backup/restore chạy thử được trên bản sao.

---

## GIAI ĐOẠN 5 — HỌC MÁY TRUNG THỰC, BẢO VỆ ĐƯỢC

**Dự báo phụ tải** (`ml-service/training/train_forecast.py`)
- Vấn đề hiện tại: mô hình dùng `light_on`, `fan_on`, `occupancy_signal` **cùng thời điểm** với nhãn công suất, trong khi công suất mô phỏng được tính trực tiếp từ các trạng thái này. Đây là rò rỉ thông tin, làm R² cao giả tạo.
- Sửa bài toán thành **dự báo công suất t+1 giờ** (4 bước × 15 phút) từ:
  - lag: 1h, 2h, 24h; rolling mean/std 3h
  - đặc trưng thời gian: sin/cos giờ, sin/cos thứ, cuối tuần, giờ học
  - nhiệt độ, độ ẩm tại thời điểm t
- Chia train/test **theo thời gian** (ví dụ 4 tuần đầu train, tuần cuối test). Tập test phải có hàng nghìn điểm, không phải 162.
- So sánh với baseline: persistence (giá trị hiện tại), seasonal-naive (cùng giờ hôm qua), Ridge, GBM Huber. Báo cáo MAE và RMSE **đơn vị W**, MAPE, R², độ trễ suy luận đo thật.
- Script tự ghi `models/forecast_metrics.json` và `models/forecast_comparison.json`. Chấp nhận kết quả thật dù R² thấp hơn 0,96.

**Phát hiện bất thường**
- Đánh giá Isolation Forest **theo từng kịch bản** (POWER_SPIKE, ENERGY_WASTE, GAS_LEAK...), kèm precision, recall và FPR cho mỗi loại.
- Thử kiến trúc lai "luật ngưỡng + IF" và so sánh với luật đơn thuần và IF đơn thuần. Tinh chỉnh `contamination` trên tập validation.

**Occupancy**
- Ghi rõ nhãn là mô phỏng. Kiểm tra rò rỉ (accuracy 99,97% là đáng ngờ); nếu có đặc trưng trùng nhãn thì loại bỏ.

**Tài liệu**
- `docs/MODEL_CARD.md`: dữ liệu, cách chia, đặc trưng, baseline, kết quả, hạn chế.
- `ml-service/reports/generate_visualizations.py` xuất biểu đồ "dự báo và thực tế" trên tập test (PNG) để dùng cho poster.

**Tiêu chí xong:** một lệnh `python -m training.retraining_job` chạy lại toàn bộ và sinh đúng các file metrics; pytest pass.

---

## GIAI ĐOẠN 6 — KIỂM THỬ THẬT & CI

- Thay boilerplate `backend/test/app.e2e-spec.ts` ("Hello World") bằng e2e thật, dùng DB test riêng:
  1. Đăng nhập đúng/sai; JWT hết hạn.
  2. Sinh viên không truy cập được phòng khác (403).
  3. Gửi lệnh bật đèn → đã publish MQTT (mock client) → Undo đảo ngược lệnh.
  4. Nhận telemetry gas vượt ngưỡng → tạo bản ghi Emergency → có gọi notify.
  5. Payload MQTT sai định dạng không làm crash.
- Unit test cho tính tiền điện bậc thang EVN (nếu tính năng tồn tại): ranh giới các bậc, VAT, chia theo số người.
- Pytest cho pipeline ML mới (không rò rỉ, chia theo thời gian, đúng shape).
- Thêm `.github/workflows/ci.yml`: build + test backend, frontend, ml-service mỗi lần push.
- Ghi `docs/BAO_CAO_KIEM_THU.md` với số test **thật** từ output, có kèm lệnh để tái lập.

---

## GIAI ĐOẠN 7 — ĐO HIỆU NĂNG THẬT

- **Độ trễ end-to-end:**
  - Firmware và simulator thêm `ts_device` (ms epoch, đồng bộ NTP) vào payload.
  - Backend ghi `ts_backend` khi nhận, đính kèm khi phát qua Socket.IO.
  - Frontend có chế độ đo (query `?bench=1`) ghi `ts_render`.
  - Script `scripts/bench/latency.js` tổng hợp p50, p95, p99.
- **Tải WebSocket:** script k6 hoặc Artillery `scripts/bench/ws-load.*` với 50/100/300 client; đồng thời ghi CPU/RAM từ `docker stats`.
- Ghi `docs/HIEU_NANG.md`: cấu hình máy đo, cách đo, bảng kết quả, giới hạn của phép đo.

---

## GIAI ĐOẠN 8 — TRẢI NGHIỆM DEMO TRƯỚC HỘI ĐỒNG

- **Trang `/dashboard/demo`** (chỉ admin):
  - Các nút kích hoạt kịch bản cho một phòng demo: rò gas, quá nhiệt, quên tắt đèn lúc 2h sáng, quẹt thẻ lạ 3 lần, tăng tải đột ngột. Backend publish telemetry giả lập lên MQTT, đi qua đúng pipeline thật, không đi đường tắt.
  - Timeline sự kiện realtime theo dạng: thiết bị → MQTT → backend → rule/ML → cảnh báo → thông báo.
  - Nút "Khôi phục trạng thái demo" để reset phòng demo về seed.
- **Copilot:** khi không có Internet hoặc không có `GEMINI_API_KEY`, trả lời bằng chế độ dự phòng dựa trên tool nội bộ, kèm thông báo rõ ràng; không được hiện lỗi đỏ.
- **Firmware:** `platformio.ini` có 2 môi trường `[env:wokwi]` và `[env:real]`. Dùng `#ifdef` để chọn: nút bấm/biến trở hay RC522/MQ-2 thật. Tùy chọn thêm cảm biến dòng INA219 để đo công suất thật thay cho công thức `20W × đèn + 60W quạt`.
- **Trang `/dashboard/health`:** trạng thái MQTT, ML service, DB, số thiết bị online, thời điểm nhận telemetry gần nhất.
- **Script `start-demo.ps1`:** khởi động toàn bộ hệ thống bằng Docker trên laptop với mạng LAN riêng (không phụ thuộc wifi trường), seed dữ liệu demo, mở trình duyệt.

---

## GIAI ĐOẠN 9 — TÀI LIỆU NHẤT QUÁN

- Viết lại `README.md`:
  - Phiên bản thư viện đúng với `package.json` và `requirements.txt`.
  - Sơ đồ kiến trúc đúng với code.
  - Bảng chỉ số lấy từ file metrics mới.
  - Có mục "Hạn chế".
  - Bỏ các cụm phóng đại và emoji trong tiêu đề.
- Rà toàn bộ `docs/smartdorm_docs/*.md`: sửa các chỗ nhắc TimescaleDB, "12 bảng", Random Forest/Linear Regression, số test, độ trễ không có nguồn.
- Thêm `docs/SEQUENCE_SU_CO_GAS.md`: sơ đồ tuần tự Mermaid cho luồng xử lý gas, gồm cả nhánh mất kết nối máy chủ.
- Thêm `docs/KICH_BAN_DEMO.md`: kịch bản 6–7 phút, phân vai cho 2 thành viên (Nguyễn Tấn Mạnh — mạng/MQTT/phần cứng; Võ Anh Kiệt — backend/pattern/kiểm thử/ML), kèm phương án dự phòng.
- Thêm `docs/CAU_HOI_HOI_DONG.md`: 15 câu hỏi hội đồng hay hỏi và câu trả lời dựa trên code thật (MQTT vs HTTP, QoS, mất kết nối server, rò rỉ dữ liệu ML, vì sao GBM, an toàn thẻ RFID Mifare, mở rộng 500 phòng...).

---

## GIAI ĐOẠN 10 — NGHIỆM THU CUỐI

- Clone sạch vào thư mục tạm, chạy `docker compose up --build`, seed, rồi làm smoke test theo `docs/KICH_BAN_DEMO.md`.
- Chạy toàn bộ test, build frontend, retrain ML.
- Viết `docs/BAO_CAO_TOI_UU.md` gồm:
  - So sánh trước/sau với `BASELINE.md`.
  - Danh sách thay đổi theo giai đoạn.
  - **Bảng số liệu mới để đưa lên poster:** chỉ số ML, số test, độ trễ p50/p95, tải WebSocket. Mỗi số kèm file nguồn và lệnh tái lập.
  - Các việc còn tồn đọng.

---

## GIAI ĐOẠN 11 — ĐƯA LÊN PRODUCTION (chỉ chuẩn bị, người dùng tự thực hiện)

Claude Code **không** SSH vào VPS. Việc của Claude Code là tạo các file sau, đã kiểm tra cú pháp ở local:

1. `docs/RUNBOOK_DEPLOY.md`: quy trình từng bước, mỗi bước có lệnh PowerShell/bash, kết quả mong đợi và cách xử lý khi sai.
2. `scripts/deploy-vps.sh`: chạy trên VPS theo thứ tự: backup DB → `git pull` → kiểm tra `.env.docker` có đủ biến bắt buộc (`JWT_SECRET`, `FRONTEND_ORIGIN`, thông tin MQTT, `GEMINI_API_KEY` nếu có) và **dừng lại nếu thiếu** → rebuild đúng container thay đổi (frontend truyền `--build-arg NEXT_PUBLIC_API_URL ... NEXT_PUBLIC_WS_URL ...`) → chờ healthcheck → smoke test.
3. `scripts/smoke-test.sh` (hoặc `.ps1`): gọi `/api/docs`, `/ml/health`, đăng nhập thử, đọc một phòng, gửi một lệnh thử và đọc lại trạng thái. In rõ PASS/FAIL.
4. `scripts/rollback.sh`: quay về commit trước (`git checkout <tag>`), khôi phục `dev.db` từ backup gần nhất, rebuild và chạy lại smoke test.
5. `docs/CHECKLIST_ROLLOUT.md`, tổng hợp từ ghi chú rollout của các giai đoạn:
   - Biến môi trường mới phải thêm vào `.env.docker`.
   - Thiết bị cần nạp lại firmware (nếu MQTT đã bật xác thực).
   - Cổng cần đóng trên `ufw` và trong compose.
   - Container có thể gỡ (InfluxDB/PostgreSQL nếu không dùng).
   - Việc cần làm tay: đổi mật khẩu, SSH key, HTTPS.
6. Gắn git tag `truoc-toi-uu` vào commit production hiện tại **trước khi** merge nhánh `toi-uu-bao-ve`, và tag `sau-toi-uu` sau khi deploy thành công.

**Thứ tự deploy đề xuất:** (a) thêm biến `.env.docker` mới → (b) backup → (c) deploy backend và ML → (d) smoke test → (e) deploy frontend với đủ build-arg → (f) smoke test → (g) bật xác thực MQTT và nạp lại firmware → (h) đóng cổng thừa. Nếu bước nào FAIL thì chạy `rollback.sh`.

**Tiêu chí xong:** chạy thử toàn bộ quy trình trên một bản clone local hoặc VPS tạm; người dùng đọc runbook và làm theo được mà không cần hỏi thêm.
