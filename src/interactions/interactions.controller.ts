// src/interactions/interactions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';

@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('comments')
  createComment(
    @CurrentUser() user,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.interactionsService.createComment(
      user.userId,
      createCommentDto,
    );
  }

  @Get('comments')
  getComments(@Query() query: QueryCommentDto) {
    return this.interactionsService.getComments(query);
  }

  @Delete('comments/:id')
  deleteComment(@CurrentUser() user, @Param('id') id: string) {
    return this.interactionsService.deleteComment(user.userId, id);
  }

  @Post(':type/:id/like')
  toggleLike(
    @CurrentUser() user,
    @Param('id') id: string,
    @Param('type') type: 'moment' | 'comment',
  ) {
    return this.interactionsService.toggleLike(user.userId, id, type);
  }

  @Get(':type/like-status')
  checkLikeStatus(
    @CurrentUser() user,
    @Query('ids') ids: string,
    @Param('type') type: 'moment' | 'comment',
  ) {
    const targetIds = ids.split(',');
    return this.interactionsService.checkLikeStatus(
      user.userId,
      targetIds,
      type,
    );
  }
}
