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

    // 先查找用户是否存在
    let user = await this.usersService.findOne(wxSession.openid);

    console.log(user);

    if (!user) {
      // 只有在用户不存在时才创建新用户
      user = await this.usersService.create({
        openid: wxSession.openid,
        nickname: '未设置昵称',
        avatarUrl: '/static/avatar.png',
        lastLoginAt: new Date(),
      });
    } else {
      // 如果用户存在，只更新登录时间
      user = await this.usersService.updateLoginTime(wxSession.openid);
    }

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
      userId: userData.user._id.toString(),
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
