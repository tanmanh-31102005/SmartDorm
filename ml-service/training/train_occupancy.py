"""
Room Occupancy Classifier Training and Evaluation Pipeline.
Trains supervised model (Logistic Regression / Random Forest) on multi-modal dorm sensor features.
Evaluates Accuracy, Precision, Recall, and F1 score on validation set.
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
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from app.config import settings
from occupancy.classifier import OccupancyClassifier
from evaluation.metrics import calculate_classification_metrics


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_occupancy")


def generate_occupancy_dataset(n_samples: int = 8000) -> tuple:
    """
    Generates multi-sensor feature matrix:
    [motion, power, active_devices, rfid_score, hour, is_night, is_weekend, gas, temp]
    """
    np.random.seed(42)
    X = []
    y = []

    for _ in range(n_samples):
        hr = np.random.randint(0, 24)
        dow = np.random.randint(0, 7)
        is_weekend = 1.0 if dow in [5, 6] else 0.0
        is_night = 1.0 if (hr >= 22 or hr < 6) else 0.0

        # Prior probability of being in room
        if is_night:
            base_prob = 0.88
        elif is_weekend:
            base_prob = 0.65
        elif 9 <= hr <= 17:
            base_prob = 0.15 # In class
        else:
            base_prob = 0.70 # Evening

        occupied = 1 if np.random.rand() < base_prob else 0

        if occupied:
            # Active room signals
            motion = 1.0 if np.random.rand() < 0.75 else 0.0
            power = np.random.uniform(25.0, 180.0)
            active_devs = np.random.randint(1, 4)
            rfid = np.random.uniform(0.1, 1.0)
            gas = np.random.uniform(12.0, 22.0)
            temp = np.random.uniform(26.0, 29.5)
        else:
            # Vacant room signals
            motion = 0.0
            power = np.random.uniform(2.0, 12.0)
            active_devs = 0
            rfid = 0.0
            gas = np.random.uniform(10.0, 16.0)
            temp = np.random.uniform(25.0, 28.0)

        X.append([motion, power, float(active_devs), rfid, float(hr), is_night, is_weekend, gas, temp])
        y.append(occupied)

    X_arr = np.array(X)
    y_arr = np.array(y)
    return X_arr, y_arr


def run_occupancy_training(output_dir: str = str(ML_ROOT / "models")) -> dict:

    """Trains Occupancy Classifier and evaluates classification metrics."""
    logger.info("Starting Occupancy Classifier training pipeline...")
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # 1. Generate multi-modal dataset
    X, y = generate_occupancy_dataset(n_samples=8000)

    # 2. Train / Test split (80/20)
    split = int(len(X) * 0.8)
    X_train, y_train = X[:split], y[:split]
    X_test, y_test = X[split:], y[split:]

    # 3. Fit classifier
    classifier = OccupancyClassifier()
    classifier.fit(X_train, y_train)

    # 4. Predict on test set
    y_pred = classifier.model.predict(X_test)

    # 5. Calculate metrics
    metrics = calculate_classification_metrics(y_true=y_test, y_pred=y_pred, data_source="SIMULATION_DATA")
    logger.info("Occupancy Evaluation Metrics: %s", json.dumps(metrics, indent=2))

    # 6. Save artifacts
    model_artifact = out_path / "occupancy_classifier.joblib"
    metrics_artifact = out_path / "occupancy_metrics.json"

    classifier.save(str(model_artifact))
    with open(metrics_artifact, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info("Occupancy artifacts saved: %s, %s", model_artifact, metrics_artifact)
    return metrics


if __name__ == "__main__":
    run_occupancy_training()
