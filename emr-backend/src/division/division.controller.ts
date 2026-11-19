import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DivisionService } from './division.service';
import { Division } from './entities/division.entity';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Division')
@Controller('division')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all divisions',
    description: 'Retrieves a list of all divisions.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of all divisions.',
    type: [Division],
  })
  findAll() {
    return this.divisionService.findAll();
  }
}
