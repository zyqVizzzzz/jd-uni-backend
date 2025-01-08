// users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  _id: Types.ObjectId; // 显式声明 _id 字段

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
  provinceCode?: string; // 省级行政区划代码

  @Prop()
  city?: string;

  @Prop()
  cityCode?: string; // 市级行政区划代码

  @Prop()
  district?: string;

  @Prop()
  districtCode?: string; // 区级行政区划代码

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

  @Prop()
  target?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
