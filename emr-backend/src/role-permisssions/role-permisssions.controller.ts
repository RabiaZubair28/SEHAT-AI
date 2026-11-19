import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { RolePermisssionsService } from './role-permisssions.service';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { RolePermission } from './entities/role-permisssion.entity';

@ApiTags('Role Permissions')
@ApiBearerAuth()
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionService: RolePermisssionsService,
  ) {}

  @Post()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Create a Role-Permission',
    description: 'Assigns a specific permission to a role.',
  })
  @ApiBody({ type: CreateRolePermissionDto })
  @ApiCreatedResponse({
    description: 'Role permission created successfully.',
    type: RolePermission,
  })
  @ApiResponse({ status: 400, description: 'Invalid data.' })
  create(@Body() createDto: CreateRolePermissionDto) {
    return this.rolePermissionService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get all Role-Permissions',
    description: 'Retrieves all role-permission mappings in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all role-permission mappings.',
    type: [RolePermission],
  })
  findAll() {
    return this.rolePermissionService.findAll();
  }

  @Get(':roleId')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get a Role-Permission by ID',
    description: 'Retrieves the role-permission mapping with the specified ID.',
  })
  @ApiParam({
    name: 'roleId',
    type: Number,
    description: 'roleId of the role-permission mapping to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Role-permission mapping found.',
    type: RolePermission,
  })
  @ApiNotFoundResponse({ description: 'Role-permission mapping not found.' })
  findOne(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolePermissionService.findOne(roleId);
  }

  @Delete(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Delete a Role-Permission',
    description: 'Deletes the role-permission mapping with the specified ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the role-permission mapping to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Role-permission deleted successfully.',
  })
  @ApiNotFoundResponse({ description: 'Role-permission mapping not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolePermissionService.remove(id);
  }
}
