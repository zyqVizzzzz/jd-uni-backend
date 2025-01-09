// src/moments/moments.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MomentsController } from './moments.controller';
import { MomentsService } from './moments.service';
import { Moment, MomentSchema } from './schemas/moment.schema';
import { CosModule } from '../cos/cos.module';
import { UserRelationsModule } from '../user-relations/user-relations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Moment.name, schema: MomentSchema }]),
    CosModule,
    UserRelationsModule,
  ],
  controllers: [MomentsController],
  providers: [MomentsService],
  exports: [MomentsService],
})
export class MomentsModule {}
