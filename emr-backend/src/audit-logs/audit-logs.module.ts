import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "./entities/audit-logs.entity";
import { forwardRef, Module } from '@nestjs/common';

import { AuditLogsInterceptor } from "src/interceptors/audit-logs.interceptor";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLogsController } from "./audit-logs.controller";
import { AuthModule } from "src/auth/auth.module";
import { User } from "src/users/entities/user.entity";
import { Facility } from "src/facilities/entities/facility.entity";


@Module({
    imports: [
        TypeOrmModule.forFeature([AuditLog, User, Facility]),
        forwardRef(() => AuthModule),
    ],
    controllers: [AuditLogsController],
    providers: [AuditLogsInterceptor, AuditLogsService],
    exports: [AuditLogsInterceptor], // IMPORTANT
})
export class AuditLogsModule { }