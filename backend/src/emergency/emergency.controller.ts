import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { EmergencyService } from './emergency.service';
import { IsString, IsOptional } from 'class-validator';

export class EmergencyOverrideDto {
  @ApiProperty({
    example: 'UNLOCK_ALL',
    enum: ['UNLOCK_ALL', 'LOCKDOWN', 'SIREN', 'BROADCAST'],
    description: 'Hành động can thiệp khẩn cấp: UNLOCK_ALL (Mở toàn bộ cửa), LOCKDOWN (Phong tỏa), SIREN (Kích hoạt còi hú), BROADCAST (Phát sóng khẩn)',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionType?: string;
}

@ApiTags('emergency')
@Controller('emergency')
export class EmergencyController {
  constructor(private emergencyService: EmergencyService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sự cố khẩn cấp' })
  getEmergencies(@Query('resolved') resolved?: string) {
    const isResolved = resolved === 'true' ? true : resolved === 'false' ? false : undefined;
    return this.emergencyService.getEmergencies(isResolved);
  }

  @Patch('resolve/:id')
  @ApiOperation({ summary: 'Xác nhận đã xử lý sự cố' })
  resolve(@Param('id') id: string) {
    return this.emergencyService.resolveEmergency(id);
  }

  @Post('override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thực thi can thiệp an ninh cấp cao (Mở khóa toàn khu, phong tỏa, còi hú, phát sóng)' })
  @ApiBody({ type: EmergencyOverrideDto, required: false })
  overrideAction(@Body() body?: EmergencyOverrideDto) {
    const action = body?.actionType || 'UNLOCK_ALL';
    return this.emergencyService.executeEmergencyOverride(action);
  }
}
