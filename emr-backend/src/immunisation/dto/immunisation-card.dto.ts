import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { LevelOfCare, PlaceOfDelivery } from 'src/common/enums/enums';

const IMMUNISATION_PLACE_OF_DELIVERY_OPTIONS = [
  PlaceOfDelivery.PUBLIC_HEALTH_FACILITY,
  PlaceOfDelivery.PRIVATE_HEALTH_FACILITY,
  PlaceOfDelivery.INFORMAL_DELIVERY_CENTER,
  PlaceOfDelivery.HOME,
] as const;

export class ImmunisationCardDto {
  @ApiPropertyOptional({
    enum: IMMUNISATION_PLACE_OF_DELIVERY_OPTIONS,
    example: PlaceOfDelivery.PRIVATE_HEALTH_FACILITY,
    description: 'Place of delivery; nullable so check for presence before use',
  })
  @IsIn(IMMUNISATION_PLACE_OF_DELIVERY_OPTIONS)
  @IsOptional()
  placeOfDelivery?: PlaceOfDelivery;

  @ApiPropertyOptional({ example: 1, description: 'District identifier; nullable so verify before use' })
  @IsOptional()
  districtId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Taluka identifier; nullable so verify before use' })
  @IsOptional()
  talukaId?: number;

  @ApiPropertyOptional({
    enum: LevelOfCare,
    example: LevelOfCare.PRIMARY,
    description: 'Level of care; nullable so check before read',
  })
  @IsOptional()
  @ValidateIf((place) => place.placeOfDelivery === PlaceOfDelivery.PUBLIC_HEALTH_FACILITY)
  @IsEnum(LevelOfCare)
  level_of_care?: LevelOfCare;

  @ApiPropertyOptional({ example: 'FAC-2233', description: 'Facility identifier; nullable so verify before use' })
  @IsOptional()
  @ValidateIf((place) => place.placeOfDelivery === PlaceOfDelivery.PUBLIC_HEALTH_FACILITY)
  facility?: string;

  @ApiPropertyOptional({
    example: 'Nakasero Health Center',
    description:
      'Private facility / delivery center name. Required when place is Private health facility or Informal delivery center.',
  })
  @ValidateIf(
    (place) =>
      place.placeOfDelivery === PlaceOfDelivery.PRIVATE_HEALTH_FACILITY ||
      place.placeOfDelivery === PlaceOfDelivery.INFORMAL_DELIVERY_CENTER,
  )
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  otherFacilityName?: string;

  @ApiProperty({ example: true, description: 'If immunisation card is available; defaults to false' })
  @IsOptional()
  immunisationCardAvailable: boolean;

  @ApiProperty({ example: true, description: 'If immunisation card is provided; defaults to false' })
  @IsOptional()
  @ValidateIf((imm) => imm.immunisationCardAvailable === false)
  immunisationCardProvided: boolean;

  @ApiPropertyOptional({ example: '11111111111111', description: 'Immunisation number; nullable so verify before use' })
  @IsOptional()
  @IsString()
  @Length(14, 14)
  @Matches(/^\d+$/)
  immunisationNumber?: string;
}
