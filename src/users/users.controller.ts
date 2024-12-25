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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatsDto } from './dto/update-user-stats.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CosService } from 'src/cos/cos.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cosService: CosService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user) {
    const userRecord = await this.usersService.findOne(user.openid);
    if (!userRecord) {
      throw new NotFoundException('User not found');
    }
    return userRecord;
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
}
