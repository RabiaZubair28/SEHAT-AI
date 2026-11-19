import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { AttendanceService } from '../attendance.service';
import { Attendance } from './attendance.entity';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';
import {
  CheckOutAttendanceDto,
  CreateAttendanceDto,
  GetAttendanceFilterDto,
} from '../attendance.dto';
import { FacilityInchargeGuard } from 'src/auth/facility-incharge.guard';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Create attendance record',
    description:
      'Creates a new attendance record for the authenticated user with the current timestamp as check-in time. Latitude and longitude are required for vaccinator users and optional for others.',
  })
  @ApiResponse({
    status: 201,
    type: Attendance,
  })
  createAttendance(
    @Req() request: Request,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createAttendanceDto: CreateAttendanceDto,
  ) {
    return this.attendanceService.create(request, createAttendanceDto);
  }

  @Patch('checkout')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Check out attendance',
    description:
      'Updates the attendance record of the authenticated user to mark check-out time.',
  })
  @ApiResponse({
    status: 201,
    type: Attendance,
  })
  checkOut(
    @Req() request: Request,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    checkOutAttendanceDto: CheckOutAttendanceDto,
  ) {
    return this.attendanceService.checkOut(request, checkOutAttendanceDto);
  }

  @Patch('force-checkout/:doctorId')
  @UseGuards(FacilityInchargeGuard)
  @ApiOperation({
    summary: 'Force check out a doctor',
    description:
      'Forcefully checks out a doctor for the current facility. Only facility incharge can perform this action.',
  })
  @ApiParam({ name: 'doctorId', type: Number })
  @ApiResponse({
    status: 200,
    type: Attendance,
  })
  forceCheckOut(
    @Req() request: Request,
    @Param('doctorId', ParseIntPipe) doctorId: number,
  ) {
    const facilityId = ((request as any).user as any)?.facilityId;
    return this.attendanceService.forceCheckOut(doctorId, Number(facilityId));
  }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get attendance records based on user role',
    description:
      'Fetches attendance records based on user role: Admin/Super Admin see all records, Facility Incharge sees facility records, regular users see only their own records. Sorted by attendance time (latest first). Supports pagination and filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated attendance records',
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Attendance' } },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  findAll(
    @Req() request: Request,
    @Query() filterDto: GetAttendanceFilterDto,
  ) {
    const userId = ((request as any).user as any)?.sub;
    const role = ((request as any).user as any)?.role;
    const userFacilityId = ((request as any).user as any)?.facilityId;

    return this.attendanceService.findAll(userId, role, userFacilityId, filterDto);
  }
}
