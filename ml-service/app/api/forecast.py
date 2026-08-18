"""
Energy Forecasting API Endpoints.
Provides 24h-168h electrical power demand predictions with uncertainty intervals,
LSTM Neural forecasting, multi-model benchmark comparison, and auto-promotion.
"""
import time
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Body
from app.schemas.forecast import ForecastRequest, ForecastResponse
from forecasting.prophet_model import generate_energy_forecast
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
    """Entrypoint for Standard / Active Energy Forecasting."""
    start_time = time.time()
    try:
        comparator = get_model_comparator()
        if comparator.active_model_name == "energy-lstm-forecaster":
            response = generate_lstm_forecast(request)
        elif comparator.active_model_name == "energy-baseline":
            response = generate_baseline_forecast(request)
        else:
            response = generate_energy_forecast(request)

        elapsed_ms = (time.time() - start_time) * 1000
        logger.debug("Energy forecast generated in %.1fms (model: %s, points: %d)",
                     elapsed_ms, comparator.active_model_name, len(response.points))
        return response
    except Exception as e:
        logger.error("Forecast generation failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast calculation failed: {str(e)}"
        )


@router.post(
    "/ml/forecast/lstm",
    response_model=ForecastResponse,
    summary="LSTM Neural Network Energy Forecast",
    description="Forecasts power using 24-step autoregressive LSTM/Recurrent Neural Network with 95% uncertainty interval."
)
async def forecast_lstm(request: ForecastRequest) -> ForecastResponse:
    """Entrypoint for LSTM Neural Network Forecasting."""
    try:
        return generate_lstm_forecast(request)
    except Exception as e:
        logger.error("LSTM forecast failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LSTM forecast failed: {str(e)}"
        )


@router.post(
    "/ml/forecast/compare",
    summary="Multi-model Benchmark Comparison (Baseline vs Prophet vs LSTM)",
    description="Runs inference on Baseline, Prophet, and LSTM for side-by-side evaluation and chart plotting."
)
async def compare_forecast_models(request: ForecastRequest) -> Dict[str, Any]:
    """Evaluates all 3 models simultaneously and returns comparison metrics + merged timeline."""
    try:
        comparator = get_model_comparator()
        return comparator.compare_on_request(request)
    except Exception as e:
        logger.error("Model comparison failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model comparison failed: {str(e)}"
        )


@router.post(
    "/ml/models/promote",
    summary="Promote Model to ACTIVE Production Status",
    description="Sets the specified forecasting model as the primary ACTIVE model."
)
async def promote_model(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    """Promotes a model to active production status."""
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
