// schemas/swimming-record.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SwimmingRecordDocument = SwimmingRecord & Document;

@Schema({ timestamps: true })
export class SwimmingRecord {
  @Prop({ required: true })
  openid: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  distance: number;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  strokes: number;

  @Prop({ required: true })
  calories: number;

  @Prop({ required: true })
  poolLength: number;
}

export const SwimmingRecordSchema =
  SchemaFactory.createForClass(SwimmingRecord);
