"""
Schemas package for SmartDorm ML Service.
"""
from app.schemas.telemetry import NormalizedTelemetry, AggregatedFeatures
from app.schemas.forecast import (
    ForecastRequest,
    ForecastPoint,
    ForecastSummary,
    ForecastResponse,
    RecentPoint,
)
from app.schemas.anomaly import (
    DeviceInput,
    AnomalyRequest,
    DeviceAnomaly,
    DeviceAnomalyResponse,
)
from app.schemas.occupancy import (
    RoomOccupancyInput,
    OccupancyRequest,
    OccupancyRoomResult,
    OccupancyResponse,
)

__all__ = [
    "NormalizedTelemetry",
    "AggregatedFeatures",
    "ForecastRequest",
    "ForecastPoint",
    "ForecastSummary",
    "ForecastResponse",
    "RecentPoint",
    "DeviceInput",
    "AnomalyRequest",
    "DeviceAnomaly",
    "DeviceAnomalyResponse",
    "RoomOccupancyInput",
    "OccupancyRequest",
    "OccupancyRoomResult",
    "OccupancyResponse",
]
