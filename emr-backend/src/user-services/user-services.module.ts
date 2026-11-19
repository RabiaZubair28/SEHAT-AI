import { Module } from '@nestjs/common';
import { UserServicesService } from './user-services.service';
import { UserServicesController } from './user-services.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { UserService } from './entities/user-service.entity';
import { AuthModule } from 'src/auth/auth.module';
import { SocketGateway } from 'src/socket/socket.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([UserService, User, Service]), AuthModule],
  controllers: [UserServicesController],
  providers: [UserServicesService, SocketGateway],
})
export class UserServicesModule {}
