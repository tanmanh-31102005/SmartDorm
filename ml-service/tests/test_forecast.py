"""
Unit and integration tests for Energy Forecasting (Baseline & Prophet wrapper).
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.forecast import ForecastRequest, RecentPoint
from forecasting.baseline import BaselineForecaster, generate_baseline_forecast
from forecasting.prophet_model import ProphetForecaster, generate_energy_forecast


client = TestClient(app)


def test_baseline_forecaster_24h_horizon():
    """Tests that baseline forecaster generates 24 points with valid bounds."""
    forecaster = BaselineForecaster()
    req = ForecastRequest(
        room_id="room-101",
        horizon_hours=24,
        interval="1h",
    )
    res = forecaster.predict(req)

    assert res.horizonHours == 24
    assert res.source == "BASELINE_PROXY"
    assert len(res.points) == 24

    for p in res.points:
        assert p.lowerBoundW <= p.forecastPowerW <= p.upperBoundW
        assert 0.0 <= p.confidence <= 1.0

    assert res.summary.totalForecastKwh > 0
    assert res.summary.peakPowerW >= res.summary.averagePowerW


def test_baseline_forecaster_diurnal_curve():
    """Tests that evening peak power is higher than deep night power."""
    forecaster = BaselineForecaster()
    night_factor = forecaster._get_hourly_diurnal_factor(3) # 03:00 AM
    evening_factor = forecaster._get_hourly_diurnal_factor(20) # 20:00 PM

    assert evening_factor > night_factor * 2.0


def test_prophet_model_fallback():
    """Tests that Prophet wrapper gracefully succeeds using baseline if unfitted."""
    req = ForecastRequest(
        building_id="Building-A",
        horizon_hours=12,
        interval="1h",
        recent_points=[
            RecentPoint(timestamp="2026-08-17T12:00:00Z", power_w=85.0),
            RecentPoint(timestamp="2026-08-17T13:00:00Z", power_w=92.0),
        ]
    )
    res = generate_energy_forecast(req)

    assert len(res.points) == 12
    assert res.summary.totalForecastKwh > 0
    assert res.points[0].forecastPowerW > 0


def test_api_forecast_endpoints():
    """Tests POST /ml/forecast/energy and /predict/energy-forecast endpoints."""
    payload = {
        "roomId": "room-102",
        "horizonHours": 24,
        "interval": "1h"
    }

    # Test main endpoint
    resp = client.post("/ml/forecast/energy", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "points" in data
    assert len(data["points"]) == 24
    assert "summary" in data
    total_kwh = data["summary"].get("totalForecastKwh", data["summary"].get("total_forecast_kwh", 0))
    assert total_kwh > 0

    # Test alias endpoint
    resp_alias = client.post("/predict/energy-forecast", json=payload)
    assert resp_alias.status_code == 200
    data_alias = resp_alias.json()
    assert len(data_alias["points"]) == 24
