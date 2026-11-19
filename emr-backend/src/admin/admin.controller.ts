import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { UserSearchDto } from 'src/users/dto/search-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { AdminService } from './admin.service';
@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
  ) {}

  @Post('/users/create')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Create a new user (Admin)',
    description:
      'Creates a new user with full details. ALL ROLES ARE ALLOWED including SUPER_ADMIN.',
  })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: User,
  })
  @ApiBody({ type: CreateAdminDto })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get('/users/get')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a list of all users with optional filters.',
  })
  findAll(@Request() req: any, @Query() filters: UserSearchDto): Promise<void> {
    return this.usersService.findAll(req.user, filters);
  }

  @Put('users/:id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Update a user by ID',
    description: 'Updates user information based on the provided ID.',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User updated successfully' },
        data: { $ref: '#/components/schemas/User' },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Facility incharge already exists',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async edit(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(+id, updateUserDto);
  }

  @Post('users/:id/reset-password')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Reset password by user ID',
    description:
      'Super admin only. Sets a temporary password, ends the user\'s active session and forces a password change at next login. Intended for accounts without a reachable email, such as facility incharges.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AdminResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid password or attempt to reset own password',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is not a super admin, or target is a super admin',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  resetPassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.adminService.resetUserPassword(currentUser, id, dto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Soft Delete a user by ID',
    description: 'Soft deletes a user by marking them as inactive.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }
}
