# SmartDorm ML Service (Microservice)

High-performance Python FastAPI Microservice providing Machine Learning inference, forecasting, anomaly detection, and occupancy intelligence for the SmartDorm platform.

## Architecture
- **Framework**: FastAPI (Asynchronous REST API)
- **Port**: 8000
- **Primary Data Store**: InfluxDB 2.7 (Port 8086)
- **Forecasting**: Gradient Boosting Machine (GBM Champion Forecaster - R²=0.96, <10ms inference)
- **Device Anomaly**: scikit-learn `IsolationForest`
- **Occupancy Prediction**: Multi-signal Proxy Classifier (RFID events + wattage + time-of-day)

## API Endpoints
- `POST /ml/forecast/energy`: 24-hour energy forecasting with prediction bounds
- `POST /ml/anomaly/device`: Device behavior anomaly scoring (0.0 - 1.0) with evidence
- `POST /ml/predict/occupancy`: Room occupancy state and probability
- `GET /ml/model-status`: Status, metadata, and evaluation metrics of all registered models
- `GET /ml/health`: Health status of service and data connectors

## Running Locally

### 1. Create Virtual Environment
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Service
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Run Unit Tests
```bash
pytest tests/ -v
```
