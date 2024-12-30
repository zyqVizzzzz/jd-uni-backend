// src/moments/dto/query-moment.dto.ts
export class QueryMomentDto {
  page?: number = 1;
  limit?: number = 20;
  type?: 'recommend' | 'nearby' | 'following';
  userId?: string;
  city?: string;
}
