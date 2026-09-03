# 📊 Dữ Liệu & ML Pipeline
## Tài Liệu 09 — Data & Machine Learning Pipeline

---

## 1. Tổng Quan Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML DATA PIPELINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ESP32 / Wokwi]    [Python Simulator]                         │
│        │                   │                                   │
│        └──────────┬─────────┘                                  │
│                   │ MQTT                                       │
│                   ▼                                            │
│         [NestJS MQTT Service]                                  │
│                   │                                            │
│         ┌─────────┴─────────┐                                  │
│         │                   │                                  │
│         ▼                   ▼                                  │
│    [SQLite/PG]          [InfluxDB]                             │
│  (structured data)   (time-series)                             │
│         │                   │                                  │
│         └─────────┬─────────┘                                  │
│                   │                                            │
│         [ML Service — Data Readers]                            │
│                   │                                            │
│         [generate_dataset.py]                                  │
│                   │                                            │
│         [validate_dataset.py]  ← 12 Quality Gates             │
│                   │                                            │
│         [feature_engineering.py] ← No-Leakage                 │
│                   │                                            │
│    ┌──────┬────────┴──────────┐                                │
│    │      │                   │                                │
│    ▼      ▼                   ▼                                │
│  Baseline Prophet           LSTM                               │
│    │      │                   │                                │
│    └──────┴────────┬──────────┘                                │
│                    │                                           │
│          [comparison.py — Benchmark]                           │
│                    │                                           │
│          [Auto-Promote Champion]                               │
│                    │                                           │
│          [FastAPI Inference API]                               │
│                    │                                           │
│          [NestJS → Dashboard]                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Dataset Chi Tiết

### 2.1 Thông Tin Dataset

**File:** `ml-service/data/curated/smartdorm-wokwi-v1.csv`

| Thuộc Tính | Giá Trị |
|---|---|
| Tổng records | 103,680 |
| Số phòng | 24 phòng (Tòa A: 12, Tòa B: 12) |
| Số tầng | 3 (Tầng 1-3) |
| Thời gian | 45 ngày liên tục |
| Tần suất | 15 phút/record (96 records/phòng/ngày) |
| Kích thước file | 12.8 MB |
| Random Seed | 42 (tái hiện được) |
| Chứng nhận | TRAINING_ELIGIBLE = TRUE |

### 2.2 Cấu Trúc Cột

```csv
timestamp,room_id,building_name,floor,room_number,
temperature,humidity,gas_level,power_w,energy_kwh,
light_on,fan_on,door_locked,motion_detected,
scenario_id,day_type,hour_of_day,is_weekend,
occupancy_label,occupancy_label_type,
data_source,simulation_run_id
```

**Mô tả từng cột:**

| Cột | Kiểu | Đơn vị | Mô tả |
|---|---|---|---|
| timestamp | datetime | UTC | Thời điểm đo (UTC) |
| room_id | string | — | ID phòng (e.g., "A101") |
| building_name | string | — | "Tòa A" | "Tòa B" |
| floor | int | — | 1, 2, 3 |
| room_number | string | — | "101", "102", ... |
| temperature | float | °C | Nhiệt độ không khí |
| humidity | float | % | Độ ẩm tương đối |
| gas_level | float | % | Nồng độ khí gas (MQ-2) |
| power_w | float | Watts | Công suất tiêu thụ tức thời |
| energy_kwh | float | kWh | Điện năng tích lũy (đơn điệu tăng) |
| light_on | bool | — | Đèn bật hay tắt |
| fan_on | bool | — | Quạt bật hay tắt |
| door_locked | bool | — | Cửa khóa hay mở |
| motion_detected | bool | — | Phát hiện chuyển động |
| scenario_id | string | — | Kịch bản: "NORMAL_WEEKDAY", "WEEKEND", ... |
| day_type | string | — | "WEEKDAY" | "WEEKEND" |
| hour_of_day | int | 0-23 | Giờ trong ngày |
| is_weekend | bool | — | Cuối tuần hay không |
| occupancy_label | string | — | "OCCUPIED" | "VACANT" |
| occupancy_label_type | string | — | "SIMULATED_GROUND_TRUTH" |
| data_source | string | — | "WOKWI" | "SIMULATOR" |

### 2.3 Phân Bố Kịch Bản

```
Kịch bản sinh hoạt theo giờ (ScenarioEngine):

Giờ 00:00 - 06:00 → SLEEP
  - Tất cả thiết bị TẮT (trừ trường hợp quên)
  - Phòng: VACANT (nếu ngủ đêm) hoặc OCCUPIED (đang ngủ)
  - Power: ~5W (standby)

Giờ 06:00 - 07:30 → WAKEUP
  - Đèn BẬT, Quạt tùy thời tiết
  - OCCUPIED
  - Power: ~80-120W

Giờ 07:30 - 11:30 → CLASS_MORNING
  - Tất cả thiết bị TẮT
  - VACANT
  - Power: ~5W

Giờ 11:30 - 13:00 → LUNCH_BREAK
  - Đèn BẬT
  - OCCUPIED
  - Power: ~60-100W

Giờ 13:00 - 17:00 → CLASS_AFTERNOON
  - VACANT
  - Power: ~5W (trừ quên tắt thiết bị)

Giờ 17:00 - 23:30 → EVENING_ACTIVITY
  - Đèn + Quạt BẬT
  - OCCUPIED
  - Power: ~120-300W (cao điểm 19:00-21:00)

Kịch bản đặc biệt:
  - FORGOT_DEVICE (8 ca): Quên tắt đèn/quạt khi đi học
  - OVERLOAD (5 ca): Quá tải điện (nhiều thiết bị cùng lúc)
  - GAS_LEAK_SAFE (3 ca): Rò rỉ gas nhẹ (<70%, dưới ngưỡng báo động)
```

### 2.4 Phân Phối Thống Kê

```
Nhiệt độ:
  Min: 22.1°C | Max: 36.8°C | Mean: 28.3°C | Std: 2.1°C

Độ ẩm:
  Min: 45.2% | Max: 82.3% | Mean: 64.5% | Std: 8.2%

Gas Level:
  Min: 0.0% | Max: 68.5% | Mean: 8.2% | Std: 12.3%
  (Không có record nào > 70% — đây là kịch bản an toàn)

Power (W):
  Min: 0.0W | Max: 1,250W | Mean: 95.3W | Std: 112.4W
  (0W khi phòng trống, peak khi quá tải)

Occupancy:
  OCCUPIED: 61,234 records (59.1%)
  VACANT:   42,446 records (40.9%)
```

---

## 3. Scenario Engine

**File:** `ml-service/data/scenarios/scenario_engine.py`

```python
class SmartDormScenarioEngine:
    """
    Bộ sinh kịch bản thực tế cho ký túc xá
    Mô phỏng lịch sinh hoạt chi tiết của sinh viên
    """
    
    def generate_room_schedule(self, room_id, date):
        # Xác định loại ngày
        day_type = "WEEKEND" if date.weekday() >= 5 else "WEEKDAY"
        
        # Sinh kịch bản ngẫu nhiên (có seed)
        scenario = self.random.choice([
            "NORMAL",           # Sinh viên học bình thường
            "FORGOT_DEVICE",    # Quên tắt thiết bị khi đi học
            "STAY_HOME",        # Không đi học (ốm/nghỉ)
            "LATE_NIGHT",       # Thức khuya học thi
        ], p=[0.7, 0.1, 0.1, 0.1])
        
        return self.apply_scenario(scenario, day_type)
    
    def generate_power_consumption(self, hour, devices_on):
        # Tính công suất dựa trên thiết bị đang bật
        base_power = 5.0  # Standby
        if devices_on['light']:  base_power += 40.0   # 3 LED
        if devices_on['fan']:    base_power += 35.0   # Quạt
        if devices_on['ac']:     base_power += 900.0  # Điều hòa
        
        # Thêm nhiễu thực tế
        noise = self.random.normal(0, base_power * 0.05)
        return max(0, base_power + noise)
```

---

## 4. Feature Engineering

**File:** `ml-service/preprocessing/feature_engineering.py`

### 4.1 Lag Features (Đặc Trưng Trễ)

```python
def build_time_series_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    XÂY DỰNG ĐẶC TRƯNG TRỄ — TUYỆT ĐỐI KHÔNG RÒ RỈ TƯƠNG LAI
    
    Chỉ sử dụng dữ liệu quá khứ để dự báo tương lai.
    """
    # Lag features (giá trị tại thời điểm quá khứ cụ thể)
    df['power_lag_1h']    = df['power_w'].shift(1)   # 1 giờ trước
    df['power_lag_2h']    = df['power_w'].shift(2)   # 2 giờ trước
    df['power_lag_3h']    = df['power_w'].shift(3)   # 3 giờ trước
    df['power_lag_24h']   = df['power_w'].shift(24)  # Hôm qua cùng giờ
    df['power_lag_168h']  = df['power_w'].shift(168) # Tuần trước cùng giờ
    
    # Rolling statistics — PHẢI dùng closed='left' (không bao gồm thời điểm hiện tại)
    df['power_roll_3h_mean']  = df['power_w'].rolling(3, closed='left').mean()
    df['power_roll_6h_mean']  = df['power_w'].rolling(6, closed='left').mean()
    df['power_roll_24h_mean'] = df['power_w'].rolling(24, closed='left').mean()
    df['power_roll_7d_mean']  = df['power_w'].rolling(168, closed='left').mean()
    df['power_roll_24h_std']  = df['power_w'].rolling(24, closed='left').std()
    
    # Time-based features (không rò rỉ)
    df['hour']             = df['timestamp'].dt.hour
    df['day_of_week']      = df['timestamp'].dt.dayofweek
    df['is_weekend']       = df['day_of_week'].isin([5, 6]).astype(int)
    df['hour_sin']         = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos']         = np.cos(2 * np.pi * df['hour'] / 24)
    df['dow_sin']          = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['dow_cos']          = np.cos(2 * np.pi * df['day_of_week'] / 7)
    
    # Loại bỏ rows đầu (có NaN do shift)
    df = df.dropna()
    return df
```

### 4.2 Anomaly Features (Đặc Trưng Bất Thường)

```python
def build_anomaly_features(device_readings: List[dict]) -> np.ndarray:
    """
    Vector đặc trưng 4 chiều cho Isolation Forest
    """
    features = []
    for d in device_readings:
        features.append([
            d['power_w'],          # Công suất (W) — quá cao = bất thường
            d['response_ms'],      # Độ trễ phản hồi (ms) — quá cao = lỗi mạng
            d['failure_rate'],     # Tỷ lệ lỗi (0-1) — > 0.2 là bất thường
            d['uptime_hours'],     # Số giờ chạy liên tục — > 168h đáng ngờ
        ])
    return np.array(features)
```

---

## 5. Chronological Split

```
Dataset: 45 ngày × 24 giờ = 1,080 khoảng giờ

Phân chia theo TRẬt TỰ THỜI GIAN (không shuffle):

┌──────────────────────────────────────────────────────┐
│ TRAIN (70%)                                          │
│ 756 giờ = 31.5 ngày                                  │
│ 2026-06-17 00:00 → 2026-07-18 23:00                 │
├──────────────────────────────────────────────────────┤
│ VALIDATION (15%)                                     │
│ 162 giờ = 6.75 ngày                                  │
│ 2026-07-19 00:00 → 2026-07-24 23:00                 │
├──────────────────────────────────────────────────────┤
│ TEST (15%)                                           │
│ 162 giờ = 6.75 ngày                                  │
│ 2026-07-25 00:00 → 2026-07-31 23:00                 │
└──────────────────────────────────────────────────────┘

QUY TẮC VÀNG:
  - Train chỉ nhìn dữ liệu TRƯỚC Validation
  - Validation chỉ nhìn dữ liệu TRƯỚC Test
  - Test hoàn toàn bị giữ kín cho đến đánh giá cuối
  - TUYỆT ĐỐI không random shuffle
```

---

## 6. Benchmark 3 Models

### 6.1 Kết Quả Đánh Giá

| Model | MAE (W) | RMSE (W) | MAPE (%) | R² | Inference (ms) | Status |
|---|---|---|---|---|---|---|
| **Diurnal Baseline** | 28.80 | 37.16 | 20.97 | 0.6526 | 2ms | FALLBACK |
| **Facebook Prophet** | **28.73** | 37.21 | **20.91** | **0.6517** | **12ms** | **CHAMPION** |
| **PyTorch LSTM** | **28.43** | 37.23 | **20.42** | 0.6512 | 28ms | CHALLENGER |

### 6.2 Phân Tích Lý Do Chọn Prophet Là Champion

```
Tại sao Prophet thắng dù MAE và MAPE cao hơn LSTM nhẹ?

1. DẢI TIN CẬY BAYESIAN:
   → Prophet cung cấp yhat_lower/yhat_upper (95% CI)
   → Có thể cảnh báo sớm khi biên trên vượt ngưỡng an toàn
   → LSTM không có khả năng này theo cách tự nhiên

2. DỰ BÁO XA 168H:
   → Prophet phân rã xu hướng dài hạn + chu kỳ tuần
   → Baseline chỉ tra cứu 24h lịch sử (không học được pattern)
   → LSTM suy giảm độ chính xác khi horizon > 48h

3. TƯỜNG MINH & GIẢI THÍCH ĐƯỢC:
   → Prophet cho phép inspect trend + seasonality riêng biệt
   → Copilot AI có thể giải thích "tại sao" dự báo tăng/giảm
   → LSTM là hộp đen — khó giải thích cho quản lý KTX

4. TỐC ĐỘ OPTIMAL:
   → 12ms inference (gấp 2.3x nhanh hơn LSTM 28ms)
   → Đủ nhanh cho realtime dashboard cập nhật mỗi 15 phút

Kết luận: Đây là đánh đổi Interpretability + Uncertainty vs Accuracy
Prophet win vì phù hợp với bài toán domain (năng lượng + đề xuất cho người dùng)
```

### 6.3 Phân Tích Isolation Forest Recall Thấp

```
Recall = 13.12% — Tại Sao Chấp Nhận?

1. ĐÁnh ĐổI CHỦ ĐÍCH:
   FPR = 3.10% < ngưỡng 5%
   → 24 phòng × 5 thiết bị = 120 thiết bị
   → 3.1% FPR = ~4 cảnh báo nhầm/ngày
   → Chấp nhận được — không gây Alarm Fatigue

2. TẬP TRUNG BẮT LỖI NẶNG:
   Precision = 54.41%
   → Khi hệ thống báo bất thường → đúng hơn nửa số lần
   → Ưu tiên bắt quá tải dòng lớn, thiết bị kẹt bật > 48h

3. PHÒNG THỦ CHIỀU SÂU:
   Emergency (cháy/gas) = Rule Engine tất định 100%
   → Không phụ thuộc Isolation Forest
   → Isolation Forest là "lớp cảnh báo sớm" bổ sung

Kết luận: Recall 13.12% là hợp lý trong bài toán IoT này.
```

---

## 7. Occupancy Model

**File:** `ml-service/training/train_occupancy.py`

### 7.1 Phương Pháp

Sử dụng **Rule-Proxy Classifier** thay vì ML thuần túy:

```python
def predict_room_occupancy(room_input: RoomOccupancyInput) -> OccupancyResult:
    """
    Kết hợp đa tín hiệu để suy luận lưu trú:
    
    Signal 1: Motion (PIR)
      - motion_detected = True → +0.5 probability
    
    Signal 2: Power (Điện)
      - power_w > 50W → +0.3 probability
    
    Signal 3: RFID (Ra vào)
      - rfid_entries_last_1h > 0 → +0.15 probability
    
    Signal 4: Time Prior (Thời gian)
      - 18:00-23:00 (peak hour) → +0.05 probability
      - 08:00-17:00 (class hour) → -0.1 probability
    
    Threshold: prob > 0.5 → OCCUPIED
    """
```

### 7.2 Kết Quả Đánh Giá (20,736 test samples)

| Chỉ số | Giá trị |
|---|---|
| Accuracy | **99.97%** |
| Precision | **99.99%** |
| Recall | **99.97%** |
| F1 Score | **0.9998** |

> Độ chính xác cao do sử dụng ground truth labels từ ScenarioEngine (SIMULATED_GROUND_TRUTH). Trên dữ liệu thực tế sẽ thấp hơn do nhiễu cảm biến thực.

---

## 8. MLOps Workflow

### 8.1 Trigger Tái Huấn Luyện

```
Trigger tự động:
  1. Drift Detection: PSI > 0.25 trên window 7 ngày gần nhất
  2. Scheduled: Mỗi 30 ngày (cron job)
  3. Data Volume: Khi > 10,000 records mới được thu thập

Trigger thủ công:
  1. Admin nhấn "Trigger Retraining" trên dashboard MLOps
  2. POST /api/intelligence/retraining/trigger
```

### 8.2 Retraining Job Pipeline

```python
# ml-service/training/retraining_job.py

def run_full_retraining():
    # 1. Load fresh data
    df = load_training_data(source="influxdb", days=45)
    
    # 2. Quality gate
    assert validate_dataset(df) == "PASS"
    
    # 3. Feature engineering
    df_features = build_time_series_lag_features(df)
    
    # 4. Train all 3 models in parallel
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(train_baseline, df_features): "baseline",
            executor.submit(train_prophet, df_features): "prophet",
            executor.submit(train_lstm, df_features): "lstm",
        }
    
    # 5. Evaluate and compare
    results = evaluate_all_models(test_set)
    
    # 6. Auto-promote best
    best = min(results, key=lambda r: r['mae'])
    if best['mae'] < current_champion_mae * 0.95:  # 5% improvement threshold
        promote_model(best['model_name'])
    
    # 7. Save summary
    save_retraining_summary(results, "models/retraining_summary.json")
    
    # Runtime: ~10.69 seconds
```

### 8.3 Model Registry

**File:** `ml-service/models/retraining_summary.json`

```json
{
  "retrained_at": "2026-08-26T19:30:00Z",
  "duration_seconds": 10.69,
  "models": {
    "energy-baseline": {
      "status": "FALLBACK",
      "mae": 28.80,
      "version": "v1.0"
    },
    "energy-prophet": {
      "status": "CHAMPION",
      "mae": 28.73,
      "version": "v2.2",
      "artifact": "models/prophet_v2.2.joblib"
    },
    "energy-lstm": {
      "status": "CHALLENGER",
      "mae": 28.43,
      "version": "v1.2",
      "artifact": "models/lstm_v1.2.pt"
    }
  }
}
```

---

## 9. Telemetry Schema (Hợp Đồng Dữ Liệu)

**File:** `ml-service/app/schemas/telemetry.py`

Sử dụng Pydantic v2 với `AliasChoices` để hỗ trợ cả `camelCase` và `snake_case`:

```python
class NormalizedTelemetry(BaseModel):
    # Hỗ trợ cả hai format
    room_id: str = Field(alias=AliasChoices("roomId", "room_id"))
    temperature: float
    humidity: float
    gas_level: float = Field(alias=AliasChoices("gasLevel", "gas_level"))
    power_w: float = Field(alias=AliasChoices("powerW", "power_w"))
    energy_kwh: float = Field(alias=AliasChoices("energyKwh", "energy_kwh"))
    
    # Data source tracking
    source: str = "SIMULATION_DATA"  # "SIMULATION_DATA" | "WOKWI" | "REAL_DEVICE"
    simulation_run_id: Optional[str] = None
    dataset_eligible: bool = True
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

**Lý do cần chuẩn hóa:**
- ESP32 gửi `snake_case`: `gas_level`, `temp_alert`
- Dashboard API dùng `camelCase`: `gasLevel`, `tempAlert`
- ML Service cần hỗ trợ cả 2 định dạng liền mạch
