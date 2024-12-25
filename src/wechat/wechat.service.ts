import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WechatService {
  constructor(private configService: ConfigService) {}

  private readonly appId = this.configService.get<string>('wechat.appId');
  private readonly appSecret =
    this.configService.get<string>('wechat.appSecret');

  async getAccessToken(): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
    const response = await axios.get(url);
    return response.data.access_token;
  }

  async code2Session(code: string) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appId}&secret=${this.appSecret}&js_code=${code}&grant_type=authorization_code`;
    const response = await axios.get(url);
    return response.data;
  }
}
