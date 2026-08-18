"""
Main FastAPI Application Entrypoint for SmartDorm ML Service.
Configures CORS, lifespan events, exception handling, and API routing.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.api.forecast import router as forecast_router
from app.api.anomaly import router as anomaly_router
from app.api.occupancy import router as occupancy_router
from app.api.health import router as health_router
from app.services.influx_reader import get_influx_reader
from app.services.sqlite_reader import get_sqlite_reader

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("ml-service.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown routines."""
    logger.info("==================================================")
    logger.info("  🚀 Starting SmartDorm Machine Learning Service")
    logger.info("  Port: %s | Host: %s", settings.ML_PORT, settings.ML_HOST)
    logger.info("  InfluxDB Target: %s", settings.INFLUXDB_URL)
    logger.info("  SQLite Database: %s", settings.get_sqlite_file_path())
    logger.info("==================================================")

    # Validate database reachability in background (non-blocking)
    influx = get_influx_reader()
    sqlite = get_sqlite_reader()
    logger.info("Database status on startup — InfluxDB: %s, SQLite: %s",
                "CONNECTED" if influx.is_available() else "OFFLINE/STANDBY",
                "AVAILABLE" if sqlite.is_available() else "NOT FOUND/STANDBY")

    yield

    logger.info("🛑 SmartDorm ML Service shutting down gracefully.")


app = FastAPI(
    title="SmartDorm ML Service",
    description="Machine Learning Microservice for Energy Forecasting, Device Anomaly Detection, and Room Occupancy Inference.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS Middleware
origins = settings.get_cors_origins_list()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom validation error response."""
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Unprocessable Entity",
            "message": "Invalid request schema or parameters",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all unhandled exception handler."""
    logger.error("Unhandled exception on %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred during model processing.",
            "details": str(exc),
        },
    )


# Root landing endpoint
@app.get("/", tags=["General"])
async def root():
    """Root metadata endpoint."""
    return {
        "service": "SmartDorm ML Service",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/ml/health",
        "endpoints": {
            "energy_forecast": "POST /ml/forecast/energy",
            "device_anomaly": "POST /ml/anomaly/device",
            "room_occupancy": "POST /ml/predict/occupancy",
            "model_status": "GET /ml/model-status",
        },
    }


# Include API Routers
app.include_router(forecast_router)
app.include_router(anomaly_router)
app.include_router(occupancy_router)
app.include_router(health_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.ML_HOST, port=settings.ML_PORT, reload=True)
