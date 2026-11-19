import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Purpose } from '../../common/enums/enums';

export class RequestItemDto {
  @ApiProperty({
    example: 1,
    description: 'Medicine variant ID',
  })
  @IsInt()
  @IsNotEmpty()
  medicineVariantId: number;

  @ApiProperty({
    example: 10,
    minimum: 1,
    description: 'STOCK REFILL',
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantityRequested: number;

  @ApiProperty({
    enum: Purpose,
    example: Purpose.EMERGENCY_USE,
    description: 'Reason for raising the commodity request',
  })
  @IsEnum(Purpose)
  @IsNotEmpty()
  purpose: Purpose;
}

export class CreateCommodityRequestDto {
  @ApiProperty({
    type: [RequestItemDto],
    description: 'List of medicine variants with quantities',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];

  @ApiPropertyOptional({
    example: 'Overall request notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}