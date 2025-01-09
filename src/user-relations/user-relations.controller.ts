// src/user-relations/user-relations.controller.ts
import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Get,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRelationsService } from './user-relations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('user-relations')
@UseGuards(JwtAuthGuard)
export class UserRelationsController {
  constructor(
    private readonly userRelationsService: UserRelationsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  @Post('follow/:userId')
  async followUser(
    @CurrentUser() currentUser,
    @Param('userId') targetUserId: string,
  ) {
    // 检查目标用户是否存在
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // 检查是否是自己
    // if (currentUser.openid === targetUserId) {
    //   throw new ConflictException('Cannot follow yourself');
    // }

    // 检查是否已经被对方拉黑
    const isBlocked = await this.userRelationsService.isBlocked(
      new Types.ObjectId(targetUser._id),
      new Types.ObjectId(currentUser.userId),
    );
    if (isBlocked) {
      throw new ForbiddenException('Unable to follow this user');
    }

    // 创建关注关系
    await this.userRelationsService.followUser(
      new Types.ObjectId(currentUser.userId),
      new Types.ObjectId(targetUser._id),
    );

    // 更新双方的关注/粉丝数
    await this.usersService.updateFollowStats(currentUser.openid, {
      following: 1,
    });
    await this.usersService.updateFollowStats(targetUserId, { followers: 1 });

    return { message: 'Successfully followed user' };
  }

  @Delete('follow/:userId')
  async unfollowUser(
    @CurrentUser() currentUser,
    @Param('userId') targetUserId: string,
  ) {
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    await this.userRelationsService.unfollowUser(
      new Types.ObjectId(currentUser.userId),
      new Types.ObjectId(targetUser._id),
    );

    // 更新双方的关注/粉丝数
    await this.usersService.updateFollowStats(currentUser.openid, {
      following: -1,
    });
    await this.usersService.updateFollowStats(targetUserId, { followers: -1 });

    return { message: 'Successfully unfollowed user' };
  }

  @Post('block/:userId')
  async blockUser(
    @CurrentUser() currentUser,
    @Param('userId') targetUserId: string,
  ) {
    const targetUser = await this.usersService.findOne(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (currentUser.openid === targetUserId) {
      throw new ConflictException('Cannot block yourself');
    }

    // 如果之前有关注关系，先解除关注
    const isFollowing = await this.userRelationsService.isFollowing(
      new Types.ObjectId(currentUser.userId),
      new Types.ObjectId(targetUser._id),
    );
    if (isFollowing) {
      await this.unfollowUser(currentUser, targetUserId);
    }

    await this.userRelationsService.blockUser(
      new Types.ObjectId(currentUser.userId),
      new Types.ObjectId(targetUser._id),
    );

    return { message: 'Successfully blocked user' };
  }

  @Delete('block/:userId')
  async unblockUser(
    @CurrentUser() currentUser,
    @Param('userId') targetUserId: string,
  ) {
    const targetUser = await this.usersService.findOne(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    await this.userRelationsService.unblockUser(
      new Types.ObjectId(currentUser.userId),
      new Types.ObjectId(targetUser._id),
    );

    return { message: 'Successfully unblocked user' };
  }

  @Get('followers')
  async getFollowers(@CurrentUser() currentUser) {
    const followers = await this.userRelationsService.getFollowers(
      new Types.ObjectId(currentUser.userId),
    );
    return followers;
  }

  @Get('following')
  async getFollowing(@CurrentUser() currentUser) {
    const following = await this.userRelationsService.getFollowing(
      new Types.ObjectId(currentUser.userId),
    );
    return following;
  }

  @Get('blocked')
  async getBlockedUsers(@CurrentUser() currentUser) {
    const blockedUsers = await this.userRelationsService.getBlockedUsers(
      new Types.ObjectId(currentUser.userId),
    );
    return blockedUsers;
  }

  @Get('check/:userId')
  async checkRelation(
    @CurrentUser() currentUser,
    @Param('userId') targetUserId: string,
  ) {
    const targetUser = await this.usersService.findOne(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const [isFollowing, isBlocked] = await Promise.all([
      this.userRelationsService.isFollowing(
        new Types.ObjectId(currentUser.userId),
        new Types.ObjectId(targetUser._id),
      ),
      this.userRelationsService.isBlocked(
        new Types.ObjectId(currentUser.userId),
        new Types.ObjectId(targetUser._id),
      ),
    ]);

    return {
      isFollowing,
      isBlocked,
    };
  }
}
