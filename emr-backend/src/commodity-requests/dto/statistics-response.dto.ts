import { ApiProperty } from '@nestjs/swagger';

export class RequestStatisticsDto {
  @ApiProperty({ example: 120 })
  totalRequests: number;

  @ApiProperty({ example: 15 })
  pendingRequests: number;

  @ApiProperty({ example: 80 })
  approvedRequests: number;

  @ApiProperty({ example: 5 })
  rejectedRequests: number;

  @ApiProperty({ example: 20 })
  partiallyFulfilledRequests: number;

  @ApiProperty({ example: 25 })
  contraceptiveRequests: number;

  @ApiProperty({ example: 95 })
  medicineRequests: number;
}