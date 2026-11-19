import { Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from 'src/visit/entities/visit.entity';
import { PncBreastfeeding } from './entities/pnc-breastfeeding.entity';
import { PncFamilyPlanning } from './entities/pnc-family-planning.entity';
import { PncNutrition } from './entities/pnc-nutrition.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { CreatePncDto } from './dto/create-pnc.dto';
import { UpdatePncDto } from './dto/update-pnc.dto';
import { PatientStatus, ServiceType } from 'src/common/enums/enums';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { successResponse } from 'src/common/utils/response.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { PncVitalAssesment } from './entities/pnc-vital-assesment.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { CreateImmunisationDto } from 'src/immunisation/dto/create-immunisation.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PncMutateResponseDto } from './dto/pnc-mutate-response.dto';
import { PncVisitResponseDto } from './dto/pnc-visit-response.dto';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';

@Injectable()
export class PncService {
  private readonly logger = new Logger(PncService.name);

  constructor(
    @InjectRepository(Visit)
    private readonly pncRepository: Repository<Visit>,
    @InjectRepository(PncBreastfeeding)
    private readonly breastfeedingRepository: Repository<PncBreastfeeding>,
    @InjectRepository(PncFamilyPlanning)
    private readonly familyPlanningRepository: Repository<PncFamilyPlanning>,
    @InjectRepository(PncNutrition)
    private readonly nutritionRepository: Repository<PncNutrition>,
    @InjectRepository(PncVitalAssesment)
    private readonly pncVitalAssessmentRepository: Repository<PncVitalAssesment>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
    private readonly serviceUtility: ServiceUtility,
  ) {}

  async create(
    data: CreatePncDto,
    user: AuthenticatedUser,
  ): Promise<PncMutateResponseDto> {
    try {
      const appointment: Pick<
        Appointment,
        'id' | 'status' | 'patient_id' | 'visit_id'
      > & {
        patient: Pick<Patient, 'id' | 'dob' | 'gender' | 'immunisation_number'>;
      } = await this.serviceUtility.validateAndGetAppointment(
        data.appointment_id,
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
        user.sub,
      );

      const service = await this.serviceUtility.getServiceByType(
        ServiceType.PNC,
      );

      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          service.id,
        );

      // Safe: validateAndGetAppointment throws if visit_id is null
      const visitId = appointment.visit_id!;

      await this.pncRepository.manager.transaction(
        async (em) => {
        //  Get ALL repositories from the SAME entity manager
        const appointmentServiceRepo = em.getRepository(AppointmentService);
        const breastfeedingRepo = em.getRepository(PncBreastfeeding);
        const nutritionRepo = em.getRepository(PncNutrition);
        const familyPlanningRepo = em.getRepository(PncFamilyPlanning);
        const vitalAssessmentRepo = em.getRepository(PncVitalAssesment);
        const otherPrescriptionRepo = em.getRepository(OtherPrescription);

        //  Get the appointment service WITHIN transaction
        const managed = await appointmentServiceRepo.findOne({
          loadEagerRelations: false,
          where: { id: appointmentService.id },
          relations: ['service'],
        });

        if (!managed) {
          throw new NotFoundException(
            `AppointmentService ${appointmentService.id} not found`,
          );
        }

        //  Create entities USING transaction repositories
        // Breastfeeding
        if (data.breastfeeding) {
          managed.pncBreastfeeding = breastfeedingRepo.create({
            ...data.breastfeeding,
            appointmentService: managed, // Assign entity
          });
        }

        // Immunisation
        if (data.immunisation) {
          const immunisationPayload: CreateImmunisationDto = {
            ...data.immunisation,
            appointmentId: data.appointment_id,
            service_id: service.id,
          };
          await this.serviceUtility.saveImmunisation(
            immunisationPayload,
            user,
            em,
          );

          const immunisationRecord = await em.findOne(Immunisation, {
            where: {
              appointmentService: { id: managed.id },
            },
            relations: ['doses'],
          });
          if (immunisationRecord) {
            managed.immunisations = [immunisationRecord];
          }
        }

        // Nutrition
        if (data.nutrition) {
          managed.pncNutrition = nutritionRepo.create({
            ...data.nutrition,
            appointmentService: managed,
          });
        }

        // Family Planning
        if (data.familyPlanning) {
          managed.pncFamilyPlanning = familyPlanningRepo.create({
            ...data.familyPlanning,
            appointmentService: managed,
          });

          if (data.familyPlanning.prescriptions || data.prescriptions) {
            data.prescriptions = [
              ...(data.prescriptions || []),
              ...(data.familyPlanning.prescriptions || []),
            ];
            await this.serviceUtility.savePrescriptionsAndDispense(
              data.prescriptions,
              managed,
              appointment,
              service,
              user,
              em,
            );
          }
        }

        // Other Prescriptions
        if (data.otherPrescriptions?.length) {
          const records = data.otherPrescriptions.map((p) =>
            otherPrescriptionRepo.create({
              ...p,
              appointmentService: managed,
              visit: { id: visitId },
              createdBy: { id: user.sub },
            }),
          );
          // Merge with existing if any
          managed.otherPrescriptions = [
            ...(managed.otherPrescriptions || []),
            ...records,
          ];
        }

        // Vital Assessment
        if (data.pncVitalAssessment) {
          const merged = { ...data.pncVitalAssessment, ...data.screening };
          managed.pncVitalAssessment = vitalAssessmentRepo.create({
            ...merged,
            appointmentService: managed,
          });
        }

        // Update statuses
        appointment.status = PatientStatus.COMPLETED;
        managed.status = PatientStatus.COMPLETED;

        //  Save ONLY ONCE at the end
        await em.save(appointment);
        await em.save(managed);
      });

      return successResponse(
        { appointmentService: { id: appointmentService.id } },
        ApiSuccessResponseMessages.PNC_U_MESSAGE,
        201,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.PNC_S_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PNC_S_ERROR,
      );
    }
  }

  async findByPatientId(
    patientId: number,
    appointmentServiceId: number,
  ): Promise<PncVisitResponseDto> {
    try {
      const pnc = await this.appointmentServiceRepository.findOne({
        loadEagerRelations: false,
        where: {
          id: appointmentServiceId,
          appointment: { patient: { id: patientId } },
          service: { name: ServiceType.PNC },
        },
        relations: {
          pncVitalAssessment: true,
          pncNutrition: true,
          pncBreastfeeding: true,
          pncFamilyPlanning: true,
          otherPrescriptions: true,
          prescriptions: {
            medicineVariant: {
              medicine: true,
            },
          },
        },
        order: { createdAt: 'DESC' },
      });

      if (!pnc)
        throw new NotFoundException(
          `No PNC visit found for patient ID ${patientId}`,
        );

      // TypeORM returns a raw entity; cast to DTO since the shape matches after selective relation loading
      return pnc as unknown as PncVisitResponseDto;
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.PNC_RECORDS_FETCH_ERROR,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PNC_RECORDS_FETCH_ERROR,
      );
    }
  }

  async update(
    id: number,
    updatePncDto: UpdatePncDto,
    user: AuthenticatedUser,
  ): Promise<PncMutateResponseDto> {
    try {
      const userId = user.sub;

      const pnc: Pick<
        AppointmentService,
        | 'id'
        | 'pncBreastfeeding'
        | 'pncFamilyPlanning'
        | 'pncNutrition'
        | 'pncVitalAssessment'
        | 'service'
      > & {
        appointment: Pick<AppointmentService['appointment'], 'id' | 'patient'>;
      } | null = await this.appointmentServiceRepository.findOne({
        loadEagerRelations: false,
        where: { id },
        relations: {
          appointment: { patient: true },
          pncBreastfeeding: true,
          pncFamilyPlanning: true,
          pncNutrition: true,
          pncVitalAssessment: true,
          service: true,
        },
      });

      if (!pnc) throw new NotFoundException(`PNC with ID ${id} not found`);

      await this.serviceUtility.validatePatientAccess(
        pnc.appointment?.id,
        pnc.appointment?.patient?.id,
        userId,
      );

      pnc.service = await this.serviceUtility.getServiceByType(ServiceType.PNC);

      // ES-805: Remove 12 hour edit limit
      // const timeDifferenceInHours =
      //   ExceptionUtility.timeDifferenceInHoursFromCreation(pnc.createdAt);

      // if (timeDifferenceInHours >= TIME_DIFF) {
      //   throw new ConflictException(ApiSuccessResponseMessages.EDIT_W_HOURS);
      // }

      const {
        breastfeeding,
        familyPlanning,
        nutrition,
        pncVitalAssessment,
        ...rest
      } = updatePncDto;

      // Breastfeeding
      if (breastfeeding !== undefined) {
        pnc.pncBreastfeeding =
          await this.serviceUtility.handleRequiredNestedUpdate(
            pnc.pncBreastfeeding,
            breastfeeding,
            this.breastfeedingRepository,
            'Breastfeeding',
          );
      }

      // PNC Family Planning
      if (familyPlanning !== undefined) {
        pnc.pncFamilyPlanning =
          await this.serviceUtility.handleRequiredNestedUpdate(
            pnc.pncFamilyPlanning,
            familyPlanning,
            this.familyPlanningRepository,
            'Family Planning',
          );
      }

      // PNC Nutrition
      if (nutrition !== undefined) {
        pnc.pncNutrition = await this.serviceUtility.handleRequiredNestedUpdate(
          pnc.pncNutrition,
          nutrition,
          this.nutritionRepository,
          'Nutrition',
        );
      }

      // Vital Assessment
      if (
        pncVitalAssessment !== undefined ||
        updatePncDto.screening !== undefined
      ) {
        const mergedAssessment = {
          ...(pncVitalAssessment || {}),
          ...(updatePncDto.screening || {}),
        };

        pnc.pncVitalAssessment =
          await this.serviceUtility.handleRequiredNestedUpdate(
            pnc.pncVitalAssessment,
            mergedAssessment,
            this.pncVitalAssessmentRepository,
            'Vital assessment',
          );
      }

      Object.assign(pnc, this.serviceUtility.mapDtoToEntityData(rest));
      await this.appointmentServiceRepository.save(pnc);

      return successResponse(
        { appointmentService: { id: pnc.id } },
        ApiSuccessResponseMessages.PNC_U_MESSAGE,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.FL_UP_PNC_V, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FL_UP_PNC_V,
      );
    }
  }
}
