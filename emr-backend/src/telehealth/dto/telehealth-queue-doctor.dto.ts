import { ApiProperty } from '@nestjs/swagger';
import { TelehealthAvailabilityStatus } from '../enums/telehealth.enums';

export class TelehealthQueueDoctorDto {
  @ApiProperty({ example: 42 })
  doctor_id: number;

  @ApiProperty({ example: 'Ahmed' })
  first_name: string;

  @ApiProperty({ example: 'Khan' })
  last_name: string;

  @ApiProperty({ example: 'ahmed.khan@example.com' })
  email: string;

  @ApiProperty({ example: 'Cardiology', nullable: true })
  specialty: string | null;

  @ApiProperty({
    enum: TelehealthAvailabilityStatus,
    example: TelehealthAvailabilityStatus.AVAILABLE,
  })
  availability: TelehealthAvailabilityStatus;

  @ApiProperty({ enum: ['busy', 'idle'], example: 'idle' })
  current_call_status: 'busy' | 'idle';

  @ApiProperty({ example: true })
  is_checked_in: boolean;

  @ApiProperty({ example: true })
  is_telehealth_consultant: boolean;

  @ApiProperty({ type: [String], example: ['OPD', 'ANC'] })
  services: string[];
}
