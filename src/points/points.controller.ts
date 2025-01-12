import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskType } from './types/task-status.type';

@Controller('points')
@UseGuards(AuthGuard('jwt'))
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get()
  async getUserPoints(@CurrentUser() user: any) {
    console.log(user);
    return this.pointsService.getUserPoints(user.userId);
  }

  @Post('task')
  async completeTask(@CurrentUser() user: any, @Body('type') type: TaskType) {
    console.log(user);
    return this.pointsService.addPoints(user.userId, type);
  }

  @Get('history')
  async getPointsHistory(@CurrentUser() user: any) {
    console.log(user);
    return this.pointsService.getPointsHistory(user.userId);
  }

  @Get('daily-tasks')
  async getDailyTasks(@CurrentUser() user: any) {
    console.log(2, user);
    return this.pointsService.getDailyTasksStatus(user.userId);
  }
}
