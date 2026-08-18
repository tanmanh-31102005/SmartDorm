"""
Device Anomaly Model Training and Evaluation Pipeline.
Fits Isolation Forest on nominal IoT equipment operating envelopes.
Evaluates Precision, Recall, and F1 on simulated test sets with injected anomalies.
"""
import os
import sys
import json
import logging
from pathlib import Path

# Ensure ml-service root is in sys.path
ML_ROOT = Path(__file__).resolve().parent.parent
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

from app.config import settings
from anomaly.isolation_forest import DeviceAnomalyDetector, DEVICE_PROFILES
from evaluation.metrics import calculate_classification_metrics


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_anomaly")


def generate_device_training_dataset(n_samples: int = 5000) -> tuple:
    """Generates nominal and anomalous device operational feature vectors."""
    np.random.seed(42)
    X = []
    y = [] # 0 for normal, 1 for anomaly

    n_anomalies = int(n_samples * 0.05)
    n_normal = n_samples - n_anomalies

    # 1. Normal samples
    for _ in range(n_normal):
        dev_type = np.random.choice(["LIGHT", "FAN", "AIR_CON", "DOOR_LOCK"])
        if dev_type == "LIGHT":
            p = np.random.uniform(0.0, 35.0)
            u = np.random.exponential(12.0)
            f = np.random.uniform(0.0, 0.03)
            r = np.random.uniform(20.0, 120.0)
            t = np.random.uniform(24.0, 32.0)
            ratio = p / 20.0
        elif dev_type == "FAN":
            p = np.random.uniform(0.0, 65.0)
            u = np.random.exponential(24.0)
            f = np.random.uniform(0.0, 0.04)
            r = np.random.uniform(20.0, 150.0)
            t = np.random.uniform(24.0, 35.0)
            ratio = p / 60.0
        elif dev_type == "AIR_CON":
            p = np.random.uniform(0.0, 1500.0)
            u = np.random.exponential(18.0)
            f = np.random.uniform(0.0, 0.04)
            r = np.random.uniform(30.0, 180.0)
            t = np.random.uniform(22.0, 30.0)
            ratio = p / 1200.0
        else:
            p = np.random.uniform(0.0, 8.0)
            u = np.random.uniform(0.0, 500.0)
            f = np.random.uniform(0.0, 0.02)
            r = np.random.uniform(15.0, 80.0)
            t = np.random.uniform(25.0, 30.0)
            ratio = p / 5.0

        X.append([p, u, f, r, t, ratio])
        y.append(0)

    # 2. Injected Anomalies (Overpower, packet loss, latency spike, continuous fatigue)
    for _ in range(n_anomalies):
        anomaly_mode = np.random.choice(["OVERPOWER", "PACKET_LOSS", "LATENCY_SPIKE", "FATIGUE"])
        if anomaly_mode == "OVERPOWER":
            p = np.random.uniform(90.0, 200.0) # Light/Fan severe spike
            u = np.random.uniform(5.0, 30.0)
            f = np.random.uniform(0.0, 0.05)
            r = np.random.uniform(40.0, 120.0)
            t = np.random.uniform(38.0, 55.0)
            ratio = p / 20.0
        elif anomaly_mode == "PACKET_LOSS":
            p = np.random.uniform(10.0, 50.0)
            u = np.random.uniform(1.0, 20.0)
            f = np.random.uniform(0.35, 0.90) # Severe packet loss
            r = np.random.uniform(200.0, 800.0)
            t = np.random.uniform(25.0, 32.0)
            ratio = 1.0
        elif anomaly_mode == "LATENCY_SPIKE":
            p = np.random.uniform(10.0, 50.0)
            u = np.random.uniform(1.0, 20.0)
            f = np.random.uniform(0.05, 0.20)
            r = np.random.uniform(1500.0, 4500.0) # Severe latency
            t = np.random.uniform(25.0, 32.0)
            ratio = 1.0
        else:
            p = np.random.uniform(40.0, 70.0)
            u = np.random.uniform(120.0, 300.0) # > 120h continuous uptime
            f = np.random.uniform(0.01, 0.05)
            r = np.random.uniform(30.0, 100.0)
            t = np.random.uniform(35.0, 48.0)
            ratio = 1.2

        X.append([p, u, f, r, t, ratio])
        y.append(1)

    X_arr = np.array(X)
    y_arr = np.array(y)

    # Shuffle
    indices = np.arange(len(X_arr))
    np.random.shuffle(indices)
    return X_arr[indices], y_arr[indices]


def run_anomaly_training(
    output_dir: str = str(ML_ROOT / "models"),
    n_samples: int = 6000
) -> dict:

    """Trains Isolation Forest model and evaluates real detection metrics."""
    logger.info("Starting Device Anomaly training pipeline...")
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # 1. Generate dataset
    X, y = generate_device_training_dataset(n_samples=6000)
    
    # 2. Train / test split (80/20)
    split = int(len(X) * 0.8)
    X_train, y_train = X[:split], y[:split]
    X_test, y_test = X[split:], y[split:]

    # Train on normal + slightly contaminated subset
    detector = DeviceAnomalyDetector()
    detector.fit(X_train)

    # Predict on test set
    raw_scores = detector.model.decision_function(X_test)
    y_pred = (raw_scores < 0.0).astype(int)

    # 3. Calculate classification metrics
    metrics = calculate_classification_metrics(y_true=y_test, y_pred=y_pred, data_source="SIMULATION_DATA")
    logger.info("Anomaly Evaluation Metrics: %s", json.dumps(metrics, indent=2))

    # 4. Save artifacts
    model_artifact = out_path / "device_anomaly_iforest.joblib"
    metrics_artifact = out_path / "anomaly_metrics.json"

    detector.save(str(model_artifact))
    with open(metrics_artifact, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info("Anomaly artifacts saved: %s, %s", model_artifact, metrics_artifact)
    return metrics


if __name__ == "__main__":
    run_anomaly_training()
