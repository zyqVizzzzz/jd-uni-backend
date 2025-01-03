// src/comments/comments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { MomentsService } from '../moments/moments.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private momentsService: MomentsService,
  ) {}

  async create(
    userId: string,
    momentId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const comment = new this.commentModel({
      author: new Types.ObjectId(userId),
      moment: new Types.ObjectId(momentId),
      content: createCommentDto.content,
    });

    const savedComment = await comment.save();
    await this.momentsService.incrementCommentCount(momentId, 1);
    return savedComment;
  }

  async createReply(
    userId: string,
    parentCommentId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const parentComment = await this.commentModel.findById(parentCommentId);
    if (!parentComment || parentComment.isDeleted) {
      throw new NotFoundException('Parent comment not found');
    }

    const comment = new this.commentModel({
      author: new Types.ObjectId(userId),
      moment: parentComment.moment,
      content: createCommentDto.content,
      parentComment: new Types.ObjectId(parentCommentId),
    });

    const savedComment = await comment.save();
    await this.momentsService.incrementCommentCount(
      parentComment.moment.toString(),
      1,
    );
    return savedComment;
  }

  async findByMomentId(momentId: string): Promise<Comment[]> {
    return this.commentModel
      .find({
        moment: new Types.ObjectId(momentId),
        isDeleted: false,
      })
      .populate('author', 'nickname avatarUrl')
      .populate({
        path: 'parentComment',
        populate: {
          path: 'author',
          select: 'nickname avatarUrl',
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId);

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.toString() !== userId) {
      throw new NotFoundException('Cannot delete comments by others');
    }

    await this.commentModel
      .findByIdAndUpdate(commentId, { isDeleted: true })
      .exec();

    await this.momentsService.incrementCommentCount(
      comment.moment.toString(),
      -1,
    );
  }
}
