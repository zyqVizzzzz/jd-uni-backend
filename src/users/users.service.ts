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

  async findById(id: string): Promise<User | null> {
    try {
      return this.userModel.findById(id).exec();
    } catch (error) {
      // Handle invalid ObjectId format
      return null;
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel({
      ...userData,
      lastLoginAt: new Date(),
    });
    return user.save();
  }

  async findOneAndUpdate(openid: string, updateData: any, isLogin = false) {
    console.log(openid);
    let user = await this.userModel.findOne({ openid });

    if (!user) {
      // 只在首次创建用户时设置默认信息
      user = await this.userModel.create({
        openid,
        nickname: '未设置昵称',
        avatarUrl: '/static/avatar.jpg',
        ...updateData,
      });
    } else if (isLogin) {
      // 如果是登录操作，只更新登录时间
      user = await this.userModel.findOneAndUpdate(
        { openid },
        { lastLoginAt: updateData.lastLoginAt },
        { new: true },
      );
    } else {
      // 其他更新操作（如更新用户信息）
      user = await this.userModel.findOneAndUpdate({ openid }, updateData, {
        new: true,
      });
    }

    return user;
  }

  async updateLoginTime(openid: string): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate({ openid }, { lastLoginAt: new Date() }, { new: true })
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

  async getCitiesWithUserCount() {
    return this.userModel
      .aggregate([
        {
          $match: {
            city: { $exists: true, $ne: '' },
            cityCode: { $exists: true, $ne: '' }, // 确保有cityCode
          },
        },
        {
          $group: {
            _id: '$cityCode', // 使用cityCode作为分组依据
            city: { $first: '$city' }, // 保留城市名称
            cityCode: { $first: '$cityCode' }, // 保留城市代码
            userCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            city: 1,
            cityCode: 1,
            userCount: 1,
          },
        },
        {
          $sort: { userCount: -1 },
        },
      ])
      .exec();
  }
}
