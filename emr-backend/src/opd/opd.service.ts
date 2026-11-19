import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { CreateOpdDto } from './dto/create-opd.dto';
import { PatientStatus, ServiceType } from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpdDiagnosis } from './entities/opd-diagnosis.entity';
import { OpdMedicalHistory } from './entities/opd-medical-history.entity';
import { OpdVitalAssesment } from './entities/opd-vital-assessment.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Diagnosis } from 'src/diagnosis-prescriptions/entities/diagnosis.entity';
import { UpdateOpdDto } from './dto/update-opd.dto';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { TIME_DIFF } from 'src/common/app.constants';
import { successResponse } from 'src/common/utils/response.util';
import { User } from 'src/users/entities/user.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';

@Injectable()
export class OpdService {
  private readonly logger: Logger = new Logger(OpdService.name);

  constructor(
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepo: Repository<AppointmentService>,
    @InjectRepository(OpdVitalAssesment)
    private readonly opdVitalAssessmentRepository: Repository<OpdVitalAssesment>,
    @InjectRepository(Diagnosis)
    private readonly diagnosisRepository: Repository<Diagnosis>,
    @InjectRepository(OpdDiagnosis)
    private readonly opdDiagnosisRepository: Repository<OpdDiagnosis>,
    @InjectRepository(OpdMedicalHistory)
    private readonly opdMedicalHistoryRepository: Repository<OpdMedicalHistory>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(OtherPrescription)
    private readonly otherPrescriptionRepository: Repository<OtherPrescription>,
    private readonly serviceUtility: ServiceUtility,
  ) { }

  async create(data: CreateOpdDto, request: Request): Promise<AppointmentService> {
    const userId = ((request as any).user as any)?.sub;

    try {
      const appointment = await this.serviceUtility.validateAppointment(data.appointment_id);

      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId
      );

      const service = await this.serviceUtility.getServiceByType(ServiceType.OPD);

      const appointmentService = await this.serviceUtility.validateAndGetAppointmentService(
        appointment.id,
        service.id
      );

      await this.serviceUtility.checkAppointmentServiceStatus(
        appointmentService,
        PatientStatus.IN_PROGRESS
      );

      const saved = await this.appointmentServiceRepo.manager.transaction(async (em) => {
        const operatingUser = new User();
        operatingUser.id = userId;
        const managedAppointmentService = await em.findOne(AppointmentService, {
          where: { id: appointmentService.id },
          relations: [
            'diagnosis',
            'prescriptions'
          ]
        });

        if (!managedAppointmentService) {
          throw new NotFoundException(`AppointmentService ${appointmentService.id} not found`);
        }

        if (data.diagnosis) {
          const diagnosis = this.opdDiagnosisRepository.create({
            ...data.diagnosis,
            appointmentService: managedAppointmentService,
          });
          managedAppointmentService.opdDiagnosis = diagnosis;
        }

        if (data.medicalHistory) {
          const history = this.opdMedicalHistoryRepository.create({
            ...data.medicalHistory,
            appointmentService: managedAppointmentService,
          });
          managedAppointmentService.opdMedicalHistory = history;
        }

        if (data.prescriptions?.length) {
          const records = data.prescriptions.map((p) =>
            this.prescriptionRepository.create({
              ...this.serviceUtility.mapPrescriptionMedicines(p),
              appointmentService: managedAppointmentService,
              visit: appointment.visit,
              createdBy: operatingUser,
            }),
          );
          managedAppointmentService.prescriptions = records;
        }

        if (data.otherPrescriptions?.length) {
          const records = data.otherPrescriptions.map((p) =>
            this.otherPrescriptionRepository.create({
              ...p,
              appointmentService: managedAppointmentService,
              visit: appointment.visit,
              createdBy: operatingUser,
            }),
          );
          managedAppointmentService.otherPrescriptions = records;
        }

        if (data.vitals) {
          const vitals = this.opdVitalAssessmentRepository.create({
            ...data.vitals,
            appointmentService: managedAppointmentService,
          });
          managedAppointmentService.opdVitals = vitals;
        }

        if (data.generalDiagnosis) {
          const diagnosisData =
            data.generalDiagnosis?.labTestsPrescribed !== undefined
              ? {
                ...data.generalDiagnosis,
                labTestsPrescribed: data.generalDiagnosis.labTestsPrescribed,
              }
              : data.generalDiagnosis;
          const diagnosisRecord = this.diagnosisRepository.create({
            ...diagnosisData,
            appointmentService: managedAppointmentService,
          });
          diagnosisRecord.labTestsPrescribed = data.generalDiagnosis.labTestsPrescribed;
          managedAppointmentService.diagnosis = diagnosisRecord;
        }

        appointment.status = PatientStatus.COMPLETED;
        managedAppointmentService.status = PatientStatus.COMPLETED;

        await Promise.all([
          em.save(appointment),
          em.save(managedAppointmentService),
        ]);

        return managedAppointmentService;
      });

      return saved;
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.OPD_CREATION_FAILED,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.OPD_CREATION_FAILED
      );
    }
  }

  async getAllOpdByPatientId(patientId: number): Promise<AppointmentService[]> {
    try {
      const records = await this.appointmentServiceRepo
        .createQueryBuilder('appointmentService')
        .leftJoinAndSelect('appointmentService.appointment', 'appointment')
        .leftJoinAndSelect('appointment.patient', 'patient')
        .leftJoinAndSelect('appointmentService.opdDiagnosis', 'opdDiagnosis')
        .leftJoinAndSelect('appointmentService.opdMedicalHistory', 'medicalHistory')
        .leftJoinAndSelect('appointmentService.diagnosis', 'diagnosis')
        .leftJoinAndSelect('appointmentService.prescriptions', 'prescriptions')
        .leftJoinAndSelect('appointmentService.otherPrescriptions', 'otherPrescriptions')
        .leftJoinAndSelect('prescriptions.medicineVariant', 'medicineVariant')
        .leftJoinAndSelect('medicineVariant.medicine', 'medicine')
        .leftJoinAndSelect('appointmentService.opdVitals', 'vitals')
        .where('patient.id = :patientId', { patientId })
        .orderBy('appointmentService.createdAt', 'DESC')
        .getMany();

      if (!records || records.length === 0) {
        throw new NotFoundException(
          `No OPD records found for patient id ${patientId}`,
        );
      }

      return records;
    } catch (error) {
      this.logger.error(ApiResponseMessages.OPD_FETCH_FAILED)
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.OPD_FETCH_FAILED,
      );
    }
  }

  async update(
    appointmentServiceId: number,
    updateOpdDto: UpdateOpdDto,
    request: Request
  ) {
    try {
      const userId = ((request as any).user as any)?.sub;

      const opd = await this.appointmentServiceRepo.findOne({
        where: { id: appointmentServiceId },
        relations: [
          'opdDiagnosis',
          'opdMedicalHistory',
          'opdVitals',
          'diagnosis',
          'service',
          'appointment',
          'appointment.patient',
          'otherPrescriptions',
          'prescriptions',
        ],
      });

      if (!opd) {
        throw new NotFoundException(
          `OPD with ID ${appointmentServiceId} not found`,
        );
      }

      // Validate patient access
      await this.serviceUtility.validatePatientAccess(
        opd.appointment?.id,
        opd.appointment?.patient?.id,
        userId,
      );

      // Ensure correct service type
      const service = await this.serviceUtility.getServiceByType(
        ServiceType.OPD,
      );
      opd.service = service;

      // ES-805: Remove 12 hour edit limit
      // Check 2-week time constraint
      // const timeDiff = ExceptionUtility.timeDifferenceInHoursFromCreation(
      //   opd.createdAt,
      // );
      //
      // if (timeDiff >= TIME_DIFF) {
      //   throw new ConflictException(ApiSuccessResponseMessages.EDIT_W_HOURS);
      // }

      const {
        diagnosis,
        medicalHistory,
        vitals,
        generalDiagnosis,
        ...rest
      } = updateOpdDto;

      if (diagnosis !== undefined) {
        opd.opdDiagnosis = await this.serviceUtility.handleRequiredNestedUpdate(
          opd.opdDiagnosis,
          diagnosis,
          this.opdDiagnosisRepository,
          'OPD Diagnosis',
        );
      }

      if (medicalHistory !== undefined) {
        opd.opdMedicalHistory = await this.serviceUtility.handleRequiredNestedUpdate(
          opd.opdMedicalHistory,
          medicalHistory,
          this.opdMedicalHistoryRepository,
          'OPD Medical History',
        );
      }

      if (generalDiagnosis !== undefined) {
        opd.diagnosis = await this.serviceUtility.handleRequiredNestedUpdate(
          opd.diagnosis,
          generalDiagnosis,
          this.diagnosisRepository,
          'Diagnosis',
        );
      }

      if (vitals !== undefined) {
        opd.opdVitals = await this.serviceUtility.handleRequiredNestedUpdate(
          opd.opdVitals,
          vitals,
          this.opdVitalAssessmentRepository,
          'OPD Vitals',
        );
      }

      const mapped = this.serviceUtility.mapDtoToEntityData(rest);
      Object.assign(opd, mapped);

      const updated = await this.appointmentServiceRepo.save(opd);

      return successResponse(
        updated,
        ApiSuccessResponseMessages.OPD_U_MESSAGE,
        200,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.OPD_UPDATE_FAILED,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.OPD_UPDATE_FAILED,
      );
    }
  }
}
