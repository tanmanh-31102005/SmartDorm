"""
Occupancy Prediction Pydantic schemas for multi-modal room state inference.
"""
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class RoomOccupancyInput(BaseModel):
    """Input telemetry for a room evaluated by Occupancy Classifier."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str = Field(..., description="Room ID")
    roomNumber: Optional[str] = Field("", alias="room_number", description="Room display number (e.g. '101')")
    buildingName: Optional[str] = Field("Building A", alias="building_name")
    floor: Optional[int] = Field(1, ge=1, le=20)
    
    motionDetected: Optional[bool] = Field(False, alias="motion_detected", description="PIR motion sensor status")
    powerW: Optional[float] = Field(0.0, alias="power_w", ge=0.0, description="Active power consumption in Watts")
    activeDevicesCount: Optional[int] = Field(0, alias="active_devices_count", ge=0, description="Number of currently active devices")
    lastAccessMinutesAgo: Optional[float] = Field(None, alias="last_access_minutes_ago", description="Minutes since last RFID card swipe")
    gasLevel: Optional[float] = Field(None, alias="gas_level")
    temperature: Optional[float] = Field(None)


class OccupancyRequest(BaseModel):
    """Request payload containing rooms to evaluate."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    rooms: List[RoomOccupancyInput] = Field(..., description="List of rooms to infer occupancy for")
    buildingId: Optional[str] = Field(None, alias="building_id")


class OccupancyRoomResult(BaseModel):
    """Single room occupancy prediction result."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    roomId: str = Field(..., alias="room_id")
    roomNumber: str = Field(..., alias="room_number")
    buildingName: str = Field(..., alias="building_name")
    floor: int = Field(1)
    
    occupiedProbability: float = Field(..., alias="occupied_probability", ge=0.0, le=1.0, description="Probability that the room is occupied (0.0 to 1.0)")
    predictedState: str = Field(..., alias="predicted_state", description="'OCCUPIED' | 'VACANT'")
    confidence: float = Field(0.90, ge=0.0, le=1.0, description="Model inference confidence")
    source: str = Field("ML_MODEL", description="'ML_MODEL' | 'RULE_PROXY'")
    
    lastMovementAt: Optional[Union[str, datetime]] = Field(None, alias="last_movement_at")
    activeDevicesCount: int = Field(0, alias="active_devices_count")
    currentPowerW: float = Field(0.0, alias="current_power_w")
    updatedAt: Union[str, datetime] = Field(..., alias="updated_at")
    explanation: Optional[str] = Field(None, description="Human-readable decision explanation")


class OccupancyResponse(BaseModel):
    """Response payload for POST /ml/predict/occupancy and /predict/occupancy."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    buildingId: Optional[str] = Field(None, alias="building_id")
    totalRooms: int = Field(..., alias="total_rooms")
    occupiedCount: int = Field(..., alias="occupied_count")
    vacantCount: int = Field(..., alias="vacant_count")
    averageOccupancyRate: float = Field(..., alias="average_occupancy_rate", ge=0.0, le=100.0, description="Occupancy percentage across rooms (0.0 - 100.0%)")
    occupancy: List[OccupancyRoomResult] = Field(..., description="List of room occupancy predictions")
    rooms: Optional[List[OccupancyRoomResult]] = Field(None, description="Alias for occupancy list for client compatibility")
    timestamp: str
