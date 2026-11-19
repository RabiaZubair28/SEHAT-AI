import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateIf,
} from 'class-validator';
import {
  PastObstetricComplication,
  FamilyPlanningMethod,
  PreviousIllness,
  AllergyType,
} from 'src/common/enums/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalSurgicalHistoryDto {
  @ApiPropertyOptional({
    example: [PreviousIllness.DIABETES, PreviousIllness.HYPERTENSION],
    enum: PreviousIllness,
    isArray: true,
  })
  @IsArray()
  @IsEnum(PreviousIllness, { each: true })
  previousIllness?: PreviousIllness[];

  @ApiPropertyOptional({
    example: [
      PastObstetricComplication.C_SECTION,
      PastObstetricComplication.ECLAMPSIA,
    ],
    enum: PastObstetricComplication,
    isArray: true,
  })
  @IsArray()
  @IsEnum(PastObstetricComplication, { each: true })
  past_obstetric_complication?: PastObstetricComplication[];

  @IsOptional()
  @ApiProperty({ example: true })
  @IsBoolean()
  previous_surgery: boolean;

  @ApiPropertyOptional({ example: 'Appendectomy in 2018' })
  @IsOptional()
  @IsString()
  previous_surgery_details?: string;

  @IsOptional()
  @ApiProperty({ example: true })
  @IsBoolean()
  known_allergies: boolean;

  @ApiPropertyOptional({
    example: [AllergyType.POLLEN, AllergyType.DUST],
    enum: AllergyType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AllergyType, { each: true })
  allergy_details?: AllergyType[];

  @IsOptional()
  @ApiProperty({ example: true })
  @IsBoolean()
  previous_medication: boolean;

  @ApiPropertyOptional({ example: 'Metformin for PCOS' })
  @IsOptional()
  @IsString()
  previous_medication_details?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  used_family_planning: boolean;

  @ApiPropertyOptional({
    example: [FamilyPlanningMethod.PILLS, FamilyPlanningMethod.IUCD],
    enum: FamilyPlanningMethod,
    isArray: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.used_family_planning === true)
  @IsArray()
  @IsEnum(FamilyPlanningMethod, { each: true })
  family_planning_methods?: FamilyPlanningMethod[];

  @ApiProperty({ default: false, example: false })
  @IsBoolean()
  prior_blood_transfusion: boolean;
}
