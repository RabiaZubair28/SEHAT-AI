import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class StartAppointmentDto {
  @ApiProperty({ example: 1, description: 'ID of the appointment to start' })
  @IsInt()
  appointmentId: number;

  @ApiProperty({ example: 1, description: 'ID of the service to start' })
  @IsInt()
  serviceId: number;
}
