import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LevelOfCare, PlaceOfDelivery } from 'src/common/enums/enums';

export class VaccineVisitData {
  @ApiProperty({ type: Number })
  id: number;
}

export class FacilityVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;
}

export class ImmunisationDoseVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => VaccineVisitData })
  vaccine: VaccineVisitData;

  @ApiProperty({ type: String, format: 'date-time' })
  dateAdministered: string | Date;

  @ApiPropertyOptional({ type: Number, nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  longitude: number | null;
}

export class ImmunisationCardVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({
    enum: PlaceOfDelivery,
    enumName: 'PlaceOfDelivery',
    nullable: true,
  })
  placeOfDelivery: PlaceOfDelivery | null;

  @ApiPropertyOptional({
    oneOf: [{ type: 'string' }, { type: 'number' }],
    nullable: true,
  })
  districtId: string | number | null;

  @ApiPropertyOptional({
    oneOf: [{ type: 'string' }, { type: 'number' }],
    nullable: true,
  })
  talukaId: string | number | null;

  @ApiPropertyOptional({
    enum: LevelOfCare,
    enumName: 'LevelOfCare',
    nullable: true,
  })
  level_of_care: LevelOfCare | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  facilityId: string | null;

  @ApiPropertyOptional({ type: () => FacilityVisitData, nullable: true })
  facility: FacilityVisitData | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  otherFacilityName: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  immunisationCardAvailable: boolean | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  immunisationCardProvided: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  immunisationNumber: string | null;
}

export class PatientVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => [ImmunisationDoseVisitData] })
  immunisationsDoses: ImmunisationDoseVisitData[];

  @ApiPropertyOptional({
    type: () => ImmunisationCardVisitData,
    nullable: true,
  })
  immunisationCard: ImmunisationCardVisitData | null;
}

export class ImmunisationVisitResponseDto {
  @ApiProperty({ type: () => PatientVisitData })
  patient: PatientVisitData;
}
