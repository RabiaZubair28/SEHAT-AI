import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { successResponse } from 'src/common/utils/response.util';
import { PaginationDto } from '../common/utils/pagination.dto';
import {
  AttendanceStatus,
  PatientStatus,
  RoleName,
  ServiceType,
  VisitStatus,
} from 'src/common/enums/enums';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { Succ } from 'src/common/interfaces/success-response.interface';
import { AppointmentDoctor } from 'src/appointments/entities/appointment-doctor.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { User } from 'src/users/entities/user.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { SocketGateway } from 'src/socket/socket.gateway';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { Visit } from 'src/visit/entities/visit.entity';
import { DoctorVisitDailyRollup } from './entities/doctor-visit-daily-rollup.entity';
import { DOCTOR_VISIT_ROLLUP_JOB_NAME } from './doctor-visit-rollup.service';
import { DoctorVisitRollupCheckpoint } from './entities/doctor-visit-rollup-checkpoint.entity';

@Injectable()
export class DoctorsService {
  private readonly logger: Logger = new Logger(DoctorsService.name, {});

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(DoctorVisitDailyRollup)
    private readonly doctorVisitDailyRollupRepository: Repository<DoctorVisitDailyRollup>,
    @InjectRepository(DoctorVisitRollupCheckpoint)
    private readonly doctorVisitRollupCheckpointRepository: Repository<DoctorVisitRollupCheckpoint>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly serviceUtility: ServiceUtility,
    private readonly socketGateway: SocketGateway,
  ) { }

  public async findAll(
    filters: PaginationDto,
    request: Request,
  ): Promise<Succ<Appointment[]>> {
    try {
      const user = (request as any).user as { sub: string; facilityId: string };
      const facilityId = Number(user.facilityId);

      const [appointments, total] =
        await this.appointmentRepository.findAndCount({
          where: { facility: { id: facilityId } },
          relations: ['doctor', 'patient'],
          take: filters.limit,
          skip: (filters.page - 1) * filters.limit,
          order: { createdAt: 'DESC' },
        });

      return successResponse(
        appointments,
        ApiSuccessResponseMessages.APPOINTMENTS_FETCHED_SUCCESSFULLY,
        200,
        filters.page,
        filters.limit,
        total,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.APPOINTMENTS_FETCH_ERROR,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.APPOINTMENTS_FETCH_ERROR,
      );
    }
  }

  public async findAllPending(
    filters: PaginationDto,
    doctorId: number,
  ): Promise<Succ<Appointment[]>> {
    try {
      const [appointments, total] =
        await this.appointmentRepository.findAndCount({
          where: {
            doctor: { id: doctorId },
            status: In([
              PatientStatus.PENDING,
              PatientStatus.IN_PROGRESS,
              PatientStatus.PAUSED,
            ]),
          },
          relations: {
            doctor: true,
            patient: {
              additionalInfo: true // ES-789: Needed for marital status in family service
            },
            appointmentServices: {
              service: true
            },
            visit: true,
          },
          take: filters.limit,
          skip: (filters.page - 1) * filters.limit,
          order: {
            createdAt: 'DESC',
            appointmentServices: { createdAt: 'ASC' },
          },
          loadEagerRelations: false,
        });

      return successResponse(
        appointments,
        ApiSuccessResponseMessages.PENDING_APPOINTMENTS_FETCHED_SUCCESSFULLY,
        200,
        filters.page,
        filters.limit,
        total,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.PENDING_APPOINTMENTS_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PENDING_APPOINTMENTS_FETCH_ERROR,
      );
    }
  }

  public async findAllCompleted(
    filters: PaginationDto,
    doctorId: number,
  ): Promise<Succ<Visit[]>> {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const statuses = [VisitStatus.IN_PROGRESS, VisitStatus.DISPATCHED, VisitStatus.REFERRED_OUT];
      const total = await this.getCompletedVisitCount(doctorId, statuses);

      const visitsBaseQuery = this.visitRepository
        .createQueryBuilder('visit')
        .innerJoin(
          'visit.appointments',
          'matchingAppointment',
          'matchingAppointment.doctor_id = :doctorId',
          { doctorId },
        )
        .where('visit.status IN (:...statuses)', { statuses });

      const visitIdRows = await visitsBaseQuery
        .clone()
        .select('visit.id', 'id')
        .addSelect('visit.created_at', 'createdAt')
        .distinct(true)
        .orderBy('visit.id', 'DESC')
        .offset(skip)
        .limit(filters.limit)
        .getRawMany<{ id: string; createdAt: string }>();

      const visitIds = visitIdRows.map((row) => Number(row.id));

      if (visitIds.length === 0) {
        return successResponse(
          [],
          ApiSuccessResponseMessages.COMPLETED_APPOINTMENTS_FETCHED_SUCCESSFULLY,
          200,
          filters.page,
          filters.limit,
          total,
        );
      }

      const completedVisits = await this.visitRepository
        .createQueryBuilder('visit')
        .leftJoinAndSelect('visit.patient', 'patient')
        .leftJoinAndSelect('patient.additionalInfo', 'additionalInfo')
        .leftJoinAndSelect('patient.socialDeterminants', 'socialDeterminants')
        .leftJoinAndSelect('visit.vitalAssessment', 'visitVitalAssessment')
        .leftJoinAndSelect('visit.appointments', 'appointment')
        .leftJoinAndSelect('appointment.vitalAssessment', 'appointmentVitalAssessment')
        .leftJoinAndSelect(
          'appointment.appointmentServices',
          'appointmentService',
          'appointmentService.status IN (:...serviceStatuses)',
          {
            serviceStatuses: [
              PatientStatus.COMPLETED,
              PatientStatus.IN_PROGRESS,
            ],
          },
        )
        .leftJoinAndSelect('appointmentService.service', 'service')
        .where('visit.id IN (:...visitIds)', { visitIds })
        .select([
          'visit.id',
          'visit.patient_id',
          'visit.visitDate',
          'visit.status',
          'patient.id',
          'patient.cnic_provider',
          'patient.nationalityStatus',
          'patient.cnic',
          'patient.first_name',
          'patient.last_name',
          'patient.dob',
          'patient.immunisation_number',
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
          'additionalInfo.marital_status',
          'additionalInfo.blood_group',
          'additionalInfo.guardian_name',
          'socialDeterminants.dwelling_type',
          'socialDeterminants.occupation_head_of_household',
          'socialDeterminants.household_members_count',
          'socialDeterminants.mother_tongue',
          'socialDeterminants.years_of_education',
          'visitVitalAssessment.weight',
          'visitVitalAssessment.height',
          'visitVitalAssessment.body_mass_index',
          'visitVitalAssessment.pulse',
          'visitVitalAssessment.systolic_bp',
          'visitVitalAssessment.diastolic_bp',
          'visitVitalAssessment.temperature',
          'visitVitalAssessment.respiratory_rate',
          'visitVitalAssessment.spo2',
          'visitVitalAssessment.is_anemic',
          'visitVitalAssessment.is_dehydrated',
          'visitVitalAssessment.dehydration_level',
          'visitVitalAssessment.cough_gt_2_weeks',
          'visitVitalAssessment.family_planning_user',
          'visitVitalAssessment.family_planning_methods',
          'appointment.createdAt',
          'appointment.id',
          'appointment.token_number',
          'appointment.status',
          'appointmentVitalAssessment.weight',
          'appointmentVitalAssessment.height',
          'appointmentVitalAssessment.body_mass_index',
          'appointmentVitalAssessment.pulse',
          'appointmentVitalAssessment.systolic_bp',
          'appointmentVitalAssessment.diastolic_bp',
          'appointmentVitalAssessment.temperature',
          'appointmentVitalAssessment.respiratory_rate',
          'appointmentVitalAssessment.spo2',
          'appointmentVitalAssessment.is_anemic',
          'appointmentVitalAssessment.is_dehydrated',
          'appointmentVitalAssessment.dehydration_level',
          'appointmentVitalAssessment.cough_gt_2_weeks',
          'appointmentVitalAssessment.family_planning_user',
          'appointmentVitalAssessment.family_planning_methods',
          'appointmentService.id',
          'appointmentService.status',
          'service.id',
          'service.name',
        ])
        .orderBy('visit.id', 'DESC')
        .getMany();

      return successResponse(
        completedVisits,
        ApiSuccessResponseMessages.COMPLETED_APPOINTMENTS_FETCHED_SUCCESSFULLY,
        200,
        filters.page,
        filters.limit,
        total,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.COMPLETED_APPOINTMENTS_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.COMPLETED_APPOINTMENTS_FETCH_ERROR,
      );
    }
  }

  private async getCompletedVisitCount(
    doctorId: number,
    statuses: VisitStatus[],
  ): Promise<number> {
    const rollupCount = await this.getCompletedVisitRollupCount(doctorId);
    if (rollupCount !== null) {
      return rollupCount;
    }

    return this.getCompletedVisitSourceCount(doctorId, statuses);
  }

  private async getCompletedVisitRollupCount(
    doctorId: number,
  ): Promise<number | null> {
    try {
      const checkpoint =
        await this.doctorVisitRollupCheckpointRepository.findOne({
          where: { jobName: DOCTOR_VISIT_ROLLUP_JOB_NAME },
        });

      if (!checkpoint || checkpoint.completed !== true) {
        return null;
      }

      const highWatermarkId = Number(checkpoint.highWatermarkId ?? 0);
      if (!Number.isSafeInteger(highWatermarkId) || highWatermarkId < 0) {
        return null;
      }

      const isStale = await this.isDoctorVisitRollupStale(
        highWatermarkId,
        checkpoint.updatedAt,
      );
      if (isStale) {
        return null;
      }

      const rollupRow = await this.doctorVisitDailyRollupRepository
        .createQueryBuilder('rollup')
        .select('COALESCE(SUM(rollup.visit_count), 0)', 'count')
        .where('rollup.aggregation_type = :aggregationType', {
          aggregationType: 'DOCTOR',
        })
        .andWhere('rollup.doctor_id = :doctorId', { doctorId })
        .getRawOne<{ count: string }>();

      const deltaCount = await this.getCompletedVisitSourceCount(
        doctorId,
        [VisitStatus.IN_PROGRESS, VisitStatus.DISPATCHED],
        highWatermarkId,
      );

      return Number(rollupRow?.count ?? 0) + deltaCount;
    } catch (error) {
      this.logger.warn(
        `Unable to use doctor visit rollup count; falling back to source query: ${(error as Error)?.message}`,
      );
      return null;
    }
  }

  private async isDoctorVisitRollupStale(
    highWatermarkId: number,
    checkpointUpdatedAt?: Date,
  ): Promise<boolean> {
    if (!checkpointUpdatedAt) {
      return true;
    }

    const staleRow = await this.visitRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM visits visit
          WHERE visit.id <= $1::integer
            AND visit.updated_at > $2::timestamp
          UNION ALL
          SELECT 1
          FROM appointments appointment
          WHERE appointment.visit_id <= $1::integer
            AND appointment.updated_at > $2::timestamp
        ) AS is_stale
      `,
      [highWatermarkId, checkpointUpdatedAt],
    );

    return staleRow?.[0]?.is_stale === true;
  }

  private async getCompletedVisitSourceCount(
    doctorId: number,
    statuses: VisitStatus[],
    minVisitId?: number,
  ): Promise<number> {
    const countQuery = this.visitRepository
      .createQueryBuilder('visit')
      .innerJoin(
        'visit.appointments',
        'matchingAppointment',
        'matchingAppointment.doctor_id = :doctorId',
        { doctorId },
      )
      .where('visit.status IN (:...statuses)', { statuses })
      .select('COUNT(DISTINCT visit.id)', 'count');

    if (minVisitId !== undefined) {
      countQuery.andWhere('visit.id > :minVisitId', { minVisitId });
    }

    const countRow = await countQuery.getRawOne<{ count: string }>();
    return Number(countRow?.count ?? 0);
  }

  public async findAllAdminPending(
    filters: PaginationDto,
    facilityId: number,
  ): Promise<Succ<Appointment[]>> {
    try {
      const [appointments, total] =
        await this.appointmentRepository.findAndCount({
          where: {
            status: In([PatientStatus.PENDING]),
            facility: { id: facilityId },
          },
          relations: [
            'doctor',
            'patient',
            'appointmentServices',
            'appointmentServices.service',
          ],
          take: filters.limit,
          skip: (filters.page - 1) * filters.limit,
          order: {
            createdAt: 'DESC',
            appointmentServices: { createdAt: 'DESC' },
          },
          loadEagerRelations: false,
        });

      return successResponse(
        appointments,
        ApiSuccessResponseMessages.PENDING_APPOINTMENTS_FETCHED_SUCCESSFULLY,
        200,
        filters.page,
        filters.limit,
        total,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.PENDING_APPOINTMENTS_FETCH_ERROR,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PENDING_APPOINTMENTS_FETCH_ERROR,
      );
    }
  }

  public async findCheckedInByService(
    serviceType: ServiceType,
    facilityId: number,
    currentUserId: number
  ): Promise<Succ<User[]>> {
    try {
      if (!serviceType || !facilityId) {
        throw new BadRequestException('service_type and facility_id are required');
      }

      const users = await this.userRepository.find({
        where: {
          id: Not(currentUserId),
          facility: { id: facilityId },
          services: { name: serviceType },
        },
        relations: ['role', 'facility'],
        order: { id: 'ASC' },
      });

      return successResponse(
        users,
        ApiSuccessResponseMessages.CHECKED_IN_DOCTORS_FETCHED_SUCCESSFULLY,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.CHECKED_IN_DOCTORS_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.CHECKED_IN_DOCTORS_FETCH_ERROR,
      );
    }
  }

  public async findDoctorsByFacility(
    filters: PaginationDto,
    facilityId: number,
    currentUserId: number,
  ): Promise<Succ<User[]>> {
    try {
      if (!facilityId) {
        throw new BadRequestException(ApiResponseMessages.FACILITY_IS_REQUIRED);
      }

      const doctorRoles = [
        RoleName.SBA,
        RoleName.MEDICAL_OFFICER_MALE,
        RoleName.MEDICAL_OFFICER_FEMALE,
        RoleName.PAEDS,
        RoleName.VACCINATOR,
        RoleName.DISPENSER,
      ];

      const [doctors, total] = await this.userRepository.findAndCount({
        where: {
          id: Not(currentUserId),
          facility: { id: facilityId },
          role: { name: In(doctorRoles) },
        },
        relations: ['role', 'facility'],
        take: filters.limit,
        skip: (filters.page - 1) * filters.limit,
        order: { id: 'ASC' },
      });

      return successResponse(
        doctors,
        ApiSuccessResponseMessages.DOCTOR_FETCH_SUCCESS,
        200,
        filters.page,
        filters.limit,
        total,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.DOCTORS_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.DOCTORS_FETCH_ERROR,
      );
    }
  }

  public async transfer(
    serviceType: ServiceType,
    doctorId: number,
    appointmentId: number,
    request: Request,
    facilityId?: number,
  ): Promise<Succ<Appointment>> {
    try {
      const currentUserId = (request as any)?.user?.sub;
      const role = (request as any)?.user?.role;
      const privilegedRoles = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FACILITY_INCHARGE];
      const isPrivileged = privilegedRoles.includes(role);
      const resolvedFacilityId = isPrivileged
        ? facilityId
        : (request as any)?.user?.facilityId;
      const facilityIdNumber = Number(resolvedFacilityId);
      if (!facilityIdNumber) {
        if (isPrivileged) {
          throw new BadRequestException(ApiResponseMessages.FACILITY_IS_REQUIRED);
        }
        throw new BadRequestException(ApiResponseMessages.FACILITY_NOT_FOUND_FOR_TRANSFER);
      }
      if (!appointmentId) {
        throw new BadRequestException(ApiResponseMessages.APP_NOT_FOUND);
      }
      const appointment = await this.appointmentRepository.findOne({
        where: {
          id: appointmentId,
          facility: { id: facilityIdNumber },
          status: In([PatientStatus.PENDING, PatientStatus.IN_PROGRESS, PatientStatus.PAUSED]),
        },
        relations: [
          'doctor',
          'facility',
          'appointmentServices',
          'appointmentServices.service',
        ],
      });
      if (!appointment) {
        throw new NotFoundException(ApiResponseMessages.APP_SERVICE_NOT_FOUND);
      }
      if (appointment.doctor?.id && appointment.doctor.id === doctorId) {
        throw new BadRequestException('Cannot be assigned to the same doctor');
      }
      if (
        !isPrivileged &&
        (!appointment.doctor?.id ||
          Number(currentUserId) !== appointment.doctor.id)
      ) {
        throw new BadRequestException(ApiResponseMessages.ONLY_ACTIVE_DOCTOR_CAN_TRANSFER);
      }

      const appointmentService = appointment.appointmentServices?.find(
        (as) => as.service?.name === serviceType,
      );
      if (!appointmentService?.service?.id) {
        throw new NotFoundException(ApiResponseMessages.APP_SERVICE_NOT_FOUND_FOR_APPOINTMENT);
      }
      const targetDoctor = await this.userRepository.findOne({
        where: { id: doctorId, facility: { id: facilityIdNumber } },
        relations: ['services', 'facility'],
      });
      if (!targetDoctor) {
        throw new NotFoundException(ApiResponseMessages.TARGET_DOCTOR_NOT_FOUND);
      }
      if (targetDoctor.facility?.id !== appointment.facility?.id) {
        throw new BadRequestException(ApiResponseMessages.TARGET_DOCTOR_NOT_IN_SAME_FACILITY);
      }
      const offersService = targetDoctor.services?.some(
        (service) => service.id === appointmentService.service.id,
      );
      if (!offersService) {
        throw new BadRequestException(ApiResponseMessages.TARGET_DOCTOR_DOES_NOT_OFFER_SERVICE);
      }
      if (currentUserId && Number(currentUserId) === doctorId) {
        throw new BadRequestException(ApiResponseMessages.TARGET_DOCTOR_CANNOT_TRANSFER_TO_SELF);
      }
      const attendanceStatus = await this.serviceUtility.getAttendanceStatus(
        doctorId,
        facilityIdNumber,
      );
      if (attendanceStatus !== AttendanceStatus.CHECKED_IN) {
        throw new BadRequestException(ApiResponseMessages.TARGET_DOCTOR_NOT_CHECKED_IN);
      }

      await this.appointmentRepository.manager.transaction(async (manager) => {
        const appointmentRepo = manager.getRepository(Appointment);
        const appointmentDoctorRepo = manager.getRepository(AppointmentDoctor);
        const patientQueueRepo = manager.getRepository(PatientQueue);

        const appointmentToUpdate = await appointmentRepo.findOne({
          where: { id: appointment.id },
          relations: ['appointmentDoctors', 'appointmentDoctors.doctor', 'patient'],
        });
        if (!appointmentToUpdate) {
          throw new NotFoundException(ApiResponseMessages.APP_NOT_FOUND);
        }

        const appointmentDoctors = appointmentToUpdate.appointmentDoctors ?? [];
        let hasNewDoctorLink = false;

        for (const ad of appointmentDoctors) {
          if (ad.doctor?.id === doctorId) {
            ad.is_primary = true;
            if (currentUserId) {
              ad.updatedBy = { id: currentUserId } as User;
            }
            hasNewDoctorLink = true;
          } else if (ad.is_primary) {
            ad.is_primary = false;
            if (currentUserId) {
              ad.updatedBy = { id: currentUserId } as User;
            }
          }
        }

        if (!hasNewDoctorLink) {
          const newLink = appointmentDoctorRepo.create({
            appointment: { id: appointmentToUpdate.id } as Appointment,
            doctor: { id: doctorId } as User,
            is_primary: true,
            ...(currentUserId ? { createdBy: { id: currentUserId } as User } : {}),
          });
          appointmentDoctors.push(newLink);
        }

        if (appointmentDoctors.length > 0) {
          await appointmentDoctorRepo.save(appointmentDoctors);
        }

        appointmentToUpdate.doctor = { id: doctorId } as User;
        if (currentUserId) {
          appointmentToUpdate.updatedBy = { id: currentUserId } as User;
        }
        await appointmentRepo.save(appointmentToUpdate);

        const queueStatus = [
          PatientStatus.PENDING,
          PatientStatus.IN_PROGRESS,
          PatientStatus.PAUSED,
        ].includes(appointmentToUpdate.status)
          ? appointmentToUpdate.status
          : PatientStatus.PENDING;

        const existingQueue = await patientQueueRepo.findOne({
          where: { appointment: { id: appointmentToUpdate.id } },
          withDeleted: true,
        });

        if (existingQueue) {
          existingQueue.doctor = { id: doctorId } as User;
          existingQueue.patient = { id: appointmentToUpdate.patient.id } as any;
          existingQueue.status = queueStatus;
          existingQueue.deleted_at = null;
          await patientQueueRepo.save(existingQueue);
          this.socketGateway.emitToUser(
            existingQueue.doctor.id,
            'added_to_queue',
            { existingQueue },
          );
        } else {
          const newQueue = patientQueueRepo.create({
            appointment: { id: appointmentToUpdate.id } as Appointment,
            patient: { id: appointmentToUpdate.patient.id } as any,
            doctor: { id: doctorId } as User,
            status: queueStatus,
          });
          await patientQueueRepo.save(newQueue);
          this.socketGateway.emitToUser(
            doctorId,
            'added_to_queue',
            { newQueue },
          );
        }
      });

      const updatedAppointment = await this.appointmentRepository.findOne({
        where: { id: appointment.id },
        relations: [
          'appointmentServices',
          'doctor',
          'patient',
          'patientQueue',
          'appointmentDoctors',
          'appointmentDoctors.doctor',
        ],
      });
      if (!updatedAppointment) {
        throw new NotFoundException(ApiResponseMessages.APP_NOT_FOUND_AFTER_TRANSFER);
      }
      return successResponse(
        updatedAppointment,
        ApiSuccessResponseMessages.SERVICE_TRANSFERRED_SUCCESSFULLY,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.FAILED_TO_TRANSFER_SERVICE, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FAILED_TO_TRANSFER_SERVICE,
      );
    }
  }

  public async getDoctorActivityReport(filters: any) {
    try {
      const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters?.limit) > 0 ? Number(filters.limit) : 10;
      const skip = (page - 1) * limit;
      const facilityId = Number(filters?.facilityId);
      const doctorRoles = [
        RoleName.SBA,
        RoleName.MEDICAL_OFFICER_MALE,
        RoleName.MEDICAL_OFFICER_FEMALE,
        RoleName.PAEDS,
        RoleName.VACCINATOR,
        RoleName.DISPENSER,
      ];
      const doctorsBaseQuery = this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .where('role.name IN (:...doctorRoles)', { doctorRoles });

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        doctorsBaseQuery.andWhere('user.facility_id = :facilityId', {
          facilityId,
        });
      }

      if (filters?.doctorId) {
        doctorsBaseQuery.andWhere('user.id = :doctorId', {
          doctorId: Number(filters.doctorId),
        });
      }

      const totalCount = await doctorsBaseQuery
        .clone()
        .select('COUNT(DISTINCT user.id)', 'count')
        .getRawOne();
      const count = Number(totalCount?.count ?? 0);

      const appointmentJoinConditions = ['appointment.doctor_id = user.id'];
      const appointmentJoinParams: Record<string, any> = {};

      if (filters?.dateFrom) {
        appointmentJoinConditions.push('DATE(appointment.created_at) >= :dateFrom');
        appointmentJoinParams.dateFrom = filters.dateFrom;
      }

      if (filters?.dateTo) {
        appointmentJoinConditions.push('DATE(appointment.created_at) <= :dateTo');
        appointmentJoinParams.dateTo = filters.dateTo;
      }

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        appointmentJoinConditions.push('appointment.facility_id = :appointmentFacilityId');
        appointmentJoinParams.appointmentFacilityId = facilityId;
      }

      const countByServiceCondition = filters?.serviceType
        ? 'CASE WHEN service.id IS NOT NULL THEN'
        : '';
      const countByServiceSuffix = filters?.serviceType ? ' END' : '';

      const dataQuery = doctorsBaseQuery
        .clone()
        .leftJoin(
          Appointment,
          'appointment',
          appointmentJoinConditions.join(' AND '),
          appointmentJoinParams,
        )
        .leftJoin('appointment.appointmentServices', 'appointmentService')
        .leftJoin(
          'appointmentService.service',
          'service',
          filters?.serviceType ? 'service.name = :serviceType' : undefined,
          filters?.serviceType
            ? { serviceType: filters.serviceType }
            : undefined,
        )
        .leftJoin('appointmentService.prescriptions', 'prescription')
        .select('user.id', 'doctor_id')
        .addSelect('user.first_name', 'doctor_first_name')
        .addSelect('user.last_name', 'doctor_last_name')
        .addSelect(
          `COUNT(DISTINCT ${countByServiceCondition} appointment.patient_id${countByServiceSuffix})`,
          'patients_treated',
        )
        .addSelect(
          `COUNT(DISTINCT ${countByServiceCondition} appointmentService.id${countByServiceSuffix})`,
          'services_provided_count',
        )
        .addSelect(
          `COUNT(DISTINCT ${countByServiceCondition} prescription.id${countByServiceSuffix})`,
          'medicines_prescribed_count',
        )
        .addSelect("STRING_AGG(DISTINCT service.name, ', ')", 'services_provided')
        .groupBy('user.id')
        .addGroupBy('user.first_name')
        .addGroupBy('user.last_name')
        .orderBy('user.first_name', 'ASC')
        .addOrderBy('user.last_name', 'ASC')
        .skip(skip)
        .take(limit);

      const rows = await dataQuery.getRawMany();

      const doctorCountQuery = this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .where('role.name IN (:...doctorRoles)', { doctorRoles });

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        doctorCountQuery.andWhere('user.facility_id = :facilityId', {
          facilityId,
        });
      }

      const totalDoctorsInFacility = await doctorCountQuery.getCount();

      const facilitySummaryQuery = this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoin('appointment.doctor', 'doctor')
        .leftJoin('appointment.appointmentServices', 'appointmentService')
        .leftJoin('appointmentService.prescriptions', 'prescription')
        .where('doctor.id IS NOT NULL');

      if (filters?.dateFrom) {
        facilitySummaryQuery.andWhere('DATE(appointment.createdAt) >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters?.dateTo) {
        facilitySummaryQuery.andWhere('DATE(appointment.createdAt) <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        facilitySummaryQuery.andWhere('appointment.facility_id = :facilityId', {
          facilityId,
        });
      }

      const facilitySummaryRaw = await facilitySummaryQuery
        .select('COUNT(DISTINCT appointment.patient_id)', 'total_patients_treated')
        .addSelect('COUNT(DISTINCT prescription.id)', 'total_prescriptions_given')
        .addSelect(
          'COUNT(DISTINCT appointmentService.id)',
          'total_services_provided',
        )
        .getRawOne();

      return successResponse(
        {
          records: rows.map((row) => ({
            doctorId: Number(row.doctor_id),
            doctorName: `${row.doctor_first_name ?? ''} ${row.doctor_last_name ?? ''}`.trim(),
            patientsTreated: Number(row.patients_treated),
            servicesProvided: row.services_provided
              ? String(row.services_provided)
                  .split(',')
                  .map((service) => service.trim())
                  .filter(Boolean)
              : [],
            servicesProvidedCount: Number(row.services_provided_count),
            medicinesPrescribedCount: Number(row.medicines_prescribed_count),
          })),
          facilitySummary: {
            totalDoctors: Number(totalDoctorsInFacility ?? 0),
            totalPatientsTreated: Number(
              facilitySummaryRaw?.total_patients_treated ?? 0,
            ),
            totalPrescriptionsGiven: Number(
              facilitySummaryRaw?.total_prescriptions_given ?? 0,
            ),
            totalServicesProvided: Number(
              facilitySummaryRaw?.total_services_provided ?? 0,
            ),
          },
        },
        count === 0 ? 'No Data Found' : 'Doctor report fetched successfully',
        200,
        page,
        limit,
        count,
      );
    } catch (error) {
      this.logger.error('Failed to fetch doctor report', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch doctor report',
      );
    }
  }
}
