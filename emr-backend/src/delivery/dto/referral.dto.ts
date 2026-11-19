import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  ReferralPerson,
  ChildComplications,
  LevelOfCare,
  MotherComplication,
  ReferralType,
  TypeOfService,
  ChildOrder,
} from '../../common/enums/enums';

export class CreateReferralDetailsDto {
  @ApiProperty({ example: 'ABC Hospital' })
  @IsInt()
  patient_id?: number;

  @ApiProperty({
    enum: ReferralPerson,
    example: ReferralPerson.CHILD,
    nullable: true,
    required: true,
  })
  @IsEnum(ReferralPerson)
  whoRequiresReferral?: ReferralPerson;

  @ApiProperty({
    enum: ChildOrder,
    example: ChildOrder.FIRST_CHILD,
    nullable: true,
    required: true,
  })
  @IsEnum(ChildOrder)
  @IsOptional()
  whichChildRequiredReferral?: ChildOrder;

  @ApiProperty({
    enum: ReferralType,
    example: ReferralType.EXTERNAL,
    nullable: true,
    required: true,
  })
  @IsEnum(ReferralType)
  @IsOptional()
  typeOfReferral?: ReferralType;

  @ApiProperty({
    enum: MotherComplication,
    isArray: true,
    nullable: true,
  })
  @ValidateIf(o => o.whoRequiresReferral?.includes(ReferralPerson.MOTHER))
  @IsArray()
  @IsEnum(MotherComplication, { each: true })
  @IsOptional()
  motherComplications?: MotherComplication[];

  @ApiProperty({
    enum: ChildComplications,
    isArray: true,
    nullable: true,
  })
  @ValidateIf(o => o.whoRequiresReferral?.includes(ReferralPerson.CHILD))
  @IsArray()
  @IsEnum(ChildComplications, { each: true })
  @IsOptional()
  childComplications?: ChildComplications[];

  @ApiProperty({
    example: 'Some other complication',
    nullable: true,
  })
  @ValidateIf(
    o =>
      o.motherComplications?.includes(MotherComplication.OTHER) ||
      o.childComplications?.includes(ChildComplications.OTHER),
  )
  @IsString()
  @IsOptional()
  otherComplication?: string;

  @ApiProperty({ example: 'Karachi', nullable: true })
  @IsString()
  @IsOptional()
  districtName?: string;

  @ApiProperty({ enum: TypeOfService, example: TypeOfService.DELIVERY, nullable: true })
  @IsEnum(TypeOfService)
  typeOfService?: TypeOfService;

  @ApiProperty({ example: 1, nullable: true })
  @IsInt()
  @IsOptional()
  district_id?: number

  @ApiProperty({ enum: LevelOfCare, nullable: true })
  @IsEnum(LevelOfCare)
  @IsOptional()
  levelOfCare?: LevelOfCare;

  @ApiProperty({ example: 'ABC Hospital', nullable: true })
  @IsString()
  @IsOptional()
  facilityName?: string;

  @ApiProperty({ example: 1, nullable: true })
  @IsInt()
  @IsOptional()
  facility_id?: number
}
