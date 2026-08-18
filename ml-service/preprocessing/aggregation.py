"""
Time-series aggregation module for downsampling IoT telemetry streams
Supports 1m, 5m, 15m, 1h, 1d resampling intervals.
"""
from typing import Optional, Dict
import pandas as pd
import numpy as np


INTERVAL_MAP = {
    "1m": "1min",
    "1min": "1min",
    "5m": "5min",
    "5min": "5min",
    "15m": "15min",
    "15min": "15min",
    "30m": "30min",
    "30min": "30min",
    "1h": "1h",
    "1hour": "1h",
    "6h": "6h",
    "1d": "1D",
    "1day": "1D",
}


def resample_time_series(
    df: pd.DataFrame,
    interval: str = "1h",
    time_column: str = "timestamp",
    agg_rules: Optional[Dict[str, str]] = None
) -> pd.DataFrame:
    """
    Resamples time-series dataframe according to target interval window.
    Default aggregation rules:
    - power_w / powerW: mean, with max and min columns
    - energy_kwh: max (cumulative meter reading) or diff
    - temperature, humidity, gas_level: mean
    - motionDetected / occupancySignal: max (any activity in window)
    """
    if df.empty:
        return df.copy()

    df_work = df.copy()
    if time_column not in df_work.columns:
        if isinstance(df_work.index, pd.DatetimeIndex):
            df_work[time_column] = df_work.index
        else:
            raise ValueError(f"Time column '{time_column}' not found in DataFrame.")

    df_work[time_column] = pd.to_datetime(df_work[time_column])
    df_work = df_work.set_index(time_column)

    freq = INTERVAL_MAP.get(interval.lower(), interval)

    # Standard default aggregation mapping
    default_rules = {}
    for col in df_work.columns:
        if pd.api.types.is_numeric_dtype(df_work[col]):
            col_lower = col.lower()
            if "energy" in col_lower:
                default_rules[col] = "max"
            elif "motion" in col_lower or "alert" in col_lower or "occupancy" in col_lower:
                default_rules[col] = "max"
            else:
                default_rules[col] = "mean"

    if agg_rules:
        default_rules.update(agg_rules)

    # Filter to only existing columns
    active_rules = {k: v for k, v in default_rules.items() if k in df_work.columns}

    if not active_rules:
        # Fallback numeric mean
        resampled = df_work.resample(freq).mean()
    else:
        resampled = df_work.resample(freq).agg(active_rules)

    # Fill any gaps
    resampled = resampled.ffill().bfill().fillna(0.0)
    resampled = resampled.reset_index()

    return resampled


def aggregate_room_telemetry(
    df: pd.DataFrame,
    group_by: str = "room",
    time_column: str = "timestamp",
    window: str = "1h"
) -> pd.DataFrame:
    """Aggregates telemetry per room/building across time windows."""
    if df.empty:
        return df.copy()

    if group_by in df.columns:
        grouped = df.groupby(group_by).apply(
            lambda g: resample_time_series(g, interval=window, time_column=time_column)
        ).reset_index(drop=True)
        return grouped
    else:
        return resample_time_series(df, interval=window, time_column=time_column)
