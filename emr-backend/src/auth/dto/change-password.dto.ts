import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_STRENGTH_MESSAGE,
  PASSWORD_STRENGTH_REGEX,
} from 'src/auth/password-policy';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    example: 'OldSecure123',
    description:
      'Current password. Not required when a super admin reset forces the change.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  current_password?: string;

  @ApiProperty({
    example: 'NewSecure123',
    description: 'New password',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_STRENGTH_REGEX, { message: PASSWORD_STRENGTH_MESSAGE })
  new_password: string;
}
