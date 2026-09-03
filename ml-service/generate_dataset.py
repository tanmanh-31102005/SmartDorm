"""
CLI Dataset Generator for SmartDorm Wokwi Simulation Data.
Generates reproducible, versioned, multi-room time-series datasets with full provenance metadata.

Usage:
  python generate_dataset.py --days 45 --rooms 24 --source WOKWI --seed 42 --version smartdorm-wokwi-v1
  python generate_dataset.py --start 2026-05-01 --end 2026-07-31 --rooms 24 --seed 42
"""
import sys
import os
import argparse
import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, List

# Ensure ml-service root is in sys.path
ML_ROOT = Path(__file__).resolve().parent
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

import pandas as pd
from data.scenarios.scenario_engine import ScenarioEngine, InjectedScenario

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("generate_dataset")


def generate_dataset(
    start_date: datetime,
    end_date: datetime,
    room_count: int = 24,
    sampling_minutes: int = 15,
    source: str = "WOKWI",
    seed: int = 42,
    dataset_version: str = "smartdorm-wokwi-v1",
    output_dir: str = str(ML_ROOT / "data" / "curated"),
) -> Dict[str, Any]:
    """
    Generates a deterministic, correlated dormitory telemetry dataset.
    """
    logger.info("==================================================================")
    logger.info("🚀 Generating SmartDorm Wokwi Telemetry Dataset: %s", dataset_version)
    logger.info("   Period: %s -> %s", start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"))
    logger.info("   Rooms: %d | Step: %d min | Seed: %d | Source: %s", room_count, sampling_minutes, seed, source)
    logger.info("==================================================================")

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    engine = ScenarioEngine(seed=seed)
    # Trim or select rooms
    if room_count < len(engine.rooms):
        engine.rooms = engine.rooms[:room_count]

    # Inject periodic scenarios across the timeline
    total_days = (end_date - start_date).days
    scenario_counts: Dict[str, int] = {
        "NORMAL_DAY": 0,
        "WEEKEND": 0,
        "ENERGY_WASTE": 0,
        "LIGHT_FORGOTTEN_ON": 0,
        "FAN_FORGOTTEN_ON": 0,
        "POWER_SPIKE": 0,
        "GAS_LEAK": 0,
        "SENSOR_DROPOUT": 0,
        "INVALID_RFID": 0,
    }

    # Inject specific controlled test scenarios
    for day_offset in range(total_days):
        current_day = start_date + timedelta(days=day_offset)
        dow = current_day.weekday()
        if dow in [5, 6]:
            scenario_counts["WEEKEND"] += 1
        else:
            scenario_counts["NORMAL_DAY"] += 1

        # Periodic operational anomaly scenarios (e.g. every 5 days)
        if day_offset % 6 == 2:
            target_room = engine.rooms[day_offset % len(engine.rooms)].room_id
            engine.inject_scenario(InjectedScenario(
                scenario_id=f"scen-waste-{day_offset}",
                scenario_type="ENERGY_WASTE",
                start_time=current_day.replace(hour=8, minute=30),
                duration_hours=7.5,
                affected_rooms=[target_room],
                severity="MEDIUM",
                description="Thiết bị đèn và quạt quên tắt khi sinh viên đi vắng",
            ))
            scenario_counts["ENERGY_WASTE"] += 1

        if day_offset % 9 == 4:
            target_room = engine.rooms[(day_offset + 2) % len(engine.rooms)].room_id
            engine.inject_scenario(InjectedScenario(
                scenario_id=f"scen-spike-{day_offset}",
                scenario_type="POWER_SPIKE",
                start_time=current_day.replace(hour=19, minute=15),
                duration_hours=1.0,
                affected_rooms=[target_room],
                severity="HIGH",
                description="Đỉnh công suất bất thường do chập hoặc quá tải",
            ))
            scenario_counts["POWER_SPIKE"] += 1

        if day_offset % 14 == 10:
            target_room = engine.rooms[0].room_id
            engine.inject_scenario(InjectedScenario(
                scenario_id=f"scen-gas-{day_offset}",
                scenario_type="GAS_LEAK",
                start_time=current_day.replace(hour=11, minute=45),
                duration_hours=0.5,
                affected_rooms=[target_room],
                severity="CRITICAL",
                description="Sự cố rò rỉ khí gas kiểm thử hệ thống an toàn",
            ))
            scenario_counts["GAS_LEAK"] += 1

    # Generate step-by-step records
    simulation_run_id = f"sim-{dataset_version}-{seed}"
    all_records: List[Dict[str, Any]] = []
    current_time = start_date

    while current_time < end_date:
        step_data = engine.generate_step_telemetry(
            current_time=current_time,
            step_minutes=sampling_minutes,
            simulation_run_id=simulation_run_id,
        )
        all_records.extend(step_data)
        current_time += timedelta(minutes=sampling_minutes)

    df = pd.DataFrame(all_records)
    logger.info("Successfully generated %d telemetry records across %d rooms.", len(df), len(engine.rooms))

    # Save CSV Dataset
    csv_file = out_path / f"{dataset_version}.csv"
    df.to_csv(csv_file, index=False)
    logger.info("Saved curated dataset to: %s", csv_file)

    # Save Dataset Metadata
    metadata = {
        "datasetId": f"ds-{dataset_version}",
        "datasetVersion": dataset_version,
        "source": source,
        "simulationRunId": simulation_run_id,
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "roomCount": len(engine.rooms),
        "deviceCount": len(engine.rooms) * 3,  # Light, Fan, SmartSocket
        "recordCount": len(df),
        "samplingRateMinutes": sampling_minutes,
        "scenarioDistribution": scenario_counts,
        "generatorVersion": "v1.2-scenario-engine",
        "seed": seed,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "datasetFile": str(csv_file.name),
        "status": "SIMULATION_ONLY",
    }

    meta_file = out_path / f"{dataset_version}_metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    logger.info("Saved dataset metadata to: %s", meta_file)

    return metadata


def main():
    parser = argparse.ArgumentParser(description="SmartDorm Wokwi Simulation Dataset Generator")
    parser.add_argument("--days", type=int, default=45, help="Number of simulation days")
    parser.add_argument("--start", type=str, default=None, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", type=str, default=None, help="End date (YYYY-MM-DD)")
    parser.add_argument("--rooms", type=int, default=24, help="Number of rooms")
    parser.add_argument("--step", type=int, default=15, help="Sampling interval in minutes")
    parser.add_argument("--source", type=str, default="WOKWI", help="Data source tag")
    parser.add_argument("--seed", type=int, default=42, help="Random generator seed")
    parser.add_argument("--version", type=str, default="smartdorm-wokwi-v1", help="Dataset version identifier")
    parser.add_argument("--output-dir", type=str, default=str(ML_ROOT / "data" / "curated"), help="Output directory")

    args = parser.parse_args()

    if args.start and args.end:
        start_dt = datetime.strptime(args.start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end_dt = datetime.strptime(args.end, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        end_dt = datetime(2026, 8, 1, tzinfo=timezone.utc)
        start_dt = end_dt - timedelta(days=args.days)

    meta = generate_dataset(
        start_date=start_dt,
        end_date=end_dt,
        room_count=args.rooms,
        sampling_minutes=args.step,
        source=args.source,
        seed=args.seed,
        dataset_version=args.version,
        output_dir=args.output_dir,
    )
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
