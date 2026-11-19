import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MinLength } from 'class-validator';

export class UpdatePatientImmunisationRemarksDto {
  @ApiProperty({ example: 123, description: 'Patient ID' })
  @IsInt()
  patientId: number;

  @ApiProperty({ example: 'Patient refused due to fever.' })
  @IsString()
  @MinLength(1)
  remarks: string;
}
