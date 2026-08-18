"""
Unit and integration tests for Room Occupancy Classification.
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.occupancy import RoomOccupancyInput, OccupancyRequest
from occupancy.classifier import OccupancyClassifier, predict_room_occupancy


client = TestClient(app)


def test_occupancy_vacant_room():
    """Tests that a room with no movement, no active devices, and zero load is VACANT."""
    classifier = OccupancyClassifier()
    room = RoomOccupancyInput(
        id="room-empty-101",
        room_number="101",
        motion_detected=False,
        power_w=3.0,
        active_devices_count=0,
        last_access_minutes_ago=180.0,
    )
    res = classifier.evaluate_room(room, datetime.now(timezone.utc))

    assert res.predictedState == "VACANT"
    assert res.occupiedProbability < 0.50


def test_occupancy_active_pir_motion():
    """Tests that active hardware PIR motion strongly flags OCCUPIED."""
    classifier = OccupancyClassifier()
    room = RoomOccupancyInput(
        id="room-active-102",
        room_number="102",
        motion_detected=True,
        power_w=65.0,
        active_devices_count=2,
        last_access_minutes_ago=5.0,
    )
    res = classifier.evaluate_room(room, datetime.now(timezone.utc))

    assert res.predictedState == "OCCUPIED"
    assert res.occupiedProbability >= 0.65
    assert "chuyển động" in res.explanation.lower() or "pir" in res.explanation.lower()


def test_api_occupancy_endpoints():
    """Tests POST /ml/predict/occupancy and /predict/occupancy endpoints."""
    payload = {
        "rooms": [
            {
                "id": "r101",
                "roomNumber": "101",
                "buildingName": "Building A",
                "floor": 1,
                "motionDetected": True,
                "powerW": 75.0,
                "activeDevicesCount": 2,
            },
            {
                "id": "r102",
                "roomNumber": "102",
                "buildingName": "Building A",
                "floor": 1,
                "motionDetected": False,
                "powerW": 2.0,
                "activeDevicesCount": 0,
            }
        ]
    }

    resp = client.post("/ml/predict/occupancy", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    total_r = data.get("totalRooms", data.get("total_rooms", 0))
    occ_cnt = data.get("occupiedCount", data.get("occupied_count", 0))
    vac_cnt = data.get("vacantCount", data.get("vacant_count", 0))
    avg_rate = data.get("averageOccupancyRate", data.get("average_occupancy_rate", 0))

    assert total_r == 2
    assert occ_cnt == 1
    assert vac_cnt == 1
    assert avg_rate == 50.0
    assert len(data["occupancy"]) == 2

    # Test alias endpoint
    resp_alias = client.post("/predict/occupancy", json=payload)
    assert resp_alias.status_code == 200
    data_alias = resp_alias.json()
    total_alias = data_alias.get("totalRooms", data_alias.get("total_rooms", 0))
    assert total_alias == 2



def test_api_health_endpoints():
    """Tests GET /ml/health and GET /ml/model-status."""
    resp_h = client.get("/ml/health")
    assert resp_h.status_code == 200
    data_h = resp_h.json()
    assert data_h["status"] == "healthy"
    assert "connections" in data_h

    resp_m = client.get("/ml/model-status")
    assert resp_m.status_code == 200
    data_m = resp_m.json()
    assert isinstance(data_m, list)
    assert len(data_m) >= 3
