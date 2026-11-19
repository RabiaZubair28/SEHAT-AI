import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Service } from 'src/services/entities/service.entity';
import { AttendanceStatus } from 'src/common/enums/enums';
import { User } from 'src/users/entities/user.entity';

export class LoginDto {
  @ApiProperty({ example: 'super@emr.com', description: 'Admin User email address' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Admin@123', description: 'User password' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiPropertyOptional({
    description: 'Latitude of the user at login.',
    example: 24.848612,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of the user at login.',
    example: 67.046521,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Flag set by the mobile app. When true, latitude and longitude are required.',
  })
  @IsOptional()
  @IsBoolean()
  isMobile?: boolean;
}

export class LoginAttendanceDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 12 })
  userId: number;

  @ApiProperty({ example: 3, nullable: true })
  facilityId: number | null;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.CHECKED_IN })
  status: AttendanceStatus;

  @ApiProperty({ example: '2024-01-01T09:00:00.000Z' })
  checkInTime: Date;

  @ApiPropertyOptional({
    example: '2024-01-01T17:00:00.000Z',
    nullable: true,
  })
  checkOutTime: Date | null;

  @ApiPropertyOptional({ example: 24.8607, nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ example: 67.0011, nullable: true })
  longitude: number | null;
}

export class LoginResponseDto {
  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: () => [Service] })
  services: Service[];

  @ApiPropertyOptional({ type: () => LoginAttendanceDto, nullable: true })
  attendance?: LoginAttendanceDto | null;
}
