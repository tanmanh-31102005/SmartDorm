import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { EmergencyService } from './emergency.service';

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
  overrideAction(@Body('actionType') actionType: string) {
    return this.emergencyService.executeEmergencyOverride(actionType);
  }
}
