import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type RankingDocument = Ranking & Document;

export enum RankType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  TOTAL = 'total',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Ranking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user_id: User;

  @Prop({ required: true, enum: RankType })
  rank_type: RankType;

  @Prop({ required: true })
  rank: number;

  @Prop({ required: true, default: 0 })
  total_distance: number;

  @Prop({ required: true, default: 0 })
  swim_count: number;

  @Prop({ type: Object, required: true })
  region: {
    province: string;
    city: string;
  };

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const RankingSchema = SchemaFactory.createForClass(Ranking);
