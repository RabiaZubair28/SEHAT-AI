import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'System Maintenance' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We will be down for 2 hours tonight.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
