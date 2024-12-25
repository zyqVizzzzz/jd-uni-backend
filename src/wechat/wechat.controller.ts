import { Controller, Post, Body, Get } from '@nestjs/common';
import { WechatService } from './wechat.service';

@Controller('wechat')
export class WechatController {
  constructor(private readonly wechatService: WechatService) {}

  @Post('login')
  async login(@Body('code') code: string) {
    return this.wechatService.code2Session(code);
  }

  @Get('token')
  async getAccessToken() {
    return this.wechatService.getAccessToken();
  }
}
