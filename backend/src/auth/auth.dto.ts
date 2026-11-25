import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@ktx.edu.vn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'SV2024001', description: 'Mã sinh viên hoặc Mã số cán bộ' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'Nguyễn Văn An', description: 'Họ và tên đầy đủ' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'sinhvien@ktx.edu.vn', description: 'Địa chỉ email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu (tối thiểu 6 ký tự)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '0901234567', required: false, description: 'Số điện thoại liên hệ' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'STUDENT', enum: ['STUDENT', 'ADMIN'], required: false, description: 'Vai trò: STUDENT hoặc ADMIN' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({ example: '101', required: false, description: 'Mã phòng hoặc Số phòng KTX' })
  @IsString()
  @IsOptional()
  roomId?: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Tấn Mạnh', required: false, description: 'Họ và tên' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: '52300221@student.tdtu.edu.vn', required: false, description: 'Email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '0901234567', required: false, description: 'Số điện thoại cá nhân' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'room-101', required: false, description: 'Phòng KTX' })
  @IsString()
  @IsOptional()
  roomId?: string;
}

