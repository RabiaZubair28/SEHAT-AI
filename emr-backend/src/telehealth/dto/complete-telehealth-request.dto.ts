import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompleteTelehealthRequestDto {
  @ApiProperty({ example: 'Possible unstable angina; monitor troponin and repeat ECG.' })
  @IsString()
  consultation_note: string;
}
