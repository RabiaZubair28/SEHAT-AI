import {
  IsEnum,
  IsNumber,
  ValidateIf,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  DehydrationLevel,
  FamilyPlanningMethod,
} from '../../common/enums/enums';

export class CreateAppointmentVitalsDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  appointmentId: number;

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  weight: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  height: number;

  @ApiProperty({ example: 37.2 })
  @IsNumber()
  temperature: number;

  @ApiProperty({ example: 90, minimum: 20, maximum: 200 })
  @IsNumber()
  @Min(20)
  @Max(200)
  pulse: number;

  @ApiProperty({ example: 110 })
  @IsNumber()
  systolic_bp: number;

  @ApiProperty({ example: 70 })
  @IsNumber()
  diastolic_bp: number;

  @ApiProperty({ example: 22 })
  @IsNumber()
  respiratory_rate: number;

  @ApiProperty({ example: 24.5 })
  @IsNumber()
  body_mass_index: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_anemic?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_dehydrated?: boolean;

  @ApiProperty({ example: DehydrationLevel.SEVERE, required: false })
  @ValidateIf((o) => o.is_dehydrated === true)
  @IsEnum(DehydrationLevel)
  @IsOptional()
  dehydration_level?: DehydrationLevel;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Type(() => Boolean)
  family_planning_user: boolean;

  @ApiProperty({
    example: [FamilyPlanningMethod.IMPLANT, FamilyPlanningMethod.PILLS],
    required: false,
    enum: FamilyPlanningMethod,
    isArray: true,
  })
  @ValidateIf((o) => o.family_planning_user === true)
  @IsEnum(FamilyPlanningMethod, { each: true })
  @IsOptional()
  family_planning_methods?: FamilyPlanningMethod[];

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  cough_gt_2_weeks?: boolean;

  @ApiProperty({ example: 98 })
  @IsNumber()
  @Min(0)
  @Max(100)
  spo2: number;
}
