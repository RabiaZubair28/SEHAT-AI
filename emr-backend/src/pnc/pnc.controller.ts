import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Param,
} from '@nestjs/common';
import { PncService } from './pnc.service';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { UpdatePncDto } from './dto/update-pnc.dto';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { CreatePncDto } from './dto/create-pnc.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PncMutateResponseDto } from './dto/pnc-mutate-response.dto';

@Controller('pnc')
export class PncController {
  constructor(private readonly pncService: PncService) {}

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Submit the PNC Visit details',
    description:
      'Creates a new PNC visit record linked to the authenticated user.',
  })
  @ApiBody({
    type: CreatePncDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Pnc visit created successfully',
    type: PncMutateResponseDto,
  })
  createPnc(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPncDto: CreatePncDto,
  ) {
    return this.pncService.create(createPncDto, user);
  }

  @Patch(':appointment_service_id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Update an existing PNC Visit',
    description: 'Updates the details of an existing PNC visit record.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pnc visit updated successfully',
    type: PncMutateResponseDto,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointment_service_id') id: string,
    @Body() updatePncDto: UpdatePncDto,
  ) {
    return this.pncService.update(+id, updatePncDto, user);
  }
}
