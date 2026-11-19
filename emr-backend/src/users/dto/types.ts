import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    type: String,
    description: 'User first name',
  })
  @IsOptional()
  @IsString()
  public firstName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'User last name',
  })
  @IsOptional()
  @IsString()
  public lastName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'User password (min 8 chars)',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  public password?: string;
}
