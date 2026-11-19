import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsInt, Min } from 'class-validator';
import { ServiceType } from 'src/common/enums/enums';
import { TelehealthAvailabilityStatus } from '../enums/telehealth.enums';

export class TelehealthQueueQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({ enum: ServiceType, example: ServiceType.OPD })
  @IsOptional()
  @IsEnum(ServiceType)
  service_type?: ServiceType;

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({
    enum: TelehealthAvailabilityStatus,
    example: TelehealthAvailabilityStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(TelehealthAvailabilityStatus)
  availability?: TelehealthAvailabilityStatus;
}
