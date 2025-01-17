// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRelationsService } from '../user-relations/user-relations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatsDto } from './dto/update-user-stats.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CosService } from 'src/cos/cos.service';
import { Types } from 'mongoose';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cosService: CosService,
    @Inject(forwardRef(() => UserRelationsService))
    private readonly userRelationsService: UserRelationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user) {
    const userRecord = await this.usersService.findOne(user.openid);
    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    // 获取实时的粉丝数和关注数
    const [followers, following] = await Promise.all([
      this.userRelationsService.getFollowers(
        new Types.ObjectId(userRecord._id),
      ),
      this.userRelationsService.getFollowing(
        new Types.ObjectId(userRecord._id),
      ),
    ]);

    const userObject = JSON.parse(JSON.stringify(userRecord));
    return {
      ...userObject,
      followers: followers.length,
      following: following.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  async updateCurrentUser(
    @CurrentUser() user,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.openid, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async updateUserStats(
    @CurrentUser() user,
    @Body() statsDto: UpdateUserStatsDto,
  ) {
    return this.usersService.updateStats(user.openid, statsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/points')
  async addPoints(@CurrentUser() user, @Body('points') points: number) {
    return this.usersService.incrementPoints(user.openid, points);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/follow-stats')
  async updateFollowStats(
    @CurrentUser() user,
    @Body() change: { followers?: number; following?: number },
  ) {
    return this.usersService.updateFollowStats(user.openid, change);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser() user,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = await this.cosService.uploadFile(file);
    return this.usersService.updateProfile(user.openid, { avatarUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string, @CurrentUser() currentUser) {
    console.log(id);
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 检查是否被拉黑
    const isBlocked = await this.userRelationsService.isBlocked(
      new Types.ObjectId(user._id),
      new Types.ObjectId(currentUser.userId),
    );
    if (isBlocked) {
      throw new NotFoundException('User not found');
    }

    // 检查关系状态
    const [isFollowing, amIBlocked, followers, following] = await Promise.all([
      this.userRelationsService.isFollowing(
        new Types.ObjectId(currentUser.userId),
        new Types.ObjectId(user._id),
      ),
      this.userRelationsService.isBlocked(
        new Types.ObjectId(currentUser.userId),
        new Types.ObjectId(user._id),
      ),
      this.userRelationsService.getFollowers(new Types.ObjectId(user._id)),
      this.userRelationsService.getFollowing(new Types.ObjectId(user._id)),
    ]);

    const userObject = JSON.parse(JSON.stringify(user));
    return {
      ...userObject,
      followers: followers.length,
      following: following.length,
      isFollowing,
      isBlocked: amIBlocked,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/followers')
  async getUserFollowers(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRelationsService.getFollowers(new Types.ObjectId(user._id));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/following')
  async getUserFollowing(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRelationsService.getFollowing(new Types.ObjectId(user._id));
  }
}
