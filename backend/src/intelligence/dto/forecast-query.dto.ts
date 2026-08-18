import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ForecastQueryDto {
  @IsOptional()
  @IsString()
  buildingId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(168)
  horizonHours?: number = 24;

  @IsOptional()
  @IsString()
  @IsIn(['15m', '30m', '1h', '6h', '1d'])
  interval?: string = '1h';

  @IsOptional()
  @IsString()
  @IsIn(['auto', 'fastapi', 'fallback'])
  source?: string = 'auto';
}
