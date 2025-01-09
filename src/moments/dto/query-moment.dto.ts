// src/moments/dto/query-moment.dto.ts
import { IsEnum, IsOptional } from 'class-validator';

export enum MomentType {
  ALL = 'all',
  FOLLOWING = 'following',
  MY = 'my',
}

export class QueryMomentDto {
  @IsOptional()
  @IsEnum(MomentType)
  type?: MomentType;

  page?: number;
  limit?: number;
  city?: string;
  userId?: string;
}
