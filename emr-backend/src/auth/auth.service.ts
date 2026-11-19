import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from 'src/common/utils/response.util';
import { RoutesService } from 'src/routes/routes.service';
import { Service } from 'src/services/entities/service.entity';
import { JwtService } from '@nestjs/jwt';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { ACCESS_TOKEN, ADMIN_ACCESS_TOKEN, PASSWORD_SALT_ROUNDS } from 'src/common/app.constants';
import { RoleName, UserStatus } from 'src/common/enums/enums';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordWithTokenDto } from './dto/reset-password-with-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { LoginAttendanceDto } from './dto/login.dto';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { buildAuthGuardUserCachePrefix } from './auth-user-query.util';
import type { StringValue } from 'ms';

interface PasswordResetTokenPayload {
  sub: number;
  type: 'password_reset';
  pwh: string;
}

interface AuthenticatedUserContext {
  sub?: number | string;
  role?: string;
}

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly routesService: RoutesService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly redisCacheService: RedisCacheService,
  ) { }

  async login(dto: LoginDto, isSuperAdmin = false) {
    const user = await this.usersService.findByEmail(dto.email);

    const userRole = [
      RoleName.REGISTRATION_CLERK,
      RoleName.VACCINATOR,
      RoleName.DISPENSER,
      RoleName.MEDICAL_OFFICER_MALE,
      RoleName.MEDICAL_OFFICER_FEMALE,
      RoleName.SBA,
      RoleName.PAEDS,
      RoleName.TELEHEALTH_CONSULTANT,
    ];

    const isValid = user && (await bcrypt.compare(dto.password, user.password));
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      isSuperAdmin &&
      ![
        RoleName.SUPER_ADMIN,
        RoleName.ADMIN,
        RoleName.FACILITY_INCHARGE,
        RoleName.HEAD_OFFICE,
      ].includes(user.role.name)
    ) {
      throw new UnauthorizedException('Not a super admin or admin');
    }

    if (!isSuperAdmin && !userRole.includes(user.role.name)) {
      throw new UnauthorizedException('Invalid user');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException('User is not approved yet');
    }

    if (dto.isMobile && (dto.latitude == null || dto.longitude == null)) {
      throw new BadRequestException(
        'latitude and longitude are required when logging in on mobile',
      );
    }

    if (isSuperAdmin && user.role.name === RoleName.SUPER_ADMIN) {
      user.userPermissions.permission.payload = this.routesService.getRoutes();
    }

    const services = await this.servicesRepository.find();
    const payload = { sub: user.id, role: user.role.name };

    // ✅ Fixed TypeScript type issue here
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN as any,
      secret: process.env.JWT_SECRET,
    });

    user.access_token = token;

    if (dto.latitude != null && dto.longitude != null) {
      user.latitude = dto.latitude;
      user.longitude = dto.longitude;
    }

    await this.userRepository.save(user);
    await this.invalidateAuthGuardUserCache(user.id);

    const attendance = await this.getLatestAttendance(user.id);

    this.hideUserData(user);

    return { access_token: token, user, services, attendance };
  }

  // Hide all the details which are sensitive
  private hideUserData(user: User) {
    user.password = '';
  }

  private async getLatestAttendance(
    userId: number,
  ): Promise<LoginAttendanceDto | null> {
    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.id', 'id')
      .addSelect('attendance.userId', 'userId')
      .addSelect('attendance.facilityId', 'facilityId')
      .addSelect('attendance.status', 'status')
      .addSelect('attendance.checkInTime', 'checkInTime')
      .addSelect('attendance.checkOutTime', 'checkOutTime')
      .addSelect('attendance.latitude', 'latitude')
      .addSelect('attendance.longitude', 'longitude')
      .where('attendance.userId = :userId', { userId })
      .orderBy('attendance.checkInTime', 'DESC')
      .addOrderBy('attendance.id', 'DESC')
      .getRawOne<LoginAttendanceDto>();

    return attendance ?? null;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();

      const user = await this.usersService.findByEmail(normalizedEmail);
      if (!user) {
        throw new NotFoundException(ApiResponseMessages.EMAIL_DOES_NOT_EXIST);
      }

      const tokenPayload: PasswordResetTokenPayload = {
        sub: user.id,
        type: 'password_reset',
        pwh: await bcrypt.hash(user.password, PASSWORD_SALT_ROUNDS),
      };

      const expiresIn = this.getPasswordResetExpiresIn();
      const resetToken = await this.jwtService.signAsync(tokenPayload, {
        secret: this.getPasswordResetSecret(),
        expiresIn: expiresIn as any,
      });

      const resetLink = this.buildPasswordResetLink(resetToken);
      const emailSent = await this.mailService.sendForgotPasswordEmail({
        to: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        resetLink,
        expiresIn,
      });

      if (!emailSent) {
        throw new InternalServerErrorException(
          ApiResponseMessages.FORGOT_PASSWORD_EMAIL_FAILED,
        );
      }

      return successResponse(
        [],
        ApiSuccessResponseMessages.EMAIL_SENT_SUCCESSFULLY,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.FORGOT_PASSWORD_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FORGOT_PASSWORD_FAILED,
      );
    }
  }

  async resetPasswordWithToken(dto: ResetPasswordWithTokenDto) {
    try {
      let payload: PasswordResetTokenPayload;
      try {
        payload = await this.jwtService.verifyAsync<PasswordResetTokenPayload>(
          dto.token,
          {
            secret: this.getPasswordResetSecret(),
          },
        );
      } catch {
        throw new UnauthorizedException(
          ApiResponseMessages.INVALID_OR_EXPIRED_RESET_TOKEN,
        );
      }

      if (payload.type !== 'password_reset' || !payload.sub || !payload.pwh) {
        throw new UnauthorizedException(
          ApiResponseMessages.INVALID_OR_EXPIRED_RESET_TOKEN,
        );
      }

      const user = await this.userRepository
        .createQueryBuilder('user')
        .setFindOptions({ where: { id: payload.sub } })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        throw new UnauthorizedException(
          ApiResponseMessages.INVALID_OR_EXPIRED_RESET_TOKEN,
        );
      }

      const isCurrentPasswordMatch = await bcrypt.compare(
        user.password,
        payload.pwh,
      );
      if (!isCurrentPasswordMatch) {
        throw new UnauthorizedException(
          ApiResponseMessages.RESET_LINK_ALREADY_USED_OR_INVALID,
        );
      }

      user.password = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
      user.access_token = null;
      // The user chose their own password, so an earlier admin reset no longer applies.
      user.must_change_password = false;
      await this.userRepository.save(user);
      await this.invalidateAuthGuardUserCache(user.id);

      return successResponse(
        [],
        ApiSuccessResponseMessages.PASSWORD_RESET_SUCCESSFULLY,
        200,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.RESET_PASSWORD_WITH_TOKEN_FAILED,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.RESET_PASSWORD_WITH_TOKEN_FAILED,
      );
    }
  }

  async changePassword(currentUser: AuthenticatedUser, dto: ChangePasswordDto) {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .setFindOptions({ where: { id: currentUser.sub } })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        throw new UnauthorizedException('Session expired or invalid.');
      }

      // After a super admin reset the user has just logged in with the temporary
      // password, so it is not asked for again.
      if (!user.must_change_password) {
        if (!dto.current_password) {
          throw new BadRequestException(
            ApiResponseMessages.CURRENT_PASSWORD_REQUIRED,
          );
        }

        const isCurrentPasswordValid = await bcrypt.compare(
          dto.current_password,
          user.password,
        );
        if (!isCurrentPasswordValid) {
          // 400 rather than 401 so the frontend does not treat it as an expired session.
          throw new BadRequestException(
            ApiResponseMessages.CURRENT_PASSWORD_INCORRECT,
          );
        }
      }

      const isSameAsCurrent = await bcrypt.compare(
        dto.new_password,
        user.password,
      );
      if (isSameAsCurrent) {
        throw new BadRequestException(
          ApiResponseMessages.NEW_PASSWORD_SAME_AS_CURRENT,
        );
      }

      await this.userRepository.update(user.id, {
        password: await bcrypt.hash(dto.new_password, PASSWORD_SALT_ROUNDS),
        must_change_password: false,
      });
      // The current session stays valid; only the cached guard snapshot, which
      // carries the must-change-password flag, has to be dropped.
      await this.invalidateAuthGuardUserCache(user.id);

      return successResponse(
        { must_change_password: false },
        ApiSuccessResponseMessages.PASSWORD_CHANGED_SUCCESSFULLY,
        200,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.CHANGE_PASSWORD_FAILED,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.CHANGE_PASSWORD_FAILED,
      );
    }
  }

  private getPasswordResetSecret(): string {
    const secret =
      this.configService.get<string>('JWT_RESET_SECRET') ??
      this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new ServiceUnavailableException(
        ApiResponseMessages.PASSWORD_RESET_SERVICE_NOT_CONFIGURED,
      );
    }

    return secret;
  }

  private getPasswordResetExpiresIn(): string {
    return this.configService.get<string>('RESET_PASSWORD_TOKEN_EXPIRES_IN') ??
      '15m';
  }

  private buildPasswordResetLink(token: string): string {
    const resetPath = `${this.configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173'}/reset-password`;
    const separator = resetPath.includes('?') ? '&' : '?';
    return `${resetPath}${separator}token=${encodeURIComponent(token)}`;
  }

  async generateImpersonationLink(targetUserId: number) {
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      throw new BadRequestException('Invalid target user ID');
    }

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    if (user.role.name === RoleName.SUPER_ADMIN) {
      throw new BadRequestException('Cannot generate impersonation link for a super admin');
    }

    const impersonationSecret = this.configService.get<string>('IMPERSONATION_SECRET');
    if (!impersonationSecret) {
      throw new ServiceUnavailableException('IMPERSONATION_SECRET is not configured');
    }

    const impersonationExpiry = this.configService.get<string>('IMPERSONATION_SECRET_EXPIRES_IN') as StringValue;
    if (!impersonationExpiry) {
      throw new ServiceUnavailableException('IMPERSONATION_EXPIRES_IN is not configured');
    }

    const code = await this.jwtService.signAsync(
      { type: 'impersonation', targetUserId },
      { secret: impersonationSecret, expiresIn: impersonationExpiry },
    );

    const frontendOrigin = this.configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
    const url = `${frontendOrigin}/impersonate?code=${encodeURIComponent(code)}`;

    return { url, token: code };
  }

  async exchangeImpersonationCode(code: string) {
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      throw new UnauthorizedException('Invalid impersonation code');
    }

    const impersonationSecret = this.configService.get<string>('IMPERSONATION_SECRET');
    if (!impersonationSecret) {
      throw new ServiceUnavailableException('IMPERSONATION_SECRET is not configured');
    }

    let payload: { type: string; targetUserId: number };
    try {
      payload = await this.jwtService.verifyAsync(code, {
        secret: impersonationSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired impersonation code');
    }

    if (payload.type !== 'impersonation' || !payload.targetUserId) {
      throw new UnauthorizedException('Invalid impersonation code');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.targetUserId },
      relations: [
        'role',
        'facility',
        'facility.district',
        'facility.district.division',
        'facility.uc',
        'facility.uc.taluka',
        'userPermissions.permission',
        'services',
        'personalInfo',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Target user no longer exists');
    }

    // Re-check the target's role at exchange time. A user promoted to
    // SUPER_ADMIN after link generation must not be impersonable.
    if (user.role.name === RoleName.SUPER_ADMIN) {
      throw new BadRequestException('Cannot impersonate a super admin');
    }

    const services = await this.servicesRepository.find();
    const authPayload = { sub: user.id, role: user.role.name };

    const token = await this.jwtService.signAsync(authPayload, {
      expiresIn: process.env.JWT_EXPIRES_IN as any,
      secret: process.env.JWT_SECRET,
    });

    user.access_token = token;
    await this.userRepository.save(user);

    const attendance = await this.getLatestAttendance(user.id);

    this.hideUserData(user);

    return { access_token: token, user, services, attendance };
  }

  async logout(
    currentUser: AuthenticatedUserContext | undefined,
    userId: string,
    res: Response,
  ) {
    const targetUserId = Number(userId);
    const actorUserId = Number(currentUser?.sub);
    const actorRole = currentUser?.role;

    if (!Number.isInteger(targetUserId)) {
      throw new UnauthorizedException('Invalid user id');
    }

    if (!Number.isInteger(actorUserId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    if (actorUserId !== targetUserId) {
      throw new ForbiddenException('You can only logout your own account');
    }

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    await this.clearUserToken(targetUserId);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    };

    if (
      [
        RoleName.SUPER_ADMIN,
        RoleName.ADMIN,
        RoleName.FACILITY_INCHARGE,
        RoleName.HEAD_OFFICE,
      ].includes(actorRole as RoleName)
    ) {
      res.clearCookie(ADMIN_ACCESS_TOKEN, cookieOptions);
    } else {
      res.clearCookie(ACCESS_TOKEN, cookieOptions);
    }
    return { message: 'Logged out successful' };
  }

  async clearUserToken(userId: number) {
    await this.userRepository.update(userId, { access_token: null });
    await this.invalidateAuthGuardUserCache(userId);
  }

  async refresh(accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: true,
      });
      const user = await this.userRepository
        .createQueryBuilder('user')
        .setFindOptions({ where: { id: payload.sub }, relations: ['role'] })
        .addSelect('user.access_token')
        .getOne();

      if (!user || user.access_token !== accessToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user.role?.name) {
        throw new UnauthorizedException('Invalid user role');
      }

      const newAccessToken = await this.jwtService.signAsync(
        { sub: user.id, role: user.role.name },
        {
          expiresIn: process.env.JWT_EXPIRES_IN as any,
          secret: process.env.JWT_SECRET,
        },
      );

      user.access_token = newAccessToken;
      await this.userRepository.save(user);
      await this.invalidateAuthGuardUserCache(user.id);
      return { access_token: newAccessToken };
    } catch (err) {
      this.logger.error(`Refresh token error: ${err.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async invalidateAuthGuardUserCache(userId: number): Promise<void> {
    await this.redisCacheService.deleteByPrefix(
      buildAuthGuardUserCachePrefix(userId),
    );
  }
}
