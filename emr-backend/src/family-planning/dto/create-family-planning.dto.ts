import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  ClientCategory,
  ClientType,
  FpCommodities,
  DurationType,
  ServiceCategory,
  InsertionPeriod,
  RemovalReason,
} from 'src/common/enums/enums';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';
import { Type } from 'class-transformer';

export class CreateFamilyPlanningDto {
  @ApiProperty({
    description: 'ID of the associated visit',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  appointment_id: number;

  @ApiProperty({
    description: 'Type of client',
    enum: ClientType,
    example: ClientType.WALK_IN,
  })
  @IsEnum(ClientType)
  client_type: ClientType;

  @ApiProperty({
    description: 'Years of marriage of the client',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  years_of_marriage: number;

  @ApiProperty({
    description: 'Duration type since last period',
    enum: DurationType,
    example: DurationType.MORE_THAN_6_MONTHS_TO_1_YEAR,
  })
  @IsEnum(DurationType)
  total_pregnancy_since_last_period: DurationType;

  @ApiProperty({
    description: 'Is this user a new FP user',
    example: true,
  })
  @IsBoolean()
  new_user: boolean;

  @ApiProperty({
    description: 'Whether a previous method was in use',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  previous_method_in_use: boolean;

  @ApiPropertyOptional({
    description: 'Previous family planning methods used',
    example: [FpCommodities.CONDOMS, FpCommodities.DIAPHRAGM]
  })
  @IsArray()
  @IsEnum(FpCommodities, { each: true })
  @IsOptional()
  @ValidateIf((o) => o.previous_method_in_use === true)
  previous_fp_methods_used?: FpCommodities[];

  @ApiProperty({
    description: 'Service category of FP',
    enum: ServiceCategory,
    example: ServiceCategory.LARC_REMOVAL,
  })
  @IsEnum(ServiceCategory)
  service_category: ServiceCategory;

  @ApiProperty({
    description: 'Client category type',
    enum: ClientCategory,
    required: false,
    example: ClientCategory.FAMILY_PLANNING_METHOD,
  })
  @IsOptional()
  @ValidateIf(
    (o) => o.service_category === ServiceCategory.FAMILY_PLANNING_SERVICES,
  )
  @IsEnum(ClientCategory)
  client_category?: ClientCategory;

  @ApiPropertyOptional({
    type: [CreatePrescriptionDto],
    example: [
      {
        medicine_variant_id: 42,
        quantity: 2,
      },
      {
        medicine_variant_id: 43,
        quantity: 2,
      },
    ],
  })
  @IsOptional()
  @ValidateIf((o) => o.client_category === ClientCategory.FAMILY_PLANNING_METHOD)
  @ArrayUnique((p) => p.medicine_variant_id, { message: 'Prescriptions must have unique medicine variant ids' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  prescriptions?: CreatePrescriptionDto[];

  @ApiProperty({
    description: 'Insertion period for the contraceptive method',
    enum: InsertionPeriod,
    required: false,
    example: InsertionPeriod.LESS_THAN_3_MONTHS,
  })
  @IsOptional()
  @ValidateIf((o) => o.service_category === ServiceCategory.LARC_REMOVAL)
  @IsEnum(InsertionPeriod)
  insertion_period?: InsertionPeriod;

  @ApiProperty({
    description: 'Reason for removal of contraceptive (if applicable)',
    enum: RemovalReason,
    required: false,
    example: RemovalReason.COMPLICATION,
  })
  @IsOptional()
  @ValidateIf((o) => o.service_category === ServiceCategory.LARC_REMOVAL)
  @IsEnum(RemovalReason)
  removal_reason?: RemovalReason;

  @ApiProperty({
    description: 'Whether client counseling was done',
    example: true,
  })
  @IsBoolean()
  client_counseling_done: boolean;
}
export class UpdateFamilyPlanningDto extends PartialType(
  OmitType(CreateFamilyPlanningDto, [
    'service_category',
    'client_category',
    'prescriptions'
  ] as const),
) {
  @ApiProperty({
    description: 'ID of the associated visit',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  appointment_id: number;
}
