"""
Isolation Forest Device Anomaly Detector for IoT Dormitory Equipment.
Detects electrical overloads, degraded relay/motors, network packet loss, and continuous runtime fatigue.
"""
import os
import logging
from typing import List, Dict, Any, Optional, Union, Tuple
from datetime import datetime, timezone
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

from app.schemas.anomaly import (
    DeviceInput,
    DeviceAnomaly,
    DeviceAnomalyResponse,
)
from preprocessing.feature_engineering import build_device_features

logger = logging.getLogger("ml-service.anomaly.isolation_forest")

# Device nominal ratings and overload thresholds
DEVICE_PROFILES = {
    "LIGHT": {
        "nominal_power": 20.0,
        "max_normal_power": 45.0,
        "critical_power": 80.0,
        "max_continuous_uptime": 72.0,
        "label_vi": "Đèn",
    },
    "FAN": {
        "nominal_power": 60.0,
        "max_normal_power": 85.0,
        "critical_power": 130.0,
        "max_continuous_uptime": 96.0,
        "label_vi": "Quạt",
    },
    "AIR_CON": {
        "nominal_power": 1200.0,
        "max_normal_power": 1800.0,
        "critical_power": 2400.0,
        "max_continuous_uptime": 48.0,
        "label_vi": "Điều hòa",
    },
    "DOOR_LOCK": {
        "nominal_power": 5.0,
        "max_normal_power": 15.0,
        "critical_power": 30.0,
        "max_continuous_uptime": 720.0,
        "label_vi": "Khóa cửa",
    },
    "BUZZER": {
        "nominal_power": 2.0,
        "max_normal_power": 10.0,
        "critical_power": 20.0,
        "max_continuous_uptime": 2.0,
        "label_vi": "Còi báo động",
    },
}


class DeviceAnomalyDetector:
    """
    Production-grade Isolation Forest wrapped with domain rules for high precision & recall.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model: Optional[IsolationForest] = None
        self.model_path = model_path
        self.is_trained = False
        self.last_trained_at: Optional[datetime] = None

        if model_path and os.path.exists(model_path):
            self.load(model_path)
        else:
            self._init_baseline_model()

    def _init_baseline_model(self):
        """Initializes with a calibrated baseline Isolation Forest trained on nominal distributions."""
        np.random.seed(42)
        normal_samples = []

        # Synthesize nominal operational envelope
        for _ in range(500):
            # Normal lights
            normal_samples.append([np.random.uniform(0.0, 30.0), np.random.uniform(0.0, 24.0), np.random.uniform(0.0, 0.05), np.random.uniform(20.0, 150.0), np.random.uniform(22.0, 35.0), 1.0])
            # Normal fans
            normal_samples.append([np.random.uniform(0.0, 65.0), np.random.uniform(0.0, 36.0), np.random.uniform(0.0, 0.05), np.random.uniform(20.0, 150.0), np.random.uniform(22.0, 35.0), 1.0])
            # Normal AC
            normal_samples.append([np.random.uniform(0.0, 1500.0), np.random.uniform(0.0, 18.0), np.random.uniform(0.0, 0.05), np.random.uniform(20.0, 150.0), np.random.uniform(22.0, 35.0), 1.0])

        X_train = np.array(normal_samples)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.04,
            max_samples="auto",
            random_state=42
        )
        self.model.fit(X_train)
        self.is_trained = True
        self.last_trained_at = datetime.now(timezone.utc)
        logger.info("Initialized DeviceAnomalyDetector with nominal reference envelope.")

    def fit(self, X: np.ndarray) -> bool:
        """Fits Isolation Forest on feature matrix."""
        try:
            self.model = IsolationForest(
                n_estimators=120,
                contamination=0.05,
                random_state=42
            )
            self.model.fit(X)
            self.is_trained = True
            self.last_trained_at = datetime.now(timezone.utc)
            return True
        except Exception as e:
            logger.error("Failed to fit Isolation Forest: %s", str(e))
            return False

    def save(self, file_path: str):
        """Saves serialized model to disk."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        joblib.dump(self.model, file_path)
        self.model_path = file_path

    def load(self, file_path: str):
        """Loads serialized model from disk."""
        try:
            self.model = joblib.load(file_path)
            self.is_trained = True
            self.model_path = file_path
            logger.info("Loaded anomaly model artifact from %s", file_path)
        except Exception as e:
            logger.warning("Could not load model artifact from %s: %s. Using baseline.", file_path, str(e))
            self._init_baseline_model()

    def evaluate_single_device(self, device: DeviceInput, now: datetime) -> DeviceAnomaly:
        """Evaluates telemetry for a single device and constructs full diagnostic anomaly result."""
        dev_type = str(device.type or "LIGHT").upper()
        profile = DEVICE_PROFILES.get(dev_type, DEVICE_PROFILES["LIGHT"])

        power = float(device.powerW or 0.0)
        uptime = float(device.uptimeHours or 0.0)
        failure_rate = float(device.failureRate or 0.0)
        response_ms = float(device.responseMs or 45.0)
        temp = float(device.temperature or 28.0)

        # 1. Feature extraction
        feats = build_device_features(device.model_dump())
        
        # 2. Isolation Forest score
        # decision_function: positive for inliers, negative for outliers
        if self.model is not None:
            raw_score = float(self.model.decision_function(feats.reshape(1, -1))[0])
            # Scale raw_score (-0.5 to 0.5) to probability-like score (0.0 to 1.0, where 1.0 is anomalous)
            # Sigmoid-like scaling
            ml_anomaly_score = 1.0 / (1.0 + np.exp(raw_score * 8.0))
        else:
            ml_anomaly_score = 0.15

        # 3. Domain heuristics & Evidence explanation
        evidence: Dict[str, Any] = {
            "powerW": power,
            "uptimeHours": uptime,
            "failureRate": failure_rate,
            "responseMs": response_ms,
            "temperature": temp,
            "rawMlScore": round(ml_anomaly_score, 4),
            "triggers": []
        }

        reasons = []
        rule_score = ml_anomaly_score
        severity = "NORMAL"

        # Check Overpower
        if power > profile["critical_power"]:
            rule_score = max(rule_score, 0.92)
            severity = "CRITICAL"
            evidence["triggers"].append("CRITICAL_OVERPOWER")
            reasons.append(
                f"{profile['label_vi']} '{device.name}' tiêu thụ {power:.1f}W vượt ngưỡng nguy hiểm ({profile['critical_power']}W). Nguy cơ chập cháy hoặc chạm vỏ."
            )
        elif power > profile["max_normal_power"]:
            rule_score = max(rule_score, 0.79)
            if severity != "CRITICAL":
                severity = "HIGH"
            evidence["triggers"].append("WARNING_OVERPOWER")
            reasons.append(
                f"{profile['label_vi']} '{device.name}' tiêu thụ {power:.1f}W vượt định mức tiêu chuẩn ({profile['nominal_power']}W)."
            )

        # Check continuous runtime fatigue
        if uptime > profile["max_continuous_uptime"] and power > 5.0:
            rule_score = max(rule_score, 0.81)
            if severity not in ["CRITICAL", "HIGH"]:
                severity = "WARNING"
            evidence["triggers"].append("CONTINUOUS_RUNTIME")
            reasons.append(
                f"{profile['label_vi']} '{device.name}' chạy liên tục {uptime:.1f} giờ không nghỉ. Đề xuất tự động tắt/nghỉ để bảo vệ thiết bị."
            )

        # Check Packet loss / failure rate
        if failure_rate > 0.30:
            rule_score = max(rule_score, 0.88)
            severity = "CRITICAL" if severity == "CRITICAL" else "HIGH"
            evidence["triggers"].append("HIGH_PACKET_LOSS")
            reasons.append(
                f"Tỷ lệ mất kết nối / lỗi lệnh điều khiển đạt {(failure_rate * 100):.1f}%. Cần kiểm tra sóng WiFi ESP32 hoặc nguồn cấp."
            )
        elif failure_rate > 0.12:
            rule_score = max(rule_score, 0.74)
            if severity == "NORMAL":
                severity = "WARNING"
            evidence["triggers"].append("MODERATE_PACKET_LOSS")
            reasons.append(
                f"Tỷ lệ lệnh lỗi {(failure_rate * 100):.1f}% cao hơn bình thường (<5%)."
            )

        # Check response latency spike
        if response_ms > 1200.0:
            rule_score = max(rule_score, 0.75)
            if severity == "NORMAL":
                severity = "WARNING"
            evidence["triggers"].append("HIGH_LATENCY")
            reasons.append(
                f"Độ trễ phản hồi MQTT {response_ms:.0f}ms vượt chuẩn (<200ms). Nghi vấn ESP32 nghẽn vòng lặp loop() hoặc mạng chập chờn."
            )

        final_score = round(min(1.0, max(0.0, rule_score)), 2)
        is_anomaly = final_score >= 0.65 or len(evidence["triggers"]) > 0

        # Classify final severity if not explicitly elevated
        if is_anomaly and severity == "NORMAL":
            if final_score >= 0.85:
                severity = "CRITICAL"
            elif final_score >= 0.78:
                severity = "HIGH"
            else:
                severity = "WARNING"

        recommendation = " ; ".join(reasons) if reasons else None

        return DeviceAnomaly(
            id=f"anom_{device.id}_{int(now.timestamp())}",
            deviceId=device.id,
            deviceName=device.name,
            roomId=device.roomId,
            roomNumber=device.roomNumber or "Unknown",
            buildingName=device.buildingName or "Building A",
            anomaly=is_anomaly,
            anomalyScore=final_score,
            severity=severity,
            features=evidence,
            status="OPEN",
            recommendation=recommendation,
            detectedAt=now.isoformat(),
            evidence=evidence
        )

    def evaluate_devices(self, devices: List[DeviceInput]) -> DeviceAnomalyResponse:
        """Evaluates a batch of devices and returns full response."""
        now = datetime.now(timezone.utc)
        results: List[DeviceAnomaly] = []
        anomaly_count = 0

        for d in devices:
            res = self.evaluate_single_device(d, now)
            results.append(res)
            if res.anomaly:
                anomaly_count += 1

        return DeviceAnomalyResponse(
            anomalies=results,
            totalEvaluated=len(devices),
            anomalyCount=anomaly_count,
            timestamp=now.isoformat(),
        )


# Global singleton anomaly detector instance
_global_anomaly_detector = DeviceAnomalyDetector()


def detect_device_anomalies(devices: Union[List[DeviceInput], AnomalyRequest]) -> DeviceAnomalyResponse:
    """Entrypoint function for device anomaly evaluation."""
    if hasattr(devices, "devices"):
        devices = devices.devices
    elif isinstance(devices, dict) and "devices" in devices:
        devices = devices["devices"]
    return _global_anomaly_detector.evaluate_devices(devices)
