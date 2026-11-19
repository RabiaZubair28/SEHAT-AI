import {
  Injectable,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as pathToRegexp from 'path-to-regexp';
import { ADMIN_ACCESS_TOKEN } from 'src/common/app.constants';
import { RoleName } from 'src/common/enums/enums';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { findCachedAuthGuardUser } from './auth-user-query.util';
import { assertPasswordChangeNotPending } from './password-change-required.util';

@Injectable()
export class JwtAdminAuthGuard implements CanActivate {
  private readonly logger: Logger = new Logger(JwtAdminAuthGuard.name);

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

      const flattenedPermissions = user.permissions;
      request.user = {
        ...payload,
        permissions: flattenedPermissions,
        role: user.roleName,
        facilityId: user.facilityId,
        facilityUcId: user.facilityUcId,
        districtId: user.districtId,
      };

      assertPasswordChangeNotPending(this.reflector, context, user);

      if (user.roleName === RoleName.SUPER_ADMIN) {
        return true;
      }

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
        throw new ForbiddenException(`Access denied to: ${method} ${fullUrl}`);
      }
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }

      this.logger.error(`JWT verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
