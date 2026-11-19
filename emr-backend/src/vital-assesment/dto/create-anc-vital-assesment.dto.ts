import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { BloodGroup } from 'src/common/enums/enums';
import {
  ANC_HEIGHT_MIN,
  ANC_HEIGHT_MAX,
  heightRangeMessage,
} from 'src/common/vital-validation.constants';

export class CreateAncVitalDto {
  @ApiProperty({ example: 70.5, description: 'Weight in kg (25-200)' })
  @IsNumber()
  @Min(25)
  @Max(200)
  weight: number;

  @ApiProperty({ example: 65, description: `Height in inches (${ANC_HEIGHT_MIN}-${ANC_HEIGHT_MAX})` })
  @IsNumber()
  @Min(ANC_HEIGHT_MIN, { message: heightRangeMessage(ANC_HEIGHT_MIN, ANC_HEIGHT_MAX) })
  @Max(ANC_HEIGHT_MAX, { message: heightRangeMessage(ANC_HEIGHT_MIN, ANC_HEIGHT_MAX) })
  height: number;

  @ApiProperty({ example: 98, description: 'Temperature in Fahrenheit' })
  @IsNumber()
  @Min(95)
  @Max(108)
  temperature: number;

  @ApiProperty({ example: 90, minimum: 20, maximum: 200 })
  @IsNumber()
  @Min(20)
  @Max(220)
  pulse: number;

  @ApiProperty({ example: 25.7, description: 'Body Mass Index (BMI)' })
  @IsNumber()
  body_mass_index: number;

  @ApiProperty({ example: 1, description: 'Change in weight in kg' })
  @IsNumber()
  change_in_weight: number;

  @ApiProperty({ example: 120, description: 'Systolic blood pressure in mmHg' })
  @IsNumber()
  @Min(50)
  @Max(300)
  systolic_bp: number;

  @ApiProperty({ example: 80, description: 'Diastolic blood pressure in mmHg' })
  @IsNumber()
  @Min(20)
  @Max(200)
  diastolic_bp: number;

  @ApiProperty({ example: 18, description: 'Respiratory rate' })
  @IsNumber()
  @Min(5)
  @Max(60)
  respiratory_rate: number;

  @ApiProperty({ example: 98, description: 'SpO₂ percentage (0–100)' })
  @IsNumber()
  @Min(50)
  @Max(100)
  spo2?: number;

  @ApiProperty({
    example: BloodGroup.O_POS,
    enum: BloodGroup,
    description: 'Blood group',
    required: false,
  })
  @IsEnum(BloodGroup)
  @IsOptional()
  blood_group: BloodGroup;
}
