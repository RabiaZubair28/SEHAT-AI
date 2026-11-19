import { Module } from '@nestjs/common';
import { UserPersonalInfoService } from './user-personal-info.service';
import { UserPersonalInfoController } from './user-personal-info.controller';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [UserPersonalInfoController],
  providers: [UserPersonalInfoService],
})
export class UserPersonalInfoModule {}
