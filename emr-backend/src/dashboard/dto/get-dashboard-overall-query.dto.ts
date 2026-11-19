import { PickType } from '@nestjs/swagger';
import { GetDashboardQueryDto } from './get-dashboard-query.dto';

export class GetDashboardOverallQueryDto extends PickType(
  GetDashboardQueryDto,
  ['facilityId', 'districtId'] as const,
) {}
