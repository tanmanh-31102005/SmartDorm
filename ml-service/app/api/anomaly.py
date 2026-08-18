"""
Device Anomaly Detection API Endpoints.
Evaluates IoT equipment telemetry with Isolation Forest and domain rules.
"""
import time
import logging
from typing import List, Union
from fastapi import APIRouter, HTTPException, status, Body
from app.schemas.anomaly import (
    DeviceInput,
    AnomalyRequest,
    DeviceAnomaly,
    DeviceAnomalyResponse,
)
from anomaly.isolation_forest import detect_device_anomalies

logger = logging.getLogger("ml-service.api.anomaly")

router = APIRouter(tags=["Anomaly Detection"])


@router.post(
    "/ml/anomaly/device",
    response_model=DeviceAnomalyResponse,
    summary="Detect device anomalies and failures",
    description="Evaluates power draw, latency, runtime, and packet failure rates using Isolation Forest."
)
@router.post(
    "/predict/anomalies",
    response_model=DeviceAnomalyResponse,
    include_in_schema=False,
)
async def evaluate_device_anomalies(
    payload: Union[AnomalyRequest, List[DeviceInput]] = Body(...)
) -> DeviceAnomalyResponse:
    """Evaluates devices for electrical overload, network degradation, and runtime fatigue."""
    start_time = time.time()
    try:
        if isinstance(payload, list):
            devices = payload
        else:
            devices = payload.devices

        response = detect_device_anomalies(devices)
        elapsed_ms = (time.time() - start_time) * 1000
        logger.debug("Anomaly detection completed in %.1fms (evaluated: %d, anomalies: %d)",
                     elapsed_ms, response.totalEvaluated, response.anomalyCount)
        return response
    except Exception as e:
        logger.error("Device anomaly evaluation failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Device anomaly evaluation failed: {str(e)}"
        )
