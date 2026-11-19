import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Res,
  UseGuards,
  Get,
  Req,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response, Request } from 'express';
import * as dotenv from 'dotenv';
import { JwtAdminAuthGuard } from './jwt-admin-auth.guard';
import { JwtOrAuthGuard } from './jwt-or-auth.guard';
import { successResponse } from 'src/common/utils/response.util';
import {
  ACCESS_TOKEN,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  ADMIN_ACCESS_TOKEN,
} from 'src/common/app.constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordWithTokenDto } from './dto/reset-password-with-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AllowPendingPasswordChange } from './password-change-required.util';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { ImpersonationExchangeDto } from './dto/impersonation.dto';
import { RoleName } from 'src/common/enums/enums';

dotenv.config();
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({
    summary: 'Login for regular users',
    description:
      'Authenticates a regular user and sets an access token in the cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login successful. Sets access token in cookie.',
    type: LoginResponseDto,
  })
  async login(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { access_token, user, services, attendance } =
      await this.authService.login(loginDto);

    res.cookie(ACCESS_TOKEN, access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
      path: '/',
    });
    res.clearCookie(ADMIN_ACCESS_TOKEN, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    return { user, services, attendance };
  }

  @Post('super-admin/login')
  @ApiOperation({
    summary: 'Login for super admin users',
    description:
      'Authenticates a super admin user and sets an admin access token in the cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Super admin login. Sets cookie.',
    type: LoginResponseDto,
  })
  async superAdminLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { access_token, user, services, attendance } = await this.authService.login(
      dto,
      true,
    );
    res.cookie(ADMIN_ACCESS_TOKEN, access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
      path: '/',
    });
    res.clearCookie(ACCESS_TOKEN, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    return { user, services, attendance };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Send forgot password reset link',
    description:
      'Accepts a user email and sends a one-time password reset link if the account exists.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description:
      'Always returns success to prevent email enumeration attacks.',
  })
  async forgotPassword(
    @Body(new ValidationPipe({ whitelist: true })) dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password using token',
    description:
      'Validates the reset token from email and updates the password. Token is single-use.',
  })
  @ApiBody({ type: ResetPasswordWithTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully.',
  })
  async resetPassword(
    @Body(new ValidationPipe({ whitelist: true }))
    dto: ResetPasswordWithTokenDto,
  ) {
    return this.authService.resetPasswordWithToken(dto);
  }

  @Post('change-password')
  @UseGuards(JwtOrAuthGuard)
  @AllowPendingPasswordChange()
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Changes the password of the logged-in user after verifying the current password. Clears the must-change-password flag set by a super admin reset.',
    tags: ['User', 'Admin'],
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect or new password is invalid.',
  })
  async changePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(currentUser, dto);
  }

  @Post('impersonation-links/:targetUserId')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Generate impersonation login link (Super Admin only)',
    description:
      'Creates a signed JWT impersonation link for a target user. Only SUPER_ADMIN can generate links.',
  })
  @ApiResponse({
    status: 201,
    description: 'Impersonation link generated successfully.',
  })
  async generateImpersonationLink(
    @Param('targetUserId') targetUserId: string,
    @Req() req: Request,
  ) {
    const currentUser = (req as Request & { user?: any }).user;
    if (currentUser.role !== RoleName.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can generate impersonation links',
      );
    }

    return this.authService.generateImpersonationLink(Number(targetUserId));
  }

  @Post('impersonation/exchange')
  @ApiOperation({
    summary: 'Exchange impersonation code for a session',
    description:
      'Validates an impersonation JWT and issues a normal auth session for the target user.',
  })
  @ApiBody({ type: ImpersonationExchangeDto })
  @ApiResponse({
    status: 201,
    description: 'Impersonation exchange successful.',
    type: LoginResponseDto,
  })
  async exchangeImpersonation(
    @Body(new ValidationPipe()) dto: ImpersonationExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { access_token, user, services, attendance } =
      await this.authService.exchangeImpersonationCode(dto.code);

    res.clearCookie(ACCESS_TOKEN, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    res.clearCookie(ADMIN_ACCESS_TOKEN, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    const isAdmin = [
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.FACILITY_INCHARGE,
      RoleName.HEAD_OFFICE,
    ].includes(user.role.name as RoleName);

    if (isAdmin) {
      res.cookie(ADMIN_ACCESS_TOKEN, access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
        path: '/',
      });
    } else {
      res.cookie(ACCESS_TOKEN, access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
        path: '/',
      });
    }

    return { user, services, attendance };
  }

  @Post('logout/:id')
  @UseGuards(JwtOrAuthGuard)
  @AllowPendingPasswordChange()
  @ApiOperation({
    summary: 'Logout user and clear token',
    description:
      'Logs out the user by ID and clears the authentication cookie.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({ status: 200, description: 'Logout successful.' })
  async logout(
    @Req() req: Request,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const currentUser = (req as Request & { user?: any }).user;
    return this.authService.logout(currentUser, id, res);
  }

  @Get('validate-token')
  @UseGuards(JwtOrAuthGuard)
  @AllowPendingPasswordChange()
  @ApiOperation({
    summary: 'Validate access token',
    description:
      'Checks the validity of the access token and returns user data if valid.',
    tags: ['User', 'Admin'],
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid and user data returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - token missing or invalid.',
  })
  validateToken(@Req() req: Request) {
    const user = (req as Request & { user?: any }).user;
    return successResponse(user, 'User is validated', 200);
  }

  @Post('admin/refresh')
  @ApiOperation({
    summary: 'Refresh admin access token',
    description: 'Generates a new access token from a valid refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access admin token refreshed successfully.',
  })
  async adminRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = req.cookies?.admin_access_token;
    const { access_token } = await this.authService.refresh(accessToken);

    res.cookie(ADMIN_ACCESS_TOKEN, access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
      path: '/',
    });

    return { access_token };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token from a valid refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = req.cookies?.access_token;
    const { access_token } = await this.authService.refresh(accessToken);

    res.cookie(ACCESS_TOKEN, access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
      path: '/',
    });

    return { access_token };
  }
}
