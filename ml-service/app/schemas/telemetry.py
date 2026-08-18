"""
Telemetry and Features Pydantic schemas.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class NormalizedTelemetry(BaseModel):
    """Normalized payload sent from ESP32 / Simulator / Backend to InfluxDB or ML."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    building: str = Field(..., description="Building identifier, e.g. 'A'")
    floor: str = Field(..., description="Floor number or string, e.g. '1'")
    room: str = Field(..., description="Room number, e.g. '101'")
    deviceId: Optional[str] = Field(None, alias="device_id", description="ESP32 hardware or logical ID")
    source: Optional[str] = Field("SIMULATION_DATA", description="Data source tag: 'WOKWI', 'SIMULATOR', 'REAL_DEVICE'")
    
    # Environment metrics
    temperature: Optional[float] = Field(None, ge=-20.0, le=80.0, description="Temperature in Celsius")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Relative Humidity %")
    gasLevel: Optional[float] = Field(None, alias="gas_level", ge=0.0, le=100.0, description="Gas level %")
    
    # Energy metrics
    powerW: Optional[float] = Field(None, alias="power_w", ge=0.0, description="Instantaneous power in Watts")
    energyKwh: Optional[float] = Field(None, alias="energy_kwh", ge=0.0, description="Cumulative energy in kWh")
    
    # States
    occupancySignal: Optional[bool] = Field(None, alias="occupancy_signal", description="Hardware PIR or activity flag")
    lightState: Optional[bool] = Field(None, alias="light_state", description="Light relay status")
    fanState: Optional[bool] = Field(None, alias="fan_state", description="Fan relay status")
    doorState: Optional[str] = Field(None, alias="door_state", description="Door lock status: 'locked' | 'open'")
    
    timestamp: Optional[Any] = Field(None, description="ISO timestamp or unix epoch")


class AggregatedFeatures(BaseModel):
    """Aggregated windowed features for analysis or model input."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    roomId: str = Field(..., alias="room_id")
    windowStart: str = Field(..., alias="window_start")
    windowEnd: str = Field(..., alias="window_end")
    
    meanPowerW: float = Field(0.0, alias="mean_power_w")
    maxPowerW: float = Field(0.0, alias="max_power_w")
    minPowerW: float = Field(0.0, alias="min_power_w")
    totalKwh: float = Field(0.0, alias="total_kwh")
    
    avgTemperature: Optional[float] = Field(None, alias="avg_temperature")
    avgHumidity: Optional[float] = Field(None, alias="avg_humidity")
    maxGasLevel: Optional[float] = Field(None, alias="max_gas_level")
    
    motionTriggerCount: int = Field(0, alias="motion_trigger_count")
    rfidEventCount: int = Field(0, alias="rfid_event_count")
