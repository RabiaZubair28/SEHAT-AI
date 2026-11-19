import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { YearsOfEducation } from '../entities/patient-social-determinant.entity';

export class CreatePatientSocialDeterminantDto {
  @ApiProperty({
    example: 'Apartment',
    description:
      'Type of dwelling where the patient resides (max 255 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dwelling_type: string;

  @ApiProperty({
    example: 'Teacher',
    description: 'Occupation of the head of household (max 255 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  occupation_head_of_household: string;

  @ApiProperty({
    example: 5,
    description: 'Total number of members in the household',
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  household_members_count: number;

  @ApiProperty({
    example: 'Urdu',
    description: 'Mother tongue of the patient (max 15 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  mother_tongue: string;

  @ApiProperty({
    example: YearsOfEducation.Primary,
    description: 'Highest level of education the patient has attained',
    enum: YearsOfEducation,
  })
  @IsOptional()
  @IsEnum(YearsOfEducation)
  years_of_education: YearsOfEducation;
}
