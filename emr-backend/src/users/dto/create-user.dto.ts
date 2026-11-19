import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
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
    description: 'ID of the role assigned to the user',
  })
  @IsOptional()
  @IsNumber()
  role_id: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'ID of the facility the user belongs to',
  })
  @IsOptional()
  @IsNumber()
  facility_id: number;

}
