import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { DiseaseCondition, PatientFinalDiagnosis } from 'src/common/enums/enums';

export class CreateOpdDiagnosisDto {
  @ApiProperty({
    enum: PatientFinalDiagnosis,
    description: 'The final diagnosis of the patient',
    example: PatientFinalDiagnosis.REQUIRES_FOLLOW_UP,
  })
  @IsEnum(PatientFinalDiagnosis)
  patientFinalDiagnosis: PatientFinalDiagnosis;

  @ApiProperty({
    enum: DiseaseCondition,
    isArray: true,
    description: 'List of disease conditions diagnosed',
    example: [DiseaseCondition.ACUTE_DIARRHEA_NON_CHOLERA],
  })
  @IsOptional()
  @IsEnum(DiseaseCondition, { each: true })
  finalDiagnosis?: DiseaseCondition[];

  @ApiProperty({
    required: false,
    description: 'Other final diagnosis if not covered in enums',
    example: 'Rare autoimmune condition',
  })
  @IsOptional()
  @IsString()
  otherFinalDiagnosis?: string;
}
