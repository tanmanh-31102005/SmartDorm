import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InfluxDB, WriteApi, Point } from '@influxdata/influxdb-client';

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private writeApi: WriteApi | null = null;
  private isAvailable = false;
  private hasLoggedWarning = false;

  // Cấu hình từ môi trường hoặc Docker Compose
  private readonly url = process.env.INFLUXDB_URL || 'http://localhost:8086';
  private readonly token = process.env.INFLUXDB_TOKEN || 'smart-dormitory-super-secret-token-12345';
  private readonly org = process.env.INFLUXDB_ORG || 'smart-dormitory';
  private readonly bucket = process.env.INFLUXDB_BUCKET || 'smart-dormitory-raw';

  async onModuleInit() {
    await this.checkConnection();
  }

  async checkConnection() {
    try {
      // Thử ping kiểm tra InfluxDB server có đang bật không
      const res = await fetch(`${this.url}/health`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
      if (res && res.ok) {
        const influxDB = new InfluxDB({ url: this.url, token: this.token });
        this.writeApi = influxDB.getWriteApi(this.org, this.bucket, 'ns');
        this.isAvailable = true;
        this.logger.log(`✅ Kết nối InfluxDB thành công (${this.url})`);
      } else {
        this.isAvailable = false;
        if (!this.hasLoggedWarning) {
          this.logger.warn(`⚠️ InfluxDB chưa được khởi động (cổng 8086). Hệ thống chuyển sang chế độ lưu SQLite & WebSocket.`);
          this.hasLoggedWarning = true;
        }
      }
    } catch (e: any) {
      this.isAvailable = false;
    }
  }

  onModuleDestroy() {
    if (this.writeApi) {
      this.writeApi.close().catch(() => {});
    }
  }

  /**
   * Lưu dữ liệu chuẩn hóa Telemetry (Cảm biến + Điện năng + Trạng thái thiết bị)
   */
  async saveNormalizedTelemetry(payload: {
    building: string;
    floor: string;
    room: string;
    deviceId?: string;
    source?: string;
    temperature?: number;
    humidity?: number;
    gasLevel?: number;
    powerW?: number;
    energyKwh?: number;
    occupancySignal?: boolean;
    lightState?: boolean;
    fanState?: boolean;
  }) {
    if (!this.isAvailable || !this.writeApi) return;

    try {
      // 1. Environment point
      const envPoint = new Point('environment_sensors')
        .tag('building', payload.building)
        .tag('floor', payload.floor)
        .tag('room', payload.room)
        .tag('source', payload.source || 'WOKWI');

      if (payload.deviceId) envPoint.tag('deviceId', payload.deviceId);
      if (payload.temperature !== undefined) envPoint.floatField('temperature', payload.temperature);
      if (payload.humidity !== undefined) envPoint.floatField('humidity', payload.humidity);
      if (payload.gasLevel !== undefined) envPoint.floatField('gas_level', payload.gasLevel);

      this.writeApi.writePoint(envPoint);

      // 2. Power & Energy point
      if (payload.powerW !== undefined || payload.energyKwh !== undefined || payload.occupancySignal !== undefined) {
        const powerPoint = new Point('energy_telemetry')
          .tag('building', payload.building)
          .tag('floor', payload.floor)
          .tag('room', payload.room)
          .tag('source', payload.source || 'SIMULATION_DATA');

        if (payload.deviceId) powerPoint.tag('deviceId', payload.deviceId);
        if (payload.powerW !== undefined) powerPoint.floatField('power_w', payload.powerW);
        if (payload.energyKwh !== undefined) powerPoint.floatField('energy_kwh', payload.energyKwh);
        if (payload.occupancySignal !== undefined) powerPoint.booleanField('occupancy_signal', payload.occupancySignal);
        if (payload.lightState !== undefined) powerPoint.booleanField('light_state', payload.lightState);
        if (payload.fanState !== undefined) powerPoint.booleanField('fan_state', payload.fanState);

        this.writeApi.writePoint(powerPoint);
      }

      await this.writeApi.flush();
    } catch (error: any) {
      this.isAvailable = false;
      this.logger.warn(`⚠️ Mất kết nối InfluxDB khi ghi telemetry. Chuyển sang lưu SQLite.`);
    }
  }

  /**
   * Lưu dữ liệu cảm biến (Nhiệt độ, Độ ẩm, Gas) — Backward compatibility
   */
  async saveEnvironmentData(payload: {
    building: string;
    floor: string;
    room: string;
    temperature?: number;
    humidity?: number;
    gasLevel?: number;
  }) {
    return this.saveNormalizedTelemetry(payload);
  }

  isInfluxAvailable(): boolean {
    return this.isAvailable;
  }
}

