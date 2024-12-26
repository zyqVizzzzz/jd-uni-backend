import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ranking, RankingDocument, RankType } from './schemas/ranking.schema';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel(Ranking.name) private rankingModel: Model<RankingDocument>,
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
      .findOne({ user_id: userId, rank_type: rankType })
      .populate('user_id', 'nickname avatarUrl')
      .exec();
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
    incrementSwimCount: boolean = true,
  ): Promise<Ranking> {
    const updateData: any = {
      $inc: {
        total_distance: distance,
      },
    };

    if (incrementSwimCount) {
      updateData.$inc.swim_count = 1;
    }

    return this.rankingModel
      .findOneAndUpdate({ user_id: userId, rank_type: rankType }, updateData, {
        new: true,
        upsert: true,
      })
      .exec();
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
    limit: number = 10,
  ): Promise<Ranking[]> {
    return this.rankingModel
      .find({ rank_type: rankType })
      .sort({ rank: 1 })
      .limit(limit)
      .populate('user_id', 'nickname avatarUrl')
      .exec();
  }

  async getRegionalRankings(
    rankType: RankType,
    province: string,
    city?: string,
  ): Promise<Ranking[]> {
    const query: any = {
      rank_type: rankType,
      'region.province': province,
    };

    if (city) {
      query['region.city'] = city;
    }

    return this.rankingModel
      .find(query)
      .sort({ rank: 1 })
      .populate('user_id', 'nickname avatarUrl')
      .exec();
  }
}
