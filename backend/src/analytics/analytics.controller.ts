import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
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

  // ==================== EXPORT DATA ENDPOINTS ====================

  @Get('export/energy')
  @ApiOperation({ summary: 'Xuất dữ liệu báo cáo điện năng' })
  exportEnergy(@Query('building') building?: string, @Query('days') days?: string) {
    return this.analyticsService.exportEnergyData(building, days ? parseInt(days) : 30);
  }

  @Get('export/security')
  @ApiOperation({ summary: 'Xuất dữ liệu kiểm soát an ninh RFID' })
  exportSecurity(@Query('days') days?: string) {
    return this.analyticsService.exportSecurityData(days ? parseInt(days) : 7);
  }

  @Get('export/incidents')
  @ApiOperation({ summary: 'Xuất dữ liệu sự cố & ứng phó khẩn cấp' })
  exportIncidents() {
    return this.analyticsService.exportIncidentData();
  }

  @Get('export/devices')
  @ApiOperation({ summary: 'Xuất dữ liệu sức khỏe thiết bị IoT' })
  exportDevices() {
    return this.analyticsService.exportDeviceHealthData();
  }

  @Get('monthly-bill/:roomNumber')
  @ApiOperation({ summary: 'Tra cứu thông tin hóa đơn tiền điện tháng của phòng sinh viên' })
  getStudentMonthlyBill(@Param('roomNumber') roomNumber: string) {
    return this.analyticsService.getStudentMonthlyBill(roomNumber);
  }

  @Get('calculate-bill')
  @ApiOperation({ summary: 'Mô phỏng tính tiền điện theo bậc thang EVN 6 bậc và số lượng sinh viên' })
  calculateBill(@Query('kwh') kwh?: string, @Query('students') students?: string) {
    const kwhVal = kwh ? parseFloat(kwh) : 100;
    const studentVal = students ? parseInt(students) : 4;
    return this.analyticsService.calculateCustomEvnBill(kwhVal, studentVal);
  }

  @Get('tariff-evn')
  @ApiOperation({ summary: 'Lấy bảng định mức đơn giá điện sinh hoạt 6 bậc thang EVN' })
  getTariffEvn() {
    return this.analyticsService.getEvnTariffTable();
  }
}
