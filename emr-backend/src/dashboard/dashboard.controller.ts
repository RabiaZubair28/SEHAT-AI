import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';
import { GetDashboardOverallQueryDto } from './dto/get-dashboard-overall-query.dto';
import { DashboardOverallResponseDto } from './dto/dashboard-overall-response.dto';
import { DashboardService } from './dashboard.service';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get dashboard data',
    description:
      'Returns today patient flow, current month patient flow, and staff attendance summary. Super Admin/Admin/Head Office can optionally scope by facilityId, otherwise data is aggregated across active facilities. Facility Incharge is scoped to own facility.',
  })
  @ApiQuery({
    name: 'date',
    type: String,
    example: '2025-12-31',
    description: 'YYYY-MM-DD calendar date. Defaults to today.',
    required: false,
  })
  @ApiQuery({
    name: 'facilityId',
    required: false,
    type: Number,
    description:
      'Optional for Super Admin/Admin/Head Office. If omitted, data is aggregated across all active facilities.',
  })
  @ApiQuery({
    name: 'facility_id',
    required: false,
    type: Number,
    description: 'Snake_case alias for facilityId.',
  })
  @ApiQuery({
    name: 'districtId',
    required: false,
    type: Number,
    description:
      'Optional for Super Admin/Admin. Filters dashboard data to active facilities in the given district when facilityId is not provided.',
  })
  @ApiQuery({
    name: 'totalFacilityStaffRecordsPage',
    required: false,
    type: Number,
    description: 'Page for totalFacilityStaffRecords.',
  })
  @ApiQuery({
    name: 'totalFacilityStaffRecordsLimit',
    required: false,
    type: Number,
    description: 'Limit for totalFacilityStaffRecords.',
  })
  @ApiQuery({
    name: 'totalFacilityStaffRecordsSearch',
    required: false,
    type: String,
    description: 'Search for totalFacilityStaffRecords by name or role.',
  })
  @ApiQuery({
    name: 'checkedInUsersPage',
    required: false,
    type: Number,
    description: 'Page for checkedInUsers.',
  })
  @ApiQuery({
    name: 'checkedInUsersLimit',
    required: false,
    type: Number,
    description: 'Limit for checkedInUsers.',
  })
  @ApiQuery({
    name: 'checkedInUsersSearch',
    required: false,
    type: String,
    description: 'Search for checkedInUsers by name or role.',
  })
  @ApiQuery({
    name: 'checkedOutUsersPage',
    required: false,
    type: Number,
    description: 'Page for checkedOutUsers.',
  })
  @ApiQuery({
    name: 'checkedOutUsersLimit',
    required: false,
    type: Number,
    description: 'Limit for checkedOutUsers.',
  })
  @ApiQuery({
    name: 'checkedOutUsersSearch',
    required: false,
    type: String,
    description: 'Search for checkedOutUsers by name or role.',
  })
  getDashboard(@CurrentUser() user: any, @Query() query: GetDashboardQueryDto) {
    return this.dashboardService.getDashboard(user, query);
  }

  @Get('overall')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get dashboard overall totals',
    description:
      'Returns lifetime total patient registrations and total visits. Super Admin/Admin/Head Office can optionally scope by facilityId or districtId, otherwise totals are aggregated across active facilities. Facility Incharge is scoped to own facility. The dashboard date filter does not apply.',
  })
  @ApiResponse({
    status: 200,
    description: 'Overall totals fetched successfully',
    type: DashboardOverallResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'facilityId does not belong to districtId, or Facility Incharge has no facility/district assigned',
  })
  @ApiResponse({
    status: 403,
    description:
      'Role not allowed, or Facility Incharge requested another facility/district',
  })
  getOverallTotals(
    @CurrentUser() user: any,
    @Query() query: GetDashboardOverallQueryDto,
  ): Promise<DashboardOverallResponseDto> {
    return this.dashboardService.getOverallTotals(user, query);
  }
}
