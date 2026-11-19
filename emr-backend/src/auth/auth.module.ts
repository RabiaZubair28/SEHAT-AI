import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';
import { JwtAdminAuthGuard } from './jwt-admin-auth.guard';
import { JwtUserAuthGuard } from './jwt-user-auth.guard';
import { JwtOrAuthGuard } from './jwt-or-auth.guard';
import { FacilityInchargeGuard } from './facility-incharge.guard';
import { Role } from 'src/roles/entities/role.entity';
import { RoutesService } from 'src/routes/routes.service';
import { Service } from 'src/services/entities/service.entity';
import { SocketGateway } from 'src/socket/socket.gateway';
import { MailModule } from 'src/mail/mail.module';
import { Client } from 'src/clients/entities/client.entity';
import { ClientKeyAuthGuard } from './client-key-auth.guard';
import { JwtOrClientAuthGuard } from './jwt-or-client-auth.guard';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserPersonalInfo,
      Role,
      Service,
      Client,
      Attendance,
    ]),
    forwardRef(() => UsersModule),
    MailModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN as any },
    }),
  ],

  providers: [
    AuthService,
    JwtStrategy,
    JwtAdminAuthGuard,
    JwtUserAuthGuard,
    FacilityInchargeGuard,
    JwtOrAuthGuard,
    ClientKeyAuthGuard,
    JwtOrClientAuthGuard,
    RoutesService,
    SocketGateway,
  ],
  controllers: [AuthController],
  exports: [
    JwtModule,
    JwtAdminAuthGuard,
    JwtUserAuthGuard,
    FacilityInchargeGuard,
    JwtOrAuthGuard,
    ClientKeyAuthGuard,
    JwtOrClientAuthGuard,
    RoutesService,
  ],
})
export class AuthModule {}
