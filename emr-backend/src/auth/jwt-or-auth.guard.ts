import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAdminAuthGuard } from './jwt-admin-auth.guard';
import { JwtUserAuthGuard } from './jwt-user-auth.guard';
import { FacilityInchargeGuard } from './facility-incharge.guard';

@Injectable()
export class JwtOrAuthGuard implements CanActivate {
  constructor(
    private readonly adminGuard: JwtAdminAuthGuard,
    private readonly facilityInchargeGuard: FacilityInchargeGuard,
    private readonly userGuard: JwtUserAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let lastError: Error | null = null;

    // Try UserGuard first
    try {
      return await this.userGuard.canActivate(context);
    } catch (userError) {
      if (userError instanceof ForbiddenException) {
        throw userError;
      }
      lastError = userError;
    }

    // Try AdminGuard
    try {
      return await this.adminGuard.canActivate(context);
    } catch (adminError) {
      if (adminError instanceof ForbiddenException) {
        throw adminError;
      }
      lastError = adminError;
    }

    // Try FacilityInchargeGuard
    try {
      return await this.facilityInchargeGuard.canActivate(context);
    } catch (facilityError) {
      if (facilityError instanceof ForbiddenException) {
        throw facilityError;
      }
      lastError = facilityError;
    }

    // All guards failed - throw the last error
    throw lastError || new UnauthorizedException('Authentication failed');
  }
}
