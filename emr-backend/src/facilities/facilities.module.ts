import { Module } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { BulkFacilitiesService } from './bulk-facilities.service';
import { FacilitiesController } from './facilities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facility } from './entities/facility.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from '../users/entities/user.entity';
import { District } from 'src/districts/entities/district.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { UC } from 'src/uc/entities/uc.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Facility, District, Taluka, UC]),
    AuthModule,
  ],
  controllers: [FacilitiesController],
  providers: [FacilitiesService, BulkFacilitiesService],
})
export class FacilitiesModule {}
