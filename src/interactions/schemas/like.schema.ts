// src/interactions/schemas/like.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type LikeDocument = Like & Document;

@Schema({
  timestamps: true,
  collection: 'likes',
})
export class Like {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId; // 可以是动态ID或评论ID

  @Prop({ required: true, enum: ['moment', 'comment'] })
  targetType: string; // 点赞目标类型：动态或评论
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// 创建联合索引确保用户不能重复点赞
LikeSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });
