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
import { QueryMomentDto, MomentType } from './dto/query-moment.dto';

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

  async findAll(query: QueryMomentDto, currentUserId?: string) {
    const { page = 1, limit = 20, type = MomentType.ALL, city } = query;
    const skip = (page - 1) * limit;

    // 如果是 FOLLOWING 类型，直接返回空结果
    if (type === MomentType.FOLLOWING) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const baseQuery: any = { isDeleted: false };

    // 根据不同类型构建查询条件
    switch (type) {
      case MomentType.MY:
        if (!currentUserId) {
          throw new ForbiddenException(
            'User must be logged in to view personal feed',
          );
        }
        baseQuery.author = new Types.ObjectId(currentUserId);
        break;

      case MomentType.ALL:
      default:
        // 如果指定了城市，添加城市筛选
        if (city) {
          baseQuery['location.city'] = city;
        }
        break;
    }

    // 执行查询
    const [moments, total] = await Promise.all([
      this.momentModel
        .find(baseQuery)
        .populate('author', 'nickname avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.momentModel.countDocuments(baseQuery),
    ]);

    // 如果是已登录用户，添加是否点赞的标记
    // let processedMoments = moments;
    // if (currentUserId) {
    //   processedMoments = moments.map((moment) => {
    //     const momentObj = moment.toObject();
    //     momentObj.isLiked = moment.likedBy?.includes(
    //       new Types.ObjectId(currentUserId),
    //     );
    //     return momentObj;
    //   });
    // }

    return {
      items: moments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // async findAll(query: QueryMomentDto) {
  //   const { page = 1, limit = 20, type, userId, city } = query;
  //   const skip = (page - 1) * limit;

  //   const baseQuery: any = { isDeleted: false };

  //   // 根据查询类型构建不同的查询条件
  //   if (userId) {
  //     baseQuery.author = new Types.ObjectId(userId);
  //   }
  //   if (city) {
  //     baseQuery['location.city'] = city;
  //   }

  //   const moments = await this.momentModel
  //     .find(baseQuery)
  //     .populate('author', 'nickname avatarUrl')
  //     .sort({ createdAt: -1 })
  //     .skip(skip)
  //     .limit(limit)
  //     .exec();

  //   const total = await this.momentModel.countDocuments(baseQuery);

  //   return {
  //     items: moments,
  //     total,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(total / limit),
  //   };
  // }

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
