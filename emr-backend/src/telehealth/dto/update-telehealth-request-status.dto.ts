import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTelehealthRequestStatusDto {
  @ApiPropertyOptional({ example: 'Currently in emergency OT, will pick next request.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
