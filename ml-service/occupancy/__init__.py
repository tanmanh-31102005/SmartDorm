"""
Occupancy classification package for SmartDorm ML Service.
"""
from occupancy.classifier import OccupancyClassifier, predict_room_occupancy

__all__ = [
    "OccupancyClassifier",
    "predict_room_occupancy",
]
