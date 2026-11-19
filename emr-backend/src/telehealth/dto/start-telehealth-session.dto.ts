import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { TelehealthMeetingProvider } from '../enums/telehealth.enums';

export class StartTelehealthSessionDto {
  @ApiProperty({
    enum: TelehealthMeetingProvider,
    example: TelehealthMeetingProvider.GOOGLE_MEET,
  })
  @IsEnum(TelehealthMeetingProvider)
  provider: TelehealthMeetingProvider;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsOptional()
  @IsUrl()
  meeting_url?: string;

  @ApiPropertyOptional({ example: 'meet-abc-defg-hij' })
  @IsOptional()
  @IsString()
  external_meeting_id?: string;
}
