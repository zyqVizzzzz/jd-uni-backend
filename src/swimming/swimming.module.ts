// swimming/swimming.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SwimmingController } from './swimming.controller';
import { SwimmingService } from './swimming.service';
import {
  SwimmingRecord,
  SwimmingRecordSchema,
} from './schemas/swimming-record.schema';
import { RankingsModule } from '../rankings/rankings.module';
import { PointsModule } from '../points/points.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SwimmingRecord.name, schema: SwimmingRecordSchema },
    ]),
    RankingsModule,
    UsersModule,
    PointsModule,
  ],
  controllers: [SwimmingController],
  providers: [SwimmingService],
  exports: [SwimmingService], // 导出 Service 以供其他模块使用
})
export class SwimmingModule {}
