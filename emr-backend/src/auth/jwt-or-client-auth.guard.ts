import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { ClientKeyAuthGuard } from './client-key-auth.guard';
import { JwtOrAuthGuard } from './jwt-or-auth.guard';
import { CLIENT_KEY_HEADER } from 'src/common/app.constants';

@Injectable()
export class JwtOrClientAuthGuard implements CanActivate {
  constructor(
    private readonly jwtOrAuthGuard: JwtOrAuthGuard,
    private readonly clientKeyAuthGuard: ClientKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawClientKey = request.headers?.[CLIENT_KEY_HEADER];
    const clientKeyValue = Array.isArray(rawClientKey)
      ? (rawClientKey[0] ?? '')
      : (rawClientKey ?? '');
    const hasClientKey = clientKeyValue.trim().length > 0;

    if (hasClientKey) {
      return this.clientKeyAuthGuard.canActivate(context);
    }

    return this.jwtOrAuthGuard.canActivate(context);
  }
}
