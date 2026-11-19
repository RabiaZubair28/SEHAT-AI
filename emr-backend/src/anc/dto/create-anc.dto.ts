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
import { CreateMedicalSurgicalHistoryDto } from './create-medical-surgical-history.dto';
import { CreatePregnancyInfoDto } from './create-pregnancy-into.dto';
import { CreateDiagnosisDto } from 'src/diagnosis-prescriptions/dto/create-diagnosis.dto';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';
import { CreateUltrasoundDto } from 'src/labs/dto/create-ultrasound.dto';
import { CreateCtgDto } from 'src/labs/dto/create-ctg.dto';
import { CreateImmunisationDto } from 'src/immunisation/dto/create-immunisation.dto';
import { CreateAncVitalDto } from 'src/vital-assesment/dto/create-anc-vital-assesment.dto';
import { CreateAncScreeningsDto } from 'src/vital-assesment/dto/create-anc-screenings.dto';
import { CreateOtherPrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-other-prescription.dto';
import { OtherPrescriptionCategory } from 'src/common/enums/enums';

export class CreateAncDto {
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

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreateDiagnosisDto })
  @IsOptional()
  @Type(() => CreateDiagnosisDto)
  diagnosis?: CreateDiagnosisDto;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  medicines_prescribed: boolean;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  supplements_prescribed: boolean;

  @ValidateNested({ each: true })
  @ValidateIf((o) => o.medicines_prescribed === true || o.supplements_prescribed === true)
  @ArrayUnique((p) => p.medicine_variant_id, { message: 'Prescriptions must have unique medicine variant ids' })
  @ApiPropertyOptional({
    type: [CreatePrescriptionDto],
    example: [
      {
        medicine_variant_id: 1,
        medicineDosage: '1-0-1',
        medicineDuration: 5,
        medicineInstruction: 'Take after meal',
      },
      {
        medicine_variant_id: 2,
        medicineDosage: '1-0-1',
        medicineDuration: 5,
        medicineInstruction: 'Take after meal',
      },
    ],
  })
  @IsOptional()
  @Type(() => CreatePrescriptionDto)
  prescriptions?: CreatePrescriptionDto[];

  @ValidateNested({ each: true })
  @ValidateIf((o) => o.medicines_prescribed === true || o.supplements_prescribed === true)
  @ArrayUnique((p) => p.name, { message: 'Other prescriptions must have unique names' })
  @ApiPropertyOptional({
    type: [CreateOtherPrescriptionDto],
    example: [
      {
        name: 'Paracetamol',
        medicineDosage: '1-0-1',
        medicineDuration: 5,
        medicineInstruction: 'Take after meal',
        category: OtherPrescriptionCategory.MEDICINE,
      },
      {
        name: 'Ibuprofen',
        medicineDosage: '1-0-1',
        medicineDuration: 5,
        medicineInstruction: 'Take after meal',
        category: OtherPrescriptionCategory.MEDICINE,
      },
    ],
  })
  @IsOptional()
  @Type(() => CreateOtherPrescriptionDto)
  otherPrescriptions?: CreateOtherPrescriptionDto[];

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreatePregnancyInfoDto })
  @IsOptional()
  @Type(() => CreatePregnancyInfoDto)
  pregnancyInfo?: CreatePregnancyInfoDto;

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreateMedicalSurgicalHistoryDto })
  @IsOptional()
  @Type(() => CreateMedicalSurgicalHistoryDto)
  medicalSurgicalHistory?: CreateMedicalSurgicalHistoryDto;

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreateUltrasoundDto })
  @IsOptional()
  @Type(() => CreateUltrasoundDto)
  ultrasound?: CreateUltrasoundDto;

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreateCtgDto })
  @IsOptional()
  @Type(() => CreateCtgDto)
  ctg?: CreateCtgDto;

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreateImmunisationDto })
  @IsOptional()
  @Type(() => CreateImmunisationDto)
  immunisation?: CreateImmunisationDto;

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreateAncVitalDto })
  @Type(() => CreateAncVitalDto)
  ancVitalAssessment: CreateAncVitalDto;

  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: CreateAncScreeningsDto })
  @Type(() => CreateAncScreeningsDto)
  screening?: CreateAncScreeningsDto;
}
