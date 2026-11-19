import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetMedicineBatchFilterDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by facility ID (only for admin and super admin)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  facilityId?: number;

  @ApiPropertyOptional({
    description: 'Filter by medicine ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  medicineId?: number;

  @ApiPropertyOptional({
    description: 'Filter by contraceptives',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    return value;
  }, { toClassOnly: true })
  @IsBoolean()
  contraceptive?: boolean;
}
