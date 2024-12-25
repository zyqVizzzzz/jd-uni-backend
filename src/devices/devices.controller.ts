import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@CurrentUser() user, @Body() createDeviceDto: any) {
    return this.devicesService.create({
      ...createDeviceDto,
      user_id: user.userId,
    });
  }

  @Get()
  findAll(@CurrentUser() user) {
    return this.devicesService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Get('user/:openid')
  findByOpenid(@Param('openid') openid: string) {
    return this.devicesService.findByOpenid(openid);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDeviceDto: any) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.devicesService.updateDeviceStatus(id, status);
  }
}
