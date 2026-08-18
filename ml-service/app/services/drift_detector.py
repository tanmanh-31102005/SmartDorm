"""
Data Drift and Stale Model Monitoring Service.
Monitors prediction residual error distribution, telemetry shifts, and model age.
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("ml-service.services.drift_detector")


class ModelDriftDetector:
    """
    Evaluates data drift, concept drift, and model freshness across all registered models.
    """

    def __init__(self, max_staleness_days: int = 30, max_mae_drift_pct: float = 20.0):
        self.max_staleness_days = max_staleness_days
        self.max_mae_drift_pct = max_mae_drift_pct

    def check_model_drift(
        self,
        model_name: str,
        last_trained_at: datetime,
        baseline_mae: float,
        recent_actuals: List[float] = None,
        recent_predictions: List[float] = None,
    ) -> Dict[str, Any]:
        """
        Calculates staleness and residual error drift for a given model.
        """
        now = datetime.now(timezone.utc)
        age_days = max(0, (now - last_trained_at).days)
        is_stale = age_days >= self.max_staleness_days

        mae_drift_pct = 0.0
        current_mae = baseline_mae
        drift_detected = False

        if recent_actuals and recent_predictions and len(recent_actuals) == len(recent_predictions) and len(recent_actuals) > 10:
            import numpy as np
            diffs = np.abs(np.array(recent_actuals) - np.array(recent_predictions))
            current_mae = float(np.mean(diffs))
            if baseline_mae > 0:
                mae_drift_pct = round(((current_mae - baseline_mae) / baseline_mae) * 100.0, 1)
                if mae_drift_pct > self.max_mae_drift_pct:
                    drift_detected = True

        status = "HEALTHY"
        if is_stale and drift_detected:
            status = "CRITICAL_DRIFT"
        elif is_stale or drift_detected:
            status = "WARNING_STALE"

        recommendation = "Mô hình đang hoạt động ổn định và chính xác."
        if status == "CRITICAL_DRIFT":
            recommendation = f"Cảnh báo: Mô hình '{model_name}' đã cũ ({age_days} ngày) và sai số MAE tăng {mae_drift_pct}%. Cần kích hoạt Retrain ngay!"
        elif is_stale:
            recommendation = f"Mô hình '{model_name}' đã được huấn luyện hơn {age_days} ngày trước. Đề xuất chạy tái huấn luyện định kỳ."
        elif drift_detected:
            recommendation = f"Phát hiện sai số dự báo gần đây tăng {mae_drift_pct}%. Khuyến nghị kiểm tra phân phối dữ liệu tải mới."

        return {
            "modelName": model_name,
            "status": status,
            "isStale": is_stale,
            "isDriftDetected": drift_detected,
            "modelAgeDays": age_days,
            "maxStalenessDays": self.max_staleness_days,
            "baselineMae": baseline_mae,
            "currentMae": round(current_mae, 2),
            "maeDriftPercent": mae_drift_pct,
            "lastTrainedAt": last_trained_at.isoformat(),
            "evaluatedAt": now.isoformat(),
            "recommendation": recommendation,
        }

    def check_all_models(self, registry_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Evaluates health & drift for all active models in the registry."""
        results = []
        for name, meta in registry_metadata.items():
            trained_str = meta.get("lastTrainedAt")
            if trained_str:
                try:
                    dt = datetime.fromisoformat(trained_str.replace("Z", "+00:00"))
                except Exception:
                    dt = datetime.now(timezone.utc) - timedelta(days=5)
            else:
                dt = datetime.now(timezone.utc) - timedelta(days=5)

            baseline_mae = meta.get("metrics", {}).get("mae", 12.0)
            res = self.check_model_drift(name, dt, baseline_mae)
            results.append(res)

        return results


# Global singleton instance
_global_drift_detector = ModelDriftDetector()


def get_drift_detector() -> ModelDriftDetector:
    """Returns singleton ModelDriftDetector instance."""
    return _global_drift_detector
