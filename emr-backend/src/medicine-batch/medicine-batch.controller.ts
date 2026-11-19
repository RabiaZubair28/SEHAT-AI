import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseArrayPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { MedicineBatchService } from './medicine-batch.service';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { AddMedicineBatchDto } from './dto/add-medicine-batch.dto';
import { UpdateMedicineBatchDto } from './dto/update-medicine-batch.dto';
import { GetMedicineBatchFilterDto } from './dto/get-medicine-batch-filter.dto';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { MedicineBatchResponseDto } from './dto/medicine-batch-response.dto';

@ApiTags('Medicine Batch')
@Controller('medicine-batch')
export class MedicineBatchController {
  constructor(private readonly medicineBatchService: MedicineBatchService) {}

  @Post()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Add new medicine batches',
    description: 'Creates multiple medicine batch records. Accepts an array of medicine batches.',
  })
  @ApiBody({
    description: 'Array of medicine batches to create',
    type: [AddMedicineBatchDto],
    examples: {
      example1: {
        summary: 'Single batch',
        value: [
          {
            variantId: 1,
            facilityId: 1,
            batchNumber: 'BATCH-2024-001',
            expiryDate: '2025-12-31',
            purchaseDate: '2024-01-15',
            stockQuantity: 100,
            limitQuantity: 50,
            otc: false,
            medicineId: 1,
          },
        ],
      },
      example2: {
        summary: 'Multiple batches',
        value: [
          {
            variantId: 1,
            facilityId: 1,
            batchNumber: 'BATCH-2024-001',
            expiryDate: '2025-12-31',
            stockQuantity: 100,
            otc: false,
            medicineId: 1,
          },
          {
            variantId: 2,
            facilityId: 1,
            batchNumber: 'BATCH-2024-002',
            expiryDate: '2026-06-30',
            stockQuantity: 200,
            otc: true,
            medicineId: 2,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Medicine batches created successfully',
    type: [MedicineBatch],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(
    @Request() req,
    @Body(
      new ParseArrayPipe({
        items: AddMedicineBatchDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    addMedicineBatchDtos: AddMedicineBatchDto[],
  ): Promise<MedicineBatch[]> {
    const role = req.user.role.name;
    const userFacilityId = req.user.facilityId;
    const currentUserId = Number(req.user?.sub ?? req.user?.id);

    return this.medicineBatchService.create(
      addMedicineBatchDtos,
      role,
      userFacilityId,
      currentUserId,
    );
  }

  @Put(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Update a medicine batch',
    description: 'Updates an existing medicine batch. Edit is only allowed within 12 hours of batch creation.',
  })
  @ApiBody({
    type: UpdateMedicineBatchDto,
    examples: {
      example1: {
        summary: 'Full batch update',
        value: {
          batchNumber: 'BATCH-2024-001-UPDATED',
          expiryDate: '2026-06-30',
          purchaseDate: '2024-01-15',
          stockQuantity: 150,
          otc: false,
        },
      },
      example2: {
        summary: 'OTC batch with limit',
        value: {
          batchNumber: 'BATCH-2024-002',
          expiryDate: '2026-12-31',
          purchaseDate: '2024-06-01',
          stockQuantity: 200,
          otc: true,
          limitQuantity: 50,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Medicine batch updated successfully',
    type: MedicineBatchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or stock below dispensed quantity',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Medicine batch not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Batch is older than 12 hours',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateMedicineBatchDto: UpdateMedicineBatchDto,
  ): Promise<MedicineBatchResponseDto> {
    return this.medicineBatchService.update(
      id,
      updateMedicineBatchDto,
      user,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Delete a medicine batch',
    description:
      'Deletes an existing medicine batch. Cannot delete a dispensed batch. Delete is only allowed within 12 hours of batch creation.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Medicine batch deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Batch has been dispensed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Medicine batch not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Batch is older than 12 hours',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    return this.medicineBatchService.remove(id, user);
  }

  @Get(':id')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get a medicine batch by ID',
    description: 'Retrieves a single medicine batch record by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Medicine batch retrieved successfully',
    type: MedicineBatchResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Medicine batch not found',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MedicineBatchResponseDto> {
    return this.medicineBatchService.findOne(id, user);
  }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all medicine batches',
    description: 'Retrieves medicine batches with pagination. Facility incharge sees own facility, admin/super admin see all facilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Medicine batches retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MedicineBatch' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filterDto: GetMedicineBatchFilterDto,
  ): Promise<{
    data: (MedicineBatch & { isEditable: boolean; isDeletable: boolean })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.medicineBatchService.findAll(user, filterDto);
  }
}
