import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { PatientSearchDto } from './dto/search-patient.dto';
import { PatientSearchResultDto } from './dto/patient-search-response.dto';

@Injectable()
export class PatientsQueryService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  applyPatientFilters(
    queryBuilder: SelectQueryBuilder<Patient>,
    filters: PatientSearchDto,
  ): SelectQueryBuilder<Patient> {
    if (filters.cnic) {
      queryBuilder.andWhere('patient.cnic = :cnic', {
        cnic: filters.cnic,
      });
    }

    // ES-780: Wildcard % is intentionally not prefixed to utilize IDX_patients_first_name_lower_pattern
    // Otherwise it would do a sequential scan
    if (filters.first_name) {
      queryBuilder.andWhere('LOWER(patient.first_name) LIKE :first_name', {
        first_name: `${filters.first_name.toLowerCase()}%`,
      });
    }

    // ES-780: Wildcard % is intentionally not prefixed to utilize IDX_patients_last_name_lower_pattern
    // Otherwise it would do a sequential scan
    if (filters.last_name) {
      queryBuilder.andWhere('LOWER(patient.last_name) LIKE :last_name', {
        last_name: `${filters.last_name.toLowerCase()}%`,
      });
    }

    if (filters.phone_number) {
      const phoneWithoutDash = filters.phone_number.replace(/-/g, '');
      queryBuilder.andWhere(
        '(patient.phone_number = :phone_number OR patient.phone_number = :phone_without_dash)',
        {
          phone_number: filters.phone_number,
          phone_without_dash: phoneWithoutDash,
        },
      );
    }

    if (filters.mr_no) {
      queryBuilder.andWhere('patient.mr_no = :mr_no', {
        mr_no: filters.mr_no,
      });
    }

    if (filters.immunisation_number) {
      queryBuilder.andWhere(
        'patient.immunisation_number = :immunisation_number',
        {
          immunisation_number: filters.immunisation_number,
        },
      );
    }

    if (filters.facility_id) {
      queryBuilder.andWhere('patient.facility_id = :facility_id', {
        facility_id: filters.facility_id,
      });
    }

    return queryBuilder;
  }

  async loadPatientsWithRelations(patientIds: number[]): Promise<PatientSearchResultDto[]> {
    return this.patientRepository
      .createQueryBuilder('patient')
      .leftJoin('patient.appointments', 'appointment')
      .select([
        'patient.id',
        'patient.cnic_provider',
        'patient.mr_no',
        'patient.immunisation_number',
        'patient.first_name',
        'patient.last_name',
        'patient.cnic',
        'patient.phone_number',
        'patient.dob',
        'patient.gender',
        'patient.address',
        'patient.division_id',
        'patient.district_id',
        'patient.facility_id',
        'patient.taluka_id',
        'patient.uc_id',
        'patient.created_at',
        'patient.updated_at',
        'appointment.id',
        'appointment.status',
      ])
      .where('patient.id IN (:...patientIds)', { patientIds })
      .orderBy('patient.id', 'ASC')
      .getMany();
  }
}
