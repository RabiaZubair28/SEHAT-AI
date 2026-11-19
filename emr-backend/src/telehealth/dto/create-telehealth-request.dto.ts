import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTelehealthRequestDto {
  @ApiProperty({ example: 24 })
  @IsNumber()
  patient_id: number;

  @ApiPropertyOptional({ example: 101 })
  @IsNumber()
  appointment_service_id: number;

  @ApiProperty({ example: 17 })
  @IsNumber()
  consultant_doctor_id: number;

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({ example: 'ECG changes and chest pain need specialist input.' })
  @IsString()
  reason: string;
}
