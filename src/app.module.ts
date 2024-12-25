import { Module } from '@nestjs/common';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WechatModule } from './wechat/wechat.module';
import { AuthModule } from './auth/auth.module';
import { SwimmingModule } from './swimming/swimming.module';
import { CosModule } from './cos/cos.module';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/uniDB'),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    AuthModule,
    WechatModule,
    SwimmingModule,
    CosModule,
    DevicesModule,
  ],
})
export class AppModule {}
