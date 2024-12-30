import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RankType } from './schemas/ranking.schema';
import { UsersService } from 'src/users/users.service';
import { DeleteResult } from 'mongoose';

@Controller('rankings')
@UseGuards(JwtAuthGuard)
export class RankingsController {
  constructor(
    private readonly rankingsService: RankingsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getTopRankings(
    @Query('type') rankType: RankType,
    @Query('limit') limit: number,
  ) {
    return this.rankingsService.getTopRankings(rankType, limit);
  }

  @Get('me')
  getMyRanking(@CurrentUser() user, @Query('type') rankType: RankType) {
    console.log(user);
    return this.rankingsService.findByUser(user.userId, rankType);
  }

  @Get('region')
  getRegionalRankings(
    @Query('type') rankType: RankType,
    @Query('city') city: string,
    @Query('cityCode') cityCode?: string,
  ) {
    const decodedCity = decodeURIComponent(city);
    console.log(decodedCity);
    return this.rankingsService.getRegionalRankings(
      rankType,
      decodedCity,
      cityCode,
    );
  }

  @Post('sync')
  async syncRankings(
    @CurrentUser() user,
    @Body('distance') distance: number,
    @Body('type') rankType: RankType,
  ) {
    await this.rankingsService.updateUserStats(
      user.userId,
      rankType,
      distance,
      true,
    );
    await this.rankingsService.updateAllRanks(rankType);
    return this.rankingsService.findByUser(user.userId, rankType);
  }

  @Post('generate-mock-data')
  async generateMockData() {
    try {
      // 获取所有用户
      const users = await this.usersService.findAll();

      // 为每个用户生成排行榜数据
      for (const user of users) {
        // 生成随机的基础数据
        const baseDistance = Math.floor(Math.random() * 50000); // 0-50000米
        const baseSwimCount = Math.floor(Math.random() * 50); // 0-50次

        // 为每种排行榜类型创建记录
        for (const rankType of Object.values(RankType)) {
          // 根据不同的排行榜类型设置不同的倍数
          let multiplier = 1;
          switch (rankType) {
            case RankType.DAILY:
              multiplier = 1;
              break;
            case RankType.WEEKLY:
              multiplier = 7;
              break;
            case RankType.MONTHLY:
              multiplier = 30;
              break;
            case RankType.YEARLY:
              multiplier = 365;
              break;
            case RankType.TOTAL:
              multiplier = 500;
              break;
          }

          await this.rankingsService.create({
            user_id: user._id,
            rank_type: rankType,
            rank: 0, // 初始排名为0，后面会更新
            total_distance: baseDistance * multiplier,
            swim_count: baseSwimCount * multiplier,
            region: {
              province: user.province || '',
              city: user.city || '',
              cityCode: user.cityCode || '',
            },
          });
        }
      }

      // 更新每种类型的排名
      for (const rankType of Object.values(RankType)) {
        await this.rankingsService.updateAllRanks(rankType);
      }

      return {
        success: true,
        message: 'Generated mock rankings data successfully',
      };
    } catch (error) {
      console.error('Error generating mock data:', error);
      return {
        success: false,
        message: 'Failed to generate mock data',
        error: error.message,
      };
    }
  }

  @Get('cities')
  async getCitiesRanking() {
    const data = await this.rankingsService.getCitiesWithUserCount();
    return data;
  }

  @Post('delete-all')
  async deleteAllRankings(): Promise<DeleteResult> {
    return await this.rankingsService.deleteAll();
  }
}
