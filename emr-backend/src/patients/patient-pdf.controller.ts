import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PatientPdfService } from './patient-pdf.service';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Patient PDF')
@Controller('patient')
export class PatientPdfController {
  constructor(private readonly patientPdfService: PatientPdfService) { }

  @Get(':id/visits')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get patient with visits list',
    description:
      'Retrieves patient basic information and a list of all visits. This is a lightweight endpoint for initial page load. Use this to display visit history, then call /visits/:visitId to get detailed data for a specific visit.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Patient ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Patient visits list retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPatientWithVisits(
    @Param('id', ParseIntPipe) patientId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.patientPdfService.getPatientWithVisits(
      patientId,
      Number(page),
      Number(limit),
    );
  }

  @Get('visits/:visitId')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get complete visit details',
    description:
      'Retrieves comprehensive details for a specific visit including all appointments, services (ANC, PNC, Immunisation, Delivery, OPD, etc.), vital assessments, diagnoses, prescriptions, and lab results. This endpoint loads all data needed for generating a visit report/PDF.',
  })
  @ApiParam({
    name: 'visitId',
    type: Number,
    description: 'Visit ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Visit details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getVisitDetails(
    @Param('visitId', ParseIntPipe) visitId: number,
  ) {
    return this.patientPdfService.getVisitDetails(visitId);
  }
}