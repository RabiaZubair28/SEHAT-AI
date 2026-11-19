import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserPermissionsService } from './user-permissions.service';
import { CreateUserPermissionDto } from './dto/create-user-permission.dto';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UserPermission } from './entities/user-permission.entity';
import { DefaultPermissionResponseDto } from './dto/default-permission.response.dto';

@ApiTags('User Permissions')
@ApiBearerAuth()
@Controller('user-permissions')
export class UserPermissionsController {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Post()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Create a new user permission',
    description:
      'Allows an admin to assign a specific permission to a user by providing user ID and permission ID.',
  })
  @ApiBody({ type: CreateUserPermissionDto })
  @ApiResponse({
    status: 201,
    description: 'User permission created successfully.',
    type: UserPermission,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createUserPermissionDto: CreateUserPermissionDto) {
    return this.userPermissionsService.create(createUserPermissionDto);
  }

  @Get('defaults/:roleName')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get default permission payload for a role',
    description:
      'Returns the default permission payload that is automatically merged into a user permission of the given role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default permission route and method keys for the role',
    type: [DefaultPermissionResponseDto],
  })
  defaults(@Param('roleName') roleName: string) {
    return this.userPermissionsService.getDefaultsForRole(roleName);
  }

  @Get()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get all user permissions',
    description: 'Returns a list of all user permission records in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user permissions',
    type: [UserPermission],
  })
  findAll() {
    return this.userPermissionsService.findAll();
  }
}
