import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Patient } from './entities/patient.entity';
import { PatientSearchDto } from './dto/search-patient.dto';
import { PatientSearchResponseDto } from './dto/patient-search-response.dto';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { CreateMedicalHistoryDto } from 'src/medical-history/dto/create-medical-history.dto';
import { VisitService } from 'src/visit/entities/visit.service';
import { ServiceType } from 'src/common/enums/enums';
import { PatientVisitsDto, PatientVisitServiceDto } from 'src/visit/visit.dto';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly visitService: VisitService,
  ) {}

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Create a new patient',
    description:
      'Creates a new patient record linked to the authenticated user.',
  })
  @ApiBody({ type: CreatePatientDto })
  @ApiResponse({
    status: 201,
    description: 'Patient created successfully',
    type: Patient,
  })
  create(@Request() req: any, @Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(req.user.sub, createPatientDto);
  }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all patients',
    description:
      'Retrieves a list of patients with optional filtering parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of patients',
    type: PatientSearchResponseDto,
  })
  findAllFilters(@Query() filters: PatientSearchDto) {
    return this.patientsService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get a patient by ID',
    description: 'Fetches details of a patient by their unique identifier.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Patient found', type: Patient })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Update a patient by ID',
    description: 'Updates an existing patient record by its ID.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePatientDto })
  @ApiResponse({ status: 200, description: 'Patient updated', type: Patient })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(req.user.sub, +id, updatePatientDto);
  }

  @Patch('medical-history/:id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Update a patients medical history by ID',
    description:
      'Updates an existing patients medical history record by its ID.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateMedicalHistoryDto })
  @ApiResponse({ status: 200, description: 'Patient updated', type: Patient })
  updateMedicalHistory(
    @Request() req: any,
    @Param('id') id: string,
    @Body() createMedicalHistory: CreateMedicalHistoryDto,
  ) {
    return this.patientsService.addOrUpdateMedicalHistory(
      req.user.sub,
      +id,
      createMedicalHistory,
    );
  }

  @Get(':id/visits')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get visit details of a patient by patient ID',
    description: 'Fetches all visits of a patient based on patient ID.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description:
      'Visit details of a service based on patient ID, visit ID, and service type found',
    type: PatientVisitsDto,
  })
  public getVisitsByPatientId(
    @Param('id', ParseIntPipe) patientId: number,
  ): Promise<PatientVisitsDto[]> {
    return this.visitService.getVisitsByPatientId(patientId);
  }

  @Get(':id/visits/:visitId/:serviceType')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get a patient service details by visit ID by patient ID',
    description:
      'Fetches service details of service of a patient based on visit ID and service type.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'visitId', type: Number })
  @ApiParam({
    name: 'serviceType',
    enum: ServiceType,
    description: 'Type of service (ANC, PNC, IMMUNISATION, DELIVERY)',
  })
  @ApiQuery({
    name: 'usedIn',
    required: false,
    enum: ServiceType,
    enumName: 'ServiceType',
    description:
      'Optional context where this service data is used. For ANC used in DELIVERY, only warning_signs and lmp are returned.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Visit details of a service based on patient ID, visit ID, and service type found',
    type: PatientVisitServiceDto,
  })
  public getVisitServiceTypeByPatient(
    @Param('id', ParseIntPipe) patientId: number,
    @Param('visitId', ParseIntPipe) visitId: number,
    @Param('serviceType') serviceType: ServiceType,
    @Req() request: Request,
    @Query('usedIn') usedIn?: ServiceType,
  ) {
    return this.visitService.getVisitServiceTypeByPatient(
      patientId,
      visitId,
      serviceType,
      usedIn ?? null,
    );
  }

  @Get(':id/service/:serviceType')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get a patient service details by patient ID',
    description:
      'Fetches service details of service of a patient based on service type.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({
    name: 'serviceType',
    enum: ServiceType,
    description: 'Type of service (ANC, PNC, IMMUNISATION, DELIVERY)',
  })
  @ApiQuery({
    name: 'usedIn',
    required: false,
    enum: ServiceType,
    enumName: 'ServiceType',
    description:
      'Optional context where this service data is used. For ANC used in DELIVERY, only warning_signs and lmp are returned.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Service details of a service based on patient ID and service type found',
    type: PatientVisitServiceDto,
  })
  public getServiceTypeByPatient(
    @Param('id', ParseIntPipe) patientId: number,
    @Param('serviceType') serviceType: ServiceType,
    @Req() request: Request,
    @Query('usedIn') usedIn?: ServiceType,
  ) {
    return this.visitService.getServiceTypeByPatient(
      patientId,
      serviceType,
      request,
      usedIn ?? null,
    );
  }
}
