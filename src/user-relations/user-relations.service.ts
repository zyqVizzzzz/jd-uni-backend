// src/user-relations/user-relations.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserRelation,
  UserRelationDocument,
  RelationType,
} from './schemas/user-relation.schema';

@Injectable()
export class UserRelationsService {
  constructor(
    @InjectModel(UserRelation.name)
    private relationModel: Model<UserRelationDocument>,
  ) {}

  async followUser(fromUserId: Types.ObjectId, toUserId: Types.ObjectId) {
    return this.relationModel.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: toUserId,
        type: RelationType.FOLLOW,
      },
      { isDeleted: false },
      { upsert: true, new: true },
    );
  }

  async unfollowUser(fromUserId: Types.ObjectId, toUserId: Types.ObjectId) {
    return this.relationModel.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: toUserId,
        type: RelationType.FOLLOW,
      },
      { isDeleted: true },
    );
  }

  async blockUser(fromUserId: Types.ObjectId, toUserId: Types.ObjectId) {
    return this.relationModel.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: toUserId,
        type: RelationType.BLOCK,
      },
      { isDeleted: false },
      { upsert: true, new: true },
    );
  }

  async unblockUser(fromUserId: Types.ObjectId, toUserId: Types.ObjectId) {
    return this.relationModel.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: toUserId,
        type: RelationType.BLOCK,
      },
      { isDeleted: true },
    );
  }

  async getFollowers(userId: Types.ObjectId) {
    return this.relationModel
      .find({
        toUser: userId,
        type: RelationType.FOLLOW,
        isDeleted: false,
      })
      .populate('fromUser');
  }

  async getFollowing(userId: Types.ObjectId) {
    return this.relationModel
      .find({
        fromUser: userId,
        type: RelationType.FOLLOW,
        isDeleted: false,
      })
      .populate('toUser');
  }

  async getBlockedUsers(userId: Types.ObjectId) {
    return this.relationModel
      .find({
        fromUser: userId,
        type: RelationType.BLOCK,
        isDeleted: false,
      })
      .populate('toUser');
  }

  async isFollowing(
    fromUserId: Types.ObjectId,
    toUserId: Types.ObjectId,
  ): Promise<boolean> {
    const relation = await this.relationModel.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
      type: RelationType.FOLLOW,
      isDeleted: false,
    });
    return !!relation;
  }

  async isBlocked(
    fromUserId: Types.ObjectId,
    toUserId: Types.ObjectId,
  ): Promise<boolean> {
    const relation = await this.relationModel.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
      type: RelationType.BLOCK,
      isDeleted: false,
    });
    return !!relation;
  }
}
