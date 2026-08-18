"""
Room Occupancy Classifier using Multi-Modal IoT Signals.
Combines hardware PIR motion, active electrical load, RFID access recency, and diurnal schedule.
"""
import os
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timezone
import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression

from app.schemas.occupancy import (
    RoomOccupancyInput,
    OccupancyRequest,
    OccupancyRoomResult,
    OccupancyResponse,
)
from preprocessing.feature_engineering import build_occupancy_features

logger = logging.getLogger("ml-service.occupancy.classifier")


class OccupancyClassifier:
    """
    Hybrid multi-modal room occupancy inference engine.
    Uses trained ML classifier when available, backed by calibrated probabilistic proxy.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model: Optional[Any] = None
        self.model_path = model_path
        self.is_trained = False
        self.last_trained_at: Optional[datetime] = None

        if model_path and os.path.exists(model_path):
            self.load(model_path)
        else:
            self._init_baseline_model()

    def _init_baseline_model(self):
        """Initializes a calibrated Logistic Regression classifier on synthetic dorm state distribution."""
        np.random.seed(42)
        X_syn = []
        y_syn = []

        # Synthetic samples (motion, power, active_devices, rfid_score, hour, is_night, is_weekend, gas, temp)
        for _ in range(600):
            # Vacant state: no motion, low power (<15W), no active devices, old RFID (>60m)
            X_syn.append([0.0, np.random.uniform(2.0, 15.0), 0.0, 0.0, np.random.uniform(9, 17), 0.0, 0.0, 12.0, 26.0])
            y_syn.append(0)

            # Occupied state: motion or devices or recent RFID
            has_motion = 1.0 if np.random.rand() > 0.3 else 0.0
            power = np.random.uniform(30.0, 180.0)
            devices = np.random.randint(1, 4)
            rfid = np.random.uniform(0.2, 1.0)
            X_syn.append([has_motion, power, float(devices), rfid, np.random.uniform(18, 23), 0.0, 0.0, 15.0, 27.0])
            y_syn.append(1)

        X_arr = np.array(X_syn)
        y_arr = np.array(y_syn)

        self.model = LogisticRegression(class_weight="balanced", random_state=42)
        self.model.fit(X_arr, y_arr)
        self.is_trained = True
        self.last_trained_at = datetime.now(timezone.utc)
        logger.info("Initialized OccupancyClassifier with calibrated baseline weights.")

    def fit(self, X: np.ndarray, y: np.ndarray) -> bool:
        """Fits classifier on labeled historical data."""
        try:
            self.model = LogisticRegression(class_weight="balanced", max_iter=200, random_state=42)
            self.model.fit(X, y)
            self.is_trained = True
            self.last_trained_at = datetime.now(timezone.utc)
            return True
        except Exception as e:
            logger.error("Failed to fit OccupancyClassifier: %s", str(e))
            return False

    def save(self, file_path: str):
        """Saves model artifact to disk."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        joblib.dump(self.model, file_path)
        self.model_path = file_path

    def load(self, file_path: str):
        """Loads model artifact from disk."""
        try:
            self.model = joblib.load(file_path)
            self.is_trained = True
            self.model_path = file_path
            logger.info("Loaded occupancy classifier from %s", file_path)
        except Exception as e:
            logger.warning("Could not load occupancy model from %s: %s. Using baseline.", file_path, str(e))
            self._init_baseline_model()

    def evaluate_room(self, room: RoomOccupancyInput, now: datetime) -> OccupancyRoomResult:
        """Infers single room occupancy state with multi-signal evidence."""
        current_hour = now.hour
        day_of_week = now.weekday()

        # 1. Extract feature vector
        feats = build_occupancy_features(room.model_dump(), current_hour, day_of_week)

        # 2. Scikit-learn probability inference
        prob_ml = 0.5
        if self.model is not None:
            try:
                prob_ml = float(self.model.predict_proba(feats.reshape(1, -1))[0][1])
            except Exception:
                prob_ml = 0.5

        # 3. Probabilistic Multi-Signal Fusion & Explanations
        motion = bool(room.motionDetected)
        power = float(room.powerW or 0.0)
        active_devs = int(room.activeDevicesCount or 0)
        last_access = room.lastAccessMinutesAgo

        evidence_reasons = []
        rule_prob = 0.05

        # Signal 1: Hardware PIR Motion Sensor (+0.60 to +0.70)
        if motion:
            rule_prob += 0.65
            evidence_reasons.append("Cảm biến chuyển động PIR đang kích hoạt (+65%)")

        # Signal 2: Active Electrical Power / Relay States (+0.25)
        if active_devs > 0 or power > 25.0:
            rule_prob += 0.25
            evidence_reasons.append(f"Thiết bị đang bật ({active_devs} thiết bị, {power:.1f}W tiêu thụ) (+25%)")

        # Signal 3: RFID Badge entry recency
        if last_access is not None and last_access >= 0:
            if last_access <= 30:
                decay = max(0.0, 1.0 - (last_access / 45.0))
                rule_prob += 0.35 * decay
                evidence_reasons.append(f"Quẹt thẻ RFID gần đây ({int(last_access)} phút trước) (+{int(35 * decay)}%)")
            elif last_access <= 120:
                evidence_reasons.append(f"Quẹt thẻ vào phòng {int(last_access)} phút trước")

        # Signal 4: Night-time dormitory circadian prior (22:00 - 06:00)
        if current_hour >= 22 or current_hour <= 6:
            rule_prob += 0.20
            evidence_reasons.append("Khung giờ nghỉ ngơi ban đêm (+20%)")
        elif 9 <= current_hour <= 16 and day_of_week < 5:
            # Daytime class hours decrease probability slightly if no motion
            if not motion and power < 20.0:
                rule_prob -= 0.08

        # Fuse ML probability with Rule prior (weighted 40% ML + 60% Rule for robust IoT determinism)
        fused_prob = (0.40 * prob_ml) + (0.60 * rule_prob)
        final_prob = float(np.clip(round(fused_prob, 2), 0.01, 0.99))

        predicted_state = "OCCUPIED" if final_prob >= 0.50 else "VACANT"
        confidence = float(np.clip(round(0.85 + abs(final_prob - 0.5) * 0.25, 2), 0.70, 0.98))

        explanation_str = " ; ".join(evidence_reasons) if evidence_reasons else "Không có tín hiệu hoạt động (Phòng trống)"

        last_move_ts = now.isoformat() if motion else None

        return OccupancyRoomResult(
            roomId=room.id,
            roomNumber=room.roomNumber or str(room.id),
            buildingName=room.buildingName or "Building A",
            floor=room.floor or 1,
            occupiedProbability=final_prob,
            predictedState=predicted_state,
            confidence=confidence,
            source="ML_MODEL" if self.is_trained else "RULE_PROXY",
            lastMovementAt=last_move_ts,
            activeDevicesCount=active_devs,
            currentPowerW=power,
            updatedAt=now.isoformat(),
            explanation=explanation_str
        )

    def predict_occupancy(self, request: OccupancyRequest) -> OccupancyResponse:
        """Infers occupancy state across a batch of dormitory rooms."""
        now = datetime.now(timezone.utc)
        results: List[OccupancyRoomResult] = []
        occupied_count = 0

        for room in request.rooms:
            res = self.evaluate_room(room, now)
            results.append(res)
            if res.predictedState == "OCCUPIED":
                occupied_count += 1

        total_rooms = len(request.rooms)
        vacant_count = max(0, total_rooms - occupied_count)
        avg_rate = round((occupied_count / max(total_rooms, 1)) * 100.0, 1)

        return OccupancyResponse(
            buildingId=request.buildingId,
            totalRooms=total_rooms,
            occupiedCount=occupied_count,
            vacantCount=vacant_count,
            averageOccupancyRate=avg_rate,
            occupancy=results,
            rooms=results, # Duplicate for backward compatibility
            timestamp=now.isoformat(),
        )


# Global singleton occupancy classifier instance
_global_occupancy_classifier = OccupancyClassifier()


def predict_room_occupancy(request: OccupancyRequest) -> OccupancyResponse:
    """Entrypoint function for room occupancy prediction."""
    return _global_occupancy_classifier.predict_occupancy(request)
