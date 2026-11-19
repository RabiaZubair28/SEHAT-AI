import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { RolePermission } from 'src/role-permisssions/entities/role-permisssion.entity';
import { UserPermission } from '../../user-permissions/entities/user-permission.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserPermissionSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async seed() {
    console.log('🚀 Seeding user permissions...');

    const users = await this.userRepository.find({ relations: ['role'] });
    const rolePermissions = await this.rolePermissionRepository.find({
      relations: ['role'],
    });

    if (!users.length || !rolePermissions.length) {
      console.log('⚠️ No users or role permissions found, skipping seeding.');
      return;
    }

    for (const user of users) {
      const rolePermission = rolePermissions.find(
        (rp) => rp.role.id === user.role.id,
      );

      if (!rolePermission || !rolePermission.payload?.length) {
        console.log(
          `⚠️ No permissions found for role "${user.role.name}", skipping user "${user.email}"`,
        );
        continue;
      }
      const existingUserPermission =
        await this.userPermissionRepository.findOne({
          where: {
            user: { id: user.id },
          },
        });

      if (existingUserPermission) {
        console.log(
          `⚠️ User "${user.email}" already has permissions for role "${user.role.name}", skipping.`,
        );
        continue;
      }
      const permission = this.permissionRepository.create({
        role: { id: user.role.id } as any,
        payload: JSON.parse(JSON.stringify(rolePermission.payload ?? [])),
      });
      const savedPermission = await this.permissionRepository.save(permission);

      const userPermission = this.userPermissionRepository.create({
        user,
        permission: savedPermission,
      });

      await this.userPermissionRepository.save(userPermission);
      console.log(
        `✅ Assigned permissions of role "${user.role.name}" to user "${user.email}"`,
      );
    }

    console.log('🎉 User permissions seeding completed!');
  }
}
