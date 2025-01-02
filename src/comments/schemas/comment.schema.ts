import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Moment } from '../../moments/schemas/moment.schema';

export type CommentDocument = Comment & Document;

@Schema({
  timestamps: true,
  collection: 'comments',
})
export class Comment {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'Moment', required: true })
  moment: Types.ObjectId | Moment;

  @Prop({ type: Types.ObjectId, ref: 'Comment' })
  parentComment?: Types.ObjectId | Comment;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ moment: 1, createdAt: -1 });
