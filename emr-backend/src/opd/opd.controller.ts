import { Controller, Post, Body, Patch, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OpdService } from './opd.service';
import { CreateOpdDto } from './dto/create-opd.dto';
import { UpdateOpdDto } from './dto/update-opd.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Visit } from 'src/visit/entities/visit.entity';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';

@Controller('opd')
export class OpdController {
  constructor(private readonly opdService: OpdService) { }

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Submit the OPD Visit details',
    description:
      'Creates a new OPD visit record linked to the authenticated user.',
  })
  @ApiBody({
    type: CreateOpdDto,
  })
  @ApiResponse({
    status: 201,
    description: 'OPD visit created successfully',
    type: Visit,
  })
  @ApiOperation({ summary: 'Create OPD record' })
  async create(@Body() data: CreateOpdDto, @Req() request: Request) {
    return this.opdService.create(data, request);
  }

  @Patch('/:appointment_service_id')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Update existing OPD visit (within 2 weeks)',
    description: 'Updates OPD record except prescriptions',
  })
  @ApiResponse({
    status: 200,
    description: 'OPD visit updated successfully',
    type: AppointmentService,
  })
  async updateOpd(
    @Param('appointment_service_id', ParseIntPipe) appointmentServiceId: number,
    @Body() updateOpdDto: UpdateOpdDto,
    @Req() request: Request
  ): Promise<AppointmentService> {
    return this.opdService.update(appointmentServiceId, updateOpdDto, request);
  }
}
