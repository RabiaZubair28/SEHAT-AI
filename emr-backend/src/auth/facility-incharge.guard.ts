import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ADMIN_ACCESS_TOKEN } from 'src/common/app.constants';
import { RoleName } from 'src/common/enums/enums';
import * as pathToRegexp from 'path-to-regexp';
import { Reflector } from '@nestjs/core';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { findCachedAuthGuardUser } from './auth-user-query.util';
import { assertPasswordChangeNotPending } from './password-change-required.util';

@Injectable()
export class FacilityInchargeGuard implements CanActivate {
  private readonly logger: Logger = new Logger(FacilityInchargeGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly reflector: Reflector,
    private readonly redisCacheService: RedisCacheService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.cookies[ADMIN_ACCESS_TOKEN];

    if (!token) {
      throw new UnauthorizedException('Token is missing or expired');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await findCachedAuthGuardUser(
        this.userRepository,
        this.redisCacheService,
        payload.sub,
        token,
      );

      if (!user || user.accessToken !== token) {
        throw new UnauthorizedException('Session expired or invalid.');
      }

      assertPasswordChangeNotPending(this.reflector, context, user);

      // Set user info in request for Admin, Super Admin and Head Office
      if (
        user.roleName === RoleName.SUPER_ADMIN ||
        user.roleName === RoleName.ADMIN ||
        user.roleName === RoleName.HEAD_OFFICE
      ) {
        request.user = {
          ...payload,
          role: user.roleName,
          facilityId: user.facilityId,
          facilityUcId: user.facilityUcId,
          districtId: user.districtId,
        };
        return true;
      }

      // Check if user is Facility Incharge
      if (user.roleName !== RoleName.FACILITY_INCHARGE) {
        throw new ForbiddenException(
          'Access denied. Only Facility Incharge can access this resource.',
        );
      }

      const flattenedPermissions = user.permissions;

      // Set user info in request
      request.user = {
        ...payload,
        role: user.roleName,
        facilityId: user.facilityId,
        facilityUcId: user.facilityUcId,
        districtId: user.districtId,
        permissions: flattenedPermissions,
      };

      // Check permissions
      const method = request.method.toUpperCase();
      const handler = context.getHandler();
      const controller = context.getClass();

      const routePath = this.reflector.get<string[]>('path', handler) || '';
      const controllerPath =
        this.reflector.get<string[]>('path', controller) || '';
      const requestUrl = `/${controllerPath}/${routePath}`.replace(/\/+/g, '/');

      const matchedPermission = flattenedPermissions.find((perm) => {
        if (perm.method !== method) return false;

        const matcher = pathToRegexp.pathToRegexp(perm.route);
        return matcher.regexp.test(requestUrl);
      });

      const fullUrl = matchedPermission?.route ?? requestUrl;

      if (!matchedPermission) {
        if (requestUrl.includes('/doctors/transfer/service/')) {
          throw new ForbiddenException({
            message: ApiResponseMessages.TRANSFER_PERMISSION_NOT_ASSIGN,
            error: 'Forbidden',
            statusCode: 403,
          });
        }

        throw new ForbiddenException(`Access denied to: ${method} ${fullUrl}`);
      }

      return true;
    } catch (err) {
      this.logger.error(`Facility Incharge validation failed: ${err.message}`);
      if (
        err instanceof ForbiddenException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
