import { Module } from '@nestjs/common';
import { DivisionService } from './division.service';
import { DivisionController } from './division.controller';
import { Division } from './entities/division.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Division]), AuthModule],
  controllers: [DivisionController],
  providers: [DivisionService],
  exports: [DivisionService, TypeOrmModule.forFeature([Division])],
})
export class DivisionModule {}
