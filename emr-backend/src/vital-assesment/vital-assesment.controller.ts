import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VitalAssesmentService } from './vital-assesment.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { CreateVitalAssesmentDto } from './dto/create-vital-assesment.dto';

@Controller('vital-assesment')
export class VitalAssesmentController {
  constructor(private readonly vitalAssesmentService: VitalAssesmentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create vitals for the appointment',
    description:
      'Only the assigned doctor can create vitals for a given appointment.',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient vitals created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or not assigned to the appointment',
  })
  @UseGuards(JwtUserAuthGuard)
  create(@Req() request: Request, @Body() body: CreateVitalAssesmentDto) {
    return this.vitalAssesmentService.create(
      request,
      body,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get details for the visit vitals',
    description: 'Get the relevant details for the visit vitals',
  })
  @ApiResponse({
    status: 200,
    description: 'Visit details fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit details not found',
  })
  @UseGuards(JwtUserAuthGuard)
  get(@Query('visitId') visitId: number) {
    return this.vitalAssesmentService.get(visitId);
  }
}
