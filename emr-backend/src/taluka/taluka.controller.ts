import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TalukaService } from './taluka.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Taluka } from './entities/taluka.entity';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Taluka')
@ApiBearerAuth()
@Controller('taluka')
export class TalukaController {
  constructor(private readonly talukaService: TalukaService) {}

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all Talukas',
    description: 'Retrieves a list of all available talukas.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({ status: 200, description: 'List of talukas.', type: [Taluka] })
  findAll() {
    return this.talukaService.findAll();
  }

  @Get('district/:district_id')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get Talukas by District ID',
    description: 'Retrieves talukas linked to a specific district.',
    tags: ['User', 'Admin'],
  })
  @ApiParam({ name: 'district_id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of talukas for given district.',
    type: [Taluka],
  })
  findAllByDistrict(@Param('district_id', ParseIntPipe) district_id: number) {
    return this.talukaService.findAllByDistrict(district_id);
  }
}
