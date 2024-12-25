// auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('code') code: string) {
    const userData = await this.authService.validateWechatUser(code);
    return this.authService.login(userData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-userinfo')
  async updateUserInfo(@CurrentUser() user, @Body() userInfo: any) {
    return this.authService.updateUserInfo(user.openid, userInfo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
