import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePncDto } from './create-pnc.dto';
import { UpdatePostpartumNutritionDto } from './update-postpartum-nutrition.dto';
import { UpdatePostpartumFamilyPlanningDto } from './update-postpartum-family-planing.dto';
import { UpdateBreastfeedingDto } from './update-breastfeeding.dto';
import { CreatePncScreeningsDto } from 'src/vital-assesment/dto/create-pnc-screenings.dto';
import { UpdateVitalAssesmentDto } from './update-vital-assessment.dto';

export class UpdatePncDto extends PartialType(
  OmitType(CreatePncDto, [
    'pncVitalAssessment',
    'screening',
    'nutrition',
    'familyPlanning',
    'prescriptions',
    'otherPrescriptions',
    'supplementPrescribed',
    'breastfeeding',
    'immunisation',
  ] as const),
) {
  @ApiPropertyOptional({ type: UpdateVitalAssesmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVitalAssesmentDto)
  pncVitalAssessment?: UpdateVitalAssesmentDto;

  @ApiPropertyOptional({ type: UpdatePostpartumNutritionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePostpartumNutritionDto)
  nutrition?: UpdatePostpartumNutritionDto;

  @ApiPropertyOptional({ type: UpdatePostpartumFamilyPlanningDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePostpartumFamilyPlanningDto)
  familyPlanning?: UpdatePostpartumFamilyPlanningDto;

  @ApiPropertyOptional({ type: UpdateBreastfeedingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBreastfeedingDto)
  breastfeeding?: UpdateBreastfeedingDto;

  @ApiPropertyOptional({ type: CreatePncScreeningsDto })
  @ValidateNested()
  @Type(() => CreatePncScreeningsDto)
  screening?: CreatePncScreeningsDto;
}
