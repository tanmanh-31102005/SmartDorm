"""
Data cleaning and validation module for IoT telemetry & sensor streams.
Filters impossible physical values, handles missing intervals, and removes transmission glitches.
"""
from typing import Optional, Dict, Any, Union
import pandas as pd
import numpy as np


PHYSICAL_RANGES = {
    "temperature": (-10.0, 70.0),    # Celsius
    "humidity": (0.0, 100.0),        # % RH
    "gas_level": (0.0, 100.0),       # % or ppm index
    "gasLevel": (0.0, 100.0),
    "power_w": (0.0, 25000.0),       # Watts
    "powerW": (0.0, 25000.0),
    "energy_kwh": (0.0, 100000.0),   # kWh
    "energyKwh": (0.0, 100000.0),
    "response_ms": (0.0, 30000.0),   # ms
    "responseMs": (0.0, 30000.0),
}


def clamp_ranges(df: pd.DataFrame, custom_ranges: Optional[Dict[str, tuple]] = None) -> pd.DataFrame:
    """Clamps numeric columns to physically plausible minimum and maximum bounds."""
    df_clean = df.copy()
    ranges = custom_ranges or PHYSICAL_RANGES
    
    for col, (low, high) in ranges.items():
        if col in df_clean.columns and pd.api.types.is_numeric_dtype(df_clean[col]):
            df_clean[col] = df_clean[col].clip(lower=low, upper=high)
            
    return df_clean


def remove_spikes(
    df: pd.DataFrame, 
    columns: Optional[list] = None, 
    window: int = 5, 
    threshold_std: float = 3.5
) -> pd.DataFrame:
    """
    Removes severe single-step noise spikes using rolling median / Z-score filter.
    Replaces spike values with rolling median interpolation.
    """
    df_clean = df.copy()
    target_cols = columns or [c for c in ["power_w", "powerW", "temperature", "gas_level", "gasLevel"] if c in df_clean.columns]
    
    for col in target_cols:
        if col in df_clean.columns and len(df_clean) >= window:
            rolling_med = df_clean[col].rolling(window=window, center=True, min_periods=1).median()
            rolling_std = df_clean[col].rolling(window=window, center=True, min_periods=1).std().fillna(0)
            
            # Avoid divide by zero
            diff = (df_clean[col] - rolling_med).abs()
            is_spike = diff > (threshold_std * rolling_std + 1e-3)
            
            # Replace spikes with median
            df_clean.loc[is_spike, col] = rolling_med[is_spike]
            
    return df_clean


def clean_telemetry_dataframe(
    df: pd.DataFrame,
    time_column: str = "timestamp",
    sort_by_time: bool = True,
    interpolate_missing: bool = True
) -> pd.DataFrame:
    """
    Complete cleaning pipeline for raw telemetry DataFrames:
    1. Parse and standardize datetime index
    2. Clamp physical ranges
    3. Remove single-step transmission spikes
    4. Fill missing values gracefully
    """
    if df.empty:
        return df.copy()

    df_clean = df.copy()

    # Standardize timestamp
    if time_column in df_clean.columns:
        df_clean[time_column] = pd.to_datetime(df_clean[time_column], errors="coerce")
        df_clean = df_clean.dropna(subset=[time_column])
        if sort_by_time:
            df_clean = df_clean.sort_values(by=time_column).reset_index(drop=True)

    # Physical range bounds
    df_clean = clamp_ranges(df_clean)

    # Glitch spike filtering
    df_clean = remove_spikes(df_clean)

    # Impute remaining NaNs
    if interpolate_missing:
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        df_clean[numeric_cols] = df_clean[numeric_cols].interpolate(method="linear", limit_direction="both")
        df_clean[numeric_cols] = df_clean[numeric_cols].ffill().bfill().fillna(0.0)

    return df_clean
