import { IsEnum, IsArray, IsOptional, ValidateIf, IsNotEmpty, IsString } from 'class-validator';
import {
  PlaceOfDelivery,
  DeliveryOutcome,
  ModeOfDelivery,
  Complication,
} from 'src/common/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePreviousPregnancyDto {
  @ApiProperty({
    example: 'Public health facility',
    enum: PlaceOfDelivery,
  })
  @IsOptional()
  @IsEnum(PlaceOfDelivery)
  place_of_delivery: PlaceOfDelivery;

  @ApiProperty({
    example: 'Live birth',
    enum: DeliveryOutcome,
  })
  @IsOptional()
  @IsEnum(DeliveryOutcome)
  outcome: DeliveryOutcome;

  @ApiProperty({
    example: 'Normal',
    enum: ModeOfDelivery,
  })
  @IsOptional()
  @IsEnum(ModeOfDelivery)
  mode_of_delivery: ModeOfDelivery;

  @ApiProperty({
    example: [Complication.ANAEMIA_LOW_HB, Complication.HYPERTENSION],
    enum: Complication,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Complication, { each: true })
  complication: Complication[];

  @ApiProperty({
    example: 'Patient has a rare complication not listed above',
    required: false,
    description: 'Required if complication includes OTHER',
  })
  @ValidateIf(o => o.complication?.includes(Complication.OTHER))
  @IsNotEmpty({ message: 'otherComplication is required when complication includes OTHER' })
  @IsString()
  otherComplication?: string;
}
