import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TaskType {
  SWIM_500M = 'SWIM_500M',
  SWIM_1000M = 'SWIM_1000M',
  POST_STATUS = 'POST_STATUS',
  SHARE_DATA = 'SHARE_DATA',
}

export type DailyTaskDocument = DailyTask & Document;

@Schema({ timestamps: true })
export class DailyTask {
  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true })
  taskType: string;

  @Prop({ required: true })
  completedAt: Date;

  @Prop({ required: true })
  points: number;
}

export const DailyTaskSchema = SchemaFactory.createForClass(DailyTask);
