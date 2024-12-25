// src/cos/cos.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CosService } from './cos.service';

@Module({
  imports: [ConfigModule],
  providers: [CosService],
  exports: [CosService],
})
export class CosModule {}
