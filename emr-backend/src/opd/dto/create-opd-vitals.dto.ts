import { ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
    IsEnum,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { BloodGroup } from 'src/common/enums/enums';
import {
  OPD_HEIGHT_MIN,
  OPD_HEIGHT_MAX,
  heightRangeMessage,
} from 'src/common/vital-validation.constants';

export class CreateOPDVitalsDto {
  @ApiProperty({ example: 70.5, description: 'Weight in kg (2-250)' })
  @IsNumber()
  @Min(2)
  @Max(250)
  weight: number;

  @ApiProperty({
    example: 65,
    description: `Height in inches (${OPD_HEIGHT_MIN}-${OPD_HEIGHT_MAX})`,
  })
  @IsNumber()
  @Min(OPD_HEIGHT_MIN, {
    message: heightRangeMessage(OPD_HEIGHT_MIN, OPD_HEIGHT_MAX),
  })
  @Max(OPD_HEIGHT_MAX, {
    message: heightRangeMessage(OPD_HEIGHT_MIN, OPD_HEIGHT_MAX),
  })
  height: number;

  @ApiProperty({ example: 25.7, description: 'Body Mass Index (BMI)' })
  @IsNumber()
  body_mass_index: number;

  @ApiProperty({ example: 1, description: 'Change in weight in kg' })
  @IsNumber()
  change_in_weight: number;

  @ApiProperty({ example: 90, minimum: 20, maximum: 200 })
  @IsNumber()
  @Min(20)
  @Max(220)
  pulse: number;

  @ApiProperty({ example: 120, description: 'Systolic blood pressure in mmHg' })
  @IsNumber()
  @Min(50)
  @Max(300)
  @IsOptional()
  systolic_bp: number;

  @ApiProperty({ example: 80, description: 'Diastolic blood pressure in mmHg' })
  @IsNumber()
  @Min(20)
  @Max(200)
  @IsOptional()
  diastolic_bp: number;

  @ApiProperty({ example: 98, description: 'Temperature in Fahrenheit' })
  @IsNumber()
  @Min(95)
  @Max(108)
  temperature: number;

  @ApiProperty({ example: 18, description: 'Respiratory rate' })
  @IsNumber()
  @Min(5)
  @Max(60)
  respiratory_rate: number;

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
