import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CopilotService } from './copilot.service';
import {
  CopilotQueryDto,
  CopilotStructuredResponseDto,
  QuickActionItem,
} from './dto/copilot.dto';

@ApiTags('Intelligence - AI Copilot')
@Controller('intelligence/copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Interact with SmartDorm AI Copilot',
    description:
      'Grounded LLM pipeline with Intent Routing, RBAC Scoping, Zero Hardware Control, and Structured JSON output.',
  })
  @ApiResponse({ status: 200, description: 'Structured AI Copilot Response', type: CopilotStructuredResponseDto })
  async chat(@Body() body: any, @Req() req: any): Promise<CopilotStructuredResponseDto> {
    const dto: CopilotQueryDto = {
      message: body?.message || body?.prompt || '',
      context: body?.context || {},
      history: body?.history || [],
    };

    // If request contains authenticated user in req.user, inject into context
    if (req.user) {
      dto.context = {
        ...dto.context,
        userId: req.user.id,
        role: req.user.role,
        roomNumber: req.user.roomNumber || dto.context?.roomNumber,
      };
    }
    return this.copilotService.processQuery(dto);
  }

  @Get('quick-actions')
  @ApiOperation({ summary: 'Get role-aware quick actions for Admin or Student' })
  getQuickActions(@Query('role') role?: 'ADMIN' | 'STUDENT'): QuickActionItem[] {
    return this.copilotService.getQuickActions(role || 'ADMIN');
  }
}
