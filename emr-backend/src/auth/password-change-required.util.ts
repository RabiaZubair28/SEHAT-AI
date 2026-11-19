import {
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { AuthGuardUser } from './auth-user-query.util';

export const PASSWORD_CHANGE_REQUIRED_CODE = 'PASSWORD_CHANGE_REQUIRED';
export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = 'allowPendingPasswordChange';

/**
 * Keeps a route reachable while the user still has to replace a password that
 * was reset by a super admin (e.g. logout, validate-token).
 */
export const AllowPendingPasswordChange = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);

export function assertPasswordChangeNotPending(
  reflector: Reflector,
  context: ExecutionContext,
  user: AuthGuardUser,
): void {
  if (!user.mustChangePassword) {
    return;
  }

  const isAllowed = reflector.getAllAndOverride<boolean>(
    ALLOW_PENDING_PASSWORD_CHANGE_KEY,
    [context.getHandler(), context.getClass()],
  );

  if (isAllowed) {
    return;
  }

  throw new ForbiddenException({
    message: ApiResponseMessages.PASSWORD_CHANGE_REQUIRED,
    error: 'Forbidden',
    statusCode: 403,
    code: PASSWORD_CHANGE_REQUIRED_CODE,
  });
}
