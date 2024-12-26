import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RankType } from './schemas/ranking.schema';

@Controller('rankings')
@UseGuards(JwtAuthGuard)
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  getTopRankings(
    @Query('type') rankType: RankType,
    @Query('limit') limit: number,
  ) {
    return this.rankingsService.getTopRankings(rankType, limit);
  }

  @Get('me')
  getMyRanking(@CurrentUser() user, @Query('type') rankType: RankType) {
    return this.rankingsService.findByUser(user.userId, rankType);
  }

  @Get('region')
  getRegionalRankings(
    @Query('type') rankType: RankType,
    @Query('province') province: string,
    @Query('city') city?: string,
  ) {
    return this.rankingsService.getRegionalRankings(rankType, province, city);
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
}
