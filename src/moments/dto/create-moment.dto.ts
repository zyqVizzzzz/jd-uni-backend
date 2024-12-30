export class CreateMomentDto {
  content: string;
  images?: string[];
  location?: {
    coordinates: [number, number];
    city?: string;
    district?: string;
    address?: string;
  };
  visibility?: 'public' | 'friends' | 'private';
  metadata?: Record<string, any>;
}
