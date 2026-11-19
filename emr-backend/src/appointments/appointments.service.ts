import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { errorResponse, successResponse } from 'src/common/utils/response.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import {
  PatientStatus,
  TypeOfService,
  VisitStatus,
} from 'src/common/enums/enums';
import { AppointmentService } from './entities/appointment-service.entity';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { SearchServicePatientDto } from './dto/search-service-patient.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(PatientQueue)
    private readonly patientQueueRepository: Repository<PatientQueue>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
  ) {}

  async completeAppointmentService(
    currentUserId: number,
    appointmentId: number,
    serviceId: number,
  ) {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: {
          id: appointmentId,
          doctor: { id: currentUserId },
          status: PatientStatus.IN_PROGRESS,
        },
        relations: [
          'patient',
          'visit',
          'appointmentServices',
          'appointmentServices.service',
          'patientQueue',
          'appointmentDoctors',
          'appointmentDoctors.doctor',
        ],
      });

      if (!appointment) {
        throw new NotFoundException(ApiResponseMessages.APT_NOT_FOUND);
      }

      const targetService = appointment.appointmentServices.find(
        (as) => as.service?.id === serviceId,
      );

      if (!targetService) {
        throw new NotFoundException(`Target service not found for the following id: ${serviceId}`)
      }

      targetService.status = PatientStatus.COMPLETED;
      await this.appointmentServiceRepository.save(targetService);

      const allCompleted = appointment.appointmentServices.every(
        (as) => as.status === PatientStatus.COMPLETED,
      );

      if (allCompleted) {
        appointment.status = PatientStatus.COMPLETED;
        await this.appointmentRepository.save(appointment);

        if (appointment.patientQueue) {
          await this.patientQueueRepository.delete({
            appointment: { id: appointmentId },
          });
        }

        return successResponse(
          appointment,
          'All services completed. Appointment marked as completed and queue entry removed.',
          200,
        );
      }

      return successResponse(
        targetService,
        'Service marked as completed. Appointment still in progress.',
        200,
      );
    } catch (error) {
      console.error('Error completing appointment service:', error);
      return errorResponse(
        'Failed to complete appointment service',
        500,
        error.message ?? error,
      );
    }
  }

  async startAppointmentService(
    currentUserId: number,
    appointmentId: number,
    serviceId: number,
  ) {
    try {
      const appointmentRows = await this.appointmentRepository.manager.query(
        `
        WITH flags AS (
          SELECT
            EXISTS (
              SELECT 1
              FROM users u
              WHERE u.id = $2
                AND u.deleted_at IS NULL
            ) AS "userExists",
            EXISTS (
              SELECT 1
              FROM user_services us
              WHERE us.user_id = $2
                AND us.service_id = $3
            ) AS "userHasService",
            EXISTS (
              SELECT 1
              FROM patient_queues q
              INNER JOIN appointments qa ON qa.id = q.appointment_id
              INNER JOIN appointment_services aps ON aps.appointment_id = qa.id
              INNER JOIN services s ON s.id = aps.service_id
              WHERE q.status::text = $4
                AND q.doctor_id = $2
                AND qa.status::text = $4
                AND s.name != $6
                AND q.deleted_at IS NULL
            ) AS "hasPendingService"
        )
        SELECT
          appointment.id AS "appointmentId",
          appointment.token_number AS "tokenNumber",
          appointment.status AS "appointmentStatus",
          patient.id AS "patientId",
          visit.id AS "visitId",
          visit.status AS "visitStatus",
          patientQueue.id AS "patientQueueId",
          patientQueue.status AS "patientQueueStatus",
          appointmentService.id AS "appointmentServiceId",
          appointmentService.status AS "appointmentServiceStatus",
          service.id AS "serviceId",
          service.name AS "serviceName",
          requestedService.id AS "requestedServiceId",
          requestedService.name AS "requestedServiceName",
          flags."userExists",
          flags."userHasService",
          flags."hasPendingService",
          (
            appointment.status::text = $7
            AND EXISTS (
              SELECT 1
              FROM patient_queues activeQueue
              WHERE activeQueue.patient_id = patient.id
                AND activeQueue.status::text IN ($4, $5)
                AND activeQueue.deleted_at IS NULL
            )
          ) AS "hasActiveQueue"
        FROM appointments appointment
        INNER JOIN patients patient ON patient.id = appointment.patient_id
        INNER JOIN users doctor
          ON doctor.id = appointment.doctor_id
          AND doctor.deleted_at IS NULL
        LEFT JOIN visits visit ON visit.id = appointment.visit_id
        LEFT JOIN patient_queues patientQueue
          ON patientQueue.appointment_id = appointment.id
          AND patientQueue.deleted_at IS NULL
        LEFT JOIN appointment_services appointmentService
          ON appointmentService.appointment_id = appointment.id
        LEFT JOIN services service ON service.id = appointmentService.service_id
        LEFT JOIN services requestedService ON requestedService.id = $3
        CROSS JOIN flags
        WHERE appointment.id = $1
          AND doctor.id = $2
        `,
        [
          appointmentId,
          currentUserId,
          serviceId,
          PatientStatus.IN_PROGRESS,
          PatientStatus.PENDING,
          TypeOfService.DELIVERY,
          PatientStatus.PAUSED,
        ],
      );

      if (!appointmentRows.length) {
        throw new NotFoundException(
          `Appointment not found for the id: ${appointmentId}`,
        );
      }

      if (
        appointmentRows.some(
          (row) =>
            Number(row.serviceId) === Number(serviceId) &&
            row.appointmentServiceStatus === PatientStatus.COMPLETED,
        )
      ) {
        throw new BadRequestException('This service is already completed');
      }

      const appointment = appointmentRows[0];

      if (appointment.hasPendingService) {
        throw new ConflictException(
          'Please refer or complete the visit of in progress patient.',
        );
      }

      if (!appointment.requestedServiceId) {
        throw new NotFoundException(
          `Service not found for the following id: ${serviceId}`,
        );
      }

      if (!appointment.userExists) {
        throw new NotFoundException('User not found');
      }

      if (!appointment.userHasService) {
        throw new ForbiddenException(
          `User does not offer the requested service (ID: ${serviceId})`,
        );
      }

      const patientId = Number(appointment.patientId);
      const visitId = appointment.visitId ? Number(appointment.visitId) : null;
      const appointmentStatus = appointment.appointmentStatus as PatientStatus;
      const visitStatus = appointment.visitStatus as VisitStatus | null;
      const patientQueueId = appointment.patientQueueId
        ? Number(appointment.patientQueueId)
        : null;
      const patientQueueStatus =
        appointment.patientQueueStatus as PatientStatus | null;

      const appointmentServices = appointmentRows
        .filter((row) => row.appointmentServiceId)
        .map((row) => ({
          id: Number(row.appointmentServiceId),
          status: row.appointmentServiceStatus as PatientStatus,
          service: row.serviceId
            ? {
                id: Number(row.serviceId),
                name: row.serviceName,
              }
            : null,
        }));

      const isDeliveryService =
        (appointment.requestedServiceName ?? '').toUpperCase() ===
        TypeOfService.DELIVERY;

      const inProgressServices = appointmentServices
        .filter(
          (as) =>
            as.service?.id !== Number(serviceId) &&
            as.status === PatientStatus.IN_PROGRESS,
        )
        .map((as) => ({
          name: as.service?.name ?? 'Unknown Service',
          status: as.status,
        }));

      if (!isDeliveryService && inProgressServices.length > 0) {
        const serviceList = inProgressServices
          .map((s) => `• ${s.name}: ${s.status}`)
          .join('\n');

        throw new BadRequestException(
          `Cannot start this service. ${serviceList} is in progress.`,
        );
      }

      if (appointment.hasActiveQueue) {
        throw new BadRequestException(
          `Cannot start appointment while another appointment is active for this patient.`,
        );
      }

      let targetService = appointmentServices.find(
        (as) => as.service?.id === Number(serviceId),
      );
      const shouldStartAppointment = [
        PatientStatus.PENDING,
        PatientStatus.PAUSED,
        PatientStatus.COMPLETED,
      ].includes(appointmentStatus);
      const shouldStartVisit =
        Boolean(visitId) && visitStatus !== VisitStatus.IN_PROGRESS;

      const mutationRows = await this.appointmentRepository.manager.query(
        `
        WITH updated_queue AS (
          UPDATE patient_queues
          SET status = $1::patient_queues_status_enum,
              updated_at = CURRENT_TIMESTAMP
          WHERE $2::boolean
            AND id = $3
          RETURNING id, status::text AS status
        ),
        inserted_queue AS (
          INSERT INTO patient_queues (
            appointment_id,
            patient_id,
            doctor_id,
            status,
            created_at,
            updated_at
          )
          SELECT
            $4,
            $5,
            $6,
            $1::patient_queues_status_enum,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          WHERE $2::boolean
            AND $3::int IS NULL
          RETURNING id, status::text AS status
        ),
        updated_appointment AS (
          UPDATE appointments
          SET status = $16::appointments_status_enum,
              updated_at = CURRENT_TIMESTAMP
          WHERE $2::boolean
            AND id = $4
          RETURNING status::text AS status
        ),
        updated_visit AS (
          UPDATE visits
          SET status = $7::visits_status_enum,
              updated_at = CURRENT_TIMESTAMP
          WHERE $8::boolean
            AND id = $9
          RETURNING status::text AS status
        ),
        updated_service AS (
          UPDATE appointment_services
          SET status = $17::appointment_services_status_enum,
              updated_at = CURRENT_TIMESTAMP
          WHERE $10::int IS NOT NULL
            AND id = $10
          RETURNING id, status::text AS status
        ),
        inserted_service AS (
          INSERT INTO appointment_services (
            appointment_id,
            patient_id,
            service_id,
            status,
            created_by,
            created_at,
            updated_at
          )
          SELECT
            $4,
            $5,
            $11,
            $17::appointment_services_status_enum,
            $6,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          WHERE $10::int IS NULL
          RETURNING id, status::text AS status
        )
        SELECT
          COALESCE(
            (SELECT id FROM updated_queue),
            (SELECT id FROM inserted_queue),
            $3::int
          ) AS "patientQueueId",
          COALESCE(
            (SELECT status FROM updated_queue),
            (SELECT status FROM inserted_queue),
            $12::text
          ) AS "patientQueueStatus",
          COALESCE(
            (SELECT status FROM updated_appointment),
            $13::text
          ) AS "appointmentStatus",
          COALESCE(
            (SELECT status FROM updated_visit),
            $14::text
          ) AS "visitStatus",
          COALESCE(
            (SELECT id FROM updated_service),
            (SELECT id FROM inserted_service),
            $10::int
          ) AS "appointmentServiceId",
          COALESCE(
            (SELECT status FROM updated_service),
            (SELECT status FROM inserted_service),
            $15::text
          ) AS "appointmentServiceStatus"
        `,
        [
          PatientStatus.IN_PROGRESS,
          shouldStartAppointment,
          patientQueueId,
          appointmentId,
          patientId,
          currentUserId,
          VisitStatus.IN_PROGRESS,
          shouldStartVisit,
          visitId,
          targetService?.id ?? null,
          serviceId,
          patientQueueStatus,
          appointmentStatus,
          visitStatus,
          targetService?.status ?? null,
          PatientStatus.IN_PROGRESS,
          PatientStatus.IN_PROGRESS,
        ],
      );
      const mutation = mutationRows[0];

      if (!targetService) {
        targetService = {
          id: Number(mutation.appointmentServiceId),
          status: mutation.appointmentServiceStatus as PatientStatus,
          service: {
            id: Number(appointment.requestedServiceId),
            name: appointment.requestedServiceName,
          },
        };
        appointmentServices.push(targetService);
      } else {
        targetService.status = mutation.appointmentServiceStatus as PatientStatus;
      }

      const updatedAppointment = {
        id: appointmentId,
        token_number: appointment.tokenNumber,
        status: mutation.appointmentStatus as PatientStatus,
        patient: { id: patientId },
        visit: visitId
          ? {
              id: visitId,
              status: mutation.visitStatus as VisitStatus,
            }
          : null,
        patientQueue: mutation.patientQueueId
          ? {
              id: Number(mutation.patientQueueId),
              status: mutation.patientQueueStatus as PatientStatus,
            }
          : null,
        appointmentServices,
      };

      return successResponse(
        updatedAppointment,
        'Patient appointment service started successfully',
        200,
      );
    } catch (error) {
      console.error('Error starting appointment:', error);
      this.logger.error(ApiResponseMessages.APP_STRT_ERROR, error.stack)
      throw ExceptionUtility.generateException(error, ApiResponseMessages.APP_STRT_ERROR)
    }
  }

  async pauseAppointmentService(
    currentUserId: number,
    appointmentId: number,
    serviceId: number,
  ) {
    try {
      const appointmentRows = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .innerJoin('appointment.patient', 'patient')
        .innerJoin('appointment.doctor', 'doctor')
        .leftJoin('appointment.visit', 'visit')
        .leftJoin('appointment.patientQueue', 'patientQueue')
        .leftJoin('appointment.appointmentServices', 'appointmentService')
        .leftJoin('appointmentService.service', 'service')
        .select([
          'appointment.id AS "appointmentId"',
          'appointment.token_number AS "tokenNumber"',
          'appointment.status AS "appointmentStatus"',
          'patient.id AS "patientId"',
          'visit.id AS "visitId"',
          'patientQueue.id AS "patientQueueId"',
          'patientQueue.status AS "patientQueueStatus"',
          'appointmentService.id AS "appointmentServiceId"',
          'appointmentService.status AS "appointmentServiceStatus"',
          'service.id AS "serviceId"',
          'service.name AS "serviceName"',
        ])
        .where('appointment.id = :appointmentId', { appointmentId })
        .andWhere('doctor.id = :currentUserId', { currentUserId })
        .getRawMany();

      if (!appointmentRows.length) {
        throw new NotFoundException(
          `Appointment not found for the id: ${appointmentId}`,
        );
      }

      const appointment = appointmentRows[0];
      const patientId = Number(appointment.patientId);
      const patientQueueId = appointment.patientQueueId
        ? Number(appointment.patientQueueId)
        : null;
      const targetService = appointmentRows.find(
        (row) => Number(row.serviceId) === Number(serviceId),
      );

      const checkPaused = await this.patientQueueRepository.exists({
        where: {
          patient: { id: patientId },
          status: PatientStatus.PAUSED,
        },
      });

      if (checkPaused) {
        throw new BadRequestException(
          `Cannot pause appointment as it is already paused in the queue of another doctor.`,
        );
      }

      if (!targetService) {
        throw new NotFoundException(ApiResponseMessages.APP_SERVICE_NOT_FOUND_FOR_APPOINTMENT);
      }

      if (
        targetService.appointmentServiceStatus !== PatientStatus.IN_PROGRESS
      ) {
        throw new BadRequestException(
          `Cannot pause service when status is ${targetService.appointmentServiceStatus}`,
        );
      }

      await this.appointmentServiceRepository.update(
        { id: Number(targetService.appointmentServiceId) },
        { status: PatientStatus.PAUSED },
      );

      const anyOtherInProgress = appointmentRows.some(
        (row) =>
          Number(row.appointmentServiceId) !==
            Number(targetService.appointmentServiceId) &&
          row.appointmentServiceStatus === PatientStatus.IN_PROGRESS,
      );

      if (!anyOtherInProgress) {
        if (appointment.appointmentStatus === PatientStatus.IN_PROGRESS) {
          await this.appointmentRepository.update(
            { id: appointmentId },
            { status: PatientStatus.PAUSED },
          );
        }

        if (patientQueueId) {
          await this.patientQueueRepository.update(
            { id: patientQueueId },
            { status: PatientStatus.PAUSED },
          );
        }
      }

      const updatedAppointmentServices = appointmentRows.map((row) => ({
        id: Number(row.appointmentServiceId),
        status:
          Number(row.appointmentServiceId) ===
          Number(targetService.appointmentServiceId)
            ? PatientStatus.PAUSED
            : row.appointmentServiceStatus,
        service: row.serviceId
          ? {
              id: Number(row.serviceId),
              name: row.serviceName,
            }
          : null,
      }));

      const updatedAppointment = {
        id: appointmentId,
        token_number: appointment.tokenNumber,
        status:
          !anyOtherInProgress &&
          appointment.appointmentStatus === PatientStatus.IN_PROGRESS
            ? PatientStatus.PAUSED
            : appointment.appointmentStatus,
        patient: { id: patientId },
        visit: appointment.visitId ? { id: Number(appointment.visitId) } : null,
        patientQueue: patientQueueId
          ? {
              id: patientQueueId,
              status: !anyOtherInProgress
                ? PatientStatus.PAUSED
                : appointment.patientQueueStatus,
            }
          : null,
        appointmentServices: updatedAppointmentServices,
      };

      return successResponse(
        updatedAppointment,
        'Patient appointment service paused successfully',
        200,
      );
    } catch (error) {
      console.error('Error pausing appointment service:', error);
      this.logger.error(ApiResponseMessages.APP_PSE_ERROR, error.stack);
      throw ExceptionUtility.generateException(error, ApiResponseMessages.APP_PSE_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id },
        relations: [
          'patient',
          'doctor',
          'visit',
          'vitalAssessment',
          'appointmentDoctors',
          'appointmentDoctors.doctor',
        ],
      });

      if (!appointment) {
        return errorResponse(
          'Appointment not found',
          404,
          'Appointment Not Found',
        );
      }

      return successResponse(
        appointment,
        'Appointment details retrieved successfully',
        200,
      );
    } catch (error) {
      console.error('Error finding appointment:', error);
      return errorResponse(
        'Failed to find appointment',
        500,
        error.message ?? error,
      );
    }
  }

  async findAppointmentServicesByFacility(
    facilityId: number,
    filters: SearchServicePatientDto,
  ) {
    try {
      if (!facilityId) {
        throw new BadRequestException('facilityId is required');
      }

      const qb = this.appointmentServiceRepository
        .createQueryBuilder('appointmentService')
        .leftJoinAndSelect('appointmentService.service', 'service')
        .leftJoinAndSelect('appointmentService.patient', 'patient')
        .leftJoinAndSelect('appointmentService.appointment', 'appointment')
        .leftJoinAndSelect('appointment.patient', 'appointmentPatient')
        .leftJoinAndSelect('appointment.doctor', 'appointmentDoctor')
        .leftJoinAndSelect('appointmentDoctor.role', 'appointmentDoctorRole')
        .leftJoinAndSelect('appointment.facility', 'facility')
        .leftJoinAndSelect(
          'appointment.appointmentDoctors',
          'appointmentDoctors',
        )
        .andWhere('appointmentService.status IN (:...status)', {
          status: [
            PatientStatus.PENDING,
            PatientStatus.IN_PROGRESS,
            PatientStatus.PAUSED,
          ],
        })
        .andWhere('facility.id = :facilityId', { facilityId });

      if (filters?.first_name) {
        qb.andWhere('appointmentDoctor.first_name ILIKE :first_name', {
          first_name: `%${filters.first_name}%`,
        });
      }

      if (filters?.last_name) {
        qb.andWhere('appointmentDoctor.last_name ILIKE :last_name', {
          last_name: `%${filters.last_name}%`,
        });
      }

      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 10;
      const skip = (page - 1) * limit;

      qb.orderBy('appointmentService.id', 'DESC').skip(skip).take(limit);

      const [appointmentServices, total] = await qb.getManyAndCount();
      const message =
        total === 0 ? 'No Patient Found' : 'Patients fetched successfully';

      return successResponse(
        appointmentServices,
        message,
        200,
        page,
        limit,
        total,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch appointment services by facility',
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch appointment services by facility',
      );
    }
  }
}
