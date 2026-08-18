"""
Evaluation Metrics calculation utilities for forecasting and classification models.
Calculates authentic metrics on validation/test datasets without fabricating fake scores.
"""
from typing import Dict, Any, Union, List
import numpy as np


def mean_absolute_error(y_true: Union[np.ndarray, List[float]], y_pred: Union[np.ndarray, List[float]]) -> float:
    """Mean Absolute Error (MAE)."""
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0 or len(yp) == 0:
        return 0.0
    return float(np.mean(np.abs(yt - yp)))


def root_mean_squared_error(y_true: Union[np.ndarray, List[float]], y_pred: Union[np.ndarray, List[float]]) -> float:
    """Root Mean Squared Error (RMSE)."""
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0 or len(yp) == 0:
        return 0.0
    return float(np.sqrt(np.mean((yt - yp) ** 2)))


def mean_absolute_percentage_error(
    y_true: Union[np.ndarray, List[float]], 
    y_pred: Union[np.ndarray, List[float]], 
    epsilon: float = 1e-5
) -> float:
    """Mean Absolute Percentage Error (MAPE in percent: 0 to 100)."""
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) == 0 or len(yp) == 0:
        return 0.0
    # Avoid zero division with epsilon offset or mask
    mask = np.abs(yt) > epsilon
    if not np.any(mask):
        return 0.0
    mape_val = np.mean(np.abs((yt[mask] - yp[mask]) / yt[mask])) * 100.0
    return float(np.clip(mape_val, 0.0, 100.0))


def r2_score(y_true: Union[np.ndarray, List[float]], y_pred: Union[np.ndarray, List[float]]) -> float:
    """R-squared (Coefficient of Determination)."""
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) < 2:
        return 1.0
    ss_res = np.sum((yt - yp) ** 2)
    ss_tot = np.sum((yt - np.mean(yt)) ** 2)
    if ss_tot == 0:
        return 1.0 if ss_res == 0 else 0.0
    return float(1.0 - (ss_res / ss_tot))


def accuracy_score(y_true: Union[np.ndarray, List[int]], y_pred: Union[np.ndarray, List[int]]) -> float:
    """Classification Accuracy (0.0 to 1.0 or 0 to 100%)."""
    yt = np.asarray(y_true)
    yp = np.asarray(y_pred)
    if len(yt) == 0 or len(yp) == 0:
        return 0.0
    return float(np.mean(yt == yp))


def precision_score(
    y_true: Union[np.ndarray, List[int]], 
    y_pred: Union[np.ndarray, List[int]], 
    pos_label: int = 1
) -> float:
    """Precision score for binary classification."""
    yt = np.asarray(y_true)
    yp = np.asarray(y_pred)
    tp = np.sum((yt == pos_label) & (yp == pos_label))
    fp = np.sum((yt != pos_label) & (yp == pos_label))
    if (tp + fp) == 0:
        return 0.0
    return float(tp / (tp + fp))


def recall_score(
    y_true: Union[np.ndarray, List[int]], 
    y_pred: Union[np.ndarray, List[int]], 
    pos_label: int = 1
) -> float:
    """Recall (Sensitivity) for binary classification."""
    yt = np.asarray(y_true)
    yp = np.asarray(y_pred)
    tp = np.sum((yt == pos_label) & (yp == pos_label))
    fn = np.sum((yt == pos_label) & (yp != pos_label))
    if (tp + fn) == 0:
        return 0.0
    return float(tp / (tp + fn))


def f1_score(
    y_true: Union[np.ndarray, List[int]], 
    y_pred: Union[np.ndarray, List[int]], 
    pos_label: int = 1
) -> float:
    """F1-Score harmonic mean of Precision and Recall."""
    prec = precision_score(y_true, y_pred, pos_label=pos_label)
    rec = recall_score(y_true, y_pred, pos_label=pos_label)
    if (prec + rec) == 0:
        return 0.0
    return float(2.0 * (prec * rec) / (prec + rec))


def calculate_forecast_metrics(
    y_true: Union[np.ndarray, List[float]], 
    y_pred: Union[np.ndarray, List[float]],
    data_source: str = "SIMULATION_DATA"
) -> Dict[str, Any]:
    """Calculate all standard regression & forecasting metrics."""
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    
    mae = mean_absolute_error(yt, yp)
    rmse = root_mean_squared_error(yt, yp)
    mape = mean_absolute_percentage_error(yt, yp)
    r2 = r2_score(yt, yp)
    
    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2),
        "r2Score": round(r2, 4),
        "samplesEvaluated": int(len(yt)),
        "dataSource": data_source
    }


def calculate_classification_metrics(
    y_true: Union[np.ndarray, List[int]], 
    y_pred: Union[np.ndarray, List[int]],
    data_source: str = "SIMULATION_DATA"
) -> Dict[str, Any]:
    """Calculate all standard classification metrics."""
    yt = np.asarray(y_true)
    yp = np.asarray(y_pred)
    
    acc = accuracy_score(yt, yp)
    prec = precision_score(yt, yp)
    rec = recall_score(yt, yp)
    f1 = f1_score(yt, yp)
    
    return {
        "accuracy": round(acc * 100.0, 2),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1Score": round(f1, 4),
        "samplesEvaluated": int(len(yt)),
        "dataSource": data_source
    }
