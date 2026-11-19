import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsInt,
  IsBoolean,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddMedicineBatchDto {
  @ApiProperty({
    description: 'Medicine variant ID',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  variantId: number;

  @ApiPropertyOptional({
    description: 'Facility ID (optional for admin/super admin, uses logged-in user facility for others)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  facilityId?: number;

  @ApiProperty({
    description: 'Batch number',
    example: 'BATCH-2024-001',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  batchNumber: string;

  @ApiProperty({
    description: 'Expiry date of the batch',
    example: '2025-12-31',
  })
  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({
    description: 'Purchase date of the batch',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
    default: 0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @ApiPropertyOptional({
    description: 'Limit quantity for dispensing',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  limitQuantity?: number;

  @ApiPropertyOptional({
    description: 'Over the counter medicine',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  otc?: boolean;

  @ApiProperty({
    description: 'Medicine ID',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  medicineId: number;
}
