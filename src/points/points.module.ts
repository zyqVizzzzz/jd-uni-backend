import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { Points, PointsSchema } from './schemas/points.schema';
import { DailyTask, DailyTaskSchema } from './schemas/daily-task.schema';
import {
  PointsHistory,
  PointsHistorySchema,
} from './schemas/points-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Points.name, schema: PointsSchema },
      { name: DailyTask.name, schema: DailyTaskSchema },
      { name: PointsHistory.name, schema: PointsHistorySchema },
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
