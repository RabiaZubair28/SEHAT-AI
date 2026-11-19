import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { generateMrNo } from 'src/common/helper';
import { Patient } from './entities/patient.entity';
import { Brackets, EntityManager, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientSearchDto } from './dto/search-patient.dto';
import { successResponse } from 'src/common/utils/response.util';
import { User } from 'src/users/entities/user.entity';
import { MedicalHistory } from 'src/medical-history/entities/medical-history.entity';
import { CreateMedicalHistoryDto } from 'src/medical-history/dto/create-medical-history.dto';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { CNICProvider, Gender, PatientDailyRollupType, PatientRegistrationType } from 'src/common/enums/enums';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { PatientAdditionalInfo } from 'src/patient-additional-info/entities/patient-additional-info.entity';
import { PatientSocialDeterminants } from 'src/patient-social-determinants/entities/patient-social-determinant.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { PatientDailyRollup } from './entities/patient-daily-rollup.entity';
import { PatientsQueryService } from './patients-query.service';
import { PatientSearchResponseDto, PatientSearchResultDto } from './dto/patient-search-response.dto';
import { PatientRollupService } from './patient-rollup.service';

type CreatePatientOptions = {
  entityManager?: EntityManager;
  mobileHash?: string;
  registrationType?: PatientRegistrationType;
};

type PatientReportFacilityGenderCount = {
  facilityId: number | null;
  facilityName: string;
  maleCount: number;
  femaleCount: number;
};

type PatientReportRollupCounts = {
  patientCount: number;
  totalMaleCount: number;
  totalFemaleCount: number;
  facilityWiseGenderCount: PatientReportFacilityGenderCount[];
};

type FindAllPatientsOptions = {
  requireImmunisationNumber?: boolean;
};

const PATIENT_ROLLUP_JOB_NAME = 'patient-daily-rollup-v1';

@Injectable()
export class PatientsService {
  private readonly logger: Logger = new Logger(PatientsService.name);
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(MedicalHistory)
    private readonly medicalHistoryRepository: Repository<MedicalHistory>,
    @InjectRepository(PatientDailyRollup)
    private readonly patientDailyRollupRepository: Repository<PatientDailyRollup>,
    private readonly patientsQueryService: PatientsQueryService,
    private readonly patientRollupService: PatientRollupService,
  ) { }

  private applyPatientRollupDateFilters(
    queryBuilder: SelectQueryBuilder<PatientDailyRollup>,
    filters: any,
  ): SelectQueryBuilder<PatientDailyRollup> {
    if (filters?.dateFrom) {
      queryBuilder.andWhere('rollup.rollup_date >= :rollupDateFrom', {
        rollupDateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('rollup.rollup_date <= :rollupDateTo', {
        rollupDateTo: filters.dateTo,
      });
    }

    return queryBuilder;
  }

  async create(
    currentUserId: number,
    createPatientDto: CreatePatientDto,
    options: CreatePatientOptions = {},
  ) {
    let queryRunner: QueryRunner | undefined;
    let entityManager = options.entityManager;

    if (!entityManager) {
      queryRunner = this.patientRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      entityManager = queryRunner.manager;
    }

    try {
      const user = await entityManager.findOne(User, {
        where: { id: currentUserId },
        relations: ['facility'],
      });

      if (user?.facility?.id === undefined) {
        throw new HttpException(ApiResponseMessages.U_N_ASSOC_FAC, 400);
      }

      const facility_id: number = user.facility.id;
      const currentYear = new Date().getFullYear();
      const { additional_info, social_determinants, ...rest } = createPatientDto;
      const data = { ...(rest as Record<string, unknown>) };
      delete data.registration_type;
      const normalizedMobileHash = this.normalizeMobileHash(options.mobileHash);

      if (normalizedMobileHash) {
        await entityManager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
          `patients_mobile_hash:${normalizedMobileHash}`,
        ]);

        const existingPatient = await entityManager.findOne(Patient, {
          where: { mobile_hash: normalizedMobileHash },
        });

        if (existingPatient) {
          if (queryRunner) {
            await queryRunner.commitTransaction();
          }

          return successResponse(
            existingPatient,
            'Patient already exists for provided mobile hash',
            200,
          );
        }
      }

      const generatedMrNo = generateMrNo(currentYear, facility_id);

      if (createPatientDto.cnic_provider === CNICProvider.CnicNA) {
        data.cnic = undefined;
      }

      if (createPatientDto.cnic_provider === CNICProvider.Self) {
        await entityManager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
          createPatientDto.cnic,
        ]);
      }
      const patient = entityManager.create(Patient, {
        ...data,
        mr_no: String(generatedMrNo),
        mobile_hash: normalizedMobileHash ?? null,
        registration_type:
          options.registrationType ?? PatientRegistrationType.INTERNAL,
        facility_id: Number(facility_id),
        additionalInfo: additional_info,
        socialDeterminants: social_determinants,
      });

      await this.patientRollupService.lockForPatientCreation(entityManager);
      const savedPatient = await entityManager.save(patient);
      await this.patientRollupService.incrementForCreatedPatient(
        savedPatient.id,
        entityManager,
      );

      if (queryRunner) {
        await queryRunner.commitTransaction();
      }

      return successResponse(
        savedPatient,
        ApiSuccessResponseMessages.PT_C_SUC,
        200,
      );
    } catch (error) {
      if (queryRunner?.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      const trace = error?.stack || error?.detail || error?.message;

      if (error.constraint === 'uq_patients_cnic_self') {
        this.logger.error(
          'Patient create conflict: duplicate CNIC for Self provider',
          trace,
        );
        throw new ConflictException('CNIC already exists for Self provider');
      }
      if (
        error.code === '23505' &&
        error.constraint === 'uq_patients_immunisation_number'
      ) {
        this.logger.error(
          'Patient create conflict: duplicate immunisation number',
          trace,
        );
        throw new ConflictException('Immunisation number already exists');
      }
      if (
        error.code === '23505' &&
        error.constraint === 'uq_patients_mobile_hash'
      ) {
        this.logger.error(
          'Patient create conflict: duplicate mobile hash',
          trace,
        );
        throw new ConflictException('Patient mobile hash already exists');
      }
      this.logger.error(ApiResponseMessages.PT_CREATE_FAILED, trace);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PT_CREATE_FAILED,
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async findByMobileHash(
    mobileHash: string,
    entityManager?: EntityManager,
  ): Promise<Patient | null> {
    const normalizedMobileHash = this.normalizeMobileHash(mobileHash);
    if (!normalizedMobileHash) {
      return null;
    }

    const manager = entityManager ?? this.patientRepository.manager;
    return manager.findOne(Patient, {
      where: { mobile_hash: normalizedMobileHash },
    });
  }

  async findAll(
    filters: PatientSearchDto,
    options: FindAllPatientsOptions = {},
  ): Promise<PatientSearchResponseDto> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const patientQb = this.patientRepository
        .createQueryBuilder('patient')
        .select('patient.id');

      this.patientsQueryService.applyPatientFilters(patientQb, filters);

      if (options.requireImmunisationNumber) {
        patientQb.andWhere('patient.immunisation_number IS NOT NULL');
      }

      // ES-780
      // Do not use orderBy here, it will cause a sequential scan
      // We orderBy patient id in loadPatientsWithRelations when we have already filtered patients
      const [patients, total] = await patientQb
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      let data: PatientSearchResultDto[] = [];
      if (patients.length > 0) {
        const patientIds = patients.map((patient) => patient.id);
        data = await this.patientsQueryService.loadPatientsWithRelations(patientIds);
      }

      return successResponse(
        data,
        'Patients Fetched Successfully',
        200,
        page,
        limit,
        total,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.PT_UP_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.F_FIND_ALL_PT,
      );
    }
  }

  async findOne(id: number) {
    try {
      const patient = await this.patientRepository.findOne({
        where: { id },
        relations: [
          'additionalInfo',
          'socialDeterminants',
          'medicalHistories',
          'appointments',
        ],
      });

      if (!patient) {
        throw new NotFoundException(ApiResponseMessages.PT_N_FOUND);
      }
      return successResponse(patient, ApiSuccessResponseMessages.PT_F_SUC, 200);
    } catch (error) {
      this.logger.error(ApiResponseMessages.F_PT_SEARCH, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.F_PT_SEARCH,
      );
    }
  }

  async addOrUpdateMedicalHistory(
    currentUserId: number,
    patientId: number,
    medicalHistoryDto: CreateMedicalHistoryDto,
  ) {
    try {
      let medicalHistory = await this.medicalHistoryRepository.findOne({
        where: { patient: { id: patientId } },
      });

      if (medicalHistory) {
        Object.assign(medicalHistory, medicalHistoryDto);
      } else {
        medicalHistory = this.medicalHistoryRepository.create({
          ...medicalHistoryDto,
          patient: { id: patientId },
          doctor: { id: currentUserId },
        });
      }

      const saved = await this.medicalHistoryRepository.save(medicalHistory);
      return successResponse(
        saved,
        ApiSuccessResponseMessages.MED_HIST_SAV,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.F_S_MED_HIS, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.F_S_MED_HIS,
      );
    }
  }

  async update(
    currentUserId: number,
    id: number,
    updateDto: UpdatePatientDto,
  ): Promise<Patient> {
    try {
      const existingPatient = await this.patientRepository.findOne({
        where: { id },
        relations: ['additionalInfo', 'socialDeterminants'],
      });

      if (!existingPatient) {
        throw new NotFoundException(`Patient with id ${id} not found`);
      }

      if (updateDto.medicalHistories) {
        await this.addOrUpdateMedicalHistory(
          currentUserId,
          id,
          updateDto.medicalHistories,
        );
      }

      Object.assign(
        existingPatient,
        this.filterDefinedFields(updateDto, [
          'first_name',
          'last_name',
          'cnic',
          'cnic_provider',
          'nationalityStatus',
          'dob',
          'immunisation_number',
          'gender',
          'phone_provider',
          'phone_number',
          'address',
          'division_id',
          'district_id',
          'facility_id',
          'taluka_id',
          'uc_id',
        ]),
      );

      if (existingPatient.cnic_provider === CNICProvider.CnicNA) {
        existingPatient.cnic = null;
      }

      if (updateDto.additionalInfo) {
        const additionalInfoUpdates = this.filterDefinedFields(
          updateDto.additionalInfo,
        );

        if (Object.keys(additionalInfoUpdates).length > 0) {
          if (!existingPatient.additionalInfo) {
            const hasRequiredFields =
              additionalInfoUpdates.marital_status !== undefined &&
              additionalInfoUpdates.guardian_name !== undefined;

            if (!hasRequiredFields) {
              throw new BadRequestException(
                'Additional info does not exist for this patient. Provide marital_status and guardian_name to create it.',
              );
            }

            existingPatient.additionalInfo =
              this.patientRepository.manager.create(PatientAdditionalInfo, {
                ...additionalInfoUpdates,
                patient: existingPatient,
              });
          } else {
            Object.assign(existingPatient.additionalInfo, additionalInfoUpdates);
          }
        }
      }

      if (updateDto.socialDeterminants) {
        const socialDeterminantsUpdates = this.filterDefinedFields(
          updateDto.socialDeterminants,
        );

        if (Object.keys(socialDeterminantsUpdates).length > 0) {
          if (!existingPatient.socialDeterminants) {
            existingPatient.socialDeterminants =
              this.patientRepository.manager.create(PatientSocialDeterminants, {
                ...socialDeterminantsUpdates,
                patient: existingPatient,
              });
          } else {
            Object.assign(
              existingPatient.socialDeterminants,
              socialDeterminantsUpdates,
            );
          }
        }
      }

      return await this.patientRepository.save(existingPatient);
    } catch (error) {
      this.logger.error(ApiResponseMessages.PT_UP_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PT_UP_FAILED,
      );
    }
  }

  private filterDefinedFields<T extends Record<string, any>>(
    data: T,
    allowedKeys?: (keyof T)[],
  ): Partial<T> {
    const result: Partial<T> = {};

    for (const key in data) {
      if (
        Object.prototype.hasOwnProperty.call(data, key) &&
        data[key] !== undefined &&
        (!allowedKeys || allowedKeys.includes(key as keyof T))
      ) {
        result[key] = data[key];
      }
    }

    return result;
  }

  private applyAllPatientsReportFilters(
    queryBuilder: SelectQueryBuilder<Patient>,
    filters: any,
  ): SelectQueryBuilder<Patient> {
    const facilityId = Number(filters?.facilityId);

    if (!Number.isNaN(facilityId) && facilityId > 0) {
      queryBuilder.andWhere('patient.facility_id = :facilityId', {
        facilityId,
      });
    }

    if (filters?.gender) {
      queryBuilder.andWhere('patient.gender = :gender', {
        gender: filters.gender,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('DATE(patient.created_at) >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('DATE(patient.created_at) <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            // TODO: CONCAT prevents index usage on first_name/last_name
            .where(
              "CONCAT(patient.first_name, ' ', patient.last_name) ILIKE :search",
              { search: `%${filters.search}%` },
            )
            // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
            .orWhere('patient.phone_number LIKE :search', {
              search: `${filters.search}%`,
            })
            // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
            .orWhere('patient.mr_no LIKE :search', {
              search: `${filters.search}%`,
            })
            // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
            .orWhere('patient.cnic LIKE :search', {
              search: `${filters.search}%`,
            });
        }),
      );
    }

    return queryBuilder;
  }

  private getPatientRollupCountSelect(gender?: Gender): string {
    if (gender === Gender.MALE) return 'COALESCE(SUM(rollup.male_count), 0)';
    if (gender === Gender.FEMALE) {
      return 'COALESCE(SUM(rollup.female_count), 0)';
    }
    if (gender === Gender.OTHER) return 'COALESCE(SUM(rollup.other_count), 0)';
    return 'COALESCE(SUM(rollup.patient_count), 0)';
  }

  private async getAllPatientsReportRollupCounts(
    filters: any,
  ): Promise<PatientReportRollupCounts | null> {
    if (filters?.search) return null;

    const facilityId = Number(filters?.facilityId ?? filters?.facility_id);
    const hasFacilityFilter = !Number.isNaN(facilityId) && facilityId > 0;
    const gender = Object.values(Gender).includes(filters?.gender)
      ? (filters.gender as Gender)
      : undefined;
    const aggregationType = hasFacilityFilter
      ? PatientDailyRollupType.FACILITY
      : PatientDailyRollupType.TOTAL;
    const dimensionId = hasFacilityFilter ? facilityId : 0;

    try {
      const countQuery = this.applyPatientRollupDateFilters(
        this.patientDailyRollupRepository
          .createQueryBuilder('rollup')
          .select(this.getPatientRollupCountSelect(gender), 'patient_count')
          .addSelect(
            gender && gender !== Gender.MALE
              ? '0'
              : 'COALESCE(SUM(rollup.male_count), 0)',
            'male_count',
          )
          .addSelect(
            gender && gender !== Gender.FEMALE
              ? '0'
              : 'COALESCE(SUM(rollup.female_count), 0)',
            'female_count',
          )
          .addSelect(
            `EXISTS (
              SELECT 1
              FROM patient_rollup_checkpoint checkpoint
              WHERE checkpoint.job_name = :rollupJobName
            )`,
            'rollup_checkpoint_exists',
          )
          .addSelect(
            `(SELECT checkpoint.completed
              FROM patient_rollup_checkpoint checkpoint
              WHERE checkpoint.job_name = :rollupJobName)`,
            'rollup_completed',
          )
          .where('rollup.aggregation_type = :aggregationType', {
            aggregationType,
          })
          .andWhere('rollup.dimension_id = :dimensionId', { dimensionId })
          .setParameter('rollupJobName', PATIENT_ROLLUP_JOB_NAME),
        filters,
      );

      console.log('[Patients Report] Rollup Count SQL:', countQuery.getSql());
      const countRow:
        | {
            patient_count: string;
            male_count: string;
            female_count: string;
            rollup_checkpoint_exists: boolean;
            rollup_completed: boolean;
          }
        | undefined = await countQuery.getRawOne();

      if (
        !countRow ||
        countRow.rollup_checkpoint_exists !== true ||
        countRow.rollup_completed !== true
      ) {
        return null;
      }

      const facilityQuery = this.applyPatientRollupDateFilters(
        this.patientDailyRollupRepository
          .createQueryBuilder('rollup')
          .leftJoin(Facility, 'facility', 'facility.id = rollup.dimension_id')
          .select('rollup.dimension_id', 'facilityId')
          .addSelect(
            'COALESCE(facility.name, :unknownFacility)',
            'facilityName',
          )
          .addSelect(
            gender && gender !== Gender.MALE
              ? '0'
              : 'COALESCE(SUM(rollup.male_count), 0)',
            'maleCount',
          )
          .addSelect(
            gender && gender !== Gender.FEMALE
              ? '0'
              : 'COALESCE(SUM(rollup.female_count), 0)',
            'femaleCount',
          )
          .where('rollup.aggregation_type = :facilityAggregationType', {
            facilityAggregationType: PatientDailyRollupType.FACILITY,
          })
          .groupBy('rollup.dimension_id')
          .addGroupBy('facility.name')
          .orderBy('facility.name', 'ASC')
          .addOrderBy('rollup.dimension_id', 'ASC')
          .setParameters({
            unknownFacility: 'Unknown Facility',
          }),
        filters,
      );

      if (hasFacilityFilter) {
        facilityQuery.andWhere('rollup.dimension_id = :facilityDimensionId', {
          facilityDimensionId: facilityId,
        });
      }

      console.log(
        '[Patients Report] Rollup Facility SQL:',
        facilityQuery.getSql(),
      );
      const facilityRows = await facilityQuery.getRawMany();

      return {
        patientCount: Number(countRow.patient_count ?? 0),
        totalMaleCount: Number(countRow.male_count ?? 0),
        totalFemaleCount: Number(countRow.female_count ?? 0),
        facilityWiseGenderCount: facilityRows.map((row) => ({
          facilityId:
            row?.facilityId === null || row?.facilityId === undefined
              ? null
              : Number(row.facilityId),
          facilityName: row?.facilityName ?? 'Unknown Facility',
          maleCount: Number(row?.maleCount) || 0,
          femaleCount: Number(row?.femaleCount) || 0,
        })),
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Unable to use patient rollup counts; falling back to source queries: ${(error as Error)?.message}`,
      );
      return null;
    }
  }

  async getAllPatientsReport(filters: any) {
    try {
      const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters?.limit) > 0 ? Number(filters.limit) : 10;
      const skip = (page - 1) * limit;

      const queryBuilder = this.applyAllPatientsReportFilters(
        this.patientRepository.createQueryBuilder('patient'),
        filters,
      );

      queryBuilder.select([
        `patient.id AS "id"`,
        `patient.mr_no AS "mrNo"`,
        `CONCAT(patient.first_name, ' ', patient.last_name) AS "fullName"`,
        `EXTRACT(YEAR FROM AGE(patient.dob)) AS "age"`,
        `patient.gender AS "gender"`,
        `patient.phone_number AS "phoneNumber"`,
        `patient.cnic AS "cnic"`,
        `patient.created_at AS "registrationDate"`,
      ]);

      const rollupCounts = await this.getAllPatientsReportRollupCounts(filters);
      let count = rollupCounts?.patientCount;
      if (count === undefined) {
        const countQueryBuilder = queryBuilder.clone();
        count = await countQueryBuilder.getCount();
      }
      console.log(
        `[Patients Report] Count source: ${
          rollupCounts ? 'daily rollup' : 'patients fallback'
        }.`,
      );

      const patientsQueryBuilder = queryBuilder
        .skip(skip)
        .take(limit);
      const patients = await patientsQueryBuilder.getRawMany();

      let rawFacilityWiseGenderCount: any[] = [];
      if (!rollupCounts) {
        const facilityWiseGenderCountQueryBuilder =
          this.applyAllPatientsReportFilters(
            this.patientRepository
              .createQueryBuilder('patient')
              .leftJoin(
                Facility,
                'facility',
                'facility.id = patient.facility_id',
              )
              .select('patient.facility_id', 'facilityId')
              .addSelect('facility.name', 'facilityName')
              .addSelect(
                'SUM(CASE WHEN patient.gender = :maleGender THEN 1 ELSE 0 END)',
                'maleCount',
              )
              .addSelect(
                'SUM(CASE WHEN patient.gender = :femaleGender THEN 1 ELSE 0 END)',
                'femaleCount',
              )
              .groupBy('patient.facility_id')
              .addGroupBy('facility.name')
              .orderBy('facility.name', 'ASC')
              .addOrderBy('patient.facility_id', 'ASC')
              .setParameters({
                maleGender: Gender.MALE,
                femaleGender: Gender.FEMALE,
              }),
            filters,
          );
        rawFacilityWiseGenderCount =
          await facilityWiseGenderCountQueryBuilder.getRawMany();
      }

      const facilityWiseGenderCount =
        rollupCounts?.facilityWiseGenderCount ??
        rawFacilityWiseGenderCount.map((row) => ({
          facilityId:
            row?.facilityId === null || row?.facilityId === undefined
              ? null
              : Number(row.facilityId),
          facilityName: row?.facilityName ?? 'Unknown Facility',
          maleCount: Number(row?.maleCount) || 0,
          femaleCount: Number(row?.femaleCount) || 0,
        }));
      const totalMaleCount =
        rollupCounts?.totalMaleCount ??
        facilityWiseGenderCount.reduce((sum, row) => sum + row.maleCount, 0);
      const totalFemaleCount =
        rollupCounts?.totalFemaleCount ??
        facilityWiseGenderCount.reduce((sum, row) => sum + row.femaleCount, 0);
      const response = successResponse(
        patients,
        count === 0
          ? 'No Data Found'
          : 'All patients report fetched successfully',
        200,
        page,
        limit,
        count,
      );

      return {
        ...response,
        summary: {
          totalMaleCount,
          totalFemaleCount,
          facilityWiseGenderCount,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch all-patients report', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch all-patients report',
      );
    }
  }

  async getSinglePatientReport(filters: any) {
    try {
      const patientId = Number(filters?.patientId);
      const facilityId = Number(filters?.facilityId);
      const search = filters?.search?.trim();

      if (!patientId && !search) {
        throw new BadRequestException(
          'Please provide either id or search for single patient report.',
        );
      }

      const queryBuilder = this.patientRepository
        .createQueryBuilder('patient')
        .leftJoinAndSelect('patient.additionalInfo', 'additionalInfo')
        .leftJoinAndSelect('patient.socialDeterminants', 'socialDeterminants')
        .leftJoinAndSelect('patient.medicalHistories', 'medicalHistories')
        .leftJoinAndSelect('patient.appointments', 'appointment')
        .leftJoinAndSelect('appointment.visit', 'visit')
        .leftJoinAndSelect('appointment.doctor', 'doctor')
        .leftJoinAndSelect('appointment.appointmentServices', 'appointmentService')
        .leftJoinAndSelect('appointmentService.service', 'service')
        .leftJoinAndSelect('appointmentService.prescriptions', 'prescription')
        .leftJoinAndSelect('prescription.medicineVariant', 'prescribedVariant')
        .leftJoinAndSelect('prescribedVariant.medicine', 'prescribedMedicine')
        .leftJoinAndSelect('appointmentService.dispenser', 'dispenser')
        .leftJoinAndSelect('dispenser.items', 'dispenseItem')
        .leftJoinAndSelect('dispenseItem.medicineVariant', 'dispensedVariant')
        .leftJoinAndSelect('dispensedVariant.medicine', 'dispensedMedicine')
        .leftJoinAndSelect('patient.immunisationsDoses', 'dose')
        .leftJoinAndSelect('dose.vaccine', 'vaccine')
        .leftJoinAndSelect('dose.vaccinatedBy', 'vaccinatedBy')
        .leftJoinAndSelect('patient.deliveries', 'delivery')
        .leftJoinAndSelect('delivery.child', 'child')
        .leftJoinAndSelect('delivery.appointmentService', 'deliveryAppointmentService')
        .leftJoinAndSelect(
          'deliveryAppointmentService.postDeliveryAssesment',
          'postDelivery',
        )
        .orderBy('appointment.createdAt', 'DESC');

      if (patientId) {
        queryBuilder.where('patient.id = :patientId', { patientId });
      } else {
        queryBuilder.where(
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
              });
          }),
        );
      }

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        queryBuilder.andWhere('patient.facility_id = :facilityId', {
          facilityId,
        });
      }

      if (filters?.dateFrom) {
        queryBuilder.andWhere('DATE(appointment.createdAt) >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters?.dateTo) {
        queryBuilder.andWhere('DATE(appointment.createdAt) <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      const patient = await queryBuilder.getOne();

      if (!patient) {
        throw new NotFoundException(ApiResponseMessages.PT_N_FOUND);
      }

      const serviceTypeFilter = filters?.serviceType;
      const visitIdFilter = Number(filters?.visitId) || undefined;

      const visitHistory = (patient.appointments || [])
        .filter((appointment) =>
          visitIdFilter ? appointment.visit?.id === visitIdFilter : true,
        )
        .map((appointment) => {
          const services = (appointment.appointmentServices || [])
            .filter((appointmentService) =>
              serviceTypeFilter
                ? appointmentService.service?.name === serviceTypeFilter
                : true,
            )
            .map((appointmentService) => appointmentService.service?.name)
            .filter(Boolean);

          return {
            appointmentId: appointment.id,
            visitId: appointment.visit?.id ?? null,
            visitDate: appointment.visit?.visitDate ?? appointment.createdAt,
            doctorName: appointment.doctor
              ? this.getFullName(
                appointment.doctor.first_name,
                appointment.doctor.last_name,
              )
              : null,
            status: appointment.status,
            services,
          };
        })
        .filter((visit) =>
          serviceTypeFilter ? visit.services.length > 0 : true,
        );

      const serviceUsage = new Map<string, number>();
      (patient.appointments || []).forEach((appointment) => {
        (appointment.appointmentServices || []).forEach((appointmentService) => {
          const serviceName = appointmentService.service?.name;
          if (!serviceName) return;
          if (
            serviceTypeFilter &&
            serviceTypeFilter.toUpperCase() !== serviceName.toUpperCase()
          ) {
            return;
          }
          serviceUsage.set(serviceName, (serviceUsage.get(serviceName) || 0) + 1);
        });
      });

      const medicinesPrescribed = (patient.appointments || []).flatMap(
        (appointment) =>
          (appointment.appointmentServices || []).flatMap((appointmentService) =>
            (appointmentService.prescriptions || []).map((prescription) => ({
              prescriptionId: prescription.id,
              medicineName: prescription.medicineVariant?.medicine?.name ?? null,
              medicineVariantId: prescription.medicineVariant?.id ?? null,
              quantity: prescription.quantity,
              dosage: prescription.medicineDosage,
              duration: prescription.medicineDuration,
              prescribedOn: prescription.createdAt,
              serviceName: appointmentService.service?.name ?? null,
            })),
          ),
      );

      const immunisationRecords = (patient.immunisationsDoses || []).map((dose) => ({
        doseId: dose.id,
        vaccineName: dose.vaccine?.display_name ?? dose.vaccine?.code,
        vaccineCode: dose.vaccine?.code,
        doseNumber: dose.vaccine?.dose_number,
        dateAdministered: dose.dateAdministered,
        administeredBy: dose.vaccinatedBy
          ? this.getFullName(
            dose.vaccinatedBy.first_name,
            dose.vaccinatedBy.last_name,
          )
          : null,
      }));

      const deliveryHistory = (patient.deliveries || []).map((delivery) => ({
        deliveryId: delivery.id,
        childId: delivery.child?.id ?? null,
        childName: delivery.child
          ? this.getFullName(delivery.child.first_name, delivery.child.last_name)
          : null,
        deliveryDate:
          delivery.appointmentService?.createdAt ?? delivery.createdAt ?? null,
        deliveryType: delivery.appointmentService?.postDeliveryAssesment?.typeOfDelivery ?? null,
      }));

      return successResponse(
        {
          patient: {
            id: patient.id,
            mrNo: patient.mr_no,
            firstName: patient.first_name,
            lastName: patient.last_name,
            fullName: this.getFullName(patient.first_name, patient.last_name),
            age: this.calculateAgeFromDob(patient.dob),
            registrationType: patient.registration_type,
            gender: patient.gender,
            phoneNumber: patient.phone_number,
            cnic: patient.cnic,
            address: patient.address,
            registrationDate: patient.created_at,
            additionalInfo: patient.additionalInfo ?? null,
            socialDeterminants: patient.socialDeterminants ?? null,
            medicalHistories: patient.medicalHistories ?? null,
          },
          visitHistory,
          servicesTaken: Array.from(serviceUsage.entries()).map(
            ([serviceName, usageCount]) => ({
              serviceName,
              usageCount,
            }),
          ),
          medicinesPrescribed,
          immunisationRecords,
          deliveryHistory,
        },
        'Single patient report fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error('Failed to fetch single-patient report', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch single-patient report',
      );
    }
  }

  private calculateAgeFromDob(dob: Date): number {
    if (!dob) return 0;

    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return Math.max(age, 0);
  }

  private getFullName(firstName?: string, lastName?: string): string {
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }

  private normalizeMobileHash(mobileHash?: string): string | null {
    if (!mobileHash) {
      return null;
    }

    const normalizedMobileHash = mobileHash.trim();
    return normalizedMobileHash.length > 0 ? normalizedMobileHash : null;
  }
}
