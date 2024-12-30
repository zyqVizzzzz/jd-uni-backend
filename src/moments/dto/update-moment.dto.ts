// src/moments/dto/update-moment.dto.ts
export class UpdateMomentDto {
  content?: string;
  images?: string[];
  visibility?: 'public' | 'friends' | 'private';
}
