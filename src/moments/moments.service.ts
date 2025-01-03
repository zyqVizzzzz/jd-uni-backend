// src/moments/moments.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Moment, MomentDocument } from './schemas/moment.schema';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { QueryMomentDto } from './dto/query-moment.dto';

@Injectable()
export class MomentsService {
  constructor(
    @InjectModel(Moment.name) private momentModel: Model<MomentDocument>,
  ) {}

  async create(
    userId: string,
    createMomentDto: CreateMomentDto,
  ): Promise<Moment> {
    const moment = new this.momentModel({
      author: new Types.ObjectId(userId),
      ...createMomentDto,
    });
    return moment.save();
  }

  async findAll(query: QueryMomentDto) {
    const { page = 1, limit = 20, type, userId, city } = query;
    const skip = (page - 1) * limit;

    const baseQuery: any = { isDeleted: false };

    // 根据查询类型构建不同的查询条件
    if (userId) {
      baseQuery.author = new Types.ObjectId(userId);
    }
    if (city) {
      baseQuery['location.city'] = city;
    }

    const moments = await this.momentModel
      .find(baseQuery)
      .populate('author', 'nickname avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.momentModel.countDocuments(baseQuery);

    return {
      items: moments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async incrementCommentCount(id: string, increment: number) {
    return this.momentModel
      .findByIdAndUpdate(
        id,
        { $inc: { commentCount: increment } },
        { new: true },
      )
      .exec();
  }

  async incrementLikeCount(id: string, increment: number) {
    return this.momentModel
      .findByIdAndUpdate(id, { $inc: { likeCount: increment } }, { new: true })
      .exec();
  }

  async findOne(id: string): Promise<Moment> {
    const moment = await this.momentModel
      .findById(id)
      .populate('author', 'nickname avatarUrl')
      .exec();

    if (!moment || moment.isDeleted) {
      throw new NotFoundException('Moment not found');
    }

    return moment;
  }

  async update(
    id: string,
    userId: string,
    updateMomentDto: UpdateMomentDto,
  ): Promise<Moment> {
    const moment = await this.momentModel.findById(id);

    if (!moment || moment.isDeleted) {
      throw new NotFoundException('Moment not found');
    }

    if (moment.author.toString() !== userId) {
      throw new ForbiddenException('Cannot update moments created by others');
    }

    return this.momentModel
      .findByIdAndUpdate(id, updateMomentDto, { new: true })
      .exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const moment = await this.momentModel.findById(id);

    if (!moment || moment.isDeleted) {
      throw new NotFoundException('Moment not found');
    }

    if (moment.author.toString() !== userId) {
      throw new ForbiddenException('Cannot delete moments created by others');
    }

    await this.momentModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();
  }

  async toggleLike(
    momentId: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    const moment = await this.momentModel.findById(momentId);

    if (!moment || moment.isDeleted) {
      throw new NotFoundException('Moment not found');
    }

    // 检查用户是否已经点赞
    const userObjectId = new Types.ObjectId(userId);
    const hasLiked = moment.likedBy.includes(userObjectId);

    if (hasLiked) {
      // 如果已经点赞，则取消点赞
      await this.momentModel.findByIdAndUpdate(momentId, {
        $pull: { likedBy: userObjectId },
        $inc: { likeCount: -1 },
      });
      return { liked: false };
    } else {
      // 如果未点赞，则添加点赞
      await this.momentModel.findByIdAndUpdate(momentId, {
        $addToSet: { likedBy: userObjectId },
        $inc: { likeCount: 1 },
      });
      return { liked: true };
    }
  }

  async findNearby(
    coordinates: [number, number],
    maxDistance: number = 5000,
    limit: number = 20,
  ): Promise<Moment[]> {
    return this.momentModel
      .find({
        isDeleted: false,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates,
            },
            $maxDistance: maxDistance,
          },
        },
      })
      .populate('author', 'nickname avatarUrl')
      .limit(limit)
      .exec();
  }
}
