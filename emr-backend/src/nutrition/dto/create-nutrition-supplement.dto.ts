import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class CreateNutritionSupplementDto {
  @ApiProperty({ example: 1, description: 'Medicine Variant ID' })
  @IsInt()
  medicine_variant_id: number;

  @ApiProperty({ example: '1-0-1', description: 'Medicine dosage format: morning-afternoon-night' })
  @IsString()
  @Matches(/^\d-\d-\d$/, {
    message:
      'dosage must be in the format "0-0-0", i.e., three single digits separated by dashes',
  })
  medicineDosage: string;

  @ApiPropertyOptional({ example: 'Take after meal', description: 'Medicine instruction' })
  @IsOptional()
  @IsString()
  medicineInstruction?: string;
}

