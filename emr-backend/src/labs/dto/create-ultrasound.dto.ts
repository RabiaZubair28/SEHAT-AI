import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  ValidateIf,
  Min,
  Max,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import {
  FetalPresentation,
  PlacentaPosition,
  PregnancyType,
  FetalAttitude,
  FetalMovement,
  UltrasoundReportings,
} from 'src/common/enums/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUltrasoundDto {
  @ApiProperty({
    example: true,
    description: 'Does patient require ultrasound?',
  })
  @IsBoolean()
  requiresUltrasound: boolean;

  @ApiProperty({
    example: true,
    description: 'Is ultrasound machine available at facility?',
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  ultrasoundMachineAvailable?: boolean;

  @ApiPropertyOptional({ example: PregnancyType.SINGLE, enum: PregnancyType })
  @IsEnum(PregnancyType)
  @ValidateIf((o) => o.ultrasoundMachineAvailable === true)
  @IsOptional()
  typeOfPregnancy?: PregnancyType;

  @ApiPropertyOptional({ example: FetalMovement.PRESENT, enum: FetalMovement })
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @IsEnum(FetalMovement)
  @IsOptional()
  fetalMovement?: FetalMovement;

  @ApiPropertyOptional({
    example: FetalPresentation.CEPHALIC,
    enum: FetalPresentation,
  })
  @IsEnum(FetalPresentation)
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @IsOptional()
  fetalPresentation?: FetalPresentation;

  @ApiPropertyOptional({ example: FetalAttitude.FLEXED, enum: FetalAttitude })
  @IsEnum(FetalAttitude)
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @IsOptional()
  attitude?: FetalAttitude;

  @ApiPropertyOptional({
    example: PlacentaPosition.ANTERIOR,
    enum: PlacentaPosition,
  })
  @IsEnum(PlacentaPosition)
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @IsOptional()
  placenta?: PlacentaPosition;

  @ApiPropertyOptional({
    example: 14,
    description: 'Amniotic fluid index (0–40)',
  })
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @Min(0)
  @Max(40)
  @IsOptional()
  @IsNumber()
  amnioticFluidIndex?: number;

  @ApiPropertyOptional({
    example: 140,
    description: 'Fetal heart rate (60–220 bpm)',
  })
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @IsOptional()
  @Min(60)
  @Max(220)
  @IsNumber()
  fetalHeartRate?: number;

  @ApiPropertyOptional({
    example: 32,
    description: 'Fundal height in cm (12–40)',
  })
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @IsOptional()
  @Min(12)
  @Max(40)
  @IsNumber()
  fundalHeight?: number;

  @ApiPropertyOptional({
    example: [UltrasoundReportings.TWINS, UltrasoundReportings.OLIGOHYDRAMNIOS],
    enum: UltrasoundReportings,
    isArray: true,
  })
  @ValidateIf(
    (o) =>
      o.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy),
  )
  @IsOptional()
  @IsArray()
  @IsEnum(UltrasoundReportings, { each: true })
  ultrasoundReporting?: UltrasoundReportings[];

  @ApiPropertyOptional({
    example: 'Unusual finding not covered in the list',
    description:
      'Required if ultrasoundMachineAvailable is true, typeOfPregnancy is SINGLE, and ultrasoundReporting includes OTHER',
  })
  @ValidateIf(
    (o) =>
      o?.ultrasoundMachineAvailable === true &&
      [
        PregnancyType.SINGLE,
        PregnancyType.TWINS,
        PregnancyType.TRIPLETS,
      ].includes(o?.typeOfPregnancy) &&
      o?.ultrasoundReporting === UltrasoundReportings.OTHERS,
  )
  @IsNotEmpty({
    message:
      'otherUltrasoundReporting is required when ultrasoundReporting includes OTHER under the ultrasound conditions',
  })
  @IsString()
  otherUltrasoundReporting?: string;

  @ApiPropertyOptional({
    example: 'No anomalies detected.',
    description: 'Observations from ultrasound',
  })
  @IsOptional()
  @IsString()
  ultrasoundObservations?: string;
}
