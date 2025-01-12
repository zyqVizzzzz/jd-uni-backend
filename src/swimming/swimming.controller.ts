import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SwimmingService } from './swimming.service';

@Controller('swimming')
@UseGuards(JwtAuthGuard)
export class SwimmingController {
  constructor(private readonly swimmingService: SwimmingService) {}

  @Post('generate-mock')
  async generateMockRecord(@CurrentUser() user) {
    console.log(user);
    return this.swimmingService.generateMockRecord(user.userId, user.openid);
  }

  @Post('records')
  async createRecord(@CurrentUser() user, @Body() recordData: any) {
    return this.swimmingService.createRecord(user.openid, recordData);
  }

  @Get('date-record')
  async getDateRecord(@CurrentUser() user, @Query('date') date: string) {
    console.log(user, date);
    return this.swimmingService.getDateRecord(user.openid, date);
  }

  @Get('week-record')
  async getWeekRecord(
    @CurrentUser() user,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.swimmingService.getWeekRecord(user.openid, startDate, endDate);
  }

  @Get('month-records')
  async getMonthRecords(
    @CurrentUser() user,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.swimmingService.getMonthRecords(
      user.openid,
      Number(year),
      Number(month),
    );
  }

  @Get('year-records')
  async getYearRecords(@CurrentUser() user, @Query('year') year: number) {
    return this.swimmingService.getYearRecords(user.openid, Number(year));
  }

  @Get('total-records')
  async getTotalRecords(@CurrentUser() user) {
    return this.swimmingService.getTotalRecords(user.openid);
  }

  @Get('latest')
  async getLatestRecord(@CurrentUser() user) {
    return this.swimmingService.getLatestRecord(user.openid);
  }

  @Get('total-stats')
  async getTotalStats(@CurrentUser() user) {
    const stats = await this.swimmingService.getTotalStats(user.openid);
    return (
      stats[0] || {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        recordCount: 0,
      }
    );
  }

  @Get('month-record-dates')
  async getMonthRecordDates(
    @CurrentUser() user,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.swimmingService.getMonthRecordDates(
      user.openid,
      Number(year),
      Number(month),
    );
  }

  @Get('monthly-stats')
  async getMonthlyStats(
    @CurrentUser() user,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.swimmingService.getMonthlyStats(user.openid, year, month);
  }

  @Get('monthly-target')
  async getMonthlyTarget(
    @CurrentUser() user,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.swimmingService.getMonthlyTarget(user.openid, year, month);
  }
}
