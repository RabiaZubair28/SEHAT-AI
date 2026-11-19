import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class PauseAppointmentDto {
  @ApiProperty({ example: 1, description: 'ID of the appointment to pause' })
  @IsInt()
  appointmentId: number;

  @ApiProperty({ example: 1, description: 'ID of the service to stapausert' })
  @IsInt()
  serviceId: number;
}
