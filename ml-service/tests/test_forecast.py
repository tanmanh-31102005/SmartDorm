"""
Unit and integration tests for Champion Gradient Boosting (GBM) Forecasting.
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.forecast import ForecastRequest, RecentPoint
from forecasting.gbm_forecaster import GBMForecaster, generate_gbm_forecast


client = TestClient(app)


def test_gbm_forecaster_24h_horizon():
    """Tests that Champion GBM forecaster generates 24 points with valid bounds."""
    forecaster = GBMForecaster()
    req = ForecastRequest(
        room_id="room-101",
        horizon_hours=24,
        interval="1h",
    )
    res = forecaster.predict(req)

    assert res.horizonHours == 24
    assert len(res.points) == 24

    for p in res.points:
        assert p.lowerBoundW <= p.forecastPowerW <= p.upperBoundW
        assert 0.0 <= p.confidence <= 1.0

    assert res.summary.totalForecastKwh > 0
    assert res.summary.peakPowerW >= res.summary.averagePowerW


def test_gbm_forecaster_diurnal_curve():
    """Tests that evening peak power is higher than deep night power."""
    forecaster = GBMForecaster()
    night_factor = forecaster._get_diurnal_factor(3)    # 03:00 AM
    evening_factor = forecaster._get_diurnal_factor(20) # 20:00 PM

    assert evening_factor > night_factor * 1.5


def test_gbm_model_with_recent_points():
    """Tests that GBM forecaster gracefully succeeds with recent telemetry inputs."""
    req = ForecastRequest(
        building_id="Building-A",
        horizon_hours=12,
        interval="1h",
        recent_points=[
            RecentPoint(timestamp="2026-08-17T12:00:00Z", power_w=85.0),
            RecentPoint(timestamp="2026-08-17T13:00:00Z", power_w=92.0),
        ]
    )
    res = generate_gbm_forecast(req)

    assert len(res.points) == 12
    assert res.summary.totalForecastKwh > 0
    assert res.points[0].forecastPowerW > 0


def test_api_forecast_endpoints():
    """Tests POST /ml/forecast/energy, /predict/energy-forecast, and /ml/forecast/gbm endpoints."""
    payload = {
        "roomId": "room-102",
        "horizonHours": 24,
        "interval": "1h"
    }

    # Test main endpoint (routed to Champion GBM)
    resp = client.post("/ml/forecast/energy", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "points" in data
    assert len(data["points"]) == 24
    assert "summary" in data

    # Test alias endpoint
    resp_alias = client.post("/predict/energy-forecast", json=payload)
    assert resp_alias.status_code == 200
    data_alias = resp_alias.json()
    assert len(data_alias["points"]) == 24

    # Test explicit GBM endpoint
    resp_gbm = client.post("/ml/forecast/gbm", json=payload)
    assert resp_gbm.status_code == 200
    data_gbm = resp_gbm.json()
    assert len(data_gbm["points"]) == 24
