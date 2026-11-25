# 🤖 AI/ML Service — Machine Learning Pipeline
## Tài Liệu 05 — ML Layer

---

## 1. Tổng Quan

ML Service là **microservice Python** độc lập, cung cấp 3 năng lực AI cốt lõi:

1. **Energy Forecasting**: Dự báo tiêu thụ điện năng 24h–168h bằng mô hình độc tôn **Champion Gradient Boosting (GBM)**
2. **Device Anomaly Detection**: Phát hiện thiết bị hoạt động bất thường (Isolation Forest)
3. **Room Occupancy Inference**: Suy luận có người trong phòng hay không (Rule-Proxy & XGBoost Classifier)

**Technology Stack:**
- **Framework:** FastAPI (Python 3.11+)
- **Models:** Scikit-learn Champion GradientBoostingRegressor, Isolation Forest
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
│   │   ├── forecast.py      # Energy forecasting endpoints (Champion GBM)
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
│   ├── gbm_forecaster.py    # Champion Gradient Boosting Regressor (Huber Loss)
│   └── comparison.py        # Model registry & performance evaluation
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
│   ├── train_forecast.py    # Script huấn luyện Champion GBM
│   ├── train_anomaly.py     # Script huấn luyện Isolation Forest
│   ├── train_occupancy.py   # Script huấn luyện occupancy model
│   └── retraining_job.py    # MLOps pipeline tái huấn luyện tự động
│
├── evaluation/              # Evaluation scripts
├── data/
│   ├── curated/
│   │   └── smartdorm-wokwi-v1.csv  # Dataset 103,680 records (được bảo vệ nguyên vẹn)
│   └── scenarios/
│       └── scenario_engine.py      # Bộ sinh kịch bản KTX
│
├── models/                  # Serialized model artifacts (.joblib, .json)
│   ├── energy_gbm_model.joblib
│   ├── forecast_comparison.json
│   └── retraining_summary.json
│
├── generate_dataset.py      # Script tạo dataset
├── validate_dataset.py      # Data quality gate 12 tiêu chí
└── requirements.txt
```

### 2.1 Kiến Trúc Tầng Đọc Dữ Liệu (Data Readers & Dual-Database Support)

ML Service áp dụng mô hình **Pluggable Data Readers** để đảm bảo khả năng tương thích cao trên cả môi trường Dev lẫn Production:

1. **`InfluxReader` (Tầng Chuỗi Thời Gian - Realtime Telemetry):**
   - Đọc dữ liệu cảm biến đo đạc trực tiếp từ InfluxDB 2.7 (bucket `smart-dormitory-raw`).
   - Tích hợp cơ chế tự động Fallback/Mock an toàn khi chưa khởi động InfluxDB (giúp service chạy mượt mà ngay cả khi không có Docker).
2. **`RelationalDataReader` (Tầng Cơ Sở Dữ Liệu Quan Hệ & Feature Store):**
   - **Môi trường Dev / Demo / Edge:** Sử dụng `SqliteReader` đọc trực tiếp file SQLite `backend/prisma/dev.db`, khởi chạy 1-click tức thì.
   - **Môi trường Production:** Đọc từ PostgreSQL thông qua cấu hình `DATABASE_URL` (`postgresql://...`), chia sẻ cùng cấu trúc bảng và migrations của Prisma ORM.
   - **Giải pháp Retraining dài hạn (45 - 90 ngày):** Truy vấn bảng `SensorData` trong CSDL quan hệ (được bảo lưu 180 ngày), giải quyết triệt để bài toán thiếu dữ liệu huấn luyện khi InfluxDB raw bucket chỉ giữ 30 ngày.

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
  "influxdb": "connected (or mock-fallback)",
  "database": "available (SQLite dev.db / PostgreSQL)",
  "models": {
    "energy_forecast": "ACTIVE (Champion GBM)",
    "anomaly_detection": "ACTIVE (Isolation Forest)",
    "occupancy": "ACTIVE (Rule-Proxy)"
  },
  "uptime_seconds": 3600
}
```

---

### 3.2 Energy Forecast (Dự Báo Năng Lượng Champion GBM)

```http
POST /ml/forecast/energy
```

**Request:**
```json
{
  "roomId": "clxxx...",
  "buildingId": "clyyyy...",
  "horizonHours": 24,
  "model": "gbm"
}
```

**Response:**
```json
{
  "model": "energy-gbm-v2.0",
  "status": "CHAMPION",
  "horizonHours": 24,
  "generatedAt": "2026-08-26T19:30:00Z",
  "points": [
    {
      "timestamp": "2026-08-26T20:00:00Z",
      "powerW": 145.3,
      "powerWLower": 130.8,
      "powerWUpper": 159.8,
      "energyKwh": 0.145
    }
  ],
  "summary": {
    "totalEnergyKwh": 3.48,
    "peakPowerW": 312.5,
    "peakTime": "2026-08-26T21:00:00Z",
    "avgPowerW": 145.0,
    "inferenceMs": 8
  }
}
```

---

### 3.3 Model Performance Matrix

```http
POST /ml/forecast/compare
```

**Response:**
```json
{
  "comparison": [
    {
      "model": "energy-gbm-forecaster",
      "status": "CHAMPION",
      "mae": 8.28,
      "rmse": 12.50,
      "mape": 4.69,
      "r2": 0.9607,
      "inferenceMs": 8
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

## 4. Mô Hình Dự Báo Năng Lượng Độc Tôn: Gradient Boosting (GBM) Champion

### 4.1 Kiến Trúc & Lý Do Tinh Gọn

Hệ thống đã **loại bỏ hoàn toàn các mô hình rườm rà trước đây (Prophet, PyTorch LSTM, Baseline)** để đơn giản hóa kiến trúc, chỉ giữ lại duy nhất **Gradient Boosting Machine (GBM)** làm mô hình Champion chính thức:

1. **Hiệu năng xuất sắc vượt trội:** Đạt hệ số xác định **R² = 0.9607** (giải thích 96.1% biến thiên thực tế) và sai số tuyệt đối **MAE chỉ 8.28 kW** (MAPE 4.69%).
2. **Suy luận siêu tốc (< 10ms):** Thời gian suy luận trung bình chỉ **8 ms trên CPU thông thường**, không đòi hỏi GPU đắt đỏ, sẵn sàng đáp ứng tần suất inference thời gian thực cho hàng trăm phòng KTX.
3. **Kháng nhiễu ngoại lai bằng Huber Loss:** Sử dụng hàm tổn thất Huber Loss ($\alpha = 0.9$) giúp mô hình không bị lệch khi xuất hiện các cú sốc điện đột ngột hoặc nhiễu đọc cảm biến.
4. **Không phụ thuộc thư viện nặng:** Không cần PyTorch hay Prophet, giảm 85% dung lượng container và loại bỏ nguy cơ xung đột phiên bản C++/CUDA.

### 4.2 13 Đặc Trưng Đầu Vào (Feature Engineering)

Mô hình huấn luyện trên 13 đặc trưng vi khí hậu và thiết bị trích xuất từ tập dữ liệu chuẩn hóa `smartdorm-wokwi-v1.csv`:

| # | Đặc trưng (Feature) | Tên tiếng Việt | Nhóm | Trọng số (Importance) |
|---|---|---|---|---|
| 1 | `sin_hour` | Chu kỳ giờ trong ngày (Sin) | TIME | 24.5% |
| 2 | `cos_hour` | Chu kỳ giờ trong ngày (Cos) | TIME | 18.2% |
| 3 | `light_on` | Trạng thái Rơ-le Đèn | DEVICE | 15.4% |
| 4 | `fan_on` | Trạng thái Rơ-le Quạt | DEVICE | 12.8% |
| 5 | `temperature_norm` | Nhiệt độ chuẩn hóa DHT22 | SENSOR | 9.5% |
| 6 | `occupancy_signal` | Tín hiệu hiện diện sinh viên | SENSOR | 7.2% |
| 7 | `is_weekend` | Ngày cuối tuần | TIME | 4.5% |
| 8 | `is_class_time` | Khung giờ học tập trên giảng đường | TIME | 3.8% |
| 9 | `sin_dow` | Chu kỳ thứ trong tuần (Sin) | TIME | 1.5% |
| 10 | `cos_dow` | Chu kỳ thứ trong tuần (Cos) | TIME | 1.1% |
| 11 | `humidity_norm` | Độ ẩm chuẩn hóa DHT22 | SENSOR | 0.8% |
| 12 | `gas_level_norm` | Nồng độ khí gas MQ-2 chuẩn hóa | SENSOR | 0.4% |
| 13 | `is_night` | Khung giờ ban đêm (23:00 - 06:00) | TIME | 0.3% |

### 4.3 Cấu Hình Siêu Tham Số Huấn Luyện

```python
from sklearn.ensemble import GradientBoostingRegressor

model = GradientBoostingRegressor(
    n_estimators=200,       # 200 cây quyết định
    learning_rate=0.05,     # Tốc độ học tối ưu
    max_depth=4,            # Độ sâu cây kiểm soát overfitting
    loss='huber',           # Huber loss kháng outliers
    alpha=0.9,
    min_samples_split=5,
    min_samples_leaf=3,
    random_state=42
)
model.fit(X_train, y_train)
```

**Kết quả đánh giá trên tập Test độc lập (15% Chronological Holdout):**
| Chỉ số | Giá trị | Đánh giá |
|---|---|---|
| **MAE** | **8.28 kW** | Rất chuẩn xác, bám sát đường cong thực tế |
| **RMSE** | **12.50 kW** | Biên độ lệch cực đại được kiểm soát tốt |
| **MAPE** | **4.69%** | Độ chuẩn xác đạt 95.31% |
| **R² Score** | **0.9607** | Giải thích 96.1% biến thiên phụ tải |
| **Độ trễ (Latency)** | **8 ms** | Siêu tốc trên CPU |

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
