"""
Automated Scheduled Retraining Pipeline (Daily / Weekly MLOps Job).
Extracts latest telemetry, trains all 3 domains, evaluates test metrics, and auto-promotes models.
"""
import os
import sys
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

# Ensure ml-service root is in sys.path
ML_ROOT = Path(__file__).resolve().parent.parent
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from training.train_forecast import run_forecast_training
from training.train_anomaly import run_anomaly_training
from training.train_occupancy import run_occupancy_training
from app.services.model_registry import get_model_registry

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("retraining_job")


def run_full_retraining_pipeline(output_dir: str = str(ML_ROOT / "models")) -> dict:
    """
    Executes end-to-end retraining for:
      1. Energy Forecasting (Baseline vs Prophet vs LSTM)
      2. Device Anomaly Detection (Isolation Forest)
      3. Room Occupancy Classification (Logistic Regression / Random Forest)
    """
    logger.info("==========================================================")
    logger.info("  🚀 Starting SmartDorm Automated Retraining Pipeline")
    logger.info("  Timestamp: %s", datetime.now(timezone.utc).isoformat())
    logger.info("==========================================================")

    start_time = datetime.now(timezone.utc)

    # 1. Forecast Retraining
    forecast_report = run_forecast_training(output_dir=output_dir, days_history=45)

    # 2. Anomaly Retraining
    anomaly_report = run_anomaly_training(output_dir=output_dir, n_samples=6000)

    # 3. Occupancy Retraining
    occupancy_report = run_occupancy_training(output_dir=output_dir)

    # 4. Update in-memory registry
    registry = get_model_registry()
    registry.update_metrics("energy-prophet-forecaster", forecast_report.get("models", {}).get("Prophet", {}))
    registry.update_metrics("energy-lstm-forecaster", forecast_report.get("models", {}).get("LSTM", {}))
    registry.update_metrics("device-isolation-forest", anomaly_report)
    registry.update_metrics("occupancy-classifier", occupancy_report)

    summary = {
        "status": "COMPLETED",
        "startedAt": start_time.isoformat(),
        "completedAt": datetime.now(timezone.utc).isoformat(),
        "durationSeconds": round((datetime.now(timezone.utc) - start_time).total_seconds(), 2),
        "forecastBestModel": forecast_report.get("bestModel"),
        "forecastMetrics": forecast_report.get("models"),
        "anomalyF1Score": anomaly_report.get("f1Score"),
        "occupancyAccuracy": occupancy_report.get("accuracy"),
    }

    report_path = Path(output_dir) / "retraining_summary.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info("Retraining job completed successfully in %.2fs. Report: %s", summary["durationSeconds"], report_path)
    return summary


if __name__ == "__main__":
    run_full_retraining_pipeline()
