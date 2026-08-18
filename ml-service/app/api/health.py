"""
Health Check, Drift Diagnostics, and Model Retraining API Endpoints.
Monitors operational readiness, database connections, data drift, and cached model states.
"""
import time
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.services.influx_reader import get_influx_reader
from app.services.sqlite_reader import get_sqlite_reader
from app.services.model_registry import get_model_registry
from app.services.drift_detector import get_drift_detector

logger = logging.getLogger("ml-service.api.health")

router = APIRouter(tags=["Health & Monitoring"])

SERVICE_START_TIME = time.time()


@router.get(
    "/ml/health",
    summary="Service Health Check",
    description="Returns overall health status, system uptime, and database connectivity flags."
)
@router.get(
    "/health",
    include_in_schema=False,
)
async def check_health() -> Dict[str, Any]:
    """Health check endpoint for Kubernetes, Docker, and Backend polling."""
    influx = get_influx_reader()
    sqlite = get_sqlite_reader()
    registry = get_model_registry()

    uptime_sec = round(time.time() - SERVICE_START_TIME, 1)
    influx_online = influx.is_available()
    sqlite_online = sqlite.is_available()

    models_status = {
        name: meta["status"]
        for name, meta in registry.metadata.items()
    }

    return {
        "status": "healthy",
        "service": "smartdorm-ml-service",
        "version": "1.0.0",
        "uptimeSeconds": uptime_sec,
        "connections": {
            "influxdb": influx_online,
            "sqlite": sqlite_online,
        },
        "models": models_status,
    }


@router.get(
    "/ml/model-status",
    summary="Model Registry Status and Performance Metrics",
    description="Returns detailed metadata, versions, metrics, drift status, and latency for all registered models."
)
@router.get(
    "/model-status",
    include_in_schema=False,
)
async def get_model_status() -> List[Dict[str, Any]]:
    """Detailed model registry status endpoint."""
    registry = get_model_registry()
    return registry.get_all_models_status()


@router.get(
    "/ml/drift-status",
    summary="Data Drift and Stale Model Diagnostics",
    description="Returns staleness flags, residual error drift metrics, and retraining recommendations."
)
async def get_drift_status() -> List[Dict[str, Any]]:
    """Model staleness & drift status endpoint."""
    registry = get_model_registry()
    drift_detector = get_drift_detector()
    return drift_detector.check_all_models(registry.metadata)


@router.post(
    "/ml/models/retrain",
    summary="Trigger Model Retraining Pipeline",
    description="Triggers training pipeline for all or specific models in the background."
)
async def trigger_retraining(background_tasks: BackgroundTasks, model_name: str = None) -> Dict[str, Any]:
    """Triggers automated model retraining."""
    from training.retraining_job import run_full_retraining_pipeline
    background_tasks.add_task(run_full_retraining_pipeline)
    return {
        "success": True,
        "message": "Pipeline tái huấn luyện mô hình đã được khởi chạy ngầm.",
        "target": model_name or "ALL_MODELS",
        "triggeredAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
