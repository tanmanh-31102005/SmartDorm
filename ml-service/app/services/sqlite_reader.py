"""
SQLite Reader Service for querying operational database (sensor_data, access_logs, devices, rooms).
Provides fallback data access when InfluxDB is unavailable or when relational metadata is needed.
"""
import sqlite3
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
import pandas as pd

from app.config import settings

logger = logging.getLogger("ml-service.services.sqlite_reader")


class SqliteReader:
    """Safely queries local SQLite database (backend dev.db)."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.get_sqlite_file_path()

    def is_available(self) -> bool:
        """Checks if SQLite database file exists and is readable."""
        return self.db_path is not None and self.db_path.exists() and self.db_path.is_file()

    def _get_connection(self) -> Optional[sqlite3.Connection]:
        """Opens a read-only or standard sqlite3 connection."""
        if not self.is_available():
            return None
        try:
            conn = sqlite3.connect(f"file:{self.db_path}?mode=ro", uri=True)
            conn.row_factory = sqlite3.Row
            return conn
        except sqlite3.OperationalError:
            try:
                conn = sqlite3.connect(str(self.db_path))
                conn.row_factory = sqlite3.Row
                return conn
            except Exception as e:
                logger.debug("Failed to open SQLite database at %s: %s", self.db_path, str(e))
                return None

    def get_rooms(self) -> pd.DataFrame:
        """Retrieves list of rooms with building relations."""
        conn = self._get_connection()
        if not conn:
            return pd.DataFrame()

        try:
            query = """
                SELECT r.id, r.roomNumber, r.floor, r.capacity, r.buildingId, b.name as buildingName
                FROM rooms r
                LEFT JOIN buildings b ON r.buildingId = b.id
                WHERE r.isActive = 1
            """
            df = pd.read_sql_query(query, conn)
            return df
        except Exception as e:
            logger.debug("Error querying rooms from SQLite: %s", str(e))
            return pd.DataFrame()
        finally:
            conn.close()

    def get_devices(self, room_id: Optional[str] = None) -> pd.DataFrame:
        """Retrieves active devices with room association."""
        conn = self._get_connection()
        if not conn:
            return pd.DataFrame()

        try:
            query = """
                SELECT d.id, d.name, d.type, d.isOn, d.isOnline, d.roomId, r.roomNumber, b.name as buildingName
                FROM devices d
                LEFT JOIN rooms r ON d.roomId = r.id
                LEFT JOIN buildings b ON r.buildingId = b.id
            """
            params = []
            if room_id:
                query += " WHERE d.roomId = ?"
                params.append(room_id)

            df = pd.read_sql_query(query, conn, params=params if params else None)
            return df
        except Exception as e:
            logger.debug("Error querying devices from SQLite: %s", str(e))
            return pd.DataFrame()
        finally:
            conn.close()

    def get_sensor_data(self, room_id: Optional[str] = None, limit: int = 2000) -> pd.DataFrame:
        """Retrieves recent sensor_data records."""
        conn = self._get_connection()
        if not conn:
            return pd.DataFrame()

        try:
            query = """
                SELECT id, roomId, temperature, humidity, gasLevel, gasAlert, tempAlert, motionDetected, recordedAt
                FROM sensor_data
            """
            params = []
            if room_id:
                query += " WHERE roomId = ?"
                params.append(room_id)

            query += " ORDER BY recordedAt DESC LIMIT ?"
            params.append(limit)

            df = pd.read_sql_query(query, conn, params=params)
            if not df.empty and "recordedAt" in df.columns:
                df["timestamp"] = pd.to_datetime(df["recordedAt"])
                df = df.sort_values(by="timestamp").reset_index(drop=True)
            return df
        except Exception as e:
            logger.debug("Error querying sensor_data from SQLite: %s", str(e))
            return pd.DataFrame()
        finally:
            conn.close()

    def get_access_logs(self, room_id: Optional[str] = None, limit: int = 1000) -> pd.DataFrame:
        """Retrieves recent access_logs (RFID events)."""
        conn = self._get_connection()
        if not conn:
            return pd.DataFrame()

        try:
            query = """
                SELECT id, rfidCardId, action, authorized, timestamp, userId, roomId
                FROM access_logs
            """
            params = []
            if room_id:
                query += " WHERE roomId = ?"
                params.append(room_id)

            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)

            df = pd.read_sql_query(query, conn, params=params)
            if not df.empty and "timestamp" in df.columns:
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                df = df.sort_values(by="timestamp").reset_index(drop=True)
            return df
        except Exception as e:
            logger.debug("Error querying access_logs from SQLite: %s", str(e))
            return pd.DataFrame()
        finally:
            conn.close()


def get_sqlite_reader() -> SqliteReader:
    """Returns SqliteReader singleton instance."""
    return SqliteReader()
