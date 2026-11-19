import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  ValidateIf,
  Min,
  Max,
  IsArray,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import {
  AmnioticFluidColor,
  BloodGroup,
  HighRiskSign,
  MembraneRuptureDuration,
  PreDeliverySymptomsAssessment,
  Trimester,
} from '../../common/enums/enums';
import { Type } from 'class-transformer';
import { NotOlderThan10Months } from 'src/common/validators/not-older-than-10-months.validator';

export class CreatePreDeliveryAssessmentDto {
  @ApiProperty({ example: '2025-09-01', nullable: true })
  @IsDate()
  @Type(() => Date)
  @NotOlderThan10Months()
  @IsOptional()
  lmp?: Date;

  @ApiProperty({ example: 32.5 })
  @Min(1)
  @Max(42)
  @IsNumber()
  gestational_age: number;

  @ApiProperty({ enum: Trimester })
  @IsEnum(Trimester)
  trimester: Trimester;

  @ApiProperty({ enum: BloodGroup, nullable: true })
  @IsEnum(BloodGroup)
  @IsOptional()
  blood_group?: BloodGroup;

  @ApiProperty({
    enum: HighRiskSign,
    nullable: true,
    example: [HighRiskSign.ANAEMIA_LOW_HB, HighRiskSign.ANTEPARTUM_HAEMORRHAGE_APH],
    isArray: true
  })
  @IsEnum(HighRiskSign, { each: true })
  @IsArray()
  @IsOptional()
  high_risk_signs?: HighRiskSign[];

  @ApiPropertyOptional({
    example: 'Patient has a high-risk condition not listed above',
    description: 'Required if high_risk_signs includes OTHER',
  })
  @ValidateIf(o => o.high_risk_signs?.includes(HighRiskSign.OTHER))
  @IsNotEmpty({
    message: 'otherHighRiskSign is required when high_risk_signs includes OTHER',
  })
  @IsString()
  other_high_risk_sign?: string;

  @ApiProperty({ example: 97 })
  @IsNumber()
  @Min(95)
  @Max(108)
  temperature?: number;

  @ApiProperty({ example: 80, nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(220)
  pulse?: number;

  @ApiProperty({ example: 120, nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(300)
  systolicBP?: number;

  @ApiProperty({ example: 80, nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(220)
  diastolicBP?: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(5)
  @Max(60)
  respiratoryRate: number;

  @ApiProperty({ example: 98, nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(100)
  spo2?: number;

  @ApiProperty({ example: true, nullable: true })
  @IsBoolean()
  @IsOptional()
  fetalMovement?: boolean;

  @ApiProperty({ example: 140, nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(220)
  fetalHeartRate?: number;

  @ApiProperty({ example: 3.5, nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  cervicalDilation?: number;

  @ApiProperty({ example: true, nullable: true })
  @IsBoolean()
  @IsOptional()
  membraneRuptured?: boolean;

  @ApiProperty({ enum: MembraneRuptureDuration, nullable: true })
  @ValidateIf(o => o.membraneRuptured === true)
  @IsEnum(MembraneRuptureDuration)
  hoursSinceRupture?: MembraneRuptureDuration;

  @ApiProperty({ enum: AmnioticFluidColor, nullable: true })
  @IsEnum(AmnioticFluidColor)
  @IsOptional()
  amnioticFluidColor?: AmnioticFluidColor;

  @ApiProperty({
    enum: PreDeliverySymptomsAssessment,
    isArray: true,
    required: false,
  })
  @IsEnum(PreDeliverySymptomsAssessment, { each: true })
  @IsOptional()
  symptomsAssessment?: PreDeliverySymptomsAssessment[];
}
