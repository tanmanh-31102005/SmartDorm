"""
Comprehensive Automated AI/ML Test Suite.
Verifies test cases AI-001 through AI-010 for Energy Forecast, LSTM, Anomaly Detection,
Occupancy Classification, Multi-model Comparison, and Failover Resilience.
"""
import pytest
import math
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.forecast import ForecastRequest, RecentPoint
from app.schemas.anomaly import AnomalyRequest, DeviceTelemetryInput, DeviceInput
from app.schemas.occupancy import OccupancyRequest, RoomOccupancyInput
from forecasting.baseline import generate_baseline_forecast
from forecasting.prophet_model import generate_energy_forecast
from forecasting.lstm_model import generate_lstm_forecast
from forecasting.comparison import get_model_comparator
from anomaly.isolation_forest import detect_device_anomalies
from occupancy.classifier import predict_room_occupancy
from app.services.drift_detector import get_drift_detector

client = TestClient(app)


def test_ai_001_energy_forecast_api_works():
    """AI-001: Energy forecast API works and responds with 200 OK."""
    payload = {"roomId": "room-101", "horizonHours": 24, "interval": "1h"}
    res = client.post("/ml/forecast/energy", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "points" in data
    assert "summary" in data


def test_ai_002_prediction_returns_24_values():
    """AI-002: Prediction returns exactly 24 values for 24h horizon."""
    payload = {"roomId": "room-101", "horizonHours": 24, "interval": "1h"}
    res = client.post("/ml/forecast/energy", json=payload)
    data = res.json()
    assert len(data["points"]) == 24


def test_ai_003_prediction_contains_timestamp():
    """AI-003: Every forecast point contains valid ISO timestamp."""
    payload = {"roomId": "room-101", "horizonHours": 24}
    res = client.post("/ml/forecast/energy", json=payload)
    data = res.json()
    for point in data["points"]:
        assert "timestamp" in point
        assert isinstance(point["timestamp"], str)
        assert len(point["timestamp"]) > 10


def test_ai_004_no_nan_or_negative_output():
    """AI-004: Forecast values contain no NaN and no negative energy values."""
    payload = {"roomId": "room-101", "horizonHours": 24}
    res = client.post("/ml/forecast/energy", json=payload)
    data = res.json()
    for point in data["points"]:
        p_val = point.get("forecastPowerW") if "forecastPowerW" in point else point.get("forecast_power_w")
        lower_val = point.get("lowerBoundW") if "lowerBoundW" in point else point.get("lower_bound_w", 0)
        upper_val = point.get("upperBoundW") if "upperBoundW" in point else point.get("upper_bound_w", p_val)

        assert p_val is not None
        assert not math.isnan(p_val)
        assert p_val >= 0.0
        assert lower_val >= 0.0
        assert upper_val >= lower_val


def test_ai_005_anomaly_detection_recognizes_injected_anomaly():
    """AI-005: Isolation Forest anomaly detector recognizes an injected overloaded device."""
    req = AnomalyRequest(
        devices=[
            DeviceInput(
                id="dev-overload-fan",
                name="FAN-B204",
                type="FAN",
                roomId="room-204",
                powerW=135.0, # Normal is 50-70W -> injected overload
                responseMs=450.0,
                failureRate=0.18,
            ),
            DeviceInput(
                id="dev-normal-fan",
                name="FAN-A101",
                type="FAN",
                roomId="room-101",
                powerW=60.0, # Normal
                responseMs=35.0,
                failureRate=0.0,
            ),
        ]
    )
    res = detect_device_anomalies(req)
    anom_ids = [a.deviceId for a in res.anomalies if a.anomaly]
    assert "dev-overload-fan" in anom_ids
    assert res.totalEvaluated >= 2


def test_ai_006_occupancy_classifier_returns_probability_0_to_1():
    """AI-006: Occupancy classifier returns probability strictly within [0.0, 1.0]."""
    req = OccupancyRequest(
        rooms=[
            RoomOccupancyInput(
                id="room-101",
                roomNumber="101",
                buildingName="Tòa A",
                floor=1,
                motionDetected=True,
                powerW=85.0,
                activeDevicesCount=2,
            ),
            RoomOccupancyInput(
                id="room-102",
                roomNumber="102",
                buildingName="Tòa A",
                floor=1,
                motionDetected=False,
                powerW=2.0,
                activeDevicesCount=0,
            ),
        ]
    )
    res = predict_room_occupancy(req)
    assert len(res.rooms) == 2
    for r in res.rooms:
        assert 0.0 <= r.occupiedProbability <= 1.0
        assert r.predictedState in ["OCCUPIED", "VACANT"]
        assert 0.0 <= r.confidence <= 1.0

    # Room 101 with motion should have higher probability than empty Room 102
    assert res.rooms[0].occupiedProbability > res.rooms[1].occupiedProbability


def test_ai_007_lstm_neural_forecaster():
    """AI-007: LSTM neural forecaster executes and generates 24 predictions with uncertainty."""
    req = ForecastRequest(roomId="room-204", horizonHours=24, interval="1h")
    res = generate_lstm_forecast(req)
    assert res.source == "LSTM_NEURAL_NETWORK"
    assert len(res.points) == 24
    assert res.summary.totalForecastKwh > 0


def test_ai_008_multi_model_comparison_and_promotion():
    """AI-008: Multi-model comparison benchmarks Baseline vs Prophet vs LSTM side-by-side."""
    comparator = get_model_comparator()
    req = ForecastRequest(roomId="room-101", horizonHours=24)
    res = comparator.compare_on_request(req)

    assert "models" in res
    assert len(res["models"]) == 3
    model_types = [m["type"] for m in res["models"]]
    assert "BASELINE" in model_types
    assert "STATISTICAL_SEASONALITY" in model_types
    assert "DEEP_LEARNING" in model_types

    assert len(res["timeline"]) == 24
    assert "baselinePowerW" in res["timeline"][0]
    assert "prophetPowerW" in res["timeline"][0]
    assert "lstmPowerW" in res["timeline"][0]

    # Test promotion
    promo = comparator.promote_model("energy-lstm-forecaster")
    assert promo["success"] is True
    assert comparator.active_model_name == "energy-lstm-forecaster"

    # Reset back to Prophet
    comparator.promote_model("energy-prophet-forecaster")
    assert comparator.active_model_name == "energy-prophet-forecaster"


def test_ai_009_drift_detector_evaluates_model_health():
    """AI-009: Drift detector correctly evaluates model age and staleness thresholds."""
    detector = get_drift_detector()
    now = datetime.now(timezone.utc)
    old_date = now - timedelta(days=45)

    check = detector.check_model_drift("energy-prophet-forecaster", old_date, 10.0)
    assert check["isStale"] is True
    assert check["modelAgeDays"] >= 45
    assert "Cần kích hoạt Retrain" in check["recommendation"] or "huấn luyện hơn" in check["recommendation"]


def test_ai_010_graceful_fallback_without_crashing():
    """AI-010: When given empty or invalid features, forecaster falls back safely."""
    req = ForecastRequest(buildingId="Unknown-Bldg", horizonHours=12)
    res = generate_energy_forecast(req)
    assert res is not None
    assert len(res.points) == 12
    assert res.summary.totalForecastKwh > 0
