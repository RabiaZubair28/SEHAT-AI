import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserPermissionDto } from './dto/create-user-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPermission } from './entities/user-permission.entity';
import { DataSource, Repository } from 'typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { User } from 'src/users/entities/user.entity';
import { getDefaultPayloadForRole } from 'src/common/default-payload';
import { PermissionPayloadItemSlim } from 'src/common/interfaces/permission-payload.interface';
import { SocketGateway } from 'src/socket/socket.gateway';
import { RoleName } from 'src/common/enums/enums';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { buildAuthGuardUserCachePrefix } from 'src/auth/auth-user-query.util';

export enum UserStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,

    private readonly socketGateway: SocketGateway,

    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(dto: CreateUserPermissionDto): Promise<UserPermission> {
    const { userId, status } = dto;
    let { payload } = dto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(
        this.userRepository.target,
        {
          where: { id: userId },
          relations: ['role'],
        },
      );
      if (!user) throw new NotFoundException('User not found');

      if (user.role?.name === RoleName.SUPER_ADMIN) {
        throw new BadRequestException(
          'Permissions cannot be assigned to super_admin users',
        );
      }

      const roleId = user.role?.id;
      const roleName = user.role?.name;

      payload = [...getDefaultPayloadForRole(roleName), ...payload];
      const existing = await queryRunner.manager.findOne(
        this.userPermissionRepository.target,
        {
          where: {
            user: { id: userId },
          },
          relations: ['user', 'permission'],
        },
      );

      let userPermission: UserPermission;
      if (existing) {
        if (!existing.permission) {
          const dedicatedPermission = await queryRunner.manager.save(
            this.permissionRepository.target,
            this.permissionRepository.create({
              role: { id: roleId },
              payload: [],
            }),
          );
          existing.permission = dedicatedPermission;
        }

        const sharedPermissionCount = existing.permission?.id
          ? await queryRunner.manager.count(this.userPermissionRepository.target, {
              where: { permission: { id: existing.permission.id } },
            })
          : 0;

        if (sharedPermissionCount > 1) {
          let dedicatedPermission = this.permissionRepository.create({
            role: { id: roleId },
            payload: JSON.parse(JSON.stringify(existing.permission.payload ?? [])),
          });

          dedicatedPermission = await queryRunner.manager.save(
            this.permissionRepository.target,
            dedicatedPermission,
          );
          existing.permission = dedicatedPermission;
        }

        existing.permission.payload = payload;
        existing.permission.role = { id: roleId } as any;
        await queryRunner.manager.save(
          this.permissionRepository.target,
          existing.permission,
        );
        userPermission = existing;
      } else {
        let permission = this.permissionRepository.create({
          role: { id: roleId },
          payload,
        });
        permission = await queryRunner.manager.save(
          this.permissionRepository.target,
          permission,
        );

        userPermission = this.userPermissionRepository.create({
          user: { id: userId },
          permission: { id: permission.id },
        });
      }

      if (
        !Object.values(UserStatus).includes(status as unknown as UserStatus)
      ) {
        throw new BadRequestException(`Invalid status: ${status}`);
      }

      user.status = status as unknown as UserStatus;
      await queryRunner.manager.save(this.userRepository.target, user);

      const savedUserPermission = await queryRunner.manager.save(
        this.userPermissionRepository.target,
        userPermission,
      );
      await queryRunner.commitTransaction();
      await this.invalidateAuthGuardUserCache(userId);
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: [
          'userPermissions',
          'userPermissions.permission',
          'role',
          'facility',
          'services',
        ],
      });
      this.socketGateway.emitToUser(userId, 'user_updated', {
        user: updatedUser,
      });
      return savedUserPermission;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Transaction failed:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<UserPermission[]> {
    return await this.userPermissionRepository.find();
  }

  private async invalidateAuthGuardUserCache(userId: number): Promise<void> {
    await this.redisCacheService.deleteByPrefix(
      buildAuthGuardUserCachePrefix(userId),
    );
  }

  getDefaultsForRole(roleName: string): PermissionPayloadItemSlim[] {
    return getDefaultPayloadForRole(roleName).map(({ route, method }) => ({
      route,
      method,
    }));
  }
}
