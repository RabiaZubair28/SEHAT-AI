import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateUnassignedPatientDto {
  @ApiProperty({
    description: 'ID of the patient being unassigned',
    example: 1,
  })
  @IsNumber()
  patient_id: number;

  @ApiProperty({
    description: 'ID of the facility',
    example: 1,
  })
  @IsNumber()
  facility_id: number;
}
