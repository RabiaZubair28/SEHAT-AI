import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsDateString, IsBoolean, ValidateNested, IsArray, ValidateIf } from 'class-validator';
import { LabTest, LabTestUrgency } from 'src/common/enums/enums';
import { LabTestItemDto } from 'src/diagnosis-prescriptions/dto/create-diagnosis.dto';

export class CreateOpdGeneralDiagnosisDto {
    @ApiPropertyOptional({
        description: 'Does the patient have lab tests?',
        type: Boolean,
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    patientHasLabtests?: boolean;

    @ApiPropertyOptional({
        description: 'Lab result value',
        type: String,
        example: 'Positive',
    })
    @IsOptional()
    @IsString()
    resultValue?: string;

    @ApiPropertyOptional({
        description: 'Date when the lab result was recorded',
        type: String,
        format: 'date',
        example: '2025-12-09',
    })
    @IsOptional()
    @IsDateString()
    resultLabDate?: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    prescribedLabTest: boolean;

    @ApiPropertyOptional({
        example: [
            { name: LabTest.CBC, urgency: LabTestUrgency.ROUTINE },
            { name: LabTest.HEPATITIS_B_HBSAG, urgency: LabTestUrgency.URGENT },
        ],
        required: false,
        type: [LabTestItemDto],
    })
    @IsOptional()
    @ValidateIf((o) => o.prescribedLabTest === true)
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LabTestItemDto)
    labTestsPrescribed?: LabTestItemDto[];
}
