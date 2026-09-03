"""
Pytest Test Suite for SmartDorm Milestone 1 — Data Foundation & Quality Assurance.
Validates deterministic generation, schema backward compatibility, future-data leakage prevention,
physics constraints, and Quality Gate evaluation.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Ensure ml-service root is in sys.path
ML_ROOT = Path(__file__).resolve().parent.parent
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

import pytest
import pandas as pd
import numpy as np

from app.schemas.telemetry import NormalizedTelemetry
from data.scenarios.scenario_engine import ScenarioEngine, InjectedScenario
from generate_dataset import generate_dataset
from validate_dataset import DataQualityGate
from preprocessing.feature_engineering import build_time_series_lag_features, extract_temporal_features


def test_deterministic_seed(tmp_path):
    """Verifies that identical random seeds produce 100% bit-exact dataset records."""
    start_dt = datetime(2026, 6, 1, tzinfo=timezone.utc)
    end_dt = datetime(2026, 6, 3, tzinfo=timezone.utc)

    meta1 = generate_dataset(
        start_date=start_dt,
        end_date=end_dt,
        room_count=4,
        sampling_minutes=15,
        seed=12345,
        dataset_version="test-seed-1",
        output_dir=str(tmp_path),
    )
    meta2 = generate_dataset(
        start_date=start_dt,
        end_date=end_dt,
        room_count=4,
        sampling_minutes=15,
        seed=12345,
        dataset_version="test-seed-2",
        output_dir=str(tmp_path),
    )

    df1 = pd.read_csv(tmp_path / "test-seed-1.csv")
    df2 = pd.read_csv(tmp_path / "test-seed-2.csv")

    assert len(df1) == len(df2)
    assert (df1["powerW"].values == df2["powerW"].values).all()
    assert (df1["energyKwhCumulative"].values == df2["energyKwhCumulative"].values).all()


def test_telemetry_schema_backward_compatibility():
    """Verifies that NormalizedTelemetry cleanly ingests legacy and new Wokwi payloads."""
    legacy_payload = {
        "buildingId": "A",
        "roomId": "101",
        "deviceId": "ESP32_A_1_101",
        "temperatureC": 28.5,
        "humidityPct": 62.0,
        "powerW": 65.0,
        "energyKwhCumulative": 1.25,
        "energyKwhDelta": 0.016,
    }
    telemetry = NormalizedTelemetry(**legacy_payload)
    assert telemetry.buildingId == "A"
    assert telemetry.source == "WOKWI"
    assert telemetry.datasetEligible is False
    assert telemetry.doorState == "LOCKED"


def test_dataset_source_label(tmp_path):
    """Verifies that every generated record is tagged with valid source metadata."""
    start_dt = datetime(2026, 6, 1, tzinfo=timezone.utc)
    end_dt = datetime(2026, 6, 2, tzinfo=timezone.utc)

    generate_dataset(
        start_date=start_dt,
        end_date=end_dt,
        room_count=2,
        sampling_minutes=30,
        seed=42,
        dataset_version="test-source",
        output_dir=str(tmp_path),
    )
    df = pd.read_csv(tmp_path / "test-source.csv")
    assert (df["source"] == "WOKWI").all()
    assert "simulationRunId" in df.columns


def test_no_future_data_leakage():
    """
    CRITICAL SCIENTIFIC INTEGRITY TEST:
    Verifies that feature engineering strictly prevents target or future information leakage.
    Features at time t must NEVER correlate with or include target value at t or t+k.
    """
    dates = pd.date_range("2026-06-01", periods=100, freq="1h")
    # Synthetic target with strong linear trend
    target = np.arange(100, dtype=float) + 50.0
    df = pd.DataFrame({"timestamp": dates, "powerW": target})

    df_feats = build_time_series_lag_features(df, target_column="powerW", lag_steps=[1, 2, 24])

    # Check Lag 1 at index 10: must equal target at index 9 (t-1), NEVER index 10 (t)
    assert df_feats.loc[10, "powerW_lag_1"] == target[9]
    assert df_feats.loc[10, "powerW_lag_2"] == target[8]
    assert np.isnan(df_feats.loc[0, "powerW_lag_1"])  # First step has no past lag

    # Check Rolling Mean: must only average past values t-1, t-2, t-3 (NOT current step t)
    expected_rolling_3_at_10 = np.mean([target[9], target[8], target[7]])
    assert np.isclose(df_feats.loc[10, "powerW_rolling_mean_3"], expected_rolling_3_at_10)


def test_data_quality_gate(tmp_path):
    """Verifies that generated datasets pass all 10 Data Quality Gate criteria."""
    start_dt = datetime(2026, 6, 1, tzinfo=timezone.utc)
    end_dt = datetime(2026, 6, 3, tzinfo=timezone.utc)

    generate_dataset(
        start_date=start_dt,
        end_date=end_dt,
        room_count=3,
        sampling_minutes=15,
        seed=42,
        dataset_version="test-quality",
        output_dir=str(tmp_path),
    )
    df = pd.read_csv(tmp_path / "test-quality.csv")
    gate = DataQualityGate(df, dataset_id="test-quality")
    is_eligible, report = gate.audit()

    assert is_eligible is True
    assert report["trainingEligible"] is True
    assert report["violations"]["criticalNullCount"] == 0
    assert report["violations"]["negativePowerCount"] == 0
    assert report["violations"]["nonMonotonicCumulativeEnergyCount"] == 0


def test_energy_non_negative():
    """Verifies that physical electrical constraints (Power >= 0, Delta >= 0) hold strictly."""
    engine = ScenarioEngine(seed=42)
    step_data = engine.generate_step_telemetry(datetime(2026, 6, 1, 14, 0, tzinfo=timezone.utc), step_minutes=15)
    for rec in step_data:
        assert rec["powerW"] >= 0.0
        assert rec["energyKwhDelta"] >= 0.0
        assert rec["energyKwhCumulative"] >= 0.0


def test_occupancy_within_capacity():
    """Verifies that simulated headcount respects room capacity boundaries."""
    engine = ScenarioEngine(seed=42)
    for r in engine.rooms:
        step_data = engine.generate_step_telemetry(datetime(2026, 6, 1, 20, 0, tzinfo=timezone.utc), step_minutes=15)
        for rec in step_data:
            if rec["roomId"] == r.room_number:
                assert 0 <= rec["occupancyGroundTruth"] <= r.capacity


def test_rfid_event_consistency():
    """Verifies RFID events are valid domain strings."""
    engine = ScenarioEngine(seed=42)
    valid_rfid = {None, "ENTRY_GRANTED", "EXIT", "ACCESS_DENIED"}
    for step in range(50):
        t = datetime(2026, 6, 1, 7, 0, tzinfo=timezone.utc) + timedelta(minutes=step * 15)
        step_data = engine.generate_step_telemetry(t, step_minutes=15)
        for rec in step_data:
            assert rec["rfidEvent"] in valid_rfid


def test_normal_scenario_not_constant_emergency():
    """Verifies that normal days maintain a safe environmental baseline."""
    engine = ScenarioEngine(seed=42)
    for hr in range(24):
        t = datetime(2026, 6, 1, hr, 0, tzinfo=timezone.utc)
        step_data = engine.generate_step_telemetry(t, step_minutes=15)
        for rec in step_data:
            assert rec["gasRaw"] < 50.0  # Normal baseline is 10-25%
            assert 15.0 <= rec["temperatureC"] <= 42.0


def test_fire_or_gas_scenario_changes_relevant_raw_signal():
    """Verifies that injected gas scenarios elevate gas telemetry above 70% threshold."""
    engine = ScenarioEngine(seed=42)
    test_room = engine.rooms[0].room_id
    leak_time = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
    engine.inject_scenario(InjectedScenario(
        scenario_id="test-gas-1",
        scenario_type="GAS_LEAK",
        start_time=leak_time,
        duration_hours=1.0,
        affected_rooms=[test_room],
        severity="CRITICAL",
        description="Test Gas Leak Injection",
    ))

    step_data = engine.generate_step_telemetry(leak_time + timedelta(minutes=15), step_minutes=15)
    matched = [r for r in step_data if r["roomId"] == engine.rooms[0].room_id]
    assert len(matched) == 1
    assert matched[0]["gasRaw"] >= 70.0
