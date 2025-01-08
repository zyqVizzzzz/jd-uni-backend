import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type MomentDocument = Moment & Document;

@Schema({
  timestamps: true,
  collection: 'moments',
})
export class Moment {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId | User;

  @Prop()
  content?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ default: 'public', enum: ['public', 'friends', 'private'] })
  visibility: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const MomentSchema = SchemaFactory.createForClass(Moment);

// 添加复合索引以优化查询性能
MomentSchema.index({ author: 1, createdAt: -1 });
MomentSchema.index({ isDeleted: 1, createdAt: -1 });

// 添加自定义验证器确保 content 和 images 不能同时为空
MomentSchema.pre('validate', function (next) {
  const moment = this as MomentDocument;
  const hasContent =
    moment.content !== undefined &&
    moment.content !== null &&
    moment.content.trim() !== '';
  const hasImages = moment.images && moment.images.length > 0;

  if (!hasContent && !hasImages) {
    next(new Error('Moment must have either content or images'));
  } else {
    next();
  }
});
