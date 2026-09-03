"""
Energy Forecasting API Endpoints — Sprint 2 (3-Model Architecture).
Models: GBM (Champion) | LSTM/MLP (Challenger) | Baseline (Fallback)
"""
import time
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Body
from app.schemas.forecast import ForecastRequest, ForecastResponse
from forecasting.gbm_forecaster import generate_gbm_forecast
from forecasting.lstm_model import generate_lstm_forecast
from forecasting.baseline import generate_baseline_forecast
from forecasting.comparison import get_model_comparator

logger = logging.getLogger("ml-service.api.forecast")

router = APIRouter(tags=["Forecasting"])


@router.post(
    "/ml/forecast/energy",
    response_model=ForecastResponse,
    summary="Predict future energy consumption curve (Active Model / Prophet / Baseline)",
    description="Forecasts power (W) and cumulative energy (kWh) over horizon with confidence intervals using active model / Prophet / Baseline fallback."
)
@router.post(
    "/predict/energy-forecast",
    response_model=ForecastResponse,
    include_in_schema=False,
)
async def forecast_energy(request: ForecastRequest) -> ForecastResponse:
    """Entrypoint cho Standard / Active Energy Forecasting."""
    start_time = time.time()
    try:
        comparator = get_model_comparator()
        # Route tới đúng model đang ACTIVE
        if comparator.active_model_name == "energy-gbm-forecaster":
            response = generate_gbm_forecast(request)
        elif comparator.active_model_name == "energy-lstm-forecaster":
            response = generate_lstm_forecast(request)
        else:
            # energy-baseline (fallback cuối cùng)
            response = generate_baseline_forecast(request)

        elapsed_ms = (time.time() - start_time) * 1000
        logger.debug("Forecast in %.1fms via %s (%d points)",
                     elapsed_ms, comparator.active_model_name, len(response.points))
        return response
    except Exception as e:
        logger.error("Forecast failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Forecast failed: {str(e)}")


@router.post(
    "/ml/forecast/gbm",
    response_model=ForecastResponse,
    summary="GBM Gradient Boosting Forecast (Champion R²=0.96)",
    description="Dự báo bằng Gradient Boosting 15 features. MAPE=4.69%, R²=0.9607."
)
async def forecast_gbm(request: ForecastRequest) -> ForecastResponse:
    """Entrypoint trực tiếp cho GBM Champion."""
    try:
        return generate_gbm_forecast(request)
    except Exception as e:
        logger.error("GBM forecast failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"GBM forecast failed: {str(e)}")


@router.post(
    "/ml/forecast/lstm",
    response_model=ForecastResponse,
    summary="MLP Neural Network Forecast (Challenger R²=0.96)",
    description="Dự báo bằng MLP Neural Network 15 features. MAPE=5.00%, R²=0.9645."
)
async def forecast_lstm(request: ForecastRequest) -> ForecastResponse:
    """Entrypoint trực tiếp cho LSTM/MLP Challenger."""
    try:
        return generate_lstm_forecast(request)
    except Exception as e:
        logger.error("LSTM forecast failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"LSTM forecast failed: {str(e)}")


@router.post(
    "/ml/forecast/baseline",
    response_model=ForecastResponse,
    summary="Baseline Diurnal Forecast (Fallback)",
    description="Fallback model: Ridge Regression time-only. MAPE=20.97%, R²=0.65."
)
async def forecast_baseline(request: ForecastRequest) -> ForecastResponse:
    """Entrypoint trực tiếp cho Baseline."""
    try:
        return generate_baseline_forecast(request)
    except Exception as e:
        logger.error("Baseline forecast failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Baseline forecast failed: {str(e)}")


@router.post(
    "/ml/forecast/compare",
    summary="Multi-model Benchmark Comparison (Baseline vs GBM vs LSTM)",
    description="So sánh 3 models song song: metrics, timeline chart data, champion selection."
)
async def compare_forecast_models(request: ForecastRequest) -> Dict[str, Any]:
    """Chạy cả 3 models cùng lúc, trả về bảng so sánh và merged timeline."""
    try:
        comparator = get_model_comparator()
        return comparator.compare_on_request(request)
    except Exception as e:
        logger.error("Model comparison failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@router.post(
    "/ml/models/promote",
    summary="Promote Model to ACTIVE",
    description="Chuyển model được chỉ định lên ACTIVE status. Options: energy-baseline | energy-gbm-forecaster | energy-lstm-forecaster"
)
async def promote_model(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    """Activate một model cụ thể làm primary forecaster."""
    model_name = payload.get("modelName") or payload.get("model_name")
    if not model_name:
        raise HTTPException(status_code=400, detail="Missing 'modelName' in payload.")
    try:
        comparator = get_model_comparator()
        return comparator.promote_model(model_name)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
