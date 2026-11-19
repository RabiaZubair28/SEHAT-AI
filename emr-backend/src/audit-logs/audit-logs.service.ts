import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-logs.entity';
import { AuditLogsPaginationDto } from './dto/audit-logs-pagination.dto';
import { AuditLogsResponseDto } from './dto/audit-logs-response.dto';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';

@Injectable()
export class AuditLogsService {
  private readonly logger: Logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async getAuditLogs(paginationDto: AuditLogsPaginationDto): Promise<AuditLogsResponseDto> {
    try {
      const { page, limit, email, facilityId } = paginationDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.auditLogRepository.createQueryBuilder('auditLog')
        .leftJoin('auditLog.user', 'user')
        .leftJoinAndSelect('auditLog.facility', 'facility')
        .addSelect(['user.id', 'user.first_name', 'user.last_name', 'user.email'])
        .orderBy('auditLog.createdAt', 'DESC')
        .take(limit)
        .skip(skip);

      if (email) {
        queryBuilder.andWhere('user.email = :email', { email });
      }

      if (facilityId) {
        queryBuilder.andWhere('auditLog.facilityId = :facilityId', { facilityId });
      }

      const [data, count] = await queryBuilder.getManyAndCount();

      return {
        data,
        page,
        limit,
        count,
        lastPage: Math.ceil(count / limit),
      };
    } catch (error) {
      this.logger.error(ApiResponseMessages.AUDIT_LOGS_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.AUDIT_LOGS_FETCH_ERROR,
      );
    }
  }
}
