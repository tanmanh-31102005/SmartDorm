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

  @Get('bi-summary')
  @ApiOperation({ summary: 'Dữ liệu BI & Kho Phân Tích Lớn (IoT Analytics Realtime)' })
  getBiSummary(
    @Query('building') building?: string,
    @Query('period') period?: string,
  ) {
    return this.analyticsService.getBiSummary(building, period);
  }

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

  @Get('export/environment')
  @ApiOperation({ summary: 'Xuất dữ liệu báo cáo vi khí hậu & môi trường phòng' })
  exportEnvironment(
    @Query('building') building?: string,
    @Query('days') days?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.exportEnvironmentData(
      building,
      days ? parseInt(days) : undefined,
      period,
      startDate,
      endDate,
    );
  }

  @Get('export/energy')
  @ApiOperation({ summary: 'Xuất dữ liệu báo cáo điện năng (tương thích ngược vi khí hậu)' })
  exportEnergy(
    @Query('building') building?: string,
    @Query('days') days?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.exportEnvironmentData(
      building,
      days ? parseInt(days) : undefined,
      period,
      startDate,
      endDate,
    );
  }

  @Get('export/security')
  @ApiOperation({ summary: 'Xuất dữ liệu kiểm soát an ninh RFID' })
  exportSecurity(
    @Query('building') building?: string,
    @Query('days') days?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.exportSecurityData(
      building,
      days ? parseInt(days) : undefined,
      period,
      startDate,
      endDate,
    );
  }

  @Get('export/incidents')
  @ApiOperation({ summary: 'Xuất dữ liệu sự cố & ứng phó khẩn cấp' })
  exportIncidents(
    @Query('building') building?: string,
    @Query('days') days?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.exportIncidentData(
      building,
      days ? parseInt(days) : undefined,
      period,
      startDate,
      endDate,
    );
  }

  @Get('export/devices')
  @ApiOperation({ summary: 'Xuất dữ liệu sức khỏe thiết bị IoT' })
  exportDevices(
    @Query('building') building?: string,
    @Query('days') days?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.exportDeviceHealthData(
      building,
      days ? parseInt(days) : undefined,
      period,
      startDate,
      endDate,
    );
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
