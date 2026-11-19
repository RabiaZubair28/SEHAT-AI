import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class GetDashboardQueryDto {
  @ApiPropertyOptional({
    name: 'date',
    type: String,
    example: '2025-12-31',
    description: 'YYYY-MM-DD calendar date. Defaults to today.',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description:
      'Optional facility scope for Super Admin/Admin/Head Office. If omitted, data is aggregated across all facilities.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.facility_id;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  facilityId?: number;

  @ApiPropertyOptional({
    description: 'Snake_case alias for facilityId.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.facilityId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  facility_id?: number;

  @ApiPropertyOptional({
    description:
      'Optional district scope for Super Admin/Admin. Ignored when facilityId is provided.',
    type: Number,
  })
  @IsOptional()
  @Transform(
    ({ value, obj }) => {
      const raw = value ?? obj?.district_id;
      const parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    },
    { toClassOnly: true },
  )
  @IsInt()
  @IsPositive()
  districtId?: number;

  @ApiPropertyOptional({
    description: 'Page for totalFacilityStaffRecords.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @Min(1)
  totalFacilityStaffRecordsPage?: number;

  @ApiPropertyOptional({
    description: 'Limit for totalFacilityStaffRecords.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @Min(1)
  @Max(100)
  totalFacilityStaffRecordsLimit?: number;

  @ApiPropertyOptional({
    description: 'Page for checkedInUsers.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @Min(1)
  checkedInUsersPage?: number;

  @ApiPropertyOptional({
    description: 'Limit for checkedInUsers.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @Min(1)
  @Max(100)
  checkedInUsersLimit?: number;

  @ApiPropertyOptional({
    description: 'Page for checkedOutUsers.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @Min(1)
  checkedOutUsersPage?: number;

  @ApiPropertyOptional({
    description: 'Limit for checkedOutUsers.',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @Min(1)
  @Max(100)
  checkedOutUsersLimit?: number;

  @ApiPropertyOptional({
    description:
      'Search for totalFacilityStaffRecords by first name, last name, full name, or role.',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, { toClassOnly: true })
  @IsString()
  @MaxLength(100)
  totalFacilityStaffRecordsSearch?: string;

  @ApiPropertyOptional({
    description:
      'Search for checkedInUsers by first name, last name, full name, or role.',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, { toClassOnly: true })
  @IsString()
  @MaxLength(100)
  checkedInUsersSearch?: string;

  @ApiPropertyOptional({
    description:
      'Search for checkedOutUsers by first name, last name, full name, or role.',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, { toClassOnly: true })
  @IsString()
  @MaxLength(100)
  checkedOutUsersSearch?: string;
}
