import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AkuhGuidelinesController } from './akuh-guidelines.controller';
import { AkuhGuidelinesService } from './akuh-guidelines.service';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
    AuthModule,
  ],
  controllers: [AkuhGuidelinesController],
  providers: [AkuhGuidelinesService],
})
export class AkuhGuidelinesModule {}
