import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SettingsService, SystemSettings } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy cấu hình hệ thống hiện tại' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Get('thresholds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy các ngưỡng an toàn cảm biến' })
  getThresholds() {
    return this.settingsService.getThresholds();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình hệ thống & ngưỡng kích hoạt' })
  updateSettings(@Body() dto: Partial<SystemSettings>) {
    return this.settingsService.updateSettings(dto);
  }
}
