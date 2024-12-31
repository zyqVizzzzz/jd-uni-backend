// src/interactions/interactions.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Like, LikeDocument } from './schemas/like.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { MomentsService } from '../moments/moments.service';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    private momentsService: MomentsService,
  ) {}

  // 创建评论
  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    // 1. 检查动态是否存在
    const moment = await this.momentsService.findOne(createCommentDto.momentId);
    if (!moment) {
      throw new NotFoundException('动态不存在');
    }

    // 2. 如果是回复评论，检查被回复的评论是否存在
    if (createCommentDto.replyTo) {
      const replyComment = await this.commentModel.findById(
        createCommentDto.replyTo,
      );
      if (!replyComment) {
        throw new NotFoundException('被回复的评论不存在');
      }
    }

    // 3. 创建评论
    const comment = new this.commentModel({
      author: new Types.ObjectId(userId),
      moment: new Types.ObjectId(createCommentDto.momentId),
      content: createCommentDto.content,
      replyTo: createCommentDto.replyTo
        ? new Types.ObjectId(createCommentDto.replyTo)
        : undefined,
    });

    // 4. 更新动态的评论计数
    await this.momentsService.incrementCommentCount(
      createCommentDto.momentId,
      1,
    );

    return comment.save();
  }

  // 获取评论列表
  async getComments(query: QueryCommentDto) {
    const { momentId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.commentModel
        .find({
          moment: new Types.ObjectId(momentId),
          isDeleted: false,
        })
        .populate('author', 'nickname avatarUrl')
        .populate('replyTo', 'author content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.commentModel.countDocuments({
        moment: new Types.ObjectId(momentId),
        isDeleted: false,
      }),
    ]);

    return {
      items: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 点赞/取消点赞
  async toggleLike(
    userId: string,
    targetId: string,
    targetType: 'moment' | 'comment',
  ) {
    const existingLike = await this.likeModel.findOne({
      user: new Types.ObjectId(userId),
      targetId: new Types.ObjectId(targetId),
      targetType,
    });

    if (existingLike) {
      // 取消点赞
      await existingLike.deleteOne();
      if (targetType === 'moment') {
        await this.momentsService.incrementLikeCount(targetId, -1);
      } else {
        await this.commentModel.findByIdAndUpdate(targetId, {
          $inc: { likeCount: -1 },
        });
      }
      return { liked: false };
    } else {
      // 添加点赞
      const like = new this.likeModel({
        user: new Types.ObjectId(userId),
        targetId: new Types.ObjectId(targetId),
        targetType,
      });
      await like.save();
      if (targetType === 'moment') {
        await this.momentsService.incrementLikeCount(targetId, 1);
      } else {
        await this.commentModel.findByIdAndUpdate(targetId, {
          $inc: { likeCount: 1 },
        });
      }
      return { liked: true };
    }
  }

  // 删除评论
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentModel.findById(commentId);

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.author.toString() !== userId) {
      throw new ConflictException('没有权限删除此评论');
    }

    // 软删除评论
    await comment.updateOne({ isDeleted: true });

    // 更新动态的评论计数
    await this.momentsService.incrementCommentCount(
      comment.moment.toString(),
      -1,
    );

    return { success: true };
  }

  // 检查用户是否已点赞
  async checkLikeStatus(
    userId: string,
    targetIds: string[],
    targetType: 'moment' | 'comment',
  ) {
    const likes = await this.likeModel.find({
      user: new Types.ObjectId(userId),
      targetId: { $in: targetIds.map((id) => new Types.ObjectId(id)) },
      targetType,
    });

    return targetIds.reduce(
      (acc, id) => {
        acc[id] = likes.some((like) => like.targetId.toString() === id);
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }
}
