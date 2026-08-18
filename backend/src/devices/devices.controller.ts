import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DevicesService } from './devices.service';
import { IsString } from 'class-validator';

export class SendCommandDto {
  @ApiProperty({ example: 'LIGHT', description: 'LIGHT | FAN | DOOR_LOCK | BUZZER' })
  @IsString()
  deviceType: string;

  @ApiProperty({ example: 'on', description: 'on | off | unlock | lock' })
  @IsString()
  action: string;
}


@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Lấy danh sách thiết bị theo phòng' })
  getByRoom(@Param('roomId') roomId: string) {
    return this.devicesService.getDevicesByRoom(roomId);
  }

  @Post('room/:roomId/command')
  @ApiOperation({ summary: 'Gửi lệnh điều khiển thiết bị (Command Pattern)' })
  @ApiBody({ type: SendCommandDto })
  sendCommand(
    @Param('roomId') roomId: string,
    @Body() body: SendCommandDto,
    @Request() req: any,
  ) {
    return this.devicesService.sendCommand(roomId, body.deviceType, body.action, req.user?.id);
  }

  @Post('undo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Undo lệnh cuối cùng' })
  undo() {
    return this.devicesService.undoLastCommand();
  }

  @Get('history')
  @ApiOperation({ summary: 'Lịch sử lệnh đã thực thi' })
  history() {
    return this.devicesService.getCommandHistory();
  }
}
