import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { AkuhGuidelinesService } from './akuh-guidelines.service';
import { successResponse } from 'src/common/utils/response.util';

@ApiTags('AKUH Guidelines')
@Controller('akuh-guidelines')
export class AkuhGuidelinesController {
  constructor(private readonly akuhGuidelinesService: AkuhGuidelinesService) {}

  @Get()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get all AKUH guidelines',
    description:
      'Returns a list of all available guidelines with their IDs and titles from the AKU API.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of guidelines returned successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch guidelines from AKU API',
  })
  async getAllGuidelines() {
    const data = await this.akuhGuidelinesService.getAllGuidelines();
    return successResponse(data, 'Guidelines fetched successfully');
  }

  @Get(':id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get AKUH guideline content by ID',
    description:
      'Returns the full HTML content of a specific guideline using its ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description:
      'ID of the guideline obtained from the get all guidelines endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Guideline content returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Guideline not found',
  })
  async getGuidelineContent(@Param('id', ParseIntPipe) id: number) {
    const data = await this.akuhGuidelinesService.getGuidelineContent(id);
    return successResponse(data, 'Guideline content fetched successfully');
  }
}
