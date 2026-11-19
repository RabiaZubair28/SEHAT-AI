import { SetMetadata } from '@nestjs/common';
import { RoleName } from 'src/common/enums/enums';

// TODO: Does this clash with existing keys?
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
