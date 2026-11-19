import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TypeOfDelivery,
  CSectionReason,
  MotherCondition,
  SymptomsAssessment,
  ImmediateSteps,
  Complications,
  MotherDeathCauses,
} from '../../common/enums/enums';
import { MedicinesAdministeredDto } from './medicines-administered.dto';

export class AdministeredMedicineDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  medicine_variant_id: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '01-01-03', description: 'Dosage format DD-DD-DD' })
  @IsString()
  @Matches(/^\d-\d-\d$/, {
    message:
      'dosage must be in the format "0-0-0", i.e., three single digits separated by dashes',
  })
  dosage: string;

  @ApiProperty({ example: 30, description: 'Duration of medicine' })
  @IsNumber()
  duration: number;

  @ApiProperty({ example: 'Take after meal', description: 'Medicine instruction ' })
  @IsString()
  medicineInstruction: string;
}

export class CreatePostDeliveryAssessmentDto {
  @ApiProperty({ enum: TypeOfDelivery })
  @IsEnum(TypeOfDelivery)
  typeOfDelivery?: TypeOfDelivery;

  @ApiProperty({ enum: CSectionReason, nullable: true })
  @ValidateIf(o => o.typeOfDelivery === TypeOfDelivery.C_SECTION)
  @IsOptional()
  @IsEnum(CSectionReason)
  reasonForCSection?: CSectionReason;

  @ApiPropertyOptional({
    example: 'Emergency caesarean due to rare maternal complication',
    description:
      'Required if typeOfDelivery is C_SECTION and reasonForCSection is OTHER',
  })
  @ValidateIf(
    (o) =>
      o.typeOfDelivery === TypeOfDelivery.C_SECTION &&
      o.reasonForCSection === CSectionReason.OTHER,
  )
  @IsNotEmpty({
    message:
      'otherReasonForCSection is required when reasonForCSection is OTHER',
  })
  @IsString()
  otherReasonForCSection?: string;

  @ApiProperty({ enum: MotherCondition })
  @IsEnum(MotherCondition)
  motherCondition: MotherCondition;

  @ApiProperty({ enum: SymptomsAssessment, isArray: true, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsArray()
  @IsOptional()
  @IsEnum(SymptomsAssessment, { each: true })
  symptomsAssessment?: SymptomsAssessment[];

  @ApiProperty({ enum: ImmediateSteps, isArray: true, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsArray()
  @IsOptional()
  @IsEnum(ImmediateSteps, { each: true })
  immediateSteps?: ImmediateSteps[];

  @ApiProperty({ enum: Complications, isArray: true, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsOptional()
  @IsArray()
  @IsEnum(Complications, { each: true })
  complications?: Complications[];

  @ApiProperty({ example: 'Some other complication', nullable: true })
  @ValidateIf(o => o.complications?.includes(Complications.OTHER))
  @IsOptional()
  @IsString()
  otherComplication?: string;

  @ApiProperty({ example: 97.5, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  @Min(95)
  @Max(108)
  temperature?: number;

  @ApiProperty({ example: 80, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  pulse?: number;

  @ApiProperty({ example: 120, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  systolicBP?: number;

  @ApiProperty({ example: 80, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  diastolicBP?: number;

  @ApiProperty({ example: 20, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  respiratoryRate?: number;

  @ApiProperty({ example: 45.5, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  rbs?: number;

  @ApiProperty({ example: 11.0, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  @Min(3)
  @Max(18)
  hb?: number;

  @ApiProperty({ example: 98, nullable: true })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  spo2?: number;

  @ApiProperty({
    type: [MedicinesAdministeredDto],
    nullable: true,
  })
  @ValidateIf(
    o =>
      o.motherCondition === MotherCondition.ALIVE_HEALTHY ||
      o.motherCondition === MotherCondition.ALIVE_UNHEALTHY,
  )
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => MedicinesAdministeredDto)
  medicinesAdministered?: MedicinesAdministeredDto[];

  @ApiPropertyOptional({ enum: MotherDeathCauses, isArray: true, nullable: true })
  @ValidateIf(o => o.motherCondition === MotherCondition.DEAD)
  @IsEnum(MotherDeathCauses, { each: true })
  @IsArray()
  @IsOptional()
  causeOfDeath?: MotherDeathCauses[];
}
