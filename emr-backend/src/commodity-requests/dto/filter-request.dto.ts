import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { RequestStatus, RoleName } from '../../common/enums/enums';
import { Type } from 'class-transformer';

export class FilterRequestDto {
  @ApiPropertyOptional({
    enum: RequestStatus,
    description: 'Filter by request status',
  })
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @ApiPropertyOptional({
    enum: RoleName,
    description: 'Role of the initiator',
  })
  @IsEnum(RoleName)
  @IsOptional()
  initiatorRole?: RoleName;

  @ApiPropertyOptional({
    type: Number,
    description: 'Requester user ID',
    example: 5,
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  requesterId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Facility ID',
    example: 10,
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  facilityId?: number;

  @ApiPropertyOptional({
    description: 'Issued-to staff ID',
  })
  @IsString()
  @IsOptional()
  issuedToStaffId?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Medicine ID',
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  medicineId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Medicine variant ID',
  })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  medicineVariantId?: number;

  @ApiPropertyOptional({
    description: 'Only contraceptives',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  contraceptiveOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Only non-contraceptive medicines',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  medicineOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Medicine category',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO format) e.g: 2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO format) e.g: 2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Search by medicine or generic name e.g: Amexicilin',
  })
  @IsString()
  @IsOptional()
  search?: string;
}