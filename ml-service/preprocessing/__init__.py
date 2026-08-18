"""
Preprocessing package for SmartDorm ML Service.
"""
from preprocessing.cleaning import clean_telemetry_dataframe, remove_spikes, clamp_ranges
from preprocessing.aggregation import resample_time_series, aggregate_room_telemetry
from preprocessing.feature_engineering import extract_temporal_features, build_device_features, build_occupancy_features

__all__ = [
    "clean_telemetry_dataframe",
    "remove_spikes",
    "clamp_ranges",
    "resample_time_series",
    "aggregate_room_telemetry",
    "extract_temporal_features",
    "build_device_features",
    "build_occupancy_features",
]
