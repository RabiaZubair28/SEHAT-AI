import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { PatientsModule } from 'src/patients/patients.module';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { DispenserModule } from 'src/dispenser/dispenser.module';
import { ImmunisationModule } from 'src/immunisation/immunisation.module';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PatientsModule,
    AuthModule,
    DoctorsModule,
    DispenserModule,
    ImmunisationModule,
    DeliveryModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
