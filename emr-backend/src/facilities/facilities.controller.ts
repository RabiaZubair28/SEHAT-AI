import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseBoolPipe,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FacilitiesService } from './facilities.service';
import { BulkFacilitiesService } from './bulk-facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { BulkCreateFacilitiesDto } from './dto/bulk-create-facilities.dto';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { Facility } from './entities/facility.entity';
import { JwtOrClientAuthGuard } from 'src/auth/jwt-or-client-auth.guard';
import { FacilityDistrictFiltersDto } from './dto/facility-district-filters.dto';
import { ApiClientRequest } from 'src/auth/interfaces/api-client-request.interface';

@ApiTags('Facilities')
@Controller('facilities')
export class FacilitiesController {
  constructor(
    private readonly facilitiesService: FacilitiesService,
    private readonly bulkFacilitiesService: BulkFacilitiesService,
  ) {}

  @Post()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Create a new facility',
    description:
      'Allows an admin to create a new facility with required details such as name, while keeping code optional.',
  })
  @ApiResponse({
    status: 201,
    description: 'Facility created successfully',
    type: Facility,
  })
  @ApiBody({ type: CreateFacilityDto })
  create(@Body() createFacilityDto: CreateFacilityDto) {
    return this.facilitiesService.create(createFacilityDto);
  }

  @Post('bulk')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Bulk create facilities',
    description:
      'Creates many facilities in a single transaction. The whole batch is rejected when any row is invalid, resolves to unknown geography, or duplicates an existing facility; the error response contains a per-row errors[] array.',
  })
  @ApiResponse({
    status: 201,
    description: 'All rows created successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Batch rejected — response body contains errors[] of { row, field, message }',
  })
  @ApiBody({ type: BulkCreateFacilitiesDto })
  bulkCreate(@Body() bulkCreateFacilitiesDto: BulkCreateFacilitiesDto) {
    return this.bulkFacilitiesService.createBulk(bulkCreateFacilitiesDto);
  }

  @Get('/')
  @UseGuards(JwtOrClientAuthGuard)
  @ApiOperation({
    summary:
      'Filter facilities by name, code, location, facility_id, and pagination',
    description:
      'Returns a filtered and paginated list of facilities based on optional name, code, location, and facility_id queries.',
  })
  @ApiQuery({
    name: 'facility_id',
    required: false,
    type: Number,
    description: 'Specific facility ID to fetch',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Facility name for filtering',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    type: String,
    description: 'Facility code for filtering',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    type: String,
    description: 'Facility location for filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'managedByPPHI',
    required: false,
    type: Boolean,
    description: 'Filter facilities managed by PPHI',
  })
  @ApiResponse({
    status: 200,
    description: 'Filtered list of facilities',
    type: [Facility],
  })
  async getFacilitiesFilters(
    @Req() request: ApiClientRequest,
    @Query('facility_id') facility_id?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('location') location?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
    @Query('managedByPPHI', new ParseBoolPipe({ optional: true }))
    managedByPPHI?: boolean,
  ) {
    return this.facilitiesService.findAll({
      facility_id,
      name,
      code,
      location,
      page,
      limit,
      managedByPPHI,
      role: ((request as any).user as any)?.role,
      isClientAuth: Boolean(request.apiClient),
    });
  }

  @Get('district/:district_id')
  @UseGuards(JwtOrClientAuthGuard)
  @ApiOperation({
    summary: 'Get facilities associated by district ID',
    description:
      'Returns all facilities linked to a specific district ID. Requires admin access.',
    tags: ['User', 'Admin'],
  })
  @ApiParam({
    name: 'district_id',
    type: Number,
    description: 'District ID to retrieve facilities for',
  })
  @ApiResponse({
    status: 200,
    description: 'Facilities found for the district',
  })
  @ApiQuery({
    name: 'managedByPPHI',
    required: false,
    type: Boolean,
    description: 'When true, return only facilities managed by PPHI',
  })
  findByDistrict(
    @Req() request: ApiClientRequest,
    @Param('district_id') id: number,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    filters: FacilityDistrictFiltersDto,
  ) {
    return this.facilitiesService.findByDistrictId(
      +id,
      filters,
      Boolean(request.apiClient),
    );
  }
}
