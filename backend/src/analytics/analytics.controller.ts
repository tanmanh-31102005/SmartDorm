import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tổng quan Dashboard' })
  getDashboard() { return this.analyticsService.getDashboardSummary(); }

  @Get('temperature/:roomId')
  @ApiOperation({ summary: 'Biểu đồ nhiệt độ theo phòng' })
  getTemperature(@Param('roomId') roomId: string, @Query('hours') hours?: string) {
    return this.analyticsService.getTemperatureChart(roomId, hours ? parseInt(hours) : 24);
  }

  @Get('energy')
  @ApiOperation({ summary: 'Báo cáo năng lượng' })
  getEnergy(@Query('roomId') roomId?: string, @Query('days') days?: string) {
    return this.analyticsService.getEnergyReport(roomId, days ? parseInt(days) : 7);
  }

  @Get('access')
  @ApiOperation({ summary: 'Thống kê ra vào' })
  getAccess(@Query('days') days?: string) {
    return this.analyticsService.getAccessStats(days ? parseInt(days) : 7);
  }

  @Get('emergency')
  @ApiOperation({ summary: 'Tổng hợp sự cố khẩn cấp' })
  getEmergency() { return this.analyticsService.getEmergencySummary(); }
}
