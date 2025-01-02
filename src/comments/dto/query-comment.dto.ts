// src/comments/dto/query-comment.dto.ts
import { IsOptional, IsNumber, Min, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCommentDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
