import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ImmunisationDosageStatus } from 'src/common/enums/enums';

export class ImmunisationDosageDto {
  @ApiProperty({
    example: 3,
    description: 'ID of the vaccine that was administered',
  })
  @IsInt()
  vaccine_id: number;

  @ApiProperty({
    type: String,
    example: '2025-09-10',
    description: 'Date the dose was administered (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  dateAdministered: string;

  @ApiPropertyOptional({
    enum: ImmunisationDosageStatus,
    example: ImmunisationDosageStatus.ADMINISTERED,
    description:
      'Dose status for administered entries. Saved as Administered during immunisation create flows.',
  })
  @IsEnum(ImmunisationDosageStatus)
  status?: ImmunisationDosageStatus;

  @ApiPropertyOptional({
    description: 'Latitude of the vaccinator when this dose was administered.',
    example: 24.848612,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of the vaccinator when this dose was administered.',
    example: 67.046521,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
