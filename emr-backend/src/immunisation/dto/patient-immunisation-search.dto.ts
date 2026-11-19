import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumberString, IsOptional, Min } from 'class-validator';
import { ImmunisationDosageStatus } from 'src/common/enums/enums';

export class PatientImmunisationSearchDto {
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
    description: 'Facility ID',
    type: Number,
  })
  @IsOptional()
  @IsNumberString()
  facility_id?: number;

  @ApiPropertyOptional({
    description: 'UC ID',
    type: Number,
  })
  @IsOptional()
  @IsNumberString()
  uc_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by one or more immunisation statuses',
    enum: ImmunisationDosageStatus,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ImmunisationDosageStatus, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const items = Array.isArray(value) ? value : String(value).split(',');
    const normalized = items
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
    if (!normalized.length) return undefined;
    const allowed = Object.values(ImmunisationDosageStatus);
    return normalized.map((item) => {
      const match = allowed.find(
        (status) => status.toLowerCase() === item.toLowerCase(),
      );
      return match ?? item;
    });
  }, { toClassOnly: true })
  statuses?: ImmunisationDosageStatus[];

  @ApiPropertyOptional({
    description: 'When true, return only records with non-empty remarks; when false, only records with empty remarks',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return value;
  }, { toClassOnly: true })
  @IsBoolean()
  has_remarks?: boolean;
}
