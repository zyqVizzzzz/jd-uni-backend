import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TaskType } from '../types/task-status.type';

export type PointsHistoryDocument = PointsHistory & Document;

@Schema({ timestamps: true })
export class PointsHistory {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: Object.values(TaskType) })
  type: TaskType;

  @Prop({ required: true })
  points: number;

  @Prop({ required: false }) // 修改这里，设置为非必填
  description?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PointsHistorySchema = SchemaFactory.createForClass(PointsHistory);
