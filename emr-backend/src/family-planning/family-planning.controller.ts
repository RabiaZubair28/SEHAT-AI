import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FamilyPlanningService } from './family-planning.service';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import {
  CreateFamilyPlanningDto,
  UpdateFamilyPlanningDto,
} from './dto/create-family-planning.dto';
import { FamilyPlanning } from './entities/family-planning.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('family-planning')
export class FamilyPlanningController {
  constructor(private readonly familyPlanningService: FamilyPlanningService) {}

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Add Family Planning Visit details',
    description:
      'Creates a new Family Planning visit record linked to the authenticated user.',
  })
  @ApiBody({
    type: CreateFamilyPlanningDto,
  })
  @ApiResponse({
    status: 201,
    type: FamilyPlanning,
  })
  createFamilyPlanning(
    @Body() createFamilyPlanningDto: CreateFamilyPlanningDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.familyPlanningService.create(createFamilyPlanningDto, user);
  }

  @Put(':appointment_service_id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Update Family Planning Visit details',
    description:
      'Updates an existing Family Planning visit record linked to the authenticated user.',
  })
  @ApiBody({
    type: UpdateFamilyPlanningDto,
  })
  @ApiResponse({
    status: 200,
    type: FamilyPlanning,
  })
  updateFamilyPlanning(
    @Param('appointment_service_id', ParseIntPipe) id: number,
    @Body() updateFamilyPlanningDto: UpdateFamilyPlanningDto,
    @Req() request: Request,
  ) {
    return this.familyPlanningService.update(
      id,
      updateFamilyPlanningDto,
      request,
    );
  }
}
