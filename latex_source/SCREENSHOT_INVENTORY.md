# DANH MỤC ẢNH MINH CHỨNG HỆ THỐNG (SCREENSHOT INVENTORY)

**Dự án:** Smart Dormitory IoT & AI Management System  
**Thư mục lưu trữ:** `d:\DACNTT2\SmartDorm_SourceCode\latex_source\media\test-evidence\`  
**Ngày lập:** 20/08/2026

---

## 1. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PORTAL) — `media/test-evidence/admin/`

| STT | Tên file ảnh | Tiêu đề màn hình / Chức năng | Mục tiêu minh chứng | Trạng thái |
|:---:|---|---|---|:---:|
| 1 | `admin_01_login.png` | Trang đăng nhập Admin (`/login`) | Form đăng nhập, validation, bảo mật mật khẩu | ✅ Sẵn sàng |
| 2 | `admin_02_dashboard_overview.png` | Tổng quan Dashboard (`/dashboard`) | KPI cards, biểu đồ telemetry real-time, widget phòng | ✅ Sẵn sàng |
| 3 | `admin_03_room_list.png` | Quản lý danh sách phòng (`/dashboard/rooms`) | Bảng danh sách phòng KTX, bộ lọc tòa nhà, sức chứa | ✅ Sẵn sàng |
| 4 | `admin_04_room_detail_A101.png` | Chi tiết phòng A-101 (`/dashboard/rooms/101`) | Trạng thái thiết bị, danh sách sinh viên lưu trú, biểu đồ cảm biến | ✅ Sẵn sàng |
| 5 | `admin_05_device_controls.png` | Bảng điều khiển thiết bị (`/dashboard/devices`) | Bật/tắt Đèn, Quạt, Khóa cửa, Còi báo động theo phòng | ✅ Sẵn sàng |
| 6 | `admin_06_command_history_undo.png` | Lịch sử lệnh & Nút Undo (`/dashboard/devices`) | Command Pattern history, trạng thái lệnh và nút Hoàn tác | ✅ Sẵn sàng |
| 7 | `admin_07_access_logs.png` | Nhật ký ra vào RFID (`/dashboard/access-log`) | Lịch sử quẹt thẻ (Hợp lệ xanh lá, Không hợp lệ đỏ) | ✅ Sẵn sàng |
| 8 | `admin_08_emergency_active.png` | Cảnh báo sự cố khẩn cấp (`/dashboard/emergency`) | Banner đỏ sự cố Gas/Cháy, Strategy Pattern thực thi | ✅ Sẵn sàng |
| 9 | `admin_09_emergency_resolved.png` | Xử lý sự cố (`/dashboard/emergency`) | Thao tác Resolve sự cố, cập nhật trạng thái đã giải quyết | ✅ Sẵn sàng |
| 10 | `admin_10_analytics_charts.png` | Phân tích dữ liệu & Báo cáo (`/dashboard/analytics`) | Biểu đồ Time-Series nhiệt độ, độ ẩm, công suất điện | ✅ Sẵn sàng |
| 11 | `admin_11_energy_monitoring.png` | Giám sát năng lượng (`/dashboard/energy`) | Thống kê tiêu thụ điện kWh theo tòa nhà và dự báo | ✅ Sẵn sàng |
| 12 | `admin_12_intelligence_models.png` | Quản trị mô hình AI (`/dashboard/intelligence/models`) | Danh sách ML Model (Champion GBM, Isolation Forest, Occupancy Classifier) | ✅ Sẵn sàng |
| 13 | `admin_13_ai_recommendations.png` | Đề xuất tối ưu AI (`/dashboard/intelligence/recommendations`) | Danh sách đề xuất tiết kiệm điện và bảo trì kèm nút Duyệt | ✅ Sẵn sàng |
| 14 | `admin_14_ai_anomalies.png` | Phát hiện bất thường (`/dashboard/intelligence/anomalies`) | Danh sách thiết bị quá tải điện phát hiện qua Isolation Forest | ✅ Sẵn sàng |
| 15 | `admin_15_ai_copilot_assistant.png` | AI Copilot Chat Assistant (`/dashboard/intelligence/assistant`) | Giao diện hội thoại tương tác AI Copilot & Function calling | ✅ Sẵn sàng |

---

## 2. PHÂN HỆ SINH VIÊN (STUDENT PORTAL) — `media/test-evidence/student/`

| STT | Tên file ảnh | Tiêu đề màn hình / Chức năng | Mục tiêu minh chứng | Trạng thái |
|:---:|---|---|---|:---:|
| 16 | `student_01_login.png` | Sinh viên đăng nhập (`/login`) | Đăng nhập tài khoản sinh viên `sv001@student.edu.vn` | ✅ Sẵn sàng |
| 17 | `student_02_dashboard.png` | Trang chủ sinh viên (`/student/dashboard`) | Thông tin phòng A-101 của SV, môi trường và thiết bị phòng mình | ✅ Sẵn sàng |
| 18 | `student_03_room_view.png` | Xem chi tiết phòng (`/student/room`) | Danh sách bạn cùng phòng, tiện nghi phòng | ✅ Sẵn sàng |
| 19 | `student_04_device_control.png` | Điều khiển thiết bị phòng mình (`/student/devices`) | Bật/tắt đèn quạt trong phạm vi phòng sinh viên | ✅ Sẵn sàng |
| 20 | `student_05_access_history.png` | Lịch sử quẹt thẻ sinh viên (`/student/access-history`) | Lịch sử vào ra chỉ của sinh viên đó, bảo vệ tính riêng tư | ✅ Sẵn sàng |
| 21 | `student_06_energy_view.png` | Theo dõi điện năng phòng (`/student/energy`) | Điện năng tiêu thụ của phòng sinh viên | ✅ Sẵn sàng |
| 22 | `student_07_profile.png` | Hồ sơ sinh viên (`/student/profile`) | Mã sinh viên, mã thẻ RFID, số điện thoại | ✅ Sẵn sàng |
| 23 | `student_08_rbac_blocked.png` | Kiểm tra phân quyền RBAC | Sinh viên bị chặn khi cố truy cập `/dashboard/*` | ✅ Sẵn sàng |

---

## 3. PHẦN CỨNG & WOKWI SIMULATOR — `media/test-evidence/wokwi/`

| STT | Tên file ảnh | Tiêu đề màn hình / Thiết bị | Mục tiêu minh chứng | Trạng thái |
|:---:|---|---|---|:---:|
| 24 | `ss_wokwi_simulator_circuit.png` | Sơ đồ mạch điện tử Wokwi ESP32 | ESP32, DHT22, Chiết áp Gas, 3 Nút RFID, 6 LED, Buzzer | ✅ Sẵn sàng |
| 25 | `wokwi_01_telemetry_running.png` | ESP32 gửi dữ liệu Telemetry | Log Serial Monitor nhiệt độ/độ ẩm/gas gửi lên MQTT | ✅ Sẵn sàng |
| 26 | `wokwi_02_rfid_granted.png` | Quẹt thẻ RFID hợp lệ trên ESP32 | LED Khóa cửa sáng, Buzzer kêu 1 tiếng, publish access/rfid | ✅ Sẵn sàng |
| 27 | `wokwi_03_rfid_denied.png` | Quẹt thẻ không hợp lệ trên ESP32 | LED Báo động nhấp nháy, Buzzer kêu 3 tiếng, gửi Unauthorized | ✅ Sẵn sàng |
| 28 | `wokwi_04_gas_alarm_trigger.png` | Xoay chiết áp Gas vượt 70% | LED Đỏ sáng, Buzzer kêu liên tục, gửi topic emergency | ✅ Sẵn sàng |
| 29 | `wokwi_05_command_actuation.png` | Nhận lệnh điều khiển từ Web | Nhận MQTT `/command/light` -> Bật LED 25, 26, 27 và trả ACK | ✅ Sẵn sàng |

---

## 4. MQTT & WEBSOCKET BROKER — `media/test-evidence/mqtt/`

| STT | Tên file ảnh | Tiêu đề luồng | Mục tiêu minh chứng | Trạng thái |
|:---:|---|---|---|:---:|
| 30 | `mqtt_01_telemetry_publish.png` | MQTT Telemetry Packet | Payload JSON gửi tới `dormitory/A/1/101/sensor/data` | ✅ Sẵn sàng |
| 31 | `mqtt_02_command_and_ack.png` | MQTT Command & ACK Lifecycle | Gửi lệnh `/command/light` và nhận `/command/ack` | ✅ Sẵn sàng |
| 32 | `mqtt_03_rfid_event.png` | MQTT RFID Access Event | Gói tin `dormitory/A/1/101/access/rfid` | ✅ Sẵn sàng |
| 33 | `websocket_01_realtime_broadcast.png` | WebSocket Broadcast (Socket.IO) | Observer broadcast `sensor:update` & `device:status` | ✅ Sẵn sàng |

---

## 5. DATABASE & BACKEND LOGS — `media/test-evidence/backend/` & `database/`

| STT | Tên file ảnh | Tiêu đề | Mục tiêu minh chứng | Trạng thái |
|:---:|---|---|---|:---:|
| 34 | `backend_01_startup_swagger.png` | Backend Khởi động & Swagger UI | Log NestJS khởi động cổng 3001, route mapping, Swagger UI | ✅ Sẵn sàng |
| 35 | `backend_02_jwt_auth_guard.png` | Log xác thực JWT & RBAC Guard | Trích xuất token Bearer, kiểm tra quyền `ADMIN` / `STUDENT` | ✅ Sẵn sàng |
| 36 | `database_01_users_rooms_rel.png` | Quan hệ bảng User - Room - Device | Truy vấn SQL/Prisma thể hiện liên kết thực thể | ✅ Sẵn sàng |
| 37 | `database_02_access_logs.png` | Bảng AccessLog & CommandLog | Nhật ký kiểm toán ra vào và lịch sử lệnh điều khiển | ✅ Sẵn sàng |
| 38 | `database_03_influxdb_points.png` | InfluxDB Telemetry Points | Measurement `environment_sensors` & `energy_telemetry` | ✅ Sẵn sàng |

---

## 6. SIMULATOR & AUTOMATED TESTING — `media/test-evidence/simulator/` & `testing/`

| STT | Tên file ảnh | Tiêu đề | Mục tiêu minh chứng | Trạng thái |
|:---:|---|---|---|:---:|
| 39 | `simulator_01_multi_room_load.png` | Python Simulator 20 phòng | Terminal chạy `simulate_rooms.py` đa luồng | ✅ Sẵn sàng |
| 40 | `testing_01_jest_backend_pass.png` | Kết quả Jest Backend Tests | 3 Suites, 33 Tests Passed 100% | ✅ Sẵn sàng |
| 41 | `testing_02_pytest_ml_pass.png` | Kết quả Pytest ML Service | 26 Tests AI/ML Passed 100% | ✅ Sẵn sàng |
| 42 | `testing_03_nextjs_build_pass.png` | Next.js Production Build | 35 Routes tĩnh/động biên dịch thành công | ✅ Sẵn sàng |
| 43 | `testing_04_e2e_verification_pass.png` | Full E2E System Verification | 15/15 Kịch bản End-to-End Passed | ✅ Sẵn sàng |

---
*Tất cả 43 hạng mục minh chứng đã được phân loại chuẩn xác và lập danh mục hoàn chỉnh.*
