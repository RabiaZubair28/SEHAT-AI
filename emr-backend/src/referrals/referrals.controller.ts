import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReferralsService } from './referrals.service';
import { CreateInternalReferralDto } from './dto/create-internal-referral.dto';
import { CreateExternalReferralDto } from './dto/create-external-referral.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';
import { Referral } from './entities/referral.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { CreateUnassignedPatientDto } from './dto/create-unassigned-patient.dto';
import { RoleName } from 'src/common/enums/enums';
import { CreateSelfReferralDto } from './dto/create-self-referral.dto';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly serviceUtility: ServiceUtility,
  ) { }

  @Get('/getServiceByRoles')
  @ApiOperation({
    summary: 'Get Services by Role ID',
    description:
      'Fetches a list of available services based on the roles assigned to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of services corresponding to user roles',
  })
  @UseGuards(JwtOrAuthGuard)
  getServiceByRoles() {
    return this.referralsService.getServiceByRoles();
  }

  @Post('/in')
  @ApiOperation({
    summary: 'Refer A Patient Inside the Facility',
    description:
      'Creates an internal referral for a patient to another department or service within the same facility.',
  })
  @ApiBody({ type: CreateInternalReferralDto })
  @ApiResponse({
    status: 201,
    description: 'Internal referral created successfully',
  })
  @UseGuards(JwtOrAuthGuard)
  referIn(
    @Req() req: any,
    @Body() createInternalReferralDto: CreateInternalReferralDto,
  ) {
    return this.referralsService.referIn(
      req.user,
      req.user.sub,
      createInternalReferralDto,
    );
  }

  @Post('/unassign')
  @ApiOperation({
    summary: 'Unassign a patient (no doctor, no service)',
    description:
      'Saves the patient into the unassigned_patients table without assigning any doctor or service.',
  })
  @ApiBody({ type: CreateUnassignedPatientDto })
  @ApiResponse({
    status: 201,
    description: 'Patient saved to unassigned list successfully',
  })
  @ApiQuery({ name: 'facility_id', required: false })
  @UseGuards(JwtOrAuthGuard)
  unassignPatient(
    @Req() req: any,
    @Body() createUnassignedPatientDto: CreateUnassignedPatientDto,
    @Query('facility_id') facility_id?: number,
  ) {
    const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN];
    const role = req.user?.role;
    if (privilegedRoles.includes(role) && !facility_id) {
      throw new BadRequestException('facility_id is required for admin users');
    }
    const resolvedFacilityId = privilegedRoles.includes(role)
      ? facility_id
      : req.user?.facilityId;

    return this.referralsService.unassignPatient(
      { ...req.user, facilityId: resolvedFacilityId },
      createUnassignedPatientDto,
    );
  }

  @Get('/unassigned')
  @ApiOperation({
    summary: 'Get all unassigned patients',
    description:
      'Returns a paginated list of all patients in the unassigned queue.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'facility_id', required: false })
  @ApiResponse({
    status: 200,
    description: 'Unassigned patients fetched successfully',
  })
  @UseGuards(JwtOrAuthGuard)
  getAllUnassignedPatients(
    @Req() req: any,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('facility_id') facility_id?: number,
  ) {
    const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN];
    const role = req.user?.role;
    if (privilegedRoles.includes(role) && !facility_id) {
      throw new BadRequestException('facility_id is required for admin users');
    }
    const resolvedFacilityId = privilegedRoles.includes(role)
      ? facility_id
      : req.user?.facilityId;

    return this.referralsService.getAllUnassignedPatients(
      { ...req.user, facilityId: resolvedFacilityId },
      page,
      limit,
      resolvedFacilityId,
    );
  }

  @Get('/availability/:patientId')
  @ApiOperation({
    summary: 'Get eligible services for a patient',
    description:
      'Returns the list of services (id + name) that the patient is eligible to receive based on manual rules (gender/age).',
  })
  @ApiParam({ name: 'patientId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Eligible services returned successfully',
  })
  @UseGuards(JwtOrAuthGuard)
  getServiceAvailability(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.serviceUtility.checkServiceAvailability(patientId);
  }

  @Post('/out')
  @ApiOperation({
    summary: 'Refer A Patient Outside the Facility',
    description:
      'Creates an external referral for a patient to be referred to a different facility or external provider.',
  })
  @ApiBody({ type: CreateExternalReferralDto })
  @ApiResponse({
    status: 201,
    description: 'External referral created successfully',
  })
  @UseGuards(JwtOrAuthGuard)
  referOut(
    @Req() req: any,
    @Body() createExternalReferralDto: CreateExternalReferralDto,
  ) {
    return this.referralsService.referOut(
      req.user.sub,
      createExternalReferralDto,
    );
  }

  @Patch('/dispatch/:appointmentId')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Dispatch a patient visit',
    description:
      'Marks the most recent visit for the specified patient as dispatched.',
  })
  @ApiResponse({
    status: 201,
    type: Referral,
  })
  dispatchPatient(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
    @Req() request: Request,
  ): Promise<Referral> {
    return this.referralsService.dispatch(appointmentId, request);
  }

  @Post('/self-referral')
  @ApiOperation({
    summary: 'Refer A Patient To Yourself',
    description:
      'Creates an internal referral assigned to the authenticated doctor, bypassing automatic doctor assignment.',
  })
  @ApiBody({ type: CreateSelfReferralDto })
  @ApiResponse({
    status: 201,
    description: 'Internal referral created successfully',
  })
  @UseGuards(JwtOrAuthGuard)
  selfRefer(
    @Req() req: any,
    @Body() createSelfReferralDto: CreateSelfReferralDto,
  ) {
    return this.referralsService.referIn(
      req.user,
      req.user.sub,
      createSelfReferralDto,
      { selfReferral: true },
    );
  }
}
