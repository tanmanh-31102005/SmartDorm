"""
Occupancy Prediction API Endpoints.
Infers multi-modal dormitory room occupancy states using PIR, power, RFID, and temporal heuristics.
"""
import time
import logging
from typing import List, Union
from fastapi import APIRouter, HTTPException, status, Body
from app.schemas.occupancy import (
    RoomOccupancyInput,
    OccupancyRequest,
    OccupancyResponse,
)
from occupancy.classifier import predict_room_occupancy

logger = logging.getLogger("ml-service.api.occupancy")

router = APIRouter(tags=["Occupancy Inference"])


@router.post(
    "/ml/predict/occupancy",
    response_model=OccupancyResponse,
    summary="Predict room occupancy state and probability",
    description="Fuses PIR motion signals, active power draw, RFID access logs, and time priors to predict room presence."
)
@router.post(
    "/predict/occupancy",
    response_model=OccupancyResponse,
    include_in_schema=False,
)
async def predict_occupancy(
    payload: Union[OccupancyRequest, List[RoomOccupancyInput]] = Body(...)
) -> OccupancyResponse:
    """Entrypoint for room occupancy prediction."""
    start_time = time.time()
    try:
        if isinstance(payload, list):
            req = OccupancyRequest(rooms=payload)
        else:
            req = payload

        response = predict_room_occupancy(req)
        elapsed_ms = (time.time() - start_time) * 1000
        logger.debug("Occupancy prediction completed in %.1fms (rooms: %d, occupied: %d)",
                     elapsed_ms, response.totalRooms, response.occupiedCount)
        return response
    except Exception as e:
        logger.error("Occupancy prediction failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Occupancy prediction failed: {str(e)}"
        )
