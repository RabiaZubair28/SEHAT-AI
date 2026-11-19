import { ArrayUnique, IsBoolean, IsInt, IsOptional, IsString, Length, ValidateIf, ValidateNested } from 'class-validator';
import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ImmunisationCardDto } from './immunisation-card.dto';
import { ImmunisationDosageDto } from './immunisation-dosage.dto';
import { ImmunisationDosageStatus } from 'src/common/enums/enums';
import { CreatePatientDto } from 'src/patients/dto/create-patient.dto';

export class CreateImmunisationWithCardDto {
    @ApiHideProperty()
    @IsOptional()
    @ValidateIf((dto) => !dto.appointmentId)
    @IsInt()
    patientId: number;

    @ApiPropertyOptional({ example: 1, description: 'Appointment ID' })
    @IsOptional()
    @IsInt()
    appointmentId: number;

    @ApiHideProperty()
    @ApiPropertyOptional({ example: 12, description: 'Newborn ID' })
    @IsOptional()
    @IsInt()
    newBornId?: number;

    @ApiHideProperty()
    @IsInt()
    @IsOptional()
    service_id: number;

    @ApiPropertyOptional({ type: ImmunisationCardDto })
    @ValidateNested()
    @IsOptional()
    @Type(() => ImmunisationCardDto)
    immunisationCard?: ImmunisationCardDto;

    @ApiPropertyOptional({
        type: [ImmunisationDosageDto],
        example: [
            {
                vaccine_id: 6,
                dateAdministered: '2025-12-23',
                status: ImmunisationDosageStatus.ADMINISTERED,
                latitude: 24.848612,
                longitude: 67.046521,
            },
            {
                vaccine_id: 7,
                dateAdministered: '2025-12-24',
                status: ImmunisationDosageStatus.ADMINISTERED,
                latitude: 24.848612,
                longitude: 67.046521,
            },
        ],
    })
    @ValidateNested({ each: true })
    @IsOptional()
    @ArrayUnique((immune) => immune.vaccine_id, { message: 'Do not replicate vaccines' })
    @Type(() => ImmunisationDosageDto)
    doses: ImmunisationDosageDto[];

    @ApiPropertyOptional({
        type: CreatePatientDto,
        description: 'Mobile immunisation only. Used when patientId is not available.',
    })
    @ValidateNested()
    @IsOptional()
    @ValidateIf((dto) => !dto.appointmentId && !dto.patientId)
    @Type(() => CreatePatientDto)
    patient?: CreatePatientDto;

    @ApiPropertyOptional({
        example: 'mobile-generated-unique-hash',
        description: 'Mobile immunisation only. Used to deduplicate patient creation when patientId is not available.',
    })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    patientMobileHash?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Flag set by the mobile app. When true, newly administered doses must include latitude and longitude.',
    })
    @IsOptional()
    @IsBoolean()
    isMobile?: boolean;
}
