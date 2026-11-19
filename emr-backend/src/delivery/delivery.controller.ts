import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryProgressStatus } from 'src/common/enums/enums';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('/delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) { }

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Add Delivery Visit details',
    description:
      'Creates a new Delivery Visit record with optional nested assesments.',
  })
  @ApiQuery({
    name: 'progress_status',
    required: true,
    enum: DeliveryProgressStatus,
    default: DeliveryProgressStatus.CONTINUE,
    description: 'Pass progress status',
  })
  @ApiBody({ type: CreateDeliveryDto })
  @ApiResponse({ status: 201, type: AppointmentService })
  create(
    @Body() dto: CreateDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('progress_status') status: DeliveryProgressStatus,
  ) {
    return this.deliveryService.create(dto, user, status);
  }

  @Patch('/:appointment_service_id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Update Delivery Cemonc details',
    description:
      'Updates an existing Delivery Cemonc record with optional nested assessments. Immutable fields in newborn assessments cannot be updated.',
  })
  @ApiParam({
    name: 'appointment_service_id',
    required: true,
    description: 'ID of the appointment service to update',
    type: Number,
  })
  @ApiQuery({
    name: 'progress_status',
    required: false,
    enum: DeliveryProgressStatus,
    description: 'Optional delivery progress status',
  })
  @ApiBody({ type: UpdateDeliveryDto })
  @ApiResponse({ status: 200, type: AppointmentService })
  updateCemonc(
    @Param('appointment_service_id') appointmentServiceId: number,
    @Body() dto: UpdateDeliveryDto,
    @Req() req: Request,
    @Query('progress_status') status?: DeliveryProgressStatus,
  ): Promise<AppointmentService> {
    return this.deliveryService.update(
      appointmentServiceId,
      dto,
      req,
      status,
    );
  }

  @Get('patient/:patientId')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get Deliveries by Patient ID',
    description:
      'Retrieves all Delivery records associated with a specific patient ID.',
  })
  @ApiResponse({
    status: 200,
    type: [AppointmentService],
  })
  async findByPatient(
    @Param('patientId') patientId: number,
    @Param('appointmentServiceId') appointmentServiceId: number,
  ) {
    return this.deliveryService.findByPatientId(
      patientId,
      appointmentServiceId,
    );
  }

  @Get('appointment-service/:appointmentServiceId/children')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get Children by Appointment Service ID',
    description:
      'Retrieves all child patients (ID, first name, last name, gender) associated with a specific appointment service.',
  })
  @ApiParam({
    name: 'appointmentServiceId',
    type: Number,
    description: 'Appointment Service ID',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'List of child patients linked to the appointment service',
    isArray: true,
  })
  async getChildrenByAppointmentService(
    @Param('appointmentServiceId', ParseIntPipe)
    appointmentServiceId: number,
  ) {
    return this.deliveryService.getChildrenByAppointmentService(
      appointmentServiceId,
    );
  }
}
