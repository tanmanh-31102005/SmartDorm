"""
Forecast Pydantic schemas for energy time-series predictions.
"""
from typing import Optional, List, Union, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class RecentPoint(BaseModel):
    """Recent actual power observation."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    timestamp: Union[str, datetime] = Field(..., description="Timestamp of observation")
    powerW: float = Field(..., alias="power_w", ge=0.0, description="Observed power in Watts")


class ForecastRequest(BaseModel):
    """Request payload for POST /ml/forecast/energy and /predict/energy-forecast."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    buildingId: Optional[str] = Field(None, alias="building_id", description="Building identifier")
    roomId: Optional[str] = Field(None, alias="room_id", description="Room identifier")
    horizonHours: int = Field(24, alias="horizon_hours", ge=1, le=168, description="Prediction horizon in hours")
    interval: str = Field("1h", description="Resampling interval: '15m', '30m', '1h', '6h', '1d'")
    source: Optional[str] = Field("auto", description="'auto', 'fastapi', 'prophet', 'baseline'")
    recentPoints: Optional[List[RecentPoint]] = Field(None, alias="recent_points", description="Optional recent actual data")


class ForecastPoint(BaseModel):
    """Single point in the forecasted time series."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    timestamp: str = Field(..., description="ISO 8601 timestamp string")
    actualPowerW: Optional[float] = Field(None, alias="actual_power_w", description="Actual observed power (if available)")
    forecastPowerW: float = Field(..., alias="forecast_power_w", description="Predicted power in Watts")
    lowerBoundW: float = Field(..., alias="lower_bound_w", description="Lower confidence interval bound (Watts)")
    upperBoundW: float = Field(..., alias="upper_bound_w", description="Upper confidence interval bound (Watts)")
    confidence: float = Field(0.90, ge=0.0, le=1.0, description="Model confidence score (0.0 - 1.0)")


class ForecastSummary(BaseModel):
    """Statistical summary of the forecast horizon."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    totalForecastKwh: float = Field(..., alias="total_forecast_kwh", description="Total estimated energy consumption in kWh")
    peakPowerW: float = Field(..., alias="peak_power_w", description="Peak estimated power demand in Watts")
    peakTimestamp: str = Field(..., alias="peak_timestamp", description="Timestamp of peak power demand")
    averagePowerW: float = Field(..., alias="average_power_w", description="Average power demand across horizon in Watts")
    baselineComparisonPercent: Optional[float] = Field(
        0.0, 
        alias="baseline_comparison_percent", 
        description="Percentage difference compared to unmanaged baseline (e.g. -5.2% indicates energy saving)"
    )


class ForecastResponse(BaseModel):
    """Response returned to Backend and Frontend."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    buildingId: Optional[str] = Field(None, alias="building_id")
    roomId: Optional[str] = Field(None, alias="room_id")
    horizonHours: int = Field(24, alias="horizon_hours")
    interval: str = Field("1h")
    source: str = Field("FASTAPI_PROPHET", description="'FASTAPI_PROPHET' | 'BASELINE_PROXY' | 'SIMULATION_DATA'")
    generatedAt: str = Field(..., alias="generated_at")
    summary: ForecastSummary
    points: List[ForecastPoint]
