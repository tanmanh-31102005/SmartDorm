import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { IntelligenceService } from './intelligence.service';
import { ForecastQueryDto } from './dto/forecast-query.dto';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  TestRuleSimulationDto,
} from './dto/automation-rule.dto';

@ApiTags('intelligence')
@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Lấy dữ liệu tổng quan AI & Năng lượng & Thiết bị' })
  @ApiResponse({ status: 200, description: 'High-level stats, anomaly count, forecast summary, occupancy overview' })
  async getOverview() {
    return this.intelligenceService.getOverview();
  }

  @Get('energy/forecast')
  @ApiOperation({ summary: 'Dự báo tiêu thụ điện năng 24h (GBM Champion / Active model / Baseline fallback)' })
  @ApiQuery({ name: 'buildingId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'horizonHours', required: false, type: Number })
  @ApiQuery({ name: 'interval', required: false, enum: ['15m', '30m', '1h', '6h', '1d'] })
  async getEnergyForecast(@Query() query: ForecastQueryDto) {
    return this.intelligenceService.getEnergyForecast(query);
  }

  @Get('energy/lstm')
  @ApiOperation({ summary: 'Dự báo tiêu thụ điện năng 24h bằng mạng nơ-ron LSTM Recurrent Network' })
  async getLstmForecast(@Query() query: ForecastQueryDto) {
    return this.intelligenceService.getLstmForecast(query);
  }

  @Get('energy/comparison')
  @ApiOperation({ summary: 'So sánh Benchmark đối chiếu 3 mô hình (Baseline vs GBM vs LSTM)' })
  async getForecastComparison(@Query() query: ForecastQueryDto) {
    return this.intelligenceService.getForecastComparison(query);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Danh sách thiết bị phát hiện bất thường (Isolation Forest / Heuristics)' })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  async getAnomalies(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('roomId') roomId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.intelligenceService.getAnomalies({ severity, status, roomId, limit });
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Dự báo và ước lượng trạng thái hiện diện phòng / tòa nhà' })
  @ApiQuery({ name: 'buildingId', required: false })
  async getOccupancy(@Query('buildingId') buildingId?: string) {
    return this.intelligenceService.getOccupancy(buildingId);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Danh sách khuyến nghị tối ưu từ AI' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  async getRecommendations(
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('roomId') roomId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.intelligenceService.getRecommendations({ type, severity, status, roomId, limit });
  }

  @Post('recommendations/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chấp nhận khuyến nghị và tự động thực thi hành động điều khiển thiết bị' })
  @ApiParam({ name: 'id', description: 'Recommendation ID' })
  async acceptRecommendation(
    @Param('id') id: string,
    @Body('executeAction') executeAction = true,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id || 'admin';
    return this.intelligenceService.acceptRecommendation(id, executeAction, userId);
  }

  @Post('recommendations/:id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bỏ qua khuyến nghị AI' })
  @ApiParam({ name: 'id', description: 'Recommendation ID' })
  async dismissRecommendation(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id || 'admin';
    return this.intelligenceService.dismissRecommendation(id, userId, reason);
  }

  @Get('models')
  @ApiOperation({ summary: 'Trạng thái, phiên bản và chỉ số hiệu năng các mô hình ML' })
  async getModels() {
    return this.intelligenceService.getModels();
  }

  @Post('models/:name/promote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thăng cấp mô hình được chọn thành mô hình dự báo chính thức (ACTIVE)' })
  async promoteModel(@Param('name') name: string) {
    return this.intelligenceService.promoteModel(name);
  }

  @Get('models/drift')
  @ApiOperation({ summary: 'Kiểm tra tình trạng độ trôi dữ liệu (Data Drift) và mô hình cũ (Staleness)' })
  async getModelDrift() {
    return this.intelligenceService.getModelDrift();
  }

  @Post('models/retrain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt pipeline tái huấn luyện mô hình tự động' })
  async triggerRetraining(@Body('modelName') modelName?: string) {
    return this.intelligenceService.triggerRetraining(modelName);
  }

  @Get('student/insights')
  @ApiOperation({ summary: 'Dự báo năng lượng & mẹo tiết kiệm riêng tư dành cho phòng của sinh viên' })
  async getStudentInsights(@Req() req?: any, @Query('roomId') roomId?: string) {
    const userId = req?.user?.id;
    return this.intelligenceService.getStudentInsights(userId, roomId);
  }
}

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get('rules')
  @ApiOperation({ summary: 'Danh sách quy tắc tự động hóa' })
  async getRules() {
    return this.intelligenceService.getAutomationRules();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Tạo quy tắc tự động hóa mới' })
  async createRule(@Body() dto: CreateAutomationRuleDto, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.intelligenceService.createAutomationRule(dto, userId);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Cập nhật hoặc bật/tắt quy tắc tự động hóa' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  async updateRule(@Param('id') id: string, @Body() dto: UpdateAutomationRuleDto) {
    return this.intelligenceService.updateAutomationRule(id, dto);
  }

  @Post('rules/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mô phỏng/thử nghiệm quy tắc trên dữ liệu mà không thực thi lệnh vật lý' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  async testRuleById(
    @Param('id') id: string,
    @Body() dto: TestRuleSimulationDto,
  ) {
    return this.intelligenceService.testRuleSimulation({ ...dto, ruleId: id });
  }

  @Post('rules/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mô phỏng thử nghiệm cấu hình quy tắc mới mà không thực thi lệnh vật lý' })
  async testRule(@Body() dto: TestRuleSimulationDto) {
    return this.intelligenceService.testRuleSimulation(dto);
  }
}
