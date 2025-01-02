// src/comments/comments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('moment/:momentId')
  createMomentComment(
    @CurrentUser() user,
    @Param('momentId') momentId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.userId, momentId, createCommentDto);
  }

  @Post('reply/:commentId')
  replyToComment(
    @CurrentUser() user,
    @Param('commentId') commentId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    console.log(user.userId, commentId);
    return this.commentsService.createReply(
      user.userId,
      commentId,
      createCommentDto,
    );
  }

  @Get('moment/:momentId')
  findByMomentId(@Param('momentId') momentId: string) {
    return this.commentsService.findByMomentId(momentId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user) {
    return this.commentsService.remove(id, user.userId);
  }
}
