import { ApiProperty } from '@nestjs/swagger';

export class DashboardOverallServiceVisitsDto {
  @ApiProperty({ example: 'Family Planning' })
  label: string;

  @ApiProperty({ example: 80000 })
  value: number;
}

export class DashboardOverallDataDto {
  @ApiProperty({
    example: 1250000,
    description: 'Lifetime patient registrations within the scope.',
  })
  totalRegistrations: number;

  @ApiProperty({
    example: 3400000,
    description: 'Lifetime visits (appointments of any status) within the scope.',
  })
  totalVisits: number;

  @ApiProperty({
    example: 3100000,
    description: 'Lifetime visits with COMPLETED status within the scope.',
  })
  totalVisitsCompleted: number;

  @ApiProperty({
    type: () => [DashboardOverallServiceVisitsDto],
    example: [
      { label: 'OPD', value: 1200000 },
      { label: 'ANC', value: 340000 },
      { label: 'Family Planning', value: 80000 },
    ],
    description:
      'Lifetime visits per service within the scope, in display order, omitting services with no visits. A visit with several services counts once under each, so the values can add up to more than totalVisits.',
  })
  totalVisitsByService: DashboardOverallServiceVisitsDto[];
}

export class DashboardOverallResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: DashboardOverallDataDto })
  data: DashboardOverallDataDto;

  @ApiProperty({ example: 'Dashboard overall totals fetched successfully' })
  message: string;
}
