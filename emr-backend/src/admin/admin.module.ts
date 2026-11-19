import { forwardRef, Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { UserPermission } from 'src/user-permissions/entities/user-permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RolePermission } from 'src/role-permisssions/entities/role-permisssion.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { SocketModule } from 'src/socket/socket.module';
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
    UsersModule,
      SocketModule, 
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
