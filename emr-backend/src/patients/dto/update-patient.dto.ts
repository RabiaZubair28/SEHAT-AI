import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsNumber,
  Length,
  Matches,
  ValidateNested,
  ValidateIf,
  IsEmpty,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateMedicalHistoryDto } from 'src/medical-history/dto/create-medical-history.dto';
import { UpdatePatientAdditionalInfoDto } from 'src/patient-additional-info/dto/update-patient-additional-info.dto';
import { UpdatePatientSocialDeterminantDto } from 'src/patient-social-determinants/dto/update-patient-social-determinant.dto';
import { CNICProvider, Gender, NationalityStatus, PhoneProvider } from 'src/common/enums/enums';
import { isUnderFive } from 'src/common/helper';
import { CnicLengthByNationality } from 'src/common/validators/cnic-length-by-nationality.validator';

export class UpdatePatientDto {
  @ApiPropertyOptional({ enum: CNICProvider })
  @IsOptional()
  @IsEnum(CNICProvider)
  cnic_provider?: CNICProvider;

  @ApiPropertyOptional({
    enum: NationalityStatus,
    description: 'Nationality status of the patient',
    example: NationalityStatus.PAKISTANI,
  })
  @IsEnum(NationalityStatus)
  nationalityStatus: NationalityStatus;

  @ApiPropertyOptional({
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dob?: Date;

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: PhoneProvider })
  @IsOptional()
  @IsEnum(PhoneProvider)
  phone_provider?: PhoneProvider;

  @ApiPropertyOptional({ minLength: 10, maxLength: 15 })
  @IsOptional()
  @IsString()
  @Length(10, 15)
  phone_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  division_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  district_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  facility_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taluka_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  uc_id?: number;

  @ApiPropertyOptional({ type: UpdatePatientAdditionalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePatientAdditionalInfoDto)
  additionalInfo?: UpdatePatientAdditionalInfoDto;

  @ApiPropertyOptional({ type: UpdatePatientSocialDeterminantDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePatientSocialDeterminantDto)
  socialDeterminants?: UpdatePatientSocialDeterminantDto;

  @ApiPropertyOptional({ type: CreateMedicalHistoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMedicalHistoryDto)
  medicalHistories?: CreateMedicalHistoryDto;
}
