import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Points, PointsDocument } from './schemas/points.schema';
import {
  PointsHistory,
  PointsHistoryDocument,
} from './schemas/points-history.schema';
import { TaskStatus, TaskType, POINTS_CONFIG } from './types/task-status.type';
import { DailyTask, DailyTaskDocument } from './schemas/daily-task.schema';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(Points.name) private pointsModel: Model<PointsDocument>,
    @InjectModel(PointsHistory.name)
    private pointsHistoryModel: Model<PointsHistoryDocument>,
    @InjectModel(DailyTask.name)
    private dailyTaskModel: Model<DailyTaskDocument>,
  ) {}

  async getUserPoints(userId: string): Promise<Points> {
    let userPoints = await this.pointsModel.findOne({ userId });
    if (!userPoints) {
      userPoints = await this.pointsModel.create({ userId });
    }
    return userPoints;
  }

  async addPoints(userId: string, type: TaskType) {
    const { points } = POINTS_CONFIG[type];

    // 更新用户总积分，使用正确的字段名 totalPoints
    await this.pointsModel.findOneAndUpdate(
      { userId },
      { $inc: { totalPoints: points } },
      { upsert: true },
    );

    // 创建积分历史记录
    await this.pointsHistoryModel.create({
      userId,
      type,
      points,
      createdAt: new Date(),
    });

    return points;
  }

  async getPointsHistory(userId: string): Promise<PointsHistory[]> {
    return this.pointsHistoryModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getDailyTasksStatus(userId: string): Promise<TaskStatus[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 添加日志调试
    console.log('Searching for userId:', userId);

    // 获取今天的任务完成记录
    const todayTasks = await this.dailyTaskModel
      .find({
        userId: userId.toString(), // 确保 userId 是字符串
        completedAt: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      })
      .lean(); // 使用 lean() 获取纯 JavaScript 对象

    console.log('Today tasks:', todayTasks); // 添加日志

    // 构建任务状态列表
    const tasks: TaskStatus[] = Object.entries(POINTS_CONFIG).map(
      ([type, config]) => {
        const completed = todayTasks.some((task) => task.taskType === type);
        return {
          type: type as TaskType,
          points: config.points,
          description: config.description,
          completed,
        };
      },
    );

    return tasks;
  }

  async completeTask(userId: string, taskType: TaskType) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查任务是否已完成
    const existingTask = await this.dailyTaskModel.findOne({
      userId,
      taskType,
      completedAt: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    console.log(existingTask);

    if (!existingTask) {
      const { points } = POINTS_CONFIG[taskType];

      // 创建任务完成记录
      await this.dailyTaskModel.create({
        userId,
        taskType,
        completedAt: new Date(),
        points,
      });

      // 添加积分
      await this.addPoints(userId, taskType);
    }
  }
}
