import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SensorsService } from './sensors.service';

@ApiTags('sensors')
@Controller('sensors')
export class SensorsController {
  constructor(private sensorsService: SensorsService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Dữ liệu cảm biến gần nhất toàn hệ thống để render biểu đồ' })
  getRecent(@Query('limit') limit?: string) {
    return this.sensorsService.getRecentAll(limit ? parseInt(limit) : 20);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Dữ liệu cảm biến mới nhất của phòng' })
  getLatest(@Param('roomId') roomId: string, @Query('limit') limit?: string) {
    return this.sensorsService.getLatestByRoom(roomId, limit ? parseInt(limit) : 50);
  }

  @Get('analytics/:roomId')
  @ApiOperation({ summary: 'Phân tích dữ liệu cảm biến theo thời gian' })
  getAnalytics(@Param('roomId') roomId: string, @Query('hours') hours?: string) {
    return this.sensorsService.getAnalytics(roomId, hours ? parseInt(hours) : 24);
  }
}
