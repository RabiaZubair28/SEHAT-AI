import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CompleteAppointmentDto } from '../appointments/dto/complete-appointment.dto';
import { StartAppointmentDto } from '../appointments/dto/start-appointment.dto';
import { PauseAppointmentDto } from './dto/pause-appointment.dto';
import { SearchServicePatientDto } from './dto/search-service-patient.dto';
import { RoleName } from 'src/common/enums/enums';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post('/complete')
  @ApiOperation({
    summary: 'Complete  appointment for the patient',
    description:
      'Complete the appointment for the patient, Only by the assigned doctor',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient appointment completed successfully',
  })
  @UseGuards(JwtUserAuthGuard)
  complete(@Req() request: Request, @Body() body: CompleteAppointmentDto) {
    return this.appointmentsService.completeAppointmentService(
      ((request as any).user as any)?.sub,
      body.appointmentId,
      body.serviceId,
    );
  }

  @Post('/start')
  @ApiOperation({
    summary: 'Start the appointment for the patient',
    description:
      'Start the appointment for the patient, Only by the assigned doctor',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient appointment started successfully',
  })
  @UseGuards(JwtUserAuthGuard)
  start(@Req() request: Request, @Body() body: StartAppointmentDto) {
    return this.appointmentsService.startAppointmentService(
      ((request as any).user as any)?.sub,
      body.appointmentId,
      body.serviceId,
    );
  }

  @Post('/pause')
  @ApiOperation({
    summary: 'Pause the appointment for the patient',
    description:
      'Pause the appointment for the patient, Only by the assigned doctor',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient appointment paused successfully',
  })
  @UseGuards(JwtUserAuthGuard)
  pause(@Req() request: Request, @Body() body: PauseAppointmentDto) {
    return this.appointmentsService.pauseAppointmentService(
      ((request as any).user as any)?.sub,
      body.appointmentId,
      body.serviceId,
    );
  }

  @Get('/get')
  @ApiOperation({
    summary: 'Get details for the appointment',
    description: 'Get the relevant details for the appointment',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment details successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment details not found',
  })
  @UseGuards(JwtUserAuthGuard)
  getAppointment(@Query('id') id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Get('/appointment-services')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get appointment services by facility and service',
    description:
      'Fetch appointment services for a facility filtered by service_id.',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment services fetched successfully',
  })
  getAppointmentServicesByFacility(
    @Req() request: Request,
    @Query() filters: SearchServicePatientDto,
    @Query('facility_id') facility_id?: number,
  ) {
    const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN];
    const role = (request as any).user?.role;
    let facilityId: number | undefined;
    if (privilegedRoles.includes(role)) {
      if (!facility_id) {
        throw new BadRequestException(ApiResponseMessages.FACILITY_ID_REQUIRED_FOR_ADMIN);
      }
      facilityId = facility_id;
    } else {
      facilityId = ((request as any).user as any)?.facilityId;
    }
    return this.appointmentsService.findAppointmentServicesByFacility(
      Number(facilityId),
      filters,
    );
  }
}
