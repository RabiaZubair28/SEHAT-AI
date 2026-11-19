import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateEmergencyDto } from './dto/create-emergency.dto';

import { EmergencyPatient } from './entities/emergency-patient.entity';
import { PaginationDto } from 'src/common/utils/pagination.dto';

import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Emergency')
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Create new emergency patient record',
    description:
      'Creates a new emergency patient with vitals and outcome. Doctor will be current user if not specified.',
  })
  @ApiBody({ type: CreateEmergencyDto })
  @ApiResponse({
    status: 201,
    description: 'Emergency patient created successfully',
    type: EmergencyPatient,
  })
  create(@Req() request: Request, @Body() createDto: CreateEmergencyDto) {
    return this.emergencyService.create(createDto, request);
  }

  // ✅ NEW: Get emergency patients by doctor ID
  @Get('doctor/:doctorId')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get emergency patients by doctor ID',
    description: 'Retrieves all emergency patients for a specific doctor',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Emergency patients fetched successfully',
    type: [EmergencyPatient],
  })
  findByDoctorId(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query() filters: PaginationDto,
  ) {
    return this.emergencyService.findByDoctorId(doctorId, filters);
  }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all emergency patients',
    description: 'Retrieves all emergency patient records with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Emergency patients fetched successfully',
    type: [EmergencyPatient],
  })
  findAll(@Query() filters: PaginationDto) {
    return this.emergencyService.findAll(filters);
  }
}
