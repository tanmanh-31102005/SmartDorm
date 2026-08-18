import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccessLogService } from './access-log.service';

@ApiTags('access-log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('access-log')
export class AccessLogController {
  constructor(private service: AccessLogService) {}

  @Get()
  @ApiOperation({ summary: 'Lịch sử ra vào RFID' })
  getLogs(
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('roomId') roomId?: string,
  ) {
    return this.service.getLogs(
      page  ? parseInt(page)  : 1,
      limit ? parseInt(limit) : 50,
      roomId,
    );
  }
}
