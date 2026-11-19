import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImmunisationVisitResponseDto } from '../immunisation/dto/immunisation-visit-response.dto';
import { AncVisitResponseDto } from '../anc/dto/anc-visit-response.dto';
import { AncDeliverySummaryDto } from '../anc/dto/anc-delivery-summary.dto';
import { PncVisitResponseDto } from '../pnc/dto/pnc-visit-response.dto';

export class PatientVisitServiceDto {
  @ApiPropertyOptional({ nullable: true })
  public familyPlanning: any | null;
  @ApiPropertyOptional({
    type: () => AncVisitResponseDto,
    nullable: true,
  })
  public anc: AncVisitResponseDto | AncDeliverySummaryDto | null;
  @ApiPropertyOptional({
    type: () => PncVisitResponseDto,
    nullable: true,
  })
  public pnc: PncVisitResponseDto | null;
  @ApiPropertyOptional({
    type: () => ImmunisationVisitResponseDto,
    nullable: true,
  })
  public immunization: ImmunisationVisitResponseDto | null;
  @ApiPropertyOptional({ nullable: true })
  public opd: any | null;
  @ApiPropertyOptional({ nullable: true })
  public delivery: any | null;
  @ApiPropertyOptional({ nullable: true })
  public dispenser: any | null;
  @ApiPropertyOptional({ nullable: true })
  public nutrition: any | null;

  constructor() {
    this.familyPlanning = null;
    this.anc = null;
    this.pnc = null;
    this.immunization = null;
    this.opd = null;
    this.delivery = null;
    this.dispenser = null;
    this.nutrition = null;
  }
}

export class PatientVisitsDto {
  @ApiProperty({
    description: 'Unique identifier for the visit',
    example: 101,
    type: Number,
  })
  public visitId: number;

  @ApiProperty({
    description: 'Comma-separated list of services associated with the visit',
    example: 'Family Planning, ANC, PNC',
    type: String,
  })
  public services: string;

  @ApiProperty({
    description: 'Timestamp when the visit was created',
    example: '2025-11-07T10:23:45.000Z',
    type: String,
    format: 'date-time',
  })
  public createdAt: Date;

  @ApiProperty({
    description: 'Current status of the visit',
    example: 'COMPLETED',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  })
  public visitStatus: string;
}
