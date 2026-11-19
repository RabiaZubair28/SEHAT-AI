import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
  ValidateIf,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateNutritionServiceInfoDto } from './create-nutrition-service-info.dto';
import { CreateNutritionVitalAssessmentDto } from './create-nutrition-vital-assessment.dto';
import { CreateNutritionSupplementDto } from './create-nutrition-supplement.dto';
import { CreateOtherPrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-other-prescription.dto';
import { OtherPrescriptionCategory } from 'src/common/enums/enums';

export class CreateNutritionDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  appointment_id: number;

  @ApiProperty({ type: CreateNutritionServiceInfoDto })
  @ValidateNested()
  @Type(() => CreateNutritionServiceInfoDto)
  serviceInfo: CreateNutritionServiceInfoDto;

  @ApiProperty({ type: CreateNutritionVitalAssessmentDto })
  @ValidateNested()
  @Type(() => CreateNutritionVitalAssessmentDto)
  vitalAssessment: CreateNutritionVitalAssessmentDto;

  @ApiProperty({ example: false })
  @IsBoolean()
  prescribing_supplements: boolean;

  @ApiPropertyOptional({
    type: [CreateNutritionSupplementDto],
    example: [
      {
        medicine_variant_id: 1,
        medicineDosage: '1-0-1',
        medicineInstruction: 'Take after meals',
      },
    ],
  })
  @IsOptional()
  @ValidateIf((o) => o.prescribing_supplements === true)
  @ArrayUnique((p) => p.medicine_variant_id, { message: 'Prescriptions must have unique medicine variant ids' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNutritionSupplementDto)
  prescriptions?: CreateNutritionSupplementDto[];

  @ValidateNested({ each: true })
  @ValidateIf((o) => o.medicines_prescribed === true || o.supplements_prescribed === true)
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
}

