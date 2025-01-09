// src/user-relations/schemas/user-relation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RelationType {
  FOLLOW = 'follow',
  BLOCK = 'block',
}

export type UserRelationDocument = UserRelation & Document;

@Schema({
  timestamps: true,
  collection: 'user_relations',
})
export class UserRelation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  fromUser: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  toUser: Types.ObjectId;

  @Prop({ required: true, enum: RelationType })
  type: RelationType;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const UserRelationSchema = SchemaFactory.createForClass(UserRelation);

// 创建复合索引
UserRelationSchema.index({ fromUser: 1, toUser: 1, type: 1 }, { unique: true });
