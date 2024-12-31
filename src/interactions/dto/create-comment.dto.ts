// src/interactions/dto/create-comment.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @IsMongoId()
  @IsNotEmpty()
  momentId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsMongoId()
  @IsOptional()
  replyTo?: string;
}
