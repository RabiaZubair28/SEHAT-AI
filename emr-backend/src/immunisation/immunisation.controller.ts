import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  Req,
  Body,
  ParseArrayPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ImmunisationService } from './immunisation.service';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { FacilityInchargeGuard } from 'src/auth/facility-incharge.guard';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Immunisation } from './entities/immunisation.entity';
import { ImmunisationDosageStatus, VaccineAppliedTo } from 'src/common/enums/enums';
import { CreateImmunisationWithCardDto } from './dto/create-immunisation-with-card.dto';
import { PatientImmunisationSearchDto } from './dto/patient-immunisation-search.dto';
import { PatientImmunisation } from './entities/patient-immunisation.entity';
import { UpdatePatientImmunisationRemarksDto } from './dto/update-patient-immunisation-remarks.dto';
import { ClosePatientImmunisationDto } from './dto/close-patient-immunisation.dto';
import { PatientImmunisationFacilityInchargeDto } from './dto/patient-immunisation-facility-incharge.dto';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PatientsService } from 'src/patients/patients.service';
import { PatientSearchDto } from 'src/patients/dto/search-patient.dto';

@Controller('immunisation')
export class ImmunisationController {
  constructor(
    private readonly immunisationService: ImmunisationService,
    private readonly patientsService: PatientsService,
  ) { }

  @Get('vaccines')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Retrieve a paginated list of vaccines',
    description: 'Returns a list of vaccines filtered by optional parameters.',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter vaccines by name (partial match)',
  })
  @ApiQuery({
    name: 'applies_to',
    required: false,
    enum: VaccineAppliedTo,
    description: 'Filter vaccines by applies to whom',
  })
  @ApiQuery({
    name: 'dose_number',
    required: false,
    type: [Number],
    isArray: true,
    description: 'Filter vaccines by one or more dose numbers',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (defaults to 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (defaults to 100)',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: Number,
    description: 'Patient id to compute immunisation dosage status',
  })
  getVaccines(
    @Query('name') name?: string,
    @Query('dose_number', new ParseArrayPipe({ items: Number, optional: true, separator: ',' }))
    doseNumber?: number[],
    @Query('applies_to') appliesTo?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Query('patientId') patientId?: number,
  ) {
    return this.immunisationService.getVaccines({
      name,
      doseNumber,
      appliesTo,
      page,
      limit,
      patientId,
    });
  }

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Create immunisation record',
    description:
      'Creates a new immunisation record for a patient visit using immunisation card details.',
  })
  @ApiBody({ type: CreateImmunisationWithCardDto })
  @ApiResponse({
    status: 201,
    description: 'Immunisation record created successfully',
    type: Immunisation,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createImmunisationDto: CreateImmunisationWithCardDto,
  ) {
    return this.immunisationService.create(createImmunisationDto, user);
  }

  @Get('patient')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get immunisation by patient and appointment service',
    description: 'Fetches immunisation details for a patient and appointment service.',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'ID of the patient to retrieve immunisation for',
    type: String,
  })
  @ApiQuery({
    name: 'immunisation_number',
    required: false,
    description: 'Filter by patient immunisation number',
    type: String,
  })
  @ApiQuery({
    name: 'mr_no',
    required: false,
    description: 'Filter by patient MR number',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Immunisation found',
    type: Immunisation,
  })
  getByPatientAndAppointmentService(
    @Query('patientId') patientId?: string,
    @Query('immunisation_number') immunisationNumber?: string,
    @Query('mr_no') mrNo?: string,
  ) {
    return this.immunisationService.find(
      patientId ?? undefined,
      immunisationNumber ?? undefined,
      mrNo ?? undefined,
    );
  }

  @Get('patient-immunisations')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Retrieve patient immunisation summaries',
    description: 'Returns patient immunisation summary records from the last one month filtered by status.',
  })
  @ApiQuery({
    name: 'statuses',
    required: false,
    enum: ImmunisationDosageStatus,
    isArray: true,
    description: 'Filter by one or more immunisation statuses',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (defaults to 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (defaults to 10)',
  })
  @ApiQuery({
    name: 'facility_id',
    required: false,
    type: Number,
    description: 'Filter by patient facility ID',
  })
  @ApiQuery({
    name: 'uc_id',
    required: false,
    type: Number,
    description: 'Filter by patient UC ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of patient immunisation summaries',
    type: [PatientImmunisation],
  })
  getPatientImmunisations(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: PatientImmunisationSearchDto,
  ) {
    return this.immunisationService.getPatientImmunisations(filters);
  }

  @Get('patient-immunisations/uc')
  @UseGuards(FacilityInchargeGuard)
  @ApiOperation({
    summary: 'Retrieve patient immunisation summaries for user UC',
    description: 'Returns patient immunisation summary records for the UC of the requesting user.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (defaults to 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (defaults to 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of patient immunisation summaries',
    type: [PatientImmunisation],
  })
  getPatientImmunisationsByUc(
    @Req() request: Request,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: PatientImmunisationFacilityInchargeDto,
  ) {
    return this.immunisationService.getPatientImmunisationsByUserUc(
      request,
      filters,
    );
  }

  @Post('patient-immunisations/remarks')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Add patient immunisation remarks',
    description: 'Adds remarks to the latest patient immunisation record if empty.',
  })
  @ApiBody({ type: UpdatePatientImmunisationRemarksDto })
  @ApiResponse({
    status: 200,
    description: 'Remarks added',
    type: PatientImmunisation,
  })
  addPatientImmunisationRemarks(
    @Body() payload: UpdatePatientImmunisationRemarksDto,
  ) {
    return this.immunisationService.addPatientImmunisationRemarks(payload);
  }

  @Post('patient-immunisations/close')
  @UseGuards(FacilityInchargeGuard)
  @ApiOperation({
    summary: 'Close patient immunisation status',
    description: 'Sets the latest patient immunisation status to Closed for the given patient.',
  })
  @ApiBody({ type: ClosePatientImmunisationDto })
  @ApiResponse({
    status: 200,
    description: 'Patient immunisation status closed',
    type: PatientImmunisation,
  })
  closePatientImmunisation(
    @Body() payload: ClosePatientImmunisationDto,
  ) {
    return this.immunisationService.closePatientImmunisation(payload);
  }

  @Get('sync')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Sync patient immunisation data',
    description:
      'Fetches patient and vaccine datasets required for immunisation sync.',
  })
  @ApiQuery({
    name: 'timestamp',
    required: false,
    type: String,
    description:
      'Return only records created or updated after this timestamp. Accepts ISO 8601 or Unix timestamp in seconds or milliseconds.',
    example: '2026-06-15T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for sync pagination (defaults to 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of patients per sync page',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description:
      'Start of date range for patient immunisation created/updated timestamps.',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description:
      'End of date range for patient immunisation created/updated timestamps.',
    example: '2026-08-18',
  })
  @ApiResponse({
    status: 200,
    description: 'Patient immunisation sync data fetched successfully',
  })
  getImmunisationSync(
    @Req() request: Request,
    @Query() filters: {
      timestamp?: string;
      page?: string;
      limit?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    return this.immunisationService.getPatientImmunisationsSync(request, filters);
  }

  @Get('metadata')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Retrieve immunisation metadata',
    description:
      'Returns child vaccines and location metadata including divisions, districts, talukas, and UCs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Immunisation metadata fetched successfully',
  })
  getMetadata() {
    return this.immunisationService.getMetadata();
  }

  @Get('patients-with-immunisation')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Retrieve patients with immunisation records',
    description:
      'Returns a list of patients who have immunisation records.',
  })
  @ApiResponse({
    status: 200,
    description: 'Patients with immunisation records fetched successfully',
  })
  getPatientsWithImmunisation(@Query() filters: PatientSearchDto) {
    return this.patientsService.findAll(filters, {
      requireImmunisationNumber: true,
    });
  }
}
