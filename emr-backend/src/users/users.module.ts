import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Permission } from 'src/permissions/entities/permission.entity';
import { UserPermission } from '../user-permissions/entities/user-permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RolePermission } from 'src/role-permisssions/entities/role-permisssion.entity';
import { SocketGateway } from 'src/socket/socket.gateway';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Permission,
      UserPermission,
      Role,
      RolePermission,
          UserPersonalInfo,
    ]),
    forwardRef(() => AuthModule),
  ],
  providers: [UsersService, SocketGateway],
  exports: [UsersService],
})
export class UsersModule {}
