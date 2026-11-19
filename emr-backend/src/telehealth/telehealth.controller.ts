import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { TelehealthService } from './telehealth.service';
import { TelehealthQueueQueryDto } from './dto/telehealth-queue-query.dto';
import { CreateTelehealthRequestDto } from './dto/create-telehealth-request.dto';
import { TelehealthQueueDoctorDto } from './dto/telehealth-queue-doctor.dto';
import { TelehealthRequestListQueryDto } from './dto/telehealth-request-list-query.dto';
import { CompleteTelehealthRequestDto } from './dto/complete-telehealth-request.dto';
import { UpdateTelehealthRequestStatusDto } from './dto/update-telehealth-request-status.dto';

@ApiTags('Telehealth')
@ApiExtraModels(TelehealthQueueDoctorDto)
@Controller('telehealth')
export class TelehealthController {
  constructor(private readonly telehealthService: TelehealthService) { }

  @Get('queue')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get telehealth doctor queue',
    description:
      'Returns telehealth-enabled doctors with optional filtering by service type, specialty, and availability.',
  })
  @ApiResponse({
    status: 200,
    description: 'Telehealth doctor queue fetched successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Telehealth doctor queue fetched successfully.',
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(TelehealthQueueDoctorDto) },
        },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        count: { type: 'number', example: 42 },
        lastPage: { type: 'number', example: 5 },
      },
    },
  })
  getQueue(@Req() request: any, @Query() query: TelehealthQueueQueryDto) {
    return this.telehealthService.getQueue(
      Number(request.user?.sub),
      query,
    );
  }

  @Post('requests')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Create telehealth consultation request',
    description:
      'Creates a new telehealth consultation request from the logged-in primary doctor to a selected consultant.',
  })
  @ApiBody({ type: CreateTelehealthRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Telehealth consultation request created successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        status: { type: 'number', example: 201 },
        message: {
          type: 'string',
          example: 'Telehealth consultation request created successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 12 },
            patientId: { type: 'number', example: 24 },
            appointmentServiceId: { type: 'number', example: 101 },
            requestingDoctorId: { type: 'number', example: 5 },
            consultantDoctorId: { type: 'number', example: 17 },
            specialty: { type: 'string', example: 'Cardiology', nullable: true },
            reason: {
              type: 'string',
              example: 'ECG changes and chest pain need specialist input.',
            },
            status: { type: 'string', example: 'pending' },
            requestedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-25T06:30:00.000Z',
            },
          },
        },
      },
    },
  })
  createRequest(@Req() request: any, @Body() dto: CreateTelehealthRequestDto) {
    return this.telehealthService.createRequest(
      Number(request.user?.sub),
      dto,
    );
  }

  @Get('requests/incoming')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get incoming telehealth requests for consultant',
    description:
      'Returns incoming telehealth requests assigned to the logged-in consultant doctor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Incoming telehealth requests fetched successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Incoming telehealth requests fetched successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 15 },
              patientId: { type: 'number', example: 24 },
              patientName: { type: 'string', example: 'Ali Khan', nullable: true },
              appointmentServiceId: { type: 'number', example: 101, nullable: true },
              requestingDoctorId: { type: 'number', example: 5 },
              requestingDoctorName: {
                type: 'string',
                example: 'Dr. Sarah Ahmed',
                nullable: true,
              },
              consultantDoctorId: { type: 'number', example: 17 },
              consultantDoctorName: {
                type: 'string',
                example: 'Dr. Ahmed Khan',
                nullable: true,
              },
              specialty: { type: 'string', example: 'Cardiology', nullable: true },
              reason: {
                type: 'string',
                example: 'ECG changes and chest pain need specialist input.',
              },
              status: { type: 'string', example: 'pending' },
              requestedAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-03-25T06:30:00.000Z',
              },
              respondedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              acceptedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              rejectedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              cancelledAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              completedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              rejectedReason: { type: 'string', nullable: true },
              cancelReason: { type: 'string', nullable: true },
              session: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'number', example: 9 },
                  status: { type: 'string', example: 'active' },
                  provider: { type: 'string', example: 'zoom' },
                  meetingUrl: {
                    type: 'string',
                    example: 'https://zoom.us/j/123456789',
                    nullable: true,
                  },
                  startedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                  },
                  endedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  getIncomingRequests(
    @Req() request: any,
    @Query() query: TelehealthRequestListQueryDto,
  ) {
    return this.telehealthService.getIncomingRequests(
      Number(request.user?.sub),
      query,
    );
  }

  @Patch('requests/:id/accept')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Accept telehealth request',
    description:
      'Accepts a telehealth request for the given request ID and moves it to consultant acceptance flow.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Telehealth request ID' })
  @ApiResponse({
    status: 200,
    description: 'Telehealth request accepted successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Telehealth consultation request accepted successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 15 },
            patientId: { type: 'number', example: 24 },
            patientName: { type: 'string', example: 'Ali Khan', nullable: true },
            appointmentServiceId: { type: 'number', example: 101, nullable: true },
            requestingDoctorId: { type: 'number', example: 5 },
            requestingDoctorName: {
              type: 'string',
              example: 'Dr. Sarah Ahmed',
              nullable: true,
            },
            consultantDoctorId: { type: 'number', example: 17 },
            consultantDoctorName: {
              type: 'string',
              example: 'Dr. Ahmed Khan',
              nullable: true,
            },
            specialty: { type: 'string', example: 'Cardiology', nullable: true },
            reason: {
              type: 'string',
              example: 'ECG changes and chest pain need specialist input.',
            },
            status: { type: 'string', example: 'in_session' },
            requestedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-25T06:30:00.000Z',
            },
            respondedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            acceptedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            rejectedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            cancelledAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            rejectedReason: { type: 'string', nullable: true },
            cancelReason: { type: 'string', nullable: true },
            session: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'number', example: 9 },
                status: { type: 'string', example: 'active' },
                provider: { type: 'string', example: 'google_meet' },
                meetingUrl: {
                  type: 'string',
                  example: 'https://meet.google.com/abc-defg-hij',
                  nullable: true,
                },
                startedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                endedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
  })
  acceptRequest(@Req() request: any, @Param('id', ParseIntPipe) requestId: number) {
    return this.telehealthService.acceptRequest(Number(request.user?.sub), requestId);
  }

  @Patch('requests/:id/complete')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Complete telehealth request with consultation note',
    description:
      'Completes the telehealth request and records consultant notes for EMR visibility.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Telehealth request ID' })
  @ApiBody({ type: CompleteTelehealthRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Telehealth request completed successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Telehealth request completed successfully',
        },
        data: {
          type: 'object',
          properties: {
            request: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 15 },
                patientId: { type: 'number', example: 24 },
                patientName: { type: 'string', example: 'Ali Khan', nullable: true },
                appointmentServiceId: { type: 'number', example: 101, nullable: true },
                requestingDoctorId: { type: 'number', example: 5 },
                requestingDoctorName: {
                  type: 'string',
                  example: 'Dr. Sarah Ahmed',
                  nullable: true,
                },
                consultantDoctorId: { type: 'number', example: 17 },
                consultantDoctorName: {
                  type: 'string',
                  example: 'Dr. Ahmed Khan',
                  nullable: true,
                },
                specialty: { type: 'string', example: 'Cardiology', nullable: true },
                reason: {
                  type: 'string',
                  example: 'ECG changes and chest pain need specialist input.',
                },
                status: { type: 'string', example: 'completed' },
                requestedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-03-25T06:30:00.000Z',
                },
                respondedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                acceptedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                rejectedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                cancelledAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                completedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                rejectedReason: { type: 'string', nullable: true },
                cancelReason: { type: 'string', nullable: true },
                session: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id: { type: 'number', example: 9 },
                    status: { type: 'string', example: 'ended' },
                    provider: { type: 'string', example: 'google_meet' },
                    meetingUrl: {
                      type: 'string',
                      example: 'https://meet.google.com/abc-defg-hij',
                      nullable: true,
                    },
                    startedAt: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                    },
                    endedAt: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                    },
                  },
                },
              },
            },
            consultation_note: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'number', example: 31 },
                note: {
                  type: 'string',
                  example:
                    'Possible unstable angina; monitor troponin and repeat ECG.',
                },
                submittedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-03-25T07:10:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  })
  completeRequest(
    @Req() request: any,
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: CompleteTelehealthRequestDto,
  ) {
    return this.telehealthService.completeRequest(
      Number(request.user?.sub),
      requestId,
      dto,
    );
  }

  @Patch('requests/:id/cancel')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Cancel telehealth request',
    description:
      'Cancels a telehealth request for the given request ID with an optional cancellation reason. Only the requesting (primary) doctor can cancel.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Telehealth request ID' })
  @ApiBody({ type: UpdateTelehealthRequestStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Telehealth request cancelled successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Telehealth request cancelled successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 15 },
            patientId: { type: 'number', example: 24 },
            patientName: { type: 'string', example: 'Ali Khan', nullable: true },
            appointmentServiceId: { type: 'number', example: 101, nullable: true },
            requestingDoctorId: { type: 'number', example: 5 },
            requestingDoctorName: {
              type: 'string',
              example: 'Dr. Sarah Ahmed',
              nullable: true,
            },
            consultantDoctorId: { type: 'number', example: 17 },
            consultantDoctorName: {
              type: 'string',
              example: 'Dr. Ahmed Khan',
              nullable: true,
            },
            specialty: { type: 'string', example: 'Cardiology', nullable: true },
            reason: {
              type: 'string',
              example: 'ECG changes and chest pain need specialist input.',
            },
            status: { type: 'string', example: 'cancelled' },
            requestedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-25T06:30:00.000Z',
            },
            respondedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            acceptedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            rejectedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            cancelledAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            rejectedReason: { type: 'string', nullable: true },
            cancelReason: {
              type: 'string',
              example: 'Consultation no longer needed',
              nullable: true,
            },
            session: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'number', example: 9 },
                status: { type: 'string', example: 'ended' },
                provider: { type: 'string', example: 'google_meet' },
                meetingUrl: {
                  type: 'string',
                  example: 'https://meet.google.com/abc-defg-hij',
                  nullable: true,
                },
                startedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                endedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
  })
  cancelRequest(
    @Req() request: any,
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: UpdateTelehealthRequestStatusDto,
  ) {
    return this.telehealthService.cancelRequest(Number(request.user?.sub), requestId, dto);
  }

  @Patch('requests/:id/reject')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Reject telehealth request',
    description:
      'Rejects a telehealth request for the given request ID with an optional rejection reason. Only the assigned telehealth consultant can reject.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Telehealth request ID' })
  @ApiBody({ type: UpdateTelehealthRequestStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Telehealth request rejected successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Telehealth request rejected successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 15 },
            patientId: { type: 'number', example: 24 },
            patientName: { type: 'string', example: 'Ali Khan', nullable: true },
            appointmentServiceId: { type: 'number', example: 101, nullable: true },
            requestingDoctorId: { type: 'number', example: 5 },
            requestingDoctorName: {
              type: 'string',
              example: 'Dr. Sarah Ahmed',
              nullable: true,
            },
            consultantDoctorId: { type: 'number', example: 17 },
            consultantDoctorName: {
              type: 'string',
              example: 'Dr. Ahmed Khan',
              nullable: true,
            },
            specialty: { type: 'string', example: 'Cardiology', nullable: true },
            reason: {
              type: 'string',
              example: 'ECG changes and chest pain need specialist input.',
            },
            status: { type: 'string', example: 'rejected' },
            requestedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-25T06:30:00.000Z',
            },
            respondedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            acceptedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            rejectedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            cancelledAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            rejectedReason: {
              type: 'string',
              example: 'Currently in emergency OT, will pick next request.',
              nullable: true,
            },
            cancelReason: { type: 'string', nullable: true },
            session: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'number', example: 9 },
                status: { type: 'string', example: 'failed' },
                provider: { type: 'string', example: 'google_meet' },
                meetingUrl: {
                  type: 'string',
                  example: 'https://meet.google.com/abc-defg-hij',
                  nullable: true,
                },
                startedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                endedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
  })
  rejectRequest(
    @Req() request: any,
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: UpdateTelehealthRequestStatusDto,
  ) {
    return this.telehealthService.rejectRequest(Number(request.user?.sub), requestId, dto);
  }

  @Get('appointment-services/:appointmentServiceId/requests')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get telehealth request by appointment service ID',
    description:
      'Returns the telehealth request for a given appointment service, scoped to the logged-in primary doctor. Includes the consultation note if the request is completed.',
  })
  @ApiParam({ name: 'appointmentServiceId', type: Number, description: 'Appointment Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Telehealth request fetched successfully.',
  })
  getRequestByAppointmentService(
    @Req() request: any,
    @Param('appointmentServiceId', ParseIntPipe) appointmentServiceId: number,
  ) {
    return this.telehealthService.getRequestByAppointmentService(
      Number(request.user?.sub),
      appointmentServiceId,
    );
  }
}
