// auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WechatService } from '../wechat/wechat.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private wechatService: WechatService,
    private usersService: UsersService,
  ) {}

  async validateWechatUser(code: string) {
    const wxSession = await this.wechatService.code2Session(code);

    // 查找或创建用户
    const user = await this.usersService.findOneAndUpdate(wxSession.openid, {
      lastLoginAt: new Date(),
    });

    return {
      openid: wxSession.openid,
      sessionKey: wxSession.session_key,
      user,
    };
  }

  async login(userData: { openid: string; user: any }) {
    const payload = {
      openid: userData.openid,
      sub: userData.openid,
      userId: userData.user._id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userData.user,
    };
  }

  async updateUserInfo(openid: string, userInfo: any) {
    return this.usersService.updateUserInfo(openid, userInfo);
  }
}
