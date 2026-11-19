import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  MaxLength,
  IsInt,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, Gender, MaritalStatus, UserStatus } from 'src/common/enums/enums';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'First name of the user' })
  @IsString()
  @MaxLength(255)
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the user' })
  @IsString()
  @MaxLength(255)
  last_name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email of the user',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'strongpassword',
    description: 'Password for authentication',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiProperty({ example: '2', description: 'Role ID of the user' })
  @IsString()
  role_id: string;

  @ApiPropertyOptional({
    example: null,
    description: 'Facility ID (nullable for super_admins)',
  })
  @IsOptional()
  @IsString()
  facility_id?: string;

  @ApiPropertyOptional({
    example: UserStatus.PENDING,
    description: 'User status',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  // Personal Info Fields
  @ApiProperty({
    example: '4220112345671',
    description: 'CNIC number of the user',
  })
  @IsString()
  @MaxLength(13)
  cnic: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Date of birth of the user',
  })
  @IsString()
  dob: string;

  @ApiProperty({
    example: Gender.MALE,
    enum: Gender,
    description: 'Gender of the user',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: '+923001234567',
    description: 'Contact number of the user',
  })
  @IsString()
  @MaxLength(15)
  contact: string;

  @ApiProperty({
    example: '123 Main St, Karachi',
    description: 'Residential address of the user',
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiPropertyOptional({
    example: 'Bachelor in CS',
    description: 'Qualifications of the user (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  qualifications?: string;

  @ApiPropertyOptional({
    example: 'Software Engineer',
    description: 'Specialization of the user (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string;

  @ApiPropertyOptional({
    example: '+923111234567',
    description: 'Emergency contact of the user',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  emergency_contact?: string;

  @ApiPropertyOptional({
    example: BloodType.A_POS,
    enum: BloodType,
    description: 'Blood type of the user (optional)',
  })
  @IsOptional()
  @IsEnum(BloodType)
  blood_type?: BloodType;

  @ApiProperty({
    example: MaritalStatus.SINGLE,
    enum: MaritalStatus,
    description: 'Marital status of the user',
  })
  @IsEnum(MaritalStatus)
  marital_status: MaritalStatus;

  @ApiProperty({ example: 'Pakistani', description: 'Nationality of the user' })
  @IsString()
  @MaxLength(100)
  nationality: string;

  @ApiProperty({ example: 'Islam', description: 'Religion of the user' })
  @IsString()
  @MaxLength(25)
  religion: string;

  @ApiPropertyOptional({ description: 'ID of the division (foreign key)', example: 1 })
  @IsOptional()
  @IsInt()
  division_id?: number;

  @ApiPropertyOptional({ description: 'ID of the district (foreign key)', example: 1 })
  @IsOptional()
  @IsInt()
  district_id?: number;

  @ApiPropertyOptional({ description: 'ID of the taluka (foreign key)', example: 3 })
  @IsOptional()
  @IsInt()
  taluka_id?: number;

  @ApiPropertyOptional({ example: 24, description: 'ID of the UC' })
  @IsOptional()
  @IsNumber()
  @IsOptional()
  uc_id?: number;
}
