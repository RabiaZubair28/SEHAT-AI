import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Routes')
@ApiBearerAuth()
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get all available routes',
    description:
      'Fetches a list of all protected application routes with metadata.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of all available routes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          method: { type: 'string', example: 'GET' },
          path: { type: 'string', example: '/users' },
          controller: { type: 'string', example: 'UsersController' },
          handler: { type: 'string', example: 'findAll' },
          guards: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAllRoutes() {
    return this.routesService.getRoutes();
  }
}
