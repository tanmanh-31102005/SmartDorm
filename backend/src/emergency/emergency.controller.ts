import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { EmergencyService } from './emergency.service';

@ApiTags('emergency')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emergency')
export class EmergencyController {
  constructor(private emergencyService: EmergencyService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Danh sách sự cố khẩn cấp' })
  getEmergencies(@Query('resolved') resolved?: string) {
    const isResolved = resolved === 'true' ? true : resolved === 'false' ? false : undefined;
    return this.emergencyService.getEmergencies(isResolved);
  }

  @Patch('resolve/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xác nhận đã xử lý sự cố' })
  resolve(@Param('id') id: string) {
    return this.emergencyService.resolveEmergency(id);
  }
}
