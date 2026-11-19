import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
  BadRequestException,
  ParseEnumPipe,
} from '@nestjs/common';
import { UserServicesService } from './user-services.service';
import { CreateUserServiceDto } from './dto/create-user-service.dto';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './entities/user-service.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserServiceSearchDto } from './dto/search-user-service.dto';
import { Request } from 'express';
import { RoleName } from 'src/common/enums/enums';

@ApiTags('User Services')
@Controller('user-services')
@ApiBearerAuth()
export class UserServicesController {
  constructor(private readonly userServicesService: UserServicesService) {}

  @Get('services-by-role')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get allowed services by role',
    description:
      'Returns the list of services that can be assigned to a user for the provided role.',
  })
  @ApiQuery({
    name: 'role_name',
    enum: RoleName,
    required: true,
    description: 'Role name to filter allowed services for',
  })
  @ApiResponse({
    status: 200,
    description: 'Allowed services fetched successfully.',
  })
  getServicesByRole(
    @Query('role_name', new ParseEnumPipe(RoleName)) roleName: RoleName,
  ) {
    return this.userServicesService.getServicesByRole(roleName);
  }

  @Post()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Assign a service to a user',
    description: 'Creates a record that links a user with a service.',
  })
  @ApiBody({ type: CreateUserServiceDto })
  @ApiResponse({
    status: 201,
    description: 'User service created successfully.',
    type: UserService,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(
    @CurrentUser() user: any,
    @Body() createUserServiceDto: CreateUserServiceDto,
    @Query('facility_id') queryFacilityId?: number,
  ) {
    const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN];
    const facilityId = privilegedRoles.includes(user?.role)
      ? createUserServiceDto.facility_id || queryFacilityId || user?.facilityId
      : user?.facilityId;

    if (facilityId === undefined) {
      throw new BadRequestException(
        'Facility ID is required to assign services.',
      );
    }
    return this.userServicesService.create(
      facilityId,
      user.sub,
      createUserServiceDto,
    );
  }

  @Get()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'List all user services',
    description: 'Fetch all user-service assignments.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user services.',
    type: [UserService],
  })
  findAll(
    @CurrentUser() user: any,
    @Query() filters: UserServiceSearchDto,
    @Query('facility_id') facility_id: number,
    @Req() request: Request,
  ): Promise<void> {
    const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN];

    let facilityId: number | undefined;
    if (privilegedRoles.includes(user?.role)) {
      facilityId = facility_id;
    } else {
      facilityId = ((request as any).user as any)?.facilityId;
    }
    return this.userServicesService.findAll(facilityId, filters);
  }
}
