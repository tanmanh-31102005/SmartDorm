import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.room.findMany({
      include: {
        building: true,
        users: { select: { id: true, fullName: true, studentId: true } },
        devices: true,
        _count: { select: { users: true } },
      },
      orderBy: [{ building: { name: 'asc' } }, { roomNumber: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
        users: { select: { id: true, fullName: true, studentId: true, rfidCardId: true } },
        devices: true,
      },
    });
  }

  async create(data: { roomNumber: string; floor: number; buildingId: string; capacity?: number }) {
    return this.prisma.room.create({ data, include: { building: true } });
  }

  async update(id: string, data: any) {
    return this.prisma.room.update({ where: { id }, data });
  }

  async getStats() {
    const [totalRooms, totalUsers, activeEmergencies] = await Promise.all([
      this.prisma.room.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.emergency.count({ where: { isResolved: false } }),
    ]);
    return { totalRooms, totalUsers, activeEmergencies };
  }

  async getOverview() {
    // Lấy dữ liệu cảm biến mới nhất cho mỗi phòng
    const rooms = await this.prisma.room.findMany({
      include: {
        building: true,
        users: { select: { id: true, fullName: true, studentId: true, phone: true, rfidCardId: true } },
        sensorData: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        emergencies: {
          where: { isResolved: false },
          take: 1,
        },
        devices: true,
      },
    });
    return rooms;
  }
}
