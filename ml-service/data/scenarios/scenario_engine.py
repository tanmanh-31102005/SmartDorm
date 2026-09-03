"""
Scenario Engine for Smart Dormitory Behavior and Wokwi Telemetry Synthesis.
Generates realistic, physically-grounded, correlated multi-room IoT telemetry.
Simulates diurnal student routines, stochastic activities, environmental fluctuations,
and controlled operational/emergency scenario injections.
"""
import math
import random
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field


@dataclass
class ResidentProfile:
    """Represents an individual student's habit profile."""
    resident_id: str
    card_id: str
    habit: str  # 'EARLY_BIRD', 'NIGHT_OWL', 'REGULAR', 'STUDIOUS'
    wake_hour: float
    sleep_hour: float
    weekend_wake_hour: float


@dataclass
class RoomConfig:
    """Configuration definition for a single dormitory room."""
    room_id: str
    room_number: str
    building_id: str
    floor: int
    capacity: int = 4
    device_id: str = ""
    residents: List[ResidentProfile] = field(default_factory=list)
    base_temp_offset: float = 0.0
    base_humid_offset: float = 0.0
    has_air_con: bool = False


@dataclass
class InjectedScenario:
    """Represents a time-bound operational or anomaly scenario."""
    scenario_id: str
    scenario_type: str
    start_time: datetime
    duration_hours: float
    affected_rooms: List[str]
    severity: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description: str


class ScenarioEngine:
    """
    Simulates correlated dormitory telemetry with strict physical and behavioral rules:
    - 06:00–07:30: Wake-up routine; occupancy high; lights/fans on.
    - 07:30–08:00: Class departure; RFID exits; occupancy drops.
    - 08:00–11:30: Class hours; low occupancy (0-1); low power.
    - 12:00–13:30: Lunch break return; partial occupancy; fan on.
    - 13:30–17:00: Afternoon class/library; low-medium occupancy.
    - 17:00–19:00: Dinner & return; RFID entries; high occupancy.
    - 19:00–22:30: Evening study & relaxation; peak power usage.
    - 22:30–00:00: Wind-down; lights turn off.
    - 00:00–06:00: Sleep; full occupancy; low power (standby + fan).
    """

    def __init__(self, seed: int = 42, rooms: Optional[List[RoomConfig]] = None):
        self.seed = seed
        self.rng = random.Random(seed)
        self.rooms = rooms or self._create_default_dormitory_topology()
        self.injected_scenarios: List[InjectedScenario] = []
        
        # State tracking per room
        self.room_states: Dict[str, Dict[str, Any]] = {}
        for r in self.rooms:
            self.room_states[r.room_id] = {
                "energy_cumulative_kwh": self.rng.uniform(10.0, 50.0),
                "light_state": False,
                "fan_state": False,
                "aircon_state": False,
                "door_state": "LOCKED",
                "current_occupancy": 0,
                "uptime_sec": 0,
            }

    def _create_default_dormitory_topology(self) -> List[RoomConfig]:
        """Creates a standardized 24-room multi-building dormitory topology."""
        topology = []
        card_counter = 1000
        buildings = ["A", "B"]
        floors = [1, 2, 3]
        rooms_per_floor = 4  # 2 * 3 * 4 = 24 rooms

        for b in buildings:
            for f in floors:
                for r_idx in range(1, rooms_per_floor + 1):
                    room_num = f"{f}0{r_idx}"
                    room_id = f"{b}-{room_num}"
                    dev_id = f"ESP32_{b}_{f}_{room_num}"
                    
                    capacity = 4 if r_idx <= 3 else 6
                    residents = []
                    for res_idx in range(capacity):
                        card_counter += 1
                        habit = ["REGULAR", "EARLY_BIRD", "NIGHT_OWL", "STUDIOUS"][res_idx % 4]
                        wake = 6.0 if habit == "EARLY_BIRD" else (8.0 if habit == "NIGHT_OWL" else 6.5)
                        sleep = 22.5 if habit == "EARLY_BIRD" else (0.5 if habit == "NIGHT_OWL" else 23.5)
                        residents.append(ResidentProfile(
                            resident_id=f"SV{b}{room_num}_{res_idx+1}",
                            card_id=f"CARD_{b}{card_counter:04X}",
                            habit=habit,
                            wake_hour=wake,
                            sleep_hour=sleep,
                            weekend_wake_hour=wake + 1.5,
                        ))

                    topology.append(RoomConfig(
                        room_id=room_id,
                        room_number=room_num,
                        building_id=b,
                        floor=f,
                        capacity=capacity,
                        device_id=dev_id,
                        residents=residents,
                        base_temp_offset=(self.rng.uniform(-0.8, 0.8)),
                        base_humid_offset=(self.rng.uniform(-3.0, 3.0)),
                        has_air_con=(f == 3 and r_idx == 4),  # Top floor suite
                    ))
        return topology

    def inject_scenario(self, scenario: InjectedScenario):
        """Registers an operational or safety anomaly scenario."""
        self.injected_scenarios.append(scenario)

    def generate_step_telemetry(
        self,
        current_time: datetime,
        step_minutes: int = 15,
        simulation_run_id: str = "sim-run-default",
    ) -> List[Dict[str, Any]]:
        """
        Generates one discrete step of normalized telemetry across all configured rooms.
        """
        step_records = []
        hour = current_time.hour + current_time.minute / 60.0
        dow = current_time.weekday()
        is_weekend = dow in [5, 6]
        step_hours = step_minutes / 60.0

        # Ambient Diurnal Weather Simulation
        # Daily peak temp at 14:00 (33°C), lowest at 05:00 (25°C)
        diurnal_rad = (hour - 14.0) * (2 * math.pi / 24.0)
        ambient_temp = 29.0 + 4.0 * math.cos(diurnal_rad) + self.rng.gauss(0, 0.25)
        ambient_humid = 70.0 - 15.0 * math.cos(diurnal_rad) + self.rng.gauss(0, 0.5)

        for room in self.rooms:
            state = self.room_states[room.room_id]
            state["uptime_sec"] += int(step_minutes * 60)

            # 1. Determine Active Injected Scenarios for this room
            active_scenarios = [
                s for s in self.injected_scenarios
                if s.start_time <= current_time <= (s.start_time + timedelta(hours=s.duration_hours))
                and (room.room_id in s.affected_rooms or not s.affected_rooms)
            ]
            primary_scenario = active_scenarios[0] if active_scenarios else None
            scenario_id = primary_scenario.scenario_id if primary_scenario else None
            scenario_type = primary_scenario.scenario_type if primary_scenario else ("WEEKEND" if is_weekend else "NORMAL_DAY")

            # 2. Simulate Realistic Occupancy Routine
            # Base probability of being present in room depending on schedule
            if is_weekend:
                if 0.0 <= hour < 8.0:
                    presence_prob = 0.95
                elif 8.0 <= hour < 12.0:
                    presence_prob = 0.70
                elif 12.0 <= hour < 18.0:
                    presence_prob = 0.55
                elif 18.0 <= hour < 23.5:
                    presence_prob = 0.85
                else:
                    presence_prob = 0.95
            else:
                if 0.0 <= hour < 6.5:
                    presence_prob = 0.98  # Sleep
                elif 6.5 <= hour < 7.5:
                    presence_prob = 0.90  # Waking up
                elif 7.5 <= hour < 11.5:
                    presence_prob = 0.10  # Morning class
                elif 11.5 <= hour < 13.5:
                    presence_prob = 0.65  # Lunch break
                elif 13.5 <= hour < 17.0:
                    presence_prob = 0.20  # Afternoon class
                elif 17.0 <= hour < 19.0:
                    presence_prob = 0.75  # Return from campus
                elif 19.0 <= hour < 22.5:
                    presence_prob = 0.90  # Study / Activity
                else:
                    presence_prob = 0.95  # Late evening

            # Scenario overrides for occupancy
            if scenario_type == "HIGH_OCCUPANCY":
                presence_prob = 1.0
            elif scenario_type == "LOW_OCCUPANCY":
                presence_prob = 0.05

            # Calculate headcount
            headcount = sum(1 for _ in room.residents if self.rng.random() < presence_prob)
            state["current_occupancy"] = min(room.capacity, headcount)
            has_occupants = state["current_occupancy"] > 0

            # 3. Simulate Actuator States (Light & Fan)
            rfid_event = None
            if has_occupants:
                # Lights on if dark outside or evening study (18:00 to 23:00)
                is_dark = (hour >= 18.0 or hour < 6.5)
                state["light_state"] = is_dark and (hour < 23.5 or self.rng.random() < 0.2)
                # Fan on if ambient temp > 28°C
                state["fan_state"] = (ambient_temp > 28.0) or (self.rng.random() < 0.6)
                if room.has_air_con and ambient_temp > 31.0:
                    state["aircon_state"] = True
                else:
                    state["aircon_state"] = False
                
                if self.rng.random() < 0.15:
                    rfid_event = "ENTRY_GRANTED"
            else:
                # Room empty
                state["light_state"] = False
                state["fan_state"] = False
                state["aircon_state"] = False
                if self.rng.random() < 0.10:
                    rfid_event = "EXIT"

            # Scenario Anomaly Injections on Actuators
            if scenario_type in ["LIGHT_FORGOTTEN_ON", "ENERGY_WASTE"]:
                state["light_state"] = True
            if scenario_type in ["FAN_FORGOTTEN_ON", "ENERGY_WASTE"]:
                state["fan_state"] = True
            if scenario_type == "INVALID_RFID":
                rfid_event = "ACCESS_DENIED"

            # 4. Calculate Physically Bounded Electrical Power (Watts)
            # Standby (ESP32 + sensors) = 5W
            # 3 Lights = 20W each -> 60W max
            # Fan = 60W
            # AC = 1200W
            power_w = 5.0
            if state["light_state"]:
                power_w += 60.0
            if state["fan_state"]:
                power_w += 60.0
            if state.get("aircon_state", False):
                power_w += 1200.0

            # Add resident personal devices (Laptop ~45W, phone ~10W)
            if has_occupants:
                power_w += state["current_occupancy"] * self.rng.uniform(15.0, 50.0)

            # Scenario Anomaly: Electrical Power Spike
            if scenario_type == "POWER_SPIKE":
                power_w += self.rng.uniform(1000.0, 1600.0)

            # Physical safety clamp: power >= 0
            power_w = max(0.0, round(power_w + self.rng.gauss(0, 1.5), 1))

            # Strictly integrate Energy Delta (kWh) & Monotonic Cumulative Energy (kWh)
            energy_delta_kwh = (power_w * step_hours) / 1000.0
            state["energy_cumulative_kwh"] += energy_delta_kwh

            # 5. Environment & Gas Signals
            temp_c = ambient_temp + room.base_temp_offset + (0.5 if state["light_state"] else 0.0)
            humid_pct = ambient_humid + room.base_humid_offset
            gas_raw = self.rng.uniform(12.0, 22.0)
            smoke_raw = self.rng.uniform(5.0, 15.0)

            # Scenario Anomaly: Gas Leak or Fire
            if scenario_type == "GAS_LEAK":
                gas_raw = self.rng.uniform(75.0, 95.0)
            elif scenario_type in ["FIRE", "SMOKE"]:
                gas_raw = self.rng.uniform(80.0, 98.0)
                smoke_raw = self.rng.uniform(70.0, 95.0)
                temp_c += self.rng.uniform(15.0, 25.0)

            # Scenario Anomaly: Sensor Dropout / Failure
            if scenario_type == "SENSOR_DROPOUT":
                temp_c = 0.0  # Or None
                humid_pct = 0.0

            # Clamping within realistic sensor limits
            temp_c = max(15.0, min(50.0, round(temp_c, 1))) if temp_c > 0 else 25.0
            humid_pct = max(20.0, min(100.0, round(humid_pct, 1))) if humid_pct > 0 else 60.0
            gas_raw = max(0.0, min(100.0, round(gas_raw, 1)))
            smoke_raw = max(0.0, min(100.0, round(smoke_raw, 1)))

            # Build standardized record
            rec = {
                "timestamp": current_time.isoformat(),
                "source": "WOKWI",
                "simulationRunId": simulation_run_id,
                "scenarioId": scenario_id,
                "datasetEligible": False,  # Eligible only after passing Data Quality Gate

                "buildingId": room.building_id,
                "roomId": room.room_id,
                "deviceId": room.device_id,
                "deviceType": "ESP32",

                "temperatureC": temp_c,
                "humidityPct": humid_pct,
                "gasRaw": gas_raw,
                "smokeRaw": smoke_raw,

                "powerW": power_w,
                "energyKwhCumulative": round(state["energy_cumulative_kwh"], 4),
                "energyKwhDelta": round(energy_delta_kwh, 5),
                "voltageV": 220.0,
                "currentA": round(power_w / 220.0, 2),

                "lightState": state["light_state"],
                "fanState": state["fan_state"],
                "socketState": state.get("aircon_state", False),
                "doorState": "CLOSED" if not rfid_event else ("OPEN" if rfid_event == "ENTRY_GRANTED" else "LOCKED"),

                "occupancySignal": has_occupants,
                "occupancyGroundTruth": state["current_occupancy"],
                "occupancyLabelType": "SIMULATED_GROUND_TRUTH",
                "rfidEvent": rfid_event,

                "wifiRssi": self.rng.randint(-75, -55),
                "deviceUptimeSec": state["uptime_sec"],
            }
            step_records.append(rec)

        return step_records
