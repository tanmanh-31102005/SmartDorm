"""
Automated Data Visualization Generator for SmartDorm M1 Data Foundation.
Renders high-resolution scientific diagnostic plots for data quality & behavioral verification.

Usage:
  python reports/generate_visualizations.py --dataset data/curated/smartdorm-wokwi-v1.csv
"""
import sys
import os
import argparse
import logging
from pathlib import Path

# Ensure ml-service root is in sys.path
ML_ROOT = Path(__file__).resolve().parent.parent
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("generate_visualizations")


def generate_all_plots(
    csv_file: str,
    output_dir: str = str(ML_ROOT / "reports" / "plots"),
):
    """Generates 7 core diagnostic plots for the dataset."""
    path = Path(csv_file)
    if not path.exists():
        raise FileNotFoundError(f"Dataset CSV not found: {csv_file}")

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by="timestamp")

    logger.info("Generating diagnostic plots for %d records...", len(df))

    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    plt.rcParams.update({"font.size": 10, "figure.autolayout": True})

    # 1. Energy & Power Over Time (Sample 1 Room for clarity)
    sample_room = df["roomId"].iloc[0]
    df_room = df[df["roomId"] == sample_room].copy()

    fig, ax1 = plt.subplots(figsize=(12, 5))
    ax2 = ax1.twinx()
    ax1.plot(df_room["timestamp"][:400], df_room["powerW"][:400], color="#2563eb", alpha=0.8, label="Power (W)")
    ax2.plot(df_room["timestamp"][:400], df_room["energyKwhCumulative"][:400], color="#16a34a", linewidth=2, label="Cumulative Energy (kWh)")
    ax1.set_xlabel("Time (UTC)")
    ax1.set_ylabel("Instantaneous Power (Watts)", color="#2563eb")
    ax2.set_ylabel("Cumulative Energy (kWh)", color="#16a34a")
    plt.title(f"SmartDorm Wokwi Telemetry — Power & Energy Trajectory (Room {sample_room}) [SIMULATION_ONLY]")
    plt.savefig(out_path / "energy_over_time.png", dpi=200)
    plt.close()
    logger.info("Saved: energy_over_time.png")

    # 2. Power Distribution Histogram & Boxplot
    fig, (ax_box, ax_hist) = plt.subplots(2, 1, figsize=(10, 6), sharex=True, gridspec_kw={"height_ratios": [0.2, 0.8]})
    ax_box.boxplot(df["powerW"], vert=False, patch_artist=True, boxprops=dict(facecolor="#3b82f6", alpha=0.7))
    ax_box.set_yticks([])
    ax_hist.hist(df["powerW"], bins=50, color="#3b82f6", edgecolor="white", alpha=0.85, density=True)
    ax_hist.set_xlabel("Active Power (Watts)")
    ax_hist.set_ylabel("Probability Density")
    plt.suptitle("SmartDorm Electrical Power Distribution Across All Rooms [SIMULATION_ONLY]")
    plt.savefig(out_path / "power_distribution.png", dpi=200)
    plt.close()
    logger.info("Saved: power_distribution.png")

    # 3. Temperature Diurnal Cycle Over Time
    fig, ax = plt.subplots(figsize=(12, 4.5))
    ax.plot(df_room["timestamp"][:300], df_room["temperatureC"][:300], color="#ef4444", label="Room Temp (°C)")
    ax.axhline(38.0, color="#dc2626", linestyle="--", alpha=0.7, label="Thermal Warning (38°C)")
    ax.set_xlabel("Timestamp")
    ax.set_ylabel("Temperature (°C)")
    ax.set_ylim(20, 45)
    plt.title(f"Diurnal Thermal Micro-climate (Room {sample_room}) [WOKWI SIMULATION]")
    plt.legend(loc="upper right")
    plt.savefig(out_path / "temperature_over_time.png", dpi=200)
    plt.close()
    logger.info("Saved: temperature_over_time.png")

    # 4. Humidity Over Time
    fig, ax = plt.subplots(figsize=(12, 4.5))
    ax.plot(df_room["timestamp"][:300], df_room["humidityPct"][:300], color="#06b6d4", label="Humidity (%)")
    ax.set_xlabel("Timestamp")
    ax.set_ylabel("Relative Humidity (%)")
    ax.set_ylim(30, 95)
    plt.title(f"Ambient Relative Humidity Cycle (Room {sample_room}) [WOKWI SIMULATION]")
    plt.legend(loc="upper right")
    plt.savefig(out_path / "humidity_over_time.png", dpi=200)
    plt.close()
    logger.info("Saved: humidity_over_time.png")

    # 5. Occupancy Ground Truth Routine
    fig, ax = plt.subplots(figsize=(12, 4.5))
    ax.step(df_room["timestamp"][:200], df_room["occupancyGroundTruth"][:200], where="post", color="#8b5cf6", linewidth=1.8, label="Simulated Headcount")
    ax.set_xlabel("Time of Day")
    ax.set_ylabel("Resident Headcount (Persons)")
    ax.set_ylim(-0.5, 6.5)
    plt.title(f"Diurnal Student Occupancy Routine (Room {sample_room}) [SIMULATED_GROUND_TRUTH]")
    plt.legend(loc="upper right")
    plt.savefig(out_path / "occupancy_over_time.png", dpi=200)
    plt.close()
    logger.info("Saved: occupancy_over_time.png")

    # 6. Scenario Distribution Bar Chart
    df["hour"] = df["timestamp"].dt.hour
    df["dow"] = df["timestamp"].dt.dayofweek
    
    # 7. Energy by Hour and Weekday
    hourly_avg = df.groupby(["dow", "hour"])["powerW"].mean().unstack()
    fig, ax = plt.subplots(figsize=(11, 5))
    days_label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i, d in enumerate(days_label):
        if i in hourly_avg.index:
            ax.plot(hourly_avg.columns, hourly_avg.loc[i], marker="o", markersize=3, label=d)
    ax.set_xlabel("Hour of Day (0 - 23)")
    ax.set_ylabel("Average Power Consumption (Watts)")
    ax.set_title("Dormitory Average Diurnal Power Profile by Weekday [SIMULATION_ONLY]")
    ax.legend(title="Day of Week", bbox_to_anchor=(1.02, 1), loc="upper left")
    plt.savefig(out_path / "energy_by_hour_weekday.png", dpi=200)
    plt.close()
    logger.info("Saved: energy_by_hour_weekday.png")

    logger.info("✅ All diagnostic visualizations successfully generated in: %s", out_path)


def main():
    parser = argparse.ArgumentParser(description="SmartDorm Telemetry Diagnostic Plot Generator")
    parser.add_argument("--dataset", type=str, default=str(ML_ROOT / "data" / "curated" / "smartdorm-wokwi-v1.csv"))
    parser.add_argument("--output-dir", type=str, default=str(ML_ROOT / "reports" / "plots"))
    args = parser.parse_args()

    generate_all_plots(args.dataset, output_dir=args.output_dir)


if __name__ == "__main__":
    main()
