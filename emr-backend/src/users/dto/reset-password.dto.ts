import { IsString, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'The new password for the user',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
