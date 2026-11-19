import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/utils/pagination.dto';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { User } from 'src/users/entities/user.entity';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';
import { RoleName, ServiceType } from 'src/common/enums/enums';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ApiResponseMessages } from 'src/common/api-messages.constants';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) { }

  @Get('appointment/pending')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get all pending appointments by Doctor ID',
    description:
      'Retrieve a paginated list of all pending appointments assigned to a specific doctor identified by their ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending appointments found and returned successfully',
  })
  findAllPending(@Query() filters: PaginationDto, @Request() req: any) {
    return this.doctorsService.findAllPending(filters, +req.user.sub);
  }

  @Get('appointment/completed')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get all completed appointments by Doctor ID',
    description:
      'Retrieve a paginated list of all completed appointments for a specific doctor identified by their ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Completed appointments found and returned successfully',
  })
  findAllCompleted(@Query() filters: PaginationDto, @Request() req: any) {
    return this.doctorsService.findAllCompleted(filters, +req.user.sub);
  }

  @Get('appointment/all')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get all appointments (for registration clerk)',
    description:
      'Get all apppoinments for a current day, based on registration clerk`s facility_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Found all appointments for a facility_id',
  })
  findAll(@Query() filters: PaginationDto, @Req() request: Request) {
    return this.doctorsService.findAll(filters, request);
  }

  @Get('admin/appointment/pending')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get all pending appointments by Doctor ID for admin',
    description:
      'Retrieve a paginated list of all pending appointments by facility ID assigned to a specific doctor identified by their ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending appointments found and returned successfully',
  })
  findAllAdminPending(
    @Query() filters: PaginationDto,
    @Query('facility_id') facility_id: number,
    @Request() req: any,
  ) {
    const facilityId = req.user.facilityId || facility_id;
    return this.doctorsService.findAllAdminPending(filters, +facilityId);
  }

  @Get('available')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get checked-in doctors offering a service',
    description:
      'Retrieve doctors for a facility who offer the given service and are checked in.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checked-in doctors fetched successfully',
    type: User,
  })
  @ApiQuery({ name: 'facility_id', required: false })
  @ApiQuery({
    name: 'service_type',
    enum: ServiceType,
    required: false,
    description: 'Alias for serviceType',
  })
  getCheckedInDoctors(
    @CurrentUser() user: any,
    @Req() request: Request,
    @Query() query: any,
    @Query('facility_id') facility_id?: number,
  ) {
    const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN];
    const role = user?.role ?? (request as any).user?.role;
    let facilityId: number | undefined;
    if (privilegedRoles.includes(role)) {
      if (!facility_id) {
        throw new BadRequestException(ApiResponseMessages.FACILITY_ID_REQUIRED_FOR_ADMIN);
      }
      facilityId = facility_id;
    } else {
      facilityId = ((request as any).user as any)?.facilityId;
    }
    const currentUserId = Number((request as any).user?.sub);
    return this.doctorsService.findCheckedInByService(
      query?.service_type as ServiceType,
      Number(facilityId),
      currentUserId
    );
  }

  @Patch('transfer/service/:serviceType/doctor/:doctorId/appointment/:appointmentId')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Transfer service to another doctor',
    description:
      'Transfers the service associated with the given service type to another doctor for the specified appointment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service transferred successfully',
    type: User,
  })
  @ApiParam({
    name: 'serviceType',
    enum: ServiceType,
    description: 'Type of service (ANC, PNC, IMMUNISATION, DELIVERY)',
  })
  @ApiParam({
    name: 'appointmentId',
    type: Number,
    description: 'Appointment ID to transfer',
  })
  @ApiQuery({ name: 'facility_id', required: false })
  update(
    @Query() query: any,
    @Param('serviceType') serviceType: ServiceType,
    @Param('doctorId') doctorId: number,
    @Param('appointmentId') appointmentId: number,
    @CurrentUser() user: any,
    @Req() request: Request,
    @Query('facility_id') facility_id?: number,
  ) {
    const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN];
    const role = user?.role ?? (request as any).user?.role;
    if (privilegedRoles.includes(role) && !facility_id) {
      throw new BadRequestException(ApiResponseMessages.FACILITY_ID_REQUIRED_FOR_ADMIN);
    }
    const resolvedFacilityId = privilegedRoles.includes(role)
      ? facility_id
      : (request as any).user?.facilityId;
    const resolvedServiceType =
      (query?.service_type as ServiceType) ?? serviceType;
    return this.doctorsService.transfer(
      resolvedServiceType,
      +doctorId,
      +appointmentId,
      request,
      resolvedFacilityId,
    );
  }

  @Get('facility')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get doctors by facility',
    description:
      'Retrieve a paginated list of doctors for the current facility.',
  })
  @ApiResponse({
    status: 200,
    description: 'Doctors fetched successfully',
    type: [User],
  })
  getDoctorsByFacility(
    @Req() request: Request,
    @Query() filters: PaginationDto,
  ) {
    const facilityId = ((request as any).user as any)?.facilityId || filters.facility_id;
    const currentUserId = Number((request as any).user?.sub);
    return this.doctorsService.findDoctorsByFacility(
      filters,
      Number(facilityId),
      currentUserId,
    );
  }
}
