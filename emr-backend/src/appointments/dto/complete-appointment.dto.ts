// complete-appointment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CompleteAppointmentDto {
  @ApiProperty({ example: 1, description: 'ID of the appointment to complete' })
  @IsInt()
  appointmentId: number;

  @ApiProperty({ example: 1, description: 'ID of the service to start' })
  @IsInt()
  serviceId: number;
}
