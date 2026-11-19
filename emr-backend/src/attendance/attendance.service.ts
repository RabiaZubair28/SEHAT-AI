import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, LessThanOrEqual, In } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { AttendanceStatus, PatientStatus, RoleName } from 'src/common/enums/enums';
import {
  CheckOutAttendanceDto,
  CreateAttendanceDto,
  GetAttendanceFilterDto,
} from './attendance.dto';
import { AUTO_CHECKOUT_HOURS } from 'src/common/app.constants';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';

@Injectable()
export class AttendanceService {
  private readonly logger: Logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(PatientQueue)
    private readonly patientQueueRepository: Repository<PatientQueue>,
  ) { }

  async create(
    request: Request,
    createAttendanceDto: CreateAttendanceDto,
  ): Promise<Attendance> {
    try {
      const requestUser = (request as any).user as any;
      const userId = Number(requestUser?.sub);
      const facilityId = requestUser?.facilityId || null;
      const role = requestUser?.role;
      const { latitude, longitude, isMobile, checkInTime } = createAttendanceDto;

      this.validateVaccinatorCoordinates(role, latitude, longitude, isMobile);

      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          userId,
          facilityId,
          checkOutTime: IsNull(),
          status: AttendanceStatus.CHECKED_IN,
        },
        order: { checkInTime: 'DESC' },
      });

      if (existingAttendance) {
        throw new ConflictException(ApiResponseMessages.ATTENDANCE_ALREADY_MARKED);
      }

      const attendance = {
        userId,
        facilityId,
        checkInTime: this.resolveTimestamp(checkInTime),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        isMobile: isMobile ?? false,
      };

      return await this.attendanceRepository.save(attendance);
    } catch (error) {
      this.logger.error('Error creating attendance:', error);
      ExceptionUtility.generateException(
        error,
        ApiResponseMessages.ATTENDANCE_CREATE_ERROR,
      );
      throw error;
    }
  }

  async checkOut(
    request: Request,
    checkOutAttendanceDto: CheckOutAttendanceDto,
  ): Promise<Attendance> {
    try {
      const requestUser = (request as any).user as any;
      const userId = Number(requestUser?.sub);
      const facilityId = this.resolveAttendanceFacilityId(
        requestUser?.role,
        requestUser?.facilityId,
      );
      const { checkOutTime, isMobile } = checkOutAttendanceDto;

      if (!isMobile) {
        const queues = await this.patientQueueRepository.find({
          where: { doctor: { id: userId }, status: In([PatientStatus.PENDING, PatientStatus.IN_PROGRESS, PatientStatus.PAUSED]), deleted_at: IsNull() },
        });
        if (queues.length > 0) {
          throw new ConflictException(ApiResponseMessages.ATTENDANCE_CANNOT_CHECKOUT_WITH_ACTIVE_QUEUES);
        }
      }

      // Find today's attendance record
      const attendance = await this.attendanceRepository.findOne({
        where: {
          userId,
          facilityId: this.buildFacilityWhereClause(facilityId),
          checkOutTime: IsNull(),
          status: AttendanceStatus.CHECKED_IN,
        },
        order: { checkInTime: 'DESC' },
      });
      if (!attendance) {
        throw new ConflictException(ApiResponseMessages.ATTENDANCE_NOT_FOUND);
      }
      const resolvedCheckOutTime = this.resolveTimestamp(checkOutTime);

      if (resolvedCheckOutTime.getTime() < attendance.checkInTime.getTime()) {
        throw new ConflictException(ApiResponseMessages.INVALID_ATTENDANCE_RECORD);
      }

      attendance.checkOutTime = resolvedCheckOutTime;
      attendance.status = AttendanceStatus.CHECKED_OUT;
      return await this.attendanceRepository.save(attendance);
    }
    catch (error) {
      this.logger.error('Error during check-out:', error);
      ExceptionUtility.generateException(
        error,
        ApiResponseMessages.ATTENDANCE_CHECKOUT_ERROR,
      );
      throw error;
    }
  }

  async forceCheckOut(doctorId: number, facilityId: number): Promise<Attendance> {
    try {
      if (!doctorId || !facilityId) {
        throw new BadRequestException('doctorId and facilityId are required');
      }

      const attendance = await this.attendanceRepository.findOne({
        where: {
          userId: doctorId,
          facilityId,
          checkOutTime: IsNull(),
          status: AttendanceStatus.CHECKED_IN,
        },
        order: { checkInTime: 'DESC' },
      });

      if (!attendance) {
        throw new ConflictException(ApiResponseMessages.ATTENDANCE_NOT_FOUND);
      }

      attendance.checkOutTime = new Date();
      attendance.status = AttendanceStatus.CHECKED_OUT;
      return await this.attendanceRepository.save(attendance);
    } catch (error) {
      this.logger.error('Error during force check-out:', error);
      ExceptionUtility.generateException(
        error,
        ApiResponseMessages.ATTENDANCE_CHECKOUT_ERROR,
      );
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleAutoCheckoutCron(): Promise<void> {
    const now = new Date();
    const cutoff = new Date(
      now.getTime() - (AUTO_CHECKOUT_HOURS * 60 * 60 * 1000),
    );
    console.log('Cron running at', new Date().toISOString());

    try {
      const result = await this.attendanceRepository.update(
        {
          checkOutTime: IsNull(),
          status: AttendanceStatus.CHECKED_IN,
          checkInTime: LessThanOrEqual(cutoff),
        },
        {
          checkOutTime: now,
          status: AttendanceStatus.CHECKED_OUT,
        },
      );

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Auto checkout completed for ${result.affected} attendance record(s).`,
        );
      }
    } catch (error) {
      this.logger.error('Error running auto checkout cron:', error);
    }
  }

  async findAll(
    userId: number,
    role: string,
    userFacilityId: number,
    filterDto: GetAttendanceFilterDto,
  ): Promise<{
    data: Attendance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 10, search, email, facilityId } = filterDto;

      const queryBuilder = this.attendanceRepository.createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.user', 'user')
        .leftJoinAndSelect('attendance.facility', 'facility');

      // Apply filters
      this.applyFilters(queryBuilder, userId, role, userFacilityId, search, email, facilityId);

      // Apply ordering and pagination
      queryBuilder
        .orderBy('attendance.checkInTime', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error fetching attendance records:', error);
      ExceptionUtility.generateException(
        error,
        ApiResponseMessages.ATTENDANCE_FETCH_ERROR,
      );
      throw error;
    }
  }

  private applyFilters(
    queryBuilder: any,
    userId: number,
    role: string,
    userFacilityId: number,
    search?: string,
    email?: string,
    facilityId?: number,
  ): void {
    // Apply role-based filtering
    if (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN) {
      // Admin and Super Admin can see all records, no additional filter needed
    } else if (role === RoleName.FACILITY_INCHARGE) {
      // Facility Incharge can only see records from their facility
      queryBuilder.andWhere('attendance.facilityId = :userFacilityId', { userFacilityId });
    } else {
      // Regular users can only see their own records
      queryBuilder.andWhere('attendance.userId = :userId', { userId });
    }

    // Apply search filter (by name) - only for admin, super admin, and facility incharge
    if (search && (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN || role === RoleName.FACILITY_INCHARGE)) {
      queryBuilder.andWhere(
        'LOWER(user.name) LIKE LOWER(:search)',
        { search: `%${search}%` }
      );
    }

    // Apply email filter - only for admin, super admin, and facility incharge
    if (email && (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN || role === RoleName.FACILITY_INCHARGE)) {
      queryBuilder.andWhere(
        'LOWER(user.email) LIKE LOWER(:email)',
        { email: `%${email}%` }
      );
    }

    // Apply facility filter - only for admin and super admin
    if (facilityId && (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN)) {
      queryBuilder.andWhere('attendance.facilityId = :facilityId', { facilityId });
    }
  }

  private resolveAttendanceFacilityId(
    role?: string,
    rawFacilityId?: number | string | null,
  ): number | null {
    if (role === RoleName.TELEHEALTH_CONSULTANT) {
      return null;
    }

    if (rawFacilityId === null || rawFacilityId === undefined || rawFacilityId === '') {
      throw new BadRequestException('facilityId is required for this user');
    }

    const facilityId = Number(rawFacilityId);

    if (Number.isNaN(facilityId)) {
      throw new BadRequestException('Invalid facilityId');
    }

    return facilityId;
  }

  private buildFacilityWhereClause(facilityId: number | null) {
    return facilityId === null ? IsNull() : facilityId;
  }

  private resolveTimestamp(timestamp?: string): Date {
    return timestamp ? new Date(timestamp) : new Date();
  }

  private validateVaccinatorCoordinates(
    role?: string,
    latitude?: number,
    longitude?: number,
    isMobile?: boolean,
  ): void {
    if (role !== RoleName.VACCINATOR) {
      return;
    }

    if (isMobile && (latitude == null || longitude == null)) {
      throw new BadRequestException(
        'latitude and longitude are required for vaccinator check-in',
      );
    }
  }
}
