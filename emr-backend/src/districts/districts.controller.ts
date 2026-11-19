import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { DistrictsService } from './districts.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { District } from './entities/district.entity';
import { JwtOrClientAuthGuard } from 'src/auth/jwt-or-client-auth.guard';
import { ApiClientRequest } from 'src/auth/interfaces/api-client-request.interface';

@ApiTags('Districts')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  @UseGuards(JwtOrClientAuthGuard)
  @ApiOperation({
    summary: 'Get all districts',
    description: 'Retrieves a list of all available districts.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of districts.',
    type: [District],
  })
  findAll(@Req() request: ApiClientRequest) {
    return this.districtsService.findAll(Boolean(request.apiClient));
  }

  @Get('division/:division_id')
  @UseGuards(JwtOrClientAuthGuard)
  @ApiOperation({
    summary: 'Get all districts associated with division ID',
    description:
      'Retrieves all districts linked to a specific division using the division ID.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of districts.',
    type: [District],
  })
  findAllByDivision(
    @Req() request: ApiClientRequest,
    @Param('division_id', ParseIntPipe) divisionId: number,
  ) {
    return this.districtsService.findAllByDivision(
      divisionId,
      Boolean(request.apiClient),
    );
  }
}
