import { ApiProperty } from '@nestjs/swagger';

class AncMutateDataAppointmentServiceDto {
  @ApiProperty({ example: 1 })
  id: number;
}

class AncMutateDataDto {
  @ApiProperty({ type: AncMutateDataAppointmentServiceDto })
  appointmentService: AncMutateDataAppointmentServiceDto;
}

export class AncMutateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 201 })
  status: number;

  @ApiProperty({ type: AncMutateDataDto })
  data: AncMutateDataDto;

  @ApiProperty({ example: 'ANC visit created successfully' })
  message: string;
}
