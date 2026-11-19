import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  Sex,
  ChildCondition,
  NewbornSymptomsAssessment,
  BabyDeathCauses,
} from '../../common/enums/enums';
import { Type } from 'class-transformer';
import { MedicinesAdministeredDto } from './medicines-administered.dto';
import { CreateImmunisationWithCardDto } from 'src/immunisation/dto/create-immunisation-with-card.dto';

export class CreateNewbornAssessmentDto {
  @ApiPropertyOptional({ enum: Sex })
  @IsEnum(Sex)
  @IsOptional()
  sex?: Sex;

  @ApiProperty({ enum: ChildCondition })
  @IsEnum(ChildCondition)
  condition: ChildCondition;

  @ApiPropertyOptional({ example: 3.2 })
  @ValidateIf(o =>
    o.condition === ChildCondition.ALIVE_HEALTHY ||
    o.condition === ChildCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 96.8 })
  @ValidateIf(o =>
    o.condition === ChildCondition.ALIVE_HEALTHY ||
    o.condition === ChildCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @Min(95)
  @Max(108)
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 12.5 })
  @ValidateIf(o =>
    o.condition === ChildCondition.ALIVE_HEALTHY ||
    o.condition === ChildCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @Min(7)
  @Max(14)
  @IsOptional()
  muac?: number;

  @ApiPropertyOptional({ example: 34.2 })
  @ValidateIf(o =>
    o.condition === ChildCondition.ALIVE_HEALTHY ||
    o.condition === ChildCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @Min(30)
  @Max(45)
  @IsOptional()
  headCircumference?: number;

  @ApiPropertyOptional({ example: 8 })
  @ValidateIf(o =>
    o.condition === ChildCondition.ALIVE_HEALTHY ||
    o.condition === ChildCondition.ALIVE_UNHEALTHY,
  )
  @IsInt()
  @IsOptional()
  apgarScore?: number;

  @ApiPropertyOptional({ enum: NewbornSymptomsAssessment, isArray: true })
  @ValidateIf(o =>
    o.condition === ChildCondition.ALIVE_HEALTHY ||
    o.condition === ChildCondition.ALIVE_UNHEALTHY,
  )
  @IsArray()
  @IsEnum(NewbornSymptomsAssessment, { each: true })
  @IsOptional()
  symptomsAssessment?: NewbornSymptomsAssessment[];

  @ApiPropertyOptional()
  @ValidateIf(o =>
    o.symptomsAssessment?.includes(NewbornSymptomsAssessment.OTHER),
  )
  @IsString()
  @IsOptional()
  otherSymptom?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  kmcAdministered?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  breastfeedingInitiated?: boolean;

  @ApiPropertyOptional({ type: CreateImmunisationWithCardDto })
  @IsOptional()
  @ValidateNested()
  @ValidateIf(
    o =>
      o.condition === ChildCondition.ALIVE_HEALTHY ||
      o.condition === ChildCondition.ALIVE_UNHEALTHY,
  )
  @Type(() => CreateImmunisationWithCardDto)
  vaccinesAdministered?: CreateImmunisationWithCardDto;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  medicineProvided?: boolean;

  @ApiPropertyOptional({
    type: [MedicinesAdministeredDto],
  })
  @ValidateIf(o =>
    o.medicineProvided === true,
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicinesAdministeredDto)
  @IsOptional()
  medicinesAdministered?: MedicinesAdministeredDto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  congenitalAnomaly?: boolean;

  @ApiPropertyOptional({ enum: BabyDeathCauses, isArray: true })
  @ValidateIf(o => o.condition === ChildCondition.DEAD_AFTER_DELIVERY)
  @IsEnum(BabyDeathCauses, { each: true })
  @IsArray()
  @IsOptional()
  causeOfDeath?: BabyDeathCauses[];
}
