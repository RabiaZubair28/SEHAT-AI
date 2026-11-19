import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DispenseItemDto } from './dispenser-item.dto';
import { OtcDto } from './otc.dto';

export class CreateDispenserDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  patient_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  appointment_id: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsInt()
  @IsOptional()
  service_id: number;

  @ApiProperty({ example: '2024-05-01' })
  @IsDateString()
  visitDate: Date;

  @ApiPropertyOptional({
    example: 'Patient counselled on dosage and side effects.',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({
    type: [DispenseItemDto],
    example: [{ prescription_id: 1 }, { prescription_id: 2 }],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  otcMedRequired: boolean;

  @ApiPropertyOptional({
    type: [OtcDto],
    example: [
      { medicine_variant_id: 1, quantity: 5 },
      { medicine_variant_id: 2, quantity: 10 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateIf((otc) => otc.otcMedRequired === true)
  @ArrayUnique((otc) => otc.medicine_variant_id, {
    message: 'OTC must have unique medicine variant ids',
  })
  @ValidateNested({ each: true })
  @Type(() => OtcDto)
  @IsOptional()
  @IsArray()
  otc_items?: OtcDto[];
}
