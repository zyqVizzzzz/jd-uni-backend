// users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatsDto } from './dto/update-user-stats.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(openid: string): Promise<User | null> {
    return this.userModel.findOne({ openid }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findOneAndUpdate(
    openid: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate(
        { openid },
        { ...updateData, lastLoginAt: new Date() },
        { new: true, upsert: true },
      )
      .exec();
  }

  async updateUserInfo(openid: string, userInfo: any): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate(
        { openid },
        {
          nickname: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city,
          language: userInfo.language,
        },
        { new: true },
      )
      .exec();
  }

  async updateProfile(
    openid: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate({ openid }, { $set: updateUserDto }, { new: true })
      .exec();
  }

  async updateStats(
    openid: string,
    statsDto: UpdateUserStatsDto,
  ): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate({ openid }, { $set: statsDto }, { new: true })
      .exec();
  }

  async incrementPoints(openid: string, points: number): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate({ openid }, { $inc: { points } }, { new: true })
      .exec();
  }

  async updateFollowStats(
    openid: string,
    change: { followers?: number; following?: number },
  ): Promise<User | null> {
    const update: any = {};
    if (change.followers) update.followers = change.followers;
    if (change.following) update.following = change.following;

    return this.userModel
      .findOneAndUpdate({ openid }, { $inc: update }, { new: true })
      .exec();
  }
}
