import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CreateInternalReferralDto } from './dto/create-internal-referral.dto';
import { Referral } from './entities/referral.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  DataSource,
  QueryRunner,
  Not,
  EntityManager,
} from 'typeorm';
import { successResponse } from 'src/common/utils/response.util';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { CreateExternalReferralDto } from './dto/create-external-referral.dto';
import { User } from 'src/users/entities/user.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { TokenCounterService } from 'src/token-counter/token-counter.service';
import { Service } from 'src/services/entities/service.entity';
import { SocketGateway } from 'src/socket/socket.gateway';
import { Patient } from 'src/patients/entities/patient.entity';
import {
  Gender,
  PatientStatus,
  ReferralType,
  TypeOfService,
  VisitStatus,
  EmrServices,
  RoleName,
  AttendanceStatus,
} from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { AppointmentDoctor } from 'src/appointments/entities/appointment-doctor.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { Request } from 'express';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { SERVICE_CACHE_TTL_SECONDS } from 'src/common/app.constants';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { UnassignedPatient } from './entities/unassigned-patient.entity';
import { CreateUnassignedPatientDto } from './dto/create-unassigned-patient.dto';
import { Attendance } from 'src/attendance/entities/attendance.entity';
@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(PatientQueue)
    private readonly patientQueueRepository: Repository<PatientQueue>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
    @InjectRepository(AppointmentDoctor)
    private readonly appointmentDoctorRepository: Repository<AppointmentDoctor>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly tokenCounterService: TokenCounterService,
    private readonly socketGateway: SocketGateway,
    private readonly dataSource: DataSource,
    @InjectRepository(UnassignedPatient)
    private readonly unassignedPatientRepository: Repository<UnassignedPatient>,
    private readonly redisCacheService: RedisCacheService,
  ) { }

  async referIn(
    user: any,
    currentUserId: number,
    createInternalReferralDto: CreateInternalReferralDto,
    { selfReferral = false }: { selfReferral?: boolean } = {},
  ) {
    const pausedAppointment = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('appointment.id', 'id')
      .where('appointment.patient_id = :patientId', {
        patientId: createInternalReferralDto.patient_id,
      })
      .andWhere('appointment.status = :status', {
        status: PatientStatus.PAUSED,
      })
      .limit(1)
      .getRawOne<{ id: number }>();

    if (pausedAppointment) {
      throw new ConflictException(
        'Cannot refer patient while an appointment is paused.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const privilegedRoles = [
        RoleName.SUPER_ADMIN,
        RoleName.ADMIN,
        RoleName.FACILITY_INCHARGE,
      ];

      const alreadyReferred = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect(
          'appointment.appointmentServices',
          'appointmentService',
        )
        .leftJoinAndSelect('appointmentService.service', 'service')
        .where('appointment.patient_id = :patientId', {
          patientId: createInternalReferralDto.patient_id,
        })
        .andWhere('appointment.status IN (:...statuses)', {
          statuses: [PatientStatus.IN_PROGRESS, PatientStatus.PENDING],
        })
        .orderBy('appointment.created_at', 'DESC')
        .getOne();

      if (alreadyReferred && !privilegedRoles.includes(user.role)) {
        const services = alreadyReferred.appointmentServices
          .map((as) => as.service.name)
          .join(', ');
        throw new ConflictException(
          `Referral failed: Patient already has an appointment with status ${alreadyReferred.status} for the following service(s): ${services}`,
        );
      }
      if (
        alreadyReferred &&
        privilegedRoles.includes(user.role) &&
        [PatientStatus.IN_PROGRESS, PatientStatus.PAUSED].includes(
          alreadyReferred.status,
        )
      ) {
        const services = alreadyReferred.appointmentServices
          .map((as) => as.service.name)
          .join(', ');
        throw new ConflictException(
          `Referral failed: Patient already has an appointment with status ${alreadyReferred.status} for the following service(s): ${services}`,
        );
      }

      const { patient_id, service_id } = createInternalReferralDto;

      await manager.getRepository(UnassignedPatient).delete({
        patient: { id: patient_id },
      });

      const requiredService = await queryRunner.manager.findOne(
        this.serviceRepository.target,
        {
          where: { id: service_id },
          select: ['name'],
        },
      );
      if (!requiredService) {
        throw new NotFoundException(
          `Service not found for the following id: ${service_id}`,
        );
      }
      let selfReferralDoctor: User | null = null;
      if (selfReferral) {
        selfReferralDoctor = await manager.findOne(this.usersRepository.target, {
          where: {
            id: currentUserId,
            services: { id: service_id },
            facility: { id: user.facilityId },
          },
          relations: ['facility'],
        });
        if (!selfReferralDoctor) {
          throw new BadRequestException(
            'Self-referral failed: You do not provide the selected service at this facility.',
          );
        }
      }
      const referralServiceType = this.mapServiceNameToReferralType(
        requiredService.name,
      );

      if (
        requiredService?.name &&
        ['ANC', 'DELIVERY'].includes(requiredService.name)
      ) {
        const patient = await queryRunner.manager.findOne(
          this.patientRepository.target,
          {
            where: { id: patient_id },
            select: ['id', 'gender'],
            loadEagerRelations: false,
          },
        );
        if (!patient) {
          throw new BadRequestException(ApiResponseMessages.PNT_NOT_FOUND);
        }

        if (patient?.gender === Gender.MALE) {
          throw new ConflictException(ApiResponseMessages.M_PT_N_ALLOW);
        }
      }

      let shouldPreferPaeds = false;
      if (requiredService?.name === EmrServices.OPD) {
        const patient = await queryRunner.manager.findOne(
          this.patientRepository.target,
          {
            where: { id: patient_id },
            select: ['id', 'dob'],
            loadEagerRelations: false,
          },
        );
        if (!patient) {
          throw new BadRequestException(ApiResponseMessages.PNT_NOT_FOUND);
        }
        shouldPreferPaeds = this.isPaedsAge(patient.dob);
      }

      await manager.getRepository(PatientQueue).softDelete({
        patient: { id: patient_id },
        status: Not(PatientStatus.PAUSED),
      });

      const existingAppointment = await this.appointmentRepository.findOne({
        where: {
          patient: { id: patient_id },
          status: In([PatientStatus.PAUSED, PatientStatus.PENDING]),
          appointmentServices: { service: { id: service_id } },
          ...(selfReferral ? { doctor: { id: currentUserId } } : {}),
        },
        relations: [
          'doctor',
          'appointmentServices',
          'appointmentServices.service',
          'visit',
        ],
        order: {
          createdAt: 'DESC',
          appointmentServices: { createdAt: 'DESC' },
        },
        loadEagerRelations: false,
      });
      let queue: PatientQueue | null | undefined;

      if (existingAppointment) {
        const lastAppointment = existingAppointment;

        const oldDoctorServiceExists =
          await this.appointmentServiceRepository.exists({
            where: {
              status: PatientStatus.PAUSED,
              patient: { id: patient_id },
              service: { id: service_id },
              ...(selfReferral
                ? { appointment: { doctor: { id: currentUserId } } }
                : {}),
            },
          });
        if (!oldDoctorServiceExists) {
          if (privilegedRoles.includes(user.role) && !selfReferral) {
            const usersOfferingService =
              await this.getUsersOfferingServiceForReferral(
                manager,
                service_id,
                user.facilityId,
              );

            const candidateUsers = await this.getCandidateUsersForReferral(
              usersOfferingService,
              shouldPreferPaeds,
            );
            let availableDoctors = candidateUsers.filter(
              (u) => u.id !== lastAppointment.doctor.id,
            );
            if (
              availableDoctors.length === 0 &&
              candidateUsers !== usersOfferingService
            ) {
              const fallbackUsers =
                await this.filterUsersByAttendance(usersOfferingService);
              availableDoctors = fallbackUsers.filter(
                (u) => u.id !== lastAppointment.doctor.id,
              );
            }
            if (availableDoctors.length === 0) {
              throw new ConflictException(
                `No other doctor available for this service (service_id: ${service_id}).`,
              );
            }

            const selectedUser = this.selectUserForReferral(
              availableDoctors,
              shouldPreferPaeds,
            );

            if (!selectedUser) {
              throw new NotFoundException(
                `No doctor found for reassignment. service_id: ${service_id}`,
              );
            }

            if (lastAppointment.appointmentServices?.length > 0) {
              for (const service of lastAppointment.appointmentServices) {
                service.status =
                  service.status === PatientStatus.PAUSED
                    ? PatientStatus.PAUSED
                    : PatientStatus.COMPLETED;
              }
              await queryRunner.manager.save(
                lastAppointment.appointmentServices,
              );
            }
            lastAppointment.status =
              lastAppointment.status === PatientStatus.PAUSED
                ? PatientStatus.PAUSED
                : PatientStatus.COMPLETED;

            const {
              appointment: reassignedAppointment,
              patientQueue,
              fetchedQueue,
            } = await this.ensureAppointmentForDoctor(
              currentUserId,
              selectedUser,
              patient_id,
              lastAppointment?.visit,
              manager,
            );
            queue = fetchedQueue;
            await this.ensureAppointmentService(
              currentUserId,
              reassignedAppointment,
              service_id,
              patient_id,
              manager,
            );

            const referral = this.referralRepository.create({
              type: ReferralType.INTERNAL,
              patient: { id: patient_id },
              fromDoctor: { id: currentUserId },
              toDoctor: { id: selectedUser.id },
              type_of_service: referralServiceType,
              facility: { id: user.facilityId },
              district: { id: user.districtId },
            });

            await Promise.all([
              manager.save(referral),
              manager.save(lastAppointment),
            ]);

            await queryRunner.commitTransaction();
            this.socketGateway.emitToUser(selectedUser.id, 'added_to_queue', {
              patientQueue,
            });
          } else {
            await this.restoreOrCreateQueue(
              lastAppointment,
              patient_id,
              lastAppointment.doctor.id,
              manager,
            );
            const referral = this.referralRepository.create({
              type: ReferralType.INTERNAL,
              patient: { id: patient_id },
              fromDoctor: { id: currentUserId },
              toDoctor: { id: lastAppointment.doctor.id },
              type_of_service: referralServiceType,
              facility: { id: user.facilityId },
              district: { id: user.districtId },
            });

            await queryRunner.manager.save(referral);
            await queryRunner.commitTransaction();
            this.socketGateway.emitToUser(
              lastAppointment.doctor.id,
              'added_to_queue',
              { referral },
            );
          }
        }
      } else {
        const setToPending = await this.appointmentRepository.findOne({
          where: {
            patient: { id: patient_id },
            status: In([
              PatientStatus.IN_PROGRESS,
              PatientStatus.PAUSED,
              PatientStatus.PENDING,
            ]),
          },
          order: { createdAt: 'DESC' },
          relations: [
            'appointmentServices',
            'appointmentServices.service',
            'visit',
          ],
          loadEagerRelations: false,
        });

        if (setToPending) {
          setToPending.status =
            setToPending.status === PatientStatus.PAUSED
              ? PatientStatus.PAUSED
              : PatientStatus.COMPLETED;
          if (setToPending.appointmentServices?.length > 0) {
            setToPending.appointmentServices.forEach((service) => {
              service.status =
                service.status === PatientStatus.PAUSED
                  ? PatientStatus.PAUSED
                  : PatientStatus.COMPLETED;
            });
          }
          await manager.save(setToPending);
        }

        let selectedUser: User | null | undefined;
        if (selfReferral) {
          selectedUser = selfReferralDoctor;
        } else {
          const usersOfferingService =
            await this.getUsersOfferingServiceForReferral(
              manager,
              service_id,
              user.facilityId,
            );

          const candidateUsers = await this.getCandidateUsersForReferral(
            usersOfferingService,
            shouldPreferPaeds,
          );
          selectedUser = this.selectUserForReferral(
            candidateUsers,
            shouldPreferPaeds,
          );
        }

        if (selectedUser) {
          const { appointment, patientQueue, updatedQueue } =
            await this.ensureAppointmentForDoctor(
              currentUserId,
              selectedUser,
              patient_id,
              setToPending?.visit ?? null,
              manager,
            );
          queue = updatedQueue;
          await this.ensureAppointmentService(
            currentUserId,
            appointment,
            service_id,
            patient_id,
            manager,
          );

          const referral = this.referralRepository.create({
            type: ReferralType.INTERNAL,
            patient: { id: patient_id },
            fromDoctor: { id: currentUserId },
            toDoctor: { id: selectedUser.id },
            type_of_service: referralServiceType,
            facility: { id: user.facilityId },
            district: { id: user.districtId },
          });

          await manager.save(referral);
          await queryRunner.commitTransaction();
          this.socketGateway.emitToUser(selectedUser.id, 'added_to_queue', {
            patientQueue,
          });
        } else {
          throw new NotFoundException(
            `User for the selected service not found. service_id: ${service_id}`,
          );
        }
      }

      if (!queue) {
        queue = await this.patientQueueRepository.findOne({
          where: { patient: { id: patient_id } },
          order: { created_at: 'DESC' },
          relations: ['patient', 'doctor'],
          loadEagerRelations: false,
          withDeleted: false,
        });

        if (!queue) {
          throw new ConflictException(
            'Referral completed but patient queue could not be resolved. Please retry.',
          );
        }
      }

      return successResponse(
        queue,
        ApiSuccessResponseMessages.PT_REF_SUCCESS,
        200,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(ApiResponseMessages.PT_REF_IN_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PT_REF_IN_FAILED,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async unassignPatient(
    user: any,
    createUnassignedPatientDto: CreateUnassignedPatientDto,
  ) {
    const { patient_id, facility_id } = createUnassignedPatientDto;

    // Check if patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: patient_id },
    });
    if (!patient) {
      throw new BadRequestException(ApiResponseMessages.PNT_NOT_FOUND);
    }

    // ─── VALIDATION 1: Visit IN_PROGRESS check ────────────────────────────────
    const activeVisit = await this.visitRepository.findOne({
      where: {
        patient: { id: patient_id },
      },
      order: { createdAt: 'DESC' },
    });

    if (activeVisit && activeVisit.status !== VisitStatus.PENDING) {
      throw new ConflictException(
        'Cannot mark as Unassigned: patient visit is in progress or dispatched.',
      );
    }

    if (activeVisit && activeVisit.status === VisitStatus.PENDING) {
      activeVisit.status = VisitStatus.UNASSIGNED;
      await this.visitRepository.save(activeVisit);
    }

    // ─── VALIDATION 2: Service already assigned check ─────────────────────────
    const roleStatus =
      user?.role === RoleName.FACILITY_INCHARGE
        ? [PatientStatus.IN_PROGRESS, PatientStatus.PAUSED]
        : [
          PatientStatus.IN_PROGRESS,
          PatientStatus.PENDING,
          PatientStatus.PAUSED,
        ];
    const appointmentWithService = await this.appointmentRepository.findOne({
      where: {
        patient: { id: patient_id },
        status: In(roleStatus),
      },
      relations: ['appointmentServices', 'appointmentServices.service'],
      order: {
        createdAt: 'DESC',
        appointmentServices: { createdAt: 'DESC' },
      },
    });

    if (
      appointmentWithService &&
      appointmentWithService.appointmentServices?.length > 0
    ) {
      const services = appointmentWithService.appointmentServices
        .map((as) => as.service.name)
        .join(', ');
      throw new ConflictException(
        `Cannot mark as Unassigned: already assigned to service(s): ${services}`,
      );
    }

    // ─── Check if already in unassigned table ─────────────────────────────────
    const alreadyUnassigned = await this.unassignedPatientRepository.findOne({
      where: { patient: { id: patient_id } },
    });
    if (alreadyUnassigned) {
      throw new ConflictException('Patient is already in the unassigned list.');
    }

    // Soft delete from patient queue
    await this.patientQueueRepository.softDelete({
      patient: { id: patient_id },
    });

    // Complete existing appointment if any
    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        patient: { id: patient_id },
        status: In([PatientStatus.IN_PROGRESS, PatientStatus.PENDING]),
      },
      relations: ['appointmentServices', 'appointmentServices.service', 'visit'],
      order: {
        createdAt: 'DESC',
        appointmentServices: { createdAt: 'DESC' },
      },
    });

    if (existingAppointment) {
      existingAppointment.status = PatientStatus.COMPLETED;
      if (existingAppointment.visit) {
        existingAppointment.visit.status = VisitStatus.UNASSIGNED;
        await this.visitRepository.save(existingAppointment.visit);
      }
      if (existingAppointment.appointmentServices?.length > 0) {
        existingAppointment.appointmentServices.forEach((service) => {
          service.status = PatientStatus.COMPLETED;
        });
      }
      await this.appointmentRepository.save(existingAppointment);
    }

    // Save in unassigned_patients table
    const unassignedPatient = this.unassignedPatientRepository.create({
      patient: { id: patient_id },
      facility: { id: user.facilityId },
    });

    const saved =
      await this.unassignedPatientRepository.save(unassignedPatient);

    return successResponse(saved, 'Patient unassigned successfully.', 201);
  }

  async getAllUnassignedPatients(
    user: any,
    page: number,
    limit: number,
    facility_id: number,
  ) {
    try {
      const currentPage = page || 1;
      const currentLimit = limit || 10;
      const skip = (currentPage - 1) * currentLimit;

      const qb = this.unassignedPatientRepository
        .createQueryBuilder('unassignedPatient')
        .leftJoinAndSelect('unassignedPatient.patient', 'patient')
        .leftJoinAndSelect('unassignedPatient.facility', 'facility')
        .where('unassignedPatient.facility_id = :facilityId', {
          facilityId: facility_id,
        })
        .orderBy('unassignedPatient.created_at', 'DESC')
        .skip(skip)
        .take(currentLimit);

      const [data, total] = await qb.getManyAndCount();

      const message =
        total === 0
          ? 'No Data Available'
          : 'Unassigned Patients Fetched Successfully';

      return successResponse(
        data,
        message,
        200,
        currentPage,
        currentLimit,
        total,
      );
    } catch (error) {
      this.logger.error('Failed to fetch unassigned patients', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch unassigned patients.',
      );
    }
  }

  private async getUsersOfferingServiceForReferral(
    manager: EntityManager,
    serviceId: number,
    facilityId: number,
  ): Promise<User[]> {
    const activeQueueStatuses = [
      PatientStatus.PENDING,
      PatientStatus.IN_PROGRESS,
      PatientStatus.PAUSED,
    ];

    const rows = await manager
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoin('user.services', 'service', 'service.id = :serviceId', {
        serviceId,
      })
      .innerJoin('user.facility', 'facility', 'facility.id = :facilityId', {
        facilityId,
      })
      .leftJoin('user.role', 'role')
      .leftJoin(
        'user.patientQueues',
        'queue',
        'queue.deleted_at IS NULL AND queue.status IN (:...activeQueueStatuses)',
        { activeQueueStatuses },
      )
      .select('user.id', 'id')
      .addSelect('facility.id', 'facilityId')
      .addSelect('role.name', 'roleName')
      .addSelect('COUNT(queue.id)', 'activeQueueCount')
      .where('user.deleted_at IS NULL')
      .groupBy('user.id')
      .addGroupBy('facility.id')
      .addGroupBy('role.name')
      .getRawMany<{
        id: number;
        facilityId: number;
        roleName: RoleName | null;
        activeQueueCount: string;
      }>();

    return rows.map(
      (row) =>
        ({
          id: Number(row.id),
          facility: { id: Number(row.facilityId) },
          role: row.roleName ? { name: row.roleName } : undefined,
          activeQueueCount: Number(row.activeQueueCount ?? 0),
        }) as User & { activeQueueCount: number },
    );
  }

  private selectUserForReferral(
    users: User[],
    shouldPreferPaeds: boolean,
  ): User | undefined {
    if (shouldPreferPaeds) {
      const paedsUser = users.find((user) => user.role?.name === RoleName.PAEDS);
      if (paedsUser) {
        return paedsUser;
      }
    }

    let leastQueue = Infinity;
    let selectedUser: User | undefined;
    for (const user of users) {
      const queueLength =
        (user as User & { activeQueueCount?: number }).activeQueueCount ??
        user.patientQueues?.length ??
        0;
      if (queueLength < leastQueue) {
        leastQueue = queueLength;
        selectedUser = user;
      }
    }
    return selectedUser;
  }

  private async getCandidateUsersForReferral(
    users: User[],
    shouldPreferPaeds: boolean,
  ): Promise<User[]> {
    if (!shouldPreferPaeds) {
      const nonPaedsUsers = users.filter(
        (user) => user.role?.name !== RoleName.PAEDS,
      );
      return this.filterUsersByAttendance(nonPaedsUsers);
    }
    const paedsUsers = users.filter((user) => user.role?.name === RoleName.PAEDS);
    if (paedsUsers.length > 0) {
      const availablePaedsUsers = await this.filterUsersByAttendance(
        paedsUsers,
        false,
      );
      if (availablePaedsUsers.length > 0) {
        return availablePaedsUsers;
      }
    }

    return this.filterUsersByAttendance(users);
  }

  private async filterUsersByAttendance(
    users: User[],
    throwIfEmpty = true,
  ): Promise<User[]> {
    const userFacilityPairs = users
      .map((user) => ({
        user,
        facilityId: user.facility?.id,
      }))
      .filter(
        (entry): entry is { user: User; facilityId: number } =>
          entry.facilityId !== undefined && entry.facilityId !== null,
      );

    const userIds = userFacilityPairs.map(({ user }) => user.id);
    const facilityIds = Array.from(
      new Set(userFacilityPairs.map(({ facilityId }) => facilityId)),
    );

    const attendances =
      userIds.length === 0
        ? []
        : await this.attendanceRepository
            .createQueryBuilder('attendance')
            .select('attendance.userId', 'userId')
            .addSelect('attendance.facilityId', 'facilityId')
            .where('attendance.userId IN (:...userIds)', { userIds })
            .andWhere('attendance.facilityId IN (:...facilityIds)', {
              facilityIds,
            })
            .andWhere('attendance.status = :status', {
              status: AttendanceStatus.CHECKED_IN,
            })
            .getRawMany<{ userId: number; facilityId: number }>();

    const checkedInPairs = new Set(
      attendances.map(
        (attendance) => `${attendance.userId}:${attendance.facilityId}`,
      ),
    );

    const filteredUsers = userFacilityPairs
      .filter(({ user, facilityId }) =>
        checkedInPairs.has(`${user.id}:${facilityId}`),
      )
      .map(({ user }) => user);
    if (filteredUsers.length === 0 && throwIfEmpty) {
      throw new NotFoundException(
        'No users available for referral at this time.',
      );
    }
    return filteredUsers;
  }

  private isPaedsAge(dob?: Date | null): boolean {
    if (!dob) {
      return false;
    }
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (
      monthDelta < 0 ||
      (monthDelta === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age <= 14;
  }

  private mapServiceNameToReferralType(serviceName: string): TypeOfService {
    const normalized = serviceName?.trim().toUpperCase();

    switch (normalized) {
      case TypeOfService.OPD:
        return TypeOfService.OPD;
      case TypeOfService.ANC:
        return TypeOfService.ANC;
      case TypeOfService.DELIVERY:
        return TypeOfService.DELIVERY;
      case TypeOfService.PNC:
        return TypeOfService.PNC;
      case TypeOfService.FAMILY_PLANNING:
        return TypeOfService.FAMILY_PLANNING;
      case TypeOfService.IMMUNISATION:
        return TypeOfService.IMMUNISATION;
      case TypeOfService.NUTRITION:
        return TypeOfService.NUTRITION;
      case TypeOfService.MEDICINE_DISPENSING:
        return TypeOfService.MEDICINE_DISPENSING;
      default:
        return TypeOfService.OTHER;
    }
  }

  async referOut(
    currentUserId: number,
    createExternalReferralDto: CreateExternalReferralDto,
  ) {
    try {
      const {
        patient_id,
        district_id,
        facility_id,
        refer_out_reason,
        type_of_service,
        level_of_care,
        type,
      } = createExternalReferralDto;

      const pausedAppointment = await this.appointmentRepository.findOne({
        where: {
          patient: { id: patient_id },
          status: PatientStatus.PAUSED,
        },
      });

      if (pausedAppointment) {
        throw new ConflictException(
          ApiResponseMessages.REF_OUT_PAUSED_APPOINTMENT,
        );
      }

      const activeAppointmentStatuses = [
        PatientStatus.IN_PROGRESS,
        PatientStatus.PENDING,
        PatientStatus.REGISTERED,
      ];
      const latestAppointmentStatuses = activeAppointmentStatuses.filter(
        (status) => status !== PatientStatus.REGISTERED,
      );

      const activeAppointments = await this.appointmentRepository.find({
        where: {
          patient: { id: patient_id },
          doctor: { id: currentUserId },
          status: In(activeAppointmentStatuses),
        },
        relations: ['visit'],
      });

      const latestAppointment = await this.appointmentRepository.findOne({
        where: {
          patient: { id: patient_id },
          status: In(latestAppointmentStatuses),
        },
        order: {
          createdAt: 'DESC',
        },
        relations: ['visit'],
      });

      const appointmentIds = Array.from(
        new Set(
          [
            ...activeAppointments.map((appointment) => appointment.id),
            ...(latestAppointment ? [latestAppointment.id] : []),
          ].filter((id): id is number => id !== undefined && id !== null),
        ),
      );
      const visitId =
        latestAppointment?.visit?.id ??
        activeAppointments.find((appointment) => appointment.visit)?.visit
          ?.id ??
        null;

      await this.patientQueueRepository.softDelete({
        patient: { id: patient_id },
      });

      if (appointmentIds.length > 0) {
        await this.appointmentServiceRepository
          .createQueryBuilder()
          .update(AppointmentService)
          .set({ status: PatientStatus.COMPLETED })
          .where('appointment_id IN (:...appointmentIds)', {
            appointmentIds,
          })
          .execute();
      }

      if (visitId !== null) {
        await this.visitRepository.update(
          { id: visitId },
          { status: VisitStatus.REFERRED_OUT },
        );
      }

      if (appointmentIds.length > 0) {
        await this.appointmentRepository
          .createQueryBuilder()
          .update(Appointment)
          .set({ status: PatientStatus.COMPLETED })
          .where('id IN (:...appointmentIds)', { appointmentIds })
          .execute();
      }
      const referral = this.referralRepository.create({
        patient: { id: patient_id },
        fromDoctor: { id: currentUserId },
        refer_out_reason,
        district: { id: district_id },
        facility: { id: facility_id },
        type_of_service,
        level_of_care,
        type: ReferralType.EXTERNAL,
      });
      await this.referralRepository.save(referral);
      return successResponse(
        referral,
        ApiSuccessResponseMessages.PT_REF_OUT_SUCCESS,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.REF_OUT_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.REF_OUT_FAILED,
      );
    }
  }

  async getServiceByRoles() {
    const services = await this.redisCacheService.getOrSetJson(
      'referrals:services-by-role',
      SERVICE_CACHE_TTL_SECONDS,
      () =>
        this.serviceRepository.find({
          order: { name: 'ASC' },
          select: ['id', 'name'],
        }),
    );

    return successResponse(
      services,
      ApiSuccessResponseMessages.ROLE_W_SERV_FETCH,
      200,
    );
  }

  async completeAppointment(currentUserId: number, appointmentId: number) {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId, doctor: { id: currentUserId } },
        relations: ['patient', 'visit'],
      });

      if (!appointment) {
        throw new NotFoundException(ApiResponseMessages.APT_NOT_FOUND);
      }
      if (!appointment.visit) {
        throw new NotFoundException(ApiResponseMessages.V_NOT_FOUND);
      }

      appointment.status = PatientStatus.COMPLETED;
      await this.appointmentRepository.save(appointment);

      await this.patientQueueRepository.softDelete({
        appointment: { id: appointmentId },
      });

      return successResponse(
        appointment,
        ApiSuccessResponseMessages.PT_APT_COMP_AND_QUEUE_DEL,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.COMP_APT_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.COMP_APT_FAILED,
      );
    }
  }

  async startAppointment(currentUserId: number, appointmentId: number) {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId, doctor: { id: currentUserId } },
        relations: ['patient', 'patientQueue'],
      });

      if (!appointment) {
        throw new NotFoundException(ApiResponseMessages.APT_NOT_FOUND);
      }

      if (appointment.status !== PatientStatus.PENDING) {
        throw new ConflictException('Appointment is not in a startable state');
      }

      appointment.status = PatientStatus.IN_PROGRESS;
      appointment.patientQueue.status = PatientStatus.IN_PROGRESS;
      await this.appointmentRepository.save(appointment);
      await this.patientQueueRepository.save(appointment.patientQueue);

      return successResponse(
        appointment,
        ApiSuccessResponseMessages.PT_APT_START,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.START_APT_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.START_APT_FAILED,
      );
    }
  }

  async dispatch(appointmentId: number, request: Request) {
    let queryRunner: QueryRunner | null = null;
    try {
      const facilityId = (request.user as any)?.facilityId;
      const userId = (request.user as any)?.sub;

      if (!facilityId) {
        throw new NotFoundException(ApiResponseMessages.FAC_NOT_FOUND_FOR_USER);
      }

      const appointment = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.id', 'id')
        .addSelect('appointment.patient_id', 'patientId')
        .addSelect('appointment.visit_id', 'visitId')
        .where('appointment.id = :appointmentId', { appointmentId })
        .andWhere('appointment.status = :status', {
          status: PatientStatus.COMPLETED,
        })
        .andWhere('appointment.doctor_id = :userId', { userId })
        .getRawOne<{
          id: number;
          patientId: number;
          visitId: number | null;
        }>();

      if (!appointment) {
        throw new NotFoundException(ApiResponseMessages.APT_NOT_FOUND);
      }

      const checkPausedQueue = await this.patientQueueRepository
        .createQueryBuilder('queue')
        .select('queue.id', 'id')
        .where('queue.patient_id = :patientId', {
          patientId: appointment.patientId,
        })
        .andWhere('queue.status = :status', { status: PatientStatus.PAUSED })
        .limit(1)
        .getRawOne<{ id: number }>();
      if (checkPausedQueue) {
        throw new ConflictException(
          `Cannot dispatch visit while another service is PAUSED for this patient.`,
        );
      }

      const visit = await this.visitRepository
        .createQueryBuilder('visit')
        .select('visit.id', 'id')
        .addSelect('visit.status', 'status')
        .where('visit.id = :visitId', { visitId: appointment.visitId })
        .andWhere('visit.facility_id = :facilityId', { facilityId })
        .getRawOne<{ id: number; status: VisitStatus }>();

      if (!visit) {
        throw new NotFoundException(ApiResponseMessages.V_NOT_FOUND);
      }

      if (visit.status === VisitStatus.DISPATCHED) {
        return successResponse(
          visit,
          ApiSuccessResponseMessages.PT_V_ALREADY_DISPATCH,
          200,
        );
      }

      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.manager.update(
        Appointment,
        { id: appointmentId },
        {
          updatedBy: userId ? ({ id: userId } as User) : undefined,
        },
      );
      await queryRunner.manager
        .createQueryBuilder()
        .softDelete()
        .from(PatientQueue)
        .where('appointment_id = :appointmentId', { appointmentId })
        .execute();
      await queryRunner.manager.update(
        Visit,
        { id: visit.id },
        {
          status: VisitStatus.DISPATCHED,
          updatedBy: userId ? ({ id: userId } as User) : undefined,
        },
      );

      await queryRunner.commitTransaction();

      return successResponse(
        { ...visit, status: VisitStatus.DISPATCHED },
        ApiSuccessResponseMessages.PT_V_DISPATCH,
        200,
      );
    } catch (error) {
      if (queryRunner && queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(ApiResponseMessages.PT_V_DISPATCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PT_V_DISPATCH_ERROR,
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  private async getOrCreateVisitForReferral(
    currentUserId: number,
    facilityId?: number,
    patient_id?: number,
    existingVisit?: Visit | null,
    manager?: EntityManager,
  ): Promise<Visit> {
    const visitRepo = manager
      ? manager.getRepository(Visit)
      : this.visitRepository;
    if (
      existingVisit &&
      existingVisit.status !== VisitStatus.DISPATCHED &&
      existingVisit.status !== VisitStatus.UNASSIGNED
    ) {
      return existingVisit;
    }
    if (facilityId === undefined || facilityId === null) {
      throw new NotFoundException(ApiResponseMessages.FAC_N_FOUND_W_C);
    }
    const existingVisitRecord = await visitRepo.findOne({
      where: {
        patient_id,
        facility: { id: facilityId },
      },
      order: { createdAt: 'DESC' },
    });

    if (
      existingVisitRecord &&
      existingVisitRecord.status !== VisitStatus.DISPATCHED &&
      existingVisitRecord.status !== VisitStatus.UNASSIGNED
    ) {
      return existingVisitRecord;
    }

    const visitDate = new Date();
    visitDate.setHours(0, 0, 0, 0);

    const visit = visitRepo.create({
      patient_id,
      visitDate,
      status: VisitStatus.PENDING,
      facility: { id: facilityId },
    });

    visit.createdBy = { id: currentUserId } as User;
    visit.createdAt = new Date();
    return visitRepo.save(visit);
  }

  private async restoreOrCreateQueue(
    appointment: Appointment,
    patient_id: number,
    doctorId: number,
    manager?: EntityManager,
  ) {
    const queueRepo = manager
      ? manager.getRepository(PatientQueue)
      : this.patientQueueRepository;
    let queue = await queueRepo.findOne({
      where: { appointment: { id: appointment.id } },
      withDeleted: true,
    });

    if (queue) {
      queue.status = PatientStatus.PENDING;
      queue.doctor = { id: doctorId } as User;
      queue.patient = { id: patient_id } as Patient;
      queue.appointment = { id: appointment.id } as Appointment;
      return queueRepo.save(queue);
    }

    queue = queueRepo.create({
      status: PatientStatus.PENDING,
      patient: { id: patient_id } as Patient,
      doctor: { id: doctorId } as User,
      appointment: { id: appointment.id } as Appointment,
    });
    return queueRepo.save(queue);
  }

  private async ensureAppointmentDoctorLink(
    appointmentId: number,
    doctorId: number,
    isPrimary: boolean,
    currentUserId?: number,
    manager?: EntityManager,
  ) {
    const appointmentDoctorRepo = manager
      ? manager.getRepository(AppointmentDoctor)
      : this.appointmentDoctorRepository;
    const existing = await appointmentDoctorRepo.findOne({
      where: {
        appointment: { id: appointmentId },
        doctor: { id: doctorId },
      },
    });

    if (existing) {
      if (isPrimary && !existing.is_primary) {
        existing.is_primary = true;
        return appointmentDoctorRepo.save(existing);
      }
      return existing;
    }

    const appointmentDoctor = appointmentDoctorRepo.create({
      appointment: { id: appointmentId } as Appointment,
      doctor: { id: doctorId } as User,
      is_primary: isPrimary,
      ...(currentUserId ? { createdBy: { id: currentUserId } as User } : {}),
    });

    return appointmentDoctorRepo.save(appointmentDoctor);
  }

  private async ensureAppointmentForDoctor(
    currentUserId: number,
    selectedDoctor: User,
    patient_id: number,
    baseVisit?: Visit | null,
    manager?: EntityManager,
  ) {
    const appointmentRepo = manager
      ? manager.getRepository(Appointment)
      : this.appointmentRepository;
    const patientQueueRepo = manager
      ? manager.getRepository(PatientQueue)
      : this.patientQueueRepository;
    const facilityId = selectedDoctor.facility?.id;
    if (facilityId === undefined || facilityId === null) {
      throw new NotFoundException('Facility not found for selected doctor.');
    }

    const existingAppointmentForDoctor = await appointmentRepo.findOne({
      where: {
        patient: { id: patient_id },
        doctor: { id: selectedDoctor.id },
        status: In([
          PatientStatus.PENDING,
          PatientStatus.IN_PROGRESS,
          PatientStatus.PAUSED,
          PatientStatus.REFERRED_IN,
        ]),
      },
      relations: ['appointmentServices', 'appointmentServices.service', 'visit'],
    });

    const visit = await this.getOrCreateVisitForReferral(
      currentUserId,
      facilityId,
      patient_id,
      baseVisit ?? existingAppointmentForDoctor?.visit ?? null,
      manager,
    );

    if (existingAppointmentForDoctor) {
      let shouldPersist = false;
      if (!existingAppointmentForDoctor.visit) {
        existingAppointmentForDoctor.visit = visit;
        shouldPersist = true;
      }
      if (existingAppointmentForDoctor.status !== PatientStatus.PENDING) {
        existingAppointmentForDoctor.status = PatientStatus.PENDING;
        shouldPersist = true;
      }
      if (shouldPersist) {
        await appointmentRepo.save(existingAppointmentForDoctor);
      }
      const patientQueue = await this.restoreOrCreateQueue(
        existingAppointmentForDoctor,
        patient_id,
        selectedDoctor.id,
        manager,
      );
      await this.ensureAppointmentDoctorLink(
        existingAppointmentForDoctor.id,
        selectedDoctor.id,
        true,
        currentUserId,
        manager,
      );
      const fetchedQueue = await patientQueueRepo.findOne({
        where: { id: patientQueue.id },
        relations: ['doctor', 'appointment'],
        loadEagerRelations: false,
      });
      return {
        appointment: existingAppointmentForDoctor,
        visit,
        fetchedQueue,
        patientQueue: fetchedQueue,
        isNewAppointment: false,
      };
    }

    const token = await this.tokenCounterService.getNextToken();
    let appointment = appointmentRepo.create({
      token_number: token,
      status: PatientStatus.PENDING,
      patient: { id: patient_id },
      doctor: { id: selectedDoctor.id },
      facility: { id: facilityId },
      visit,
      createdBy: { id: currentUserId },
      createdAt: new Date(),
    });
    appointment = await appointmentRepo.save(appointment);
    await this.ensureAppointmentDoctorLink(
      appointment.id,
      selectedDoctor.id,
      true,
      currentUserId,
      manager,
    );

    const queue = patientQueueRepo.create({
      status: PatientStatus.PENDING,
      patient: { id: patient_id },
      doctor: { id: selectedDoctor.id },
      appointment: { id: appointment.id },
    });
    const patientQueue = await patientQueueRepo.save(queue);

    const updatedQueue = await patientQueueRepo.findOne({
      where: { id: patientQueue.id },
      relations: ['doctor', 'appointment'],
      loadEagerRelations: false,
    });

    return {
      appointment,
      visit,
      updatedQueue,
      patientQueue: updatedQueue,
      isNewAppointment: true,
    };
  }

  public async ensureAppointmentService(
    currentUserId: number,
    appointment: Appointment,
    service_id: number,
    patient_id: number,
    manager?: EntityManager,
  ) {
    const appointmentServiceRepo = manager
      ? manager.getRepository(AppointmentService)
      : this.appointmentServiceRepository;
    const alreadyHasService =
      appointment.appointmentServices?.some(
        (as) => as.service?.id === service_id,
      ) ?? false;

    if (alreadyHasService) {
      throw new ConflictException(
        'Selected service is already attached to the appointment.',
      );
    }

    const appointmentService = appointmentServiceRepo.create({
      appointment: { id: appointment.id },
      patient: { id: patient_id },
      service: { id: service_id },
      status: PatientStatus.PENDING,
      createdAt: new Date(),
      createdBy: { id: currentUserId } as User,
    });

    await appointmentServiceRepo.save(appointmentService);
    appointment.appointmentServices = [
      ...(appointment.appointmentServices ?? []),
      appointmentService,
    ];

    return appointmentService;
  }
}
