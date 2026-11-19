import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from './entities/role.entity';
import { ResponseRoleDto } from './dto/response-role.dto';
import { RoleName } from 'src/common/enums/enums';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  private readonly logger: Logger = new Logger(RolesController.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Create a new role',
    description:
      'Creates a new role with a name and optional description. Only accessible by authenticated admins.',
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: Role,
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all roles',
    description:
      'Fetches a list of all available roles in the system. Publicly accessible.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles',
    type: [ResponseRoleDto],
  })
  async findAll(@Request() req): Promise<ResponseRoleDto[]> {
    let userRole = null;
    let token = null;

    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      token = req.cookies?.access_token || req.cookies?.admin_access_token;
    }

    if (token) {
      try {
        const decoded = this.jwtService.verify(token);

        userRole = decoded.role;
      } catch (error) {
        this.logger.error('jwt decode failed: ', error.stack);
      }
    }

    let roles;
    if (userRole) {
      roles = await this.rolesService.findAllByUserRole(userRole);
    } else {
      roles = await this.rolesService.findAll();
    }

    return roles.map((role) => ({
      ...role,
      guards: this.getGuards(role.name),
    }));
  }

  @Get(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get a role by ID',
    description:
      'Fetches a single role by its ID. Requires admin authentication.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Role found', type: Role })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Update a role by ID',
    description:
      'Updates role information based on the given ID. Admin access required.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated', type: Role })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Delete a role by ID',
    description:
      'Deletes a role from the system using the provided ID. Only admins can perform this action.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }

  private getGuards(roleName: RoleName): string[] {
    const allowedAdminRoles = [
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.FACILITY_INCHARGE,
      RoleName.HEAD_OFFICE,
    ];

    if (allowedAdminRoles.includes(roleName)) {
      return ['JwtAdminAuthGuard', 'JwtOrAuthGuard'];
    }

    return ['JwtUserAuthGuard', 'JwtOrAuthGuard'];
  }
}
