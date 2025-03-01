import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { Ranking, RankingSchema } from './schemas/ranking.schema';
import { UsersModule } from 'src/users/users.module';
import { UserRelationsModule } from '../user-relations/user-relations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ranking.name, schema: RankingSchema }]),
    UsersModule,
    UserRelationsModule,
  ],
  controllers: [RankingsController],
  providers: [RankingsService],
  exports: [RankingsService],
})
export class RankingsModule {}
