import {
  ArrayUnique,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePncScreeningsDto } from 'src/vital-assesment/dto/create-pnc-screenings.dto';
import { PncVitalsDto } from 'src/vital-assesment/dto/create-pnc-vital-assesments.dto';
import { CreatePostpartumNutritionDto } from './create-postpartum-nutrition.dto';
import { CreatePostpartumFamilyPlanningDto } from './create-postpartum-family-planing.dto';
import { CreateBreastfeedingDto } from './create-breastfeeding.dto';
import { CreateImmunisationDto } from 'src/immunisation/dto/create-immunisation.dto';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';
import { CreateOtherPrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-other-prescription.dto';
import { OtherPrescriptionCategory } from 'src/common/enums/enums';

export class CreatePncDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  patient_id: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  appointment_id: number;

  @ApiProperty({ example: '2025-07-08' })
  @IsDateString()
  visitDate: Date;

  @ApiPropertyOptional({ type: PncVitalsDto })
  @ValidateNested()
  @Type(() => PncVitalsDto)
  pncVitalAssessment: PncVitalsDto;

  @ApiPropertyOptional({ type: CreatePncScreeningsDto })
  @ValidateNested()
  @Type(() => CreatePncScreeningsDto)
  screening?: CreatePncScreeningsDto;

  @ApiPropertyOptional({ type: CreatePostpartumNutritionDto })
  @ValidateNested()
  @Type(() => CreatePostpartumNutritionDto)
  nutrition?: CreatePostpartumNutritionDto;

  @ApiPropertyOptional({ type: CreateImmunisationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateImmunisationDto)
  immunisation?: CreateImmunisationDto;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  supplementPrescribed: boolean;

  @ApiPropertyOptional({
    type: [CreatePrescriptionDto],
    example: [
      {
        medicine_variant_id: 1,
        medicineDosage: '1-0-1',
        medicineInstruction: 'Take for a month',
      },
      {
        medicine_variant_id: 2,
        medicineDosage: '1-0-1',
        medicineInstruction: 'Take for a month',
      },
    ],
  })
  @IsOptional()
  @ValidateIf((o) => o.supplementPrescribed === true)
  @ArrayUnique((p) => p.medicine_variant_id, { message: 'Prescriptions must have unique medicine variant ids' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  prescriptions?: CreatePrescriptionDto[];

  @ValidateNested({ each: true })
  @ValidateIf((o) => o.supplementPrescribed === true)
  @ArrayUnique((p) => p.name, { message: 'Other prescriptions must have unique names' })
  @ApiPropertyOptional({
    type: [CreateOtherPrescriptionDto],
    example: [
      {
        name: 'Paracetamol',
        medicineDosage: '1-0-1',
        medicineInstruction: 'Take after meal',
        category: OtherPrescriptionCategory.MEDICINE,
      },
      {
        name: 'Ibuprofen',
        medicineDosage: '1-0-1',
        medicineInstruction: 'Take after meal',
        category: OtherPrescriptionCategory.MEDICINE,
      },
    ],
  })
  @IsOptional()
  @Type(() => CreateOtherPrescriptionDto)
  otherPrescriptions?: CreateOtherPrescriptionDto[];

  @ApiPropertyOptional({ type: CreatePostpartumFamilyPlanningDto })
  @ValidateNested()
  @Type(() => CreatePostpartumFamilyPlanningDto)
  familyPlanning?: CreatePostpartumFamilyPlanningDto;

  @ApiPropertyOptional({ type: CreateBreastfeedingDto })
  @ValidateNested()
  @Type(() => CreateBreastfeedingDto)
  breastfeeding?: CreateBreastfeedingDto;
}
