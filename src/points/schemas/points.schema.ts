import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DailyTask } from './daily-task.schema';

export type PointsDocument = Points & Document;

@Schema({ timestamps: true })
export class Points {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'DailyTask' }] })
  dailyTasks: DailyTask[];
}

export const PointsSchema = SchemaFactory.createForClass(Points);
