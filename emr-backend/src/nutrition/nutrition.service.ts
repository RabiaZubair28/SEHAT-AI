import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { NutritionServiceInfo } from './entities/nutrition-service-info.entity';
import { NutritionVitalAssessment } from './entities/nutrition-vital-assessment.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Gender, PatientStatus, ServiceType } from 'src/common/enums/enums';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { isUnderFive } from 'src/common/helper';
import { CreateNutritionVitalAssessmentDto } from './dto/create-nutrition-vital-assessment.dto';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,

    private readonly serviceUtility: ServiceUtility,
  ) { }

  async create(data: CreateNutritionDto, request: Request) {
    try {
      const userId = ((request as any).user as any)?.sub;

      const appointment = await this.serviceUtility.validateAppointment(
        data.appointment_id,
      );
      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId,
      );
      const service = await this.serviceUtility.getServiceByType(
        ServiceType.NUTRITION,
      );
      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          service.id,
        );
      const existingNutrition = await this.appointmentServiceRepository.findOne({
        where: { id: appointmentService.id },
        relations: ['nutritionServiceInfo', 'nutritionVitalAssessment'],
      });
      if (existingNutrition && [PatientStatus.COMPLETED, PatientStatus.PAUSED].includes(existingNutrition.status)) {
        throw new ConflictException(
          `Nutrition record already exists for Appointment ID ${appointment.id}`,
        );
      }

      // In-progress encounters may already contain saved Nutrition measurements.
      // Preserve their IDs so saving completes the record instead of inserting duplicates.
      appointmentService.nutritionServiceInfo = existingNutrition?.nutritionServiceInfo!;
      appointmentService.nutritionVitalAssessment = existingNutrition?.nutritionVitalAssessment!;

      this.ensureMuacRequirement(appointment, data.vitalAssessment);

      const savedNutrition =
        await this.appointmentServiceRepository.manager.transaction(
          async (transactionalEntityManager) => {
            const operatingUser = new User();
            operatingUser.id = userId;
            // Create nested entities
            this.createServiceInfo(
              transactionalEntityManager,
              appointmentService,
              data.serviceInfo,
            );
            this.createVitalAssessment(
              transactionalEntityManager,
              appointmentService,
              data.vitalAssessment,
            );
            if (data.prescriptions?.length) {
              this.createPrescriptions(
                transactionalEntityManager,
                appointmentService,
                data.prescriptions,
                operatingUser,
                appointment,
              );
            }
            if (data.otherPrescriptions?.length) {
              this.createOtherPrescriptions(
                transactionalEntityManager,
                appointmentService,
                data.otherPrescriptions,
                operatingUser,
                appointment,
              );
            }

            // Mark as completed
            appointment.status = PatientStatus.COMPLETED;
            appointmentService.status = PatientStatus.COMPLETED;

            // Save all entities within transaction
            await this.saveNutritionEntities(
              transactionalEntityManager,
              appointment,
              appointmentService,
            );

            // Reload with all relations
            return await this.reloadWithRelations(
              transactionalEntityManager,
              appointmentService.id,
            );
          },
        );

      return savedNutrition;
    } catch (error) {
      this.logger.error('Nutrition creation failed', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to create nutrition record',
      );
    }
  }

  async findByPatientId(patientId: number, appointmentServiceId: number) {
    try {
      const nutrition = await this.appointmentServiceRepository.findOne({
        where: {
          id: appointmentServiceId,
          appointment: { patient: { id: patientId } },
          service: { name: ServiceType.NUTRITION },
        },
        order: { createdAt: 'DESC' },
      });

      if (!nutrition) {
        throw new NotFoundException(
          `No Nutrition visit found for patient ID ${patientId}`,
        );
      }
      return nutrition;
    } catch (error) {
      this.logger.error(ApiResponseMessages.F_FET_NUT_REC, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.F_FET_NUT_REC,
      );
    }
  }

  async update(id: number, updateDto: UpdateNutritionDto, request: Request) {
    try {
      const userId = ((request as any).user as any)?.sub;
      const nutrition = await this.appointmentServiceRepository.findOne({
        where: { id },
        relations: [
          'nutritionServiceInfo',
          'nutritionVitalAssessment',
          'prescriptions',
          'otherPrescriptions',
          'appointment',
          'appointment.patient',
        ],
      });

      if (!nutrition) {
        throw new NotFoundException(`Nutrition record with ID ${id} not found`);
      }

      await this.serviceUtility.validatePatientAccess(
        nutrition.appointment?.id,
        nutrition.appointment?.patient?.id,
        userId,
      );

      const { serviceInfo, vitalAssessment, prescriptions, ...rest } = updateDto;
      this.ensureMuacRequirement(nutrition.appointment, vitalAssessment);

      // Wrap all updates in a transaction
      await this.appointmentServiceRepository.manager.transaction(
        async (transactionalEntityManager) => {
          // Update nested entities
          await this.updateServiceInfo(
            transactionalEntityManager,
            nutrition,
            serviceInfo,
          );
          await this.updateVitalAssessment(
            transactionalEntityManager,
            nutrition,
            vitalAssessment,
          );
          // Save the main entity
          await transactionalEntityManager.save(AppointmentService, nutrition);
        },
      );

      // Reload with all relations
      const updated = await this.appointmentServiceRepository.findOne({
        where: { id: nutrition.id },
        relations: [
          'nutritionServiceInfo',
          'nutritionVitalAssessment',
          'prescriptions',
          'otherPrescriptions',
        ],
      });

      return updated;
    } catch (error) {
      this.logger.error(ApiResponseMessages.F_U_NUT_REC, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.F_U_NUT_REC,
      );
    }
  }

  private createServiceInfo(
    transactionalEntityManager: any,
    appointmentService: AppointmentService,
    serviceInfo: any,
  ): void {
    if (serviceInfo) {
      if (appointmentService.nutritionServiceInfo) {
        Object.assign(appointmentService.nutritionServiceInfo, serviceInfo);
        return;
      }
      appointmentService.nutritionServiceInfo =
        transactionalEntityManager.create(NutritionServiceInfo, {
          ...serviceInfo,
          appointmentService: appointmentService,
        });
    }
  }

  private createVitalAssessment(
    transactionalEntityManager: any,
    appointmentService: AppointmentService,
    vitalAssessment: any,
  ): void {
    if (vitalAssessment) {
      if (appointmentService.nutritionVitalAssessment) {
        Object.assign(appointmentService.nutritionVitalAssessment, vitalAssessment);
        return;
      }
      appointmentService.nutritionVitalAssessment =
        transactionalEntityManager.create(NutritionVitalAssessment, {
          ...vitalAssessment,
          appointmentService: appointmentService,
        });
    }
  }

  private ensureMuacRequirement(
    appointment: Appointment,
    vitalAssessment?: CreateNutritionVitalAssessmentDto,
  ): void {
    const patient = appointment?.patient;
    const requiresMuac =
      patient?.gender === Gender.FEMALE ||
      isUnderFive(patient?.dob?.toString());
    if (
      requiresMuac &&
      (vitalAssessment?.muac === undefined || vitalAssessment?.muac === null)
    ) {
      throw new BadRequestException(
        'MUAC is required for female patients or patients under 5 years old',
      );
    }
  }

  private createPrescriptions(
    transactionalEntityManager: any,
    appointmentService: AppointmentService,
    prescriptions: any[],
    user: User,
    appointment: Appointment,
  ): void {
    appointmentService.prescriptions = prescriptions.map((prescription) => {
      const mappedPrescription =
        this.serviceUtility.mapPrescriptionMedicines(prescription);
      return transactionalEntityManager.create(Prescription, {
        ...mappedPrescription,
        appointmentService: appointmentService,
        visit: appointment?.visit,
        createdBy: user,
      });
    });
  }

  private createOtherPrescriptions(
    transactionalEntityManager: any,
    appointmentService: AppointmentService,
    otherPrescriptions: any[],
    user: User,
    appointment: Appointment,
  ): void {
    appointmentService.otherPrescriptions = otherPrescriptions.map(
      (otherPrescription) =>
        transactionalEntityManager.create(OtherPrescription, {
          ...otherPrescription,
          appointmentService: appointmentService,
          visit: appointment?.visit,
          createdBy: user,
        }),
    );
  }

  // Saves all nutrition entities within transaction
  private async saveNutritionEntities(
    transactionalEntityManager: any,
    appointment: Appointment,
    appointmentService: AppointmentService,
  ): Promise<void> {
    await Promise.all([
      transactionalEntityManager.save(appointment),
      transactionalEntityManager.save(appointmentService),
    ]);
  }

  // Reloads appointment service with all nutrition relations
  private async reloadWithRelations(
    transactionalEntityManager: any,
    appointmentServiceId: number,
  ): Promise<AppointmentService> {
    return await transactionalEntityManager.findOne(AppointmentService, {
      where: { id: appointmentServiceId },
      relations: [
        'nutritionServiceInfo',
        'nutritionVitalAssessment',
        'prescriptions',
      ],
    });
  }

  // Updates service info (patient admission + counselling)
  private async updateServiceInfo(
    transactionalEntityManager: any,
    nutrition: AppointmentService,
    serviceInfo: any,
  ): Promise<void> {
    if (serviceInfo !== undefined) {
      if (nutrition.nutritionServiceInfo) {
        Object.assign(nutrition.nutritionServiceInfo, serviceInfo);
        await transactionalEntityManager.save(
          NutritionServiceInfo,
          nutrition.nutritionServiceInfo,
        );
      } else {
        nutrition.nutritionServiceInfo = transactionalEntityManager.create(
          NutritionServiceInfo,
          {
            ...serviceInfo,
            appointmentService: nutrition,
          },
        );
        await transactionalEntityManager.save(nutrition.nutritionServiceInfo);
      }
    }
  }

  // Updates vital assessment
  private async updateVitalAssessment(
    transactionalEntityManager: any,
    nutrition: AppointmentService,
    vitalAssessment: any,
  ): Promise<void> {
    if (vitalAssessment !== undefined) {
      if (nutrition.nutritionVitalAssessment) {
        Object.assign(nutrition.nutritionVitalAssessment, vitalAssessment);
        await transactionalEntityManager.save(
          NutritionVitalAssessment,
          nutrition.nutritionVitalAssessment,
        );
      } else {
        nutrition.nutritionVitalAssessment = transactionalEntityManager.create(
          NutritionVitalAssessment,
          {
            ...vitalAssessment,
            appointmentService: nutrition,
          },
        );
        await transactionalEntityManager.save(
          nutrition.nutritionVitalAssessment,
        );
      }
    }
  }

}

