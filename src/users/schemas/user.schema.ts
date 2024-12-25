// users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true, unique: true })
  openid: string;

  @Prop()
  nickname?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  gender?: number;

  @Prop()
  country?: string;

  @Prop()
  province?: string;

  @Prop()
  city?: string;

  @Prop()
  district?: string;

  @Prop()
  phone?: string;

  @Prop()
  language?: string;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop()
  lastLoginAt: Date;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  following: number;

  @Prop({ default: 0 })
  followers: number;

  @Prop({ default: '写一个有趣的介绍吧' })
  bio: string;

  @Prop()
  birthday?: string;

  @Prop({ type: Number })
  weight?: number;

  @Prop({ type: Number })
  height?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
