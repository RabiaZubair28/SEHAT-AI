import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Brackets, EntityManager, In, LessThan, Repository, SelectQueryBuilder } from 'typeorm';
import { successResponse } from 'src/common/utils/response.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { assertNewAdministeredCoordinates } from 'src/common/validators/mobile-immunisation-coordinates.validator';
import { Immunisation } from './entities/immunisation.entity';
import { Gender, ImmunisationDailyRollupType, ImmunisationDosageStatus, ImmunisationReportFilterType, PatientRegistrationType, PatientStatus, PlaceOfDelivery, ServiceType, VaccineAppliedTo, VaccineCatchUpMode, VaccineGenderRestriction } from 'src/common/enums/enums';
import { ImmunisationDose } from './entities/immunisation-dosage.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { ImmunisationCard } from './entities/immunisation-card.entity';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateImmunisationWithCardDto } from './dto/create-immunisation-with-card.dto';
import { ImmunisationCardDto } from './dto/immunisation-card.dto';
import { ClosePatientImmunisationDto } from './dto/close-patient-immunisation.dto';
import { UpdatePatientImmunisationRemarksDto } from './dto/update-patient-immunisation-remarks.dto';
import { PatientImmunisation } from './entities/patient-immunisation.entity';
import { Vaccine } from './entities/vaccine.entity';
import { PatientVaccineStatusSnapshot } from './entities/patient-vaccine-status-snapshot.entity';
import { PatientImmunisationFacilityInchargeDto } from './dto/patient-immunisation-facility-incharge.dto';
import { Facility } from 'src/facilities/entities/facility.entity';
import { Division } from 'src/division/entities/division.entity';
import { District } from 'src/districts/entities/district.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { UC } from 'src/uc/entities/uc.entity';
import { PatientsService } from 'src/patients/patients.service';
import type { ReportingFilterDto } from 'src/reporting/dto/reporting-filter.dto';
import { ImmunisationDailyRollup } from './entities/immunisation-daily-rollup.entity';
import {
  ImmunisationVisitResponseDto,
  ImmunisationCardVisitData,
} from './dto/immunisation-visit-response.dto';
import { SYNC_API_LIMIT } from 'src/common/app.constants';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ImmunisationRollupService } from './immunisation-rollup.service';

type ImmunisationReportFilters = ReportingFilterDto & {
  scopeUcId?: number;
  isVaccinatorScope?: boolean;
};

type ImmunisationReportRollupCounts = {
  aggregationType: ImmunisationDailyRollupType;
  dimensionId: number;
  doseCount: number;
  distinctPatientCount: number;
  distinctVaccineCount: number;
  distinctCountsAreDailyAggregates: true;
  completed: boolean;
  lastProcessedId: number;
  highWatermarkId: number;
  progressPercent: number;
};

const IMMUNISATION_ROLLUP_JOB_NAME = 'immunisation-daily-rollup-v1';
const PATIENT_IMMUNISATION_LOOKBACK_INTERVAL =
  "CURRENT_DATE - INTERVAL '1 month'";

@Injectable()
export class ImmunisationService {
  private readonly logger = new Logger(ImmunisationService.name);

  constructor(
    @InjectRepository(Vaccine)
    private readonly vaccineRepository: Repository<Vaccine>,
    @InjectRepository(Immunisation)
    private readonly immunisationRepository: Repository<Immunisation>,
    @InjectRepository(ImmunisationDose)
    private readonly immunisationDoseRepository: Repository<ImmunisationDose>,
    @InjectRepository(ImmunisationDailyRollup)
    private readonly immunisationDailyRollupRepository: Repository<ImmunisationDailyRollup>,
    @InjectRepository(ImmunisationCard)
    private readonly immunisationCardRepository: Repository<ImmunisationCard>,
    @InjectRepository(PatientImmunisation)
    private readonly patientImmunisationRepository: Repository<PatientImmunisation>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Taluka)
    private readonly talukaRepository: Repository<Taluka>,
    @InjectRepository(UC)
    private readonly ucRepository: Repository<UC>,
    @Inject(forwardRef(() => PatientsService))
    private readonly patientsService: PatientsService,
    @Inject(forwardRef(() => ServiceUtility))
    private readonly serviceUtility: ServiceUtility,
    private readonly immunisationRollupService: ImmunisationRollupService,
  ) { }

  private async incrementRollupsForCreatedDoses(
    doses: ImmunisationDose[],
    entityManager: EntityManager,
  ): Promise<void> {
    for (const dose of doses) {
      await this.immunisationRollupService.incrementForCreatedDose(
        dose.id,
        entityManager,
      );
    }
  }

  async getImmunisationReport(filters: ImmunisationReportFilters) {
    try {
      const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters?.limit) > 0 ? Number(filters.limit) : 10;
      const skip = (page - 1) * limit;
      const facilityId = Number(filters?.facilityId ?? filters?.facility_id);
      const patientId = Number(filters?.patientId);
      const divisionId = Number(filters?.divisionId);
      const districtId = Number(filters?.districtId);
      const talukaId = Number(filters?.talukaId);
      const ucId =
        filters?.isVaccinatorScope === true
          ? Number(filters?.scopeUcId)
          : Number(filters?.ucId);
      const vaccineId = Number(filters?.vaccineId);
      const vaccineCode =
        typeof filters?.vaccineCode === 'string'
          ? filters.vaccineCode.trim()
          : '';
      const search =
        typeof filters?.search === 'string' ? filters.search.trim() : '';

      console.log('[Immunisation Report] API query:', {
        page,
        limit,
        dateFrom: filters?.dateFrom ?? null,
        dateTo: filters?.dateTo ?? null,
        facilityId: Number.isNaN(facilityId) ? null : facilityId,
        divisionId: Number.isNaN(divisionId) ? null : divisionId,
        districtId: Number.isNaN(districtId) ? null : districtId,
        talukaId: Number.isNaN(talukaId) ? null : talukaId,
        ucId: Number.isNaN(ucId) ? null : ucId,
        vaccineId: Number.isNaN(vaccineId) ? null : vaccineId,
        patientId: Number.isNaN(patientId) ? null : patientId,
        doctorId: filters?.doctorId ?? null,
        gender: filters?.gender ?? null,
        hasSearch: search.length > 0,
      });

      const baseQuery = this.immunisationDoseRepository
        .createQueryBuilder('dose')
        .innerJoin('dose.patient', 'patient')
        .innerJoin('dose.vaccine', 'vaccine')
        .innerJoin('dose.vaccinatedBy', 'doctor');

      baseQuery.andWhere('vaccine.isActive = :isActive', { isActive: true });

      if (filters?.dateFrom) {
        baseQuery.andWhere('dose.dateAdministered >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters?.dateTo) {
        baseQuery.andWhere('dose.dateAdministered <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      if (vaccineId) {
        baseQuery.andWhere('vaccine.id = :vaccineId', {
          vaccineId: Number(vaccineId),
        });
      }

      if (filters?.doctorId) {
        baseQuery.andWhere('doctor.id = :doctorId', {
          doctorId: Number(filters.doctorId),
        });
      }

      if (!Number.isNaN(patientId) && patientId > 0) {
        baseQuery.andWhere('patient.id = :patientId', {
          patientId,
        });
      }

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        baseQuery.andWhere('patient.facility_id = :facilityId', {
          facilityId,
        });
      }

      if (!Number.isNaN(divisionId) && divisionId > 0) {
        baseQuery.andWhere('patient.division_id = :divisionId', {
          divisionId,
        });
      }

      if (!Number.isNaN(districtId) && districtId > 0) {
        baseQuery.andWhere('patient.district_id = :districtId', {
          districtId,
        });
      }

      if (!Number.isNaN(talukaId) && talukaId > 0) {
        baseQuery.andWhere('patient.taluka_id = :talukaId', {
          talukaId,
        });
      }

      if (!Number.isNaN(ucId) && ucId > 0) {
        baseQuery.andWhere('patient.uc_id = :ucId', {
          ucId,
        });
      }

      if (filters?.gender) {
        baseQuery.andWhere('patient.gender = :gender', {
          gender: filters.gender,
        });
      }

      if (search) {
        baseQuery.andWhere(
          new Brackets((searchQuery) => {
            searchQuery
              // TODO: CONCAT prevents index usage on first_name/last_name
              .where(
                "CONCAT(patient.first_name, ' ', patient.last_name) ILIKE :search",
                { search: `%${search}%` },
              )
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.phone_number LIKE :search', {
                search: `${search}%`,
              })
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.mr_no LIKE :search', {
                search: `${search}%`,
              })
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.cnic LIKE :search', {
                search: `${search}%`,
              })
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.immunisation_number LIKE :search', {
                search: `${search}%`,
              });
          }),
        );
      }

      const rollupCounts = await this.getImmunisationReportRollupCounts({
        filters,
        facilityId,
        patientId,
        divisionId,
        districtId,
        talukaId,
        ucId,
        vaccineId,
        vaccineCode,
        search,
      });
      const countRow = rollupCounts
        ? null
        : await baseQuery
          .clone()
          .select('COUNT(DISTINCT dose.id)', 'count')
          .getRawOne();
      const count = rollupCounts?.doseCount ?? Number(countRow?.count ?? 0);
      console.log(
        `[Immunisation Report] Count source: ${rollupCounts ? 'daily rollup' : 'immunisation_doses fallback'}.`,
      );

      const dataQuery = baseQuery
        .clone()
        .select('dose.id', 'dose_id')
        .addSelect('patient.id', 'patient_id')
        .addSelect('patient.first_name', 'patient_first_name')
        .addSelect('patient.last_name', 'patient_last_name')
        .addSelect('vaccine.code', 'vaccine_code')
        .addSelect('vaccine.display_name', 'vaccine_name')
        .addSelect('vaccine.dose_number', 'dose_number')
        .addSelect('dose.dateAdministered', 'date_administered')
        .addSelect('doctor.id', 'doctor_id')
        .addSelect('doctor.first_name', 'doctor_first_name')
        .addSelect('doctor.last_name', 'doctor_last_name');

      console.log('[Immunisation Report] Detail SQL:', dataQuery.getSql());
      const data = await dataQuery
        .offset(skip)
        .limit(limit)
        .getRawMany();

      const [
        distinctPatientCountRow,
        distinctVaccineCountRow,
        vaccineSummaryRows,
        divisionAdministeredPatientCountRows,
        districtAdministeredPatientCountRows,
        talukaAdministeredPatientCountRows,
        ucAdministeredPatientCountRows,
      ] = await Promise.all([
        rollupCounts
          ? Promise.resolve({ distinct_patient_count: rollupCounts.distinctPatientCount })
          : baseQuery
            .clone()
            .select('COUNT(DISTINCT patient.id)', 'distinct_patient_count')
            .getRawOne(),
        rollupCounts
          ? Promise.resolve({ distinct_vaccine_count: rollupCounts.distinctVaccineCount })
          : baseQuery
            .clone()
            .select('COUNT(DISTINCT vaccine.display_name)', 'distinct_vaccine_count')
            .getRawOne(),
        rollupCounts
          ? Promise.resolve([])
          : baseQuery
            .clone()
            .select('vaccine.display_name', 'vaccine_name')
            .addSelect('COUNT(dose.id)', 'dose_count')
            .groupBy('vaccine.display_name')
            .orderBy('dose_count', 'DESC')
            .addOrderBy('vaccine.display_name', 'ASC')
            .getRawMany(),
        rollupCounts
          ? Promise.resolve([])
          : baseQuery
            .clone()
            .leftJoin(Division, 'division', 'division.id = patient.division_id')
            .select('division.id', 'division_id')
            .addSelect('division.name', 'division_name')
            .addSelect('COUNT(DISTINCT patient.id)', 'administered_patient_count')
            .andWhere('patient.division_id IS NOT NULL')
            .groupBy('division.id')
            .addGroupBy('division.name')
            .orderBy('administered_patient_count', 'DESC')
            .addOrderBy('division.name', 'ASC')
            .getRawMany(),
        rollupCounts
          ? Promise.resolve([])
          : baseQuery
            .clone()
            .leftJoin(District, 'district', 'district.id = patient.district_id')
            .select('district.id', 'district_id')
            .addSelect('district.name', 'district_name')
            .addSelect('COUNT(DISTINCT patient.id)', 'administered_patient_count')
            .andWhere('patient.district_id IS NOT NULL')
            .groupBy('district.id')
            .addGroupBy('district.name')
            .orderBy('administered_patient_count', 'DESC')
            .addOrderBy('district.name', 'ASC')
            .getRawMany(),
        rollupCounts
          ? Promise.resolve([])
          : baseQuery
            .clone()
            .leftJoin(Taluka, 'taluka', 'taluka.id = patient.taluka_id')
            .select('taluka.id', 'taluka_id')
            .addSelect('taluka.name', 'taluka_name')
            .addSelect('COUNT(DISTINCT patient.id)', 'administered_patient_count')
            .andWhere('patient.taluka_id IS NOT NULL')
            .groupBy('taluka.id')
            .addGroupBy('taluka.name')
            .orderBy('administered_patient_count', 'DESC')
            .addOrderBy('taluka.name', 'ASC')
            .getRawMany(),
        rollupCounts
          ? Promise.resolve([])
          : baseQuery
            .clone()
            .leftJoin(UC, 'uc', 'uc.id = patient.uc_id')
            .select('uc.id', 'uc_id')
            .addSelect('uc.name', 'uc_name')
            .addSelect('COUNT(DISTINCT patient.id)', 'administered_patient_count')
            .andWhere('patient.uc_id IS NOT NULL')
            .groupBy('uc.id')
            .addGroupBy('uc.name')
            .orderBy('administered_patient_count', 'DESC')
            .addOrderBy('uc.name', 'ASC')
            .getRawMany(),
      ]);

      const vaccineSummary = vaccineSummaryRows.map((row) => ({
        vaccineName: row.vaccine_name,
        doseCount: Number(row.dose_count),
      }));
      const divisionAdministeredPatientCount =
        divisionAdministeredPatientCountRows.map((row) => ({
          divisionId: row.division_id ? Number(row.division_id) : null,
          divisionName: row.division_name ?? null,
          administeredPatientCount: Number(row.administered_patient_count ?? 0),
        }));
      const districtAdministeredPatientCount =
        districtAdministeredPatientCountRows.map((row) => ({
          districtId: row.district_id ? Number(row.district_id) : null,
          districtName: row.district_name ?? null,
          administeredPatientCount: Number(row.administered_patient_count ?? 0),
        }));
      const talukaAdministeredPatientCount =
        talukaAdministeredPatientCountRows.map((row) => ({
          talukaId: row.taluka_id ? Number(row.taluka_id) : null,
          talukaName: row.taluka_name ?? null,
          administeredPatientCount: Number(row.administered_patient_count ?? 0),
        }));
      const ucAdministeredPatientCount = ucAdministeredPatientCountRows.map(
        (row) => ({
          ucId: row.uc_id ? Number(row.uc_id) : null,
          ucName: row.uc_name ?? null,
          administeredPatientCount: Number(row.administered_patient_count ?? 0),
        }),
      );
      const mostUsedVaccine = vaccineSummary.length
        ? {
          vaccineName: vaccineSummary[0].vaccineName,
          doseCount: vaccineSummary[0].doseCount,
        }
        : null;

      return successResponse(
        {
          reportFilterType: filters?.immunisationType ?? null,
          records: data.map((row) => ({
            doseId: Number(row.dose_id),
            patientId: Number(row.patient_id),
            patientName: `${row.patient_first_name ?? ''} ${row.patient_last_name ?? ''}`.trim(),
            vaccineCode: row.vaccine_code,
            vaccineName: row.vaccine_name,
            doseNumber: row.dose_number ? Number(row.dose_number) : null,
            dateAdministered: row.date_administered,
            doctorId: row.doctor_id ? Number(row.doctor_id) : null,
            doctorName:
              row.doctor_first_name || row.doctor_last_name
                ? `${row.doctor_first_name ?? ''} ${row.doctor_last_name ?? ''}`.trim()
                : null,
          })),
          distinctPatientCount: Number(
            distinctPatientCountRow?.distinct_patient_count ?? 0,
          ),
          distinctVaccineCount: Number(
            distinctVaccineCountRow?.distinct_vaccine_count ?? 0,
          ),
          rollupCounts,
          mostUsedVaccine,
          vaccineSummary,
          divisionAdministeredPatientCount,
          districtAdministeredPatientCount,
          talukaAdministeredPatientCount,
          ucAdministeredPatientCount,
        },
        count === 0 ? 'No Data Found' : 'Immunisation report fetched successfully',
        200,
        page,
        limit,
        count,
      );
    } catch (error) {
      this.logger.error('Failed to fetch immunisation report', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch immunisation report',
      );
    }
  }

  private async getImmunisationReportRollupCounts(params: {
    filters: ImmunisationReportFilters;
    facilityId: number;
    patientId: number;
    divisionId: number;
    districtId: number;
    talukaId: number;
    ucId: number;
    vaccineId: number;
    vaccineCode: string;
    search: string;
  }): Promise<ImmunisationReportRollupCounts | null> {
    const {
      filters,
      facilityId,
      patientId,
      divisionId,
      districtId,
      talukaId,
      ucId,
      vaccineId,
      vaccineCode,
      search,
    } = params;

    if (
      patientId > 0 ||
      Number(filters?.doctorId) > 0 ||
      !!filters?.gender ||
      !!search ||
      !!vaccineCode
    ) {
      return null;
    }

    const dimensions = [
      { type: ImmunisationDailyRollupType.VACCINE, id: vaccineId },
      { type: ImmunisationDailyRollupType.FACILITY, id: facilityId },
      { type: ImmunisationDailyRollupType.DIVISION, id: divisionId },
      { type: ImmunisationDailyRollupType.DISTRICT, id: districtId },
      { type: ImmunisationDailyRollupType.TALUKA, id: talukaId },
      { type: ImmunisationDailyRollupType.UC, id: ucId },
    ].filter((dimension) => Number.isInteger(dimension.id) && dimension.id > 0);

    if (dimensions.length > 1) return null;

    const aggregationType =
      dimensions[0]?.type ?? ImmunisationDailyRollupType.TOTAL;
    const dimensionId = dimensions[0]?.id ?? 0;

    try {
      const query = this.immunisationDailyRollupRepository
        .createQueryBuilder('rollup')
        .select('COALESCE(SUM(rollup.doseCount), 0)', 'dose_count')
        .addSelect('COALESCE(SUM(rollup.distinctPatientCount), 0)', 'distinct_patient_count')
        .addSelect('COALESCE(SUM(rollup.distinctVaccineCount), 0)', 'distinct_vaccine_count')
        .addSelect(
          `EXISTS (
            SELECT 1
            FROM immunisation_rollup_checkpoint checkpoint
            WHERE checkpoint.job_name = :rollupJobName
          )`,
          'rollup_checkpoint_exists',
        )
        .addSelect(
          `(SELECT checkpoint.completed
            FROM immunisation_rollup_checkpoint checkpoint
            WHERE checkpoint.job_name = :rollupJobName)`,
          'rollup_completed',
        )
        .addSelect(
          `(SELECT checkpoint.last_processed_id
            FROM immunisation_rollup_checkpoint checkpoint
            WHERE checkpoint.job_name = :rollupJobName)`,
          'last_processed_id',
        )
        .addSelect(
          `(SELECT checkpoint.high_watermark_id
            FROM immunisation_rollup_checkpoint checkpoint
            WHERE checkpoint.job_name = :rollupJobName)`,
          'high_watermark_id',
        )
        .where('rollup.aggregationType = :aggregationType', { aggregationType })
        .andWhere('rollup.dimensionId = :dimensionId', { dimensionId })
        .setParameter('rollupJobName', IMMUNISATION_ROLLUP_JOB_NAME);

      if (filters?.dateFrom) {
        query.andWhere('rollup.rollupDate >= :rollupDateFrom', {
          rollupDateFrom: filters.dateFrom,
        });
      }
      if (filters?.dateTo) {
        query.andWhere('rollup.rollupDate <= :rollupDateTo', {
          rollupDateTo: filters.dateTo,
        });
      }

      console.log('[Immunisation Report] Rollup SQL:', query.getSql());
      const row: {
        dose_count: string;
        distinct_patient_count: string;
        distinct_vaccine_count: string;
        rollup_checkpoint_exists: boolean;
        rollup_completed: boolean;
        last_processed_id: string;
        high_watermark_id: string;
      } | undefined = await query.getRawOne();

      if (!row || row.rollup_checkpoint_exists !== true) return null;

      const lastProcessedId = Number(row.last_processed_id ?? 0);
      const highWatermarkId = Number(row.high_watermark_id ?? 0);

      return {
        aggregationType,
        dimensionId,
        doseCount: Number(row.dose_count ?? 0),
        distinctPatientCount: Number(row.distinct_patient_count ?? 0),
        distinctVaccineCount: Number(row.distinct_vaccine_count ?? 0),
        distinctCountsAreDailyAggregates: true,
        completed: row.rollup_completed === true,
        lastProcessedId,
        highWatermarkId,
        progressPercent:
          highWatermarkId > 0
            ? Number(((lastProcessedId / highWatermarkId) * 100).toFixed(4))
            : 100,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Unable to use immunisation rollup counts; falling back to source queries: ${(error as Error)?.message}`,
      );
      return null;
    }
  }

  async getImmunisationTypeExportReport(filters: any) {
    try {
      const immunisationType = filters?.immunisationType as
        | ImmunisationReportFilterType
        | undefined;

      if (!immunisationType) {
        throw new BadRequestException('immunisationType is required.');
      }

      const facilityId = Number(filters?.facilityId ?? filters?.facility_id);
      const ucId =
        filters?.isVaccinatorScope === true
          ? Number(filters?.scopeUcId)
          : Number.NaN;
      const patientId = Number(filters?.patientId);
      const search =
        typeof filters?.search === 'string' ? filters.search.trim() : '';
      const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters?.limit) > 0 ? Number(filters.limit) : 10;

      if (immunisationType === ImmunisationReportFilterType.NO_DOSE) {
        return this.getNoDoseImmunisationExportReport({
          facilityId,
          ucId,
          patientId,
          search,
          dateFrom: filters?.dateFrom,
          dateTo: filters?.dateTo,
          immunisationType,
          page,
          limit,
        });
      }

      const summaryStatus =
        immunisationType === ImmunisationReportFilterType.DEFAULTER
          ? ImmunisationDosageStatus.DEFAULTER
          : ImmunisationDosageStatus.SCHEDULED;

      return this.getPatientImmunisationStatusExportReport({
        facilityId,
        ucId,
        patientId,
        search,
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo,
        immunisationType,
        summaryStatus,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error(
        'Failed to fetch immunisation export report',
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch immunisation export report',
      );
    }
  }

  private async getPatientImmunisationStatusExportReport(params: {
    facilityId: number;
    ucId: number;
    patientId: number;
    search: string;
    dateFrom?: string;
    dateTo?: string;
    immunisationType: ImmunisationReportFilterType;
    summaryStatus: ImmunisationDosageStatus;
    page: number;
    limit: number;
  }) {
    const {
      facilityId,
      ucId,
      patientId,
      search,
      dateFrom,
      dateTo,
      immunisationType,
      summaryStatus,
      page,
      limit,
    } = params;
    const skip = (page - 1) * limit;

    const baseQuery = this.patientImmunisationRepository
      .createQueryBuilder('patientImmunisation')
      .leftJoin('patientImmunisation.patient', 'patient')
      .where('patientImmunisation.status = :summaryStatus', { summaryStatus });

    this.applyImmunisationExportPatientFilters(baseQuery, 'patient', {
      facilityId,
      ucId,
      patientId,
      search,
    });

    if (dateFrom) {
      baseQuery.andWhere(
        'DATE(COALESCE(patientImmunisation.updated_at, patientImmunisation.created_at)) >= :dateFrom',
        { dateFrom },
      );
    }

    if (dateTo) {
      baseQuery.andWhere(
        'DATE(COALESCE(patientImmunisation.updated_at, patientImmunisation.created_at)) <= :dateTo',
        { dateTo },
      );
    }

    const total = await baseQuery.clone().getCount();
    const rows = await baseQuery
      .clone()
      .select('patientImmunisation.id', 'summary_id')
      .addSelect('patient.id', 'patient_id')
      .addSelect('patient.first_name', 'patient_first_name')
      .addSelect('patient.last_name', 'patient_last_name')
      .addSelect('patient.mr_no', 'patient_mr_no')
      .addSelect('patient.phone_number', 'patient_phone_number')
      .addSelect('patient.immunisation_number', 'patient_immunisation_number')
      .addSelect('patient.dob', 'patient_dob')
      .addSelect('patientImmunisation.status', 'summary_status')
      .addSelect('patientImmunisation.nextDueDate', 'next_due_date')
      .addSelect('patientImmunisation.remarks', 'remarks')
      .addSelect(
        'COALESCE(patientImmunisation.updated_at, patientImmunisation.created_at)',
        'activity_date',
      )
      .orderBy(
        'COALESCE(patientImmunisation.updated_at, patientImmunisation.created_at)',
        'DESC',
      )
      .addOrderBy('patientImmunisation.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawMany();

    const records = rows.map((row) => ({
      summaryId: Number(row.summary_id),
      patientId: Number(row.patient_id),
      patientName: `${row.patient_first_name ?? ''} ${row.patient_last_name ?? ''}`.trim(),
      patientMrNo: row.patient_mr_no ?? null,
      patientPhoneNumber: row.patient_phone_number ?? null,
      patientDob: row.patient_dob ?? null,
      immunisationNumber: row.patient_immunisation_number ?? null,
      status: row.summary_status,
      nextDueDate: row.next_due_date ?? null,
      remarks: row.remarks ?? null,
      activityDate: row.activity_date ?? null,
      immunisationType,
    }));

    return successResponse(
      {
        reportFilterType: immunisationType,
        dateFrom,
        dateTo,
        recordCount: records.length,
        distinctPatientCount: new Set(records.map((record) => record.patientId))
          .size,
        records,
      },
      records.length === 0
        ? 'No Data Found'
        : `${immunisationType} immunisation export fetched successfully`,
      200,
      page,
      limit,
      total,
    );
  }

  private async getNoDoseImmunisationExportReport(params: {
    facilityId: number;
    ucId: number;
    patientId: number;
    search: string;
    dateFrom?: string;
    dateTo?: string;
    immunisationType: ImmunisationReportFilterType;
    page: number;
    limit: number;
  }) {
    const { facilityId, ucId, patientId, search, dateFrom, dateTo, immunisationType, page, limit } =
      params;
    const skip = (page - 1) * limit;

    const baseQuery = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoin('patient.patientImmunisations', 'patientImmunisation')
      .where('patientImmunisation.id IS NULL');

    this.applyImmunisationExportPatientFilters(baseQuery, 'patient', {
      facilityId,
      ucId,
      patientId,
      search,
    });

    if (dateFrom) {
      baseQuery.andWhere(
        'DATE(COALESCE(patient.updated_at, patient.created_at)) >= :dateFrom',
        { dateFrom },
      );
    }

    if (dateTo) {
      baseQuery.andWhere(
        'DATE(COALESCE(patient.updated_at, patient.created_at)) <= :dateTo',
        { dateTo },
      );
    }

    const total = await baseQuery.clone().getCount();
    const rows = await baseQuery
      .clone()
      .select('patient.id', 'patient_id')
      .addSelect('patient.first_name', 'patient_first_name')
      .addSelect('patient.last_name', 'patient_last_name')
      .addSelect('patient.mr_no', 'patient_mr_no')
      .addSelect('patient.phone_number', 'patient_phone_number')
      .addSelect('patient.immunisation_number', 'patient_immunisation_number')
      .addSelect('patient.dob', 'patient_dob')
      .addSelect(
        'COALESCE(patient.updated_at, patient.created_at)',
        'activity_date',
      )
      .orderBy('COALESCE(patient.updated_at, patient.created_at)', 'DESC')
      .addOrderBy('patient.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawMany();

    const records = rows.map((row) => ({
      patientId: Number(row.patient_id),
      patientName: `${row.patient_first_name ?? ''} ${row.patient_last_name ?? ''}`.trim(),
      patientMrNo: row.patient_mr_no ?? null,
      patientPhoneNumber: row.patient_phone_number ?? null,
      patientDob: row.patient_dob ?? null,
      immunisationNumber: row.patient_immunisation_number ?? null,
      status: immunisationType,
      activityDate: row.activity_date ?? null,
      immunisationType,
    }));

    return successResponse(
      {
        reportFilterType: immunisationType,
        dateFrom,
        dateTo,
        recordCount: records.length,
        distinctPatientCount: new Set(records.map((record) => record.patientId))
          .size,
        records,
      },
      records.length === 0
        ? 'No Data Found'
        : `${immunisationType} immunisation export fetched successfully`,
      200,
      page,
      limit,
      total,
    );
  }

  private applyImmunisationExportPatientFilters(
    query: SelectQueryBuilder<any>,
    patientAlias: string,
    params: {
      facilityId: number;
      ucId: number;
      patientId: number;
      search: string;
    },
  ): void {
    const { facilityId, ucId, patientId, search } = params;

    if (!Number.isNaN(patientId) && patientId > 0) {
      query.andWhere(`${patientAlias}.id = :patientId`, {
        patientId,
      });
    }

    if (!Number.isNaN(facilityId) && facilityId > 0) {
      query.andWhere(`${patientAlias}.facility_id = :facilityId`, {
        facilityId,
      });
    }

    if (!Number.isNaN(ucId) && ucId > 0) {
      query.andWhere(`${patientAlias}.uc_id = :ucId`, {
        ucId,
      });
    }

    if (search) {
      query.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            // TODO: CONCAT prevents index usage on first_name/last_name
            .where(
              `CONCAT(${patientAlias}.first_name, ' ', ${patientAlias}.last_name) ILIKE :search`,
              { search: `%${search}%` },
            )
            // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
            .orWhere(`${patientAlias}.phone_number LIKE :search`, {
              search: `${search}%`,
            })
            // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
            .orWhere(`${patientAlias}.mr_no LIKE :search`, {
              search: `${search}%`,
            })
            // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
            .orWhere(`${patientAlias}.immunisation_number LIKE :search`, {
              search: `${search}%`,
            });
        }),
      );
    }
  }

  async getVaccines(filters: any) {
    try {
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10) || 10;
      const skip = (page - 1) * limit;
      let patientId: number | undefined;
      if (filters.patientId !== undefined && filters.patientId !== null) {
        const parsedPatientId = Number(filters.patientId);
        if (Number.isNaN(parsedPatientId) || parsedPatientId <= 0) {
          throw new BadRequestException('Invalid patientId provided');
        }
        patientId = parsedPatientId;
      }

      const queryBuilder = this.vaccineRepository.createQueryBuilder('vaccine');

      queryBuilder.where('vaccine.isActive = :isActive', { isActive: true });

      if (filters.name) {
        queryBuilder.andWhere('vaccine.code ILIKE :name', {
          name: `%${filters.name}%`,
        });
      }

      if (filters.doseNumber !== undefined) {
        const doseNumbers = (Array.isArray(filters.doseNumber)
            ? filters.doseNumber
            : [filters.doseNumber]
        )
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n));

        if (doseNumbers.length) {
          queryBuilder.andWhere('vaccine.dose_number IN (:...dose_numbers)', {
            dose_numbers: doseNumbers,
          });
        }
      }
      if (filters.appliesTo) {
        queryBuilder.andWhere('vaccine.applies_to = :applies_to', {
          applies_to: filters.appliesTo,
        });
      }

      let data: Vaccine[] = [];
      let count = 0;

      if (patientId) {
        data = await queryBuilder
          .orderBy('vaccine.order', 'ASC')
          .getMany();
        count = data.length;
      } else {
        const [paged, total] = await queryBuilder
          .orderBy('vaccine.order', 'ASC')
          .skip(skip)
          .take(limit)
          .getManyAndCount();
        data = paged;
        count = total;
      }

      let vaccinesWithStatus = data as Array<
        Vaccine & {
        immunisationDosageStatus?: ImmunisationDosageStatus;
        dateAdministered?: Date | null;
        dueDate?: Date | null;
      }
      >;

      if (patientId) {
        const patient = await this.patientRepository.findOne({
          where: { id: patientId },
          select: ['id', 'dob', 'gender'],
        });
        const dobDate = patient?.dob ? new Date(patient.dob) : null;
        if (dobDate) {
          dobDate.setHours(0, 0, 0, 0);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ageInDays =
          dobDate ? Math.floor((today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const maxChildAgeDays = 365 * 5;

        const administeredDateMap = new Map<number, Date>();
        const statusMap = await this.serviceUtility.calculateImmunisationDosageStatuses(
          patientId,
          data,
          undefined,
          administeredDateMap,
        );
        const latestAdminDateByCode = new Map<string, Date>();
        for (const vaccine of data) {
          const administered = administeredDateMap.get(vaccine.id);
          if (!administered) continue;
          const normalized = new Date(administered);
          normalized.setHours(0, 0, 0, 0);
          const existingByCode = latestAdminDateByCode.get(vaccine.code);
          if (!existingByCode || normalized > existingByCode) {
            latestAdminDateByCode.set(vaccine.code, normalized);
          }
        }
        const vaccinesWithStatusAll = data.map((vaccine) => ({
          ...vaccine,
          immunisationDosageStatus: undefined,
          dateAdministered: administeredDateMap.get(vaccine.id) ?? null,
          dueDate: undefined,
        })).map((vaccine) => {
          const rawStatus = statusMap.get(vaccine.id);
          const computedDueDate = (() => {
            const status = statusMap.get(vaccine.id);
            if (
              !status ||
              ![
                ImmunisationDosageStatus.SCHEDULED,
                ImmunisationDosageStatus.DEFAULTER,
                ImmunisationDosageStatus.PENDING,
                ImmunisationDosageStatus.ADMINISTERED,
              ].includes(status)
            ) {
              return null;
            }

            const ageMinDays = vaccine.age_min_days ?? 0;
            if (vaccine.applies_to === VaccineAppliedTo.CHILD) {
              if (!dobDate) return null;
              const latestPrerequisiteDate = vaccine.pre_requisite_codes?.length
                ? vaccine.pre_requisite_codes
                .map((code) => latestAdminDateByCode.get(code))
                .filter((date): date is Date => !!date)
                .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
                : null;
              if (vaccine.pre_requisite_codes?.length && !latestPrerequisiteDate) {
                return null;
              }
              if (
                (ageInDays !== null && ageInDays > maxChildAgeDays) ||
                (vaccine.max_age_days !== null &&
                  vaccine.max_age_days !== undefined &&
                  ageInDays !== null &&
                  ageInDays > vaccine.max_age_days)
              ) {
                return null;
              }

              const childRequiredMinDays = (() => {
                if (
                  ageInDays !== null &&
                  ageInDays >= 365 * 2 &&
                  vaccine.catch_up_above_2_mode === VaccineCatchUpMode.AFTER_INTERVAL &&
                  vaccine.catch_up_above_2_interval_days !== null &&
                  vaccine.catch_up_above_2_interval_days !== undefined
                ) {
                  return vaccine.catch_up_above_2_interval_days;
                }
                if (
                  ageInDays !== null &&
                  ageInDays >= 365 &&
                  vaccine.catch_up_1_to_2_mode === VaccineCatchUpMode.AFTER_INTERVAL &&
                  vaccine.catch_up_1_to_2_interval_days !== null &&
                  vaccine.catch_up_1_to_2_interval_days !== undefined
                ) {
                  return vaccine.catch_up_1_to_2_interval_days;
                }
                return ageMinDays;
              })();

              return this.addDays(
                latestPrerequisiteDate ?? dobDate,
                childRequiredMinDays,
              );
            }

            const latestPrerequisiteDate = vaccine.pre_requisite_codes?.length
              ? vaccine.pre_requisite_codes
              .map((code) => latestAdminDateByCode.get(code))
              .filter((date): date is Date => !!date)
              .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
              : null;
            const anchor = latestPrerequisiteDate ?? dobDate ?? null;
            if (!anchor) return null;
            return this.addDays(anchor, ageMinDays);
          })();

          const isMaxAgeExceeded =
            ageInDays !== null &&
            vaccine.max_age_days !== null &&
            vaccine.max_age_days !== undefined &&
            ageInDays > vaccine.max_age_days;

          const finalStatus =
            rawStatus !== ImmunisationDosageStatus.ADMINISTERED &&
            rawStatus !== ImmunisationDosageStatus.RETRO &&
            isMaxAgeExceeded
              ? ImmunisationDosageStatus.EXPIRED
              : vaccine.applies_to === VaccineAppliedTo.ADULT &&
              computedDueDate &&
              computedDueDate > today &&
              rawStatus !== ImmunisationDosageStatus.EXPIRED
                ? ImmunisationDosageStatus.PENDING
                : rawStatus;

          return {
            ...vaccine,
            immunisationDosageStatus: finalStatus,
            dueDate:
              [
                ImmunisationDosageStatus.ADMINISTERED,
                ImmunisationDosageStatus.RETRO,
                ImmunisationDosageStatus.PENDING,
                ImmunisationDosageStatus.EXPIRED,
              ].includes(finalStatus as ImmunisationDosageStatus)
                ? null
                : computedDueDate,
          };
        });

        const seriesStartAgeByGroup = new Map<string, number>();
        for (const vaccine of vaccinesWithStatusAll) {
          const groupKey = (vaccine.series_name ?? vaccine.display_name ?? vaccine.code)
            .trim()
            .toLowerCase();
          const isSeriesStart =
            vaccine.dose_number === 1 || !(vaccine.pre_requisite_codes?.length);
          const candidateAge = vaccine.age_min_days ?? 0;
          const existingAge = seriesStartAgeByGroup.get(groupKey);

          if (
            existingAge === undefined ||
            (isSeriesStart && candidateAge < existingAge)
          ) {
            seriesStartAgeByGroup.set(groupKey, candidateAge);
          }
        }

        const statusPriority: Record<string, number> = {
          [ImmunisationDosageStatus.ADMINISTERED]: 0,
          [ImmunisationDosageStatus.RETRO]: 0,
          [ImmunisationDosageStatus.DEFAULTER]: 1,
          [ImmunisationDosageStatus.SCHEDULED]: 2,
          [ImmunisationDosageStatus.PENDING]: 3,
          [ImmunisationDosageStatus.EXPIRED]: 4,
        };

        const sortedVaccines = [...vaccinesWithStatusAll].sort((a, b) => {
          const aRank = statusPriority[a.immunisationDosageStatus ?? ''] ?? Number.MAX_SAFE_INTEGER;
          const bRank = statusPriority[b.immunisationDosageStatus ?? ''] ?? Number.MAX_SAFE_INTEGER;
          if (aRank !== bRank) return aRank - bRank;
          const groupA = (a.series_name ?? a.display_name ?? a.code).trim().toLowerCase();
          const groupB = (b.series_name ?? b.display_name ?? b.code).trim().toLowerCase();
          const ageA = seriesStartAgeByGroup.get(groupA) ?? (a.age_min_days ?? 0);
          const ageB = seriesStartAgeByGroup.get(groupB) ?? (b.age_min_days ?? 0);
          if (ageA !== ageB) return ageA - ageB;
          if (groupA !== groupB) return groupA.localeCompare(groupB);
          const doseA = a.dose_number ?? Number.MAX_SAFE_INTEGER;
          const doseB = b.dose_number ?? Number.MAX_SAFE_INTEGER;
          if (doseA !== doseB) return doseA - doseB;
          return a.id - b.id;
        });

        vaccinesWithStatus = sortedVaccines.slice(skip, skip + limit);
      }

      const message =
        count === 0 ? 'No Data Found' : 'Vaccines fetched successfully';

      return successResponse(vaccinesWithStatus, message, 200, page, limit, count);
    } catch (error) {
      console.error(ApiResponseMessages.FAC_FET_FAILED, error);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FAC_FET_FAILED,
      );
    }
  }

  async getMetadata() {
    try {
      const [vaccinesResponse, divisions, districts, talukas, ucs] =
        await Promise.all([
          this.getVaccines({
            page: 1,
            limit: 30,
          }),
          this.divisionRepository.find({
            select: ['id', 'name'],
            order: { name: 'ASC' },
          }),
          this.districtRepository
            .createQueryBuilder('district')
            .leftJoin('district.division', 'division')
            .select([
              'district.id AS id',
              'district.name AS name',
              'division.id AS division_id',
            ])
            .orderBy('district.name', 'ASC')
            .getRawMany(),
          this.talukaRepository
            .createQueryBuilder('taluka')
            .leftJoin('taluka.district', 'district')
            .select([
              'taluka.id AS id',
              'taluka.name AS name',
              'district.id AS district_id',
            ])
            .orderBy('taluka.name', 'ASC')
            .getRawMany(),
          this.ucRepository
            .createQueryBuilder('uc')
            .leftJoin('uc.taluka', 'taluka')
            .select([
              'uc.id AS id',
              'uc.name AS name',
              'taluka.id AS taluka_id',
            ])
            .orderBy('uc.name', 'ASC')
            .getRawMany(),
        ]);

      return successResponse(
        {
          vaccines: vaccinesResponse.data,
          locations: {
            divisions,
            districts: districts.map((district) => ({
              id: Number(district.id),
              name: district.name,
              division_id: district.division_id
                ? Number(district.division_id)
                : null,
            })),
            talukas: talukas.map((taluka) => ({
              id: Number(taluka.id),
              name: taluka.name,
              district_id: taluka.district_id ? Number(taluka.district_id) : null,
            })),
            ucs: ucs.map((uc) => ({
              id: Number(uc.id),
              name: uc.name,
              taluka_id: uc.taluka_id ? Number(uc.taluka_id) : null,
            })),
          },
        },
        'Immunisation metadata fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error('Failed to fetch immunisation metadata', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch immunisation metadata',
      );
    }
  }

  async getPatientImmunisations(filters) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const query = this.patientImmunisationRepository
        .createQueryBuilder('patientImmunisation')
        .leftJoinAndSelect('patientImmunisation.patient', 'patient')
        .select([
          'patientImmunisation.id',
          'patientImmunisation.status',
          'patientImmunisation.nextDueDate',
          'patientImmunisation.remarks',
          'patientImmunisation.updated',
          'patientImmunisation.created_at',
          'patientImmunisation.updated_at',
          'patient.id',
          'patient.cnic_provider',
          'patient.nationalityStatus',
          'patient.cnic',
          'patient.first_name',
          'patient.last_name',
          'patient.dob',
          'patient.immunisation_number',
          'patient.mobile_hash',
          'patient.registration_type',
          'patient.gender',
          'patient.phone_provider',
          'patient.phone_number',
          'patient.address',
          'patient.division_id',
          'patient.district_id',
          'patient.facility_id',
          'patient.taluka_id',
          'patient.uc_id',
          'patient.mr_no',
          'patient.created_at',
          'patient.updated_at',
        ]);

      if (filters.statuses?.length) {
        query.andWhere('patientImmunisation.status IN (:...statuses)', {
          statuses: filters.statuses,
        });
      }

      query.andWhere(
        `patientImmunisation.created_at >= ${PATIENT_IMMUNISATION_LOOKBACK_INTERVAL}`,
      );

      if (filters.facility_id !== undefined && filters.facility_id !== null) {
        const facilityId = Number(filters.facility_id);
        if (!Number.isNaN(facilityId)) {
          query.andWhere('patient.facility_id = :facilityId', { facilityId });
        }
      }

      if (filters.uc_id !== undefined && filters.uc_id !== null) {
        const ucId = Number(filters.uc_id);
        if (!Number.isNaN(ucId)) {
          query.andWhere('patient.uc_id = :ucId', { ucId });
        }
      }

      if (filters.has_remarks === true) {
        query.andWhere(
          "patientImmunisation.remarks IS NOT NULL AND TRIM(patientImmunisation.remarks) <> ''",
        );
      } else if (filters.has_remarks === false) {
        query.andWhere(
          "(patientImmunisation.remarks IS NULL OR TRIM(patientImmunisation.remarks) = '')",
        );
      }

      const dataQuery = query.clone();
      const sourceCountQuery = query
        .clone()
        .select('COUNT(patientImmunisation.id)', 'count');

      const [data, sourceCountRow] = await Promise.all([
        dataQuery
          .orderBy('patientImmunisation.nextDueDate', 'ASC')
          .skip(skip)
          .take(limit)
          .getMany(),
        sourceCountQuery.getRawOne<{ count: string }>(),
      ]);

      const count = Number(sourceCountRow?.count ?? 0);
      const message = data.length === 0 ? 'No Data Found' : 'Patient immunisation records fetched successfully';
      return successResponse(data, message, 200, page, limit, count);
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR,
      );
    }
  }

  async getPatientImmunisationsByUserUc(
    request: Request,
    filters: PatientImmunisationFacilityInchargeDto,
  ) {
    const parsedUserId = Number((request as any).user?.sub);
    if (!Number.isFinite(parsedUserId)) {
      throw new BadRequestException('userId is required.');
    }

    const user = await this.userRepository.findOne({
      where: { id: parsedUserId },
      relations: ['facility'],
    });
    if (!user || !user.facility?.uc_id) {
      throw new BadRequestException('Facility UC not found.');
    }

    return this.getPatientImmunisations({
      ...filters,
      facility_id: filters.facility_id ? filters.facility_id : undefined,
      uc_id: filters.uc_id ? filters.uc_id : user.facility.uc_id,
    });
  }

  async getPatientImmunisationsSync(
    request: Request,
    filters: {
      timestamp?: string;
      page?: string | number;
      limit?: string | number;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    try {
      const userId = Number((request as any).user?.sub);
      if (!userId) {
        throw new BadRequestException('userId is required.');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['facility'],
      });
      if (!user || !user.facility?.uc_id) {
        throw new BadRequestException('Facility UC not found.');
      }

      const ucId = Number(user.facility.uc_id);
      const page = this.parsePositiveInteger(filters.page, 1);
      const limit = this.parsePositiveInteger(filters.limit, SYNC_API_LIMIT);
      const offset = (page - 1) * limit;
      const requestedLimit = limit + 1;
      const syncTimestamp = this.parseSyncTimestamp(filters.timestamp);
      const dateFrom =
        syncTimestamp ??
        this.parseOptionalSyncDate(filters.dateFrom);
      const dateTo = this.parseOptionalSyncDate(
        filters.dateTo,
        true,
      );

      if (dateFrom && dateTo && dateFrom > dateTo) {
        throw new BadRequestException('dateFrom cannot be after dateTo.');
      }

      const rows = await this.patientRepository.query(
        `
          WITH paginated_patients AS (
            SELECT DISTINCT patient.id
            FROM "patients" patient
            INNER JOIN "patient_immunisations" patientImmunisation
              ON patientImmunisation."patient_id" = patient."id"
            INNER JOIN "immunisation_doses" doseFilter
              ON doseFilter."patient_id" = patient."id"
            LEFT JOIN LATERAL (
              SELECT MAX(snapshot."updated_at") AS updated_at
              FROM "patient_vaccine_status_snapshots" snapshot
              WHERE snapshot."patient_id" = patient."id"
              ) vaccineStatusChange ON TRUE
            WHERE patient."uc_id" = $1::integer
              AND NULLIF(BTRIM(patient."immunisation_number"), '') IS NOT NULL
              AND (
              $2::timestamp IS NULL
                OR GREATEST(
                     COALESCE(patientImmunisation."created_at", '1970-01-01'::timestamp),
                     COALESCE(patientImmunisation."updated_at", '1970-01-01'::timestamp),
                     COALESCE(vaccineStatusChange.updated_at, '1970-01-01'::timestamp)
                   ) >= $2::timestamp
              )
              AND (
              $3::timestamp IS NULL
                OR GREATEST(
                     COALESCE(patientImmunisation."created_at", '1970-01-01'::timestamp),
                     COALESCE(patientImmunisation."updated_at", '1970-01-01'::timestamp),
                     COALESCE(vaccineStatusChange.updated_at, '1970-01-01'::timestamp)
                   ) <= $3::timestamp
              )
            ORDER BY patient.id ASC
            LIMIT $4::integer OFFSET $5::integer
          )
          SELECT
            "patient"."id" AS "patient_id",
            "patient"."cnic_provider" AS "patient_cnic_provider",
            "patient"."nationality_status" AS "patient_nationality_status",
            "patient"."cnic" AS "patient_cnic",
            "patient"."first_name" AS "patient_first_name",
            "patient"."last_name" AS "patient_last_name",
            "patient"."dob"::text AS "patient_dob",
            "patient"."immunisation_number" AS "patient_immunisation_number",
            "patient"."mobile_hash" AS "patient_mobile_hash",
            "patient"."registration_type" AS "patient_registration_type",
            "patient"."gender" AS "patient_gender",
            "patient"."phone_provider" AS "patient_phone_provider",
            "patient"."phone_number" AS "patient_phone_number",
            "patient"."address" AS "patient_address",
            "patient"."division_id" AS "patient_division_id",
            "patient"."district_id" AS "patient_district_id",
            "patient"."facility_id" AS "patient_facility_id",
            "patient"."taluka_id" AS "patient_taluka_id",
            "patient"."uc_id" AS "patient_uc_id",
            "patient"."mr_no" AS "patient_mr_no",
            "patient"."created_at" AS "patient_created_at",
            "patient"."updated_at" AS "patient_updated_at",
            "additionalInfo"."id" AS "additionalInfo_id",
            "additionalInfo"."marital_status" AS "additionalInfo_marital_status",
            "additionalInfo"."blood_group" AS "additionalInfo_blood_group",
            "additionalInfo"."guardian_name" AS "additionalInfo_guardian_name",
            "additionalInfo"."created_at" AS "additionalInfo_created_at",
            "additionalInfo"."updated_at" AS "additionalInfo_updated_at",
            "additionalInfo"."patient_id" AS "additionalInfo_patient_id",
            "immunisationsDoses"."id" AS "immunisationsDoses_id",
            "immunisationsDoses"."date_administered"::text AS "immunisationsDoses_date_administered",
            "immunisationsDoses"."status" AS "immunisationsDoses_status",
            "immunisationsDoses"."latitude" AS "immunisationsDoses_latitude",
            "immunisationsDoses"."longitude" AS "immunisationsDoses_longitude",
            "immunisationsDoses"."vaccine_id" AS "immunisationsDoses_vaccine_id",
            "immunisationsDoses"."patient_id" AS "immunisationsDoses_patient_id",
            "immunisationsDoses"."immunisation_id" AS "immunisationsDoses_immunisation_id",
            "immunisationsDoses"."vaccinated_by" AS "immunisationsDoses_vaccinated_by",
            "doseVaccine"."id" AS "doseVaccine_id",
            "doseVaccine"."code" AS "doseVaccine_code",
            "doseVaccine"."display_name" AS "doseVaccine_display_name",
            "doseVaccine"."seir_name" AS "doseVaccine_seir_name",
            "doseVaccine"."series_name" AS "doseVaccine_series_name",
            "doseVaccine"."dose_number" AS "doseVaccine_dose_number",
            "doseVaccine"."age_min_days" AS "doseVaccine_age_min_days",
            "doseVaccine"."age_overdue_days" AS "doseVaccine_age_overdue_days",
            "doseVaccine"."max_age_days" AS "doseVaccine_max_age_days",
            "doseVaccine"."applies_to" AS "doseVaccine_applies_to",
            "doseVaccine"."gender_restriction" AS "doseVaccine_gender_restriction",
            "doseVaccine"."pre_requisite_codes" AS "doseVaccine_pre_requisite_codes",
            "doseVaccine"."catch_up_1_to_2_mode" AS "doseVaccine_catch_up_1_to_2_mode",
            "doseVaccine"."catch_up_1_to_2_interval_days" AS "doseVaccine_catch_up_1_to_2_interval_days",
            "doseVaccine"."catch_up_1_to_2_note" AS "doseVaccine_catch_up_1_to_2_note",
            "doseVaccine"."catch_up_above_2_mode" AS "doseVaccine_catch_up_above_2_mode",
            "doseVaccine"."catch_up_above_2_interval_days" AS "doseVaccine_catch_up_above_2_interval_days",
            "doseVaccine"."catch_up_above_2_note" AS "doseVaccine_catch_up_above_2_note",
            "doseVaccine"."is_active" AS "doseVaccine_is_active",
            "doseVaccine"."order" AS "doseVaccine_order",
            "immunisationCard"."id" AS "immunisationCard_id",
            "immunisationCard"."place_of_delivery" AS "immunisationCard_place_of_delivery",
            "immunisationCard"."districtId" AS "immunisationCard_districtId",
            "immunisationCard"."talukaId" AS "immunisationCard_talukaId",
            "immunisationCard"."level_of_care" AS "immunisationCard_level_of_care",
            "immunisationCard"."facility_id" AS "immunisationCard_facility_id",
            "immunisationCard"."other_facility_name" AS "immunisationCard_other_facility_name",
            "immunisationCard"."immunisation_card_available" AS "immunisationCard_immunisation_card_available",
            "immunisationCard"."immunisation_card_provided" AS "immunisationCard_immunisation_card_provided",
            "immunisationCard"."patient_id" AS "immunisationCard_patient_id",
            "patientImmunisation"."id" AS "patientImmunisation_id",
            "patientImmunisation"."status" AS "patientImmunisation_status",
            "patientImmunisation"."next_due_date" AS "patientImmunisation_next_due_date",
            "patientImmunisation"."remarks" AS "patientImmunisation_remarks",
            "patientImmunisation"."updated" AS "patientImmunisation_updated",
            "patientImmunisation"."created_at" AS "patientImmunisation_created_at",
            "patientImmunisation"."updated_at" AS "patientImmunisation_updated_at",
            "patientImmunisation"."patient_id" AS "patientImmunisation_patient_id"
          FROM paginated_patients paginatedPatients
          INNER JOIN "patients" "patient"
            ON "patient"."id" = paginatedPatients.id
          LEFT JOIN "patient_additional_infos" "additionalInfo"
            ON "additionalInfo"."patient_id" = "patient"."id"
          INNER JOIN "immunisation_doses" "immunisationsDoses"
            ON "immunisationsDoses"."patient_id" = "patient"."id"
          LEFT JOIN "vaccines" "doseVaccine"
            ON "doseVaccine"."id" = "immunisationsDoses"."vaccine_id"
            AND "doseVaccine"."is_active" = TRUE
          LEFT JOIN "immunisation_cards" "immunisationCard"
            ON "immunisationCard"."patient_id" = "patient"."id"
          LEFT JOIN "patient_immunisations" "patientImmunisation"
            ON "patientImmunisation"."patient_id" = "patient"."id"
          ORDER BY "patient"."id" ASC
        `,
        [ucId, dateFrom, dateTo, requestedLimit, offset],
      );

      const paginatedPatients = this.mapPatientImmunisationSyncRows(rows);
      const hasNextPage = paginatedPatients.length > limit;
      const patients = paginatedPatients.slice(0, limit);

      const vaccinesByPatientId = await this.getSnapshotVaccines(patients.map((patient) => patient.id));
      const patientsWithVaccines = patients.map((patient) => {
        return { ...patient, vaccines: vaccinesByPatientId.get(patient.id) ?? [] };
      });

      const message = patientsWithVaccines.length === 0
        ? 'No Data Found'
        : 'Patient immunisation sync data fetched successfully';
      return successResponse(
        {
          patients: patientsWithVaccines,
          page,
          limit,
          nextPage: hasNextPage ? page + 1 : null,
        },
        message,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR,
      );
    }
  }

  private async getSnapshotVaccines(patientIds: number[]) {
    const result = new Map<number, Array<Vaccine & {
      immunisationDosageStatus: ImmunisationDosageStatus;
      date_administered: string | null;
      next_due_date: Date | null;
    }>>();
    if (!patientIds.length) return result;

    const snapshots = await this.patientRepository.manager.find(PatientVaccineStatusSnapshot, {
      where: { patientId: In(patientIds), vaccine: { isActive: true } },
      relations: ['vaccine'],
      order: { vaccineId: 'ASC' },
    });
    const statusPriority: Record<string, number> = {
      [ImmunisationDosageStatus.ADMINISTERED]: 0,
      [ImmunisationDosageStatus.RETRO]: 0,
      [ImmunisationDosageStatus.DEFAULTER]: 1,
      [ImmunisationDosageStatus.SCHEDULED]: 2,
      [ImmunisationDosageStatus.PENDING]: 3,
      [ImmunisationDosageStatus.EXPIRED]: 4,
    };
    for (const snapshot of snapshots) {
      const vaccines = result.get(snapshot.patientId) ?? [];
      vaccines.push({
        ...snapshot.vaccine,
        immunisationDosageStatus: snapshot.status,
        date_administered: this.formatDateAdministered(snapshot.dateAdministered),
        next_due_date: snapshot.nextDueDate,
      });
      result.set(snapshot.patientId, vaccines);
    }
    for (const vaccines of result.values()) {
      vaccines.sort((a, b) =>
        (statusPriority[a.immunisationDosageStatus] ?? Number.MAX_SAFE_INTEGER) -
        (statusPriority[b.immunisationDosageStatus] ?? Number.MAX_SAFE_INTEGER) ||
        (a.dose_number ?? Number.MAX_SAFE_INTEGER) - (b.dose_number ?? Number.MAX_SAFE_INTEGER) ||
        a.id - b.id,
      );
    }
    return result;
  }

  private formatDateAdministered(value: Date | string | null): string | null {
    if (value === null) return null;

    // PostgreSQL date columns are returned as YYYY-MM-DD strings.
    // Interpret these calendar dates as midnight in Pakistan (UTC+05:00).
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00.000+05:00`)
      : new Date(value);

    return date.toISOString();
  }

  private normalizeSyncDate(value: Date | string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date provided.');
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private calculateSyncDaysBetween(start: Date, end: Date): number {
    const startDate = this.normalizeSyncDate(start);
    const endDate = this.normalizeSyncDate(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private buildSyncCompletedCodeDateMap(
    administeredRows: Array<{
      code: string;
      date_administered: Date | string;
    }>,
  ): Map<string, Date> {
    const completedCodeDates = new Map<string, Date>();

    for (const row of administeredRows) {
      const doseDate = this.normalizeSyncDate(row.date_administered);
      const existing = completedCodeDates.get(row.code);
      if (!existing || doseDate > existing) {
        completedCodeDates.set(row.code, doseDate);
      }
    }

    return completedCodeDates;
  }

  private getLatestSyncPrerequisiteDate(
    codes: string[] | null | undefined,
    completedCodeDates: Map<string, Date>,
  ): Date | null {
    if (!codes?.length) return null;

    let latest: Date | null = null;
    for (const code of codes) {
      const current = completedCodeDates.get(code);
      if (!current) return null;
      if (!latest || current > latest) {
        latest = current;
      }
    }

    return latest;
  }

  private resolveSyncCatchUpRule(
    vaccine: Pick<
      Vaccine,
      | 'catch_up_1_to_2_mode'
      | 'catch_up_1_to_2_interval_days'
      | 'catch_up_1_to_2_note'
      | 'catch_up_above_2_mode'
      | 'catch_up_above_2_interval_days'
      | 'catch_up_above_2_note'
    >,
    ageInDays: number,
  ): {
    mode: VaccineCatchUpMode | null;
    intervalDays: number | null;
    note: string | null;
  } {
    if (ageInDays >= 365 * 2) {
      return {
        mode: vaccine.catch_up_above_2_mode ?? null,
        intervalDays: vaccine.catch_up_above_2_interval_days ?? null,
        note: vaccine.catch_up_above_2_note ?? null,
      };
    }

    if (ageInDays >= 365) {
      return {
        mode: vaccine.catch_up_1_to_2_mode ?? null,
        intervalDays: vaccine.catch_up_1_to_2_interval_days ?? null,
        note: vaccine.catch_up_1_to_2_note ?? null,
      };
    }

    return { mode: null, intervalDays: null, note: null };
  }

  private resolveSyncRequiredMinDays(
    vaccine: Pick<Vaccine, 'age_min_days'>,
    catchUpRule: { mode: VaccineCatchUpMode | null; intervalDays: number | null },
  ): number {
    if (
      [
        VaccineCatchUpMode.IMMEDIATE,
        VaccineCatchUpMode.SINGLE_DOSE,
        VaccineCatchUpMode.ON_FIRST_CONTACT,
      ].includes(catchUpRule.mode as VaccineCatchUpMode)
    ) {
      return 0;
    }

    if (
      catchUpRule.mode === VaccineCatchUpMode.AFTER_INTERVAL &&
      catchUpRule.intervalDays !== null
    ) {
      return catchUpRule.intervalDays;
    }

    return vaccine.age_min_days ?? 0;
  }

  private mapPatientImmunisationSyncRows(rows: any[]): any[] {
    const patientsById = new Map<number, any>();
    const doseIdsByPatientId = new Map<number, Set<number>>();

    for (const row of rows) {
      const patientId = Number(row.patient_id);
      if (!Number.isFinite(patientId)) continue;

      let patient = patientsById.get(patientId);
      if (!patient) {
        patient = {
          id: patientId,
          cnic_provider: row.patient_cnic_provider,
          nationalityStatus: row.patient_nationality_status,
          cnic: row.patient_cnic,
          first_name: row.patient_first_name,
          last_name: row.patient_last_name,
          dob: row.patient_dob,
          immunisation_number: row.patient_immunisation_number,
          mobile_hash: row.patient_mobile_hash,
          registration_type: row.patient_registration_type,
          gender: row.patient_gender,
          phone_provider: row.patient_phone_provider,
          phone_number: row.patient_phone_number,
          address: row.patient_address,
          division_id: row.patient_division_id,
          district_id: row.patient_district_id,
          facility_id: row.patient_facility_id,
          taluka_id: row.patient_taluka_id,
          uc_id: row.patient_uc_id,
          mr_no: row.patient_mr_no,
          created_at: row.patient_created_at,
          updated_at: row.patient_updated_at,
          additionalInfo: null,
          immunisations: [],
          immunisationsDoses: [],
          immunisationCard: null,
          patientImmunisation: null,
        };
        patientsById.set(patientId, patient);
        doseIdsByPatientId.set(patientId, new Set<number>());
      }

      if (row.additionalInfo_id && !patient.additionalInfo) {
        patient.additionalInfo = {
          id: Number(row.additionalInfo_id),
          marital_status: row.additionalInfo_marital_status,
          blood_group: row.additionalInfo_blood_group,
          guardian_name: row.additionalInfo_guardian_name,
          created_at: row.additionalInfo_created_at,
          updated_at: row.additionalInfo_updated_at,
        };
      }

      if (row.immunisationCard_id && !patient.immunisationCard) {
        patient.immunisationCard = {
          id: Number(row.immunisationCard_id),
          placeOfDelivery: row.immunisationCard_place_of_delivery,
          districtId: row.immunisationCard_districtId,
          talukaId: row.immunisationCard_talukaId,
          level_of_care: row.immunisationCard_level_of_care,
          facilityId: row.immunisationCard_facility_id,
          otherFacilityName: row.immunisationCard_other_facility_name,
          immunisationCardAvailable:
          row.immunisationCard_immunisation_card_available,
          immunisationCardProvided:
          row.immunisationCard_immunisation_card_provided,
        };
      }

      if (row.patientImmunisation_id && !patient.patientImmunisation) {
        patient.patientImmunisation = {
          id: Number(row.patientImmunisation_id),
          status: row.patientImmunisation_status,
          nextDueDate: row.patientImmunisation_next_due_date,
          remarks: row.patientImmunisation_remarks,
          updated: row.patientImmunisation_updated,
          created_at: row.patientImmunisation_created_at,
          updated_at: row.patientImmunisation_updated_at,
        };
      }

      const doseId = row.immunisationsDoses_id
        ? Number(row.immunisationsDoses_id)
        : null;
      const doseIds = doseIdsByPatientId.get(patientId);
      if (doseId && doseIds && !doseIds.has(doseId)) {
        doseIds.add(doseId);
        patient.immunisationsDoses.push({
          id: doseId,
          dateAdministered: row.immunisationsDoses_date_administered,
          status: row.immunisationsDoses_status,
          latitude: row.immunisationsDoses_latitude,
          longitude: row.immunisationsDoses_longitude,
          vaccine: row.doseVaccine_id
            ? {
              id: Number(row.doseVaccine_id),
              code: row.doseVaccine_code,
              display_name: row.doseVaccine_display_name,
              seir_name: row.doseVaccine_seir_name,
              series_name: row.doseVaccine_series_name,
              dose_number: row.doseVaccine_dose_number,
              age_min_days: row.doseVaccine_age_min_days,
              age_overdue_days: row.doseVaccine_age_overdue_days,
              max_age_days: row.doseVaccine_max_age_days,
              applies_to: row.doseVaccine_applies_to,
              gender_restriction: row.doseVaccine_gender_restriction,
              pre_requisite_codes: row.doseVaccine_pre_requisite_codes,
              catch_up_1_to_2_mode: row.doseVaccine_catch_up_1_to_2_mode,
              catch_up_1_to_2_interval_days:
              row.doseVaccine_catch_up_1_to_2_interval_days,
              catch_up_1_to_2_note: row.doseVaccine_catch_up_1_to_2_note,
              catch_up_above_2_mode: row.doseVaccine_catch_up_above_2_mode,
              catch_up_above_2_interval_days:
              row.doseVaccine_catch_up_above_2_interval_days,
              catch_up_above_2_note: row.doseVaccine_catch_up_above_2_note,
              isActive: row.doseVaccine_is_active,
              order: row.doseVaccine_order,
            }
            : null,
        });
      }


    }

    return Array.from(patientsById.values());
  }

  public async refreshPatientVaccineStatusSnapshot(
    patientId: number,
    em: EntityManager,
  ): Promise<void> {
    const patient = await em.findOne(Patient, {
      loadEagerRelations: false,
      where: { id: patientId },
      select: ['id', 'dob', 'gender'],
    });
    if (!patient) return;

    const vaccines = await em.find(Vaccine, {
      where: { isActive: true },
      order: { id: 'ASC' },
    });
    if (!vaccines.length) return;
    const uniqueVaccines = Array.from(
      new Map(vaccines.map((vaccine) => [vaccine.id, vaccine])).values(),
    );

    const administeredDateMap = new Map<number, Date>();
    const statusMap =
      await this.serviceUtility.calculateImmunisationDosageStatuses(
        patientId,
        uniqueVaccines,
        em,
        administeredDateMap,
      );
    const administeredRows: Array<{
      code: string;
      date_administered: Date | string;
    }> = await em.query(
      `
        SELECT
          vaccine.code AS code,
          MAX(dose.date_administered) AS date_administered
        FROM immunisation_doses dose
               INNER JOIN vaccines vaccine
                          ON vaccine.id = dose.vaccine_id
        WHERE dose.patient_id = $1::integer
          AND dose.status::text IN ($2::text, $3::text)
          AND vaccine.is_active = true
        GROUP BY vaccine.code
      `,
      [patientId, ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO],
    );
    const completedCodeDates =
      this.buildSyncCompletedCodeDateMap(administeredRows);

    const now = new Date();
    const rows = uniqueVaccines.map((vaccine) => {
      const status =
        statusMap.get(vaccine.id) ?? ImmunisationDosageStatus.PENDING;

      return {
        patientId,
        vaccineId: vaccine.id,
        status,
        dateAdministered: administeredDateMap.get(vaccine.id) ?? null,
        nextDueDate: this.calculateSnapshotNextDueDate(
          patient,
          vaccine,
          status,
          completedCodeDates,
        ),
        calculatedAt: now,
        updatedAt: now,
      };
    });

    for (const row of rows) {
      console.log('[Patient Vaccine Snapshot] Inserting/updating row:', row);
    }

    const placeholders: string[] = [];
    const parameters: unknown[] = [];
    rows.forEach((row, index) => {
      const offset = index * 7;
      placeholders.push(
        `($${offset + 1}::integer, $${offset + 2}::integer, ` +
        `$${offset + 3}::character varying, $${offset + 4}::date, ` +
        `$${offset + 5}::date, $${offset + 6}::timestamp, ` +
        `$${offset + 7}::timestamp)`,
      );
      parameters.push(
        row.patientId,
        row.vaccineId,
        row.status,
        row.dateAdministered,
        row.nextDueDate,
        row.calculatedAt,
        row.updatedAt,
      );
    });

    await em.query(
      `
        INSERT INTO patient_vaccine_status_snapshots (
          patient_id,
          vaccine_id,
          status,
          date_administered,
          next_due_date,
          calculated_at,
          updated_at
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT ON CONSTRAINT uq_patient_vaccine_status_snapshot
        DO UPDATE SET
        status = EXCLUDED.status,
        date_administered = EXCLUDED.date_administered,
        next_due_date = EXCLUDED.next_due_date,
        calculated_at = EXCLUDED.calculated_at,
        updated_at = EXCLUDED.updated_at
      `,
      parameters,
    );

    for (const row of rows) {
      console.log('[Patient Vaccine Snapshot] Inserted/updated row:', row);
    }

    console.log(
      `[Patient Vaccine Snapshot] Upserted ${rows.length} vaccine status row(s) for patient ID ${patientId}.`,
    );
  }

  private calculateSnapshotNextDueDate(
    patient: Pick<Patient, 'dob' | 'gender'>,
    vaccine: Pick<
      Vaccine,
      | 'age_min_days'
      | 'max_age_days'
      | 'pre_requisite_codes'
      | 'catch_up_1_to_2_mode'
      | 'catch_up_1_to_2_interval_days'
      | 'catch_up_1_to_2_note'
      | 'catch_up_above_2_mode'
      | 'catch_up_above_2_interval_days'
      | 'catch_up_above_2_note'
    >,
    status: ImmunisationDosageStatus,
    completedCodeDates: Map<string, Date>,
  ): Date | null {
    if (!patient.dob || [ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(status)) {
      return null;
    }

    const dobDate = this.normalizeSyncDate(patient.dob);
    const today = this.normalizeSyncDate(new Date());
    const ageInDays = this.calculateSyncDaysBetween(dobDate, today);
    const minimumAgeDays = vaccine.age_min_days ?? 0;

    if (ageInDays < minimumAgeDays) {
      return this.addDays(dobDate, minimumAgeDays);
    }

    const latestPrerequisiteDate = vaccine.pre_requisite_codes?.length
      ? this.getLatestSyncPrerequisiteDate(
        vaccine.pre_requisite_codes,
        completedCodeDates,
      )
      : null;

    if (vaccine.pre_requisite_codes?.length && !latestPrerequisiteDate) {
      return null;
    }

    const catchUpRule = this.resolveSyncCatchUpRule(vaccine, ageInDays);
    const requiredMinDays = this.resolveSyncRequiredMinDays(
      vaccine,
      catchUpRule,
    );
    const anchorDate = latestPrerequisiteDate ?? dobDate;
    let nextDueDate = this.addDays(anchorDate, requiredMinDays);

    if (
      vaccine.max_age_days !== null &&
      vaccine.max_age_days !== undefined
    ) {
      const lastAllowedDate = this.addDays(dobDate, vaccine.max_age_days);
      if (
        status === ImmunisationDosageStatus.EXPIRED ||
        nextDueDate > lastAllowedDate
      ) {
        nextDueDate = lastAllowedDate;
      }
    }

    return nextDueDate;
  }

  private async upsertAdministeredVaccineStatusSnapshots(
    patientId: number,
    doses: Array<{
      vaccine_id: number;
      dateAdministered: string;
      status?: ImmunisationDosageStatus;
    }>,
    em: EntityManager,
  ): Promise<void> {
    const latestAdministeredDateByVaccineId = new Map<number, { date: Date; status: ImmunisationDosageStatus }>();

    for (const dose of doses) {
      const status = dose.status ?? ImmunisationDosageStatus.ADMINISTERED;
      if (![ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(status)) continue;

      const vaccineId = Number(dose.vaccine_id);
      if (!Number.isFinite(vaccineId)) continue;

      const administeredDate = this.normalizeSyncDate(dose.dateAdministered);
      const existingDate = latestAdministeredDateByVaccineId.get(vaccineId);
      if (!existingDate || administeredDate >= existingDate.date) {
        latestAdministeredDateByVaccineId.set(vaccineId, { date: administeredDate, status });
      }
    }

    if (!latestAdministeredDateByVaccineId.size) return;

    const now = new Date();
    const rows = Array.from(
      latestAdministeredDateByVaccineId.entries(),
    ).map(([vaccineId, { date: dateAdministered, status }]) => ({
      patientId,
      vaccineId,
      status,
      dateAdministered,
      nextDueDate: null,
      calculatedAt: now,
      updatedAt: now,
    }));

    for (const row of rows) {
      console.log(
        '[Patient Vaccine Snapshot] Updating administered vaccine row:',
        row,
      );
    }

    const placeholders: string[] = [];
    const parameters: unknown[] = [];
    rows.forEach((row, index) => {
      const offset = index * 7;
      placeholders.push(
        `($${offset + 1}::integer, $${offset + 2}::integer, ` +
        `$${offset + 3}::character varying, $${offset + 4}::date, ` +
        `$${offset + 5}::date, $${offset + 6}::timestamp, ` +
        `$${offset + 7}::timestamp)`,
      );
      parameters.push(
        row.patientId,
        row.vaccineId,
        row.status,
        row.dateAdministered,
        row.nextDueDate,
        row.calculatedAt,
        row.updatedAt,
      );
    });

    await em.query(
      `
        INSERT INTO patient_vaccine_status_snapshots (
          patient_id,
          vaccine_id,
          status,
          date_administered,
          next_due_date,
          calculated_at,
          updated_at
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT ON CONSTRAINT uq_patient_vaccine_status_snapshot
        DO UPDATE SET
        status = EXCLUDED.status,
        date_administered = EXCLUDED.date_administered,
        next_due_date = EXCLUDED.next_due_date,
        calculated_at = EXCLUDED.calculated_at,
        updated_at = EXCLUDED.updated_at
      `,
      parameters,
    );

    for (const row of rows) {
      console.log(
        '[Patient Vaccine Snapshot] Updated administered vaccine row:',
        row,
      );
    }
  }

  private parsePositiveInteger(
    value: string | number | undefined,
    defaultValue: number,
  ): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
  }

  private parseOptionalSyncDate(
    value?: string,
    endOfDay = false,
  ): Date | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue) {
      return null;
    }

    const parsedDate = this.parseSyncTimestamp(normalizedValue);
    if (!parsedDate) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      if (endOfDay) {
        parsedDate.setHours(23, 59, 59, 999);
      } else {
        parsedDate.setHours(0, 0, 0, 0);
      }
    }

    return parsedDate;
  }

  private parseSyncTimestamp(timestamp?: string): Date | null {
    if (!timestamp) {
      return null;
    }

    const normalizedTimestamp = String(timestamp).trim();
    if (!normalizedTimestamp) {
      return null;
    }

    const isUnixTimestamp = /^\d+$/.test(normalizedTimestamp);
    const parsedTimestamp = isUnixTimestamp
      ? new Date(
        normalizedTimestamp.length === 10
          ? Number(normalizedTimestamp) * 1000
          : Number(normalizedTimestamp),
      )
      : new Date(normalizedTimestamp);

    if (Number.isNaN(parsedTimestamp.getTime())) {
      throw new BadRequestException(
        'timestamp must be a valid ISO 8601 date or Unix timestamp.',
      );
    }

    return parsedTimestamp;
  }

  async addPatientImmunisationRemarks(payload: UpdatePatientImmunisationRemarksDto) {
    try {
      const record = await this.patientImmunisationRepository.findOne({
        where: { patient: { id: payload.patientId } },
        order: { id: 'DESC' },
      });
      if (!record) {
        throw new NotFoundException('Patient immunisation record not found.');
      }
      if (record.remarks && record.remarks.trim().length > 0) {
        throw new BadRequestException('Remarks already exist for this patient.');
      }

      await this.patientImmunisationRepository.update(
        { id: record.id },
        { remarks: payload.remarks },
      );

      return successResponse(
        { id: record.id, patientId: payload.patientId, remarks: payload.remarks },
        'Remarks added successfully',
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR,
      );
    }
  }

  async closePatientImmunisation(payload: ClosePatientImmunisationDto) {
    try {
      const record = await this.patientImmunisationRepository.findOne({
        where: { patient: { id: payload.patientId } },
      });
      if (!record) {
        throw new NotFoundException('Patient immunisation record not found.');
      }

      await this.patientImmunisationRepository.update(
        { id: record.id },
        { status: ImmunisationDosageStatus.CLOSED },
      );

      return successResponse(
        { id: record.id, patientId: payload.patientId, status: ImmunisationDosageStatus.CLOSED },
        'Patient immunisation status closed successfully',
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR,
      );
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async handlePatientImmunisationStatusCron(): Promise<void> {
    console.log('Cron running at', new Date().toISOString());
    try {
      await this.updatePatientImmunisationStatuses();
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMM_SUMMARY_FETCH_ERROR, error?.stack ?? error);
    }
  }

  public async updatePatientImmunisationStatuses(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.patientImmunisationRepository.update(
      {
        status: ImmunisationDosageStatus.SCHEDULED,
        nextDueDate: LessThan(today),
        updated: false,
      },
      {
        status: ImmunisationDosageStatus.DEFAULTER,
        updated: true,
      },
    );

    await this.patientImmunisationRepository.update(
      {
        status: ImmunisationDosageStatus.PENDING,
        nextDueDate: LessThan(today),
        updated: false,
      },
      {
        status: ImmunisationDosageStatus.SCHEDULED,
        updated: true,
      },
    );
  }

  public async create(
    immunisationDto: CreateImmunisationWithCardDto,
    user: AuthenticatedUser,
    transactionalEntityManager?: EntityManager,
  ): Promise<Immunisation> {
    try {
      const userId = user.sub;

      if (!immunisationDto.appointmentId) {
        return await this.createMobileImmunisation(immunisationDto, userId ?? 0);
      }

      if (!userId) {
        throw new UnauthorizedException(
          'Unable to determine user from request.',
        );
      }

      const appointment: Pick<
        Appointment,
        'id' | 'status' | 'patient_id' | 'visit_id'
      > & {
        patient: Pick<Patient, 'id' | 'dob' | 'gender' | 'immunisation_number'>;
      } = await this.serviceUtility.validateAndGetAppointment(
        immunisationDto.appointmentId,
        {
          select: {
            id: true,
            visit_id: true,
            status: true,
            patient: { id: true, dob: true, immunisation_number: true },
          },
          relations: { patient: true },
        },
      );
      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId,
      );
      const serviceIdForCheck = immunisationDto.service_id;
      let serviceNameForCheck: string | null = null;
      if (serviceIdForCheck !== undefined && serviceIdForCheck !== null) {
        serviceNameForCheck = await this.serviceUtility.getServiceNameById(serviceIdForCheck);
      }
      const parsedNewBornId =
        immunisationDto.newBornId !== undefined && immunisationDto.newBornId !== null
          ? Number(immunisationDto.newBornId)
          : Number.NaN;
      const hasNewBornId = Number.isFinite(parsedNewBornId) && parsedNewBornId > 0;
      const isNewBornService = serviceNameForCheck === ServiceType.DELIVERY;
      const isPncService = serviceNameForCheck === ServiceType.PNC;
      const isAncService = serviceNameForCheck === ServiceType.ANC;
      const isNewBorn = hasNewBornId || isNewBornService;
      const patientId = isNewBorn ? parsedNewBornId : appointment.patient.id;
      if (isNewBorn && !hasNewBornId) {
        throw new BadRequestException('newBornId is required for newborn immunisation.');
      }

      const hasImmunisationNumber = appointment.patient.immunisation_number !== null && appointment.patient.immunisation_number !== undefined;
      const patientAge = this.serviceUtility.getAge(appointment.patient.dob).ageYears;
      if (!isNewBorn && !isPncService && !isAncService && patientAge < 9 && !hasImmunisationNumber && immunisationDto?.immunisationCard?.immunisationCardAvailable === undefined) {
        throw new BadRequestException('immunisationCardAvailable is required when patient immunisation number is missing');
      }

      if (immunisationDto.doses?.length) {
        const newBornDob = (immunisationDto as CreateImmunisationWithCardDto & { newBornDOB?: Date | string }).newBornDOB;
        const referenceDob = isNewBorn
          ? (newBornDob ? new Date(newBornDob) : new Date())
          : new Date(appointment.patient.dob);
        await this.serviceUtility.ensureVaccineEligibility(
          immunisationDto.doses,
          referenceDob,
          patientId,
          transactionalEntityManager,
        );
      }

      const service = await this.serviceUtility.getServiceByType(
        ServiceType.IMMUNISATION,
      );
      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          transactionalEntityManager ? immunisationDto.service_id : service.id,
        );

      if (!transactionalEntityManager) {
        await this.serviceUtility.checkAppointmentServiceStatus(
          appointmentService,
          PatientStatus.IN_PROGRESS,
        );
      }

      const runner = async (em: EntityManager) => {
        const operatingUser = new User();
        operatingUser.id = userId;

        const managedAppointmentService = em.create(AppointmentService, {
          id: appointmentService.id,
          status: appointmentService.status,
        });

        let immunisationRecord: Immunisation | undefined =
          (await em
            .getRepository(Immunisation)
            .createQueryBuilder('immunisation')
            .select('immunisation.id')
            .where('immunisation.appointment_service_id = :appointmentServiceId', {
              appointmentServiceId: appointmentService.id,
            })
            .andWhere('immunisation.patient_id = :patientId', { patientId })
            .getOne()) ?? undefined;

        const shouldCreateImmunisation =
          (immunisationDto.doses?.length ?? 0) > 0 ||
          !!immunisationDto.immunisationCard;

        if (shouldCreateImmunisation || immunisationRecord) {
          const patientRef = { id: patientId } as Patient;
          const appointmentServiceRef = {
            id: appointmentService.id,
          } as AppointmentService;

          if (!immunisationRecord) {
            immunisationRecord = this.immunisationRepository.create({
              patient: patientRef,
              appointmentService: appointmentServiceRef,
            });
          } else {
            immunisationRecord.patient = patientRef;
            immunisationRecord.appointmentService = appointmentServiceRef;
          }

          immunisationRecord = await em.save(immunisationRecord);
          if (!immunisationRecord) {
            throw new BadRequestException('Unable to persist immunisation record.');
          }
          const persistedImmunisation = immunisationRecord;
          if (immunisationDto.doses?.length) {
            this.assertMobileNewAdministeredCoordinates(immunisationDto);

            const newDoseEntities = immunisationDto.doses.map((dose) =>
              this.immunisationDoseRepository.create({
                vaccine: { id: dose.vaccine_id } as Vaccine,
                dateAdministered: new Date(dose.dateAdministered),
                status: dose.status ?? ImmunisationDosageStatus.ADMINISTERED,
                patient: { id: patientId } as Patient,
                vaccinatedBy: operatingUser,
                immunisation: { id: persistedImmunisation.id } as Immunisation,
                latitude: dose.latitude ?? null,
                longitude: dose.longitude ?? null,
              }),
            );
            const savedDoses = await em.save(newDoseEntities);
            await this.incrementRollupsForCreatedDoses(savedDoses, em);
          }

          if (immunisationDto.immunisationCard) {
            const { immunisationCard } = immunisationDto;
            await this.syncPatientImmunisationNumber(
              patientId,
              immunisationCard.immunisationNumber,
              em,
            );
            const existingCardId = await this.getExistingImmunisationCardId(
              patientId,
              em,
            );
            const card = this.buildImmunisationCardEntity(
              immunisationCard,
              patientId,
              existingCardId,
            );
            await em.save(card);
          }
        }
        const hasAdministeredDose =
          immunisationDto.doses?.some(
            (dose) =>
              [ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(
                dose.status ?? ImmunisationDosageStatus.ADMINISTERED,
              ),
          ) ?? false;

        if (!transactionalEntityManager && hasAdministeredDose) {
          appointment.status = PatientStatus.COMPLETED;
          managedAppointmentService.status = PatientStatus.COMPLETED;

          await em.update(
            AppointmentService,
            { id: managedAppointmentService.id },
            { status: managedAppointmentService.status },
          );
          await em.update(
            Appointment,
            { id: appointment.id },
            { status: appointment.status },
          );
        }
        if (hasAdministeredDose) {
          await this.upsertPatientImmunisationSummary(patientId, em);
        }
        if (shouldCreateImmunisation) {
          await this.refreshPatientVaccineStatusSnapshot(patientId, em);
        }
        if (immunisationDto.doses?.length) {
          await this.upsertAdministeredVaccineStatusSnapshots(
            patientId,
            immunisationDto.doses,
            em,
          );
        }

        if (transactionalEntityManager) {
          return successResponse(
            immunisationRecord ?? null,
            ApiSuccessResponseMessages.IMMUN_CREATED_SUC,
            201,
          );
        }

        return successResponse(
          await this.loadAppointmentServiceImmunisationResponse(
            appointmentService.id,
            patientId,
            em,
          ),
          ApiSuccessResponseMessages.IMMUN_CREATED_SUC,
          201,
        );
      };

      const savedImmunisation = transactionalEntityManager
        ? await runner(transactionalEntityManager)
        : await this.appointmentServiceRepository.manager.transaction(runner);

      return savedImmunisation;
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMMUN_CREATION_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMMUN_CREATION_FAILED,
      );
    }
  }

  private async loadAppointmentServiceImmunisationResponse(
    appointmentServiceId: number,
    patientId: number,
    em: EntityManager,
  ): Promise<AppointmentService | null> {
    const appointmentService = await em
      .getRepository(AppointmentService)
      .createQueryBuilder('appointmentService')
      .leftJoinAndSelect('appointmentService.patient', 'patient')
      .where('appointmentService.id = :appointmentServiceId', {
        appointmentServiceId,
      })
      .getOne();
    if (!appointmentService?.patient) {
      return appointmentService;
    }

    const [immunisations, doses, immunisationCard] = await Promise.all([
      em.find(Immunisation, {
        loadEagerRelations: false,
        where: {
          appointmentService: { id: appointmentServiceId },
          patient: { id: patientId },
        },
        order: { id: 'ASC' },
      }),
      em
        .getRepository(ImmunisationDose)
        .createQueryBuilder('dose')
        .leftJoinAndSelect('dose.vaccine', 'vaccine')
        .where('dose.patient_id = :patientId', { patientId })
        .orderBy('dose.id', 'ASC')
        .getMany(),
      em
        .getRepository(ImmunisationCard)
        .createQueryBuilder('immunisationCard')
        .where('immunisationCard.patient_id = :patientId', { patientId })
        .limit(1)
        .getOne(),
    ]);

    appointmentService.immunisations = immunisations;
    Object.assign(appointmentService.patient, {
      immunisationsDoses: doses,
      immunisationCard,
    });

    return appointmentService;
  }

  public async createVitalImmunisation(
    immunisationDto: CreateImmunisationWithCardDto,
    request: Request,
    transactionalEntityManager?: EntityManager,
  ): Promise<Immunisation> {
    try {
      const userId = (request as Request & { user?: { sub?: number } }).user?.sub;
      if (!userId) {
        throw new UnauthorizedException('Unable to determine user from request.');
      }

      const appointment = await this.serviceUtility.validateAppointment(
        immunisationDto.appointmentId,
      );

      const hasImmunisationNumber = appointment.patient.immunisation_number !== null && appointment.patient.immunisation_number !== undefined;
      if (!hasImmunisationNumber) {
        throw new BadRequestException('Immunisation number is required when patient immunisation number is missing');
      }

      if (immunisationDto.doses?.length) {
        await this.serviceUtility.ensureVaccineEligibility(
          immunisationDto.doses,
          appointment.patient.dob,
          appointment.patient.id,
        );
      }

      if (!userId) {
        throw new BadRequestException('userId is required.');
      }

      const runner = async (em: EntityManager) => {
        const patient = await em.findOne(Patient, {
          where: { id: appointment.patient.id },
        });
        if (!patient) {
          throw new ForbiddenException('User does not have access to this patient.');
        }

        const hasImmunisationNumber = patient.immunisation_number !== null && patient.immunisation_number !== undefined;
        if (!hasImmunisationNumber && immunisationDto?.immunisationCard?.immunisationCardAvailable === undefined) {
          throw new BadRequestException('immunisationCardAvailable is required when patient immunisation number is missing');
        }

        const shouldCreateImmunisation =
          (immunisationDto.doses?.length ?? 0) > 0 ||
          !!immunisationDto.immunisationCard;
        if (!shouldCreateImmunisation) {
          throw new BadRequestException('No immunisation data provided.');
        }

        const operatingUser = new User();
        operatingUser.id = userId;

        let immunisationRecord = this.immunisationRepository.create({
          patient: { id: patient.id } as Patient,
        });

        immunisationRecord = await em.save(immunisationRecord);
        if (!immunisationRecord) {
          throw new BadRequestException('Unable to persist immunisation record.');
        }

        if (immunisationDto.doses?.length) {
          this.assertMobileNewAdministeredCoordinates(immunisationDto);

          const newDoseEntities = immunisationDto.doses.map((dose) =>
            this.immunisationDoseRepository.create({
              vaccine: { id: dose.vaccine_id } as Vaccine,
              dateAdministered: new Date(dose.dateAdministered),
              status: dose.status ?? ImmunisationDosageStatus.ADMINISTERED,
              patient: { id: patient.id } as Patient,
              vaccinatedBy: operatingUser,
              immunisation: { id: immunisationRecord.id } as Immunisation,
              latitude: dose.latitude ?? null,
              longitude: dose.longitude ?? null,
            }),
          );
          const savedDoses = await em.save(newDoseEntities);
          await this.incrementRollupsForCreatedDoses(savedDoses, em);
        }

        if (immunisationDto.immunisationCard) {
          const { immunisationCard } = immunisationDto;
          await this.syncPatientImmunisationNumber(
            patient.id,
            immunisationCard.immunisationNumber,
            em,
          );
          const existingCardId = await this.getExistingImmunisationCardId(
            patient.id,
            em,
          );
          const card = this.buildImmunisationCardEntity(
            immunisationCard,
            patient.id,
            existingCardId,
          );
          await em.save(card);
        }

        const shouldUpdateSummary =
          immunisationDto.doses?.some(
            (dose) =>
              [ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(
                dose.status ?? ImmunisationDosageStatus.ADMINISTERED,
              ),
          ) ?? false;
        if (shouldUpdateSummary) {
          await this.upsertPatientImmunisationSummary(patient.id, em);
        }

        await this.refreshPatientVaccineStatusSnapshot(patient.id, em);
        if (immunisationDto.doses?.length) {
          await this.upsertAdministeredVaccineStatusSnapshots(
            patient.id,
            immunisationDto.doses,
            em,
          );
        }

        const reloaded = await em.findOne(Immunisation, {
          where: { id: immunisationRecord.id },
          relations: ['patient.immunisationsDoses', 'patient.immunisationsDoses.vaccine', 'patient.immunisationCard'],
          loadEagerRelations: false,
        });

        return successResponse(
          {
            skipped: false,
            immunisation: reloaded ?? immunisationRecord,
          },
          ApiSuccessResponseMessages.IMMUN_CREATED_SUC,
          201,
        );
      };

      const savedImmunisation = transactionalEntityManager
        ? await runner(transactionalEntityManager)
        : await this.appointmentServiceRepository.manager.transaction(runner);

      return savedImmunisation;
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMMUN_CREATION_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMMUN_CREATION_FAILED,
      );
    }
  }

  public async createMobileImmunisation(
    immunisationDto: CreateImmunisationWithCardDto,
    userId: number,
  ) {
    const skip = (reason: string) =>
      successResponse(
        { skipped: true, reason },
        'Mobile immunisation record skipped',
        200,
      );

    try {
      if (!userId) {
        return skip('userId is required.');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['facility'],
      });
      if (!user || !user.facility?.uc_id) {
        return skip('Facility UC not found.');
      }
      const userUcId = Number(user.facility.uc_id);

      const runner = async (em: EntityManager) => {
        const mobilePatientResult = await this.mobilePatient(
          immunisationDto,
          userId,
          userUcId,
          em,
        );
        if (!mobilePatientResult.patient) {
          return skip(
            mobilePatientResult.reason ??
            'Unable to resolve patient for mobile immunisation.',
          );
        }
        const patient = mobilePatientResult.patient;

        const hasImmunisationNumber = patient.immunisation_number !== null && patient.immunisation_number !== undefined;
        if (!hasImmunisationNumber && immunisationDto?.immunisationCard?.immunisationCardAvailable === undefined) {
          throw new BadRequestException('immunisationCardAvailable is required when patient immunisation number is missing');
        }

        if (immunisationDto.doses?.length) {
          if (!patient.dob) {
            throw new BadRequestException('patient date of birth is required for vaccine eligibility.');
          }
          await this.serviceUtility.ensureVaccineEligibility(
            immunisationDto.doses,
            new Date(patient.dob as any),
            patient.id,
            em,
          );
        }

        const shouldCreateImmunisation =
          (immunisationDto.doses?.length ?? 0) > 0 ||
          !!immunisationDto.immunisationCard;
        if (!shouldCreateImmunisation) {
          throw new BadRequestException('No immunisation data provided.');
        }

        const operatingUser = new User();
        operatingUser.id = userId;

        let immunisationRecord = this.immunisationRepository.create({
          patient: { id: patient.id } as Patient,
        });

        immunisationRecord = await em.save(immunisationRecord);
        if (!immunisationRecord) {
          throw new BadRequestException('Unable to persist immunisation record.');
        }

        if (immunisationDto.doses?.length) {
          this.assertMobileNewAdministeredCoordinates(immunisationDto);

          const newDoseEntities = immunisationDto.doses.map((dose) =>
            this.immunisationDoseRepository.create({
              vaccine: { id: dose.vaccine_id } as Vaccine,
              dateAdministered: new Date(dose.dateAdministered),
              status: dose.status ?? ImmunisationDosageStatus.ADMINISTERED,
              patient: { id: patient.id } as Patient,
              vaccinatedBy: operatingUser,
              immunisation: { id: immunisationRecord.id } as Immunisation,
              latitude: dose.latitude ?? null,
              longitude: dose.longitude ?? null,
            }),
          );
          const savedDoses = await em.save(newDoseEntities);
          await this.incrementRollupsForCreatedDoses(savedDoses, em);
        }

        if (immunisationDto.immunisationCard) {
          const { immunisationCard } = immunisationDto;
          await this.syncPatientImmunisationNumber(
            patient.id,
            immunisationCard.immunisationNumber,
            em,
          );
          const existingCardId = await this.getExistingImmunisationCardId(
            patient.id,
            em,
          );
          const card = this.buildImmunisationCardEntity(
            immunisationCard,
            patient.id,
            existingCardId,
          );
          await em.save(card);
        }

        const shouldUpdateSummary =
          immunisationDto.doses?.some(
            (dose) =>
              [ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(
                dose.status ?? ImmunisationDosageStatus.ADMINISTERED,
              ),
          ) ?? false;
        if (shouldUpdateSummary) {
          await this.upsertPatientImmunisationSummary(patient.id, em);
        }

        await this.refreshPatientVaccineStatusSnapshot(patient.id, em);
        if (immunisationDto.doses?.length) {
          await this.upsertAdministeredVaccineStatusSnapshots(
            patient.id,
            immunisationDto.doses,
            em,
          );
        }

        const reloaded = await em.findOne(Immunisation, {
          where: { id: immunisationRecord.id },
          relations: ['patient.immunisationsDoses', 'patient.immunisationsDoses.vaccine', 'patient.immunisationCard'],
          loadEagerRelations: false,
        });

        return successResponse(
          reloaded ?? immunisationRecord,
          ApiSuccessResponseMessages.IMMUN_CREATED_SUC,
          201,
        );
      };

      return await this.immunisationRepository.manager.transaction(runner);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unexpected error';
      this.logger.warn(`Skipping mobile immunisation record: ${reason}`);
      return skip(reason);
    }
  }

  async find(patientId?: string, immunisationNumber?: string, mrNo?: string) {
    try {
      const whereConditions: any = {
        id: patientId,
      };
      if (immunisationNumber !== undefined) {
        whereConditions.immunisation_number = immunisationNumber;
      }
      if (mrNo !== undefined) {
        whereConditions.mr_no = mrNo;
      }
      const immunisation = await this.patientRepository.findOne({
        where: whereConditions,
        relations: [
          'immunisationCard',
          'patientImmunisation',
        ],
      });

      if (!immunisation)
        throw new NotFoundException(
          `No Immunisation visit found for patient ID ${patientId}`,
        );

      const vaccinesByPatientId = await this.getSnapshotVaccines([immunisation.id]);
      return { ...immunisation, vaccines: vaccinesByPatientId.get(immunisation.id) ?? [] };
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.IMM_RECORDS_FETCH_ERROR,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMM_RECORDS_FETCH_ERROR,
      );
    }
  }

  async findByPatientId(patientId: number, appointmentServiceId: number) {
    try {
      const patient = await this.patientRepository.findOne({
        where: { id: patientId },
        loadEagerRelations: false,
        select: {
          id: true,
          immunisation_number: true,
          immunisationCard: {
            id: true,
            placeOfDelivery: true,
            districtId: true,
            talukaId: true,
            level_of_care: true,
            facilityId: true,
            otherFacilityName: true,
            immunisationCardAvailable: true,
            immunisationCardProvided: true,
          },
          immunisationsDoses: {
            id: true,
            dateAdministered: true,
            latitude: true,
            longitude: true,
            vaccine: { id: true },
          },
        },
        relations: [
          'immunisationCard',
          'immunisationsDoses',
          'immunisationsDoses.vaccine',
        ],
      });

      if (!patient)
        throw new NotFoundException(
          `No Immunisation visit found for patient ID ${patientId}`,
        );

      const card = patient.immunisationCard;
      const facility = await this.resolveCardFacility(card?.facilityId);

      const response: ImmunisationVisitResponseDto = {
        patient: {
          id: patientId,
          immunisationsDoses: patient?.immunisationsDoses ?? [],
          immunisationCard: this.buildImmunisationCardVisitData(
            card,
            facility,
            patient.immunisation_number ?? null,
          ),
        },
      };

      return response;
    } catch (error) {
      this.logger.error(ApiResponseMessages.IMM_RECORDS_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.IMM_RECORDS_FETCH_ERROR,
      );
    }
  }

  private async resolveCardFacility(
    facilityId: string | null | undefined,
  ): Promise<{ id: number; name: string } | null> {
    if (!facilityId) return null;

    const parsedFacilityId = Number(facilityId);
    if (!Number.isFinite(parsedFacilityId)) return null;

    return this.facilityRepository.findOne({
      where: { id: parsedFacilityId },
      select: ['id', 'name'],
    });
  }

  private buildImmunisationCardVisitData(
    card: ImmunisationCard | null | undefined,
    facility: { id: number; name: string } | null,
    immunisationNumber: string | null,
  ): ImmunisationCardVisitData | null {
    if (!card) return null;

    return {
      id: card.id,
      placeOfDelivery: card.placeOfDelivery ?? null,
      districtId: card.districtId ?? null,
      talukaId: card.talukaId ?? null,
      level_of_care: card.level_of_care ?? null,
      facilityId: card.facilityId ?? null,
      facility,
      otherFacilityName: card.otherFacilityName ?? null,
      immunisationCardAvailable: card.immunisationCardAvailable ?? null,
      immunisationCardProvided: card.immunisationCardProvided ?? null,
      immunisationNumber,
    };
  }

  private async upsertPatientImmunisationSummary(
    patientId: number,
    em: EntityManager,
  ): Promise<void> {
    const patient = await em.findOne(Patient, {
      loadEagerRelations: false,
      where: { id: patientId },
      select: ['id', 'dob', 'gender'],
    });
    if (!patient) return;

    const dobDate = new Date(patient.dob);
    dobDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ageInDays = Math.floor(
      (today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const maxChildAgeDays = 365 * 5;
    const appliesTo =
      ageInDays > maxChildAgeDays
        ? VaccineAppliedTo.ADULT
        : VaccineAppliedTo.CHILD;

    const vaccines = await em.find(Vaccine, {
      where: { applies_to: appliesTo, isActive: true },
      select: [
        'id',
        'code',
        'display_name',
        'series_name',
        'dose_number',
        'age_min_days',
        'age_overdue_days',
        'max_age_days',
        'applies_to',
        'gender_restriction',
        'pre_requisite_codes',
        'catch_up_1_to_2_mode',
        'catch_up_1_to_2_interval_days',
        'catch_up_above_2_mode',
        'catch_up_above_2_interval_days',
      ],
    });
    const applicableVaccines = vaccines.filter((vaccine) => {
      const restriction =
        vaccine.gender_restriction ?? VaccineGenderRestriction.ANY;
      return (
        restriction === VaccineGenderRestriction.ANY ||
        (restriction === VaccineGenderRestriction.FEMALE &&
          patient.gender === Gender.FEMALE) ||
        (restriction === VaccineGenderRestriction.MALE &&
          patient.gender === Gender.MALE)
      );
    });

    const administeredDateMap = new Map<number, Date>();
    const statusMap =
      await this.serviceUtility.calculateImmunisationDosageStatuses(
        patientId,
        applicableVaccines,
        em,
        administeredDateMap,
      );
    const vaccinesWithStatus = applicableVaccines.map((vaccine) => ({
      ...vaccine,
      immunisationDosageStatus: statusMap.get(vaccine.id),
    }));

    const seriesStartAgeByGroup = new Map<string, number>();
    for (const vaccine of applicableVaccines) {
      const groupKey = (vaccine.series_name ?? vaccine.display_name ?? vaccine.code)
        .trim()
        .toLowerCase();
      const isSeriesStart =
        vaccine.dose_number === 1 || !vaccine.pre_requisite_codes?.length;
      const candidateAge = vaccine.age_min_days ?? 0;
      const existingAge = seriesStartAgeByGroup.get(groupKey);

      if (
        existingAge === undefined ||
        (isSeriesStart && candidateAge < existingAge)
      ) {
        seriesStartAgeByGroup.set(groupKey, candidateAge);
      }
    }

    const sortedVaccines = [...vaccinesWithStatus].sort((a, b) => {
      const groupA = (a.series_name ?? a.display_name ?? a.code).trim().toLowerCase();
      const groupB = (b.series_name ?? b.display_name ?? b.code).trim().toLowerCase();
      const ageA = seriesStartAgeByGroup.get(groupA) ?? (a.age_min_days ?? 0);
      const ageB = seriesStartAgeByGroup.get(groupB) ?? (b.age_min_days ?? 0);
      if (ageA !== ageB) return ageA - ageB;
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      if (a.dose_number !== b.dose_number) return a.dose_number - b.dose_number;
      return a.id - b.id;
    });

    let lastAdminIndex = -1;
    for (let i = 0; i < sortedVaccines.length; i += 1) {
      if ([ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(sortedVaccines[i].immunisationDosageStatus!)) {
        lastAdminIndex = i;
      }
    }

    let status = ImmunisationDosageStatus.PENDING;
    let nextDueDate: Date | null = null;

    const latestAdminDateByCode = new Map<string, Date>();
    for (const vaccine of applicableVaccines) {
      const administeredDate = administeredDateMap.get(vaccine.id);
      if (!administeredDate) continue;
      const existingByCode = latestAdminDateByCode.get(vaccine.code);
      if (!existingByCode || administeredDate > existingByCode) {
        latestAdminDateByCode.set(vaccine.code, administeredDate);
      }
    }

    if (appliesTo === VaccineAppliedTo.ADULT) {
      const vaccineSeries = new Map<string, typeof sortedVaccines>();
      for (const vaccine of sortedVaccines) {
        const groupKey = (vaccine.series_name ?? vaccine.display_name ?? vaccine.code)
          .trim()
          .toLowerCase();
        const items = vaccineSeries.get(groupKey) ?? [];
        items.push(vaccine);
        vaccineSeries.set(groupKey, items);
      }

      const orderedSeriesKeys = [...new Set(sortedVaccines.map((vaccine) =>
        (vaccine.series_name ?? vaccine.display_name ?? vaccine.code)
          .trim()
          .toLowerCase(),
      ))];

      const isCatchUpAllowed = (mode?: VaccineCatchUpMode | null) =>
        !!mode &&
        ![VaccineCatchUpMode.NOT_ALLOWED, VaccineCatchUpMode.NA].includes(mode);

      for (const seriesKey of orderedSeriesKeys) {
        const seriesVaccines = [...(vaccineSeries.get(seriesKey) ?? [])].sort(
          (a, b) => a.dose_number - b.dose_number || a.id - b.id,
        );
        if (!seriesVaccines.length) continue;

        const administeredSeriesVaccines = seriesVaccines.filter(
          (vaccine) =>
            [ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(vaccine.immunisationDosageStatus!),
        );

        const nextVaccine = administeredSeriesVaccines.length
          ? seriesVaccines.find(
            (vaccine) =>
              vaccine.dose_number >
              administeredSeriesVaccines[
              administeredSeriesVaccines.length - 1
                ].dose_number &&
              ![ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(vaccine.immunisationDosageStatus!),
          )
          : seriesVaccines.find(
            (vaccine) =>
              ![ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO].includes(vaccine.immunisationDosageStatus!),
          );

        if (!nextVaccine) {
          continue;
        }

        if (
          nextVaccine.max_age_days !== null &&
          nextVaccine.max_age_days !== undefined &&
          ageInDays > nextVaccine.max_age_days &&
          !isCatchUpAllowed(nextVaccine.catch_up_above_2_mode)
        ) {
          continue;
        }

        const latestPrerequisiteDate = nextVaccine.pre_requisite_codes?.length
          ? nextVaccine.pre_requisite_codes
          .map((code) => latestAdminDateByCode.get(code))
          .filter((date): date is Date => !!date)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
          : null;

        const anchorDate = latestPrerequisiteDate ?? dobDate;
        nextDueDate =
          ageInDays < (nextVaccine.age_min_days ?? 0)
            ? this.addDays(dobDate, nextVaccine.age_min_days ?? 0)
            : this.addDays(anchorDate, nextVaccine.age_min_days ?? 0);
        status =
          nextVaccine.immunisationDosageStatus ??
          ImmunisationDosageStatus.PENDING;
        if (
          nextVaccine.max_age_days !== null &&
          nextVaccine.max_age_days !== undefined
        ) {
          const lastAllowedDate = this.addDays(
            dobDate,
            nextVaccine.max_age_days,
          );
          if (today > lastAllowedDate || nextDueDate > lastAllowedDate) {
            status = ImmunisationDosageStatus.EXPIRED;
            if (nextDueDate > lastAllowedDate) {
              nextDueDate = lastAllowedDate;
            }
          }
        }
        if (
          nextDueDate &&
          nextDueDate > today &&
          status !== ImmunisationDosageStatus.EXPIRED
        ) {
          status = ImmunisationDosageStatus.PENDING;
        }
        break;
      }
    } else {
      const nextIndex = lastAdminIndex + 1;
      const nextVaccine =
        nextIndex >= 0 && nextIndex < sortedVaccines.length
          ? sortedVaccines[nextIndex]
          : undefined;
      if (nextVaccine) {
        const latestPrerequisiteDate = nextVaccine.pre_requisite_codes?.length
          ? nextVaccine.pre_requisite_codes
          .map((code) => latestAdminDateByCode.get(code))
          .filter((date): date is Date => !!date)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
          : null;

        const anchorDate = latestPrerequisiteDate ?? dobDate;
        nextDueDate =
          ageInDays < (nextVaccine.age_min_days ?? 0)
            ? this.addDays(dobDate, nextVaccine.age_min_days ?? 0)
            : this.addDays(anchorDate, nextVaccine.age_min_days ?? 0);
        status =
          nextVaccine.immunisationDosageStatus ??
          ImmunisationDosageStatus.PENDING;
        if (
          nextVaccine.max_age_days !== null &&
          nextVaccine.max_age_days !== undefined
        ) {
          const lastAllowedDate = this.addDays(
            dobDate,
            nextVaccine.max_age_days,
          );
          if (today > lastAllowedDate || nextDueDate > lastAllowedDate) {
            status = ImmunisationDosageStatus.EXPIRED;
            if (nextDueDate > lastAllowedDate) {
              nextDueDate = lastAllowedDate;
            }
          }
        }
      }
    }

    const remainingVaccinePriority = [
      ImmunisationDosageStatus.DEFAULTER,
      ImmunisationDosageStatus.SCHEDULED,
      ImmunisationDosageStatus.PENDING,
      ImmunisationDosageStatus.EXPIRED,
    ];

    const prioritizedRemainingVaccine = remainingVaccinePriority
      .map((priorityStatus) =>
        sortedVaccines.find(
          (vaccine) => vaccine.immunisationDosageStatus === priorityStatus,
        ),
      )
      .find((vaccine) => !!vaccine);

    if (prioritizedRemainingVaccine) {
      const latestPrerequisiteDate =
        prioritizedRemainingVaccine.pre_requisite_codes?.length
          ? prioritizedRemainingVaccine.pre_requisite_codes
          .map((code) => latestAdminDateByCode.get(code))
          .filter((date): date is Date => !!date)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
          : null;

      status =
        prioritizedRemainingVaccine.immunisationDosageStatus ??
        ImmunisationDosageStatus.PENDING;

      if (
        !prioritizedRemainingVaccine.pre_requisite_codes?.length ||
        latestPrerequisiteDate
      ) {
        const anchorDate = latestPrerequisiteDate ?? dobDate;
        nextDueDate =
          ageInDays < (prioritizedRemainingVaccine.age_min_days ?? 0)
            ? this.addDays(
              dobDate,
              prioritizedRemainingVaccine.age_min_days ?? 0,
            )
            : this.addDays(
              anchorDate,
              prioritizedRemainingVaccine.age_min_days ?? 0,
            );
      } else {
        nextDueDate = null;
      }

      if (
        nextDueDate &&
        prioritizedRemainingVaccine.max_age_days !== null &&
        prioritizedRemainingVaccine.max_age_days !== undefined
      ) {
        const lastAllowedDate = this.addDays(
          dobDate,
          prioritizedRemainingVaccine.max_age_days,
        );
        if (nextDueDate > lastAllowedDate) {
          nextDueDate = lastAllowedDate;
        }
      }
    }

    const record = await em.findOne(PatientImmunisation, {
      where: { patient: { id: patientId } },
      loadEagerRelations: false,
    });

    const payload: Partial<PatientImmunisation> = {
      patient: { id: patientId } as Patient,
      status,
      nextDueDate,
    };

    if (record) {
      await em.update(PatientImmunisation, { id: record.id }, payload);
    } else {
      const entity = this.patientImmunisationRepository.create(payload as PatientImmunisation);
      await em.save(entity);
    }
  }

  private buildImmunisationCardEntity(
    immunisationCard: ImmunisationCardDto,
    patientId: number,
    existingCardId?: number,
  ): ImmunisationCard {
    const {
      facility,
      immunisationNumber: _immunisationNumber,
      ...cardData
    } = immunisationCard;
    const isPublicFacility =
      immunisationCard.placeOfDelivery === PlaceOfDelivery.PUBLIC_HEALTH_FACILITY;
    const isPrivateOrInformalDeliveryCenter =
      immunisationCard.placeOfDelivery === PlaceOfDelivery.PRIVATE_HEALTH_FACILITY ||
      immunisationCard.placeOfDelivery ===
      PlaceOfDelivery.INFORMAL_DELIVERY_CENTER;
    const hasFacilityInput = facility !== undefined && facility !== null;
    const facilityValue = hasFacilityInput ? String(facility).trim() : undefined;

    const facilityPayload: Partial<ImmunisationCard> = {};
    if (isPublicFacility) {
      if (hasFacilityInput) {
        if (facilityValue && facilityValue.length > 0) {
          const parsedFacilityId = Number(facilityValue);
          if (Number.isFinite(parsedFacilityId)) {
            facilityPayload.facilityId = String(parsedFacilityId);
            facilityPayload.otherFacilityName = null;
          } else {
            const otherFacilityName = immunisationCard.otherFacilityName?.trim();
            facilityPayload.facilityId = null;
            facilityPayload.otherFacilityName =
              otherFacilityName && otherFacilityName.length > 0 ? otherFacilityName : facilityValue;
          }
        } else {
          facilityPayload.facilityId = null;
          facilityPayload.otherFacilityName = null;
        }
      }
    } else {
      facilityPayload.facilityId = null;
      facilityPayload.otherFacilityName = isPrivateOrInformalDeliveryCenter
        ? immunisationCard.otherFacilityName?.trim() || null
        : null;
    }

    return this.immunisationCardRepository.create({
      ...cardData,
      ...facilityPayload,
      id: existingCardId,
      districtId:
        immunisationCard.districtId !== undefined
          ? Number(immunisationCard.districtId)
          : undefined,
      talukaId:
        immunisationCard.talukaId !== undefined
          ? Number(immunisationCard.talukaId)
          : undefined,
      patient: { id: patientId } as Patient,
    });
  }

  private async getExistingImmunisationCardId(
    patientId: number,
    em: EntityManager,
    existingCard?: ImmunisationCard | null,
  ): Promise<number | undefined> {
    if (existingCard?.id) {
      return existingCard.id;
    }
    const stored = await em
      .getRepository(ImmunisationCard)
      .createQueryBuilder('immunisationCard')
      .select('immunisationCard.id')
      .where('immunisationCard.patient_id = :patientId', { patientId })
      .limit(1)
      .getOne();
    return stored?.id;
  }

  private async ensureImmunisationNumberAvailable(
    immunisationNumber: string | undefined | null,
    patientId: number,
    em: EntityManager,
  ): Promise<void> {
    const normalized = immunisationNumber ? String(immunisationNumber).trim() : '';
    if (!normalized) return;

    const existingPatient = await em.findOne(Patient, {
      loadEagerRelations: false,
      where: { immunisation_number: normalized },
      select: ['id'],
    });
    if (existingPatient && existingPatient.id !== patientId) {
      throw new ConflictException(
        'Immunisation number is already assigned to another patient.',
      );
    }
  }

  private async syncPatientImmunisationNumber(
    patientId: number,
    immunisationNumber: string | undefined | null,
    em: EntityManager,
  ): Promise<void> {
    const normalized = immunisationNumber ? String(immunisationNumber).trim() : '';
    if (!normalized) return;

    await this.ensureImmunisationNumberAvailable(normalized, patientId, em);

    const patient = await em.findOne(Patient, {
      loadEagerRelations: false,
      where: { id: patientId },
      select: ['id', 'immunisation_number'],
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id ${patientId} not found`);
    }

    if (patient.immunisation_number === normalized) {
      return;
    }

    await em.update(
      Patient,
      { id: patientId },
      { immunisation_number: normalized },
    );
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private assertMobileNewAdministeredCoordinates(
    immunisationDto: CreateImmunisationWithCardDto,
  ): void {
    if (!immunisationDto.isMobile) {
      return;
    }

    assertNewAdministeredCoordinates(
      immunisationDto.doses,
      immunisationDto.isMobile,
    );
  }

  private async mobilePatient(
    immunisationDto: CreateImmunisationWithCardDto,
    userId: number,
    userUcId: number,
    em: EntityManager,
  ): Promise<{ patient: Patient | null; reason?: string }> {
    if (immunisationDto.patientId) {
      const patient = await em.findOne(Patient, {
        where: { id: immunisationDto.patientId }, // EM-99: Not filtering by userUcId
      });
      if (!patient) {
        return { patient: null, reason: 'User does not have access to this patient.' };
      }

      return { patient, reason: undefined };
    }

    const normalizedMobileHash = this.normalizeMobilePatientHash(
      immunisationDto.patientMobileHash,
    );
    if (!normalizedMobileHash) {
      return {
        patient: null,
        reason:
          'patientMobileHash is required when patientId is missing for mobile immunisation.',
      };
    }

    const existingPatient = await this.patientsService.findByMobileHash(
      normalizedMobileHash,
      em,
    );
    if (existingPatient) {
      // EM-99
      // if (existingPatient.uc_id !== userUcId) {
      //   return { patient: null, reason: 'User does not have access to this patient.' };
      // }

      return { patient: existingPatient, reason: undefined };
    }

    if (!immunisationDto.patient) {
      return {
        patient: null,
        reason:
          'patient is required when patientId is missing for mobile immunisation.',
      };
    }

    const patientPayload = {
      ...immunisationDto.patient,
      uc_id: immunisationDto.patient.uc_id ?? userUcId,
    };

    // EM-99
    // if (patientPayload.uc_id !== userUcId) {
    //   return {
    //     patient: null,
    //     reason: 'User does not have access to create a patient in another UC.',
    //   };
    // }

    const createdPatientResponse = await this.patientsService.create(
      userId,
      patientPayload,
      {
        entityManager: em,
        mobileHash: normalizedMobileHash,
        registrationType: PatientRegistrationType.OUTREACH,
      },
    );

    const patientId = createdPatientResponse?.data?.id;
    if (!patientId) {
      return {
        patient: null,
        reason: 'Unable to resolve patient for mobile immunisation.',
      };
    }

    const patient = await em.findOne(Patient, {
      where: { id: patientId }, // EM-99: Not filtering by userUcId
    });
    if (!patient) {
      return { patient: null, reason: 'User does not have access to this patient.' };
    }
    return { patient, reason: undefined };
  }

  private normalizeMobilePatientHash(mobileHash?: string): string | null {
    if (!mobileHash) {
      return null;
    }

    const normalizedMobileHash = mobileHash.trim();
    return normalizedMobileHash.length > 0 ? normalizedMobileHash : null;
  }
}
