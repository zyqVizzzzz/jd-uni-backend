// src/moments/moments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MomentsService } from './moments.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { QueryMomentDto } from './dto/query-moment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CosService } from '../cos/cos.service';

@Controller('moments')
@UseGuards(JwtAuthGuard)
export class MomentsController {
  constructor(
    private readonly momentsService: MomentsService,
    private readonly cosService: CosService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('images')) // 改为单张图片上传
  async uploadImages(@UploadedFile() file: Express.Multer.File) {
    console.log('接收到的文件:', file);
    const imageUrl = await this.cosService.uploadFile(file);
    return {
      imageUrls: [imageUrl], // 保持返回数组格式，便于前端处理
    };
  }

  @Post()
  create(@CurrentUser() user, @Body() createMomentDto: CreateMomentDto) {
    console.log(user.userId);
    return this.momentsService.create(user.userId, createMomentDto);
  }

  @Get()
  findAll(@Query() query: QueryMomentDto, @CurrentUser() user) {
    console.log(query);
    return this.momentsService.findAll(query, user?.userId);
  }

  @Get('nearby')
  findNearby(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('maxDistance') maxDistance?: number,
    @Query('limit') limit?: number,
  ) {
    return this.momentsService.findNearby(
      [longitude, latitude],
      maxDistance,
      limit,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.momentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user,
    @Body() updateMomentDto: UpdateMomentDto,
  ) {
    return this.momentsService.update(id, user.userId, updateMomentDto);
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @CurrentUser() user) {
    return this.momentsService.toggleLike(id, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.momentsService.remove(id, user.userId);
  }
}
