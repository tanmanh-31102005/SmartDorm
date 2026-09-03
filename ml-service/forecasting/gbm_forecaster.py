"""
GBM (Gradient Boosting) Energy Forecaster — Sprint 2 Champion.

Inference Strategy cho dự báo tương lai:
  - Time features: tính chính xác từ timestamp tương lai
  - Sensor features: dùng historical average theo giờ (profile KTX)
  - Device states: dùng historical probability theo giờ
  - Lag features: autoregressive — dùng dự báo bước trước làm input bước sau

Không thay đổi ForecastRequest/ForecastResponse schema → backward compatible 100%.
"""
import os
import logging
import joblib
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

from app.schemas.forecast import (
    ForecastRequest,
    ForecastPoint,
    ForecastSummary,
    ForecastResponse,
)
from forecasting.baseline import BaselineForecaster

logger = logging.getLogger("ml-service.forecasting.gbm")

# ─────────────────────────────────────────────────────────────────────────────
# HISTORICAL HOURLY PROFILES (từ dataset 45 ngày x 24 phòng x 1080 giờ)
# Được pre-compute để dùng thay thế sensor data không biết ở tương lai
# ─────────────────────────────────────────────────────────────────────────────

# Nhiệt độ trung bình theo giờ (°C) — pattern KTX Việt Nam
HOURLY_TEMP_PROFILE = {
    0: 28.2, 1: 27.8, 2: 27.5, 3: 27.3, 4: 27.1, 5: 27.0,
    6: 27.2, 7: 27.8, 8: 28.5, 9: 29.2, 10: 30.1, 11: 30.8,
    12: 31.2, 13: 31.5, 14: 31.8, 15: 31.6, 16: 31.0, 17: 30.2,
    18: 29.5, 19: 29.0, 20: 28.8, 21: 28.6, 22: 28.5, 23: 28.3,
}

# Độ ẩm trung bình theo giờ (%) — giảm vào giữa trưa, tăng đêm
HOURLY_HUMIDITY_PROFILE = {
    0: 72, 1: 73, 2: 74, 3: 75, 4: 75, 5: 74,
    6: 72, 7: 70, 8: 67, 9: 64, 10: 61, 11: 59,
    12: 58, 13: 57, 14: 57, 15: 58, 16: 60, 17: 63,
    18: 66, 19: 68, 20: 70, 21: 71, 22: 72, 23: 72,
}

# Xác suất đèn bật theo giờ (0-1) — pattern sinh viên
HOURLY_LIGHT_PROB = {
    0: 0.05, 1: 0.02, 2: 0.02, 3: 0.02, 4: 0.02, 5: 0.05,
    6: 0.35, 7: 0.70, 8: 0.45, 9: 0.35, 10: 0.30, 11: 0.35,
    12: 0.40, 13: 0.35, 14: 0.30, 15: 0.35, 16: 0.50, 17: 0.70,
    18: 0.85, 19: 0.90, 20: 0.88, 21: 0.82, 22: 0.60, 23: 0.30,
}

# Xác suất quạt bật theo giờ (tương quan với nhiệt độ)
HOURLY_FAN_PROB = {
    0: 0.40, 1: 0.35, 2: 0.32, 3: 0.30, 4: 0.30, 5: 0.30,
    6: 0.35, 7: 0.45, 8: 0.52, 9: 0.58, 10: 0.65, 11: 0.72,
    12: 0.78, 13: 0.82, 14: 0.85, 15: 0.83, 16: 0.78, 17: 0.72,
    18: 0.68, 19: 0.65, 20: 0.62, 21: 0.58, 22: 0.52, 23: 0.45,
}

# Xác suất có người trong phòng theo giờ
HOURLY_OCCUPANCY_PROB = {
    0: 0.85, 1: 0.90, 2: 0.92, 3: 0.93, 4: 0.93, 5: 0.88,
    6: 0.75, 7: 0.60, 8: 0.30, 9: 0.20, 10: 0.18, 11: 0.20,
    12: 0.45, 13: 0.35, 14: 0.20, 15: 0.22, 16: 0.40, 17: 0.65,
    18: 0.80, 19: 0.88, 20: 0.90, 21: 0.88, 22: 0.87, 23: 0.86,
}

# Gas level trung bình thấp (bình thường không có sự cố)
BASELINE_GAS = 18.0  # %


def _build_inference_features(future_timestamps: List[datetime],
                               last_known_power: float = 80.0) -> np.ndarray:
    """
    Xây dựng feature matrix cho inference tương lai.

    Với mỗi bước thời gian h trong tương lai:
      - Time features: tính chính xác
      - Sensor features: dùng hourly historical profile
      - Lag features: autoregressive (dự báo h-1 làm input h)
    """
    n = len(future_timestamps)
    X = np.zeros((n, 15), dtype=float)
    prev_power = last_known_power  # Khởi tạo từ giá trị cuối cùng biết được

    for i, ts in enumerate(future_timestamps):
        h   = ts.hour
        dow = ts.weekday()  # 0=Monday, 6=Sunday

        # ── Time features (chính xác 100%) ──
        X[i, 0] = np.sin(2 * np.pi * h / 24.0)          # sin_hour
        X[i, 1] = np.cos(2 * np.pi * h / 24.0)          # cos_hour
        X[i, 2] = np.sin(2 * np.pi * dow / 7.0)         # sin_dow
        X[i, 3] = np.cos(2 * np.pi * dow / 7.0)         # cos_dow
        X[i, 4] = 1.0 if dow >= 5 else 0.0              # is_weekend
        X[i, 5] = 1.0 if (h >= 22 or h < 6) else 0.0   # is_night
        X[i, 6] = 1.0 if (dow < 5 and 8 <= h < 17) else 0.0  # is_class_time

        # ── Sensor features (historical profile) ──
        temp_c    = HOURLY_TEMP_PROFILE.get(h, 29.0)
        hum_pct   = HOURLY_HUMIDITY_PROFILE.get(h, 65.0)
        X[i, 7] = np.clip((temp_c - 20.0) / 20.0, 0, 1)   # temperature_norm
        X[i, 8] = np.clip(hum_pct / 100.0, 0, 1)           # humidity_norm
        X[i, 9] = np.clip(BASELINE_GAS / 100.0, 0, 1)      # gas_norm

        # ── Device state features (historical probability) ──
        X[i, 10] = HOURLY_LIGHT_PROB.get(h, 0.5)           # light_on
        X[i, 11] = HOURLY_FAN_PROB.get(h, 0.5)             # fan_on
        X[i, 12] = HOURLY_OCCUPANCY_PROB.get(h, 0.7)       # occupancy_signal

        # ── Lag features (autoregressive) ──
        # lag_1h: dùng dự báo của bước trước (hoặc giá trị cuối biết)
        X[i, 13] = prev_power    # power_lag_1h

        # lag_24h: 24 bước trước — nếu chưa có đủ lịch sử, dùng profile
        if i >= 24:
            X[i, 14] = X[i - 24, 13]  # lấy từ history trong batch
        else:
            # Ước tính từ diurnal profile
            h_24_ago = (h) % 24
            baseline_calc = BaselineForecaster()
            X[i, 14] = prev_power * baseline_calc._get_hourly_diurnal_factor(h_24_ago, dow)

        # Cập nhật prev_power (sẽ được overwrite sau khi predict)
        prev_power = prev_power  # Placeholder — sẽ update sau predict

    return X


class GBMForecaster:
    """
    Gradient Boosting Energy Forecaster — Sprint 2 Champion (R²=0.9607, MAPE=4.69%).

    Thực hiện autoregressive multi-step inference:
      Bước 1: predict giờ h+1 từ features
      Bước 2: dùng kết quả h+1 làm lag_1h để predict h+2
      ...
      Bước N: predict giờ h+N
    """

    MODEL_PATH = str(Path(__file__).resolve().parent.parent / "models" / "energy_gbm_model.joblib")

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or self.MODEL_PATH
        self.model = None
        self.scaler = None
        self.is_fitted = False
        self.fallback_engine = BaselineForecaster()
        self._load()

    def _load(self):
        """Load GBM model và StandardScaler từ disk."""
        if os.path.exists(self.model_path):
            try:
                artifact = joblib.load(self.model_path)
                if isinstance(artifact, dict):
                    self.model  = artifact.get("model")
                    self.scaler = artifact.get("scaler")
                else:
                    self.model = artifact
                self.is_fitted = self.model is not None
                logger.info("GBMForecaster loaded from %s (fitted=%s)", self.model_path, self.is_fitted)
            except Exception as e:
                logger.warning("Could not load GBM artifact: %s — will use baseline fallback", e)
                self.is_fitted = False
        else:
            logger.warning("GBM model file not found at %s — using baseline fallback", self.model_path)
            self.is_fitted = False

    def predict(self, request: ForecastRequest, now: Optional[datetime] = None) -> ForecastResponse:
        """
        Dự báo năng lượng cho horizon_hours giờ tiếp theo.
        Trả về ForecastResponse cùng schema với Prophet/Baseline — backward compatible.
        """
        if not self.is_fitted:
            logger.warning("GBM not fitted — delegating to BaselineForecaster")
            return self.fallback_engine.predict(request, now)

        now = now or datetime.now(timezone.utc)
        horizon = request.horizonHours or 24

        # Lấy last known power từ recentPoints (nếu có) hoặc dùng mặc định
        last_known_power = 80.0
        if request.recentPoints and len(request.recentPoints) > 0:
            last_known_power = float(request.recentPoints[-1].powerW)

        # Tạo danh sách timestamp tương lai
        future_timestamps = [now + timedelta(hours=h + 1) for h in range(horizon)]

        # Build feature matrix ban đầu
        X = _build_inference_features(future_timestamps, last_known_power)

        # Autoregressive prediction — predict từng bước, dùng kết quả làm lag input
        predictions = np.zeros(horizon)
        prev_power = last_known_power

        for i in range(horizon):
            X[i, 13] = prev_power  # Cập nhật lag_1h với giá trị mới nhất

            if self.scaler is not None:
                x_scaled = self.scaler.transform(X[i:i+1])
            else:
                x_scaled = X[i:i+1]

            pred = float(self.model.predict(x_scaled)[0])
            pred = max(5.0, pred)   # Công suất tối thiểu 5W
            predictions[i] = pred
            prev_power = pred  # Dùng kết quả vừa predict làm lag cho bước tiếp

        # Tính confidence interval (±8% — từ RMSE/mean ratio của model)
        ci_half = predictions * 0.08
        lower = np.maximum(0.0, predictions - ci_half)
        upper = predictions + ci_half

        # Build ForecastPoint list
        points: List[ForecastPoint] = []
        for i, ts in enumerate(future_timestamps):
            points.append(ForecastPoint(
                timestamp=ts.isoformat(),
                forecastPowerW=round(predictions[i], 2),
                lowerBoundW=round(lower[i], 2),
                upperBoundW=round(upper[i], 2),
                confidence=0.95,
                actualPowerW=None,
            ))

        # Build summary
        total_kwh = round(float(np.sum(predictions)) / 1000.0, 4)
        peak_idx  = int(np.argmax(predictions))
        avg_power = round(float(np.mean(predictions)), 2)

        summary = ForecastSummary(
            totalForecastKwh=total_kwh,
            peakPowerW=round(float(predictions[peak_idx]), 2),
            peakTimestamp=future_timestamps[peak_idx].isoformat(),
            averagePowerW=avg_power,
            baselineComparisonPercent=0.0,
        )

        return ForecastResponse(
            buildingId=request.buildingId,
            roomId=request.roomId,
            horizonHours=horizon,
            interval=request.interval or "1h",
            source="GBM_MULTIVARIATE_CHAMPION",
            generatedAt=now.isoformat(),
            summary=summary,
            points=points,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Global singleton
# ─────────────────────────────────────────────────────────────────────────────
_global_gbm_forecaster: Optional[GBMForecaster] = None


def get_gbm_forecaster() -> GBMForecaster:
    """Returns singleton GBMForecaster (lazy init)."""
    global _global_gbm_forecaster
    if _global_gbm_forecaster is None:
        _global_gbm_forecaster = GBMForecaster()
    return _global_gbm_forecaster


def generate_gbm_forecast(request: ForecastRequest) -> ForecastResponse:
    """Top-level convenience function — mirrors generate_energy_forecast() pattern."""
    return get_gbm_forecaster().predict(request)
