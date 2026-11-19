import { ApiProperty } from '@nestjs/swagger';

class PncMutateDataAppointmentServiceDto {
  @ApiProperty({ example: 1 })
  id: number;
}

class PncMutateDataDto {
  @ApiProperty({ type: PncMutateDataAppointmentServiceDto })
  appointmentService: PncMutateDataAppointmentServiceDto;
}

export class PncMutateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 201 })
  status: number;

  @ApiProperty({ type: PncMutateDataDto })
  data: PncMutateDataDto;

  @ApiProperty({ example: 'PNC visit created successfully' })
  message: string;
}
