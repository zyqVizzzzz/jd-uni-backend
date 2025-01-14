import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, DeleteResult } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UserRelationsService } from '../user-relations/user-relations.service';
import { Ranking, RankingDocument, RankType } from './schemas/ranking.schema';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel(Ranking.name) private rankingModel: Model<RankingDocument>,
    private readonly usersService: UsersService,
    private readonly userRelationsService: UserRelationsService, // 注入 UserRelationsService
  ) {}

  async create(createRankingDto: Partial<Ranking>): Promise<Ranking> {
    const ranking = new this.rankingModel(createRankingDto);
    return ranking.save();
  }

  async findAll(rankType: RankType): Promise<Ranking[]> {
    return this.rankingModel
      .find({ rank_type: rankType })
      .sort({ total_distance: -1 })
      .populate('user_id', 'nickname avatarUrl')
      .exec();
  }

  async findByUser(
    userId: string,
    rankType: RankType,
  ): Promise<Ranking | null> {
    return this.rankingModel
      .findOne({ user_id: new Types.ObjectId(userId), rank_type: rankType })
      .populate('user_id', 'nickname avatarUrl')
      .exec();
  }

  async getCitiesWithUserCount() {
    return this.usersService.getCitiesWithUserCount();
  }

  async updateRanking(
    id: string,
    updateData: Partial<Ranking>,
  ): Promise<Ranking> {
    return this.rankingModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async updateUserStats(
    userId: string,
    rankType: RankType,
    distance: number,
    incrementCount: boolean,
    region?: { province: string; city: string; cityCode: string },
  ) {
    // 使用 findOneAndUpdate 而不是创建新记录
    const update: any = {
      $inc: {
        total_distance: distance,
      },
    };

    if (incrementCount) {
      update.$inc.swim_count = 1;
    }

    if (region) {
      update.$set = {
        region: {
          province: region.province || '',
          city: region.city || '',
          cityCode: region.cityCode || '',
        },
      };
    }

    // 使用 upsert 选项，如果记录不存在则创建，存在则更新
    return await this.rankingModel.findOneAndUpdate(
      {
        user_id: userId,
        rank_type: rankType,
      },
      update,
      {
        upsert: true,
        new: true,
      },
    );
  }

  async updateAllRanks(rankType: RankType): Promise<void> {
    const rankings = await this.rankingModel
      .find({ rank_type: rankType })
      .sort({ total_distance: -1 })
      .exec();

    const updateOperations = rankings.map((ranking, index) => ({
      updateOne: {
        filter: { _id: ranking._id },
        update: { $set: { rank: index + 1 } },
      },
    }));

    if (updateOperations.length > 0) {
      await this.rankingModel.bulkWrite(updateOperations);
    }
  }

  async getTopRankings(
    rankType: RankType,
    limit = 20,
    currentUserId?: string,
  ): Promise<any[]> {
    const rankings = await this.rankingModel
      .find({ rank_type: rankType })
      .sort({ total_distance: -1 })
      .limit(limit)
      .populate('user_id', 'nickname avatarUrl')
      .lean();

    if (currentUserId) {
      return Promise.all(
        rankings.map(async (ranking) => ({
          ...ranking,
          user_id: {
            ...ranking.user_id,
            isFollowing: await this.userRelationsService.isFollowing(
              new Types.ObjectId(currentUserId),
              new Types.ObjectId(ranking.user_id._id),
            ),
          },
        })),
      );
    }

    return rankings;
  }

  async getRegionalRankings(
    rankType: RankType,
    city: string,
    cityCode?: string,
  ): Promise<Ranking[]> {
    const query: any = {
      rank_type: rankType,
    };

    if (cityCode) {
      // 优先使用 cityCode 查询
      query['region.cityCode'] = cityCode;
    } else {
      // 后备方案：使用城市名称查询
      const baseCity = city.replace(/市$/, '');
      query['region.city'] = `${baseCity}市`;
    }

    return this.rankingModel
      .find(query)
      .sort({ rank: 1 })
      .populate('user_id', 'nickname avatarUrl')
      .exec();
  }

  // 删除所有数据
  async deleteAll(): Promise<DeleteResult> {
    return await this.rankingModel.deleteMany({});
  }
}
