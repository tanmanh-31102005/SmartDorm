"""
Normalized Telemetry Schema and Contracts for SmartDorm IoT & Wokwi Simulation Data.
Supports backward compatibility across WOKWI, SIMULATOR, and future REAL_HARDWARE sources.
"""
from typing import Optional, Literal, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict, AliasChoices


class NormalizedTelemetry(BaseModel):
    """
    Standardized, hardware-agnostic telemetry contract for SmartDorm.
    Preserves backward compatibility with legacy snake_case while establishing rigorous provenance and ML isolation tags.
    """
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    # Provenance and Dataset Isolation Metadata
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 UTC timestamp of measurement"
    )
    source: Literal["WOKWI", "SIMULATOR", "REAL_HARDWARE"] = Field(
        default="WOKWI",
        description="Origin source of the telemetry"
    )
    simulationRunId: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("simulationRunId", "simulation_run_id"),
        description="Unique identifier for the simulation session"
    )
    scenarioId: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("scenarioId", "scenario_id"),
        description="Identifier of active behavioral/emergency scenario if injected"
    )
    datasetEligible: bool = Field(
        default=False,
        validation_alias=AliasChoices("datasetEligible", "dataset_eligible"),
        description="Strict isolation flag: Only True after passing Data Quality Gate"
    )

    # Topology & Device Mapping
    buildingId: str = Field(
        ..., 
        validation_alias=AliasChoices("buildingId", "building_id", "building"),
        description="Building identifier, e.g., 'A', 'B'"
    )
    roomId: str = Field(
        ..., 
        validation_alias=AliasChoices("roomId", "room_id", "room"),
        description="Room identifier or number, e.g., '101', 'A-101'"
    )
    deviceId: str = Field(
        ..., 
        validation_alias=AliasChoices("deviceId", "device_id"),
        description="Unique ESP32 device identifier, e.g., 'ESP32_A_1_101'"
    )
    deviceType: str = Field(
        default="ESP32", 
        validation_alias=AliasChoices("deviceType", "device_type"),
        description="Microcontroller or Gateway type"
    )

    # Environmental Micro-climate (DHT22 & MQ-2 Gas/Smoke)
    temperatureC: float = Field(
        ..., 
        validation_alias=AliasChoices("temperatureC", "temperature_c", "temperature"),
        description="Room ambient temperature in Celsius [15.0 - 50.0]"
    )
    humidityPct: float = Field(
        ..., 
        validation_alias=AliasChoices("humidityPct", "humidity_pct", "humidity"),
        description="Relative ambient humidity percentage [20.0 - 100.0]"
    )
    gasRaw: float = Field(
        default=15.0, 
        validation_alias=AliasChoices("gasRaw", "gas_raw", "gas_level", "gasLevel"),
        description="MQ-2 raw analog reading or percentage [0.0 - 100.0]"
    )
    smokeRaw: Optional[float] = Field(
        default=None, 
        validation_alias=AliasChoices("smokeRaw", "smoke_raw", "smoke_level"),
        description="MQ-2 smoke density reading"
    )

    # Electrical Sub-metering & Load Analysis
    powerW: float = Field(
        ..., 
        ge=0.0, 
        validation_alias=AliasChoices("powerW", "power_w", "power"),
        description="Instantaneous power consumption in Watts"
    )
    energyKwhCumulative: float = Field(
        default=0.0, 
        ge=0.0, 
        validation_alias=AliasChoices("energyKwhCumulative", "energy_kwh_cumulative", "energy_kwh", "energyKwh"),
        description="Monotonically increasing cumulative sub-meter energy in kWh"
    )
    energyKwhDelta: float = Field(
        default=0.0, 
        ge=0.0, 
        validation_alias=AliasChoices("energyKwhDelta", "energy_kwh_delta", "delta_energy_kwh"),
        description="Discrete energy consumed within current sampling step in kWh"
    )
    voltageV: Optional[float] = Field(
        default=220.0, 
        validation_alias=AliasChoices("voltageV", "voltage_v", "voltage"),
        description="Mains AC voltage in Volts"
    )
    currentA: Optional[float] = Field(
        default=None, 
        validation_alias=AliasChoices("currentA", "current_a", "current"),
        description="Calculated or measured AC current in Amperes"
    )

    # Actuator & Security States
    lightState: bool = Field(
        default=False, 
        validation_alias=AliasChoices("lightState", "light_state"),
        description="Primary ceiling/desk lighting state"
    )
    fanState: bool = Field(
        default=False, 
        validation_alias=AliasChoices("fanState", "fan_state"),
        description="Ceiling/wall ventilation fan state"
    )
    socketState: Optional[bool] = Field(
        default=None, 
        validation_alias=AliasChoices("socketState", "socket_state"),
        description="Auxiliary smart socket state"
    )
    doorState: Literal["LOCKED", "OPEN", "CLOSED"] = Field(
        default="LOCKED", 
        validation_alias=AliasChoices("doorState", "door_state"),
        description="Electronic door latch state"
    )

    # Occupancy Ground Truth & Signals
    occupancySignal: Optional[bool] = Field(
        default=None, 
        validation_alias=AliasChoices("occupancySignal", "occupancy_signal"),
        description="Live occupancy heuristic proxy (light/fan/motion)"
    )
    occupancyGroundTruth: Optional[int] = Field(
        default=None, 
        ge=0,
        validation_alias=AliasChoices("occupancyGroundTruth", "occupancy_ground_truth", "occupancy"),
        description="True headcount of residents in room (Simulated Ground Truth)"
    )
    occupancyLabelType: Optional[Literal["SIMULATED_GROUND_TRUTH", "VERIFIED_OPERATIONAL"]] = Field(
        default="SIMULATED_GROUND_TRUTH",
        validation_alias=AliasChoices("occupancyLabelType", "occupancy_label_type"),
        description="Label certification status"
    )
    rfidEvent: Optional[str] = Field(
        default=None, 
        validation_alias=AliasChoices("rfidEvent", "rfid_event"),
        description="Recent RFID swipe event: 'ENTRY_GRANTED', 'EXIT', 'ACCESS_DENIED'"
    )

    # Diagnostic & Wireless Telemetry
    wifiRssi: Optional[int] = Field(
        default=-65, 
        validation_alias=AliasChoices("wifiRssi", "wifi_rssi"),
        description="WiFi Received Signal Strength Indicator in dBm"
    )
    deviceUptimeSec: Optional[int] = Field(
        default=0, 
        ge=0, 
        validation_alias=AliasChoices("deviceUptimeSec", "device_uptime_sec"),
        description="Uptime since ESP32 boot in seconds"
    )

    # Legacy & Ergonomic Property Aliases
    @property
    def building(self) -> str:
        return self.buildingId

    @property
    def room(self) -> str:
        return self.roomId

    @property
    def gasLevel(self) -> float:
        return self.gasRaw

    @property
    def gas_level(self) -> float:
        return self.gasRaw

    @property
    def temperature(self) -> float:
        return self.temperatureC

    @property
    def humidity(self) -> float:
        return self.humidityPct

    @property
    def power_w(self) -> float:
        return self.powerW

    @property
    def energy_kwh(self) -> float:
        return self.energyKwhCumulative

    @property
    def occupancy_signal(self) -> Optional[bool]:
        return self.occupancySignal

    @property
    def light_state(self) -> bool:
        return self.lightState

    @property
    def fan_state(self) -> bool:
        return self.fanState


class AggregatedFeatures(BaseModel):
    """Aggregated temporal feature vector for hourly or multi-hour forecasting."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    timestamp: str
    roomId: str = Field(..., validation_alias=AliasChoices("roomId", "room_id", "room"))
    buildingId: str = Field(..., validation_alias=AliasChoices("buildingId", "building_id", "building"))
    avgPowerW: float = Field(..., validation_alias=AliasChoices("avgPowerW", "avg_power_w"))
    totalEnergyKwh: float = Field(..., validation_alias=AliasChoices("totalEnergyKwh", "total_energy_kwh"))
    avgTemperatureC: float = Field(..., validation_alias=AliasChoices("avgTemperatureC", "avg_temperature_c"))
    avgHumidityPct: float = Field(..., validation_alias=AliasChoices("avgHumidityPct", "avg_humidity_pct"))
    occupancyRatio: float = Field(default=0.0, validation_alias=AliasChoices("occupancyRatio", "occupancy_ratio"))
    activeDeviceHours: float = Field(default=0.0, validation_alias=AliasChoices("activeDeviceHours", "active_device_hours"))
    hourOfDay: int = Field(..., validation_alias=AliasChoices("hourOfDay", "hour_of_day"))
    dayOfWeek: int = Field(..., validation_alias=AliasChoices("dayOfWeek", "day_of_week"))
    isWeekend: bool = Field(..., validation_alias=AliasChoices("isWeekend", "is_weekend"))


class TelemetryBatch(BaseModel):
    """Batch container for multi-room / multi-step telemetry ingestion."""
    source: Literal["WOKWI", "SIMULATOR", "REAL_HARDWARE"] = "WOKWI"
    simulationRunId: Optional[str] = None
    records: List[NormalizedTelemetry] = Field(default_factory=list)
