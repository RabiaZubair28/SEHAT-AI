import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ContraceptiveMethod,
  DehydrationLevel,
  ImmunisationDosageStatus,
} from '../../common/enums/enums';
import { CreateImmunisationDto } from 'src/immunisation/dto/create-immunisation.dto';
import {
  VITALS_HEIGHT_MIN,
  VITALS_HEIGHT_MAX,
  heightRangeMessage,
} from 'src/common/vital-validation.constants';

export class CreateVitalAssesmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  appointmentId: number;

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  @Min(0)
  @Max(250)
  weight: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(VITALS_HEIGHT_MIN, { message: heightRangeMessage(VITALS_HEIGHT_MIN, VITALS_HEIGHT_MAX) })
  @Max(VITALS_HEIGHT_MAX, { message: heightRangeMessage(VITALS_HEIGHT_MIN, VITALS_HEIGHT_MAX) })
  height: number;

  @ApiProperty({ example: 24.5 })
  @IsNumber()
  body_mass_index: number;

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

  @ApiProperty({ example: 97 })
  @IsNumber()
  @Min(95)
  @Max(108)
  temperature: number;

  @ApiProperty({ example: 22 })
  @IsNumber()
  @Min(5)
  @Max(60)
  respiratory_rate: number;

  // General Screening
  @ApiProperty({ example: 98 })
  @IsNumber()
  @Min(50)
  @Max(100)
  @IsOptional()
  spo2: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_anemic?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_dehydrated?: boolean;

  @ApiProperty({ example: DehydrationLevel.SEVERE, required: false })
  @ValidateIf((o) => o.is_dehydrated === true)
  @IsEnum(DehydrationLevel)
  @IsOptional()
  dehydration_level?: DehydrationLevel;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  cough_gt_2_weeks?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  family_planning_user: boolean;

  @ApiProperty({
    example: [ContraceptiveMethod.COC, ContraceptiveMethod.COPPER_T],
    required: false,
    enum: ContraceptiveMethod,
    isArray: true,
  })
  @ValidateIf((o) => o.family_planning_user === true)
  @IsEnum(ContraceptiveMethod, { each: true })
  @IsOptional()
  family_planning_methods?: ContraceptiveMethod[];

  @ValidateNested({ each: true })
  @ApiPropertyOptional({
    type: CreateImmunisationDto,
    example: {
      doses: [
        {
          vaccine_id: 6,
          dateAdministered: '2025-12-23',
          status: ImmunisationDosageStatus.ADMINISTERED,
        },
        {
          vaccine_id: 7,
          dateAdministered: '2025-12-24',
          status: ImmunisationDosageStatus.ADMINISTERED,
        },
      ]
    }
  })
  @IsOptional()
  @Type(() => CreateImmunisationDto)
  immunisation?: CreateImmunisationDto;
}
