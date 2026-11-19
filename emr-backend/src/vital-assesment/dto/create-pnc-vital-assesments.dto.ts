import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { BloodGroup } from 'src/common/enums/enums';
import {
  PNC_HEIGHT_MIN,
  PNC_HEIGHT_MAX,
  heightRangeMessage,
} from 'src/common/vital-validation.constants';

export class PncVitalsDto {
  @ApiProperty({ example: 70, description: 'Weight in kg (25-200)' })
  @IsNumber()
  @Min(25)
  @Max(200)
  weight: number;

  @ApiProperty({ example: 65, description: `Height in inches (${PNC_HEIGHT_MIN}-${PNC_HEIGHT_MAX})` })
  @IsNumber()
  @Min(PNC_HEIGHT_MIN, { message: heightRangeMessage(PNC_HEIGHT_MIN, PNC_HEIGHT_MAX) })
  @Max(PNC_HEIGHT_MAX, { message: heightRangeMessage(PNC_HEIGHT_MIN, PNC_HEIGHT_MAX) })
  height: number;

  @ApiProperty({
    example: 120,
    description: 'Systolic blood pressure in mmHg (50-300)',
  })
  @IsNumber()
  @Min(50)
  @Max(300)
  systolic_bp: number;

  @ApiProperty({
    example: 80,
    description: 'Diastolic blood pressure in mmHg (20-200)',
  })
  @IsNumber()
  @Min(20)
  @Max(200)
  diastolic_bp: number;

  @ApiProperty({
    example: 98,
    description: 'Temperature in Fahrenheit (95-108)',
  })
  @IsNumber()
  @Min(95)
  @Max(108)
  temperature: number;

  @ApiProperty({ example: 75, description: 'Pulse rate (20-200)' })
  @IsNumber()
  @Min(20)
  @Max(200)
  pulse: number;

  @ApiProperty({
    example: 98,
    description: 'Oxygen saturation percentage (0-100)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  spo2: number;

  @ApiProperty({
    example: BloodGroup.O_POS,
    enum: BloodGroup,
    description: 'Blood group',
    required: false,
  })
  @IsOptional()
  @IsEnum(BloodGroup)
  blood_group: BloodGroup;
}
