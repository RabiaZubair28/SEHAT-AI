import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { createHash } from 'crypto';
import { AUTH_GUARD_USER_CACHE_TTL_SECONDS } from '../common/app.constants';

const pendingAuthGuardUserLookups = new Map<
  string,
  Promise<AuthGuardUser | null>
>();

export interface AuthGuardUser {
  accessToken: string | null;
  roleName: string | null;
  facilityId: number | null;
  facilityUcId: number | null;
  districtId: number | null;
  mustChangePassword: boolean;
  permissions: Record<string, any>[];
}

interface AuthGuardUserRow {
  accessToken: string | null;
  roleName: string | null;
  facilityId: number | null;
  facilityUcId: number | null;
  districtId: number | null;
  mustChangePassword: boolean | null;
  permissions: Record<string, any>[] | string | null;
}

export async function findAuthGuardUser(
  userRepository: Repository<User>,
  userId: number,
): Promise<AuthGuardUser | null> {
  const row = await userRepository
    .createQueryBuilder('user')
    .leftJoin('user.userPermissions', 'userPermission')
    .leftJoin('userPermission.permission', 'permission')
    .leftJoin('user.facility', 'facility')
    .leftJoin('user.role', 'role')
    .select('user.access_token', 'accessToken')
    .addSelect('user.must_change_password', 'mustChangePassword')
    .addSelect('permission.payload', 'permissions')
    .addSelect('role.name', 'roleName')
    .addSelect('facility.id', 'facilityId')
    .addSelect('facility.uc_id', 'facilityUcId')
    .addSelect('facility.district_id', 'districtId')
    .where('user.id = :userId', { userId })
    .getRawOne<AuthGuardUserRow>();

  if (!row) {
    return null;
  }

  return {
    accessToken: row.accessToken,
    roleName: row.roleName,
    facilityId: row.facilityId,
    facilityUcId: row.facilityUcId,
    districtId: row.districtId,
    mustChangePassword: row.mustChangePassword === true,
    permissions: normalizePermissions(row.permissions),
  };
}

export async function findCachedAuthGuardUser(
  userRepository: Repository<User>,
  redisCacheService: RedisCacheService,
  userId: number,
  token: string,
): Promise<AuthGuardUser | null> {
  const cacheKey = `${buildAuthGuardUserCachePrefix(userId)}${hashToken(token)}`;
  const pendingLookup = pendingAuthGuardUserLookups.get(cacheKey);

  if (pendingLookup) {
    return pendingLookup;
  }

  const lookup = redisCacheService.getOrSetJson(
    cacheKey,
    AUTH_GUARD_USER_CACHE_TTL_SECONDS,
    () => loadAuthGuardUser(userRepository, userId, token),
  );

  pendingAuthGuardUserLookups.set(cacheKey, lookup);

  try {
    return await lookup;
  } finally {
    pendingAuthGuardUserLookups.delete(cacheKey);
  }
}

export function buildAuthGuardUserCachePrefix(userId: number): string {
  return `auth:guard-user:${userId}:`;
}

function normalizePermissions(
  permissions: AuthGuardUserRow['permissions'],
): Record<string, any>[] {
  if (!permissions) {
    return [];
  }

  if (typeof permissions === 'string') {
    return JSON.parse(permissions);
  }

  return permissions;
}

async function loadAuthGuardUser(
  userRepository: Repository<User>,
  userId: number,
  token: string,
): Promise<AuthGuardUser | null> {
  const user = await findAuthGuardUser(userRepository, userId);

  if (!user || user.accessToken !== token) {
    return null;
  }

  return user;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
