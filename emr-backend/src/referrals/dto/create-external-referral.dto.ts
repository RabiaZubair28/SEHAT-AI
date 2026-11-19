import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import {
  LevelOfCare,
  ReferralType,
  TypeOfService,
} from 'src/common/enums/enums';

export class CreateExternalReferralDto {
  @ApiProperty({
    description: 'ID of the patient being referred',
    example: 1,
  })
  @IsNumber()
  patient_id: number;

  @ApiProperty({
    description: 'ID of the district',
    example: 12,
  })
  @IsNotEmpty({ message: 'district_id is required for external referrals.' })
  @IsNumber()
  district_id: number;

  @ApiProperty({
    description: 'ID of the facility',
    example: 7,
  })
  @IsNotEmpty({ message: 'facility_id is required for external referrals.' })
  @IsNumber()
  facility_id: number;

  @ApiProperty({
    description: 'Type of service Required by the patient',
    enum: LevelOfCare,
    example: LevelOfCare.PRIMARY,
  })
  @IsEnum(LevelOfCare)
  @IsNotEmpty({ message: 'Level of care required cannot be empty' })
  level_of_care: LevelOfCare;

  @ApiProperty({
    description: 'Reason for the referral',
    example: 'Patient needs advanced diagnostics.',
  })
  @IsNotEmpty({ message: 'reason is required for external referrals.' })
  @IsString()
  refer_out_reason: string;

  @ApiProperty({
    description: 'Type of service Required by the patient',
    enum: TypeOfService,
    example: TypeOfService.ANC,
  })
  @Transform(({ value }) => {
    if (!value) return value;

    const lower = value.toLowerCase();

    const match = Object.values(TypeOfService).find(
      (item) => item.toLowerCase() === lower,
    );

    return match ?? value;
  })
  @IsEnum(TypeOfService, { message: 'Invalid type of service' })
  @IsNotEmpty({ message: 'type of service required cannot be empty' })
  type_of_service: TypeOfService;

  @ApiProperty({
    description: 'Type of referral',
    enum: ReferralType,
    example: ReferralType.EXTERNAL,
  })
  @IsEnum(ReferralType)
  @IsNotEmpty()
  type: ReferralType;
}
