// create-admin.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodType, MaritalStatus } from 'src/common/enums/enums';

export class CreateAdminDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  last_name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the role assigned to the user (ALL ROLES ALLOWED)',
  })
  @IsOptional()
  @IsNumber()
  role_id?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'ID of the facility the user belongs to',
  })
  @IsOptional()
  @IsNumber()
  facility_id?: number;

  // Geographic fields
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  division_id?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  district_id?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  taluka_id?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  uc_id?: number;

  // Personal Info fields
  @ApiPropertyOptional({ example: '12345-1234567-1' })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    example: Gender.MALE,
    enum: Gender,
    description: 'Gender: Male, Female, or Other'
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '+92-300-1234567' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'MBBS, MD' })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: '+92-300-7654321' })
  @IsOptional()
  @IsString()
  emergency_contact?: string;

  @ApiPropertyOptional({
    example: BloodType.A_POS,
    enum: BloodType,
    description: 'Blood type: A +ve, A -ve, B +ve, B -ve, AB +ve, AB -ve, O +ve, O -ve'
  })
  @IsOptional()
  @IsEnum(BloodType)
  blood_type?: BloodType;

  @ApiPropertyOptional({
    example: MaritalStatus.SINGLE,
    enum: MaritalStatus,
    description: 'Marital status: Single, Married, Widowed, Divorced, Other'
  })
  @IsOptional()
  @IsEnum(MaritalStatus)
  marital_status?: MaritalStatus;

  @ApiPropertyOptional({ example: 'Pakistani' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: 'Islam' })
  @IsOptional()
  @IsString()
  religion?: string;
}
