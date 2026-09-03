"""
Feature Engineering module for Dormitory Energy Forecasting, Device Anomalies, and Room Occupancy.
Extracts cyclical time encodings, lag indicators, rolling aggregations, and sensor interactions.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


def extract_temporal_features(df: pd.DataFrame, time_column: str = "timestamp") -> pd.DataFrame:
    """
    Extracts rich cyclical and calendar features from timestamps:
    - hour (0-23)
    - day_of_week (0=Mon, 6=Sun)
    - is_weekend (0 or 1)
    - is_night (22:00 to 06:00)
    - is_class_time (08:00 to 17:00 on weekdays)
    - sin_hour, cos_hour (continuous harmonic coordinates)
    - sin_day, cos_day
    """
    df_feat = df.copy()
    if time_column not in df_feat.columns:
        if isinstance(df_feat.index, pd.DatetimeIndex):
            dt_series = df_feat.index
        else:
            return df_feat
    else:
        dt_series = pd.to_datetime(df_feat[time_column])

    df_feat["hour"] = dt_series.dt.hour
    df_feat["day_of_week"] = dt_series.dt.dayofweek
    df_feat["is_weekend"] = df_feat["day_of_week"].isin([5, 6]).astype(int)
    
    # Dorm specific schedule
    df_feat["is_night"] = ((df_feat["hour"] >= 22) | (df_feat["hour"] < 6)).astype(int)
    df_feat["is_class_time"] = (
        (df_feat["is_weekend"] == 0) & (df_feat["hour"] >= 8) & (df_feat["hour"] < 17)
    ).astype(int)

    # Cyclical trigonometric transforms for periodic time signals
    df_feat["sin_hour"] = np.sin(2 * np.pi * df_feat["hour"] / 24.0)
    df_feat["cos_hour"] = np.cos(2 * np.pi * df_feat["hour"] / 24.0)
    df_feat["sin_day"] = np.sin(2 * np.pi * df_feat["day_of_week"] / 7.0)
    df_feat["cos_day"] = np.cos(2 * np.pi * df_feat["day_of_week"] / 7.0)

    return df_feat


def build_device_features(
    device_data: Dict[str, Any], 
    historical_stats: Optional[Dict[str, Any]] = None
) -> np.ndarray:
    """
    Constructs normalized numerical feature vector for Device Anomaly Detection (Isolation Forest):
    Features:
    0: power_w (Watts)
    1: uptime_hours (Hours continuously running)
    2: failure_rate (0.0 to 1.0)
    3: response_ms (Network round-trip latency in ms)
    4: temperature (Internal or surrounding temp in C)
    5: is_power_over_nominal (Boolean/float flag based on device type)
    """
    dev_type = str(device_data.get("type", "UNKNOWN")).upper()
    power_w = float(device_data.get("powerW", device_data.get("power_w", 0.0)))
    uptime = float(device_data.get("uptimeHours", device_data.get("uptime_hours", 0.0)))
    failure_rate = float(device_data.get("failureRate", device_data.get("failure_rate", 0.0)))
    response_ms = float(device_data.get("responseMs", device_data.get("response_ms", 45.0)))
    temp = float(device_data.get("temperature", 28.0))

    # Nominal power reference
    nominal_power = {
        "LIGHT": 20.0,
        "FAN": 60.0,
        "AIR_CON": 1200.0,
        "DOOR_LOCK": 5.0,
        "BUZZER": 2.0,
    }.get(dev_type, 30.0)

    power_ratio = power_w / max(nominal_power, 1.0)

    return np.array([
        power_w,
        uptime,
        failure_rate,
        response_ms,
        temp,
        power_ratio
    ], dtype=float)


def build_occupancy_features(
    room_data: Dict[str, Any], 
    current_hour: Optional[int] = None, 
    day_of_week: Optional[int] = None
) -> np.ndarray:
    """
    Builds numerical feature array for Room Occupancy inference:
    Features:
    0: motion_detected (0 or 1)
    1: power_w (Watts current consumption)
    2: active_devices_count (int)
    3: rfid_recency_score (1.0 = immediate entry, decays to 0 after 60 min)
    4: hour (0-23)
    5: is_night (0 or 1)
    6: gas_level (ppm / %)
    7: temp_diff_from_baseline
    """
    motion_val = room_data.get("motionDetected") if room_data.get("motionDetected") is not None else room_data.get("motion_detected", False)
    motion = 1.0 if motion_val else 0.0

    power_val = room_data.get("powerW") if room_data.get("powerW") is not None else room_data.get("power_w", 0.0)
    power = float(power_val or 0.0)

    devices_val = room_data.get("activeDevicesCount") if room_data.get("activeDevicesCount") is not None else room_data.get("active_devices_count", 0)
    active_devices = int(devices_val or 0)
    
    last_access = room_data.get("lastAccessMinutesAgo") if room_data.get("lastAccessMinutesAgo") is not None else room_data.get("last_access_minutes_ago", None)
    if last_access is not None and last_access >= 0:
        rfid_score = max(0.0, 1.0 - (float(last_access) / 60.0))
    else:
        rfid_score = 0.0

    hr = current_hour if current_hour is not None else 14
    dow = day_of_week if day_of_week is not None else 2
    is_weekend = 1.0 if dow in [5, 6] else 0.0
    is_night = 1.0 if (hr >= 22 or hr < 6) else 0.0

    gas_val = room_data.get("gasLevel") if room_data.get("gasLevel") is not None else room_data.get("gas_level", 15.0)
    gas = float(gas_val or 15.0)

    temp_val = room_data.get("temperature") if room_data.get("temperature") is not None else 28.0
    temp = float(temp_val or 28.0)

    return np.array([
        motion,
        power,
        float(active_devices),
        rfid_score,
        float(hr),
        is_night,
        is_weekend,
        gas,
        temp
    ], dtype=float)


def build_time_series_lag_features(
    df: pd.DataFrame,
    target_column: str = "powerW",
    lag_steps: Optional[List[int]] = None,
    rolling_windows: Optional[List[int]] = None,
) -> pd.DataFrame:
    """
    Constructs past-only lag and rolling window statistical features.
    STRICT PREVENTION OF FUTURE DATA LEAKAGE:
    - Only shifts backward (lags >= 1).
    - Rolling calculations are strictly shifted by 1 step (closed='left')
      so the current row's target value is never included in features.
    """
    if lag_steps is None:
        lag_steps = [1, 2, 3, 4, 24]
    if rolling_windows is None:
        rolling_windows = [3, 6, 24]

    df_out = df.copy()

    # Extract temporal calendar cyclical features
    df_out = extract_temporal_features(df_out, time_column="timestamp")

    # Past-only Lags
    for lag in lag_steps:
        df_out[f"{target_column}_lag_{lag}"] = df_out[target_column].shift(lag)

    # Past-only Rolling Statistics (Strict shift by 1 to prevent leakage)
    shifted_target = df_out[target_column].shift(1)
    for w in rolling_windows:
        df_out[f"{target_column}_rolling_mean_{w}"] = shifted_target.rolling(window=w, min_periods=1).mean()
        df_out[f"{target_column}_rolling_std_{w}"] = shifted_target.rolling(window=w, min_periods=1).std().fillna(0.0)
        df_out[f"{target_column}_rolling_max_{w}"] = shifted_target.rolling(window=w, min_periods=1).max()
        df_out[f"{target_column}_rolling_min_{w}"] = shifted_target.rolling(window=w, min_periods=1).min()

    return df_out


