import { Controller, Post, Get, Delete, Body, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dtos/create-leave.dto';
import { Leave } from './entities/leave.entity';
import { FacilityInchargeGuard } from 'src/auth/facility-incharge.guard';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Leave')
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @UseGuards(FacilityInchargeGuard)
  @ApiOperation({
    summary: 'Create leave record',
    description: 'Creates a new leave record for a user. Only Facility Incharge can create leaves.',
  })
  @ApiBody({ type: CreateLeaveDto })
  @ApiResponse({
    status: 201,
    description: 'Leave record created successfully',
    type: Leave,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Facility Incharge can access this resource',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Invalid dates or overlapping leave',
  })
  create(
    @Body() createLeaveDto: CreateLeaveDto,
    @Req() request: Request,
  ): Promise<Leave> {
    const userId = ((request as any).user as any)?.sub;
    const facilityId = ((request as any).user as any)?.facilityId;
    return this.leaveService.create(
      createLeaveDto,
      userId,
      facilityId,
    );
  }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all applied leaves',
    description: 'Retrieves all applied leaves sorted by creation date in descending order. Accessible by all authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaves retrieved successfully',
    type: [Leave],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  findAll(@Req() request: Request): Promise<Leave[]> {
    const userId = ((request as any).user as any)?.sub;
    const role = ((request as any).user as any)?.role;
    const facilityId = ((request as any).user as any)?.facilityId;
    return this.leaveService.findAll(userId, role, facilityId);
  }

  @Delete(':id')
  @UseGuards(FacilityInchargeGuard)
  @ApiOperation({
    summary: 'Delete leave record',
    description: 'Deletes a leave record. Only future leaves can be deleted. Only Facility Incharge can delete leaves.',
  })
  @ApiResponse({
    status: 200,
    description: 'Leave record deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Facility Incharge can access this resource or user not from same facility',
  })
  @ApiResponse({
    status: 404,
    description: 'Leave record not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot delete leave that has already started or ended',
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<void> {
    const facilityId = ((request as any).user as any)?.facilityId;
    return this.leaveService.delete(id, facilityId);
  }
}
