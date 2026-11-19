import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Matches,
  IsDateString,
  ValidateIf,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import {
  IdentityProvider,
  EmergencyServiceType,
  BloodGroup,
  NationalityStatus,
  Gender,
} from 'src/common/enums/enums';

export class CreateEmergencyPatientDto {
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Khan' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({
    enum: IdentityProvider,
    example: IdentityProvider.SELF,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(IdentityProvider, {
    message:
      'identity_provider must be one of the following values: Self, Mother, Father, Sibling, Spouse, Guardian, Uncle/Aunt (blood-relation), Other',
  })
  identity_provider?: IdentityProvider;

  @ApiPropertyOptional({ example: 'Guardian Name' })
  @ValidateIf((o) => o.identity_provider === IdentityProvider.OTHER)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  other_identity_provider?: string;

  @ApiPropertyOptional({ example: NationalityStatus.PAKISTANI })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(NationalityStatus, {
    message:
      'nationality_status must be one of the following values: Pakistani, Non-Pakistani',
  })
  nationality_status?: NationalityStatus;

  @ApiPropertyOptional({ example: '12345-1234567-1' })
  @ValidateIf((o) => o.nationality_status === NationalityStatus.PAKISTANI)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({ example: 'AB1234567' })
  @ValidateIf((o) => o.nationality_status === NationalityStatus.NON_PAKISTANI)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  international_id?: string;

  @ApiProperty({ example: '0300-1234567' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{7}$/, {
    message: 'Mobile number must be in format: xxxx-xxxxxxx',
  })
  mobile_no: string;

  @ApiProperty({
    example: '25 years',
    description: 'Age (e.g., "25 years", "6 months", "2 weeks")',
  })
  @IsString()
  @IsNotEmpty()
  age: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Gender of the patient',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.A_POS })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(BloodGroup)
  blood_group?: BloodGroup;

  @ApiProperty({
    enum: EmergencyServiceType,
    example: EmergencyServiceType.OPD,
  })
  @IsEnum(EmergencyServiceType)
  service_required: EmergencyServiceType;

  @ApiPropertyOptional({ example: 'Diabetes management' })
  @ValidateIf((o) => o.service_required === EmergencyServiceType.OTHER)
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsNotEmpty()
  other_service?: string;

  @ApiProperty({ example: 'Severe headache and fever' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsNotEmpty()
  presenting_complaint: string;

  @ApiPropertyOptional({ example: 'Hypertension, Diabetes' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  past_medical_history?: string;

  @ApiProperty({
    example: false,
    description: 'Did you administer any medicines to the patient?',
  })
  @IsBoolean()
  medicine_administered: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  facility_id: number;
}
