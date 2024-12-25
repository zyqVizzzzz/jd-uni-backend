import { IsNumber, Min } from 'class-validator';

export class UpdateUserStatsDto {
  @IsNumber()
  @Min(0)
  points: number;

  @IsNumber()
  @Min(0)
  following: number;

  @IsNumber()
  @Min(0)
  followers: number;
}
