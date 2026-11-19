import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, tap } from 'rxjs';
import { AuditLog } from 'src/audit-logs/entities/audit-logs.entity';
import { toLogSafeValue } from 'src/common/utils/logging.util';
import { Repository } from 'typeorm';

@Injectable()
export class AuditLogsInterceptor implements NestInterceptor {
    constructor(
        @InjectRepository(AuditLog)
        private repo: Repository<AuditLog>,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        try {


            const now = Date.now();
            const req = context.switchToHttp().getRequest();
            const user = req.user;
            const userRoutesToSkip = ['auth/login'];

             // if no user is found in request, skip logging, that's for unauthenticated routes
             // if if there route is in skip list, skip logging (to ignore routes with sensitive information)
             // skip logging for super-admin routes
            if (!user || userRoutesToSkip.includes(req.originalUrl) || req.originalUrl.includes('/super-admin/')) {
                return next.handle();
            }


            return next.handle().pipe(
                tap(async () => {
                    const auditLog = this.repo.create({
                        userId: user?.sub ?? null,
                        facilityId: user?.facilityId ?? null,
                        method: req.method,
                        route: req.originalUrl,
                        body: toLogSafeValue(req.body),
                        params: toLogSafeValue(req.params),
                        query: toLogSafeValue(req.query),
                        ip: req.ip || null,
                        statusCode: context.switchToHttp().getResponse().statusCode,
                        executionTimeMs: Date.now() - now,
                    } as Partial<AuditLog>);
                    await this.repo.save(auditLog);
                }),
            );
        } catch (error) {
            console.error('Error in AuditInterceptor:', error);
            return next.handle();
        }
    }
}

