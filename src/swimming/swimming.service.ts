// swimming.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SwimmingRecord,
  SwimmingRecordDocument,
} from './schemas/swimming-record.schema';
import { UsersService } from '../users/users.service';
import { RankingsService } from '../rankings/rankings.service';
import { PointsService } from '../points/points.service';
import { RankType } from '../rankings/schemas/ranking.schema';
import { TaskType } from '../points/types/task-status.type'; // 添加这行导入

@Injectable()
export class SwimmingService {
  constructor(
    @InjectModel(SwimmingRecord.name)
    private swimmingRecordModel: Model<SwimmingRecordDocument>,
    private rankingsService: RankingsService,
    private usersService: UsersService,
    private readonly pointsService: PointsService, // 注入 PointsService
  ) {}

  async generateMockRecord(userId: string, openid: string) {
    console.log(userId);
    try {
      const mockData = {
        openid,
        date: new Date(),
        distance: this.getRandomNumber(100, 1000),
        duration: this.getRandomNumber(15, 60),
        strokes: this.getRandomNumber(200, 800),
        calories: this.getRandomNumber(100, 1000),
        poolLength: 50,
      };

      const record = new this.swimmingRecordModel(mockData);
      const savedRecord = await record.save();

      // 更新排行榜
      await this.updateRankings(openid, mockData.distance);

      // 获取今日总距离
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecords = await this.swimmingRecordModel.find({
        openid,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      });
      const totalDistance = todayRecords.reduce(
        (sum, record) => sum + record.distance,
        0,
      );

      if (totalDistance >= 1000) {
        await this.pointsService.completeTask(userId, TaskType.SWIM_1000M);
        await this.pointsService.completeTask(userId, TaskType.SWIM_500M);
      } else if (totalDistance >= 500) {
        await this.pointsService.completeTask(userId, TaskType.SWIM_500M);
      }

      return savedRecord;
    } catch (error) {
      console.error('Error generating mock record:', error);
      throw error;
    }
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  async createRecord(openid: string, recordData: Partial<SwimmingRecord>) {
    const record = new this.swimmingRecordModel({
      openid,
      ...recordData,
    });
    const savedRecord = await record.save();

    // 更新排行榜
    await this.updateRankings(openid, recordData.distance);
    return savedRecord;
  }

  async getLatestRecord(openid: string) {
    return this.swimmingRecordModel
      .findOne({ openid })
      .sort({ date: -1 })
      .exec();
  }

  async getMonthlyStats(openid: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.swimmingRecordModel.aggregate([
      {
        $match: {
          openid,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$calories' },
          recordCount: { $sum: 1 },
          averagePace: { $avg: '$averagePace' },
        },
      },
    ]);
  }

  async getTotalStats(openid: string) {
    return this.swimmingRecordModel
      .aggregate([
        {
          $match: { openid },
        },
        {
          $group: {
            _id: null,
            totalDistance: { $sum: '$distance' },
            totalDuration: { $sum: '$duration' },
            totalCalories: { $sum: '$calories' },
            recordCount: { $sum: 1 },
          },
        },
      ])
      .exec();
  }

  async getWeekRecord(openid: string, startDate: string, endDate: string) {
    // 转换日期字符串为 Date 对象
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 聚合查询获取每日数据
    const weeklyStats = await this.swimmingRecordModel.aggregate([
      {
        $match: {
          openid,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          distance: { $sum: '$distance' },
          duration: { $sum: '$duration' },
          calories: { $sum: '$calories' },
          recordCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          distance: 1,
          duration: 1,
          calories: 1,
          recordCount: 1,
          _id: 0,
        },
      },
    ]);

    // 计算总计数据
    const totals = await this.swimmingRecordModel.aggregate([
      {
        $match: {
          openid,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$calories' },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    return {
      daily: weeklyStats,
      totals: totals[0] || {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalRecords: 0,
      },
    };
  }

  async getMonthRecords(openid: string, year: number, month: number) {
    // 构建月份的起止时间
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 聚合查询获取每日数据
    const dailyRecords = await this.swimmingRecordModel.aggregate([
      {
        $match: {
          openid,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          distance: { $sum: '$distance' },
          duration: { $sum: '$duration' },
          calories: { $sum: '$calories' },
          recordCount: { $sum: 1 },
          averagePace: { $avg: '$averagePace' },
          poolLength: { $first: '$poolLength' },
          laps: { $sum: 1 }, // 假设每条记录代表一趟
        },
      },
      {
        $sort: { _id: -1 }, // 按日期降序排序
      },
      {
        $project: {
          date: '$_id',
          distance: 1,
          duration: 1,
          calories: 1,
          recordCount: 1,
          averagePace: 1,
          poolLength: 1,
          laps: 1,
          _id: 0,
        },
      },
    ]);

    // 计算月度总计数据
    const totals = await this.swimmingRecordModel.aggregate([
      {
        $match: {
          openid,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$calories' },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    return {
      dailyRecords, // 每日详细记录
      totals: totals[0] || {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalRecords: 0,
      },
    };
  }

  async getYearRecords(openid: string, year: number) {
    // 构建年份的起止时间
    const startDate = new Date(year, 0, 1); // 1月1日
    const endDate = new Date(year + 1, 0, 0); // 12月31日

    // 聚合查询获取每月数据
    const monthlyRecords = await this.swimmingRecordModel.aggregate([
      {
        $match: {
          openid,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          distance: { $sum: '$distance' },
          duration: { $sum: '$duration' },
          calories: { $sum: '$calories' },
          trainingCount: { $sum: 1 },
          averagePace: { $avg: '$averagePace' },
          totalLaps: { $sum: 1 }, // 假设每条记录代表一趟
        },
      },
      {
        $sort: { '_id.month': -1 }, // 按月份降序排序
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
            ],
          },
          distance: 1,
          duration: 1,
          calories: 1,
          trainingCount: 1,
          averagePace: 1,
          totalLaps: 1,
        },
      },
    ]);

    // 计算年度总计数据
    const totals = await this.swimmingRecordModel.aggregate([
      {
        $match: {
          openid,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$calories' },
          totalTrainingCount: { $sum: 1 },
          totalLaps: { $sum: 1 },
        },
      },
    ]);

    return {
      monthlyRecords, // 每月详细记录
      totals: totals[0] || {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalTrainingCount: 0,
        totalLaps: 0,
      },
    };
  }

  async getTotalRecords(openid: string) {
    // 获取所有训练日期的详细记录
    const dailyRecords = await this.swimmingRecordModel.aggregate([
      {
        $match: { openid },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          distance: { $sum: '$distance' },
          duration: { $sum: '$duration' },
          calories: { $sum: '$calories' },
          averagePace: { $avg: '$averagePace' },
          poolLength: { $first: '$poolLength' },
          laps: { $sum: 1 }, // 假设每条记录代表一趟
        },
      },
      {
        $sort: { _id: -1 }, // 按日期降序排序
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          distance: 1,
          duration: 1,
          calories: 1,
          averagePace: 1,
          poolLength: 1,
          laps: 1,
        },
      },
    ]);

    // 计算总计数据
    const totals = await this.swimmingRecordModel.aggregate([
      {
        $match: { openid },
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$calories' },
          totalTrainingCount: { $sum: 1 },
          totalLaps: { $sum: 1 },
        },
      },
    ]);

    return {
      dailyRecords,
      totals: totals[0] || {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalTrainingCount: 0,
        totalLaps: 0,
      },
    };
  }

  async getMonthlyTarget(openid: string, year: number, month: number) {
    // 这里可以添加月度目标表的查询逻辑
    return {
      targetDistance: 2000, // 示例：目标游泳距离2000米
      currentDistance: 200, // 当前已完成距离
      completionRate: 0.1, // 完成率10%
    };
  }

  async getDateRecord(openid: string, date: string) {
    // 构建日期范围
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return this.swimmingRecordModel
      .findOne({
        openid,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();
  }

  async getMonthRecordDates(openid: string, year: number, month: number) {
    // 构建月份的起止时间
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.swimmingRecordModel
      .find(
        {
          openid,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
        {
          date: 1,
          _id: 0,
        },
      )
      .exec();

    // 修改返回格式，确保返回完整的日期字符串
    return records.map((record) => {
      const date = new Date(record.date);
      // 返回格式化的日期字符串 'YYYY-MM-DD'
      return (
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0')
      );
    });
  }

  private async updateRankings(openid: string, distance: number) {
    try {
      const user = await this.usersService.findOne(openid);

      // 更新不同时间维度的排行榜
      const rankingUpdates = [
        this.updateRankingForType(openid, RankType.DAILY, distance, user),
        this.updateRankingForType(openid, RankType.WEEKLY, distance, user),
        this.updateRankingForType(openid, RankType.MONTHLY, distance, user),
        this.updateRankingForType(openid, RankType.YEARLY, distance, user),
        this.updateRankingForType(openid, RankType.TOTAL, distance, user),
      ];

      await Promise.all(rankingUpdates);
    } catch (error) {
      console.error('Error updating rankings:', error);
      throw error;
    }
  }

  private async updateRankingForType(
    openid: string,
    rankType: RankType,
    distance: number,
    user: any,
  ) {
    await this.rankingsService.updateUserStats(
      user._id,
      rankType,
      distance,
      true,
      {
        province: user.province,
        city: user.city,
        cityCode: user.cityCode,
      },
    );
    await this.rankingsService.updateAllRanks(rankType);
  }
}
