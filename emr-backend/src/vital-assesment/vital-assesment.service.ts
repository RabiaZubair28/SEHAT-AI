import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateVitalAssesmentDto } from './dto/create-vital-assesment.dto';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { InjectRepository } from '@nestjs/typeorm';
import { VitalAssessment } from './entities/vital-assesment.entity';
import { Repository } from 'typeorm';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { successResponse } from 'src/common/utils/response.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ImmunisationService } from '../immunisation/immunisation.service';
import { CreateImmunisationDto } from 'src/immunisation/dto/create-immunisation.dto';

@Injectable()
export class VitalAssesmentService {
  private readonly logger = new Logger(VitalAssesmentService.name);
  constructor(
    @InjectRepository(VitalAssessment)
    private readonly vitalsRepository: Repository<VitalAssessment>,
    private readonly serviceUtility: ServiceUtility,
    @Inject(forwardRef(() => ImmunisationService))
    private readonly immunisationService: ImmunisationService,
  ) { }

  async create(request: Request, body: CreateVitalAssesmentDto) {
    try {
      const appointment = await this.serviceUtility.validateAppointment(
        body.appointmentId,
      );
      const userId = ((request as any).user as any)?.sub;
      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId,
      );

      let vitals;

      if (appointment.visit.vitalAssessment) {
        vitals = await this.vitalsRepository.manager.transaction(
          async (em) => {
            const { appointmentId, immunisation, ...updateData } = body;
            await em.update(
              VitalAssessment,
              appointment.visit.vitalAssessment.id,
              {
                ...updateData,
              },
            );

            if (body.immunisation) {
              const immunisationPayload: CreateImmunisationDto = {
                appointmentId: appointment.id,
                doses: body.immunisation.doses,
              } as any;
              await this.immunisationService.createVitalImmunisation(
                immunisationPayload,
                request,
                em,
              );
            }
            return null;
          }
        );
      } else {
        vitals = await this.vitalsRepository.manager.transaction(
          async (em) => {
            const vital = this.vitalsRepository.create({
              ...body,
              appointment,
              visit: appointment.visit,
            });

            if (body.immunisation) {
              const immunisationPayload: CreateImmunisationDto = {
                appointmentId: appointment.id,
                doses: body.immunisation.doses,
              } as any;
              await this.immunisationService.createVitalImmunisation(
                immunisationPayload,
                request,
                em,
              );
            }
            return em.save(vital);
          }
        );
      }
      vitals = await this.vitalsRepository.findOne({
        where: { visit: { patient: { id: appointment.patient.id } } },
        relations: ['visit.patient.immunisationsDoses', 'visit.patient.immunisationsDoses.vaccine']
      });
      return successResponse(
        vitals,
        ApiSuccessResponseMessages.VA_SAVED_SUCCESSFULLY,
        201,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.VA_ERROR_CREATING_UPDATING,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.VA_ERROR_CREATING_UPDATING,
      );
    }
  }

  async get(visitId: number) {
    try {
      const vitals = await this.vitalsRepository.findOne({
        where: { visit: { id: visitId } },
        relations: ['visit.patient.immunisationsDoses', 'visit.patient.immunisationsDoses.vaccine']
      });

      if (!vitals) {
        throw new NotFoundException(ApiResponseMessages.VA_NOT_FOUND);
      }

      return successResponse(
        vitals,
        ApiSuccessResponseMessages.VA_DETAILS_FETCHED_SUCCESSFULLY,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.VA_FETCHING_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.VA_FETCHING_FAILED,
      );
    }
  }
}
