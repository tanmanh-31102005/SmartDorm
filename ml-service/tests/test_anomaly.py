"""
Unit and integration tests for Device Anomaly Detection (Isolation Forest).
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.anomaly import DeviceInput, AnomalyRequest
from anomaly.isolation_forest import DeviceAnomalyDetector, detect_device_anomalies


client = TestClient(app)


def test_anomaly_detector_nominal_device():
    """Tests that normal device produces NORMAL status without anomaly flag."""
    detector = DeviceAnomalyDetector()
    normal_light = DeviceInput(
        id="dev-light-normal",
        name="Đèn LED phòng 101",
        type="LIGHT",
        roomId="room-101",
        powerW=20.0,
        uptimeHours=4.0,
        failureRate=0.01,
        responseMs=35.0,
        temperature=26.0,
    )
    res = detector.evaluate_single_device(normal_light, datetime.now(timezone.utc))

    assert res.anomalyScore < 0.65
    assert res.severity == "NORMAL"
    assert res.anomaly is False


def test_anomaly_detector_overpower_light():
    """Tests that overloaded light (120W) is flagged with HIGH or CRITICAL severity."""
    detector = DeviceAnomalyDetector()
    faulty_light = DeviceInput(
        id="dev-light-burn",
        name="Đèn LED chập tải",
        type="LIGHT",
        roomId="room-101",
        powerW=120.0, # Normal rating is 20W, critical threshold is 80W
        uptimeHours=10.0,
        failureRate=0.0,
        responseMs=45.0,
    )
    res = detector.evaluate_single_device(faulty_light, datetime.now(timezone.utc))

    assert res.anomaly is True
    assert res.anomalyScore >= 0.78
    assert res.severity in ["HIGH", "CRITICAL"]
    assert res.recommendation is not None
    assert "chập" in res.recommendation.lower() or "định mức" in res.recommendation.lower()


def test_anomaly_detector_continuous_fatigue():
    """Tests that continuous operation > 72h flags runtime fatigue."""
    detector = DeviceAnomalyDetector()
    tired_fan = DeviceInput(
        id="dev-fan-tired",
        name="Quạt trần P102",
        type="FAN",
        roomId="room-102",
        powerW=60.0,
        uptimeHours=120.0, # > 96h limit
        failureRate=0.02,
        responseMs=50.0,
    )
    res = detector.evaluate_single_device(tired_fan, datetime.now(timezone.utc))

    assert res.anomaly is True
    assert "CONTINUOUS_RUNTIME" in res.evidence.get("triggers", [])


def test_api_anomaly_endpoints():
    """Tests POST /ml/anomaly/device and /predict/anomalies endpoints."""
    payload = {
        "devices": [
            {
                "id": "light-1",
                "name": "Đèn 1",
                "type": "LIGHT",
                "roomId": "room-101",
                "powerW": 20.0,
                "uptimeHours": 2.0,
                "failureRate": 0.0,
                "responseMs": 30.0,
            },
            {
                "id": "light-bad",
                "name": "Đèn Hỏng",
                "type": "LIGHT",
                "roomId": "room-101",
                "powerW": 140.0,
                "uptimeHours": 10.0,
                "failureRate": 0.35,
                "responseMs": 1500.0,
            }
        ]
    }

    resp = client.post("/ml/anomaly/device", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    total_eval = data.get("totalEvaluated", data.get("total_evaluated", 0))
    anomaly_cnt = data.get("anomalyCount", data.get("anomaly_count", 0))
    assert total_eval == 2
    assert anomaly_cnt >= 1
    assert len(data["anomalies"]) == 2

    # Check that the bad device is flagged
    bad_dev_res = [d for d in data["anomalies"] if d.get("deviceId", d.get("device_id")) == "light-bad"][0]
    assert bad_dev_res["anomaly"] is True
    assert bad_dev_res["severity"] in ["HIGH", "CRITICAL"]

    # Test alias endpoint with raw list
    resp_alias = client.post("/predict/anomalies", json=payload["devices"])
    assert resp_alias.status_code == 200
    data_alias = resp_alias.json()
    total_eval_alias = data_alias.get("totalEvaluated", data_alias.get("total_evaluated", 0))
    assert total_eval_alias == 2

