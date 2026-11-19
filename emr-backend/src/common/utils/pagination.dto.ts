import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  IsNumberString,
  IsEnum,
} from 'class-validator';
import { LevelOfCare } from '../enums/enums';

export class PaginationDto {
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

  @ApiPropertyOptional({
    description: 'Facility ID (admin/super_admin only)',
    type: Number,
  })
  @IsOptional()
  @IsNumberString()
  facility_id?: number;

  @ApiPropertyOptional({
    description: 'Level of Care for filtering',
    enum: LevelOfCare,
  })
  @IsOptional()
  @IsEnum(LevelOfCare)
  LevelOfCare?: LevelOfCare;
}
