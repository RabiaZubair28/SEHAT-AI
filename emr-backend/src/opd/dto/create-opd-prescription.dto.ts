import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested, ValidateIf, ArrayUnique, IsBoolean } from 'class-validator';
import { AdministeredMedicineDto } from 'src/delivery/dto/post-delivery.dto';
import { CreateDiagnosisDto } from 'src/diagnosis-prescriptions/dto/create-diagnosis.dto';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';

export class CreateOpdPrescriptionDto {
    @ApiProperty({ example: true, required: true })
    @IsBoolean()
    patientHasLabtests: boolean;

    @ApiProperty({ example: "sample_test", required: true })
    @IsString()
    resultValue: string;

    @ApiProperty({ example: '2025-01-01', required: false })
    @IsOptional()
    @IsDateString()
    resultLabDate?: string;
}
