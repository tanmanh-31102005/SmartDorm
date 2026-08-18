"""
Anomaly Detection Pydantic schemas for device health monitoring.
"""
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DeviceInput(BaseModel):
    """Input telemetry for a single device evaluated by Isolation Forest."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str = Field(..., description="Device ID or identifier")
    name: str = Field(..., description="Device display name (e.g. 'Đèn trần P101')")
    type: str = Field(..., description="Device type: 'LIGHT', 'FAN', 'AIR_CON', 'DOOR_LOCK', 'BUZZER'")
    roomId: str = Field(..., alias="room_id", description="Associated room ID")
    roomNumber: Optional[str] = Field(None, alias="room_number")
    buildingName: Optional[str] = Field(None, alias="building_name")
    
    powerW: Optional[float] = Field(0.0, alias="power_w", ge=0.0, description="Current power draw in Watts")
    uptimeHours: Optional[float] = Field(0.0, alias="uptime_hours", ge=0.0, description="Hours continuous runtime")
    failureRate: Optional[float] = Field(0.0, alias="failure_rate", ge=0.0, le=1.0, description="Command failure or packet drop rate")
    temperature: Optional[float] = Field(28.0, description="Device surface or ambient temperature in C")
    responseMs: Optional[float] = Field(45.0, alias="response_ms", ge=0.0, description="MQTT command ACK latency in ms")


# Alias for backward compatibility
DeviceTelemetryInput = DeviceInput


class AnomalyRequest(BaseModel):
    """Request payload containing a list of devices to evaluate."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    devices: List[DeviceInput] = Field(..., description="List of devices to evaluate")


class DeviceAnomaly(BaseModel):
    """Result of anomaly evaluation for a single device."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str = Field(..., description="Unique anomaly record ID")
    deviceId: Optional[str] = Field(None, alias="device_id")
    deviceName: str = Field(..., alias="device_name")
    roomId: str = Field(..., alias="room_id")
    roomNumber: Optional[str] = Field(None, alias="room_number")
    buildingName: Optional[str] = Field(None, alias="building_name")
    
    anomaly: bool = Field(False, description="True if classified as anomaly")
    anomalyScore: float = Field(..., alias="anomaly_score", ge=0.0, le=1.0, description="Anomaly score scaled between 0.0 and 1.0")
    severity: str = Field("NORMAL", description="'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL'")
    
    features: Dict[str, Any] = Field(default_factory=dict, description="Feature dictionary snapshot")
    status: str = Field("OPEN", description="'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'")
    recommendation: Optional[str] = Field(None, description="Actionable recommendation message in Vietnamese")
    detectedAt: Union[str, datetime] = Field(..., alias="detected_at")
    evidence: Optional[Dict[str, Any]] = Field(None, description="Detailed explanation for why this was flagged")


class DeviceAnomalyResponse(BaseModel):
    """Response payload for POST /ml/anomaly/device and /predict/anomalies."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    anomalies: List[DeviceAnomaly] = Field(..., description="List of detected anomalies or evaluations")
    totalEvaluated: int = Field(..., alias="total_evaluated")
    anomalyCount: int = Field(..., alias="anomaly_count")
    timestamp: str
