import { Module } from '@nestjs/common';

import { RolePermisssionsService } from './role-permisssions.service';
import { RolePermissionsController } from './role-permisssions.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from './entities/role-permisssion.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, RolePermission]), AuthModule],
  controllers: [RolePermissionsController],
  providers: [RolePermisssionsService],
})
export class RolePermisssionsModule {}
