import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ClosePatientImmunisationDto {
  @ApiProperty({ example: 123, description: 'Patient ID' })
  @IsInt()
  patientId: number;
}
