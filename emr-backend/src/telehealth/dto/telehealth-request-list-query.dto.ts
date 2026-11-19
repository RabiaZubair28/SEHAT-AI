import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TelehealthRequestStatus } from '../enums/telehealth.enums';

export class TelehealthRequestListQueryDto {
  @ApiPropertyOptional({ enum: TelehealthRequestStatus })
  @IsOptional()
  @IsEnum(TelehealthRequestStatus)
  status?: TelehealthRequestStatus;
}
