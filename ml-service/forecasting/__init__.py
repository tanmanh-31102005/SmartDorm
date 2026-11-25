"""
Forecasting package for SmartDorm ML Service.
Champion Model: Gradient Boosting Machine (GBM).
"""
from forecasting.gbm_forecaster import GBMForecaster, generate_gbm_forecast

__all__ = [
    "GBMForecaster",
    "generate_gbm_forecast",
]
