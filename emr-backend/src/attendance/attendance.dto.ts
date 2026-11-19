import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Latitude captured at check-in. Required for vaccinator users.',
    example: 24.848612,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude captured at check-in. Required for vaccinator users.',
    example: 67.046521,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Flag to mobile',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isMobile?: boolean;

  @ApiPropertyOptional({
    description: 'Offline check-in timestamp. When provided, it overrides server time.',
    example: '2024-01-01T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;
}

export class CheckOutAttendanceDto {
  @ApiPropertyOptional({
    description: 'Flag to mobile. When true, active queue validation is skipped.',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isMobile?: boolean;

  @ApiPropertyOptional({
    description: 'Offline check-out timestamp. When provided, it overrides server time.',
    example: '2024-01-01T17:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;
}

export class GetAttendanceFilterDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by user name (only for admin, super admin, and facility incharge)',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user email (only for admin, super admin, and facility incharge)',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by facility ID (only for admin and super admin)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  facilityId?: number;
}
