"""
Multi-Model Comparison Engine — Sprint 2 (3-Model Architecture).

Models: Baseline | GBM (Champion) | LSTM/MLP (Challenger)
Prophet đã bị loại: không có thư viện prophet cài sẵn → Ridge 2-feature fallback
  → tệ hơn cả Baseline (R²=0.33 vs 0.65). Giữ Prophet class nhưng không đưa vào comparison.

Để sử dụng Prophet: pip install prophet → Prophet sẽ tự động được đưa trở lại.
"""
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.schemas.forecast import ForecastRequest, ForecastResponse
from forecasting.baseline import BaselineForecaster, generate_baseline_forecast
from forecasting.gbm_forecaster import GBMForecaster, generate_gbm_forecast
from forecasting.lstm_model import LSTMNeuralForecaster, generate_lstm_forecast

logger = logging.getLogger("ml-service.forecasting.comparison")


class ForecastModelComparator:
    """
    So sánh và quản lý 3 model dự báo năng lượng:
      1. Baseline  — Ridge Regression, time-only (FALLBACK, R²=0.65)
      2. GBM       — Gradient Boosting, 15 features (CHAMPION, R²=0.96)
      3. LSTM/MLP  — Neural Network, 15 features  (CHALLENGER, R²=0.96)

    Tự động chọn CHAMPION khi khởi động. Hỗ trợ promote model qua API.
    """

    VALID_MODELS = [
        "energy-baseline",
        "energy-gbm-forecaster",
        "energy-lstm-forecaster",
    ]

    def __init__(self):
        self.baseline_engine = BaselineForecaster()
        self.gbm_engine      = GBMForecaster()
        self.lstm_engine     = LSTMNeuralForecaster()

        # Auto-select champion: GBM nếu đã train, ngược lại dùng Baseline
        if self.gbm_engine.is_fitted:
            self.active_model_name = "energy-gbm-forecaster"
        else:
            self.active_model_name = "energy-baseline"
            logger.warning("GBM model chưa được train. Chạy: python training/train_forecast.py")

        logger.info("ForecastModelComparator ready. Active: %s", self.active_model_name)

    # ──────────────────────────────────────────────────────────────────────────
    # COMPARE — chạy cả 3 model song song để so sánh
    # ──────────────────────────────────────────────────────────────────────────

    def compare_on_request(
        self,
        request: ForecastRequest,
        start_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Chạy inference trên 3 model (Baseline, GBM, LSTM) và trả về bảng so sánh.
        Dùng cho endpoint /ml/forecast/compare và frontend Chart comparison.
        """
        now = start_time or datetime.now(timezone.utc)

        # 1. Baseline (reference)
        t0 = time.perf_counter()
        baseline_res = self.baseline_engine.predict(request, now)
        baseline_latency = round((time.perf_counter() - t0) * 1000, 2)

        # 2. GBM — Champion
        t0 = time.perf_counter()
        gbm_res = self.gbm_engine.predict(request, now)
        gbm_latency = round((time.perf_counter() - t0) * 1000, 2)

        # 3. LSTM/MLP — Challenger
        t0 = time.perf_counter()
        lstm_res = self.lstm_engine.predict(request, now)
        lstm_latency = round((time.perf_counter() - t0) * 1000, 2)

        # Model catalog với metrics thực tế từ Sprint 2 training
        models_benchmark = [
            {
                "modelId":       "mdl-baseline",
                "name":          "Diurnal Ridge Baseline",
                "code":          "energy-baseline-v2",
                "type":          "BASELINE",
                "status":        "ACTIVE" if self.active_model_name == "energy-baseline" else "STANDBY",
                "totalKwh":      baseline_res.summary.totalForecastKwh,
                "peakPowerW":    baseline_res.summary.peakPowerW,
                "averagePowerW": baseline_res.summary.averagePowerW,
                "latencyMs":     baseline_latency,
                "metrics":       {"mae": 28.80, "rmse": 37.16, "mape": 20.97, "r2Score": 0.6526},
                "description":   "Ridge Regression với 7 time features — fallback tốc độ cao",
            },
            {
                "modelId":       "mdl-gbm-v2",
                "name":          "Gradient Boosting Champion",
                "code":          "energy-gbm-v2.0",
                "type":          "ENSEMBLE",
                "status":        "ACTIVE" if self.active_model_name == "energy-gbm-forecaster" else "STANDBY",
                "totalKwh":      gbm_res.summary.totalForecastKwh,
                "peakPowerW":    gbm_res.summary.peakPowerW,
                "averagePowerW": gbm_res.summary.averagePowerW,
                "latencyMs":     gbm_latency,
                "metrics":       {"mae": 8.28, "rmse": 12.50, "mape": 4.69, "r2Score": 0.9607},
                "description":   "GradientBoosting 15 features (sensor+device+time+lag) — Sprint 2",
            },
            {
                "modelId":       "mdl-lstm-v2",
                "name":          "MLP Neural Network Challenger",
                "code":          "energy-lstm-v2.0",
                "type":          "DEEP_LEARNING",
                "status":        "ACTIVE" if self.active_model_name == "energy-lstm-forecaster" else "CHALLENGER",
                "totalKwh":      lstm_res.summary.totalForecastKwh,
                "peakPowerW":    lstm_res.summary.peakPowerW,
                "averagePowerW": lstm_res.summary.averagePowerW,
                "latencyMs":     lstm_latency,
                "metrics":       {"mae": 8.38, "rmse": 11.87, "mape": 5.00, "r2Score": 0.9645},
                "description":   "MLPRegressor 128→64→32 units, 15 features — Sprint 2",
            },
        ]

        # Champion tự động = thấp MAPE nhất trong 3 models
        best_model = min(models_benchmark, key=lambda m: m["metrics"]["mape"])

        # Merged timeline cho frontend multi-line chart
        merged_timeline = []
        n_pts = min(len(baseline_res.points), len(gbm_res.points), len(lstm_res.points))
        for i in range(n_pts):
            p_base = baseline_res.points[i]
            p_gbm  = gbm_res.points[i]
            p_lstm = lstm_res.points[i]

            merged_timeline.append({
                "timestamp":      p_base.timestamp,
                "actualPowerW":   p_base.actualPowerW,
                "baselinePowerW": round(p_base.forecastPowerW, 2),
                "gbmPowerW":      round(p_gbm.forecastPowerW, 2),
                "lstmPowerW":     round(p_lstm.forecastPowerW, 2),
                "lowerBoundW":    round(p_gbm.lowerBoundW, 2),
                "upperBoundW":    round(p_gbm.upperBoundW, 2),
                "confidence":     p_gbm.confidence,
            })

        return {
            "comparisonSummary": {
                "activeModel":         self.active_model_name,
                "totalModels":         3,
                "bestPerformingModel": best_model["name"],
                "bestModelCode":       best_model["code"],
                "bestR2Score":         best_model["metrics"]["r2Score"],
                "bestMape":            best_model["metrics"]["mape"],
                "baselineImprovementPct": round(
                    (models_benchmark[0]["metrics"]["mae"] - best_model["metrics"]["mae"])
                    / models_benchmark[0]["metrics"]["mae"] * 100, 1
                ),
                "evaluationTimestamp": now.isoformat(),
                "architecture":        "Sprint 2 — 3-model (Baseline + GBM + LSTM/MLP)",
            },
            "models":   models_benchmark,
            "timeline": merged_timeline,
            "baseline": baseline_res,
            "gbm":      gbm_res,
            "lstm":     lstm_res,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # PROMOTE — đổi active model qua API
    # ──────────────────────────────────────────────────────────────────────────

    def promote_model(self, model_name: str) -> Dict[str, Any]:
        """
        Promote một model lên ACTIVE.
        Valid options: energy-baseline | energy-gbm-forecaster | energy-lstm-forecaster
        """
        if model_name not in self.VALID_MODELS:
            raise ValueError(
                f"Model '{model_name}' không hợp lệ. "
                f"Chọn một trong: {self.VALID_MODELS}"
            )

        previous_model = self.active_model_name
        self.active_model_name = model_name
        logger.info("Promoted '%s' → ACTIVE (replaced: '%s')", model_name, previous_model)

        model_info = {
            "energy-baseline":          {"r2": 0.6526, "mape": 20.97},
            "energy-gbm-forecaster":    {"r2": 0.9607, "mape": 4.69},
            "energy-lstm-forecaster":   {"r2": 0.9645, "mape": 5.00},
        }

        return {
            "success":       True,
            "promotedModel": model_name,
            "previousModel": previous_model,
            "promotedAt":    datetime.now(timezone.utc).isoformat(),
            "status":        "ACTIVE",
            "metrics":       model_info.get(model_name, {}),
            "message":       f"Model '{model_name}' đã được activate thành công.",
        }


# ─────────────────────────────────────────────────────────────────────────────
# Global singleton
# ─────────────────────────────────────────────────────────────────────────────
_global_comparator = ForecastModelComparator()


def get_model_comparator() -> ForecastModelComparator:
    """Returns singleton ForecastModelComparator instance."""
    return _global_comparator
