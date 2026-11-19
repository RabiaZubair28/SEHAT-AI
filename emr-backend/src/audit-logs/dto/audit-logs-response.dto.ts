import { AuditLog } from '../entities/audit-logs.entity';

export class AuditLogsResponseDto {
  data: AuditLog[];
  page: number;
  limit: number;
  count: number;
  lastPage: number;
}
