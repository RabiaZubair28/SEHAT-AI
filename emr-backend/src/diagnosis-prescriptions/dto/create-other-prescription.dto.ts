import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OtherPrescriptionCategory } from 'src/common/enums/enums';

export class CreateOtherPrescriptionDto {
    @ApiProperty({ example: 'Paracetamol' })
    @IsString()
    name: string;

    @ApiProperty({ example: '1-0-1' })
    @IsString()
    @IsOptional()
    @Matches(/^\d-\d-\d$/, {
        message:
            'dosage must be in the format "0-0-0", i.e., three single digits separated by dashes',
    })
    medicineDosage: string;

    @ApiPropertyOptional({ example: 5 })
    @IsOptional()
    @Min(1)
    @Max(14)
    @IsInt()
    medicineDuration?: number;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    quantity?: number;

    @ApiPropertyOptional({
        example: OtherPrescriptionCategory.MEDICINE,
        enum: OtherPrescriptionCategory,
    })
    @IsEnum(OtherPrescriptionCategory)
    @IsOptional()
    category?: OtherPrescriptionCategory;

    @ApiPropertyOptional({ example: 'Take after meal' })
    @IsOptional()
    @IsString()
    medicineInstruction?: string;
}
