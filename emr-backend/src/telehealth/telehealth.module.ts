import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Patient } from 'src/patients/entities/patient.entity';
import { SocketModule } from 'src/socket/socket.module';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';
import { User } from 'src/users/entities/user.entity';
import { TelehealthConsultationNote } from './entities/telehealth-consultation-note.entity';
import { TelehealthRequest } from './entities/telehealth-request.entity';
import { TelehealthSession } from './entities/telehealth-session.entity';
import { TelehealthController } from './telehealth.controller';
import { TelehealthService } from './telehealth.service';
import { App } from 'supertest/types';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TelehealthRequest,
      TelehealthSession,
      TelehealthConsultationNote,
      User,
      UserPersonalInfo,
      Attendance,
      Patient,
      AppointmentService,
    ]),
    forwardRef(() => AuthModule),
    NotificationsModule,
    SocketModule,
  ],
  controllers: [TelehealthController],
  providers: [TelehealthService],
  exports: [TelehealthService],
})
export class TelehealthModule {}
