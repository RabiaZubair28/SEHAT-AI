import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarningSign } from 'src/common/enums/enums';

export class DeliverySummaryPregnancyInfoDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String, format: 'date' })
  lmp: string;
}

export class DeliverySummaryVitalAssessmentDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({ enum: WarningSign, isArray: true, nullable: true })
  warning_signs: WarningSign[] | null;
}

export class AncDeliverySummaryDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => DeliverySummaryPregnancyInfoDto, nullable: true })
  pregnancyInfo: DeliverySummaryPregnancyInfoDto | null;

  @ApiProperty({
    type: () => DeliverySummaryVitalAssessmentDto,
    nullable: true,
  })
  ancVitalAssessment: DeliverySummaryVitalAssessmentDto | null;
}
