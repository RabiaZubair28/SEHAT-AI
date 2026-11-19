import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateEmergencyVitalDto {
  @ApiPropertyOptional({ example: 98.6 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  temperature?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  pulse?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  systolic_bp?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  diastolic_bp?: number;

  @ApiPropertyOptional({ example: 16 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  respiratory_rate?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  spo2?: number;
}
