import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import {
  AttendanceStatus,
  PatientDailyRollupType,
  PatientStatus,
  RoleName,
  UserStatus,
} from 'src/common/enums/enums';
import { successResponse } from 'src/common/utils/response.util';
import { Facility } from 'src/facilities/entities/facility.entity';
import { PatientDailyRollup } from 'src/patients/entities/patient-daily-rollup.entity';
import { User } from 'src/users/entities/user.entity';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';
import { GetDashboardOverallQueryDto } from './dto/get-dashboard-overall-query.dto';
import { DashboardOverallResponseDto } from './dto/dashboard-overall-response.dto';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import dayjs from 'src/common/utils/dayjs.util';

type VisitsByService = {
  OPD: number;
  ANC: number;
  PNC: number;
  Nutrition: number;
  'Family Planning': number;
  Immunisation: number;
  'Medicine Dispensing': number;
  Delivery: number;
};

type LivePatientFlowToday = {
  totalVisitsToday: number;
  visitsByServiceToday: VisitsByService;
  visitsCompletedToday: number;
  currentlyInQueue: number;
  unassignedPatients: number;
};

type PatientFlowThisMonth = {
  totalVisitsThisMonth: number;
  visitsByServiceThisMonth: VisitsByService;
  visitsCompletedThisMonth: number;
  newRegistrationsThisMonth: number;
  avgDailyVisitsThisMonth: number;
};

type StaffAttendanceStatus = AttendanceStatus | 'Absent';

type StaffAttendanceRecord = {
  userId: number;
  name: string;
  role: string | null;
  facilityName: string;
  attendanceStatus: StaffAttendanceStatus;
  checkInTime: Date | null;
  checkOutTime: Date | null;
};

type StaffAttendanceRecordsQuery = {
  page: number;
  limit: number;
  search?: string;
};

type StaffAttendanceRecordsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string | null;
};

type StaffAttendanceRecordsResult = {
  records: StaffAttendanceRecord[];
  pagination: StaffAttendanceRecordsPagination;
};

type StaffAttendanceSummaryQueries = {
  totalFacilityStaffRecords: StaffAttendanceRecordsQuery;
  checkedInUsers: StaffAttendanceRecordsQuery;
  checkedOutUsers: StaffAttendanceRecordsQuery;
};

type StaffAttendanceSummary = {
  totalFacilityStaff: number;
  staffByRole: {
    Doctors: {
      total: number;
      detail: string;
    };
  };
  totalFacilityStaffRecords: StaffAttendanceRecord[];
  totalFacilityStaffRecordsPagination: StaffAttendanceRecordsPagination;
  checkedInUsers: StaffAttendanceRecordsResult;
  checkedOutUsers: StaffAttendanceRecordsResult;
  checkedInNow: number;
  checkedInRange: number;
  checkedOutOrAbsent: number;
};

type FacilityScopeFilter = {
  facilityId?: number;
  facilityIds?: number[];
  isAllFacilities: boolean;
};

type DateRange = {
  start: Date;
  end: Date;
};

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(PatientDailyRollup)
    private readonly patientDailyRollupRepository: Repository<PatientDailyRollup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
  ) {}

  public async getDashboard(user: any, query: GetDashboardQueryDto) {
    try {
      const { filter, scope } = await this.resolveFacilityScope(user, query);
      const staffAttendanceSummaryQueries =
        this.resolveStaffAttendanceSummaryQueries(query);

      const reference = query.date ? new Date(query.date) : new Date();
      const day = this.getPktDayRange(reference);
      const month = this.getPktMonthRange(reference);

      const [patientFlowToday, patientFlowMonth, staffAttendance] =
        await Promise.all([
          this.getLivePatientFlowToday(day.range, filter),
          this.getPatientFlowThisMonth(month.range, month.dayOfMonth, filter),
          this.getStaffAttendanceSummary(
            day.range,
            filter,
            staffAttendanceSummaryQueries,
          ),
        ]);

      return successResponse(
        {
          scope,
          patientFlowToday: {
            date: day.pktDate,
            ...patientFlowToday,
          },
          patientFlowMonth: {
            month: month.pktMonth,
            ...patientFlowMonth,
          },
          staffAttendance: {
            date: day.pktDate,
            ...staffAttendance,
          },
          generatedAt: new Date().toISOString(),
        },
        'Dashboard data fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error('Failed to fetch dashboard data', (error as any)?.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch dashboard data',
      );
    }
  }

  public async getOverallTotals(
    user: any,
    query: GetDashboardOverallQueryDto,
  ): Promise<DashboardOverallResponseDto> {
    try {
      const { filter } = await this.resolveFacilityScope(user, query);

      const [
        totalRegistrations,
        { total: totalVisits, completed: totalVisitsCompleted },
        visitsByService,
      ] = await Promise.all([
        this.countPatientRegistrations(null, filter),
        this.getAppointmentCounts(null, filter), // will need optimization in the future via an appointment rollup table
        this.getVisitsByService(null, filter), // will need optimization in the future via an appointment rollup table
      ]);

      const totalVisitsByService = Object.entries(visitsByService)
        .filter(([, value]) => value > 0)
        .map(([label, value]) => ({ label, value }));

      return successResponse(
        {
          totalRegistrations,
          totalVisits,
          totalVisitsCompleted,
          totalVisitsByService,
        },
        'Dashboard overall totals fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch dashboard overall totals',
        (error as any)?.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch dashboard overall totals',
      );
    }
  }

  private async getLivePatientFlowToday(
    range: DateRange,
    scopeFilter?: FacilityScopeFilter,
  ): Promise<LivePatientFlowToday> {
    const [appointmentCounts, visitsByServiceToday] = await Promise.all([
      this.getAppointmentCounts(range, scopeFilter),
      this.getVisitsByService(range, scopeFilter),
    ]);

    return {
      totalVisitsToday: appointmentCounts.total,
      visitsByServiceToday,
      visitsCompletedToday: appointmentCounts.completed,
      currentlyInQueue: appointmentCounts.inQueue,
      unassignedPatients: appointmentCounts.unassigned,
    };
  }

  private async getPatientFlowThisMonth(
    range: DateRange,
    dayOfMonth: number,
    scopeFilter?: FacilityScopeFilter,
  ): Promise<PatientFlowThisMonth> {
    const [
      appointmentCounts,
      visitsByServiceThisMonth,
      newRegistrationsThisMonth,
    ] = await Promise.all([
      this.getAppointmentCounts(range, scopeFilter),
      this.getVisitsByService(range, scopeFilter),
      this.countPatientRegistrations(range, scopeFilter),
    ]);

    const totalVisitsThisMonth = appointmentCounts.total;
    const visitsCompletedThisMonth = appointmentCounts.completed;

    const avgDailyVisitsThisMonth =
      totalVisitsThisMonth === 0
        ? 0
        : Math.max(
            1,
            Math.round(totalVisitsThisMonth / Math.max(1, dayOfMonth)),
          );

    return {
      totalVisitsThisMonth,
      visitsByServiceThisMonth,
      visitsCompletedThisMonth,
      newRegistrationsThisMonth,
      avgDailyVisitsThisMonth,
    };
  }

  private async getStaffAttendanceSummary(
    range: DateRange,
    scopeFilter?: FacilityScopeFilter,
    summaryQueries?: StaffAttendanceSummaryQueries,
  ): Promise<StaffAttendanceSummary> {
    const resolvedSummaryQueries = summaryQueries ?? {
      totalFacilityStaffRecords: { page: 1, limit: 10 },
      checkedInUsers: { page: 1, limit: 10 },
      checkedOutUsers: { page: 1, limit: 10 },
    };

    const [
      totalFacilityStaff,
      roleRows,
      checkedInNow,
      checkedInRange,
      staffRecordsResult,
      checkedInUsersResult,
      checkedOutUsersResult,
    ] =
      await Promise.all([
        this.getActiveUsersBaseQuery(scopeFilter, range.end).getCount(),
        this.getActiveUsersBaseQuery(scopeFilter, range.end)
          .select('role.name', 'roleName')
          .addSelect('COUNT(user.id)', 'count')
          .groupBy('role.name')
          .getRawMany<{ roleName: string; count: string }>(),
        this.countCheckedInUsers(range, scopeFilter),
        this.countUsersCheckedInRange(range, scopeFilter),
        this.getFacilityStaffAttendanceRecords(
          range,
          scopeFilter,
          resolvedSummaryQueries.totalFacilityStaffRecords,
        ),
        this.getFacilityStaffAttendanceRecords(
          range,
          scopeFilter,
          resolvedSummaryQueries.checkedInUsers,
          AttendanceStatus.CHECKED_IN,
        ),
        this.getFacilityStaffAttendanceRecords(
          range,
          scopeFilter,
          resolvedSummaryQueries.checkedOutUsers,
          AttendanceStatus.CHECKED_OUT,
          true,
        ),
      ]);

    const countByRole = new Map<RoleName, number>();
    for (const row of roleRows) {
      countByRole.set(row.roleName as RoleName, Number(row.count ?? 0));
    }

    const doctorRoleMeta: Array<{ role: RoleName; label: string }> = [
      { role: RoleName.SBA, label: 'SBA' },
      { role: RoleName.VACCINATOR, label: 'Vaccinator' },
      { role: RoleName.MEDICAL_OFFICER_MALE, label: 'MO' },
      { role: RoleName.MEDICAL_OFFICER_FEMALE, label: 'WMO' },
      { role: RoleName.PAEDS, label: 'Paeds' },
      { role: RoleName.FACILITY_INCHARGE, label: 'Facility Incharge' },
      { role: RoleName.DISPENSER, label: 'Dispenser' },
      { role: RoleName.TELEHEALTH_CONSULTANT, label: 'Telehealth Consultant' },
      { role: RoleName.REGISTRATION_CLERK, label: 'Registration Clerk' },
    ];

    let doctorsTotal = 0;
    const doctorDetailParts: string[] = [];
    for (const meta of doctorRoleMeta) {
      const count = countByRole.get(meta.role) ?? 0;
      doctorsTotal += count;
      if (count > 0) {
        doctorDetailParts.push(`${count} ${meta.label}`);
      }
    }

    return {
      totalFacilityStaff,
      staffByRole: {
        Doctors: {
          total: doctorsTotal,
          detail: doctorDetailParts.length ? doctorDetailParts.join(', ') : '0',
        },
      },
      totalFacilityStaffRecords: staffRecordsResult.records,
      totalFacilityStaffRecordsPagination: staffRecordsResult.pagination,
      checkedInUsers: checkedInUsersResult,
      checkedOutUsers: checkedOutUsersResult,
      checkedInNow,
      checkedInRange,
      checkedOutOrAbsent: Math.max(0, totalFacilityStaff - checkedInNow),
    };
  }

  //  createdBefore - ES-838: Exclude users created after a certain date so they are excluded from absentee counts
  private getActiveUsersBaseQuery(
    scopeFilter?: FacilityScopeFilter,
    createdBefore?: Date,
  ) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('user.deleted_at IS NULL')
      .andWhere('user.facility_id IS NOT NULL')
      .andWhere('user.status = :approvedStatus', {
        approvedStatus: UserStatus.APPROVED,
      })
      .andWhere('role.name IS DISTINCT FROM :excludedStaffRole', {
        excludedStaffRole: RoleName.FACILITY_INCHARGE,
      });

    if (createdBefore) {
      query.andWhere('user.created_at < :createdBefore', { createdBefore });
    }

    this.applyFacilityFilter(query, scopeFilter, 'user');

    return query;
  }

  private async getFacilityStaffAttendanceRecords(
    range: DateRange,
    scopeFilter?: FacilityScopeFilter,
    recordsQuery?: StaffAttendanceRecordsQuery,
    attendanceStatus?: StaffAttendanceStatus,
    includeAbsentWithStatus = false,
  ): Promise<StaffAttendanceRecordsResult> {
    const resolvedQuery = recordsQuery ?? { page: 1, limit: 10 };

    const latestByUserQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.user_id', 'user_id')
      .addSelect('MAX(attendance.check_in_time)', 'latest_check_in')
      .where('attendance.checkInTime >= :startDate', { startDate: range.start })
      .andWhere('attendance.checkInTime < :endDate', { endDate: range.end })
      .groupBy('attendance.user_id');

    this.applyFacilityFilter(latestByUserQuery, scopeFilter, 'attendance');

    const timesByUserQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.user_id', 'user_id')
      .addSelect('MIN(attendance.check_in_time)', 'first_check_in')
      .addSelect('MAX(attendance.check_out_time)', 'last_check_out')
      .where('attendance.checkInTime >= :startDate', { startDate: range.start })
      .andWhere('attendance.checkInTime < :endDate', { endDate: range.end })
      .groupBy('attendance.user_id');

    this.applyFacilityFilter(timesByUserQuery, scopeFilter, 'attendance');

    const baseQuery = this.getActiveUsersBaseQuery(scopeFilter, range.end)
      .leftJoin(
        `(${latestByUserQuery.getQuery()})`,
        'latest',
        'latest.user_id = user.id',
      )
      .leftJoin(
        Attendance,
        'attendance',
        'attendance.user_id = user.id AND attendance.check_in_time = latest.latest_check_in',
      )
      .leftJoin(
        `(${timesByUserQuery.getQuery()})`,
        'times',
        'times.user_id = user.id',
      )
      .setParameters(latestByUserQuery.getParameters())
      .setParameters(timesByUserQuery.getParameters());

    this.applyStaffAttendanceSearch(baseQuery, resolvedQuery.search);
    this.applyStaffAttendanceStatusFilter(
      baseQuery,
      attendanceStatus,
      includeAbsentWithStatus,
    );

    const totalRow = await baseQuery
      .clone()
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRow?.count ?? 0);

    const rows = await baseQuery
      .innerJoin(Facility, 'facility', 'facility.id = user.facility_id')
      .select('user.id', 'userId')
      .addSelect('user.first_name', 'firstName')
      .addSelect('user.last_name', 'lastName')
      .addSelect('role.name', 'roleName')
      .addSelect('facility.name', 'facilityName')
      .addSelect('attendance.status', 'attendanceStatus')
      .addSelect('times.first_check_in', 'checkInTime')
      .addSelect('times.last_check_out', 'checkOutTime')
      .orderBy('facility.name', 'ASC')
      .addOrderBy('user.first_name', 'ASC')
      .addOrderBy('user.last_name', 'ASC')
      .addOrderBy('user.id', 'ASC')
      .offset((resolvedQuery.page - 1) * resolvedQuery.limit)
      .limit(resolvedQuery.limit)
      .getRawMany<{
        userId: string;
        firstName: string;
        lastName: string;
        roleName: string | null;
        facilityName: string;
        attendanceStatus: AttendanceStatus | null;
        checkInTime: Date | string | null;
        checkOutTime: Date | string | null;
      }>();

    const records = rows.map((row) => {
      const firstName = row.firstName?.trim() ?? '';
      const lastName = row.lastName?.trim() ?? '';
      const attendanceStatus: StaffAttendanceStatus =
        row.attendanceStatus === AttendanceStatus.CHECKED_IN ||
        row.attendanceStatus === AttendanceStatus.CHECKED_OUT
          ? row.attendanceStatus
          : 'Absent';

      return {
        userId: Number(row.userId),
        name: `${firstName} ${lastName}`.trim(),
        role: row.roleName ?? null,
        facilityName: row.facilityName,
        attendanceStatus,
        checkInTime: row.checkInTime ? new Date(row.checkInTime) : null,
        checkOutTime: row.checkOutTime ? new Date(row.checkOutTime) : null,
      };
    });

    return {
      records,
      pagination: {
        page: resolvedQuery.page,
        limit: resolvedQuery.limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / resolvedQuery.limit) : 0,
        search: resolvedQuery.search ?? null,
      },
    };
  }

  private async countCheckedInUsers(
    range: DateRange,
    scopeFilter?: FacilityScopeFilter,
  ): Promise<number> {
    const latestByUserQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.user_id', 'user_id')
      .addSelect('MAX(attendance.check_in_time)', 'latest_check_in')
      .where('attendance.checkInTime >= :startDate', { startDate: range.start })
      .andWhere('attendance.checkInTime < :endDate', { endDate: range.end })
      .groupBy('attendance.user_id');

    this.applyFacilityFilter(latestByUserQuery, scopeFilter, 'attendance');

    const checkedInQuery = this.attendanceRepository
      .createQueryBuilder('attendance')
      .innerJoin(
        `(${latestByUserQuery.getQuery()})`,
        'latest',
        'latest.user_id = attendance.user_id AND latest.latest_check_in = attendance.check_in_time',
      )
      .innerJoin(User, 'user', 'user.id = attendance.user_id')
      .leftJoin('user.role', 'role')
      .setParameters(latestByUserQuery.getParameters())
      .where('attendance.status = :checkedInStatus', {
        checkedInStatus: AttendanceStatus.CHECKED_IN,
      })
      .andWhere('user.deleted_at IS NULL')
      .andWhere('user.facility_id IS NOT NULL')
      .andWhere('user.status = :approvedStatus', {
        approvedStatus: UserStatus.APPROVED,
      })
      .andWhere('role.name IS DISTINCT FROM :excludedStaffRole', {
        excludedStaffRole: RoleName.FACILITY_INCHARGE,
      });

    this.applyFacilityFilter(checkedInQuery, scopeFilter, 'user');

    const checkedInRow = await checkedInQuery
      .select('COUNT(DISTINCT attendance.user_id)', 'count')
      .getRawOne<{ count: string }>();

    return Number(checkedInRow?.count ?? 0);
  }

  private async countUsersCheckedInRange(
    range: DateRange,
    scopeFilter?: FacilityScopeFilter,
  ): Promise<number> {
    const query = this.getActiveUsersBaseQuery(scopeFilter, range.end)
      .innerJoin(
        Attendance,
        'attendance',
        'attendance.user_id = user.id AND attendance.checkInTime >= :startDate AND attendance.checkInTime < :endDate',
        { startDate: range.start, endDate: range.end },
      )
      .select('COUNT(DISTINCT user.id)', 'count');

    this.applyFacilityFilter(query, scopeFilter, 'attendance');

    const row = await query.getRawOne<{ count: string }>();
    return Number(row?.count ?? 0);
  }

  private applyStaffAttendanceSearch(
    query: SelectQueryBuilder<User>,
    search?: string,
  ) {
    if (!search) return;
    const normalizedSearch = `%${search.toLowerCase()}%`;

    query.andWhere(
      new Brackets((qb) => {
        qb.where('LOWER(user.first_name) LIKE :staffSearch', {
          staffSearch: normalizedSearch,
        })
          .orWhere('LOWER(user.last_name) LIKE :staffSearch', {
            staffSearch: normalizedSearch,
          })
          .orWhere("LOWER(CONCAT(user.first_name, ' ', user.last_name)) LIKE :staffSearch", {
            staffSearch: normalizedSearch,
          })
          .orWhere('LOWER(CAST(role.name AS TEXT)) LIKE :staffSearch', {
            staffSearch: normalizedSearch,
          });
      }),
    );
  }

  private applyStaffAttendanceStatusFilter(
    query: SelectQueryBuilder<User>,
    attendanceStatus?: StaffAttendanceStatus,
    includeAbsentWithStatus = false,
  ) {
    if (!attendanceStatus) return;

    if (attendanceStatus === 'Absent') {
      query.andWhere('attendance.status IS NULL');
      return;
    }

    if (attendanceStatus === AttendanceStatus.CHECKED_OUT && includeAbsentWithStatus) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('attendance.status = :staffAttendanceStatus', {
            staffAttendanceStatus: attendanceStatus,
          }).orWhere('attendance.status IS NULL');
        }),
      );
      return;
    }

    query.andWhere('attendance.status = :staffAttendanceStatus', {
      staffAttendanceStatus: attendanceStatus,
    });
  }

  private resolveStaffAttendanceRecordsQuery(
    pageValue?: number,
    limitValue?: number,
    searchValue?: string,
  ): StaffAttendanceRecordsQuery {
    const parsedPage = Number(pageValue);
    const parsedLimit = Number(limitValue);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const requestedLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const limit = Math.min(100, requestedLimit);
    const search = searchValue?.trim();

    return {
      page,
      limit,
      search: search?.length ? search : undefined,
    };
  }

  private resolveStaffAttendanceSummaryQueries(
    query: GetDashboardQueryDto,
  ): StaffAttendanceSummaryQueries {
    return {
      totalFacilityStaffRecords: this.resolveStaffAttendanceRecordsQuery(
        query.totalFacilityStaffRecordsPage,
        query.totalFacilityStaffRecordsLimit,
        query.totalFacilityStaffRecordsSearch,
      ),
      checkedInUsers: this.resolveStaffAttendanceRecordsQuery(
        query.checkedInUsersPage,
        query.checkedInUsersLimit,
        query.checkedInUsersSearch,
      ),
      checkedOutUsers: this.resolveStaffAttendanceRecordsQuery(
        query.checkedOutUsersPage,
        query.checkedOutUsersLimit,
        query.checkedOutUsersSearch,
      ),
    };
  }

  private async getAppointmentCounts(
    range: DateRange | null,
    scopeFilter?: FacilityScopeFilter,
  ): Promise<{
    total: number;
    completed: number;
    inQueue: number;
    unassigned: number;
  }> {
    const row = await this.buildAppointmentRangeQuery(range, scopeFilter)
      .select('COUNT(1)', 'total')
      .addSelect(
        'COUNT(*) FILTER (WHERE appointment.status = :completedStatus)',
        'completed',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE appointment.status IN (:...queueStatuses))',
        'inQueue',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE appointment.doctor_id IS NULL)',
        'unassigned',
      )
      .setParameters({
        completedStatus: PatientStatus.COMPLETED,
        queueStatuses: [PatientStatus.PENDING, PatientStatus.IN_PROGRESS],
      })
      .getRawOne<{
        total: string;
        completed: string;
        inQueue: string;
        unassigned: string;
      }>();

    return {
      total: Number(row?.total ?? 0),
      completed: Number(row?.completed ?? 0),
      inQueue: Number(row?.inQueue ?? 0),
      unassigned: Number(row?.unassigned ?? 0),
    };
  }

  private async getVisitsByService(
    range: DateRange | null,
    scopeFilter?: FacilityScopeFilter,
  ): Promise<VisitsByService> {
    const rows = await this.buildAppointmentRangeQuery(range, scopeFilter)
      .leftJoin('appointment.appointmentServices', 'appointmentService')
      .leftJoin('appointmentService.service', 'service')
      .select('service.name', 'serviceName')
      .addSelect('COUNT(DISTINCT appointment.id)', 'count')
      .andWhere('service.name IS NOT NULL')
      .groupBy('service.name')
      .getRawMany<{ serviceName: string; count: string }>();

    const mapped = this.emptyVisitsByService();
    for (const row of rows) {
      const key = this.mapServiceNameToDashboardKey(row.serviceName);
      if (!key) continue;
      mapped[key] += Number(row.count ?? 0);
    }

    return mapped;
  }

  private async countPatientRegistrations(
    range: DateRange | null,
    scopeFilter?: FacilityScopeFilter,
  ): Promise<number> {
    if (
      !scopeFilter?.isAllFacilities &&
      scopeFilter?.facilityIds &&
      scopeFilter.facilityIds.length === 0
    ) {
      return 0;
    }

    try {
      const query = this.patientDailyRollupRepository
        .createQueryBuilder('rollup')
        .select('COALESCE(SUM(rollup.patient_count), 0)', 'patient_count');

      if (range) {
        query
          .where('rollup.rollup_date >= DATE(:rollupStart)', {
            rollupStart: range.start,
          })
          .andWhere('rollup.rollup_date <= DATE(:rollupEnd)', {
            rollupEnd: range.end,
          });
      }

      this.applyPatientRollupScopeFilter(query, scopeFilter);

      const row = await query.getRawOne<{ patient_count: string }>();
      return Number(row?.patient_count ?? 0);
    } catch (error) {
      this.logger.warn(
        `Failed to read patient rollup for dashboard: ${(error as Error)?.message}`,
      );
      return 0;
    }
  }

  private applyPatientRollupScopeFilter(
    query: SelectQueryBuilder<PatientDailyRollup>,
    scopeFilter?: FacilityScopeFilter,
  ) {
    if (scopeFilter?.isAllFacilities) {
      query
        .andWhere('rollup.aggregation_type = :rollupAggregationType', {
          rollupAggregationType: PatientDailyRollupType.TOTAL,
        })
        .andWhere('rollup.dimension_id = :rollupDimensionId', {
          rollupDimensionId: 0,
        });

      return;
    }

    if (scopeFilter?.facilityId) {
      query
        .andWhere('rollup.aggregation_type = :rollupAggregationType', {
          rollupAggregationType: PatientDailyRollupType.FACILITY,
        })
        .andWhere('rollup.dimension_id = :rollupDimensionId', {
          rollupDimensionId: scopeFilter.facilityId,
        });
      return;
    }

    if (scopeFilter?.facilityIds && scopeFilter.facilityIds.length > 0) {
      query
        .andWhere('rollup.aggregation_type = :rollupAggregationType', {
          rollupAggregationType: PatientDailyRollupType.FACILITY,
        })
        .andWhere('rollup.dimension_id IN (:...rollupDimensionIds)', {
          rollupDimensionIds: scopeFilter.facilityIds,
        });
      return;
    }
  }

  private buildAppointmentRangeQuery(
    range: DateRange | null,
    scopeFilter?: FacilityScopeFilter,
  ) {
    const query = this.appointmentRepository.createQueryBuilder('appointment');

    if (range) {
      query
        .where('appointment.createdAt >= :startDate', { startDate: range.start, })
        .andWhere('appointment.createdAt < :endDate', { endDate: range.end });
    }

    this.applyFacilityFilter(query, scopeFilter, 'appointment');
    return query;
  }

  private async resolveFacilityScope(user: any, query: GetDashboardQueryDto) {
    const role = user?.role as RoleName | undefined;
    const requestedFacilityId = this.normalizeFacilityId(
      query?.facilityId ?? query?.facility_id,
    );
    const requestedDistrictId = this.normalizeDistrictId(
      query?.districtId,
    );
    const userFacilityId = this.normalizeFacilityId(user?.facilityId);
    const userDistrictId = this.normalizeDistrictId(user?.districtId);

    if (role === RoleName.FACILITY_INCHARGE) {
      if (!userFacilityId) {
        throw new BadRequestException(
          'Facility Incharge does not have a facility assigned.',
        );
      }
      if (requestedFacilityId && requestedFacilityId !== userFacilityId) {
        throw new ForbiddenException(
          'Access denied. Facility Incharge can only access own facility.',
        );
      }
      if (requestedDistrictId) {
        if (!userDistrictId) {
          throw new BadRequestException(
            'Facility Incharge does not have a district assigned.',
          );
        }
        if (requestedDistrictId !== userDistrictId) {
          throw new ForbiddenException(
            'Access denied. Facility Incharge can only access own district.',
          );
        }
      }
      return {
        filter: { facilityId: userFacilityId, isAllFacilities: false },
        scope: {
          role,
          facilityId: userFacilityId,
          districtId: userDistrictId ?? null,
          isAllFacilities: false,
        },
      };
    }

    if (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN || role === RoleName.HEAD_OFFICE) {
      if (requestedFacilityId) {
        if (requestedDistrictId) {
          const facilityBelongsToDistrict = await this.isFacilityInDistrict(
            requestedFacilityId,
            requestedDistrictId,
          );
          if (!facilityBelongsToDistrict) {
            throw new BadRequestException(
              'The provided facilityId does not belong to the requested districtId.',
            );
          }
        }

        return {
          filter: { facilityId: requestedFacilityId, isAllFacilities: false },
          scope: {
            role,
            facilityId: requestedFacilityId,
            districtId: requestedDistrictId ?? null,
            isAllFacilities: false,
          },
        };
      }

      const activeFacilityIds = await this.getActiveFacilityIds(
        requestedDistrictId,
      );
      return {
        filter: {
          facilityIds: activeFacilityIds,
          isAllFacilities: !requestedDistrictId,
        },
        scope: {
          role,
          facilityId: null,
          districtId: requestedDistrictId ?? null,
          isAllFacilities: !requestedDistrictId,
        },
      };
    }

    throw new ForbiddenException(
      'Access denied. Only Super Admin, Admin, Head Office and Facility Incharge can access dashboard.',
    );
  }

  private applyFacilityFilter(
    query: SelectQueryBuilder<any>,
    scopeFilter?: FacilityScopeFilter,
    alias = 'appointment',
  ) {
    if (!scopeFilter) return;

    if (scopeFilter.facilityId) {
      query.andWhere(`${alias}.facility_id = :facilityId`, {
        facilityId: scopeFilter.facilityId,
      });
      return;
    }

    if (!scopeFilter.facilityIds) return;
    if (scopeFilter.facilityIds.length === 0) {
      query.andWhere('1 = 0');
      return;
    }

    query.andWhere(`${alias}.facility_id IN (:...facilityIds)`, {
      facilityIds: scopeFilter.facilityIds,
    });
  }

  private async getActiveFacilityIds(districtId?: number): Promise<number[]> {
    const query = this.facilityRepository
      .createQueryBuilder('facility')
      .innerJoin(
        'facility.users',
        'user',
        'user.deleted_at IS NULL AND user.status = :approvedStatus',
        { approvedStatus: UserStatus.APPROVED },
      )
      .select('facility.id', 'facilityId')
      .groupBy('facility.id');

    if (districtId) {
      query.andWhere('facility.district_id = :districtId', { districtId });
    }

    const rows = await query.getRawMany<{ facilityId: string }>();

    return rows
      .map((row) => Number(row.facilityId))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  private normalizeFacilityId(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private normalizeDistrictId(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private async isFacilityInDistrict(
    facilityId: number,
    districtId: number,
  ): Promise<boolean> {
    const row = await this.facilityRepository
      .createQueryBuilder('facility')
      .select('facility.id', 'id')
      .where('facility.id = :facilityId', { facilityId })
      .andWhere('facility.district_id = :districtId', { districtId })
      .getRawOne<{ id: string }>();

    return Boolean(row?.id);
  }

  private getPktDayRange(reference: Date): {
    range: DateRange;
    pktDate: string;
  } {
    const pktOffsetMs = 5 * 60 * 60 * 1000;
    const pktNow = new Date(reference.getTime() + pktOffsetMs);
    const year = pktNow.getUTCFullYear();
    const month = pktNow.getUTCMonth();
    const day = pktNow.getUTCDate();

    const startUtcMs = Date.UTC(year, month, day) - pktOffsetMs;
    const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;

    return {
      range: {
        start: new Date(startUtcMs),
        end: new Date(endUtcMs),
      },
      pktDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
  }

  private getPktMonthRange(reference: Date): {
    range: DateRange;
    pktMonth: string;
    dayOfMonth: number;
  } {
    const pktOffsetMs = 5 * 60 * 60 * 1000;

    const pktReference = new Date(reference.getTime() + pktOffsetMs);
    const pktNow = new Date(new Date().getTime() + pktOffsetMs);

    const year = pktReference.getUTCFullYear();
    const month = pktReference.getUTCMonth();

    const referenceDay = dayjs.utc(pktReference);
    const today = dayjs.utc(pktNow);

    const isPastMonth = referenceDay.isBefore(today, 'month');
    const dayOfMonth = isPastMonth ? referenceDay.daysInMonth() : today.date();

    const startUtcMs = Date.UTC(year, month, 1) - pktOffsetMs;
    const endUtcMs = Date.UTC(year, month, dayOfMonth + 1) - pktOffsetMs;

    return {
      range: {
        start: new Date(startUtcMs),
        end: new Date(endUtcMs),
      },
      pktMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
      dayOfMonth,
    };
  }

  private emptyVisitsByService(): VisitsByService {
    return {
      OPD: 0,
      ANC: 0,
      PNC: 0,
      Nutrition: 0,
      'Family Planning': 0,
      Immunisation: 0,
      'Medicine Dispensing': 0,
      Delivery: 0,
    };
  }

  private mapServiceNameToDashboardKey(
    serviceName: string,
  ): keyof VisitsByService | undefined {
    const normalized = String(serviceName ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

    const serviceMap: Record<string, keyof VisitsByService> = {
      OPD: 'OPD',
      ANC: 'ANC',
      PNC: 'PNC',
      NUTRITION: 'Nutrition',
      FAMILY_PLANNING: 'Family Planning',
      IMMUNISATION: 'Immunisation',
      IMMUNIZATION: 'Immunisation',
      MEDICINE_DISPENSING: 'Medicine Dispensing',
      DELIVERY: 'Delivery',
    };

    return serviceMap[normalized];
  }
}
