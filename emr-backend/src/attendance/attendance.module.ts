import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './entities/attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      Facility,
      User,
      PatientQueue,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, ExceptionUtility],
  exports: [AttendanceService],
})
export class AttendanceModule { }
