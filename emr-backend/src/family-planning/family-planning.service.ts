import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FamilyPlanning } from './entities/family-planning.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateFamilyPlanningDto,
  UpdateFamilyPlanningDto,
} from './dto/create-family-planning.dto';
import {
  MaritalStatus,
  PatientStatus,
  ServiceType,
} from 'src/common/enums/enums';
import { User } from 'src/users/entities/user.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { successResponse } from 'src/common/utils/response.util';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class FamilyPlanningService {
  private readonly logger: Logger = new Logger(FamilyPlanningService.name);

  constructor(
    @InjectRepository(FamilyPlanning)
    private readonly familyPlanningRepo: Repository<FamilyPlanning>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
    private readonly serviceUtility: ServiceUtility,
  ) { }

  public async create(
    data: CreateFamilyPlanningDto,
    user: AuthenticatedUser,
  ): Promise<FamilyPlanning> {
    try {
      const userId = user.sub
      const appointment = await this.serviceUtility.validateAppointment(
        data.appointment_id,
      );

      if (
        appointment.patient?.additionalInfo?.marital_status ===
        MaritalStatus.MARRIED &&
        (data.years_of_marriage === null ||
          data.years_of_marriage === 0 ||
          !data.years_of_marriage)
      ) {
        throw new BadRequestException(ApiResponseMessages.YEARS_REQ_MARRIED_PT);
      }

      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId,
      );

      const service = await this.serviceUtility.getServiceByType(
        ServiceType.FAMILY_PLANNING,
      );

      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          service.id,
        );
      const familyPlanning = await this.familyPlanningRepo.manager.transaction(
        async (transactionalEntityManager) => {
          const operatingUser = new User();
          operatingUser.id = userId;

          const managedAppointmentService = await transactionalEntityManager.findOne(
            AppointmentService,
            {
              where: { id: appointmentService.id },
            },
          );
          if (!managedAppointmentService)
            throw new NotFoundException(
              `AppointmentService ${appointmentService.id} not found`,
            );

          const familyPlanning = this.familyPlanningRepo.create({
            ...data,
            appointmentService: managedAppointmentService,
            createdBy: operatingUser,
          });
          managedAppointmentService.familyPlanning = familyPlanning;

          // save prescription and dispense contraceptive medicines
          await this.serviceUtility.savePrescriptionsAndDispense(
            data.prescriptions,
            managedAppointmentService,
            appointment,
            service,
            user,
            transactionalEntityManager,
          );

          appointment.status = PatientStatus.COMPLETED;

          managedAppointmentService.status = PatientStatus.COMPLETED;

          await Promise.all([
            transactionalEntityManager.save(appointment),
            transactionalEntityManager.save(managedAppointmentService),
          ]);

          return successResponse(
            managedAppointmentService,
            ApiSuccessResponseMessages.FP_S_MESSAGE,
            201,
          );
        },
      );

      return familyPlanning;
    } catch (error) {
      this.logger.error(ApiResponseMessages.FP_ADD_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FP_ADD_ERROR,
      );
    }
  }

  public async update(
    id: number,
    data: UpdateFamilyPlanningDto,
    request: Request,
  ): Promise<FamilyPlanning> {
    try {
      const userId = Number(((request as any).user as any)?.sub);

      let familyPlanning = await this.familyPlanningRepo.findOne({
        where: { appointmentService: { id: id } },
        relations: ['appointmentService', 'appointmentService.appointment'],
      });

      if (!familyPlanning) {
        throw new BadRequestException(ApiResponseMessages.INVALID_FP_RECORD);
      }

      const appointment = await this.serviceUtility.validateAppointment(
        data.appointment_id,
      );

      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId,
      );

      const service = await this.serviceUtility.getServiceByType(
        ServiceType.FAMILY_PLANNING,
      );

      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          service.id,
        );

      await this.serviceUtility.checkAppointmentServiceStatus(
        appointmentService,
        PatientStatus.COMPLETED,
      );

      familyPlanning = Object.assign(familyPlanning, data);

      await this.familyPlanningRepo.manager.transaction(
        async (transactionalEntityManager) => {
          const operatingUser = new User();
          operatingUser.id = userId;

          familyPlanning.updatedBy = operatingUser;
          familyPlanning.updatedAt = new Date();

          appointment.status = PatientStatus.COMPLETED;
          appointmentService.status = PatientStatus.COMPLETED;

          await Promise.all([
            transactionalEntityManager.save(appointment),
            transactionalEntityManager.save(familyPlanning),
            transactionalEntityManager.save(appointmentService),
          ]);

          return appointmentService;
        },
      );

      return familyPlanning;
    } catch (error) {
      this.logger.error(ApiResponseMessages.FP_UPDATE_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FP_UPDATE_ERROR,
      );
    }
  }

  public async getFamilyPlanningById(
    patientId: number,
    appointmentServiceId: number,
  ): Promise<AppointmentService> {
    try {
      const familyPlanning = await this.appointmentServiceRepository.findOne({
        where: {
          id: appointmentServiceId,
          appointment: { patient: { id: patientId } },
          service: { name: ServiceType.FAMILY_PLANNING },
        },
        relations: ['familyPlanning'],
        order: { createdAt: 'DESC' }
      });

      if (!familyPlanning) {
        throw new BadRequestException(ApiResponseMessages.INVALID_FP_RECORD);
      }

      return familyPlanning;
    } catch (error) {
      this.logger.error(ApiResponseMessages.FP_GET_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FP_GET_ERROR,
      );
    }
  }
}
