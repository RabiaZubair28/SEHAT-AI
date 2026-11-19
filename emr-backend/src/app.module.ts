import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { DistrictsModule } from './districts/districts.module';
import { UserPersonalInfoModule } from './user-personal-info/user-personal-info.module';
import { PermissionsModule } from './permissions/permissions.module';
import { UserPermissionsModule } from './user-permissions/user-permissions.module';
import { PatientsModule } from './patients/patients.module';
import { DivisionModule } from './division/division.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { createDataSource } from './data-source';
import { RoutesModule } from './routes/routes.module';
import { RolePermisssionsModule } from './role-permisssions/role-permisssions.module';
import { PatientAdditionalInfoModule } from './patient-additional-info/patient-additional-info.module';
import { PatientSocialDeterminantsModule } from './patient-social-determinants/patient-social-determinants.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { DoctorsModule } from './doctors/doctors.module';
import { TalukaModule } from './taluka/taluka.module';
import { UcModule } from './uc/uc.module';
import { UserServicesModule } from './user-services/user-services.module';
import { FollowUpsModule } from './follow-ups/follow-ups.module';
import { PatientQueueModule } from './patient-queue/patient-queue.module';
import { TokenCounterModule } from './token-counter/token-counter.module';
import { SocketModule } from './socket/socket.module';
import { VitalAssesmentModule } from './vital-assesment/vital-assesment.module';
import { AncModule } from './anc/anc.module';
import { DiagnosisPrescriptionsModule } from './diagnosis-prescriptions/diagnosis-prescriptions.module';
import { LabsModule } from './labs/labs.module';
import { ImmunisationModule } from './immunisation/immunisation.module';
import { LoggerModule } from 'nestjs-pino';
import { DispenserModule } from './dispenser/dispenser.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PncModule } from './pnc/pnc.module';
import { FamilyPlanningModule } from './family-planning/family-planning.module';
import { DeliveryModule } from './delivery/delivery.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { NutritionAdvisorModule } from './nutrition-advisor/nutrition-advisor.module';
import { MedicineModule } from './medicine/medicine.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AdminModule } from './admin/admin.module';
import { OpdModule } from './opd/opd.module';
import { LeaveModule } from './leave/leave.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MedicineBatchModule } from './medicine-batch/medicine-batch.module';
import { CommodityRequestModule } from './commodity-requests/commodity-requests.module';
import { EmergencyModule } from './emergency/emergency.module';
import { ReportingModule } from './reporting/reporting.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TelehealthModule } from './telehealth/telehealth.module';
import { AkuhGuidelinesModule } from './akuh-guidelines/akuh-guidelines.module';
import {
  getRequestBodyForLog,
  serializeHttpRequestForLog,
} from './common/utils/logging.util';
import { mkdirSync } from 'fs';
import { IncomingMessage } from 'http';
import { join } from 'path';
import pino from 'pino';
import { RedisCacheModule } from './common/cache/redis-cache.module';
dotenv.config();

interface LoggedRequestUser {
  sub?: number;
  role?: string;
}

const dataSource = createDataSource();
const logsDirectory = join(process.cwd(), 'logs');
mkdirSync(logsDirectory, { recursive: true });
const logFileDestination = pino.destination({
  dest: join(logsDirectory, 'combined.log'),
  append: true,
  sync: false,
});
const loggerStreams = [
  { stream: logFileDestination },
];

if (process.env.NODE_ENV !== 'local') {
  loggerStreams.push({
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: true,
        ignore: 'pid,hostname',
      },
    }),
  });
}
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisCacheModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(dataSource.options),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'local' ? 'info' : 'debug'),
        stream: pino.multistream(loggerStreams),
        autoLogging: true,
        serializers: {
          req: serializeHttpRequestForLog,
        },
        customProps: (req: IncomingMessage & { user?: LoggedRequestUser }) => ({
          userId: req.user?.sub,
          userRole: req.user?.role,
        }),
        customSuccessObject: (req, res, loggableObject) => ({
          ...loggableObject,
          req: {
            ...serializeHttpRequestForLog(req),
            body: getRequestBodyForLog(req),
          },
        }),
        customErrorObject: (req, res, error, loggableObject) => ({
          ...loggableObject,
          err: error,
          req: {
            ...serializeHttpRequestForLog(req),
            body: getRequestBodyForLog(req),
          },
        }),
      },
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    FacilitiesModule,
    DistrictsModule,
    UserPersonalInfoModule,
    PermissionsModule,
    UserPermissionsModule,
    PatientsModule,
    PncModule,
    DivisionModule,
    RoutesModule,
    RolePermisssionsModule,
    PatientAdditionalInfoModule,
    PatientSocialDeterminantsModule,
    AppointmentsModule,
    ReferralsModule,
    DoctorsModule,
    TalukaModule,
    UcModule,
    UserServicesModule,
    FollowUpsModule,
    PatientQueueModule,
    TokenCounterModule,
    SocketModule,
    VitalAssesmentModule,
    AncModule,
    DiagnosisPrescriptionsModule,
    LabsModule,
    ImmunisationModule,
    DispenserModule,
    NotificationsModule,
    FamilyPlanningModule,
    AuditLogsModule,
    DeliveryModule,
    NutritionModule,
    NutritionAdvisorModule,
    MedicineModule,
    AdminModule,
    OpdModule,
    LeaveModule,
    AttendanceModule,
    MedicineBatchModule,
    CommodityRequestModule,
    EmergencyModule,
    ReportingModule,
    DashboardModule,
    TelehealthModule,
    AkuhGuidelinesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
