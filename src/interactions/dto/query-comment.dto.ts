// src/interactions/dto/query-comment.dto.ts
import { IsMongoId, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCommentDto {
  @IsMongoId()
  @IsNotEmpty()
  momentId: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
