import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyPatient } from './entities/emergency-patient.entity';
import { EmergencyVital } from './entities/emergency-vital.entity';
import { EmergencyOutcome } from './entities/emergency-outcome.entity';
import { CreateEmergencyDto } from './dto/create-emergency.dto';

import { successResponse } from 'src/common/utils/response.util';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { Facility } from 'src/facilities/entities/facility.entity';
import { District } from 'src/districts/entities/district.entity';
import { generateErNo } from 'src/common/helper';
import { PaginationDto } from 'src/common/utils/pagination.dto';

import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { User } from 'src/users/entities/user.entity';
import { PatientRollupService } from 'src/patients/patient-rollup.service';

export class EmergencySearchDto extends PaginationDto {
  startDate?: string;
  endDate?: string;
  search?: string;
}

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(
    @InjectRepository(EmergencyPatient)
    private readonly patientRepo: Repository<EmergencyPatient>,

    private readonly serviceUtility: ServiceUtility,
    private readonly patientRollupService: PatientRollupService,
  ) {}

  async create(createDto: CreateEmergencyDto, request: any) {
    const queryRunner = this.patientRepo.manager.connection.createQueryRunner();

    try {
      const jwtPayload = request.user;
      const userId = jwtPayload?.sub || jwtPayload?.id;

      if (!userId) {
        throw new UnauthorizedException(
          'Unable to determine user ID from token',
        );
      }

      // Establish connection and start transaction
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const facility = await queryRunner.manager.findOne(Facility, {
          where: { id: createDto.patient.facility_id },
        });

        if (!facility) {
          throw new NotFoundException('Facility not found');
        }

        // ER number generation
        const generatedErNo = generateErNo(facility.id);

        const doctor = await queryRunner.manager.findOne(User, {
          where: { id: userId },
        });

        if (!doctor) {
          throw new NotFoundException(
            `User with ID ${userId} not found in database`,
          );
        }

        const medicineAdministered =
          createDto.medicines_administered &&
          createDto.medicines_administered.length > 0;

        // Create patient entity
        const patient = this.patientRepo.create({
          first_name: createDto.patient.first_name,
          last_name: createDto.patient.last_name,
          identity_provider: createDto.patient.identity_provider,
          other_identity_provider: createDto.patient.other_identity_provider,
          nationality_status: createDto.patient.nationality_status,
          cnic: createDto.patient.cnic,
          international_id: createDto.patient.international_id,
          mobile_no: createDto.patient.mobile_no,
          age: createDto.patient.age,
          gender: createDto.patient.gender,
          blood_group: createDto.patient.blood_group,
          service_required: createDto.patient.service_required,
          other_service: createDto.patient.other_service,
          presenting_complaint: createDto.patient.presenting_complaint,
          past_medical_history: createDto.patient.past_medical_history,
          facility,
          doctor,
          doctorId: doctor.id,
          medicine_administered: medicineAdministered,
          er_no: generatedErNo,
        });

        // Create vitals if provided and link to patient
        if (createDto.vitals) {
          const vital = new EmergencyVital();
          vital.temperature = createDto.vitals.temperature;
          vital.pulse = createDto.vitals.pulse;
          vital.systolic_bp = createDto.vitals.systolic_bp;
          vital.diastolic_bp = createDto.vitals.diastolic_bp;
          vital.respiratory_rate = createDto.vitals.respiratory_rate;
          vital.spo2 = createDto.vitals.spo2;
          vital.patient = patient;
          patient.vitals = vital;
        }

        // Create outcome if provided and link to patient
        if (createDto.outcome) {
          const [district, referralFacility] = await Promise.all([
            createDto.outcome.district_id
              ? queryRunner.manager
                  .findOne(District, {
                    where: { id: createDto.outcome.district_id },
                  })
                  .then((d) => d ?? null)
              : Promise.resolve(null),
            createDto.outcome.facility_id
              ? queryRunner.manager
                  .findOne(Facility, {
                    where: { id: createDto.outcome.facility_id },
                  })
                  .then((f) => f ?? null)
              : Promise.resolve(null),
          ]);

          const outcome = new EmergencyOutcome();
          outcome.outcome = createDto.outcome.outcome;
          outcome.district = district ?? undefined;
          outcome.facility = referralFacility ?? undefined;
          outcome.level_of_care = createDto.outcome.level_of_care;
          outcome.type_of_service = createDto.outcome.type_of_service;
          outcome.other_service = createDto.outcome.other_service;
          outcome.reason_of_referral = createDto.outcome.reason_of_referral;
          outcome.patient = patient; // Link to patient
          patient.outcome = outcome; // Bidirectional relationship
        }

        const savedPatient = await queryRunner.manager.save(patient);
        await this.patientRollupService.incrementForCreatedEmergencyPatient(
          savedPatient.id,
          queryRunner.manager,
        );

        if (medicineAdministered) {
          await this.serviceUtility.savePrescriptionsAndDispenseForEmergency(
            createDto.medicines_administered!,
            savedPatient,
            userId,
            request,
            queryRunner.manager,
          );
        }

        await queryRunner.commitTransaction();

        // Fetch complete patient with relations
        const completePatient = await this.patientRepo.findOne({
          where: { id: savedPatient.id },
          relations: [
            'vitals',
            'outcome',
            'outcome.district',
            'outcome.facility',
            'facility',
            'doctor',
            'prescriptions',
            'prescriptions.medicineVariant',
          ],
        });

        return successResponse(
          completePatient,
          'Emergency patient created successfully',
          201,
        );
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to create emergency patient', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to create emergency patient',
      );
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findByDoctorId(doctorId: number, filters: PaginationDto) {
    try {
      const doctor = await this.patientRepo.manager.findOne(User, {
        where: { id: doctorId },
      });

      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
      }

      const [data, count] = await this.patientRepo.findAndCount({
        where: { doctorId: doctorId },
        relations: [
          'vitals',
          'outcome',
          'outcome.district',
          'outcome.facility',
          'facility',
          'doctor',
          'prescriptions',
          'prescriptions.medicineVariant',
        ],
        take: filters.limit,
        skip: (filters.page - 1) * filters.limit,
        order: { created_at: 'DESC' },
      });

      return successResponse(
        data,
        `Emergency patients for doctor ID ${doctorId} fetched successfully`,
        200,
        filters.page,
        filters.limit,
        count,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch emergency patients by doctor',
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch emergency patients by doctor',
      );
    }
  }

  async findAll(filters: PaginationDto) {
    try {
      const [data, count] = await this.patientRepo.findAndCount({
        relations: [
          'vitals',
          'outcome',
          'facility',
          'doctor', // Include doctor
          'prescriptions',
          'prescriptions.medicineVariant',
        ],
        take: filters.limit,
        skip: (filters.page - 1) * filters.limit,
        order: { created_at: 'DESC' },
      });

      return successResponse(
        data,
        'Emergency patients fetched successfully',
        200,
        filters.page,
        filters.limit,
        count,
      );
    } catch (error) {
      this.logger.error('Failed to fetch emergency patients', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch emergency patients',
      );
    }
  }
}
