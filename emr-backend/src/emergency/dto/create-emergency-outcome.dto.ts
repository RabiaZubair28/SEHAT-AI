import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
  IsInt,
} from 'class-validator';
import {
  PatientOutcome,
  LevelOfCare,
  EmergencyOutcomeServiceType,
} from 'src/common/enums/enums';

export class CreateEmergencyOutcomeDto {
  @ApiProperty({ enum: PatientOutcome, example: PatientOutcome.DISCHARGED })
  @IsEnum(PatientOutcome)
  outcome: PatientOutcome;

  @ApiPropertyOptional({ example: 1 })
  @ValidateIf((o) => o.outcome === PatientOutcome.REFERRED)
  @IsInt()
  @IsNotEmpty()
  district_id?: number;

  @ApiPropertyOptional({ enum: LevelOfCare, example: LevelOfCare.SECONDARY })
  @ValidateIf((o) => o.outcome === PatientOutcome.REFERRED)
  @IsEnum(LevelOfCare)
  @IsNotEmpty()
  level_of_care?: LevelOfCare;

  @ApiPropertyOptional({ example: 2 })
  @ValidateIf((o) => o.outcome === PatientOutcome.REFERRED)
  @IsInt()
  @IsNotEmpty()
  facility_id?: number;

  @ApiPropertyOptional({
    enum: EmergencyOutcomeServiceType,
    example: EmergencyOutcomeServiceType.OPD,
  })
  @ValidateIf((o) => o.outcome === PatientOutcome.REFERRED)
  @IsEnum(EmergencyOutcomeServiceType)
  @IsNotEmpty()
  type_of_service?: EmergencyOutcomeServiceType;

  @ApiPropertyOptional({ example: 'Lab tests required' })
  @ValidateIf(
    (o) =>
      o.outcome === PatientOutcome.REFERRED &&
      o.type_of_service === EmergencyOutcomeServiceType.OTHER,
  )
  @IsString()
  @IsNotEmpty()
  other_service?: string;

  @ApiPropertyOptional({ example: 'Patient needs specialist consultation' })
  @ValidateIf((o) => o.outcome === PatientOutcome.REFERRED)
  @IsString()
  @IsNotEmpty()
  reason_of_referral?: string;
}
