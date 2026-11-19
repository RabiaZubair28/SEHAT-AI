import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { CtgReporting } from 'src/common/enums/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCtgDto {
  @ApiProperty({ example: true, description: 'Does patient require ctg?' })
  @IsBoolean()
  requiresCtg: boolean;

  @ApiProperty({
    example: true,
    description: 'Is ctg machine available at facility?',
  })
  @IsBoolean()
  @IsOptional()
  @ValidateIf((o) => o.requiresCtg === true)
  ctgMachineAvailable: boolean;

  @ApiPropertyOptional({
    example: CtgReporting.NORMAL_REACTIVE,
    enum: CtgReporting,
  })
  @IsOptional()
  @ValidateIf((o) => o.requiresCtg === true)
  @IsEnum(CtgReporting)
  ctgReporting?: CtgReporting;

  @ApiPropertyOptional({ example: 'Good observation' })
  @IsOptional()
  @IsString()
  ctgObservations?: string;
}
