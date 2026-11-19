import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsOptional,
  IsArray,
  ArrayUnique,
  ValidateIf,
} from 'class-validator';
import { CreateEmergencyPatientDto } from './create-emergency-patient.dto';
import { CreateEmergencyVitalDto } from './create-emergency-vital.dto';
import { CreateEmergencyOutcomeDto } from './create-emergency-outcome.dto';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';

export class CreateEmergencyDto {
  @ApiProperty({ type: CreateEmergencyPatientDto })
  @ValidateNested()
  @Type(() => CreateEmergencyPatientDto)
  patient: CreateEmergencyPatientDto;

  @ApiPropertyOptional({ type: CreateEmergencyVitalDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEmergencyVitalDto)
  vitals?: CreateEmergencyVitalDto;

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
  @ValidateIf((o) => o.medicines_administered?.length > 0)
  @IsArray()
  @ArrayUnique((p) => p.medicine_variant_id, {
    message: 'Medicine prescriptions must have unique medicine variant ids',
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  medicines_administered?: CreatePrescriptionDto[];

  @ApiPropertyOptional({ type: CreateEmergencyOutcomeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEmergencyOutcomeDto)
  outcome?: CreateEmergencyOutcomeDto;
}
