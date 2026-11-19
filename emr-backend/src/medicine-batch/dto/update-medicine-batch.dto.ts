import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMedicineBatchDto {
  @ApiProperty({
    description: 'Batch number',
    example: 'BATCH-2024-001',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  batchNumber: string;

  @ApiProperty({
    description: 'Expiry date of the batch',
    example: '2025-12-31',
  })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({
    description: 'Purchase date of the batch',
    example: '2024-01-15',
  })
  @IsDateString()
  purchaseDate: string;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
  })
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

  @ApiProperty({
    description: 'Over the counter medicine',
    example: false,
  })
  @IsBoolean()
  otc: boolean;
}
