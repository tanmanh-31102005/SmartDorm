import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getEnergyReport(roomId?: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: any = { recordedAt: { gte: since } };
    if (roomId) where.roomId = roomId;

    const data = await this.prisma.sensorData.findMany({
      where,
      select: { temperature: true, humidity: true, gasLevel: true, recordedAt: true, roomId: true },
      orderBy: { recordedAt: 'asc' },
    });

    return { data, totalPoints: data.length, days };
  }

  async getTemperatureChart(roomId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.prisma.sensorData.findMany({
      where: { roomId, recordedAt: { gte: since } },
      select: { temperature: true, humidity: true, gasLevel: true, recordedAt: true },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getAccessStats(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await this.prisma.accessLog.findMany({
      where: { timestamp: { gte: since } },
      include: { room: { include: { building: true } } },
      orderBy: { timestamp: 'desc' },
    });

    const authorized = logs.filter(l => l.authorized).length;
    const denied     = logs.filter(l => !l.authorized).length;

    return {
      total: logs.length,
      authorized,
      denied,
      deniedRate: logs.length > 0 ? ((denied / logs.length) * 100).toFixed(1) : '0',
      recentLogs: logs.slice(0, 20),
    };
  }

  async getEmergencySummary() {
    const [total, active, byType] = await Promise.all([
      this.prisma.emergency.count(),
      this.prisma.emergency.count({ where: { isResolved: false } }),
      this.prisma.emergency.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
    ]);
    return { total, active, resolved: total - active, byType };
  }

  async getDashboardSummary() {
    const [rooms, users, sensors, emergencies] = await Promise.all([
      this.prisma.room.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.sensorData.findFirst({ orderBy: { recordedAt: 'desc' } }),
      this.prisma.emergency.count({ where: { isResolved: false } }),
    ]);
    return {
      totalRooms: rooms,
      activeStudents: users,
      activeEmergencies: emergencies,
      lastSensorUpdate: sensors?.recordedAt,
    };
  }
}
