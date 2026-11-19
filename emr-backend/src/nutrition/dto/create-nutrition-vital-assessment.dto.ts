import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { EdemaLevel, NutritionComplication } from 'src/common/enums/enums';
import {
  NUTRITION_HEIGHT_MIN,
  NUTRITION_HEIGHT_MAX,
  heightRangeMessage,
} from 'src/common/vital-validation.constants';

export class CreateNutritionVitalAssessmentDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  @Max(200)
  weight: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(NUTRITION_HEIGHT_MIN, { message: heightRangeMessage(NUTRITION_HEIGHT_MIN, NUTRITION_HEIGHT_MAX) })
  @Max(NUTRITION_HEIGHT_MAX, { message: heightRangeMessage(NUTRITION_HEIGHT_MIN, NUTRITION_HEIGHT_MAX) })
  height: number;

  @ApiProperty({ example: 90, minimum: 20, maximum: 200 })
  @IsNumber()
  @Min(20)
  @Max(220)
  pulse: number;

  @ApiProperty({ example: 110 })
  @IsNumber()
  @Min(50)
  @Max(300)
  @IsOptional()
  systolic_bp: number;

  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(20)
  @Max(200)
  @IsOptional()
  diastolic_bp: number;

  @ApiProperty({ example: 95 })
  @IsNumber()
  @Min(95)
  @Max(108)
  temperature: number;

  // Screening
  @ApiProperty({
    example: 12,
    required: false,
    description: 'MUAC measurement (conditionally required based on patient)',
  })
  @IsNumber()
  @IsOptional()
  muac: number;

  @ApiProperty({
    enum: EdemaLevel,
    example: EdemaLevel.NORMAL,
  })
  @IsEnum(EdemaLevel)
  edema: EdemaLevel;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_experiencing_complications: boolean;

  @ApiProperty({
    enum: NutritionComplication,
    isArray: true,
    example: [NutritionComplication.FEVER],
  })
  @IsArray()
  @IsEnum(NutritionComplication, { each: true })
  complications?: NutritionComplication[];
}
