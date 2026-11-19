import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UcService } from './uc.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UcSearchDto } from './dto/search-uc.dto';
import { UC } from './entities/uc.entity';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('UC')
@ApiBearerAuth()
@Controller('uc')
export class UcController {
  constructor(private readonly ucService: UcService) { }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all UCs with filters',
    description: 'Retrieves all UCs with optional filters.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({ status: 200, description: 'List of UCs.', type: [UC] })
  findAll(@Query() filters: UcSearchDto): Promise<void> {
    return this.ucService.findAll(filters);
  }

  @Get('/:taluka_id')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get UCs by Taluka ID',
    description: 'Returns a list of UCs filtered by the provided Taluka ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of UCs returned successfully.',
    type: [UC],
  })
  @ApiResponse({
    status: 404,
    description: 'No UCs found for the given Taluka ID.',
  })
  async getByTalukaId(
    @Param('taluka_id', ParseIntPipe) talukaId: number,
  ): Promise<UC[]> {
    return this.ucService.getAllByTalukaId(talukaId);
  }
}
