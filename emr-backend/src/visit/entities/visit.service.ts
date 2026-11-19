import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientStatus, ServiceType } from 'src/common/enums/enums';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { FamilyPlanningService } from 'src/family-planning/family-planning.service';
import { Brackets, Repository } from 'typeorm';
import { PatientVisitsDto, PatientVisitServiceDto } from '../visit.dto';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Visit } from './visit.entity';
import { AncService } from 'src/anc/anc.service';
import { PncService } from 'src/pnc/pnc.service';
import { DeliveryService } from 'src/delivery/delivery.service';
import { DispenserService } from 'src/dispenser/dispenser.service';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { successResponse } from 'src/common/utils/response.util';
import { NutritionService } from 'src/nutrition/nutrition.service';
import { OpdService } from 'src/opd/opd.service';
import { ImmunisationService } from 'src/immunisation/immunisation.service';
import { Service } from '../../services/entities/service.entity';

@Injectable()
export class VisitService {
  private readonly logger: Logger = new Logger(VisitService.name);

  constructor(
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepo: Repository<AppointmentService>,

    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    private readonly familyPlanningService: FamilyPlanningService,
    private readonly ancService: AncService,
    private readonly pncService: PncService,
    private readonly deliveryService: DeliveryService,
    private readonly dispenserService: DispenserService,
    private readonly nutritionService: NutritionService,
    private readonly opdService: OpdService,
    private readonly immunisationService: ImmunisationService,
    private readonly serviceUtility: ServiceUtility,
  ) {}

  public async getVisitServiceTypeByPatient(
    patientId: number,
    visitId: number,
    serviceType: ServiceType,
    usedIn: ServiceType | null = null,
  ): Promise<PatientVisitServiceDto> {
    try {
      this.logger.log(
        `Fetching ${serviceType} for patient ${patientId} on visit ${visitId}`,
      );

      const service = await this.serviceUtility.getServiceByType(serviceType);
      const appointmentServiceId =
        await this.getAppointmentServiceByVisitAndService(
          visitId,
          service,
          patientId,
        );
      return this.getServiceDataByType(
        serviceType,
        patientId,
        appointmentServiceId,
        usedIn,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch ${serviceType} for patient ${patientId} on visit ${visitId}`,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PATIENT_VISIT_SERVICE_GET_ERROR,
      );
    }
  }

  private async getServiceDataByType(
    serviceType: ServiceType,
    patientId: number,
    appointmentServiceId: number,
    usedIn: ServiceType | null = null,
  ): Promise<any> {
    const patientVisitServiceDto = new PatientVisitServiceDto();
    switch (serviceType) {
      case ServiceType.ANC:
        patientVisitServiceDto.anc =
          usedIn === ServiceType.DELIVERY
            ? await this.ancService.findDeliverySummaryByPatientId(
                patientId,
                appointmentServiceId,
              )
            : await this.ancService.findByPatientId(
                patientId,
                appointmentServiceId,
              );
        break;

      case ServiceType.PNC:
        patientVisitServiceDto.pnc = await this.pncService.findByPatientId(
          patientId,
          appointmentServiceId,
        );
        break;

      case ServiceType.DELIVERY:
        patientVisitServiceDto.delivery =
          await this.deliveryService.findByPatientId(
            patientId,
            appointmentServiceId,
          );
        break;

      case ServiceType.FAMILY_PLANNING:
        patientVisitServiceDto.familyPlanning =
          await this.familyPlanningService.getFamilyPlanningById(
            patientId,
            appointmentServiceId,
          );
        break;

      case ServiceType.NUTRITION:
        patientVisitServiceDto.nutrition =
          await this.nutritionService.findByPatientId(
            patientId,
            appointmentServiceId,
          );
        break;

      case ServiceType.OPD:
        patientVisitServiceDto.opd =
          await this.opdService.getAllOpdByPatientId(patientId);
        break;

      case ServiceType.MEDICINE_DISPENSING:
        patientVisitServiceDto.dispenser =
          await this.dispenserService.findByPatientId(
            patientId,
            appointmentServiceId,
          );
        break;

      case ServiceType.IMMUNISATION:
        patientVisitServiceDto.immunization =
          await this.immunisationService.findByPatientId(
            patientId,
            appointmentServiceId,
          );
        break;

      default:
        break;
    }

    return successResponse(
      patientVisitServiceDto,
      ApiSuccessResponseMessages.PATIENT_VISIT_SERVICE_FETCH_SUCCESS,
      200,
    );
  }

  public async getVisitsByPatientId(
    patientId: number,
  ): Promise<PatientVisitsDto[]> {
    try {
      this.logger.log(`Fetching visits for patient ${patientId}`);

      const visits: PatientVisitsDto[] = await this.visitRepository
        .createQueryBuilder('v')
        .select('v.id', 'visitId')
        .addSelect("STRING_AGG(s.name, ', ')", 'services')
        .addSelect('v.created_at', 'createdAt')
        .addSelect('v.status', 'visitStatus')
        .innerJoin('v.appointments', 'app')
        .innerJoin('app.appointmentServices', 'aps')
        .innerJoin('aps.service', 's')
        .where('aps.patient_id = :patientId', { patientId })
        .groupBy('v.id')
        .orderBy('v.created_at', 'DESC')
        .getRawMany<PatientVisitsDto>();

      return visits;
    } catch (error) {
      this.logger.error(
        `Failed to fetch visits for patient ${patientId}`,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PATIENT_VISIT_SERVICE_GET_ERROR,
      );
    }
  }

  private async getAppointmentServiceByVisitAndService(
    visitId: number | null,
    service: Service,
    patientId: number | null,
  ): Promise<number> {
    let statuses = [PatientStatus.COMPLETED, PatientStatus.PAUSED];

    if (service.name === ServiceType.DELIVERY) {
      statuses = [...statuses, PatientStatus.IN_PROGRESS];
    }

    const qb = this.appointmentServiceRepo
      .createQueryBuilder('aps')
      .select('aps.id')
      .where('aps.service_id = :serviceId', { serviceId: service.id })
      .andWhere('aps.status IN (:...statuses)', { statuses })
      .orderBy('aps.created_at', 'DESC')
      .limit(1);

    if (patientId != null) {
      qb.andWhere('aps.patient_id = :patientId', { patientId });
    }

    if (visitId != null) {
      qb.andWhere(
        'aps.appointment_id IN (SELECT a.id FROM appointments a WHERE a.visit_id = :visitId)',
        { visitId },
      );
    }

    const appointmentService = await qb.getOne();

    if (!appointmentService?.id) {
      throw new NotFoundException(ApiResponseMessages.APP_SERVICE_NOT_FOUND);
    }

    return appointmentService.id;
  }

  public async getServiceTypeByPatient(
    patientId: number,
    serviceType: ServiceType,
    request: Request,
    usedIn: ServiceType | null = null,
  ) {
    try {
      this.logger.log(`Fetching ${serviceType} for patient ${patientId}`);
      const service = await this.serviceUtility.getServiceByType(serviceType);
      const appointmentServiceId =
        await this.getAppointmentServiceByVisitAndService(
          null,
          service,
          patientId,
        );
      return this.getServiceDataByType(
        serviceType,
        patientId,
        appointmentServiceId,
        usedIn,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch ${serviceType} for patient ${patientId}`,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PATIENT_VISIT_SERVICE_GET_ERROR,
      );
    }
  }

  public async getServiceReport(filters: any) {
    try {
      const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters?.limit) > 0 ? Number(filters.limit) : 10;
      const skip = (page - 1) * limit;
      const facilityId = Number(filters?.facilityId);
      const search =
        typeof filters?.search === 'string' ? filters.search.trim() : '';

      const baseQuery = this.appointmentServiceRepo
        .createQueryBuilder('appointmentService')
        .leftJoin('appointmentService.service', 'service')
        .leftJoin('appointmentService.appointment', 'appointment')
        .leftJoin('appointment.patient', 'patient')
        .leftJoin('appointment.doctor', 'doctor')
        .leftJoin('appointment.facility', 'facility');

      if (filters?.dateFrom) {
        baseQuery.andWhere('DATE(appointmentService.createdAt) >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters?.dateTo) {
        baseQuery.andWhere('DATE(appointmentService.createdAt) <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      if (filters?.doctorId) {
        baseQuery.andWhere('doctor.id = :doctorId', {
          doctorId: Number(filters.doctorId),
        });
      }

      if (filters?.serviceType) {
        baseQuery.andWhere('service.name = :serviceType', {
          serviceType: filters.serviceType,
        });
      }

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        baseQuery.andWhere('appointment.facility_id = :facilityId', {
          facilityId,
        });
      }

      if (search) {
        baseQuery.andWhere(
          new Brackets((searchQuery) => {
            searchQuery
              // TODO: CONCAT prevents index usage on first_name/last_name
              .where(
                "CONCAT(patient.first_name, ' ', patient.last_name) ILIKE :search",
                { search: `%${search}%` },
              )
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.phone_number LIKE :search', {
                search: `${search}%`,
              })
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.mr_no LIKE :search', {
                search: `${search}%`,
              });
          }),
        );
      }

      const total = await baseQuery.clone().getCount();

      const recordsQuery = baseQuery
        .clone()
        .select('appointmentService.id', 'appointment_service_id')
        .addSelect('service.name', 'service_name')
        .addSelect('patient.id', 'patient_id')
        .addSelect('patient.first_name', 'patient_first_name')
        .addSelect('patient.last_name', 'patient_last_name')
        .addSelect('doctor.id', 'doctor_id')
        .addSelect('doctor.first_name', 'doctor_first_name')
        .addSelect('doctor.last_name', 'doctor_last_name')
        .addSelect('facility.id', 'facility_id')
        .addSelect('facility.name', 'facility_name')
        .addSelect('appointmentService.createdAt', 'service_date');

      const records = await recordsQuery
        .orderBy('appointmentService.createdAt', 'DESC')
        .offset(skip)
        .limit(limit)
        .getRawMany();

      const summaryQuery = baseQuery
        .clone()
        .select('service.name', 'service_name')
        .addSelect('COUNT(appointmentService.id)', 'usage_count')
        .groupBy('service.name')
        .orderBy('service.name', 'ASC');

      const usageSummary = await summaryQuery.getRawMany();

      const servicesCountPerFacilityQuery = baseQuery
        .clone()
        .select('facility.id', 'facility_id')
        .addSelect('facility.name', 'facility_name')
        .addSelect('COUNT(appointmentService.id)', 'services_count')
        .groupBy('facility.id')
        .addGroupBy('facility.name')
        .orderBy('facility.name', 'ASC');

      const servicesCountPerFacility =
        await servicesCountPerFacilityQuery.getRawMany();

      const usageCountPerServicePerFacilityQuery = baseQuery
        .clone()
        .select('facility.id', 'facility_id')
        .addSelect('facility.name', 'facility_name')
        .addSelect('service.name', 'service_name')
        .addSelect('COUNT(appointmentService.id)', 'usage_count')
        .groupBy('facility.id')
        .addGroupBy('facility.name')
        .addGroupBy('service.name')
        .orderBy('facility.name', 'ASC')
        .addOrderBy('service.name', 'ASC');

      const usageCountPerServicePerFacility =
        await usageCountPerServicePerFacilityQuery.getRawMany();

      return successResponse(
        {
          records: records.map((record) => ({
            appointmentServiceId: Number(record.appointment_service_id),
            serviceName: record.service_name,
            patientId: Number(record.patient_id),
            patientName: `${record.patient_first_name ?? ''} ${record.patient_last_name ?? ''}`.trim(),
            doctorId: record.doctor_id ? Number(record.doctor_id) : null,
            doctorName:
              record.doctor_first_name || record.doctor_last_name
                ? `${record.doctor_first_name ?? ''} ${record.doctor_last_name ?? ''}`.trim()
                : null,
            facilityId: record.facility_id ? Number(record.facility_id) : null,
            facilityName: record.facility_name ?? null,
            date: record.service_date,
          })),
          usageSummary: usageSummary.map((summary) => ({
            serviceName: summary.service_name,
            usageCount: Number(summary.usage_count),
          })),
          servicesCountPerFacility: servicesCountPerFacility.map((summary) => ({
            facilityId: summary.facility_id ? Number(summary.facility_id) : null,
            facilityName: summary.facility_name ?? null,
            servicesCount: Number(summary.services_count),
          })),
          usageCountPerServicePerFacility:
            usageCountPerServicePerFacility.map((summary) => ({
              facilityId: summary.facility_id
                ? Number(summary.facility_id)
                : null,
              facilityName: summary.facility_name ?? null,
              serviceName: summary.service_name,
              usageCount: Number(summary.usage_count),
            })),
        },
        total === 0 ? 'No Data Found' : 'Service report fetched successfully',
        200,
        page,
        limit,
        total,
      );
    } catch (error) {
      this.logger.error('Failed to fetch service report', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch service report',
      );
    }
  }
}
