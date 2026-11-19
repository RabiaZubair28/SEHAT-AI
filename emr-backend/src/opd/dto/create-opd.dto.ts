import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsInt, IsNotEmpty, IsOptional, ArrayUnique } from 'class-validator';
import { CreateOpdDiagnosisDto } from './create-opd-diagnosis.dto';
import { CreateOPDMedicalHistory } from './create-opd-medical-history.dto';
import { CreateOPDVitalsDto } from './create-opd-vitals.dto';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';
import { CreateOpdGeneralDiagnosisDto } from './create-opd-general-diagnosis.dto';
import { CreateOtherPrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-other-prescription.dto';
import { OtherPrescriptionCategory } from 'src/common/enums/enums';

export class CreateOpdDto {
    @ApiProperty({
        description: 'ID of the associated visit',
        example: 1
    })
    @IsInt()
    @IsNotEmpty()
    appointment_id: number;

    @ApiProperty({ type: CreateOPDMedicalHistory })
    @ValidateNested()
    @Type(() => CreateOPDMedicalHistory)
    medicalHistory: CreateOPDMedicalHistory;

    @ValidateNested({ each: true })
    @ArrayUnique((p) => p.medicine_variant_id, { message: 'Prescriptions must have unique medicine variant ids' })
    @ApiPropertyOptional({
        type: [CreatePrescriptionDto],
        example: [
            {
                medicine_variant_id: 1,
                medicineDosage: '1-0-1',
                quantity: 10,
                medicineDuration: 5,
                medicineInstruction: 'Take after meal',
            },
            {
                medicine_variant_id: 2,
                medicineDosage: '1-0-1',
                quantity: 10,
                medicineDuration: 5,
                medicineInstruction: 'Take after meal',
            },
        ],
    })
    @IsOptional()
    @Type(() => CreatePrescriptionDto)
    prescriptions?: CreatePrescriptionDto[];

    @ValidateNested({ each: true })
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

    @ApiProperty({ type: CreateOPDVitalsDto })
    @ValidateNested()
    @Type(() => CreateOPDVitalsDto)
    vitals: CreateOPDVitalsDto;

    @ApiProperty({ type: CreateOpdDiagnosisDto })
    @ValidateNested()
    @Type(() => CreateOpdDiagnosisDto)
    diagnosis: CreateOpdDiagnosisDto;

    @ApiProperty({ type: CreateOpdGeneralDiagnosisDto })
    @ValidateNested()
    @Type(() => CreateOpdGeneralDiagnosisDto)
    generalDiagnosis: CreateOpdGeneralDiagnosisDto;
}
