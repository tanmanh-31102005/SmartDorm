import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LlmService, DeviceAnomalyContext, RecommendationContext } from './llm.service';

@ApiTags('llm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('intelligence/llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('explain-anomaly')
  @ApiOperation({ summary: 'Giải thích nguyên nhân bất thường thiết bị bằng tiếng Việt tự nhiên' })
  async explainAnomaly(@Body() body: DeviceAnomalyContext) {
    const explanation = await this.llmService.explainDeviceAnomaly(body);
    return { explanation, timestamp: new Date().toISOString() };
  }

  @Post('explain-recommendation')
  @ApiOperation({ summary: 'Giải thích lý do và lợi ích của khuyến nghị AI bằng tiếng Việt tự nhiên' })
  async explainRecommendation(@Body() body: RecommendationContext) {
    const explanation = await this.llmService.explainEnergyRecommendation(body);
    return { explanation, timestamp: new Date().toISOString() };
  }

  @Get('student-tip')
  @ApiOperation({ summary: 'Lấy lời khuyên tiết kiệm điện cá nhân hóa cho phòng sinh viên' })
  async getStudentEcoTip(
    @Query('roomNumber') roomNumber = '101',
    @Query('currentKwh') currentKwh = '8.4',
    @Query('previousWeekKwh') previousWeekKwh = '9.1',
  ) {
    const tip = await this.llmService.generateStudentEcoTip(
      roomNumber,
      parseFloat(currentKwh) || 8.4,
      parseFloat(previousWeekKwh) || 9.1,
    );
    return { tip, roomNumber, timestamp: new Date().toISOString() };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Hỏi đáp trực tiếp với Trợ lý SmartDorm AI Copilot (Gemini LLM)' })
  async chat(@Body() body: { message: string; context?: any }) {
    const message = body?.message || 'Xin chào, hãy tóm tắt tình trạng KTX hôm nay.';
    const reply = await this.llmService.chat(message, body?.context);
    return {
      reply,
      userMessage: message,
      timestamp: new Date().toISOString(),
      model: this.llmService.getModelName(),
    };
  }
}

