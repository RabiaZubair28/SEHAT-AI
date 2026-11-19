import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAncDto } from './dto/create-anc.dto';
import { UpdateAncDto } from './dto/update-anc.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Visit } from 'src/visit/entities/visit.entity';
import { Ctg } from 'src/labs/entities/ctg.entity';
import { Ultrasound } from 'src/labs/entities/ultrasound.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Diagnosis } from 'src/diagnosis-prescriptions/entities/diagnosis.entity';
import { AncMedicalSurgicalHistory } from './entities/anc-medical-surgical-history.entity';
import { AncPregnancyInfo } from './entities/anc-pregnancy-info.entity';
import { PreviousPregnancy } from './entities/previous-pregnancy.entity';
import { successResponse } from 'src/common/utils/response.util';
import { AncMutateResponseDto } from './dto/anc-mutate-response.dto';
import { PatientStatus, ServiceType } from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { CreateImmunisationDto } from 'src/immunisation/dto/create-immunisation.dto';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { TIME_DIFF } from 'src/common/app.constants';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { AncVitalAssesment } from './entities/anc-vital-assesment.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AncVisitResponseDto } from './dto/anc-visit-response.dto';
import { AncDeliverySummaryDto } from './dto/anc-delivery-summary.dto';

@Injectable()
export class AncService {
  private readonly logger: Logger = new Logger(AncService.name);

  constructor(
    @InjectRepository(Visit)
    private readonly ancRepository: Repository<Visit>,
    @InjectRepository(Ctg)
    private readonly ctgRepository: Repository<Ctg>,
    @InjectRepository(Ultrasound)
    private readonly ultrasoundRepository: Repository<Ultrasound>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(Diagnosis)
    private readonly diagnosisRepository: Repository<Diagnosis>,
    @InjectRepository(AncMedicalSurgicalHistory)
    private readonly medicalSurgicalHistoryRepository: Repository<AncMedicalSurgicalHistory>,
    @InjectRepository(AncPregnancyInfo)
    private readonly pregnancyInfoRepository: Repository<AncPregnancyInfo>,
    @InjectRepository(PreviousPregnancy)
    private readonly previousPregnancyRepository: Repository<PreviousPregnancy>,
    @InjectRepository(AncVitalAssesment)
    private readonly ancVitalAssessmentRepository: Repository<AncVitalAssesment>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
    @InjectRepository(OtherPrescription)
    private readonly otherPrescriptionRepository: Repository<OtherPrescription>,
    private readonly serviceUtility: ServiceUtility,
  ) {}

  async create(
    data: CreateAncDto,
    user: AuthenticatedUser,
  ): Promise<AncMutateResponseDto> {
    try {
      const service = await this.serviceUtility.getServiceByType(
        ServiceType.ANC,
      );

      const appointment: Pick<
        Appointment,
        'id' | 'status' | 'patient_id' | 'visit_id'
      > = await this.serviceUtility.validateAndGetAppointment(
        data.appointment_id,
        {
          select: {
            id: true,
            status: true,
            patient_id: true,
            visit_id: true,
          },
        },
      );

      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          service.id,
        );

      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient_id,
        user.sub,
      );

      // Safe: validateAndGetAppointment throws if visit_id is null
      const visitId = appointment.visit_id!;

      await this.ancRepository.manager.transaction(async (em) => {
        const managed = await this.lockAppointmentService(
          em,
          appointmentService.id,
        );

        if (managed.status === PatientStatus.COMPLETED) {
          throw new ConflictException(
            'An ANC visit has already been submitted for this appointment service',
          );
        }

        await this.saveImmunisationIfProvided(
          em,
          data.immunisation,
          service.id,
          user,
          appointmentService,
        );

        this.upsertPregnancyInfo(data.pregnancyInfo, managed);
        this.upsertMedicalSurgicalHistory(data.medicalSurgicalHistory, managed);

        this.upsertVitalAssessment(
          data.ancVitalAssessment,
          data.screening,
          managed,
        );

        this.addPrescriptions(data.prescriptions, managed, visitId, user.sub);

        this.addOtherPrescriptions(
          data.otherPrescriptions,
          managed,
          visitId,
          user.sub,
        );

        this.upsertCtg(data.ctg, managed);
        this.upsertDiagnosis(data.diagnosis, managed);
        this.upsertUltrasound(data.ultrasound, managed);

        this.completeAppointment(appointment, managed);

        await em.save(appointment);
        await em.save(managed);
      });

      return successResponse(
        { appointmentService: { id: appointmentService.id } },
        ApiSuccessResponseMessages.ANC_S_MESSAGE,
        201,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.ANC_CREATION_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.ANC_CREATION_FAILED,
      );
    }
  }

  async findByPatientId(
    patientId: number,
    appointmentServiceId: number,
  ): Promise<AncVisitResponseDto> {
    try {
      const anc = await this.appointmentServiceRepository.findOne({
        loadEagerRelations: false,
        where: {
          id: appointmentServiceId,
          appointment: { patient: { id: patientId } },
          service: { name: ServiceType.ANC },
        },
        relations: [
          'pregnancyInfo',
          'pregnancyInfo.previous_pregnancies',
          'ancMedicalSurgicalHistory',
          'ancVitalAssessment',
          'diagnosis',
          'ultrasound',
          'ctg',
          'prescriptions',
          'prescriptions.medicineVariant',
          'prescriptions.medicineVariant.medicine',
          'otherPrescriptions',
        ],
        order: { createdAt: 'DESC' },
      });

      if (!anc) {
        throw new NotFoundException(
          `No ANC visit found for patient ID ${patientId}`,
        );
      }

      // Cast needed because TypeORM returns the full AppointmentService entity
      // (with extra relation metadata) while the DTO declares a narrower shape.
      // The alternative would be to create a mapper which would be verbose and achieve the same result.
      return anc as unknown as AncVisitResponseDto;
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.ANC_RECORDS_FETCH_ERROR,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.ANC_RECORDS_FETCH_ERROR,
      );
    }
  }

  async findDeliverySummaryByPatientId(
    patientId: number,
    appointmentServiceId: number,
  ): Promise<AncDeliverySummaryDto> {
    try {
      const anc = await this.appointmentServiceRepository
        .createQueryBuilder('anc')
        .leftJoin('anc.appointment', 'appointment')
        .leftJoin('appointment.patient', 'patient')
        .leftJoin('anc.service', 'service')
        .leftJoin('anc.pregnancyInfo', 'pregnancyInfo')
        .leftJoin('anc.ancVitalAssessment', 'ancVitalAssessment')
        .select([
          'anc.id',
          'pregnancyInfo.id',
          'pregnancyInfo.lmp',
          'ancVitalAssessment.id',
          'ancVitalAssessment.warning_signs',
        ])
        .where('anc.id = :appointmentServiceId', { appointmentServiceId })
        .andWhere('patient.id = :patientId', { patientId })
        .andWhere('service.name = :serviceType', {
          serviceType: ServiceType.ANC,
        })
        .orderBy('anc.createdAt', 'DESC')
        .getOne();

      if (!anc) {
        throw new NotFoundException(
          `No ANC visit found for patient ID ${patientId}`,
        );
      }

      return {
        id: anc.id,
        pregnancyInfo: anc.pregnancyInfo
          ? {
              id: anc.pregnancyInfo.id,
              lmp: anc.pregnancyInfo.lmp as unknown as string,
            }
          : null,
        ancVitalAssessment: anc.ancVitalAssessment
          ? {
              id: anc.ancVitalAssessment.id,
              warning_signs: anc.ancVitalAssessment.warning_signs,
            }
          : null,
      };
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.ANC_RECORDS_FETCH_ERROR,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.ANC_RECORDS_FETCH_ERROR,
      );
    }
  }

  private async saveImmunisationIfProvided(
    em: EntityManager,
    immunisation: CreateImmunisationDto | undefined,
    serviceId: number,
    user: AuthenticatedUser,
    appointmentService: AppointmentService,
  ): Promise<void> {
    if (!immunisation) return;

    await this.serviceUtility.saveImmunisation({...immunisation, service_id: serviceId}, user, em);

    const immunisationRecord = await em.findOne(Immunisation, {
      where: {
        appointmentService: { id: appointmentService.id },
      },
      loadEagerRelations: false,
      relations: ['patient.immunisationsDoses', 'patient.immunisationCard'],
    });

    if (immunisationRecord) {
      appointmentService.immunisations = [immunisationRecord];
    }
  }

  async update(
    id: number,
    updateAncDto: UpdateAncDto,
    user: AuthenticatedUser,
  ): Promise<AncMutateResponseDto> {
    try {
      const userId = user.sub;

      const {
        ultrasound,
        ctg,
        diagnosis,
        pregnancyInfo,
        medicalSurgicalHistory,
        ancVitalAssessment,
        screening,
      } = updateAncDto;

      await this.appointmentServiceRepository.manager.transaction(
        async (em) => {
          const locked = await this.lockAppointmentService(em, id);

          if (locked.status !== PatientStatus.COMPLETED) {
            throw new ConflictException(
              `Appointment service status must be ${PatientStatus.COMPLETED}`,
            );
          }

          const aptService = await em.findOne(AppointmentService, {
            loadEagerRelations: false,
            where: { id, service: { name: ServiceType.ANC } },
            relations: {
              service: true,
              appointment: { patient: true },
              ultrasound: true,
              ctg: true,
              diagnosis: true,
              pregnancyInfo: { previous_pregnancies: true },
              ancMedicalSurgicalHistory: true,
              ancVitalAssessment: true,
            },
          });

          if (!aptService) {
            throw new NotFoundException(`ANC with ID ${id} not found`);
          }

          const { appointment, createdAt } = aptService;

          await this.serviceUtility.validatePatientAccess(
            appointment.id,
            appointment.patient.id,
            userId,
          );

          // ES-805: Remove 12 hour edit limit
          // const timeDifferenceInHours =
          //   ExceptionUtility.timeDifferenceInHoursFromCreation(createdAt);

          // if (timeDifferenceInHours >= TIME_DIFF) {
          //   throw new ConflictException(
          //     ApiSuccessResponseMessages.EDIT_W_HOURS,
          //   );
          // }

          this.upsertPregnancyInfo(pregnancyInfo, aptService);
          this.upsertMedicalSurgicalHistory(medicalSurgicalHistory, aptService);
          this.upsertVitalAssessment(ancVitalAssessment, screening, aptService);
          this.upsertCtg(ctg, aptService);
          this.upsertDiagnosis(diagnosis, aptService);
          this.upsertUltrasound(ultrasound, aptService);

          await em.save(AppointmentService, aptService);
        },
      );

      return successResponse(
        { appointmentService: { id } },
        ApiSuccessResponseMessages.ANC_U_MESSAGE,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.FL_UP_ANC_V, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FL_UP_ANC_V,
      );
    }
  }

  private async lockAppointmentService(
    em: EntityManager,
    appointmentServiceId: number,
  ): Promise<AppointmentService> {
    const appointmentService = await em.findOne(AppointmentService, {
      where: { id: appointmentServiceId },
      loadEagerRelations: false,
      lock: { mode: 'pessimistic_write' },
    });

    if (!appointmentService) {
      throw new NotFoundException(
        `AppointmentService ${appointmentServiceId} not found`,
      );
    }

    return appointmentService;
  }

  private upsertPregnancyInfo(
    pregnancyInfo:
      CreateAncDto['pregnancyInfo'] | UpdateAncDto['pregnancyInfo'],
    appointmentService: AppointmentService,
  ): void {
    if (!pregnancyInfo) return;

    const { previous_pregnancy, ...pregnancyData } = pregnancyInfo;

    if (appointmentService.pregnancyInfo) {
      this.pregnancyInfoRepository.merge(
        appointmentService.pregnancyInfo,
        pregnancyData,
      );
    } else {
      appointmentService.pregnancyInfo = this.pregnancyInfoRepository.create({
        ...pregnancyData,
        appointmentService: { id: appointmentService.id },
      });
    }

    // Incoming rows carry no ids, so there is nothing to match the existing rows against.
    // Hence, replace the whole collection.
    if (previous_pregnancy) {
      appointmentService.pregnancyInfo.previous_pregnancies =
        previous_pregnancy.map((item) =>
          this.previousPregnancyRepository.create(item),
        );
    }
  }

  private upsertMedicalSurgicalHistory(
    history: CreateAncDto['medicalSurgicalHistory'],
    appointmentService: AppointmentService,
  ): void {
    if (!history) return;

    if (appointmentService.ancMedicalSurgicalHistory) {
      this.medicalSurgicalHistoryRepository.merge(
        appointmentService.ancMedicalSurgicalHistory,
        history,
      );
    } else {
      appointmentService.ancMedicalSurgicalHistory =
        this.medicalSurgicalHistoryRepository.create({
          ...history,
          appointmentService: { id: appointmentService.id },
        });
    }
  }

  private upsertVitalAssessment(
    vitalAssessment: CreateAncDto['ancVitalAssessment'] | undefined,
    screening: CreateAncDto['screening'],
    appointmentService: AppointmentService,
  ): void {
    if (!vitalAssessment && !screening) return;

    const assessment = { ...vitalAssessment, ...screening };

    if (appointmentService.ancVitalAssessment) {
      this.ancVitalAssessmentRepository.merge(
        appointmentService.ancVitalAssessment,
        assessment,
      );
    } else {
      appointmentService.ancVitalAssessment =
        this.ancVitalAssessmentRepository.create({
          ...assessment,
          appointmentService: { id: appointmentService.id },
        });
    }
  }

  private addPrescriptions(
    prescriptions: CreateAncDto['prescriptions'] | undefined,
    appointmentService: AppointmentService,
    visitId: number,
    userId: number,
  ): void {
    if (!prescriptions?.length) return;

    const createdBy = { id: userId };

    appointmentService.prescriptions = prescriptions.map((prescription) =>
      this.prescriptionRepository.create({
        ...this.serviceUtility.mapPrescriptionMedicines(prescription),
        appointmentService,
        visit: { id: visitId },
        createdBy,
      }),
    );
  }

  private addOtherPrescriptions(
    prescriptions: CreateAncDto['otherPrescriptions'] | undefined,
    appointmentService: AppointmentService,
    visitId: number,
    userId: number,
  ): void {
    if (!prescriptions?.length) return;

    const createdBy = { id: userId };

    appointmentService.otherPrescriptions = prescriptions.map((prescription) =>
      this.otherPrescriptionRepository.create({
        ...prescription,
        appointmentService,
        visit: { id: visitId },
        createdBy,
      }),
    );
  }

  private upsertCtg(
    ctg: CreateAncDto['ctg'],
    appointmentService: AppointmentService,
  ): void {
    if (!ctg) return;

    if (appointmentService.ctg) {
      this.ctgRepository.merge(appointmentService.ctg, ctg);
    } else {
      appointmentService.ctg = this.ctgRepository.create({
        ...ctg,
        appointmentService: { id: appointmentService.id },
      });
    }
  }

  private upsertDiagnosis(
    diagnosis: CreateAncDto['diagnosis'],
    appointmentService: AppointmentService,
  ): void {
    if (!diagnosis) return;

    const { labTests, ...diagnosisData } = diagnosis;
    const data = { ...diagnosisData, labTestsPrescribed: labTests };

    if (appointmentService.diagnosis) {
      this.diagnosisRepository.merge(appointmentService.diagnosis, data);
    } else {
      appointmentService.diagnosis = this.diagnosisRepository.create({
        ...data,
        appointmentService: { id: appointmentService.id },
      });
    }
  }

  private upsertUltrasound(
    ultrasound: CreateAncDto['ultrasound'],
    appointmentService: AppointmentService,
  ): void {
    if (!ultrasound) return;

    if (appointmentService.ultrasound) {
      this.ultrasoundRepository.merge(
        appointmentService.ultrasound,
        ultrasound,
      );
    } else {
      appointmentService.ultrasound = this.ultrasoundRepository.create({
        ...ultrasound,
        appointmentService: { id: appointmentService.id },
      });
    }
  }

  private completeAppointment(
    appointment: Pick<Appointment, 'status'>,
    appointmentService: Pick<AppointmentService, 'status'>,
  ): void {
    appointment.status = PatientStatus.COMPLETED;
    appointmentService.status = PatientStatus.COMPLETED;
  }
}
