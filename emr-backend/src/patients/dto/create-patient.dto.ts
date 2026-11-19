import {
  IsEnum,
  IsString,
  IsDateString,
  Length,
  Matches,
  IsInt,
  ValidateNested,
  IsOptional,
  IsNumber,
  ValidateIf,
  IsEmpty,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePatientAdditionalInfoDto } from 'src/patient-additional-info/dto/create-patient-additional-info.dto';
import { CreatePatientSocialDeterminantDto } from 'src/patient-social-determinants/dto/create-patient-social-determinant.dto';
import { Type } from 'class-transformer';
import { CNICProvider, Gender, NationalityStatus, PhoneProvider } from 'src/common/enums/enums';
import { CnicLengthByNationality } from 'src/common/validators/cnic-length-by-nationality.validator';
import { isUnderFive } from 'src/common/helper';

export class CreatePatientDto {
  @ApiProperty({
    enum: CNICProvider,
    description: 'Relationship of the CNIC provider to the patient',
    example: CNICProvider.Self,
  })
  @IsEnum(CNICProvider)
  cnic_provider: CNICProvider;

  @ApiProperty({
    enum: NationalityStatus,
    description: 'Nationality status of the patient',
    example: NationalityStatus.PAKISTANI,
  })
  @IsEnum(NationalityStatus)
  nationalityStatus: NationalityStatus;

  @ApiProperty({
    description: 'CNIC length is 13 for Pakistani and 6-20 for Non-Pakistani',
    example: '4333021839623',
  })
  @ValidateIf(o => o.cnic_provider === CNICProvider.CnicNA)
  @IsEmpty({ message: 'CNIC must be empty when CNIC is not available' })
  @ValidateIf(o => o.cnic_provider !== CNICProvider.CnicNA)
  @IsString()
  @IsNotEmpty({ message: 'CNIC is required' })
  @CnicLengthByNationality()
  cnic?: string;

  @ApiProperty({ description: 'First name of the patient', example: 'Ali' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Last name of the patient', example: 'Ahsan' })
  @IsString()
  last_name: string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD format)',
    type: String,
    example: '1990-01-01',
  })
  @IsDateString()
  dob: string;

  @ApiProperty({
    description: 'Immunisation number of the patient (required only if age < 5 years)',
    example: '11111111111111',
    required: false,
  })
  @ValidateIf(o => isUnderFive(o.dob))
  @IsOptional()
  @IsString()
  @Length(14, 14)
  @Matches(/^\d+$/)
  immunisation_number: string;

  @ApiProperty({
    enum: Gender,
    description: 'Gender of the patient',
    example: Gender.FEMALE,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    enum: PhoneProvider,
    description: 'Relationship of the phone provider to the patient',
    example: PhoneProvider.Self,
  })
  @IsEnum(PhoneProvider)
  phone_provider: PhoneProvider;

  @ApiProperty({
    description: 'Phone number (10 to 15 digits)',
    minLength: 10,
    maxLength: 15,
    example: '03506886734',
  })
  @IsString()
  @Length(10, 15)
  phone_number: string;

  @ApiProperty({
    description: 'Full address of the patient',
    example: 'EOC Sindh',
  })
  @IsString()
  address: string;

  @ApiProperty({ description: 'ID of the division (foreign key)', example: 1 })
  @IsInt()
  division_id: number;

  @ApiProperty({ description: 'ID of the district (foreign key)', example: 1 })
  @IsInt()
  district_id: number;

  @ApiProperty({ description: 'ID of the taluka (foreign key)', example: 3 })
  @IsInt()
  taluka_id: number;

  @ApiProperty({ example: 24, description: 'ID of the UC', nullable: true })
  @IsNumber()
  @IsOptional()
  uc_id?: number;

  @ApiProperty({ type: CreatePatientAdditionalInfoDto })
  @ValidateNested()
  @Type(() => CreatePatientAdditionalInfoDto)
  additional_info: CreatePatientAdditionalInfoDto;

  @ApiProperty({ type: CreatePatientSocialDeterminantDto })
  @ValidateNested()
  @Type(() => CreatePatientSocialDeterminantDto)
  social_determinants: CreatePatientSocialDeterminantDto;
}
