import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImpersonationExchangeDto {
  @ApiProperty({ description: 'The impersonation JWT code from the generated link' })
  @IsString()
  code: string;
}
