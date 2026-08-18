"""
InfluxDB 2.7 Reader Service for high-resolution IoT telemetry and energy measurements.
Queries 'energy_telemetry' and 'environment_sensors' buckets via Flux queries.
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import pandas as pd

from app.config import settings

logger = logging.getLogger("ml-service.services.influx_reader")

INFLUX_CLIENT_AVAILABLE = False
try:
    from influxdb_client import InfluxDBClient
    from influxdb_client.client.query_api import QueryApi
    INFLUX_CLIENT_AVAILABLE = True
except ImportError:
    INFLUX_CLIENT_AVAILABLE = False
    logger.warning("influxdb-client not installed. InfluxReader operating in mock/fallback mode.")


class InfluxReader:
    """Safely queries InfluxDB 2.7 time-series database."""

    def __init__(
        self,
        url: Optional[str] = None,
        token: Optional[str] = None,
        org: Optional[str] = None,
        bucket: Optional[str] = None,
    ):
        self.url = url or settings.INFLUXDB_URL
        self.token = token or settings.INFLUXDB_TOKEN
        self.org = org or settings.INFLUXDB_ORG
        self.bucket = bucket or settings.INFLUXDB_BUCKET
        self.client: Optional[Any] = None
        self._is_online = False

        if INFLUX_CLIENT_AVAILABLE:
            try:
                self.client = InfluxDBClient(
                    url=self.url,
                    token=self.token,
                    org=self.org,
                    timeout=2000,
                )
            except Exception as e:
                logger.debug("Could not initialize InfluxDBClient: %s", str(e))

    def is_available(self) -> bool:
        """Checks if InfluxDB server is responsive."""
        if not INFLUX_CLIENT_AVAILABLE or self.client is None:
            return False
        try:
            health = self.client.health()
            self._is_online = (health.status == "pass")
            return self._is_online
        except Exception:
            self._is_online = False
            return False

    def query_energy_telemetry(
        self,
        room: Optional[str] = None,
        building: Optional[str] = None,
        range_str: str = "-24h",
        window: str = "1h",
    ) -> pd.DataFrame:
        """
        Queries power_w and energy_kwh time series from InfluxDB.
        Returns DataFrame with ['timestamp', 'power_w', 'energy_kwh', 'room', 'building'].
        """
        if not self.is_available():
            logger.debug("InfluxDB unavailable for query_energy_telemetry.")
            return pd.DataFrame()

        try:
            query_api: QueryApi = self.client.query_api()

            # Construct Flux query
            room_filter = f'|> filter(fn: (r) => r["room"] == "{room}")' if room else ""
            bldg_filter = f'|> filter(fn: (r) => r["building"] == "{building}")' if building else ""

            flux = f'''
            from(bucket: "{self.bucket}")
                |> range(start: {range_str})
                |> filter(fn: (r) => r["_measurement"] == "energy_telemetry")
                {room_filter}
                {bldg_filter}
                |> aggregateWindow(every: {window}, fn: mean, createEmpty: false)
                |> yield(name: "mean")
            '''

            tables = query_api.query(flux, org=self.org)
            records = []
            for table in tables:
                for record in table.records:
                    records.append({
                        "timestamp": record.get_time(),
                        "field": record.get_field(),
                        "value": record.get_value(),
                        "room": record.values.get("room"),
                        "building": record.values.get("building"),
                    })

            if not records:
                return pd.DataFrame()

            raw_df = pd.DataFrame(records)
            # Pivot fields into columns
            pivoted = raw_df.pivot_table(
                index=["timestamp", "room", "building"],
                columns="field",
                values="value",
                aggfunc="mean",
            ).reset_index()

            pivoted.columns.name = None
            if "power_w" in pivoted.columns:
                pivoted["powerW"] = pivoted["power_w"]
            if "energy_kwh" in pivoted.columns:
                pivoted["energyKwh"] = pivoted["energy_kwh"]

            return pivoted.sort_values(by="timestamp").reset_index(drop=True)

        except Exception as e:
            logger.debug("InfluxDB query error: %s", str(e))
            return pd.DataFrame()

    def query_environment_sensors(
        self,
        room: Optional[str] = None,
        building: Optional[str] = None,
        range_str: str = "-24h",
        window: str = "15m",
    ) -> pd.DataFrame:
        """
        Queries temperature, humidity, gas_level from InfluxDB.
        """
        if not self.is_available():
            return pd.DataFrame()

        try:
            query_api: QueryApi = self.client.query_api()

            room_filter = f'|> filter(fn: (r) => r["room"] == "{room}")' if room else ""
            bldg_filter = f'|> filter(fn: (r) => r["building"] == "{building}")' if building else ""

            flux = f'''
            from(bucket: "{self.bucket}")
                |> range(start: {range_str})
                |> filter(fn: (r) => r["_measurement"] == "environment_sensors")
                {room_filter}
                {bldg_filter}
                |> aggregateWindow(every: {window}, fn: mean, createEmpty: false)
                |> yield(name: "mean")
            '''

            tables = query_api.query(flux, org=self.org)
            records = []
            for table in tables:
                for record in table.records:
                    records.append({
                        "timestamp": record.get_time(),
                        "field": record.get_field(),
                        "value": record.get_value(),
                        "room": record.values.get("room"),
                        "building": record.values.get("building"),
                    })

            if not records:
                return pd.DataFrame()

            raw_df = pd.DataFrame(records)
            pivoted = raw_df.pivot_table(
                index=["timestamp", "room", "building"],
                columns="field",
                values="value",
                aggfunc="mean",
            ).reset_index()

            pivoted.columns.name = None
            return pivoted.sort_values(by="timestamp").reset_index(drop=True)

        except Exception as e:
            logger.debug("InfluxDB query error: %s", str(e))
            return pd.DataFrame()


def get_influx_reader() -> InfluxReader:
    """Returns InfluxReader singleton instance."""
    return InfluxReader()
