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
  UploadedFiles,
} from '@nestjs/common';
import { MomentsService } from './moments.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { QueryMomentDto } from './dto/query-moment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CosService } from '../cos/cos.service';

@Controller('moments')
@UseGuards(JwtAuthGuard)
export class MomentsController {
  constructor(
    private readonly momentsService: MomentsService,
    private readonly cosService: CosService,
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 9)) // 最多允许上传9张图片
  async uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    const uploadPromises = files.map((file) =>
      this.cosService.uploadFile(file),
    );
    const imageUrls = await Promise.all(uploadPromises);
    return { imageUrls };
  }

  @Post()
  create(@CurrentUser() user, @Body() createMomentDto: CreateMomentDto) {
    return this.momentsService.create(user.userId, createMomentDto);
  }

  @Get()
  findAll(@Query() query: QueryMomentDto) {
    return this.momentsService.findAll(query);
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

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.momentsService.remove(id, user.userId);
  }
}
