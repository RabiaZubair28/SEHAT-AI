import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PncWarningSign } from 'src/common/enums/enums';

export class CreatePncScreeningsDto {
  @ApiProperty({ example: 12, description: 'Haemoglobin (g/dL) (3-18)' })
  @IsNumber()
  @Min(3)
  @Max(18)
  haemoglobin?: number;

  @ApiProperty({
    example: 120,
    description: 'Random blood sugar (mg/dL) (50-400)',
  })
  @IsNumber()
  @Min(50)
  @Max(400)
  blood_sugar_random?: number;

  @ApiProperty({
    example: 24,
    description: 'Mid-upper arm circumference in cm (10-50)',
  })
  @IsNumber()
  muac?: number;

  @ApiProperty({
    example: [PncWarningSign.FEVER, PncWarningSign.FOUL_SMELLING_VAGINAL_DISCHARGE],
    enum: PncWarningSign,
    isArray: true,
    description: 'Warning signs',
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(PncWarningSign, { each: true })
  warning_signs?: PncWarningSign[];

  @ApiPropertyOptional({
    example: 'Patient reports an unusual postnatal symptom not listed above',
    description: 'Required if warning_signs includes OTHER',
  })
  @ValidateIf(o => o.warning_signs === PncWarningSign.OTHER)
  @IsNotEmpty({
    message: 'otherPncWarningSign is required when warning_signs includes OTHER',
  })
  @IsString()
  otherWarningSign?: string;
}
