import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumberString, IsOptional, Min } from 'class-validator';

export class PatientImmunisationFacilityInchargeDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ default: 10 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
    @IsInt()
    @Min(1)
    limit: number = 10;

    @ApiPropertyOptional({
        description: 'Facility ID',
        type: Number,
    })
    @IsOptional()
    @IsNumberString()
    facility_id?: number;

    @ApiPropertyOptional({
        description: 'UC ID',
        type: Number,
    })
    @IsOptional()
    @IsNumberString()
    uc_id?: number;

    @ApiPropertyOptional({
        description: 'When true, return only records with non-empty remarks; when false, only records with empty remarks',
        type: Boolean,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;
        if (value === true || value === 'true' || value === 1 || value === '1') return true;
        if (value === false || value === 'false' || value === 0 || value === '0') return false;
        return value;
    }, { toClassOnly: true })
    @IsBoolean()
    has_remarks?: boolean;
}
