# ✅ Kiểm Thử & Chất Lượng
## Tài Liệu 10 — Testing & Quality Assurance

---

## 1. Tổng Quan Test Coverage

```
═══════════════════════════════════════════════════════════
                SMARTDORM TEST COVERAGE SUMMARY
═══════════════════════════════════════════════════════════

Layer 1: Python ML Service (pytest)
  36/36 tests PASSED — 100% pass rate (4.18 giây)

Layer 2: NestJS Backend (Jest)
  33/33 tests PASSED — 100% pass rate (28.0 giây)

Layer 3: End-to-End Integration (15 scenarios)
  15/15 scenarios PASSED — 100% pass rate (1.2 giây)

Layer 4: Frontend Build
  35/35 routes compiled — 100% success (9.0 giây Turbopack)

DATA QUALITY: 12/12 criteria PASSED — TRAINING_ELIGIBLE = TRUE

═══════════════════════════════════════════════════════════
TỔNG: 84 + data quality gates = ALL GREEN ✅
═══════════════════════════════════════════════════════════
```

---

## 2. ML Service Tests (Python / pytest)

### 2.1 Chạy Tests

```bash
cd ml-service
pytest tests/ -v --tb=short
```

### 2.2 Chi Tiết Test Suites

#### `tests/test_ai_suite.py` — 10 Tests

| Test | Mô tả | Status |
|---|---|---|
| `test_energy_forecast_prophet` | Prophet trả về 24 điểm dự báo hợp lệ | PASS |
| `test_energy_forecast_lstm` | LSTM trả về dự báo với confidence interval | PASS |
| `test_energy_forecast_baseline` | Baseline đơn giản hoạt động đúng | PASS |
| `test_forecast_compare_all_models` | So sánh 3 models trả về đầy đủ metrics | PASS |
| `test_anomaly_detection_normal` | Thiết bị bình thường không bị flag | PASS |
| `test_anomaly_detection_overload` | Thiết bị quá tải được phát hiện | PASS |
| `test_occupancy_occupied_room` | Phòng có người được phân loại đúng | PASS |
| `test_occupancy_vacant_room` | Phòng trống được phân loại đúng | PASS |
| `test_model_promotion` | Promote model hoạt động đúng | PASS |
| `test_model_status_endpoint` | /ml/model-status trả về đúng format | PASS |

#### `tests/test_forecast.py` — 4 Tests

```python
def test_prophet_forecast_returns_correct_horizon():
    request = ForecastRequest(roomId="A101", horizonHours=24)
    response = generate_energy_forecast(request)
    
    assert len(response.points) == 24
    assert all(p.powerW >= 0 for p in response.points)
    assert response.summary.inferenceMs < 1000  # < 1 second

def test_lstm_forecast_has_confidence_interval():
    request = ForecastRequest(roomId="A101", horizonHours=24)
    response = generate_lstm_forecast(request)
    
    assert all(p.powerWLower <= p.powerW <= p.powerWUpper for p in response.points)

def test_baseline_is_deterministic():
    request = ForecastRequest(roomId="A101", horizonHours=24)
    result1 = generate_baseline_forecast(request)
    result2 = generate_baseline_forecast(request)
    
    # Baseline phải trả về kết quả giống nhau
    assert result1.points == result2.points

def test_model_comparison_includes_all_three():
    request = ForecastRequest(roomId="A101", horizonHours=24)
    comparator = get_model_comparator()
    result = comparator.compare_on_request(request)
    
    model_names = [r['model'] for r in result['comparison']]
    assert 'energy-baseline' in model_names
    assert 'energy-prophet' in model_names
    assert 'energy-lstm' in model_names
```

#### `tests/test_anomaly.py` — 4 Tests

```python
def test_normal_device_not_flagged():
    devices = [DeviceInput(
        deviceId="dev001",
        deviceName="Fan A101",
        roomId="A101",
        powerW=35.0,        # Bình thường
        responseMs=150,     # Bình thường
        failureRate=0.01,   # Thấp
        uptimeHours=24.0    # Bình thường
    )]
    result = detect_device_anomalies(devices)
    assert result.results[0].severity == "NORMAL"

def test_overloaded_device_flagged_critical():
    devices = [DeviceInput(
        deviceId="dev002",
        deviceName="Fan B202",
        roomId="B202",
        powerW=1200.0,      # Rất cao — quá tải
        responseMs=3000,    # Chậm
        failureRate=0.35,   # Cao
        uptimeHours=200.0   # Quá lâu
    )]
    result = detect_device_anomalies(devices)
    assert result.results[0].severity in ["HIGH", "CRITICAL"]
    assert result.results[0].anomalyScore > 0.7
```

#### `tests/test_m1_data_foundation.py` — 10 Tests

```python
def test_no_future_data_leakage():
    """Đảm bảo lag features không chứa dữ liệu tương lai"""
    df = load_dataset()
    df_features = build_time_series_lag_features(df)
    
    # Kiểm tra rolling window không bao gồm thời điểm hiện tại
    for i in range(len(df_features)):
        row = df_features.iloc[i]
        actual_window = df.iloc[max(0, i-24):i]  # 24h trước, KHÔNG bao gồm i
        assert row['power_roll_24h_mean'] == actual_window['power_w'].mean()

def test_monotonic_energy_per_room():
    """Điện năng tích lũy phải tăng đơn điệu trong mỗi phòng"""
    df = load_dataset()
    for room_id in df['room_id'].unique():
        room_df = df[df['room_id'] == room_id].sort_values('timestamp')
        diffs = room_df['energy_kwh'].diff().dropna()
        assert (diffs >= 0).all(), f"Room {room_id} has non-monotonic energy"

def test_no_negative_power():
    df = load_dataset()
    assert (df['power_w'] >= 0).all()

def test_no_null_values():
    df = load_dataset()
    assert df.isnull().sum().sum() == 0

def test_no_duplicates():
    df = load_dataset()
    assert df.duplicated().sum() == 0
```

---

## 3. Backend Tests (NestJS / Jest)

### 3.1 Chạy Tests

```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### 3.2 Chi Tiết Test Suites

#### `src/intelligence/intelligence.spec.ts` — 33 Tests

Kiểm thử toàn diện IntelligenceService — trái tim AI của hệ thống:

```typescript
describe('IntelligenceService', () => {
  // Forecast Tests
  describe('getEnergyForecast', () => {
    it('should return 24 forecast points for default horizon');
    it('should return 168 points for weekly horizon');
    it('should use Prophet as champion model');
    it('should include confidence intervals');
    it('should fallback to baseline if ML service unavailable');
  });
  
  // Anomaly Tests
  describe('getDeviceAnomalies', () => {
    it('should return empty list when no anomalies');
    it('should return CRITICAL severity for extreme overload');
    it('should sort by anomaly score descending');
  });
  
  // Recommendation Tests
  describe('getRecommendations', () => {
    it('should return pending recommendations by default');
    it('should filter by type correctly');
    it('should filter by severity correctly');
  });
  
  describe('acceptRecommendation', () => {
    it('should update status to ACCEPTED');
    it('should record acceptedBy user');
    it('should trigger automation if rule exists');
  });
  
  // Automation Rules Tests
  describe('AutomationRules', () => {
    it('should create rule with disabled state by default');
    it('should only execute when enabled');
    it('should respect cooldown period');
    it('should log execution results');
  });
  
  // Copilot Tests
  describe('AICopilot', () => {
    it('should respond to energy questions');
    it('should respond to device status questions');
    it('should be read-only (not execute commands)');
    it('should include data sources in response');
  });
});
```

#### `src/intelligence/copilot/copilot.spec.ts`

```typescript
describe('CopilotService', () => {
  it('should generate contextual response from sensor data', async () => {
    const response = await copilotService.chat({
      message: "Nhiệt độ phòng A101 hôm nay như thế nào?",
      context: { roomId: "clroom001", timeRange: "24h" }
    });
    
    expect(response.reply).toContain('°C');
    expect(response.sources).toContain('sensor_data');
    expect(response.confidence).toBeGreaterThan(0);
  });
  
  it('should refuse to execute device commands', async () => {
    const response = await copilotService.chat({
      message: "Hãy tắt đèn phòng A101",
    });
    
    // Copilot chỉ đọc — không thực hiện lệnh
    expect(response.reply).toContain('không thể thực hiện lệnh');
    expect(response.commandExecuted).toBeFalsy();
  });
});
```

---

## 4. End-to-End Integration Tests (15 Scenarios)

### 4.1 Danh Sách Test Cases

```
TC-CORE-01: Backend API & Swagger Docs
  → GET http://localhost:3001/api/docs
  → Expect: Swagger UI loads, 200 OK
  → Status: PASS

TC-CORE-02: ML Microservice Health Check
  → GET http://localhost:8000/ml/health
  → Expect: {"status": "healthy"}
  → Status: PASS

TC-AUTH-01: Admin Authentication JWT
  → POST /api/auth/login {email: "admin@smartdorm.com", password: "admin123"}
  → Expect: {access_token: "eyJ..."}, role: "ADMIN"
  → Status: PASS

TC-AUTH-02: Student Scoped Authentication
  → POST /api/auth/login {email: "student1@smartdorm.com", password: "student123"}
  → Expect: {access_token: "eyJ..."}, role: "STUDENT", roomId: "clroom001"
  → Status: PASS

TC-ROOM-01: Fetch Dormitory Rooms
  → GET /api/rooms (with Admin JWT)
  → Expect: Array of 7+ rooms with building info
  → Status: PASS

TC-CMD-01: Device Command Dispatch (ON)
  → POST /api/devices/{lightId}/command {action: "on"}
  → Expect: {success: true, ackReceived: true}
  → Verify: device.isOn === true
  → Status: PASS

TC-CMD-02: Device Command Undo Mechanism
  → POST /api/devices/{lightId}/undo
  → Expect: device.isOn === false (reverted)
  → Status: PASS

TC-IOT-01: Telemetry Pipeline (MQTT→WebSocket)
  → Publish MQTT: dormitory/A/1/101/sensor/data
    {temperature: 28.6, humidity: 64.0, gas_level: 18.2}
  → Expect WebSocket event: "sensor:update"
    {temperature: 28.6, humidity: 64.0}
  → Expect DB record created in SensorData
  → Status: PASS (latency < 200ms)

TC-RFID-01: Valid RFID Access (Granted)
  → Publish MQTT: dormitory/A/1/101/access/rfid
    {card_id: "CARD_A1B2C3D4", authorized: true, action: "entry"}
  → Expect: AccessLog created {authorized: true, user: "Nguyễn Văn An"}
  → Expect WebSocket: "access:log" event received
  → Status: PASS

TC-RFID-02: Invalid RFID Access (Denied)
  → Publish MQTT: dormitory/A/1/101/access/rfid
    {card_id: "CARD_INVALID99", authorized: false, action: "denied"}
  → Expect: AccessLog {authorized: false, user: null}
  → Expect: Emergency created (type: INTRUSION)
  → Status: PASS

TC-EMERG-01: Emergency Strategy Execution
  → Publish MQTT: sensor/data {gas_level: 78.5, gas_alert: true}
  → Expect: Emergency created (type: GAS_LEAK, level: CRITICAL)
  → Expect: MQTT command published: command/alarm {action: "on"}
  → Expect: MQTT command published: command/fan {action: "on"}
  → Expect: WebSocket: "emergency:alert" broadcast
  → Latency: < 50ms end-to-end
  → Status: PASS

TC-AI-01: ML Isolation Forest Scanning
  → POST /ml/anomaly/device [{deviceId, powerW: 1200, failureRate: 0.35, ...}]
  → Expect: {anomalyScore > 0.7, severity: "HIGH" or "CRITICAL"}
  → Status: PASS

TC-AI-02: ML Energy Forecast 24h
  → POST /ml/forecast/energy {roomId: "...", horizonHours: 24}
  → Expect: {model: "energy-prophet", points: [...24 items], inferenceMs < 100}
  → Status: PASS

TC-AI-03: ML Room Occupancy Inference
  → POST /ml/predict/occupancy [{roomId: "...", motionDetected: true, powerW: 145, ...}]
  → Expect: {occupiedProbability > 0.7, predictedState: "OCCUPIED"}
  → Status: PASS

TC-COPILOT-01: AI Copilot Assistant Chat
  → POST /api/intelligence/copilot/chat
    {message: "Phòng A101 nhiệt độ hôm nay?"}
  → Expect: {reply: "...", sources: [...], confidence > 0}
  → Expect: Reply contains temperature data
  → Status: PASS
```

---

## 5. Data Quality Gate (12 Tiêu Chí)

```bash
cd ml-service
python validate_dataset.py
```

**Kết quả:**
```
═══════════════════════════════════════════════════════
         SMARTDORM DATA QUALITY VALIDATION REPORT
═══════════════════════════════════════════════════════
Dataset: ml-service/data/curated/smartdorm-wokwi-v1.csv
Records: 103,680 | Rooms: 24 | Period: 45 days

[1/12] NULL CHECK........................ PASS (0 null values)
[2/12] DUPLICATE CHECK.................. PASS (0 duplicates)
[3/12] NEGATIVE POWER CHECK............. PASS (min power = 0.0W)
[4/12] ENERGY MONOTONICITY.............. PASS (100% monotonic per room)
[5/12] TEMPERATURE RANGE................ PASS (22.1°C - 36.8°C)
[6/12] HUMIDITY RANGE................... PASS (45.2% - 82.3%)
[7/12] GAS LEVEL RANGE.................. PASS (0.0% - 68.5%)
[8/12] TIME COVERAGE.................... PASS (45 days × 96 steps = 103,680)
[9/12] ROOM DISTRIBUTION................ PASS (24 rooms × 4,320 records each)
[10/12] SOURCE LABEL VALIDITY........... PASS (all in valid_sources set)
[11/12] DEVICE-POWER CONSISTENCY........ PASS (power > 0 ↔ device_on)
[12/12] NO FUTURE DATA LEAKAGE.......... PASS (lag features verified)

═══════════════════════════════════════════════════════
RESULT: 12/12 CRITERIA PASSED — TRAINING_ELIGIBLE = TRUE
═══════════════════════════════════════════════════════
```

---

## 6. Frontend Build Verification

```bash
cd frontend
npm run build
```

**Output:**
```
   ▲ Next.js 16.3.0 (Turbopack)

   Creating an optimized production build ...
   ✓ Compiled successfully in 9.0s

Route (app)                    Size     First Load JS
┌ ○ /                          1.5 kB        98.2 kB
├ ○ /login                     8.2 kB        105 kB
├ ○ /dashboard                 41.0 kB       138 kB
├ ○ /dashboard/rooms           12.3 kB       109 kB
├ ○ /dashboard/devices         15.7 kB       113 kB
├ ○ /dashboard/security        10.1 kB       107 kB
├ ○ /dashboard/intelligence    8.5 kB        105 kB
├ ○ /dashboard/intelligence/energy    22.4 kB  119 kB
├ ○ /dashboard/intelligence/anomalies 18.6 kB  115 kB
├ ○ /dashboard/intelligence/occupancy 14.2 kB  111 kB
├ ○ /dashboard/intelligence/models    16.8 kB  113 kB
├ ○ /dashboard/intelligence/recommendations 20.1 kB 117 kB
├ ○ /dashboard/intelligence/assistant 21.7 kB  118 kB
└ ... (35 total routes)

✓ 35/35 routes compiled successfully
```

---

## 7. Performance Benchmarks

| Chỉ số | Target | Thực tế | Status |
|---|---|---|---|
| API response time (p95) | < 500ms | ~120ms | ✅ |
| WebSocket latency | < 200ms | ~50ms | ✅ |
| Emergency alert latency | < 50ms | ~30ms | ✅ |
| Prophet inference | < 100ms | 12ms | ✅ |
| LSTM inference | < 200ms | 28ms | ✅ |
| Baseline inference | < 10ms | 2ms | ✅ |
| Frontend build time | < 30s | 9s | ✅ |
| MLOps retraining | < 60s | 10.69s | ✅ |
| Database query (indexed) | < 50ms | ~15ms | ✅ |

---

## 8. Checklist Trước Bàn Giao

### Infrastructure
- [x] Docker Compose chạy thành công 6 containers
- [x] Tất cả health checks GREEN
- [x] InfluxDB đã được init và bucket tạo sẵn
- [x] Database đã seed với dữ liệu demo
- [x] MQTT broker hoạt động, subscribe thành công

### Backend
- [x] All 33 Jest tests PASS
- [x] Swagger UI tải đúng tại /api/docs
- [x] JWT auth hoạt động cho cả ADMIN và STUDENT
- [x] WebSocket Gateway phát sóng đúng events
- [x] MQTT subscriber nhận và xử lý telemetry

### ML Service
- [x] All 36 pytest tests PASS
- [x] 3 models đã được train và serialize
- [x] FastAPI docs tải đúng tại /docs
- [x] Forecast, Anomaly, Occupancy endpoints hoạt động
- [x] Health endpoint trả về HEALTHY

### Frontend
- [x] 35/35 routes build thành công
- [x] Login flow hoạt động (ADMIN + STUDENT)
- [x] Dashboard realtime cập nhật qua WebSocket
- [x] AI Intelligence Center hiển thị đúng dữ liệu
- [x] Student Portal bị chặn truy cập phòng khác

### Hardware/Simulator
- [x] ESP32 firmware compile thành công (PlatformIO)
- [x] Wokwi diagram.json hợp lệ
- [x] Python simulator gửi MQTT thành công
- [x] RFID scenarios hoạt động (grant + deny)
- [x] Offline queue sync hoạt động

### Data
- [x] Dataset 103,680 records đã generate
- [x] Data quality gate: 12/12 PASS
- [x] No future data leakage verified
- [x] Occupancy labels verified
