import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotImplementedException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTelehealthRequestDto } from './dto/create-telehealth-request.dto';
import { TelehealthQueueQueryDto } from './dto/telehealth-queue-query.dto';
import { UpdateTelehealthRequestStatusDto } from './dto/update-telehealth-request-status.dto';
import { CompleteTelehealthRequestDto } from './dto/complete-telehealth-request.dto';
import { TelehealthRequestListQueryDto } from './dto/telehealth-request-list-query.dto';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';
import { FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { TelehealthRequest } from './entities/telehealth-request.entity';
import { TelehealthSession } from './entities/telehealth-session.entity';
import { TelehealthConsultationNote } from './entities/telehealth-consultation-note.entity';
import {
  AttendanceStatus,
  PatientStatus,
  RoleName,
  UserStatus,
} from 'src/common/enums/enums';
import {
  TelehealthAvailabilityStatus,
  TelehealthMeetingProvider,
  TelehealthRequestStatus,
  TelehealthSessionStatus,
} from './enums/telehealth.enums';
import { successResponse } from 'src/common/utils/response.util';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { TelehealthQueueDoctor } from './interfaces/telehealth-queue-doctor.interface';
import { NotificationService } from 'src/notifications/notifications.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class TelehealthService {
  private readonly logger = new Logger(TelehealthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(TelehealthRequest)
    private readonly telehealthRequestRepository: Repository<TelehealthRequest>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(TelehealthSession)
    private readonly telehealthSessionRepository: Repository<TelehealthSession>,
    @InjectRepository(TelehealthConsultationNote)
    private readonly telehealthConsultationNoteRepository: Repository<TelehealthConsultationNote>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
    private readonly notificationService: NotificationService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async getQueue(currentUserId: number, query: TelehealthQueueQueryDto) {
    try {
      const page = this.parsePositiveNumber(query?.page, 1);
      const limit = this.parsePositiveNumber(query?.limit, 10);

      const doctorsQb = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.personalInfo', 'personalInfo')
        .leftJoinAndSelect('user.services', 'service')
        .where('user.deleted_at IS NULL')
        .andWhere('user.status = :approvedStatus', {
          approvedStatus: UserStatus.APPROVED,
        })
        .andWhere('role.name = :telehealthConsultantRole', {
          telehealthConsultantRole: RoleName.TELEHEALTH_CONSULTANT,
        })
        .andWhere('user.id != :currentUserId', { currentUserId });

      if (query?.service_type) {
        doctorsQb.andWhere('service.name = :serviceType', {
          serviceType: query.service_type,
        });
      }

      if (query?.specialty) {
        doctorsQb.andWhere('personalInfo.specialization ILIKE :specialty', {
          specialty: `%${query.specialty.trim()}%`,
        });
      }

      doctorsQb
        .orderBy('user.first_name', 'ASC')
        .addOrderBy('user.last_name', 'ASC');

      const doctors = await doctorsQb.getMany();
      const doctorIds = doctors.map((doctor) => doctor.id);

      const [latestAttendanceMap, busyDoctorIds] = await Promise.all([
        this.getLatestAttendanceByDoctorIds(doctorIds),
        this.getBusyDoctorIds(doctorIds),
      ]);

      const mappedDoctors: TelehealthQueueDoctor[] = doctors.map((doctor) => {
        const latestAttendance = latestAttendanceMap.get(doctor.id);
        const isCheckedIn = latestAttendance === AttendanceStatus.CHECKED_IN;
        const isBusy = isCheckedIn && busyDoctorIds.has(doctor.id);

        const availability = isCheckedIn
          ? isBusy
            ? TelehealthAvailabilityStatus.BUSY
            : TelehealthAvailabilityStatus.AVAILABLE
          : TelehealthAvailabilityStatus.OFFLINE;

        return {
          doctor_id: doctor.id,
          first_name: doctor.first_name,
          last_name: doctor.last_name,
          email: doctor.email,
          specialty: doctor.personalInfo?.specialization ?? null,
          availability,
          current_call_status: isBusy ? 'busy' : 'idle',
          is_checked_in: isCheckedIn,
          is_telehealth_consultant: this.isTelehealthConsultant(doctor),
          services: (doctor.services ?? []).map((service) => service.name),
        };
      });

      const defaultQueue = mappedDoctors.filter(
        (doctor) => doctor.is_checked_in,
      );

      const queueData = query?.availability
        ? mappedDoctors.filter(
            (doctor) => doctor.availability === query.availability,
          )
        : defaultQueue;

      const total = queueData.length;
      const skip = (page - 1) * limit;
      const paginatedQueueData = queueData.slice(skip, skip + limit);

      return successResponse(
        paginatedQueueData,
        'Telehealth queue fetched successfully',
        200,
        page,
        limit,
        total,
      );
    } catch (error) {
      this.logger.error('Failed to fetch telehealth queue', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch telehealth queue',
      );
    }
  }

  private async getLatestAttendanceByDoctorIds(
    doctorIds: number[],
  ): Promise<Map<number, AttendanceStatus>> {
    const statusMap = new Map<number, AttendanceStatus>();
    if (!doctorIds.length) return statusMap;

    const latestAttendanceSubQb = this.attendanceRepository
      .createQueryBuilder('attendance_sub')
      .select('attendance_sub.user_id', 'user_id')
      .addSelect('MAX(attendance_sub.check_in_time)', 'latest_check_in')
      .where('attendance_sub.user_id IN (:...doctorIds)', { doctorIds })
      .groupBy('attendance_sub.user_id');

    const rows = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .innerJoin(
        `(${latestAttendanceSubQb.getQuery()})`,
        'latest_attendance',
        'latest_attendance.user_id = attendance.user_id AND latest_attendance.latest_check_in = attendance.check_in_time',
      )
      .setParameters(latestAttendanceSubQb.getParameters())
      .select('attendance.user_id', 'userId')
      .addSelect('attendance.status', 'status')
      .getRawMany<{ userId: string; status: AttendanceStatus }>();

    for (const row of rows) {
      statusMap.set(Number(row.userId), row.status);
    }

    return statusMap;
  }

  private async getBusyDoctorIds(doctorIds: number[]): Promise<Set<number>> {
    const busyIds = new Set<number>();
    if (!doctorIds.length) return busyIds;

    const rows = await this.telehealthSessionRepository
      .createQueryBuilder('session')
      .select('session.consultant_doctor_id', 'doctorId')
      .where('session.consultant_doctor_id IN (:...doctorIds)', { doctorIds })
      .andWhere('session.deleted_at IS NULL')
      .andWhere('session.status IN (:...activeStatuses)', {
        activeStatuses: [
          TelehealthSessionStatus.PENDING,
          TelehealthSessionStatus.ACTIVE,
        ],
      })
      .groupBy('session.consultant_doctor_id')
      .getRawMany<{ doctorId: string }>();

    for (const row of rows) {
      busyIds.add(Number(row.doctorId));
    }

    return busyIds;
  }

  private parsePositiveNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.floor(parsed)
      : fallback;
  }

  private async getLatestAttendanceStatusByDoctorId(
    doctorId: number,
  ): Promise<AttendanceStatus> {
    const row = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .where('attendance.user_id = :doctorId', { doctorId })
      .orderBy('attendance.check_in_time', 'DESC')
      .addOrderBy('attendance.id', 'DESC')
      .limit(1)
      .getRawOne<{ status: AttendanceStatus }>();

    return row?.status ?? AttendanceStatus.CHECKED_OUT;
  }

  async createRequest(currentUserId: number, dto: CreateTelehealthRequestDto) {
    try {
      const reason = dto?.reason?.trim();
      if (!reason) {
        throw new BadRequestException('Consultation reason is required');
      }

      if (currentUserId === dto.consultant_doctor_id) {
        throw new BadRequestException(
          'Primary doctor cannot request telehealth consultation from self',
        );
      }

      const [requestingDoctor, consultantDoctor, patient] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: currentUserId,
            status: UserStatus.APPROVED,
          },
        }),
        this.userRepository.findOne({
          where: {
            id: dto.consultant_doctor_id,
            status: UserStatus.APPROVED,
            role: { name: RoleName.TELEHEALTH_CONSULTANT },
          },
          relations: ['services', 'personalInfo', 'role'],
        }),
        this.patientRepository.findOne({
          where: { id: dto.patient_id },
        }),
      ]);

      if (!requestingDoctor) {
        throw new NotFoundException('Requesting doctor not found');
      }

      if (!consultantDoctor) {
        throw new NotFoundException('Consultant doctor not found');
      }

      if (!this.isTelehealthConsultant(consultantDoctor)) {
        throw new BadRequestException(
          'Selected consultant is not a telehealth consultant',
        );
      }

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      const consultantAttendanceStatus =
        await this.getLatestAttendanceStatusByDoctorId(consultantDoctor.id);

      if (consultantAttendanceStatus !== AttendanceStatus.CHECKED_IN) {
        throw new BadRequestException(
          'Selected consultant is not checked in for telehealth consultations',
        );
      }

      let appointmentService: AppointmentService | null = null;
      if (dto.appointment_service_id) {
        appointmentService = await this.appointmentServiceRepository.findOne({
          where: {
            id: dto.appointment_service_id,
            status: In([PatientStatus.IN_PROGRESS, PatientStatus.PAUSED]),
          },
          relations: [
            'appointment',
            'appointment.patient',
            'appointment.doctor',
            'service',
          ],
        });

        if (!appointmentService) {
          throw new NotFoundException('Appointment service not found');
        }

        if (appointmentService.appointment?.patient?.id !== dto.patient_id) {
          throw new BadRequestException(
            'Appointment service does not belong to the provided patient',
          );
        }

        if (appointmentService.appointment?.doctor?.id !== currentUserId) {
          throw new BadRequestException(
            'Only the assigned primary doctor can request telehealth consultation for this appointment',
          );
        }
      }

      const existingActiveRequest =
        await this.telehealthRequestRepository.findOne({
          where: {
            patientId: dto.patient_id,
            requestingDoctorId: currentUserId,
            status: In([
              TelehealthRequestStatus.PENDING,
              TelehealthRequestStatus.ACCEPTED,
              TelehealthRequestStatus.IN_SESSION,
            ]),
          },
          order: { requestedAt: 'DESC' },
        });

      if (existingActiveRequest) {
        throw new ConflictException(
          'An active telehealth request already exists for this patient by the requesting doctor. You can create a new request after it is completed, rejected, or cancelled',
        );
      }

      const trimmedSpecialty = dto.specialty?.trim();
      const resolvedSpecialty =
        trimmedSpecialty ||
        consultantDoctor.personalInfo?.specialization ||
        undefined;

      const createdRequest =
        await this.telehealthRequestRepository.manager.transaction(
          async (transactionalEntityManager) => {
            const telehealthRequest = this.telehealthRequestRepository.create({
              patientId: dto.patient_id,
              appointmentServiceId: dto.appointment_service_id,
              requestingDoctorId: currentUserId,
              consultantDoctorId: dto.consultant_doctor_id,
              specialty: resolvedSpecialty,
              reason,
              status: TelehealthRequestStatus.PENDING,
            });

            return transactionalEntityManager.save(
              TelehealthRequest,
              telehealthRequest,
            );
          },
        );

      const populatedRequest = await this.telehealthRequestRepository.findOne({
        where: { id: createdRequest.id },
      });

      const patientName =
        `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim();
      const requestingDoctorName =
        `${requestingDoctor.first_name ?? ''} ${requestingDoctor.last_name ?? ''}`.trim();
      const notificationTitle = 'New Telehealth Consultation Request';
      const notificationMessage = `${requestingDoctorName} requested telehealth consultation for patient ${patientName}.`;

      try {
        await this.notificationService.createForUser(
          consultantDoctor.id,
          notificationTitle,
          notificationMessage,
        );

        this.socketGateway.emitToUser(
          consultantDoctor.id,
          'telehealth_request_created',
          {
            requestId: createdRequest.id,
            patientId: patient.id,
            patientName,
            requestingDoctorId: currentUserId,
            requestingDoctorName,
            consultantDoctorId: consultantDoctor.id,
            specialty: resolvedSpecialty ?? null,
            reason,
            status: TelehealthRequestStatus.PENDING,
          },
        );
      } catch (notificationError) {
        this.logger.warn(
          `Telehealth request ${createdRequest.id} created but notification dispatch failed: ${notificationError?.message ?? notificationError}`,
        );
      }

      return successResponse(
        populatedRequest ?? createdRequest,
        'Telehealth consultation request created successfully',
        201,
      );
    } catch (error) {
      this.logger.error('Failed to create telehealth request', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to create telehealth request',
      );
    }
  }

  async getIncomingRequests(
    currentUserId: number,
    query: TelehealthRequestListQueryDto,
  ) {
    try {
      const consultantDoctor = await this.userRepository.findOne({
        where: {
          id: currentUserId,
          status: UserStatus.APPROVED,
        },
        relations: ['role'],
      });

      if (!consultantDoctor) {
        throw new NotFoundException('Consultant doctor not found');
      }

      if (!this.isTelehealthConsultant(consultantDoctor)) {
        throw new BadRequestException(
          'Current user is not assigned telehealth consultant role',
        );
      }

      const where: FindOptionsWhere<TelehealthRequest> = {
        consultantDoctorId: currentUserId,
      };

      if (query?.status) {
        where.status = query.status;
      }

      const requests = await this.telehealthRequestRepository.find({
        where,
        relations: ['session', 'consultationNote'],
        order: {
          requestedAt: 'DESC',
          id: 'DESC',
        },
      });

      const data = requests.map((request) => {
        const patientName =
          `${request.patient?.first_name ?? ''} ${request.patient?.last_name ?? ''}`.trim();
        const requestingDoctorName =
          `${request.requestingDoctor?.first_name ?? ''} ${request.requestingDoctor?.last_name ?? ''}`.trim();
        const consultantDoctorName =
          `${request.consultantDoctor?.first_name ?? ''} ${request.consultantDoctor?.last_name ?? ''}`.trim();

        return {
          id: request.id,
          patientId: request.patientId,
          patientName: patientName || null,
          appointmentServiceId: request.appointmentServiceId ?? null,
          requestingDoctorId: request.requestingDoctorId,
          requestingDoctorName: requestingDoctorName || null,
          consultantDoctorId: request.consultantDoctorId,
          consultantDoctorName: consultantDoctorName || null,
          specialty: request.specialty ?? null,
          reason: request.reason,
          status: request.status,
          requestedAt: request.requestedAt,
          respondedAt: request.respondedAt ?? null,
          acceptedAt: request.acceptedAt ?? null,
          rejectedAt: request.rejectedAt ?? null,
          cancelledAt: request.cancelledAt ?? null,
          completedAt: request.completedAt ?? null,
          rejectedReason: request.rejectedReason ?? null,
          cancelReason: request.cancelReason ?? null,
          session: request.session
            ? {
                id: request.session.id,
                status: request.session.status,
                provider: request.session.provider,
                meetingUrl: request.session.meetingUrl ?? null,
                startedAt: request.session.startedAt ?? null,
                endedAt: request.session.endedAt ?? null,
              }
            : null,
          consultation_note: request.consultationNote
            ? {
                id: request.consultationNote.id,
                note: request.consultationNote.note,
                submittedAt: request.consultationNote.submittedAt,
              }
            : null,
        };
      });

      return successResponse(
        data,
        'Incoming telehealth requests fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch incoming telehealth requests',
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch incoming telehealth requests',
      );
    }
  }

  async acceptRequest(currentUserId: number, requestId: number) {
    try {
      return await this.acceptRequestInternal(currentUserId, requestId);
    } catch (error) {
      this.logger.error('Failed to accept telehealth request', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to accept telehealth request',
      );
    }
  }

  async rejectRequest(
    currentUserId: number,
    requestId: number,
    dto: UpdateTelehealthRequestStatusDto,
  ) {
    try {
      return await this.rejectRequestInternal(currentUserId, requestId, dto);
    } catch (error) {
      this.logger.error('Failed to reject telehealth request', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to reject telehealth request',
      );
    }
  }

  cancelRequest(
    currentUserId: number,
    requestId: number,
    dto: UpdateTelehealthRequestStatusDto,
  ) {
    return this.cancelRequestInternal(currentUserId, requestId, dto);
  }

  async completeRequest(
    currentUserId: number,
    requestId: number,
    dto: CompleteTelehealthRequestDto,
  ) {
    try {
      const consultationNote = dto?.consultation_note?.trim();
      if (!consultationNote) {
        throw new BadRequestException('Consultation note is required');
      }

      const consultantDoctor = await this.userRepository.findOne({
        where: {
          id: currentUserId,
          status: UserStatus.APPROVED,
        },
        relations: ['role'],
      });

      if (!consultantDoctor) {
        throw new NotFoundException('Consultant doctor not found');
      }

      if (!this.isTelehealthConsultant(consultantDoctor)) {
        throw new BadRequestException(
          'Current user is not assigned telehealth consultant role',
        );
      }

      const request = await this.telehealthRequestRepository.findOne({
        where: {
          id: requestId,
          consultantDoctorId: currentUserId,
        },
        relations: [
          'session',
          'appointmentService',
          'appointmentService.appointment',
        ],
      });

      if (!request) {
        throw new NotFoundException(
          'Telehealth request not found or not assigned to current consultant',
        );
      }

      if (request.status === TelehealthRequestStatus.COMPLETED) {
        throw new ConflictException('Telehealth request is already completed');
      }

      if (
        ![
          TelehealthRequestStatus.IN_SESSION,
          TelehealthRequestStatus.ACCEPTED,
        ].includes(request.status)
      ) {
        throw new ConflictException(
          `Only accepted/in-session requests can be completed. Current status is "${request.status}"`,
        );
      }

      const now = new Date();
      let savedNoteId: number | null = null;

      await this.telehealthRequestRepository.manager.transaction(
        async (transactionalEntityManager) => {
          request.status = TelehealthRequestStatus.COMPLETED;
          request.completedAt = now;
          await transactionalEntityManager.save(TelehealthRequest, request);

          const session = request.session
            ? request.session
            : this.telehealthSessionRepository.create({
                requestId: request.id,
                requestingDoctorId: request.requestingDoctorId,
                consultantDoctorId: request.consultantDoctorId,
                provider: TelehealthMeetingProvider.GOOGLE_MEET,
                status: TelehealthSessionStatus.ENDED,
              });

          session.status = TelehealthSessionStatus.ENDED;
          session.endedAt = now;
          if (!session.startedAt) {
            session.startedAt = now;
          }
          await transactionalEntityManager.save(TelehealthSession, session);

          const note = this.telehealthConsultationNoteRepository.create({
            requestId: request.id,
            patientId: request.patientId,
            appointmentId:
              request.appointmentService?.appointment?.id ?? undefined,
            consultantDoctorId: currentUserId,
            primaryDoctorId: request.requestingDoctorId,
            note: consultationNote,
          });

          const savedNote = await transactionalEntityManager.save(
            TelehealthConsultationNote,
            note,
          );
          savedNoteId = savedNote.id;
        },
      );

      const updatedRequest = await this.telehealthRequestRepository.findOne({
        where: { id: request.id },
        relations: ['session'],
      });
      const savedNote = savedNoteId
        ? await this.telehealthConsultationNoteRepository.findOne({
            where: { id: savedNoteId },
          })
        : null;

      const consultantDoctorName =
        `${request.consultantDoctor?.first_name ?? ''} ${request.consultantDoctor?.last_name ?? ''}`.trim();
      const patientName =
        `${request.patient?.first_name ?? ''} ${request.patient?.last_name ?? ''}`.trim();

      try {
        await this.notificationService.createForUser(
          request.requestingDoctorId,
          'Telehealth Consultation Completed',
          `${consultantDoctorName} completed telehealth consultation for patient ${patientName}.`,
        );

        this.socketGateway.emitToUser(
          request.requestingDoctorId,
          'telehealth_request_completed',
          {
            requestId: request.id,
            patientId: request.patientId,
            status: TelehealthRequestStatus.COMPLETED,
            completedAt: now,
            consultationNote,
            session: updatedRequest?.session
              ? {
                  id: updatedRequest.session.id,
                  status: updatedRequest.session.status,
                  provider: updatedRequest.session.provider,
                  meetingUrl: updatedRequest.session.meetingUrl ?? null,
                  startedAt: updatedRequest.session.startedAt ?? null,
                  endedAt: updatedRequest.session.endedAt ?? null,
                }
              : null,
          },
        );
      } catch (notificationError) {
        this.logger.warn(
          `Telehealth request ${request.id} completed but notification dispatch failed: ${notificationError?.message ?? notificationError}`,
        );
      }

      return successResponse(
        {
          request: this.mapRequestResponse(updatedRequest ?? request),
          consultation_note: savedNote
            ? {
                id: savedNote.id,
                note: savedNote.note,
                submittedAt: savedNote.submittedAt,
              }
            : null,
        },
        'Telehealth request completed successfully',
        200,
      );
    } catch (error) {
      this.logger.error('Failed to complete telehealth request', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to complete telehealth request',
      );
    }
  }

  private isTelehealthConsultant(user: User | null | undefined): boolean {
    return user?.role?.name === RoleName.TELEHEALTH_CONSULTANT;
  }

  private async acceptRequestInternal(
    currentUserId: number,
    requestId: number,
  ) {
    const consultantDoctor = await this.userRepository.findOne({
      where: {
        id: currentUserId,
        status: UserStatus.APPROVED,
      },
      relations: ['role'],
    });

    if (!consultantDoctor) {
      throw new NotFoundException('Consultant doctor not found');
    }

    if (!this.isTelehealthConsultant(consultantDoctor)) {
      throw new BadRequestException(
        'Current user is not assigned telehealth consultant role',
      );
    }

    const consultantAttendanceStatus =
      await this.getLatestAttendanceStatusByDoctorId(currentUserId);
    if (consultantAttendanceStatus !== AttendanceStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Consultant doctor must be checked in to accept telehealth requests',
      );
    }

    const request = await this.telehealthRequestRepository.findOne({
      where: {
        id: requestId,
        consultantDoctorId: currentUserId,
      },
      relations: ['session'],
    });

    if (!request) {
      throw new NotFoundException(
        'Telehealth request not found or not assigned to current consultant',
      );
    }

    if (request.appointmentServiceId) {
      const allowedAppointmentService =
        await this.appointmentServiceRepository.findOne({
          where: {
            id: request.appointmentServiceId,
            status: In([PatientStatus.IN_PROGRESS, PatientStatus.PAUSED]),
          },
        });

      if (!allowedAppointmentService) {
        throw new ConflictException(
          'Telehealth request can only be accepted when appointment service status is in_progress or paused',
        );
      }
    }

    if (request.status !== TelehealthRequestStatus.PENDING) {
      throw new ConflictException(
        `Only pending requests can be accepted. Current status is "${request.status}"`,
      );
    }

    const activeRequestForConsultant =
      await this.telehealthRequestRepository.findOne({
        where: {
          consultantDoctorId: currentUserId,
          id: Not(requestId),
          status: In([
            TelehealthRequestStatus.ACCEPTED,
            TelehealthRequestStatus.IN_SESSION,
          ]),
        },
        order: {
          respondedAt: 'DESC',
          requestedAt: 'DESC',
          id: 'DESC',
        },
      });

    if (activeRequestForConsultant) {
      throw new ConflictException(
        'Consultant can only accept one request at a time. Complete the current consultation before accepting another request',
      );
    }

    const now = new Date();
    const generatedMeetingUrl = await this.generateGoogleMeetMeetingUrl(
      request.id,
    );

    await this.telehealthRequestRepository.manager.transaction(
      async (transactionalEntityManager) => {
        request.status = TelehealthRequestStatus.IN_SESSION;
        request.respondedAt = now;
        request.acceptedAt = now;
        await transactionalEntityManager.save(TelehealthRequest, request);

        let session = request.session;
        if (!session) {
          session = this.telehealthSessionRepository.create({
            requestId: request.id,
            requestingDoctorId: request.requestingDoctorId,
            consultantDoctorId: request.consultantDoctorId,
            status: TelehealthSessionStatus.ACTIVE,
            provider: TelehealthMeetingProvider.GOOGLE_MEET,
            meetingUrl: generatedMeetingUrl,
            startedAt: now,
          });
        } else {
          session.status = TelehealthSessionStatus.ACTIVE;
          session.requestingDoctorId = request.requestingDoctorId;
          session.consultantDoctorId = request.consultantDoctorId;
          session.provider =
            session.provider ?? TelehealthMeetingProvider.GOOGLE_MEET;
          session.meetingUrl = generatedMeetingUrl;
          session.startedAt = session.startedAt ?? now;
        }

        await transactionalEntityManager.save(TelehealthSession, session);
      },
    );

    const updatedRequest = await this.telehealthRequestRepository.findOne({
      where: { id: request.id },
      relations: ['session'],
    });

    const consultantDoctorName =
      `${request.consultantDoctor?.first_name ?? ''} ${request.consultantDoctor?.last_name ?? ''}`.trim();
    const patientName =
      `${request.patient?.first_name ?? ''} ${request.patient?.last_name ?? ''}`.trim();

    try {
      const meetingUrlToShare =
        updatedRequest?.session?.meetingUrl ?? generatedMeetingUrl;

      await this.notificationService.createForUser(
        request.requestingDoctorId,
        'Telehealth Consultation Request Accepted',
        `${consultantDoctorName} accepted the telehealth consultation request for patient ${patientName}.`,
      );

      this.socketGateway.emitToUser(
        request.requestingDoctorId,
        'telehealth_request_accepted',
        {
          requestId: request.id,
          patientId: request.patientId,
          patientName,
          requestingDoctorId: request.requestingDoctorId,
          consultantDoctorId: request.consultantDoctorId,
          consultantDoctorName,
          status: TelehealthRequestStatus.IN_SESSION,
          acceptedAt: now,
          session: updatedRequest?.session
            ? {
                id: updatedRequest.session.id,
                status: updatedRequest.session.status,
                provider: updatedRequest.session.provider,
                meetingUrl: updatedRequest.session.meetingUrl ?? null,
                startedAt: updatedRequest.session.startedAt ?? null,
              }
            : null,
        },
      );

      this.socketGateway.emitToUser(
        request.requestingDoctorId,
        'telehealth_meeting_url_generated',
        {
          requestId: request.id,
          patientId: request.patientId,
          provider: TelehealthMeetingProvider.GOOGLE_MEET,
          meetingUrl: meetingUrlToShare,
          generatedAt: now,
        },
      );

      this.socketGateway.emitToUser(
        request.requestingDoctorId,
        'telehealth_session_started',
        {
          requestId: request.id,
          status: TelehealthRequestStatus.IN_SESSION,
          session: updatedRequest?.session
            ? {
                id: updatedRequest.session.id,
                status: updatedRequest.session.status,
                provider: updatedRequest.session.provider,
                meetingUrl: updatedRequest.session.meetingUrl ?? null,
                startedAt: updatedRequest.session.startedAt ?? null,
              }
            : null,
        },
      );
    } catch (notificationError) {
      this.logger.warn(
        `Telehealth request ${request.id} accepted but notification dispatch failed: ${notificationError?.message ?? notificationError}`,
      );
    }

    return successResponse(
      this.mapRequestResponse(updatedRequest ?? request),
      'Telehealth consultation request accepted successfully',
      200,
    );
  }

  private async cancelRequestInternal(
    currentUserId: number,
    requestId: number,
    dto: UpdateTelehealthRequestStatusDto,
  ) {
    try {
      const request = await this.telehealthRequestRepository.findOne({
        where: { id: requestId },
        relations: ['session'],
      });

      if (!request) {
        throw new NotFoundException('Telehealth request not found');
      }

      if (request.requestingDoctorId !== currentUserId) {
        throw new BadRequestException(
          'Only the requesting doctor can cancel this telehealth request',
        );
      }

      if (
        ![
          TelehealthRequestStatus.PENDING,
          TelehealthRequestStatus.ACCEPTED,
          TelehealthRequestStatus.IN_SESSION,
        ].includes(request.status)
      ) {
        throw new ConflictException(
          `Only pending/accepted/in-session requests can be cancelled. Current status is "${request.status}"`,
        );
      }

      const now = new Date();
      const cancelReason = dto?.reason?.trim();

      await this.telehealthRequestRepository.manager.transaction(
        async (transactionalEntityManager) => {
          request.status = TelehealthRequestStatus.CANCELLED;
          request.cancelledAt = now;
          request.respondedAt = request.respondedAt ?? now;
          if (cancelReason) {
            request.cancelReason = cancelReason;
          }
          await transactionalEntityManager.save(TelehealthRequest, request);

          if (request.session) {
            request.session.status = TelehealthSessionStatus.ENDED;
            request.session.endedAt = now;
            request.session.startedAt = request.session.startedAt ?? now;
            await transactionalEntityManager.save(
              TelehealthSession,
              request.session,
            );
          }
        },
      );

      const updatedRequest = await this.telehealthRequestRepository.findOne({
        where: { id: request.id },
        relations: ['session'],
      });

      const requestingDoctorName =
        `${request.requestingDoctor?.first_name ?? ''} ${request.requestingDoctor?.last_name ?? ''}`.trim();
      const patientName =
        `${request.patient?.first_name ?? ''} ${request.patient?.last_name ?? ''}`.trim();

      try {
        await this.notificationService.createForUser(
          request.consultantDoctorId,
          'Telehealth Consultation Request Cancelled',
          `${requestingDoctorName} cancelled telehealth consultation request for patient ${patientName}.`,
        );

        this.socketGateway.emitToUser(
          request.consultantDoctorId,
          'telehealth_request_cancelled',
          {
            requestId: request.id,
            patientId: request.patientId,
            requestingDoctorId: request.requestingDoctorId,
            consultantDoctorId: request.consultantDoctorId,
            status: TelehealthRequestStatus.CANCELLED,
            cancelledAt: now,
            cancelReason: cancelReason ?? null,
            session: updatedRequest?.session
              ? {
                  id: updatedRequest.session.id,
                  status: updatedRequest.session.status,
                  provider: updatedRequest.session.provider,
                  meetingUrl: updatedRequest.session.meetingUrl ?? null,
                  startedAt: updatedRequest.session.startedAt ?? null,
                  endedAt: updatedRequest.session.endedAt ?? null,
                }
              : null,
          },
        );
      } catch (notificationError) {
        this.logger.warn(
          `Telehealth request ${request.id} cancelled but notification dispatch failed: ${notificationError?.message ?? notificationError}`,
        );
      }

      return successResponse(
        this.mapRequestResponse(updatedRequest ?? request),
        'Telehealth request cancelled successfully',
        200,
      );
    } catch (error) {
      this.logger.error('Failed to cancel telehealth request', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to cancel telehealth request',
      );
    }
  }

  private async rejectRequestInternal(
    currentUserId: number,
    requestId: number,
    dto: UpdateTelehealthRequestStatusDto,
  ) {
    const consultantDoctor = await this.userRepository.findOne({
      where: {
        id: currentUserId,
        status: UserStatus.APPROVED,
      },
      relations: ['role'],
    });

    if (!consultantDoctor) {
      throw new NotFoundException('Consultant doctor not found');
    }

    if (!this.isTelehealthConsultant(consultantDoctor)) {
      throw new BadRequestException(
        'Current user is not assigned telehealth consultant role',
      );
    }

    const request = await this.telehealthRequestRepository.findOne({
      where: {
        id: requestId,
        consultantDoctorId: currentUserId,
      },
      relations: ['session'],
    });

    if (!request) {
      throw new NotFoundException(
        'Telehealth request not found or not assigned to current consultant',
      );
    }

    if (
      [
        TelehealthRequestStatus.ACCEPTED,
        TelehealthRequestStatus.IN_SESSION,
      ].includes(request.status)
    ) {
      throw new ConflictException(
        'Accepted telehealth request cannot be rejected. Complete the consultation instead',
      );
    }

    if (request.status !== TelehealthRequestStatus.PENDING) {
      throw new ConflictException(
        `Only pending requests can be rejected. Current status is "${request.status}"`,
      );
    }

    const now = new Date();
    const rejectedReason = dto?.reason?.trim();

    await this.telehealthRequestRepository.manager.transaction(
      async (transactionalEntityManager) => {
        request.status = TelehealthRequestStatus.REJECTED;
        request.respondedAt = now;
        request.rejectedAt = now;
        if (rejectedReason) {
          request.rejectedReason = rejectedReason;
        }
        await transactionalEntityManager.save(TelehealthRequest, request);

        if (request.session) {
          request.session.status = TelehealthSessionStatus.FAILED;
          request.session.endedAt = now;
          request.session.startedAt = request.session.startedAt ?? now;
          await transactionalEntityManager.save(
            TelehealthSession,
            request.session,
          );
        }
      },
    );

    const updatedRequest = await this.telehealthRequestRepository.findOne({
      where: { id: request.id },
      relations: ['session'],
    });

    const consultantDoctorName =
      `${request.consultantDoctor?.first_name ?? ''} ${request.consultantDoctor?.last_name ?? ''}`.trim();
    const patientName =
      `${request.patient?.first_name ?? ''} ${request.patient?.last_name ?? ''}`.trim();

    try {
      await this.notificationService.createForUser(
        request.requestingDoctorId,
        'Telehealth Consultation Request Rejected',
        `${consultantDoctorName} rejected telehealth consultation request for patient ${patientName}.`,
      );

      this.socketGateway.emitToUser(
        request.requestingDoctorId,
        'telehealth_request_rejected',
        {
          requestId: request.id,
          patientId: request.patientId,
          requestingDoctorId: request.requestingDoctorId,
          consultantDoctorId: request.consultantDoctorId,
          status: TelehealthRequestStatus.REJECTED,
          rejectedAt: now,
          rejectedReason: rejectedReason ?? null,
          session: updatedRequest?.session
            ? {
                id: updatedRequest.session.id,
                status: updatedRequest.session.status,
                provider: updatedRequest.session.provider,
                meetingUrl: updatedRequest.session.meetingUrl ?? null,
                startedAt: updatedRequest.session.startedAt ?? null,
                endedAt: updatedRequest.session.endedAt ?? null,
              }
            : null,
        },
      );
    } catch (notificationError) {
      this.logger.warn(
        `Telehealth request ${request.id} rejected but notification dispatch failed: ${notificationError?.message ?? notificationError}`,
      );
    }

    return successResponse(
      this.mapRequestResponse(updatedRequest ?? request),
      'Telehealth request rejected successfully',
      200,
    );
  }

  private mapRequestResponse(request: TelehealthRequest) {
    const patientName =
      `${request.patient?.first_name ?? ''} ${request.patient?.last_name ?? ''}`.trim();
    const requestingDoctorName =
      `${request.requestingDoctor?.first_name ?? ''} ${request.requestingDoctor?.last_name ?? ''}`.trim();
    const consultantDoctorName =
      `${request.consultantDoctor?.first_name ?? ''} ${request.consultantDoctor?.last_name ?? ''}`.trim();

    return {
      id: request.id,
      patientId: request.patientId,
      patientName: patientName || null,
      appointmentServiceId: request.appointmentServiceId ?? null,
      requestingDoctorId: request.requestingDoctorId,
      requestingDoctorName: requestingDoctorName || null,
      consultantDoctorId: request.consultantDoctorId,
      consultantDoctorName: consultantDoctorName || null,
      specialty: request.specialty ?? null,
      reason: request.reason,
      status: request.status,
      requestedAt: request.requestedAt,
      respondedAt: request.respondedAt ?? null,
      acceptedAt: request.acceptedAt ?? null,
      rejectedAt: request.rejectedAt ?? null,
      cancelledAt: request.cancelledAt ?? null,
      completedAt: request.completedAt ?? null,
      rejectedReason: request.rejectedReason ?? null,
      cancelReason: request.cancelReason ?? null,
      session: request.session
        ? {
            id: request.session.id,
            status: request.session.status,
            provider: request.session.provider,
            meetingUrl: request.session.meetingUrl ?? null,
            startedAt: request.session.startedAt ?? null,
            endedAt: request.session.endedAt ?? null,
          }
        : null,
    };
  }

  async getRequestByAppointmentService(
    currentUserId: number,
    appointmentServiceId: number,
  ) {
    try {
      const requests = await this.telehealthRequestRepository.find({
        where: {
          appointmentServiceId,
          requestingDoctorId: currentUserId,
        },
        relations: ['session', 'consultationNote'],
        order: {
          requestedAt: 'ASC',
          id: 'ASC',
        },
      });

      if (!requests.length) {
        throw new NotFoundException(
          'No telehealth requests found for this appointment service',
        );
      }

      const data = requests.map((request) => ({
        ...this.mapRequestResponse(request),
        consultation_note: request.consultationNote
          ? {
              id: request.consultationNote.id,
              note: request.consultationNote.note,
              submittedAt: request.consultationNote.submittedAt,
            }
          : null,
      }));

      return successResponse(
        data,
        'Telehealth requests fetched successfully',
        200,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch telehealth request by appointment service',
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch telehealth request by appointment service',
      );
    }
  }

  private async generateGoogleMeetMeetingUrl(
    requestId: number,
  ): Promise<string> {
    const accessToken = await this.getGoogleMeetOAuthAccessToken();

    const response = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          accessType: 'OPEN',
          entryPointAccess: 'ALL',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Google Meet space creation failed for request ${requestId} (${response.status}): ${errorText}`,
      );
      throw new ServiceUnavailableException(
        'Failed to generate Google Meet link via Meet API. Verify OAuth refresh token scopes include https://www.googleapis.com/auth/meetings.space.created.',
      );
    }

    const payload = (await response.json()) as {
      meetingUri?: string;
      meetingCode?: string;
      name?: string;
    };

    const meetingUrl =
      payload.meetingUri ??
      (payload.meetingCode
        ? `https://meet.google.com/${payload.meetingCode}`
        : null);

    if (!meetingUrl) {
      this.logger.error(
        `Google Meet API response missing meeting URL for request ${requestId}: ${JSON.stringify(payload)}`,
      );
      throw new ServiceUnavailableException(
        'Google Meet link was not returned by Google API.',
      );
    }

    return meetingUrl;
  }

  private async getGoogleMeetOAuthAccessToken(): Promise<string> {
    const clientId = process.env.GOOGLE_MEET_OAUTH_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_MEET_OAUTH_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GOOGLE_MEET_OAUTH_REFRESH_TOKEN?.trim();

    if (!clientId || !clientSecret || !refreshToken) {
      throw new ServiceUnavailableException(
        'Google Meet OAuth is not configured. Set GOOGLE_MEET_OAUTH_CLIENT_ID, GOOGLE_MEET_OAUTH_CLIENT_SECRET, and GOOGLE_MEET_OAUTH_REFRESH_TOKEN.',
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      this.logger.error(
        `Failed to fetch Google OAuth access token (${tokenResponse.status}): ${errorText}`,
      );
      throw new ServiceUnavailableException(
        'Failed to authenticate with Google OAuth for meeting generation.',
      );
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokenPayload.access_token) {
      throw new ServiceUnavailableException(
        'Google OAuth token response did not include access_token.',
      );
    }

    return tokenPayload.access_token;
  }
}
