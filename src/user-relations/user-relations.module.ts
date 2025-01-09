// src/user-relations/user-relations.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRelationsController } from './user-relations.controller';
import { UserRelationsService } from './user-relations.service';
import {
  UserRelation,
  UserRelationSchema,
} from './schemas/user-relation.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserRelation.name, schema: UserRelationSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [UserRelationsController],
  providers: [UserRelationsService],
  exports: [UserRelationsService],
})
export class UserRelationsModule {}
