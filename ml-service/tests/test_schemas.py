"""
Unit tests for Pydantic data schemas and validation logic.
"""
import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas.telemetry import NormalizedTelemetry, AggregatedFeatures
from app.schemas.forecast import (
    ForecastRequest,
    ForecastPoint,
    ForecastSummary,
    ForecastResponse,
    RecentPoint,
)
from app.schemas.anomaly import (
    DeviceInput,
    AnomalyRequest,
    DeviceAnomaly,
    DeviceAnomalyResponse,
)
from app.schemas.occupancy import (
    RoomOccupancyInput,
    OccupancyRequest,
    OccupancyRoomResult,
    OccupancyResponse,
)


def test_normalized_telemetry_aliases():
    """Tests camelCase and snake_case alias compatibility."""
    data = {
        "building": "A",
        "floor": "1",
        "room": "101",
        "device_id": "ESP32-101",
        "temperature": 27.5,
        "humidity": 65.0,
        "gas_level": 12.0,
        "power_w": 45.2,
        "energy_kwh": 3.1415,
        "occupancy_signal": True,
        "light_state": True,
        "fan_state": False,
    }
    telemetry = NormalizedTelemetry(**data)
    assert telemetry.building == "A"
    assert telemetry.room == "101"
    assert telemetry.deviceId == "ESP32-101"
    assert telemetry.gasLevel == 12.0
    assert telemetry.powerW == 45.2
    assert telemetry.occupancySignal is True


def test_forecast_request_defaults_and_validation():
    """Tests ForecastRequest default parameters and bounds."""
    req = ForecastRequest(room_id="room-101")
    assert req.roomId == "room-101"
    assert req.horizonHours == 24
    assert req.interval == "1h"

    # Test horizon limits
    with pytest.raises(ValidationError):
        ForecastRequest(horizon_hours=0)

    with pytest.raises(ValidationError):
        ForecastRequest(horizon_hours=500)


def test_device_anomaly_schema():
    """Tests DeviceInput and DeviceAnomaly schema integrity."""
    dev = DeviceInput(
        id="dev-light-1",
        name="Đèn trần",
        type="LIGHT",
        room_id="room-101",
        power_w=95.0,
        uptime_hours=80.0,
        failure_rate=0.15,
    )
    assert dev.id == "dev-light-1"
    assert dev.powerW == 95.0
    assert dev.roomId == "room-101"

    res = DeviceAnomaly(
        id="anom-1",
        deviceId=dev.id,
        deviceName=dev.name,
        roomId=dev.roomId,
        anomaly=True,
        anomalyScore=0.88,
        severity="HIGH",
        features={"powerW": 95.0},
        status="OPEN",
        recommendation="Kiểm tra tải đèn",
        detectedAt="2026-08-17T20:00:00Z"
    )
    assert res.anomalyScore == 0.88
    assert res.severity == "HIGH"


def test_occupancy_schemas():
    """Tests RoomOccupancyInput and OccupancyResponse schemas."""
    room = RoomOccupancyInput(
        id="room-101",
        room_number="101",
        building_name="Building A",
        motion_detected=True,
        power_w=65.0,
        active_devices_count=2,
    )
    assert room.motionDetected is True
    assert room.powerW == 65.0

    room_res = OccupancyRoomResult(
        roomId=room.id,
        roomNumber="101",
        buildingName="Building A",
        floor=1,
        occupiedProbability=0.85,
        predictedState="OCCUPIED",
        confidence=0.92,
        source="ML_MODEL",
        activeDevicesCount=2,
        currentPowerW=65.0,
        updatedAt="2026-08-17T20:00:00Z"
    )
    assert room_res.predictedState == "OCCUPIED"
    assert room_res.occupiedProbability == 0.85

    resp = OccupancyResponse(
        buildingId="A",
        totalRooms=1,
        occupiedCount=1,
        vacantCount=0,
        averageOccupancyRate=100.0,
        occupancy=[room_res],
        timestamp="2026-08-17T20:00:00Z"
    )
    assert resp.totalRooms == 1
    assert resp.occupiedCount == 1
