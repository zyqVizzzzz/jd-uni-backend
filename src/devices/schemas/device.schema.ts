import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Device {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user_id: User;

  @Prop({ required: true })
  device_name: string;

  @Prop({ required: true })
  device_model: string;

  @Prop({ default: 'offline' })
  device_status: string;

  @Prop()
  last_sync: Date;

  @Prop({ required: true })
  language: string;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
