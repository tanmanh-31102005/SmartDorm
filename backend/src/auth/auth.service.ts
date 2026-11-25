import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { generateStudentRfid } from './rfid-utils';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ 
      where: { email: dto.email.trim().toLowerCase() },
      include: {
        room: {
          include: {
            building: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    if (!user.isActive) throw new UnauthorizedException('Tài khoản đã bị khóa');

    // Auto-generate RFID for student if missing
    if (user.role === 'STUDENT' && !user.rfidCardId) {
      const newCard = generateStudentRfid(user.studentId);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { rfidCardId: newCard },
      });
      user.rfidCardId = newCard;
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      token: token,
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        rfidCardId: user.rfidCardId,
        roomId: user.roomId,
        room: user.room,
      },
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { 
        OR: [
          { email: dto.email.trim().toLowerCase() }, 
          { studentId: dto.studentId.trim() }
        ] 
      },
    });
    if (exists) {
      if (exists.email.toLowerCase() === dto.email.trim().toLowerCase()) {
        throw new ConflictException('Email này đã được đăng ký trong hệ thống');
      }
      throw new ConflictException('Mã số sinh viên/cán bộ này đã tồn tại trong hệ thống');
    }

    let assignedRoomId: string | null = null;
    if (dto.roomId && dto.roomId.trim() !== '') {
      const cleanRoom = dto.roomId.replace(/^(room-|P\.|A-|B-|C-|A|B|C)/i, '').trim();
      const room = await this.prisma.room.findFirst({
        where: {
          OR: [
            { id: dto.roomId },
            { roomNumber: dto.roomId },
            { roomNumber: cleanRoom },
          ],
        },
      });
      if (room) {
        assignedRoomId = room.id;
      }
    }

    // Role is always STUDENT for public registration (Admin is pre-configured)
    const assignedRole = 'STUDENT';
    const passwordHash = await bcrypt.hash(dto.password, 12);
    // Auto-generate RFID for student following deterministic RC522 Mifare standard
    const rfidCardId = generateStudentRfid(dto.studentId);

    const user = await this.prisma.user.create({
      data: {
        studentId: dto.studentId.trim(),
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        phone: dto.phone ? dto.phone.trim() : null,
        role: assignedRole,
        roomId: assignedRoomId,
        rfidCardId,
      },
      include: {
        room: {
          include: {
            building: true,
          },
        },
      },
    });

    // NOTE: Do NOT return access_token. User must log in after registering.
    return {
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập bằng tài khoản vừa tạo.',
      user: {
        id: user.id,
        studentId: user.studentId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        roomId: user.roomId,
        phone: user.phone,
        rfidCardId: user.rfidCardId,
        room: user.room,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        studentId: true, 
        fullName: true, 
        email: true, 
        role: true, 
        phone: true, 
        rfidCardId: true, 
        roomId: true, 
        createdAt: true,
        room: {
          include: {
            building: true,
          },
        },
      },
    });

    if (user && user.role === 'STUDENT' && !user.rfidCardId) {
      const newCard = generateStudentRfid(user.studentId);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { rfidCardId: newCard },
      });
      user.rfidCardId = newCard;
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    if (dto.email && dto.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Email này đã được sử dụng bởi tài khoản khác');
      }
    }

    let assignedRoomId = user.roomId;
    if (dto.roomId !== undefined) {
      if (dto.roomId && dto.roomId.trim() !== '') {
        const cleanRoom = dto.roomId.replace(/^(room-|P\.|A-|B-|C-|A|B|C)/i, '').trim();
        const room = await this.prisma.room.findFirst({
          where: {
            OR: [
              { id: dto.roomId },
              { roomNumber: dto.roomId },
              { roomNumber: cleanRoom },
            ],
          },
        });
        if (room) {
          assignedRoomId = room.id;
        }
      } else {
        assignedRoomId = null;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName !== undefined ? dto.fullName.trim() : undefined,
        email: dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() : undefined,
        roomId: assignedRoomId,
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        rfidCardId: true,
        roomId: true,
        createdAt: true,
        room: {
          include: {
            building: true,
          },
        },
      },
    });

    return {
      message: 'Cập nhật thông tin thành công',
      user: updated,
    };
  }
}

