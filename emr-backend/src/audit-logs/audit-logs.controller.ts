import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { JwtAdminAuthGuard } from "src/auth/jwt-admin-auth.guard";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLogsPaginationDto } from "./dto/audit-logs-pagination.dto";
import { AuditLogsResponseDto } from "./dto/audit-logs-response.dto";

@ApiTags('Audit Logs')
@Controller('super-admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get all audit logs with pagination and filtering',
    description: 'Retrieves a paginated list of all audit logs ordered by creation date. Can be filtered by user email and facility ID.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by user email',
  })
  @ApiQuery({
    name: 'facilityId',
    required: false,
    type: Number,
    description: 'Filter by facility ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              userId: { type: 'number', example: 1 },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  first_name: { type: 'string', example: 'John' },
                  last_name: { type: 'string', example: 'Doe' },
                  email: { type: 'string', example: 'admin@example.com' },
                }
              },
              facilityId: { type: 'number', nullable: true, example: 1 },
              facility: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Central Hospital' },
                  code: { type: 'string', example: 'CH001' },
                }
              },
              method: { type: 'string', example: 'GET' },
              route: { type: 'string', example: '/api/users' },
              body: { type: 'object', nullable: true, example: null },
              params: { type: 'object', nullable: true, example: null },
              query: { type: 'object', nullable: true, example: null },
              ip: { type: 'string', example: '127.0.0.1' },
              statusCode: { type: 'number', example: 200 },
              executionTimeMs: { type: 'number', example: 45 },
              createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
            }
          }
        },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        count: { type: 'number', example: 100 },
        lastPage: { type: 'number', example: 10 }
      }
    }
  })
  getAuditLogs(@Query() paginationDto: AuditLogsPaginationDto): Promise<AuditLogsResponseDto> {
    return this.auditLogsService.getAuditLogs(paginationDto);
  }
}