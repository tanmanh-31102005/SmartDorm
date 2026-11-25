import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateStudentRfid } from '../auth/rfid-utils';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.room.findMany({
      include: {
        building: true,
        users: { 
          where: { role: 'STUDENT' },
          select: { id: true, fullName: true, studentId: true, phone: true, email: true, rfidCardId: true } 
        },
        devices: true,
        _count: { select: { users: true } },
      },
      orderBy: [{ building: { name: 'asc' } }, { roomNumber: 'asc' }],
    });
  }

  async findOne(id: string) {
    const cleanNumber = id.replace(/^(room-|P\.|A-|B-|C-|A|B|C)/i, '').trim();
    return this.prisma.room.findFirst({
      where: {
        OR: [
          { id },
          { roomNumber: id },
          { roomNumber: cleanNumber },
        ],
      },
      include: {
        building: true,
        users: { 
          where: { role: 'STUDENT' },
          select: { id: true, fullName: true, studentId: true, phone: true, email: true, rfidCardId: true } 
        },
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
      this.prisma.user.count({ where: { isActive: true, role: 'STUDENT' } }),
      this.prisma.emergency.count({ where: { isResolved: false } }),
    ]);
    return { totalRooms, totalUsers, activeEmergencies };
  }

  async getAllResidents() {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        email: true,
        phone: true,
        rfidCardId: true,
        isActive: true,
        createdAt: true,
        roomId: true,
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            building: { select: { id: true, name: true } },
          },
        },
        accessLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true, action: true, authorized: true },
        },
      },
      orderBy: [{ studentId: 'asc' }],
    });
  }

  async assignRoom(userId: string, roomId: string | null) {
    let cleanRoomId: string | null = null;
    if (roomId && roomId.trim() !== '') {
      const clean = roomId.replace(/^(room-|P\.|A-|B-|C-|A|B|C)/i, '').trim();
      const room = await this.prisma.room.findFirst({
        where: {
          OR: [{ id: roomId }, { roomNumber: roomId }, { roomNumber: clean }],
        },
      });
      if (room) cleanRoomId = room.id;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Auto-generate RFID for student if missing
    const rfidCardId = user.rfidCardId || generateStudentRfid(user.studentId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        roomId: cleanRoomId,
        rfidCardId,
      },
      include: {
        room: {
          include: { building: true },
        },
      },
    });
  }

  async getOverview() {
    // Lấy dữ liệu cảm biến mới nhất cho mỗi phòng
    const rooms = await this.prisma.room.findMany({
      include: {
        building: true,
        users: { 
          where: { role: 'STUDENT' },
          select: { id: true, fullName: true, studentId: true, phone: true, email: true, rfidCardId: true } 
        },
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

