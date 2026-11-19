import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequestStatus } from 'src/common/enums/enums';

export class UpdateRequestItemDto {
  @ApiProperty({
    example: 1,
    description: 'Request item ID',
  })
  @IsInt()
  @IsNotEmpty()
  itemId: number;

  @ApiProperty({
    enum: RequestStatus,
    example: RequestStatus.APPROVED,
  })
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;

  @ApiPropertyOptional({
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantityDispensed?: number;

  @ApiPropertyOptional({
    example: 'Partial stock',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCommodityRequestStatusDto {
  @ApiProperty({
    enum: RequestStatus,
    example: RequestStatus.APPROVED,
    description: 'Overall request status',
  })
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;

  @ApiProperty({
    type: [UpdateRequestItemDto],
    description: 'Item updates',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRequestItemDto)
  items: UpdateRequestItemDto[];

  @ApiPropertyOptional({
    example: 'Insufficient stock available',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: 'Processed notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}