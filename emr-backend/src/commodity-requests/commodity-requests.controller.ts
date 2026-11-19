import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CommodityRequestService } from './commodity-requests.service';
import { CreateCommodityRequestDto } from './dto/create-commodity-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { FilterRequestDto } from './dto/filter-request.dto';
import { UpdateCommodityRequestStatusDto } from './dto/update-commodity-request.dto';
import { RequestStatisticsDto } from './dto/statistics-response.dto';
import { MedicineInventoryResponseDto } from './dto/inventory-response.dto';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Commodity Requests')
@ApiBearerAuth()
@Controller('commodity-requests')
export class CommodityRequestController {
  constructor(
    private readonly commodityRequestService: CommodityRequestService,
  ) { }

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a commodity request with multiple items',
    description:
      'Creates a new commodity request containing one or more medicine variants.',
  })
  @ApiResponse({
    status: 201,
    description: 'Commodity request successfully created',
    type: RequestResponseDto,
  })
  @ApiBody({
    type: CreateCommodityRequestDto,
    description: 'Commodity request with multiple medicine items',
  })
  async createCommodityRequest(
    @Body() dto: CreateCommodityRequestDto,
    @Req() req: Request,
  ): Promise<RequestResponseDto> {
    return this.commodityRequestService.createCommodityRequest(dto, req);
  }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all commodity requests',
    description: 'Retrieves commodity requests using optional filter criteria.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of commodity requests',
    type: RequestResponseDto,
    isArray: true,
  })
  async getRequests(
    @Query() filters: FilterRequestDto,
    @Req() req: Request,
  ): Promise<RequestResponseDto[]> {
    return this.commodityRequestService.getRequests(filters, req);
  }

  @Get('statistics/summary')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get commodity request statistics',
    description:
      'Returns summary statistics of commodity requests, optionally filtered by requester.',
  })
  @ApiQuery({
    name: 'requesterId',
    required: false,
    type: Number,
    description: 'Requester User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Commodity request statistics summary',
    type: RequestStatisticsDto,
  })
  async getRequestStatistics(
    @Query('requesterId') requesterId?: number,
  ): Promise<RequestStatisticsDto> {
    return this.commodityRequestService.getRequestStatistics(requesterId);
  }

  @Get('inventory/all')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all medicine inventory',
    description: 'Retrieves inventory of all medicines and contraceptives.',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter medicines by name (partial match)',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete inventory list',
    type: MedicineInventoryResponseDto,
    isArray: true,
  })
  async getAllInventory(
    @Req() req: Request,
    @Query('name') name?: string,
  ): Promise<MedicineInventoryResponseDto[]> {
    return this.commodityRequestService.getMedicineInventory(req, undefined, name);
  }

  @Get('inventory/contraceptives')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get contraceptive inventory',
    description: 'Retrieves inventory for contraceptive commodities only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraceptive inventory list',
    type: MedicineInventoryResponseDto,
    isArray: true,
  })
  async getContraceptiveInventory(
    @Req() req: Request,
  ): Promise<MedicineInventoryResponseDto[]> {
    return this.commodityRequestService.getContraceptiveInventory(req);
  }

  @Get('inventory/medicines')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get non-contraceptive medicine inventory',
    description: 'Retrieves inventory for non-contraceptive medicines only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Medicine inventory list',
    type: MedicineInventoryResponseDto,
    isArray: true,
  })
  async getNonContraceptiveInventory(
    @Req() req: Request,
  ): Promise<
    MedicineInventoryResponseDto[]
  > {
    return this.commodityRequestService.getNonContraceptiveInventory(req);
  }

  @Get(':id')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get commodity request by ID',
    description: 'Retrieves a specific commodity request by its ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Commodity Request ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Commodity request details',
    type: RequestResponseDto,
  })
  async getRequestById(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<RequestResponseDto> {
    return this.commodityRequestService.getRequestById(id, req);
  }

  @Get('requester/:requesterId')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get requests by requester',
    description:
      'Retrieves all commodity requests created by a specific requester.',
  })
  @ApiParam({
    name: 'requesterId',
    type: Number,
    description: 'Requester User ID',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'List of commodity requests by requester',
    type: RequestResponseDto,
    isArray: true,
  })
  async getRequestsByRequester(
    @Param('requesterId') requesterId: number,
    @Req() req: Request,
  ): Promise<RequestResponseDto[]> {
    return this.commodityRequestService.getRequestsByRequester(requesterId, req);
  }

  @Patch(':id/status')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Update commodity request status with item-level control',
    description:
      'Updates the approval or processing status of a commodity request. Allows individual control over each item.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Commodity Request ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Updated commodity request',
    type: RequestResponseDto,
  })
  @ApiBody({
    type: UpdateCommodityRequestStatusDto,
    description: 'Status update with item-level modifications',
  })
  async updateRequestStatus(
    @Param('id') id: number,
    @Body() dto: UpdateCommodityRequestStatusDto,
    @Req() req: Request,
  ): Promise<RequestResponseDto> {
    return this.commodityRequestService.updateRequestStatus(id, dto, req);
  }
}
