import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import {
  DeepPartial,
  EntityManager,
  FindOptionsRelations,
  FindOptionsSelect,
  In,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import {
  AttendanceStatus,
  EmrServices,
  Gender,
  ImmunisationDosageStatus,
  MedicineCategories,
  MedicineUnit,
  PatientStatus,
  ServiceType,
  VaccineAppliedTo,
  VaccineCatchUpMode,
  VaccineGenderRestriction,
  VisitStatus,
} from '../enums/enums';
import { Service } from 'src/services/entities/service.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';
import { CreateDispenserDto } from 'src/dispenser/dto/create-dispenser.dto';
import { DispenserService } from 'src/dispenser/dispenser.service';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { ExceptionUtility } from './helper.util';
import { ApiResponseMessages } from '../api-messages.constants';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { ImmunisationService } from 'src/immunisation/immunisation.service';
import { Patient } from 'src/patients/entities/patient.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { CreateEmergencyDispenserDto } from 'src/dispenser/dto/create-emergency-dispenser.dto';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { RedisCacheService } from '../cache/redis-cache.service';
import { SERVICE_CACHE_TTL_SECONDS } from '../app.constants';
import { CreateImmunisationDto } from '../../immunisation/dto/create-immunisation.dto';

interface ValidateAppointmentOptions {
  select?: FindOptionsSelect<Appointment> | undefined;
  relations?: FindOptionsRelations<Appointment>;
}

@Injectable()
export class ServiceUtility {
  constructor(
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepo: Repository<AppointmentService>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(Vaccine)
    private readonly vaccineRepository: Repository<Vaccine>,
    @InjectRepository(PatientQueue)
    private readonly patientQueueRepository: Repository<PatientQueue>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(EmergencyPatient)
    private readonly emergencyPatientRepo: Repository<EmergencyPatient>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly redisCacheService: RedisCacheService,

    @Optional()
    @Inject(forwardRef(() => DispenserService))
    private readonly dispenserService?: DispenserService,
    @Optional()
    @Inject(forwardRef(() => ImmunisationService))
    private readonly immunisationService?: ImmunisationService,
  ) {}

  public async validatePatientAccess(
    appointmentId: number,
    patientId: number,
    loggedInUserId: number,
  ): Promise<void> {
    const hasAccess = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.patient', 'patient')
      .innerJoin('appointment.doctor', 'doctor')
      .innerJoin('appointment.visit', 'visit')
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('patient.id = :patientId', { patientId })
      .andWhere('doctor.id = :loggedInUserId', { loggedInUserId })
      .andWhere('visit.status != :dispatchedStatus', {
        dispatchedStatus: VisitStatus.DISPATCHED,
      })
      .getExists();

    if (!hasAccess) {
      throw new ForbiddenException('User does not have access to this patient');
    }
  }

  public async getServiceByType(serviceType: ServiceType): Promise<Service> {
    const cacheKey = this.redisCacheService.buildKey('service:byType', { serviceType });

    return this.redisCacheService.getOrSetJson(
      cacheKey,
      SERVICE_CACHE_TTL_SECONDS,
      async () => {
        const service = await this.serviceRepository.findOne({
          where: { name: serviceType },
        });

        if (!service) {
          throw new NotFoundException(
            `Service with name ${serviceType} not found`,
          );
        }

        return service;
      },
    );
  }

  public async validateAndGetAppointmentService(
    appointmentId: number,
    serviceId: number,
  ): Promise<AppointmentService> {
    const appointmentService = await this.appointmentServiceRepo
      .createQueryBuilder('appointmentService')
      .innerJoin('appointmentService.appointment', 'appointment')
      .innerJoin('appointmentService.service', 'service')
      .select([
        'appointmentService.id',
        'appointmentService.status',
        'appointmentService.deliveryProgressStatus',
      ])
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('service.id = :serviceId', { serviceId })
      .getOne();

    if (!appointmentService) {
      throw new NotFoundException('Service not found in the appointment');
    }

    return appointmentService;
  }

  public async checkServiceAvailability(
    patientId: number,
  ): Promise<Array<{ id: number; name: string }>> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      select: ['id', 'dob', 'gender'],
    });

    if (!patient)
      throw new NotFoundException(`Patient not found (ID: ${patientId})`);
    if (!patient.dob) {
      throw new BadRequestException(
        'Patient date of birth is missing; cannot determine service eligibility.',
      );
    }

    const { ageYears, ageMonthsTotal } = this.getAge(patient.dob);
    const genderLower = (patient.gender ?? '').toString().toLowerCase(); // works if enum/string
    const isFemale = genderLower === 'female';

    const services = await this.serviceRepository.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });

    return services.filter((s) => {
      const name = (s.name ?? '').trim().toLowerCase();

      if (this.matchesService(name, ['anc', 'pnc'])) {
        return isFemale && ageYears >= 14;
      }

      if (this.matchesService(name, ['delivery'])) {
        return isFemale && ageYears >= 14;
      }

      if (this.matchesService(name, ['immunisation'])) {
        const isChildImmunisationEligible =
          ageMonthsTotal >= 0 && ageMonthsTotal <= 59;
        const isFemaleAdultImmunisationEligible =
          isFemale && ageYears >= 9 && ageYears <= 50;

        return (
          isChildImmunisationEligible || isFemaleAdultImmunisationEligible
        );
      }

      if (this.matchesService(name, ['family_planning'])) {
        return isFemale && ageYears >= 14;
      }

      if (this.matchesService(name, ['medicine_dispensing'])) {
        return true;
      }

      if (this.matchesService(name, ['nutrition'])) {
        return ageYears >= 0;
      }

      if (this.matchesService(name, ['opd'])) {
        return ageYears >= 0;
      }

      return false;
    });
  }

  private matchesService(
    serviceNameLower: string,
    keywords: string[],
  ): boolean {
    return keywords.some((k) => {
      const kk = k.toLowerCase();
      return serviceNameLower === kk || serviceNameLower.includes(kk);
    });
  }

  public getAge(dateOfBirth: Date | string): {
    ageYears: number;
    ageMonthsTotal: number;
  } {
    const dob =
      typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    if (Number.isNaN(dob.getTime()))
      throw new BadRequestException('Invalid patient date of birth.');

    const now = new Date();

    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();

    if (now.getDate() < dob.getDate()) months -= 1;

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalMonths = years * 12 + months;

    if (years < 0 || totalMonths < 0) {
      throw new BadRequestException('Patient date of birth is in the future.');
    }

    return { ageYears: years, ageMonthsTotal: totalMonths };
  }

  public async validateAndGetAppointment(
    appointmentId: number,
    options: ValidateAppointmentOptions = {},
  ) {
    const appointment = await this.appointmentRepository.findOne({
      loadEagerRelations: false,
      where: {
        id: appointmentId,
      },
      select: options.select,
      relations: options.relations,
    });

    if (!appointment) {
      throw new BadRequestException('Invalid appointment ID');
    }

    if (!appointment.visit_id) {
      throw new BadRequestException(
        'Appointment must have an associated visit.',
      );
    }

    return appointment;
  }

  public async validateAppointment(
    appointmentId: number,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.patient', 'patient')
      .leftJoin('patient.additionalInfo', 'additionalInfo')
      .leftJoin('appointment.facility', 'facility')
      .leftJoin('appointment.doctor', 'doctor')
      .leftJoin('appointment.visit', 'visit')
      .leftJoin('visit.vitalAssessment', 'vitalAssessment')
      .select([
        'appointment.id',
        'appointment.visit_id',
        'appointment.patient_id',
        'appointment.status',
        'appointment.token_number',
        'patient.id',
        'patient.first_name',
        'patient.last_name',
        'patient.cnic',
        'patient.dob',
        'patient.immunisation_number',
        'patient.address',
        'patient.phone_number',
        'patient.division_id',
        'patient.district_id',
        'patient.facility_id',
        'patient.taluka_id',
        'patient.uc_id',
        'additionalInfo.id',
        'additionalInfo.marital_status',
        'facility.id',
        'doctor.id',
        'visit.id',
        'visit.status',
        'vitalAssessment.id',
      ])
      .where('appointment.id = :appointmentId', { appointmentId })
      .getOne();

    if (!appointment) {
      throw new BadRequestException('Invalid appointment ID');
    }
    return appointment;
  }

  public async getServiceNameById(serviceId: number) {
    try {
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId },
      });
      if (!service) {
        throw new NotFoundException('Service name by the service id not found');
      }
      return service.name;
    } catch (e) {
      throw ExceptionUtility.generateException(
        e,
        ApiResponseMessages.PATIENT_VISIT_SERVICE_GET_ERROR,
      );
    }
  }

  public async handleNestedUpdate<T extends ObjectLiteral>(
    existingEntity: T | null | undefined,
    newData: any | null | undefined,
    repository: Repository<T>,
  ): Promise<T | null> {
    if (newData === null) {
      return null;
    }

    if (newData === undefined) {
      return existingEntity ?? null;
    }

    if (existingEntity) {
      const mappedData = this.mapDtoToEntityData(newData);
      return await repository.save({
        ...existingEntity,
        ...mappedData,
      } as DeepPartial<T>);
    }

    const mappedData = this.mapDtoToEntityData(newData);
    return await repository.save(
      repository.create(mappedData as DeepPartial<T>),
    );
  }

  public async handleRequiredNestedUpdate<T extends ObjectLiteral>(
    existingEntity: T | null | undefined,
    newData: any | null | undefined,
    repository: Repository<T>,
    entityName: string,
  ): Promise<T> {
    const result = await this.handleNestedUpdate(
      existingEntity,
      newData,
      repository,
    );
    if (result === null) {
      throw new BadRequestException(`${entityName} cannot be set to null`);
    }
    return result;
  }

  public mapPrescriptionMedicines(
    prescription: any,
  ): DeepPartial<Prescription> {
    if (!prescription) {
      return {} as DeepPartial<Prescription>;
    }

    const { medicine_variant_id, ...prescriptionData } = prescription;

    const mapped: DeepPartial<Prescription> = {
      ...prescriptionData,
    };

    if (medicine_variant_id === null) {
      (mapped as any).medicineVariant = null;
    } else if (medicine_variant_id !== undefined) {
      mapped.medicineVariant = {
        id: medicine_variant_id,
      } as DeepPartial<MedicineVariant>;
    }

    return mapped;
  }

  public mapDtoToEntityData(dtoData: any): any {
    if (!dtoData || typeof dtoData !== 'object') {
      return dtoData;
    }
    const mappedData = Object.keys(dtoData).reduce((acc, key) => {
      if (dtoData[key] !== undefined) {
        acc[key] = dtoData[key];
      }
      return acc;
    }, {} as any);

    return mappedData;
  }

  public async checkAppointmentServiceStatus(
    appointmentService: AppointmentService,
    expectedStatus: PatientStatus,
  ): Promise<void> {
    if (appointmentService.status !== expectedStatus) {
      throw new ConflictException(
        `Appointment service status must be ${expectedStatus}`,
      );
    }
  }

  public async checkPendingServiceStatus(doctorId: number): Promise<void> {
    const hasPendingService = await this.patientQueueRepository
      .createQueryBuilder('queue')
      .innerJoin('queue.doctor', 'doctor')
      .innerJoin('queue.appointment', 'appointment')
      .innerJoin('appointment.appointmentServices', 'appointmentService')
      .innerJoin('appointmentService.service', 'service')
      .where('queue.status = :queueStatus', {
        queueStatus: PatientStatus.IN_PROGRESS,
      })
      .andWhere('doctor.id = :doctorId', { doctorId })
      .andWhere('appointment.status = :appointmentStatus', {
        appointmentStatus: PatientStatus.IN_PROGRESS,
      })
      .andWhere('service.name != :deliveryService', {
        deliveryService: EmrServices.DELIVERY,
      })
      .getExists();

    if (hasPendingService) {
      throw new ConflictException(
        'Please refer or complete the visit of in progress patient.',
      );
    }
  }

  public excelBool(value: any): boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;

    const v = String(value).trim().toLowerCase();

    if (v === 'true' || v === '1' || v === 'yes' || v === 'y') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'n') return false;

    return null;
  }

  public async savePrescriptionsAndDispense(
    prescriptions: CreatePrescriptionDto[] | undefined,
    appointmentService: AppointmentService,
    appointment: Pick<Appointment, 'id' | 'patient_id' | 'visit_id'>,
    service: Service,
    user: AuthenticatedUser,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    if (!prescriptions?.length) {
      return;
    }

    // Map prescriptions
    const mappedPrescriptions = prescriptions?.map((prescription) =>
      this.mapPrescriptionMedicines(prescription),
    );

    const createdPrescriptions = mappedPrescriptions.map((mapped) =>
      this.prescriptionRepository.create({
        ...mapped,
        appointmentService: { id: appointmentService.id },
        visit: appointment.visit_id ? { id: appointment.visit_id } : undefined,
        createdBy: { id: user.sub },
        medicineDispensed: false,
      } as DeepPartial<Prescription>),
    );

    const savedPrescriptions =
      await transactionalEntityManager.save(createdPrescriptions);

    const prescriptionsWithMedicines = await transactionalEntityManager.find(
      Prescription,
      {
        where: { id: In(savedPrescriptions.map((p) => p.id)) },
        relations: ['medicineVariant', 'medicineVariant.medicine'],
      },
    );

    let contraceptiveItems;
    if (service.name === ServiceType.DELIVERY) {
      contraceptiveItems = prescriptionsWithMedicines;
    } else {
      contraceptiveItems = prescriptionsWithMedicines.filter(
        (prescription) => prescription.medicineVariant?.medicine?.contraceptive,
      );
      if (!contraceptiveItems.length) {
        return;
      }
    }

    const dispenserPayload: CreateDispenserDto = {
      patient_id: appointment.patient_id,
      appointment_id: appointment.id,
      visitDate: new Date(),
      service_id: service.id,
      items: contraceptiveItems.map((prescription) => ({
        prescription_id: prescription.id,
      })),
      otcMedRequired: false,
    };

    if (!this.dispenserService) {
      throw new BadRequestException('Dispenser service is unavailable');
    }

    await this.dispenserService.create(
      dispenserPayload,
      user,
      transactionalEntityManager,
    );
  }

  async savePrescriptionsAndDispenseForEmergency(
    prescriptions: CreatePrescriptionDto[] | undefined,
    emergencyPatient: EmergencyPatient,
    userId: number,
    request: Request,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    if (!prescriptions?.length) {
      return;
    }

    // Map prescriptions
    const mappedPrescriptions = prescriptions.map((prescription) =>
      this.mapPrescriptionMedicines(prescription),
    );

    const createdPrescriptions = mappedPrescriptions.map((mapped) =>
      this.prescriptionRepository.create({
        ...mapped,
        emergencyPatient: { id: emergencyPatient.id },
        createdBy: { id: userId },
        medicineDispensed: false,
      } as DeepPartial<Prescription>),
    );

    const savedPrescriptions =
      await transactionalEntityManager.save(createdPrescriptions);

    const prescriptionsWithMedicines = await transactionalEntityManager.find(
      Prescription,
      {
        where: { id: In(savedPrescriptions.map((p) => p.id)) },
        relations: ['medicineVariant', 'medicineVariant.medicine'],
      },
    );

    const allMedicines = prescriptionsWithMedicines;

    if (!allMedicines.length) {
      return;
    }

    //  Create emergency dispenser payload
    const dispenserPayload: CreateEmergencyDispenserDto = {
      emergency_patient_id: emergencyPatient.id,
      visitDate: new Date(),
      items: allMedicines.map((prescription) => ({
        prescription_id: prescription.id,
      })),
      otcMedRequired: false,
    };

    if (!this.dispenserService) {
      throw new BadRequestException('Dispenser service is unavailable');
    }

    try {
      await this.dispenserService.createForEmergency(
        dispenserPayload,
        request,
        transactionalEntityManager,
      );
    } catch (error) {
      throw error;
    }
  }
  async validateEmergencyPatient(
    emergencyPatientId: number,
  ): Promise<EmergencyPatient> {
    const emergencyPatient = await this.emergencyPatientRepo.findOne({
      where: { id: emergencyPatientId },
      relations: ['facility'],
    });

    if (!emergencyPatient) {
      throw new NotFoundException(
        `Emergency patient with ID ${emergencyPatientId} not found`,
      );
    }

    return emergencyPatient;
  }

  async validateEmergencyPatientInTransaction(
    emergencyPatientId: number,
    entityManager: EntityManager,
  ): Promise<EmergencyPatient> {
    const patient = await entityManager.findOne(EmergencyPatient, {
      where: { id: emergencyPatientId },
      relations: ['facility'],
    });

    if (!patient) {
      throw new NotFoundException(
        `Emergency patient with ID ${emergencyPatientId} not found`,
      );
    }

    return patient;
  }
  public async saveImmunisation(
    immunisationDto: CreateImmunisationDto,
    user: AuthenticatedUser,
    transactionalEntityManager?: EntityManager,
  ): Promise<void> {
    if (!immunisationDto) {
      return;
    }

    if (!this.immunisationService) {
      throw new BadRequestException('Immunisation service is unavailable');
    }

    await this.immunisationService.create(
      immunisationDto,
      user,
      transactionalEntityManager,
    );
  }

  public calculateDispensedQuantity(
    desiredQuantity: number,
    availableQuantity: number,
    limitQuantity?: number | null,
    medicineName?: string,
    isOtc: boolean = false,
    sortedBatches?: MedicineBatch[],
    operatingUser?: User,
  ): {
    dispensedQuantity: number;
    dispenseItemBatch?: MedicineBatch;
    updatedBatches: MedicineBatch[];
  } {
    const dispensedQuantity = Math.min(availableQuantity ?? 0, desiredQuantity);

    if (isOtc && limitQuantity && dispensedQuantity > limitQuantity) {
      throw new BadRequestException(
        `Dispensed quantity for medicine ${medicineName ?? 'medicine'} exceeds the limit quantity.`,
      );
    }

    const updatedBatches: MedicineBatch[] = [];
    let dispenseItemBatch: MedicineBatch | undefined;

    if (dispensedQuantity > 0 && sortedBatches?.length) {
      let remainingQuantity = dispensedQuantity;

      for (const batch of sortedBatches) {
        if (remainingQuantity <= 0) {
          break;
        }
        const stockQuantity = batch.stock_quantity ?? 0;
        if (stockQuantity <= 0) {
          continue;
        }

        const deduction = Math.min(remainingQuantity, stockQuantity);
        if (deduction <= 0) {
          continue;
        }

        if (!dispenseItemBatch) {
          dispenseItemBatch = batch;
        }

        // batch.stock_quantity = stockQuantity - deduction;
        if (operatingUser) {
          batch.updatedBy = operatingUser;
        }
        updatedBatches.push(batch);
        remainingQuantity -= deduction;
      }
    }

    return { dispensedQuantity, dispenseItemBatch, updatedBatches };
  }

  public calculateDesiredQuantity(
    variant: MedicineVariant,
    prescription: Prescription,
  ): number {
    const duration = prescription.medicineDuration ?? 0;
    if (
      prescription.medicineVariant.medicine.category ===
      MedicineCategories.SUPPLEMENT
    ) {
      return 1;
    }
    if (prescription.quantity) {
      return prescription.quantity;
    }
    if (duration <= 0) {
      return 0;
    }

    const solidOralUnits = [
      MedicineUnit.TABLET,
      MedicineUnit.CAPSULE,
      MedicineUnit.SACHET,
    ];
    if (solidOralUnits.includes(variant.unit)) {
      const dailyDose = this.parseDailyDosage(prescription.medicineDosage);
      if (dailyDose > 0) {
        return dailyDose * duration;
      }
    } else {
      return 1;
    }

    return duration;
  }

  private parseDailyDosage(dosage?: string | null): number {
    if (!dosage) {
      return 0;
    }

    const tokens = dosage
      .split(/[^0-9.]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      return 0;
    }

    return tokens.reduce((total, token) => {
      const value = Number(token);
      return Number.isFinite(value) ? total + value : total;
    }, 0);
  }

  public ensureChildEligibility(dob?: Date | string | null) {
    if (!dob) {
      throw new BadRequestException(
        'Patient date of birth is required for immunisation.',
      );
    }
    const ageInDays = this.calculateAgeInDays(new Date(dob));
    const maxChildAgeDays = 365 * 5; // under 5 years
    if (ageInDays > maxChildAgeDays) {
      throw new BadRequestException(
        'Immunisation schedule is only available for children under 5 years old.',
      );
    }
  }

  public async ensureVaccineEligibility(
    doses: {
      vaccine_id: number;
      dateAdministered: string;
      status?: ImmunisationDosageStatus;
    }[],
    dob: Date,
    patientId: number,
    entityManager?: EntityManager,
  ) {
    if (!doses?.length) return;

    const dobDate = this.normalizeDate(dob);
    const today = this.normalizeDate(new Date());
    const ageInDays = this.calculateAgeInDays(dobDate);
    const maxChildAgeDays = 365 * 5; // under 5 years
    const manager = entityManager ?? this.patientRepository.manager;
    const patient = await manager.findOne(Patient, {
      loadEagerRelations: false,
      where: { id: patientId },
      select: ['id', 'gender'],
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id ${patientId} not found`);
    }

    const parsedDoses = doses.map((dose) => ({
      ...dose,
      doseDate: this.normalizeDate(dose.dateAdministered),
    }));

    // Load incoming vaccines
    const uniqueIds = [...new Set(parsedDoses.map((d) => d.vaccine_id))];
    const incomingVaccines = await this.vaccineRepository.find({
      where: { id: In(uniqueIds), isActive: true },
      select: [
        'id',
        'code',
        'display_name',
        'series_name',
        'dose_number',
        'age_min_days',
        'age_overdue_days',
        'max_age_days',
        'applies_to',
        'gender_restriction',
        'pre_requisite_codes',
        'catch_up_1_to_2_mode',
        'catch_up_1_to_2_interval_days',
        'catch_up_1_to_2_note',
        'catch_up_above_2_mode',
        'catch_up_above_2_interval_days',
        'catch_up_above_2_note',
      ],
    });
    if (incomingVaccines.length !== uniqueIds.length) {
      const foundIds = incomingVaccines.map((v) => v.id);
      const missing = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Invalid or inactive vaccine ids: ${missing.join(', ')}`,
      );
    }
    const vaccinesById = new Map(incomingVaccines.map((v) => [v.id, v]));

    // Load full schedule rows for involved codes / series
    const involvedCodes = [...new Set(incomingVaccines.map((v) => v.code))];
    const involvedSeries = [
      ...new Set(incomingVaccines.map((v) => this.vaccineGroupKey(v))),
    ];
    const scheduleRows = await this.vaccineRepository.find({
      where: [
        { code: In(involvedCodes), isActive: true },
        { series_name: In(involvedSeries), isActive: true },
      ],
      select: [
        'id',
        'code',
        'display_name',
        'series_name',
        'dose_number',
        'age_min_days',
        'age_overdue_days',
        'max_age_days',
        'applies_to',
        'gender_restriction',
        'pre_requisite_codes',
        'catch_up_1_to_2_mode',
        'catch_up_1_to_2_interval_days',
        'catch_up_above_2_mode',
        'catch_up_above_2_interval_days',
      ],
    });

    // Age gating by applies_to vs patient age
    const containsChildVaccines = incomingVaccines.some(
      (v) => v.applies_to === VaccineAppliedTo.CHILD,
    );
    if (containsChildVaccines) {
      this.ensureChildEligibility(dobDate);
    }
    if (ageInDays <= maxChildAgeDays) {
      const adultVaccines = incomingVaccines.filter(
        (v) => v.applies_to === VaccineAppliedTo.ADULT,
      );
      if (adultVaccines.length) {
        const codes = adultVaccines.map((v) => v.code).join(', ');
        throw new BadRequestException(
          `Cannot administer adult vaccines to a child: ${codes}.`,
        );
      }
    } else {
      const childVaccines = incomingVaccines.filter(
        (v) => v.applies_to === VaccineAppliedTo.CHILD,
      );
      if (childVaccines.length) {
        const codes = childVaccines.map((v) => v.code).join(', ');
        throw new BadRequestException(
          `Cannot administer child vaccines to an adult: ${codes}.`,
        );
      }
    }

    // Prior administered doses for this patient
    const priorAdministered: Array<{
      code: string;
      display_name: string;
      series_name: string | null;
      dose_number: number;
      vaccine_id: number;
      date_administered: string;
    }> = await this.vaccineRepository.manager.query(
      `
      SELECT v.code as code,
             v.display_name as display_name,
             v.series_name as series_name,
             v.dose_number as dose_number,
             v.id as vaccine_id,
             d.date_administered as date_administered
      FROM immunisation_doses d
      INNER JOIN vaccines v ON v.id = d.vaccine_id
      WHERE d.patient_id = $1 AND d.status::text IN ($2::text, $3::text) AND v.is_active = true
      `,
      [patientId, ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO],
    );

    // Build schedule lookup by group/dose -> vaccine ids that belong to that slot
    const scheduleDoseVaccinesByGroup = this.buildScheduleDoseMap(scheduleRows);

    // Track completed doses per group with which vaccine ids were administered
    const completedDosesByGroup =
      this.buildCompletedDosesMap(priorAdministered);
    const completedCodeDates = this.buildCompletedCodeDateMap(priorAdministered);

    // Sort incoming doses for deterministic validation
    const sortedDoses = [...parsedDoses].sort((a, b) => {
      const va = vaccinesById.get(a.vaccine_id)!;
      const vb = vaccinesById.get(b.vaccine_id)!;
      const ga = this.vaccineGroupKey(va);
      const gb = this.vaccineGroupKey(vb);
      if (ga === gb) return va.dose_number - vb.dose_number;
      return ga.localeCompare(gb);
    });

    for (const dose of sortedDoses) {
      const vaccine = vaccinesById.get(dose.vaccine_id);
      if (!vaccine)
        throw new BadRequestException(
          `Vaccine with id ${dose.vaccine_id} not found`,
        );

      if (dose.doseDate > today) {
        throw new BadRequestException(
          'Date administered cannot be in the future.',
        );
      }

      const ageAtDoseDays = this.calculateDaysBetween(dobDate, dose.doseDate);
      this.ensureGenderEligibility(vaccine, patient.gender);

      const catchUpRule = this.resolveCatchUpRule(vaccine, ageAtDoseDays);
      const catchUpAllowed = this.isCatchUpAllowed(catchUpRule.mode);
      if (
        vaccine.max_age_days !== null &&
        vaccine.max_age_days !== undefined &&
        ageAtDoseDays > vaccine.max_age_days &&
        !catchUpAllowed
      ) {
        throw new BadRequestException(
          this.buildMaxAgeError(vaccine),
        );
      }

      const group = this.vaccineGroupKey(vaccine);
      const completed =
        completedDosesByGroup.get(group) ??
        new Map<number, { vaccineIds: Set<number>; latestDate: Date }>();
      const scheduledGroup =
        scheduleDoseVaccinesByGroup.get(group) ??
        new Map<number, Set<number>>();
      this.ensurePrerequisiteCodesCompleted(
        vaccine.pre_requisite_codes,
        completedCodeDates,
        vaccine.code,
      );

      const immediateCatchUp =
        [
          VaccineCatchUpMode.IMMEDIATE,
          VaccineCatchUpMode.SINGLE_DOSE,
          VaccineCatchUpMode.ON_FIRST_CONTACT,
        ].includes(catchUpRule.mode as VaccineCatchUpMode);
      const referenceStartDate = immediateCatchUp
        ? dose.doseDate
        : this.resolveNonLmpReferenceStartDate(
            vaccine,
            dobDate,
            completedCodeDates,
            catchUpRule,
          );
      const requiredMinDays = this.resolveNonLmpRequiredMinDays(
        vaccine,
        catchUpRule,
      );
      const isScheduledOrDefaulterAdministration =
        dose.status === ImmunisationDosageStatus.SCHEDULED ||
        dose.status === ImmunisationDosageStatus.DEFAULTER;
      const minDaysToValidate = isScheduledOrDefaulterAdministration
        ? 0
        : requiredMinDays;
      if (!referenceStartDate) {
        throw new BadRequestException(
          'date of birth is required for vaccine administration.',
        );
      }
      if (dose.doseDate < referenceStartDate) {
        throw new BadRequestException(
          `Date administered cannot be before ${this.describeEligibilityAnchor(vaccine, catchUpRule)}.`,
        );
      }

      // Require all lower scheduled doses to have all vaccines administered
      for (const [doseNumber, requiredIds] of scheduledGroup.entries()) {
        if (doseNumber >= vaccine.dose_number) continue;
        const completedDose = completed.get(doseNumber);
        const completedIds = completedDose?.vaccineIds ?? new Set<number>();
        for (const requiredId of requiredIds) {
          if (!completedIds.has(requiredId)) {
            throw new BadRequestException(
              `Cannot administer dose ${vaccine.dose_number} for ${vaccine.code} before completing dose ${doseNumber}.`,
            );
          }
        }
      }

      // Block re-administering the same vaccine dose
      const currentDoseInfo = completed.get(vaccine.dose_number);
      if (currentDoseInfo?.vaccineIds.has(vaccine.id)) {
        throw new BadRequestException(
          `Dose ${vaccine.dose_number} for ${vaccine.code} has already been administered.`,
        );
      }

      const daysSinceAnchor = this.calculateDaysBetween(
        referenceStartDate,
        dose.doseDate,
      );
      if (daysSinceAnchor < minDaysToValidate) {
        throw new BadRequestException(
          `Dose ${vaccine.dose_number} for ${vaccine.code} requires at least ${minDaysToValidate} days after ${this.describeEligibilityAnchor(vaccine, catchUpRule)}.`,
        );
      }

      const vaccineIds = currentDoseInfo?.vaccineIds ?? new Set<number>();
      vaccineIds.add(vaccine.id);
      const latestDate =
        currentDoseInfo?.latestDate &&
        currentDoseInfo.latestDate > dose.doseDate
          ? currentDoseInfo.latestDate
          : dose.doseDate;
      completed.set(vaccine.dose_number, { vaccineIds, latestDate });
      completedDosesByGroup.set(group, completed);
      this.recordCompletedCodeDate(completedCodeDates, vaccine.code, dose.doseDate);
    }
  }

  public async calculateImmunisationDosageStatuses(
    patientId: number,
    vaccines: Array<
      Pick<
        Vaccine,
        | 'id'
        | 'code'
        | 'display_name'
        | 'series_name'
        | 'dose_number'
        | 'age_min_days'
        | 'age_overdue_days'
        | 'max_age_days'
        | 'applies_to'
        | 'gender_restriction'
        | 'pre_requisite_codes'
        | 'catch_up_1_to_2_mode'
        | 'catch_up_1_to_2_interval_days'
        | 'catch_up_1_to_2_note'
        | 'catch_up_above_2_mode'
        | 'catch_up_above_2_interval_days'
        | 'catch_up_above_2_note'
        | 'order'
      >
    >,
    entityManager?: EntityManager,
    administeredDateMap?: Map<number, Date>,
  ): Promise<Map<number, ImmunisationDosageStatus>> {
    const statusMap = new Map<number, ImmunisationDosageStatus>();
    if (administeredDateMap) {
      administeredDateMap.clear();
    }
    if (!patientId || !vaccines.length) {
      return statusMap;
    }

    const manager = entityManager ?? this.vaccineRepository.manager;
    const patient = await manager.findOne(Patient, {
      loadEagerRelations: false,
      where: { id: patientId },
      select: ['id', 'dob', 'gender'],
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id ${patientId} not found`);
    }

    const dobDate = this.normalizeDate(patient.dob);
    const today = this.normalizeDate(new Date());
    const ageInDays = this.calculateAgeInDays(dobDate);
    const maxChildAgeDays = 365 * 5; // under 5 years

    const priorAdministered: Array<{
      code: string;
      display_name: string;
      series_name: string | null;
      dose_number: number;
      vaccine_id: number;
      date_administered: string;
      status: ImmunisationDosageStatus;
    }> = await manager.query(
      `
      SELECT v.code as code,
             v.display_name as display_name,
             v.series_name as series_name,
             v.dose_number as dose_number,
             v.id as vaccine_id,
             d.status as status,
             d.date_administered as date_administered
      FROM immunisation_doses d
      INNER JOIN vaccines v ON v.id = d.vaccine_id
      WHERE d.patient_id = $1 AND d.status::text IN ($2::text, $3::text) AND v.is_active = true
      ORDER BY d.date_administered DESC, d.id DESC
      `,
      [patientId, ImmunisationDosageStatus.ADMINISTERED, ImmunisationDosageStatus.RETRO],
    );
    const completedStatusByVaccineId = new Map<number, ImmunisationDosageStatus>();
    for (const row of priorAdministered) {
      if (!completedStatusByVaccineId.has(row.vaccine_id)) {
        completedStatusByVaccineId.set(row.vaccine_id, row.status);
      }
    }
    if (administeredDateMap) {
      for (const row of priorAdministered) {
        const administeredDate = this.normalizeDate(row.date_administered);
        const existingDate = administeredDateMap.get(row.vaccine_id);
        if (!existingDate || administeredDate > existingDate) {
          administeredDateMap.set(row.vaccine_id, administeredDate);
        }
      }
    }
    const completedDosesByGroup =
      this.buildCompletedDosesMap(priorAdministered);
    const completedCodeDates = this.buildCompletedCodeDateMap(priorAdministered);

    for (const vaccine of vaccines) {
      const group = this.vaccineGroupKey(vaccine);
      const completed =
        completedDosesByGroup.get(group) ??
        new Map<number, { vaccineIds: Set<number>; latestDate: Date }>();

      const currentDoseInfo = completed.get(vaccine.dose_number);
      if (currentDoseInfo?.vaccineIds.has(vaccine.id)) {
        statusMap.set(vaccine.id, completedStatusByVaccineId.get(vaccine.id)!);
        continue;
      }

      if (
        vaccine.max_age_days !== null &&
        vaccine.max_age_days !== undefined &&
        ageInDays > vaccine.max_age_days
      ) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.EXPIRED);
        continue;
      }

      if (!this.ensureGenderEligibility(vaccine, patient.gender, true)) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
        continue;
      }

      if (
        vaccine.applies_to === VaccineAppliedTo.ADULT &&
        ageInDays < maxChildAgeDays
      ) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
        continue;
      }

      if (ageInDays < (vaccine.age_min_days ?? 0)) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
        continue;
      }

      const maxAgeExceeded =
        vaccine.max_age_days !== null &&
        vaccine.max_age_days !== undefined &&
        ageInDays > vaccine.max_age_days;

      if (vaccine.applies_to === VaccineAppliedTo.CHILD) {
        if (ageInDays > maxChildAgeDays || maxAgeExceeded) {
          statusMap.set(vaccine.id, ImmunisationDosageStatus.EXPIRED);
          continue;
        }

        if (
          vaccine.pre_requisite_codes?.length &&
          !this.hasAllPrerequisiteCodes(
            vaccine.pre_requisite_codes,
            completedCodeDates,
          )
        ) {
          statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
          continue;
        }

        if (vaccine.pre_requisite_codes?.length) {
          const catchUpRule = this.resolveCatchUpRule(vaccine, ageInDays);
          const latestPrerequisiteDate = this.getLatestPrerequisiteDate(
            vaccine.pre_requisite_codes,
            completedCodeDates,
          );

          if (!latestPrerequisiteDate) {
            statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
            continue;
          }

          const requiredMinDays = this.resolveNonLmpRequiredMinDays(
            vaccine,
            catchUpRule,
          );
          const daysSinceAnchor = this.calculateDaysBetween(
            latestPrerequisiteDate,
            today,
          );
          const overdueGraceDays = Math.max(
            (vaccine.age_overdue_days ?? requiredMinDays) -
              (vaccine.age_min_days ?? 0),
            0,
          );

          if (daysSinceAnchor > requiredMinDays + overdueGraceDays) {
            statusMap.set(vaccine.id, ImmunisationDosageStatus.DEFAULTER);
          } else if (daysSinceAnchor >= requiredMinDays) {
            statusMap.set(vaccine.id, ImmunisationDosageStatus.SCHEDULED);
          } else {
            statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
          }
          continue;
        }

        const hasOverdueThreshold =
          vaccine.age_overdue_days !== null && vaccine.age_overdue_days > 0;

        if (
          hasOverdueThreshold &&
          ageInDays > (vaccine.age_overdue_days ?? 0)
        ) {
          statusMap.set(vaccine.id, ImmunisationDosageStatus.DEFAULTER);
        } else if (ageInDays >= (vaccine.age_min_days ?? 0)) {
          statusMap.set(vaccine.id, ImmunisationDosageStatus.SCHEDULED);
        } else {
          statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
        }
        continue;
      }

      const catchUpRule = this.resolveCatchUpRule(vaccine, ageInDays);

      if (
        vaccine.pre_requisite_codes?.length &&
        !this.hasAllPrerequisiteCodes(
          vaccine.pre_requisite_codes,
          completedCodeDates,
        )
      ) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
        continue;
      }

      const referenceStartDate = this.resolveNonLmpReferenceStartDate(
        vaccine,
        dobDate,
        completedCodeDates,
        catchUpRule,
      );
      if (!referenceStartDate) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
        continue;
      }

      const requiredMinDays = this.resolveNonLmpRequiredMinDays(
        vaccine,
        catchUpRule,
      );
      const daysSinceAnchor = this.calculateDaysBetween(
        referenceStartDate,
        today,
      );
      const hasOverdueThreshold =
        vaccine.age_overdue_days !== null && vaccine.age_overdue_days > 0;

      if (
        hasOverdueThreshold &&
        daysSinceAnchor > (vaccine.age_overdue_days ?? 0)
      ) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.DEFAULTER);
      } else if (daysSinceAnchor >= requiredMinDays) {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.SCHEDULED);
      } else {
        statusMap.set(vaccine.id, ImmunisationDosageStatus.PENDING);
      }
    }

    return statusMap;
  }

  private calculateDaysBetween(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private calculateAgeInDays(dob: Date): number {
    return this.calculateDaysBetween(dob, new Date());
  }

  private normalizeDate(value: Date | string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date provided.');
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private vaccineGroupKey(
    v: Pick<Vaccine, 'series_name' | 'display_name' | 'code'>,
  ): string {
    return (v.series_name ?? v.display_name ?? v.code).trim().toLowerCase();
  }

  private buildScheduleDoseMap(
    rows: Array<
      Pick<Vaccine, 'id' | 'series_name' | 'display_name' | 'code' | 'dose_number'>
    >,
  ): Map<string, Map<number, Set<number>>> {
    const scheduleDoseVaccinesByGroup = new Map<
      string,
      Map<number, Set<number>>
    >();
    for (const row of rows) {
      const group = this.vaccineGroupKey(row);
      const doses =
        scheduleDoseVaccinesByGroup.get(group) ??
        new Map<number, Set<number>>();
      const ids = doses.get(row.dose_number) ?? new Set<number>();
      ids.add(row.id);
      doses.set(row.dose_number, ids);
      scheduleDoseVaccinesByGroup.set(group, doses);
    }
    return scheduleDoseVaccinesByGroup;
  }

  private buildCompletedDosesMap(
    administeredRows: Array<{
      code: string;
      display_name: string;
      series_name: string | null;
      dose_number: number;
      vaccine_id: number;
      date_administered: string;
    }>,
  ): Map<string, Map<number, { vaccineIds: Set<number>; latestDate: Date }>> {
    const completedDosesByGroup = new Map<
      string,
      Map<number, { vaccineIds: Set<number>; latestDate: Date }>
    >();
    for (const row of administeredRows) {
      const group = this.vaccineGroupKey({
        code: row.code,
        series_name: row.series_name,
        display_name: row.display_name,
      });
      const doseNo = Number(row.dose_number);
      const doseDate = this.normalizeDate(row.date_administered);
      const completed =
        completedDosesByGroup.get(group) ??
        new Map<number, { vaccineIds: Set<number>; latestDate: Date }>();
      const existing = completed.get(doseNo);
      const vaccineIds = existing?.vaccineIds ?? new Set<number>();
      vaccineIds.add(row.vaccine_id);
      const latestDate =
        existing?.latestDate && existing.latestDate > doseDate
          ? existing.latestDate
          : doseDate;
      completed.set(doseNo, { vaccineIds, latestDate });
      completedDosesByGroup.set(group, completed);
    }
    return completedDosesByGroup;
  }

  private buildCompletedCodeDateMap(
    administeredRows: Array<{
      code: string;
      date_administered: string;
    }>,
  ): Map<string, Date> {
    const completedCodeDates = new Map<string, Date>();
    for (const row of administeredRows) {
      this.recordCompletedCodeDate(
        completedCodeDates,
        row.code,
        this.normalizeDate(row.date_administered),
      );
    }
    return completedCodeDates;
  }

  private recordCompletedCodeDate(
    completedCodeDates: Map<string, Date>,
    code: string,
    date: Date,
  ) {
    const existing = completedCodeDates.get(code);
    if (!existing || date > existing) {
      completedCodeDates.set(code, date);
    }
  }

  private hasAllPrerequisiteCodes(
    codes: string[] | null | undefined,
    completedCodeDates: Map<string, Date>,
  ): boolean {
    if (!codes?.length) return true;
    return codes.every((code) => completedCodeDates.has(code));
  }

  private ensurePrerequisiteCodesCompleted(
    codes: string[] | null | undefined,
    completedCodeDates: Map<string, Date>,
    vaccineCode: string,
  ) {
    if (!codes?.length) return;
    const missing = codes.filter((code) => !completedCodeDates.has(code));
    if (missing.length) {
      throw new BadRequestException(
        `Cannot administer ${vaccineCode} before completing: ${missing.join(', ')}.`,
      );
    }
  }

  private resolveCatchUpRule(
    vaccine: Pick<
      Vaccine,
      | 'catch_up_1_to_2_mode'
      | 'catch_up_1_to_2_interval_days'
      | 'catch_up_1_to_2_note'
      | 'catch_up_above_2_mode'
      | 'catch_up_above_2_interval_days'
      | 'catch_up_above_2_note'
    >,
    ageInDays: number,
  ): {
    mode: VaccineCatchUpMode | null;
    intervalDays: number | null;
    note: string | null;
  } {
    if (ageInDays >= 365 * 2) {
      return {
        mode: vaccine.catch_up_above_2_mode ?? null,
        intervalDays: vaccine.catch_up_above_2_interval_days ?? null,
        note: vaccine.catch_up_above_2_note ?? null,
      };
    }
    if (ageInDays >= 365) {
      return {
        mode: vaccine.catch_up_1_to_2_mode ?? null,
        intervalDays: vaccine.catch_up_1_to_2_interval_days ?? null,
        note: vaccine.catch_up_1_to_2_note ?? null,
      };
    }
    return { mode: null, intervalDays: null, note: null };
  }

  private isCatchUpAllowed(mode: VaccineCatchUpMode | null): boolean {
    return !!mode && ![VaccineCatchUpMode.NOT_ALLOWED, VaccineCatchUpMode.NA].includes(mode);
  }

  private resolveNonLmpReferenceStartDate(
    vaccine: Pick<
      Vaccine,
      'applies_to' | 'dose_number' | 'pre_requisite_codes' | 'age_min_days'
    >,
    dobDate: Date,
    completedCodeDates: Map<string, Date>,
    catchUpRule: { mode: VaccineCatchUpMode | null; intervalDays: number | null },
  ): Date | null {
    if (
      [
        VaccineCatchUpMode.IMMEDIATE,
        VaccineCatchUpMode.SINGLE_DOSE,
        VaccineCatchUpMode.ON_FIRST_CONTACT,
      ].includes(catchUpRule.mode as VaccineCatchUpMode)
    ) {
      return new Date();
    }

    if (vaccine.pre_requisite_codes?.length) {
      return this.getLatestPrerequisiteDate(
        vaccine.pre_requisite_codes,
        completedCodeDates,
      );
    }

    return dobDate;
  }

  private resolveNonLmpRequiredMinDays(
    vaccine: Pick<Vaccine, 'age_min_days'>,
    catchUpRule: { mode: VaccineCatchUpMode | null; intervalDays: number | null },
  ): number {
    if (
      [
        VaccineCatchUpMode.IMMEDIATE,
        VaccineCatchUpMode.SINGLE_DOSE,
        VaccineCatchUpMode.ON_FIRST_CONTACT,
      ].includes(catchUpRule.mode as VaccineCatchUpMode)
    ) {
      return 0;
    }

    if (
      catchUpRule.mode === VaccineCatchUpMode.AFTER_INTERVAL &&
      catchUpRule.intervalDays !== null
    ) {
      return catchUpRule.intervalDays;
    }

    return vaccine.age_min_days ?? 0;
  }

  private getLatestPrerequisiteDate(
    codes: string[] | null | undefined,
    completedCodeDates: Map<string, Date>,
  ): Date | null {
    if (!codes?.length) return null;
    let latest: Date | null = null;
    for (const code of codes) {
      const current = completedCodeDates.get(code);
      if (!current) return null;
      if (!latest || current > latest) {
        latest = current;
      }
    }
    return latest;
  }

  private ensureGenderEligibility(
    vaccine: Pick<Vaccine, 'code' | 'gender_restriction'>,
    patientGender?: Gender,
    silent: boolean = false,
  ): boolean {
    const restriction = vaccine.gender_restriction ?? VaccineGenderRestriction.ANY;
    if (restriction === VaccineGenderRestriction.ANY) return true;

    const matchesFemale =
      restriction === VaccineGenderRestriction.FEMALE &&
      patientGender === Gender.FEMALE;
    const matchesMale =
      restriction === VaccineGenderRestriction.MALE &&
      patientGender === Gender.MALE;
    if (matchesFemale || matchesMale) return true;

    if (!silent) {
      throw new BadRequestException(
        `${vaccine.code} can only be administered to ${restriction.toLowerCase()} patients.`,
      );
    }
    return false;
  }

  private buildMaxAgeError(
    vaccine: Pick<Vaccine, 'code' | 'max_age_days'>,
  ): string {
    if (!vaccine.max_age_days) {
      return `${vaccine.code} is not eligible for this patient age.`;
    }
    return `${vaccine.code} cannot be administered after ${vaccine.max_age_days} days of age.`;
  }

  private describeEligibilityAnchor(
    vaccine: Pick<Vaccine, 'applies_to' | 'pre_requisite_codes'>,
    catchUpRule: { mode: VaccineCatchUpMode | null },
  ): string {
    if (
      catchUpRule.mode === VaccineCatchUpMode.AFTER_INTERVAL &&
      vaccine.pre_requisite_codes?.length
    ) {
      return 'the last prerequisite dose';
    }
    if (vaccine.applies_to === VaccineAppliedTo.ADULT && vaccine.pre_requisite_codes?.length) {
      return 'the last prerequisite dose';
    }
    return 'date of birth';
  }

  public async getAttendanceStatus(doctorId: number, facilityId: number): Promise<string> {
    const attendance = await this.attendanceRepository.findOne({
      where: { userId: doctorId, facilityId, status: AttendanceStatus.CHECKED_IN },
      order: { checkInTime: 'DESC' },
      select: ['id', 'status', 'checkInTime'],
    });
    return attendance?.status || AttendanceStatus.CHECKED_OUT;
  }
}
