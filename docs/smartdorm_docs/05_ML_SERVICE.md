# 🤖 AI/ML Service — Machine Learning Pipeline
## Tài Liệu 05 — ML Layer

---

## 1. Tổng Quan

ML Service là **microservice Python** độc lập, cung cấp 3 năng lực AI cốt lõi:

1. **Energy Forecasting**: Dự báo tiêu thụ điện năng 24h–168h
2. **Device Anomaly Detection**: Phát hiện thiết bị hoạt động bất thường
3. **Room Occupancy Inference**: Suy luận có người trong phòng hay không

**Technology Stack:**
- **Framework:** FastAPI (Python 3.11+)
- **Models:** Facebook Prophet, PyTorch MLP/LSTM, Scikit-learn
- **Port:** `8000`
- **Swagger Docs:** `http://localhost:8000/docs`

---

## 2. Cấu Trúc Dự Án ML Service

```
ml-service/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings (env vars)
│   ├── api/
│   │   ├── forecast.py      # Energy forecasting endpoints
│   │   ├── anomaly.py       # Anomaly detection endpoints
│   │   ├── occupancy.py     # Occupancy prediction endpoints
│   │   └── health.py        # Health check endpoints
│   ├── schemas/
│   │   ├── forecast.py      # Pydantic schemas dự báo
│   │   ├── anomaly.py       # Pydantic schemas bất thường
│   │   ├── occupancy.py     # Pydantic schemas lưu trú
│   │   └── telemetry.py     # Hợp đồng telemetry chuẩn hóa
│   └── services/
│       ├── influx_reader.py # Đọc dữ liệu từ InfluxDB
│       └── sqlite_reader.py # Đọc dữ liệu từ SQLite
│
├── forecasting/
│   ├── baseline.py          # Baseline model (Diurnal Cyclic)
│   ├── prophet_model.py     # Facebook Prophet model (Champion)
│   ├── lstm_model.py        # PyTorch MLP/LSTM model (Challenger)
│   └── comparison.py        # Multi-model comparison & auto-promotion
│
├── anomaly/
│   └── isolation_forest.py  # Isolation Forest detector
│
├── occupancy/
│   └── classifier.py        # Rule-proxy occupancy classifier
│
├── preprocessing/
│   └── feature_engineering.py  # Strict no-leakage feature pipeline
│
├── training/
│   ├── train_forecast.py    # Script huấn luyện 3 mô hình dự báo
│   ├── train_anomaly.py     # Script huấn luyện Isolation Forest
│   ├── train_occupancy.py   # Script huấn luyện occupancy model
│   └── retraining_job.py    # MLOps pipeline tái huấn luyện tự động
│
├── evaluation/              # Evaluation scripts
├── data/
│   ├── curated/
│   │   └── smartdorm-wokwi-v1.csv  # Dataset 103,680 records
│   └── scenarios/
│       └── scenario_engine.py      # Bộ sinh kịch bản KTX
│
├── models/                  # Serialized model artifacts (.joblib, .pkl)
│   └── retraining_summary.json
│
├── generate_dataset.py      # Script tạo dataset
├── validate_dataset.py      # Data quality gate 12 tiêu chí
└── requirements.txt
```

---

## 3. API Endpoints

### 3.1 Health Check

```http
GET /ml/health
```

**Response:**
```json
{
  "status": "healthy",
  "influxdb": "connected",
  "sqlite": "available",
  "models": {
    "energy_forecast": "ACTIVE",
    "anomaly_detection": "ACTIVE",
    "occupancy": "ACTIVE"
  },
  "uptime_seconds": 3600
}
```

---

### 3.2 Energy Forecast (Dự Báo Năng Lượng)

```http
POST /ml/forecast/energy
```

**Request:**
```json
{
  "roomId": "clxxx...",
  "buildingId": "clyyyy...",
  "horizonHours": 24,
  "model": "auto"
}
```

**Response:**
```json
{
  "model": "energy-prophet-v2.2",
  "status": "CHAMPION",
  "horizonHours": 24,
  "generatedAt": "2026-08-26T19:30:00Z",
  "points": [
    {
      "timestamp": "2026-08-26T20:00:00Z",
      "powerW": 145.3,
      "powerWLower": 98.2,
      "powerWUpper": 192.4,
      "energyKwh": 0.145
    },
    ...
  ],
  "summary": {
    "totalEnergyKwh": 3.48,
    "peakPowerW": 312.5,
    "peakTime": "2026-08-26T21:00:00Z",
    "avgPowerW": 145.0,
    "inferenceMs": 12
  }
}
```

**Các Models Có Sẵn:**
- `auto` — Tự động chọn model active (hiện là Prophet)
- `prophet` — Chỉ dùng Facebook Prophet
- `lstm` — Chỉ dùng LSTM Neural Network
- `baseline` — Chỉ dùng Diurnal Cyclic Baseline

---

### 3.3 Model Comparison (So Sánh 3 Models)

```http
POST /ml/forecast/compare
```

**Response:**
```json
{
  "comparison": [
    {
      "model": "energy-baseline",
      "status": "FALLBACK",
      "mae": 28.80,
      "rmse": 37.16,
      "mape": 20.97,
      "r2": 0.6526,
      "inferenceMs": 2
    },
    {
      "model": "energy-prophet",
      "status": "CHAMPION",
      "mae": 28.73,
      "rmse": 37.21,
      "mape": 20.91,
      "r2": 0.6517,
      "inferenceMs": 12
    },
    {
      "model": "energy-lstm",
      "status": "CHALLENGER",
      "mae": 28.43,
      "rmse": 37.23,
      "mape": 20.42,
      "r2": 0.6512,
      "inferenceMs": 28
    }
  ]
}
```

---

### 3.4 Device Anomaly Detection

```http
POST /ml/anomaly/device
```

**Request:**
```json
{
  "devices": [
    {
      "deviceId": "clzzz...",
      "deviceName": "Quạt thông gió A101",
      "roomId": "clxxx...",
      "powerW": 450.0,
      "responseMs": 2800,
      "failureRate": 0.23,
      "uptimeHours": 168.5,
      "isOn": true
    }
  ]
}
```

**Response:**
```json
{
  "totalEvaluated": 1,
  "anomalyCount": 1,
  "results": [
    {
      "deviceId": "clzzz...",
      "deviceName": "Quạt thông gió A101",
      "roomId": "clxxx...",
      "anomalyScore": 0.78,
      "severity": "HIGH",
      "isAnomaly": true,
      "recommendation": "Thiết bị có công suất cao bất thường (450W vs baseline 45W). Kiểm tra ngay.",
      "features": {
        "powerW": 450.0,
        "responseMs": 2800,
        "failureRate": 0.23,
        "uptimeHours": 168.5
      }
    }
  ]
}
```

**Phân Loại Severity:**
| Score | Severity | Hành động |
|---|---|---|
| < 0.3 | NORMAL | Không cần làm gì |
| 0.3 - 0.5 | WARNING | Theo dõi thêm |
| 0.5 - 0.75 | HIGH | Kiểm tra trong ngày |
| ≥ 0.75 | CRITICAL | Kiểm tra ngay lập tức |

---

### 3.5 Room Occupancy Prediction

```http
POST /ml/predict/occupancy
```

**Request:**
```json
{
  "rooms": [
    {
      "roomId": "clxxx...",
      "roomNumber": "101",
      "buildingName": "Tòa A",
      "floor": 1,
      "motionDetected": true,
      "powerW": 145.0,
      "activeDevicesCount": 3,
      "rfidEntriesLast1h": 2,
      "hour": 20,
      "dayOfWeek": 2
    }
  ]
}
```

**Response:**
```json
{
  "totalRooms": 1,
  "occupiedCount": 1,
  "vacantCount": 0,
  "results": [
    {
      "roomId": "clxxx...",
      "roomNumber": "101",
      "buildingName": "Tòa A",
      "occupiedProbability": 0.92,
      "predictedState": "OCCUPIED",
      "confidence": "HIGH",
      "signals": {
        "motionDetected": true,
        "powerSignal": "ACTIVE",
        "rfidSignal": "RECENT_ENTRY",
        "timeSignal": "EVENING_PEAK"
      }
    }
  ]
}
```

---

### 3.6 Model Promotion (MLOps)

```http
POST /ml/models/promote
Content-Type: application/json

{
  "modelName": "energy-lstm-forecaster"
}
```

**Response:**
```json
{
  "success": true,
  "promoted": "energy-lstm-forecaster",
  "previousActive": "energy-prophet",
  "message": "Model 'energy-lstm-forecaster' is now ACTIVE."
}
```

---

## 4. Ba Mô Hình Dự Báo Năng Lượng

### 4.1 Baseline — Diurnal Cyclic

**Nguyên lý:** Tra cứu giá trị trung bình theo giờ trong ngày từ lịch sử 7 ngày gần nhất.

```python
# Cơ chế đơn giản nhưng hiệu quả
def generate_baseline_forecast(request):
    # Tính average power theo hour-of-day
    hourly_avg = historical_data.groupby('hour')['power_w'].mean()
    
    # Chiếu sang 24h tiếp theo
    forecast = [hourly_avg[h % 24] for h in future_hours]
    return forecast
```

**Ưu điểm:** Cực nhanh (2ms), không cần training  
**Nhược điểm:** Không học được xu hướng dài hạn

### 4.2 Facebook Prophet — Champion Model

**Nguyên lý:** Mô hình phân rã chuỗi thời gian Bayesian:

```
y(t) = trend(t) + seasonality_weekly(t) + seasonality_daily(t) + holiday(t) + noise
```

**Đặc điểm nổi bật:**
- **Dự báo xa 168 giờ** (7 ngày) với độ chính xác cao
- **Dải tin cậy Bayesian** (`yhat_lower`, `yhat_upper`): Cảnh báo sớm quá tải
- **Tường minh**: Có thể giải thích xu hướng + chu kỳ cho người dùng
- **Tốc độ**: 12ms inference (nhanh gấp 2.3x LSTM)

```python
from prophet import Prophet

model = Prophet(
    changepoint_prior_scale=0.05,
    seasonality_prior_scale=10.0,
    yearly_seasonality=False,
    weekly_seasonality=True,
    daily_seasonality=True,
    interval_width=0.95,  # 95% confidence interval
)
model.add_seasonality(name='hourly', period=1/24, fourier_order=3)
model.fit(df)

future = model.make_future_dataframe(periods=24, freq='H')
forecast = model.predict(future)
```

**Kết quả đánh giá (test set 162h):**
| Chỉ số | Giá trị |
|---|---|
| MAE | 28.73 W |
| RMSE | 37.21 W |
| MAPE | 20.91% |
| R² | 0.6517 |
| Inference | 12ms |

### 4.3 PyTorch MLP/LSTM — Challenger

**Nguyên lý:** Mạng nơ-ron tự hồi quy (autoregressive) với 24-step lookback:

```python
class LSTMForecaster(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=8,       # Features: power + lag features + time features
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            dropout=0.2
        )
        self.fc = nn.Linear(64, 1)  # Output: power W
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        return self.fc(lstm_out[:, -1, :])
```

**Input features (8 chiều):**
- `power_w` (t-1, t-2, t-24)
- `hour_sin`, `hour_cos` (mã hóa vòng)
- `day_of_week_sin`, `day_of_week_cos`
- `is_weekend`

**Kết quả đánh giá:**
| Chỉ số | Giá trị |
|---|---|
| MAE | 28.43 W (thấp nhất) |
| RMSE | 37.23 W |
| MAPE | 20.42% (thấp nhất) |
| R² | 0.6512 |
| Inference | 28ms |

---

## 5. Isolation Forest — Phát Hiện Bất Thường

**File:** `ml-service/anomaly/isolation_forest.py`

**Nguyên lý:** Isolation Forest phát hiện outlier bằng cách xây dựng ngẫu nhiên các cây quyết định. Điểm dữ liệu bất thường sẽ bị cô lập sớm hơn trong cây.

### Training
```python
from sklearn.ensemble import IsolationForest

# Huấn luyện trên 103,398 vector bình thường
clf = IsolationForest(
    n_estimators=100,
    contamination=0.01,  # Ước tính 1% dữ liệu là bất thường
    random_state=42
)
clf.fit(X_normal)  # Features: [powerW, responseMs, failureRate, uptime]
```

### Kết Quả Đánh Giá
| Chỉ số | Giá trị | Ghi Chú |
|---|---|---|
| Accuracy | 78.47% | Trên test set 1,282 mẫu |
| Precision | 54.41% | Khi báo bất thường thì đúng ~54% |
| Recall | 13.12% | Bắt được 13% tổng số bất thường thật |
| FPR | 3.10% | Báo nhầm 3.1% — dưới ngưỡng 5% |

> **Lý do Recall thấp (có chủ đích):** Hệ thống ưu tiên **Precision cao** để tránh Alarm Fatigue (cảnh báo nhầm quá nhiều). Recall thấp được chấp nhận vì emergency (cháy/gas) có Rule Engine 100% tất định bảo vệ riêng.

---

## 6. Dataset & Feature Engineering

### Dataset: `smartdorm-wokwi-v1.csv`

| Thông số | Giá trị |
|---|---|
| Tổng records | 103,680 |
| Số phòng | 24 (Tòa A + B, Tầng 1-3) |
| Thời gian | 45 ngày (Seed = 42) |
| Tần suất | 15 phút/lần (96 bước/ngày) |
| Kích thước | 12.8 MB |

**Các cột dữ liệu:**
```
timestamp, room_id, building_name, floor,
temperature, humidity, gas_level,
power_w, energy_kwh,
light_on, fan_on, door_locked, motion_detected,
scenario_id, day_type, source
```

**Phân bố kịch bản:**
| Kịch bản | Số ngày/ca |
|---|---|
| Ngày học bình thường | 33 ngày |
| Cuối tuần | 12 ngày |
| Quên tắt thiết bị | 8 ca |
| Quá tải điện | 5 ca |
| Rò rỉ gas (an toàn) | 3 ca |

### Chronological Split (Train/Val/Test)

```
Tổng: 1,080 khoảng thời gian 1 giờ (45 ngày)

Train (70%): 756 giờ — 2026-06-17 đến 2026-07-18
   ↓
Validation (15%): 162 giờ — 2026-07-19 đến 2026-07-24
   ↓
Test (15%): 162 giờ — 2026-07-25 đến 2026-07-31

QUY TẮC: Tuyệt đối không random shuffle — phải giữ trật tự thời gian!
```

### Feature Engineering (Chống Rò Rỉ Tương Lai)

```python
# File: ml-service/preprocessing/feature_engineering.py

def build_time_series_lag_features(df):
    # Chỉ sử dụng độ trễ QUÁ KHỨ
    df['power_lag_1h']   = df['power_w'].shift(1)   # t-1 giờ
    df['power_lag_2h']   = df['power_w'].shift(2)   # t-2 giờ
    df['power_lag_24h']  = df['power_w'].shift(24)  # t-24 giờ (hôm qua giờ này)
    df['power_lag_168h'] = df['power_w'].shift(168) # t-168 giờ (tuần trước)
    
    # Rolling window — PHẢI dùng closed='left' để không rò rỉ tương lai!
    df['power_roll_24h_mean'] = df['power_w'].rolling(24, closed='left').mean()
    df['power_roll_7d_mean']  = df['power_w'].rolling(168, closed='left').mean()
    
    # Loại bỏ rows có NaN (do shift)
    df = df.dropna()
    return df
```

---

## 7. MLOps Pipeline

### Tái Huấn Luyện Tự Động

**File:** `ml-service/training/retraining_job.py`

```bash
# Chạy tái huấn luyện toàn bộ 3 bài toán
python -m ml-service.training.retraining_job

# Kết quả: hoàn thành trong ~10.69 giây
# Output: ml-service/models/retraining_summary.json
```

**Pipeline:**
```
1. Load dataset mới nhất từ InfluxDB + SQLite
2. Validate quality gate (12 tiêu chí)
3. Feature engineering (no-leakage)
4. Chronological split (70/15/15)
5. Train 3 forecasting models song song
6. Evaluate trên test set
7. Auto-promote best model nếu vượt threshold
8. Serialize artifacts (.joblib)
9. Lưu metrics vào retraining_summary.json
```

### Drift Detection

**File:** `ml-service/evaluation/drift_detector.py`

```python
# Phát hiện độ lệch phân phối dữ liệu
# PSI = Population Stability Index

if PSI > 0.25:
    raise DriftDetectedError("DRIFT_DETECTED — Cần tái huấn luyện ngay!")
elif PSI > 0.1:
    logger.warning("DRIFT_WARNING — Theo dõi thêm")
```

---

## 8. Chạy ML Service

### Development
```bash
cd ml-service
pip install -r requirements.txt

# Tạo dataset
python generate_dataset.py

# Validate dataset
python validate_dataset.py

# Huấn luyện models
python -m training.train_forecast
python -m training.train_anomaly
python -m training.train_occupancy

# Chạy server
uvicorn app.main:app --reload --port 8000
```

### Environment Variables
```env
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=smart-dormitory-super-secret-token-12345
INFLUXDB_ORG=smart-dormitory
INFLUXDB_BUCKET=smart-dormitory-raw
DATABASE_URL=sqlite:///backend/prisma/dev.db
ML_HOST=0.0.0.0
ML_PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 9. Data Quality Gate (12 Tiêu Chí)

**File:** `ml-service/validate_dataset.py`

| # | Tiêu Chí | Yêu Cầu | Kết Quả |
|---|---|---|---|
| 1 | Không có giá trị Null | 0 null values | ✅ PASS |
| 2 | Không có bản ghi trùng | 0 duplicates | ✅ PASS |
| 3 | Công suất không âm | power_w ≥ 0 | ✅ PASS |
| 4 | Điện năng đơn điệu tăng | energy_kwh ≥ previous | ✅ PASS |
| 5 | Nhiệt độ hợp lý | 15°C ≤ T ≤ 60°C | ✅ PASS |
| 6 | Độ ẩm hợp lý | 0% ≤ H ≤ 100% | ✅ PASS |
| 7 | Gas level hợp lý | 0% ≤ G ≤ 100% | ✅ PASS |
| 8 | Phủ thời gian đầy đủ | 45 ngày × 96 steps | ✅ PASS |
| 9 | Phân phối phòng đồng đều | 24 phòng × 4,320 records | ✅ PASS |
| 10 | Nhãn nguồn hợp lệ | source in valid_set | ✅ PASS |
| 11 | Tính nhất quán thiết bị | power > 0 ↔ device on | ✅ PASS |
| 12 | Không rò rỉ tương lai | lag features no leakage | ✅ PASS |

**Kết quả:** `TRAINING_ELIGIBLE = TRUE` (100% — 12/12 tiêu chí)
