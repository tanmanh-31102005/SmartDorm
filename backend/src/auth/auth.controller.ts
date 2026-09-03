import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Giới hạn 5 lần thử đăng nhập / phút / IP
   * Bảo vệ chống brute-force password
   */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập — giới hạn 5 lần/phút/IP' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Giới hạn 10 lần đăng ký / phút / IP
   * Bảo vệ chống spam tài khoản
   */
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản sinh viên — giới hạn 10 lần/phút/IP' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @SkipThrottle()  // Profile check không cần rate limit (đã có JWT guard)
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
