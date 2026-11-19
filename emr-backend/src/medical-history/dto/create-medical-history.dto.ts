import { IsOptional, IsArray, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AllergyType } from 'src/common/enums/enums';

export class CreateMedicalHistoryDto {
  @ApiPropertyOptional({
    isArray: true,
    enum: AllergyType,
    description: 'List of allergies',
    example: [AllergyType.POLLEN, AllergyType.DUST],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AllergyType, { each: true })
  allergies?: AllergyType[];

  @ApiPropertyOptional({
    type: [String],
    description: 'List of previous illnesses (names only)',
    example: ['asthma', 'malaria'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previous_illness?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'List of addictions (names only)',
    example: ['smoking', 'alcohol'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addictions?: string[];
}
