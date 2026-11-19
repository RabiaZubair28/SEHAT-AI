import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Complication, ModeOfDelivery, ReasonForEdit, Trimester } from 'src/common/enums/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePreviousPregnancyDto } from './create-previous-pregnancy.dto';
import { NotOlderThan10Months } from 'src/common/validators/not-older-than-10-months.validator';

export class CreatePregnancyInfoDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  gravidity: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  parity: number;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString()
  @NotOlderThan10Months()
  lmp: Date;

  @ApiProperty({ example: 0 })
  @IsInt()
  abortion: number;

  @ApiProperty({ example: 22 })
  @IsInt()
  gestational_age: number;

  @ApiProperty({
    example: 'Changing current LMP',
    enum: ReasonForEdit,
  })
  @IsOptional()
  @IsEnum(ReasonForEdit)
  reason_for_edit: ReasonForEdit;

  @ApiProperty({ example: '2025-12-06' })
  @IsDateString()
  expected_date_of_delivery: Date;

  @ApiProperty({
    example: Trimester.FIRST,
    enum: Trimester,
  })
  @IsEnum(Trimester)
  trimester: Trimester;

  @ApiPropertyOptional({
    type: [CreatePreviousPregnancyDto],
    example: [
      {
        place_of_delivery: 'Public health facility',
        outcome: 'Live birth',
        mode_of_delivery: ModeOfDelivery.NORMAL,
        complication: [Complication.HYPERTENSION, Complication.ANAEMIA_LOW_HB],
        otherComplication: 'Patient has a rare complication not listed above',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreviousPregnancyDto)
  previous_pregnancy?: CreatePreviousPregnancyDto[];
}
