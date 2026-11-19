import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import {
  PatientComingFrom,
  ReasonForAdmission,
} from 'src/common/enums/enums';

export class CreateNutritionServiceInfoDto {
  @ApiProperty({
    enum: PatientComingFrom,
    example: PatientComingFrom.DIRECT_FROM_COMMUNITY,
  })
  @IsNotEmpty()
  @IsEnum(PatientComingFrom)
  patient_coming_from: PatientComingFrom;

  @ApiProperty({
    enum: ReasonForAdmission,
    example: ReasonForAdmission.TRANSFER_FROM_STABILISATION_CENTRE,
  })
  @IsNotEmpty()
  @IsEnum(ReasonForAdmission)
  reason_for_admission: ReasonForAdmission;

  @ApiProperty({
    example: true,
    description: 'Whether the patient was counselled on nutrition and diet',
  })
  @IsBoolean()
  counselled_on_nutrition_and_diet: boolean;
}

