import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tất cả phòng' })
  findAll() { return this.roomsService.findAll(); }

  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan phòng kèm dữ liệu cảm biến mới nhất' })
  getOverview() { return this.roomsService.getOverview(); }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng quan hệ thống' })
  getStats() { return this.roomsService.getStats(); }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một phòng' })
  findOne(@Param('id') id: string) { return this.roomsService.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo phòng mới' })
  create(@Body() body: any) { return this.roomsService.create(body); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật phòng' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.roomsService.update(id, body);
  }
}
