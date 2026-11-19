import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  ValidateNested,
  IsNumber,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEmergencyDto } from './create-emergency.dto';
import { UpdateEmergencyPatientDto } from './update-emergency-patient.dto';
import { UpdateEmergencyVitalDto } from './update-emergency-vital.dto';
import { UpdateEmergencyOutcomeDto } from './update-emergency-outcome.dto';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';

export class UpdateEmergencyDto extends PartialType(
  OmitType(CreateEmergencyDto, [
    'patient',
    'vitals',
    'outcome',
    'medicines_administered',
  ] as const),
) {
  @ApiPropertyOptional({ type: UpdateEmergencyPatientDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmergencyPatientDto)
  patient?: UpdateEmergencyPatientDto;

  @ApiPropertyOptional({ type: UpdateEmergencyVitalDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmergencyVitalDto)
  vitals?: UpdateEmergencyVitalDto;

  @ApiPropertyOptional({ type: UpdateEmergencyOutcomeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmergencyOutcomeDto)
  outcome?: UpdateEmergencyOutcomeDto;

  @ApiPropertyOptional({
    example: 5,
    description: 'Doctor ID',
  })
  @IsOptional()
  @IsNumber()
  doctor_id?: number;

  @ApiPropertyOptional({
    type: [CreatePrescriptionDto],
    name: 'medicines_administered',
    example: [
      {
        medicine_variant_id: 1,
        quantity: 2,
      },
    ],
    description: 'List of medicines administered to the patient',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((p) => p.medicine_variant_id, {
    message: 'Medicine prescriptions must have unique medicine variant ids',
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  medicines_administered?: CreatePrescriptionDto[];
}
