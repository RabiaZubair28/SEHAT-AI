import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Albumin, WarningSign } from 'src/common/enums/enums';
export class CreateAncScreeningsDto {
  @ApiProperty({ example: 14, description: 'Haemoglobin (3–200 g/dL)' })
  @IsNumber()
  @Min(3)
  @Max(20)
  haemoglobin?: number;

  @ApiProperty({
    example: 24,
    description: 'Fundal height (cm)',
    nullable: true,
  })
  @IsNumber()
  @Min(10)
  @Max(50)
  @IsOptional()
  fundal_height?: number;

  @ApiProperty({
    example: 120,
    description: 'Random Blood Sugar (40–600 mg/dL)',
  })
  @IsNumber()
  @Min(40)
  @Max(600)
  @IsOptional()
  blood_sugar_random?: number;

  @ApiProperty({
    example: Albumin.NEGATIVE,
    enum: Albumin,
    description: 'Albumin on urine dipstick',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(Albumin, { each: true })
  albumin_urine_dipstick?: Albumin;

  @ApiProperty({ example: 23, description: 'Mid-upper arm circumference (cm)' })
  @IsNumber()
  @Min(10)
  @Max(60)
  muac: number;

  @ApiProperty({
    example: [WarningSign.SEVERE_HEADACHE, WarningSign.FEVER],
    enum: WarningSign,
    isArray: true,
    description: 'Warning signs',
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(WarningSign, { each: true })
  warning_signs: WarningSign[];

  @ApiProperty({
    example: 'Patient reports an unusual symptom not listed above',
    required: false,
    description: 'Required if warning_signs includes OTHER',
  })
  @ValidateIf(o => o.warning_signs === WarningSign.OTHER)
  @IsNotEmpty({ message: 'otherWarningSign is required when warning_signs includes OTHER' })
  @IsString()
  otherWarningSign?: string;
}
