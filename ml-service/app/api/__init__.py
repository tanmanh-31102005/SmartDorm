"""
API routers package for SmartDorm ML Service.
"""
from app.api.forecast import router as forecast_router
from app.api.anomaly import router as anomaly_router
from app.api.occupancy import router as occupancy_router
from app.api.health import router as health_router

__all__ = [
    "forecast_router",
    "anomaly_router",
    "occupancy_router",
    "health_router",
]
