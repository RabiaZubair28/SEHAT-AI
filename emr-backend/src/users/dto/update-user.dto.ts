import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, Gender, MaritalStatus, UserStatus } from 'src/common/enums/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: 'jane.smith@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.APPROVED })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated role ID for the user',
  })
  @IsOptional()
  @IsNumber()
  role_id?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Updated facility ID for the user',
  })
  @IsOptional()
  @IsNumber()
  facility_id?: number;

  // ✅ Location Fields
  @ApiPropertyOptional({
    example: 1,
    description: 'Division ID',
  })
  @IsOptional()
  @IsNumber()
  division_id?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'District ID',
  })
  @IsOptional()
  @IsNumber()
  district_id?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Taluka ID',
  })
  @IsOptional()
  @IsNumber()
  taluka_id?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'UC ID',
  })
  @IsOptional()
  @IsNumber()
  uc_id?: number;

  // ✅ Personal Information Fields
  @ApiPropertyOptional({
    example: '1234567890123',
    description: 'CNIC (13 digits)',
  })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'Date of birth',
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    example: Gender.MALE,
    description: 'Gender',
  })
  @IsOptional()
  @IsString()
  gender?: Gender;

  @ApiPropertyOptional({
    example: BloodType.A_POS,
    description: 'Blood type',
  })
  @IsOptional()
  @IsString()
  blood_type?: BloodType;

  @ApiPropertyOptional({
    example: '03001234567',
    description: 'Contact number',
  })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({
    example: '03007654321',
    description: 'Emergency contact number',
  })
  @IsOptional()
  @IsString()
  emergency_contact?: string;

  @ApiPropertyOptional({
    example: '123 Main Street, City',
    description: 'Address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'MBBS, MD',
    description: 'Qualifications',
  })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiPropertyOptional({
    example: 'Cardiology',
    description: 'Specialization',
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({
    example: MaritalStatus.MARRIED,
    description: 'Marital status',
  })
  @IsOptional()
  @IsString()
  marital_status?: MaritalStatus;

  @ApiPropertyOptional({
    example: 'Pakistani',
    description: 'Nationality',
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    example: 'Islam',
    description: 'Religion',
  })
  @IsOptional()
  @IsString()
  religion?: string;
}

