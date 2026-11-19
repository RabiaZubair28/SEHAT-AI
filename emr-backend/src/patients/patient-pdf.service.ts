import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Visit } from '../visit/entities/visit.entity';
import { MedicineVariant } from '../medicine/entities/medicine-variant.entity'; // ✅ ADD THIS
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { enrichMedicinesAdministered } from 'src/common/utils/medicine-enrichment.util';
import { Succ } from 'src/common/interfaces/success-response.interface';
import { successResponse } from 'src/common/utils/response.util';

@Injectable()
export class PatientPdfService {
  private readonly logger: Logger = new Logger(PatientPdfService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(MedicineVariant) // ✅ ADD THIS
    private readonly medicineVariantRepository: Repository<MedicineVariant>, // ✅ ADD THIS
  ) { }

  /**
   * Step 1: Get patient basic info with list of visits (lightweight)
   */
  async getPatientWithVisits(
    patientId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<Succ<any>> {
    try {
      page = Math.max(1, Number(page));
      limit = Math.max(1, Math.min(Number(limit), 100));

      const patient = await this.patientRepository.findOne({
        where: { id: patientId },
        relations: [
          'appointments',
          'appointments.visit',
          'appointments.appointmentServices',
          'appointments.appointmentServices.service'
        ],
        order: {
          appointments: {
            createdAt: 'DESC',
          },
        },
      });

      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${patientId} not found`,
        );
      }

      const visitsMap = new Map();

      patient.appointments?.forEach((appointment) => {
        const visit = appointment.visit;
        const visitId = visit?.id || appointment.id;

        if (!visitsMap.has(visitId)) {
          visitsMap.set(visitId, {
            visitId: visitId,
            visitDate: visit?.visitDate || appointment.createdAt,
            visitStatus: visit?.status || 'pending',
            createdAt: visit?.createdAt || appointment.createdAt,
            appointmentCount: 0,
            serviceNames: new Set<string>(),
          });
        }

        const visitData = visitsMap.get(visitId);

        appointment.appointmentServices?.forEach((appService: any) => {
          if (appService.service?.name) {
            visitData.serviceNames.add(appService.service.name);
          }
        });

        visitData.appointmentCount++;
      });

     const allVisits = Array.from(visitsMap.values())
    .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
    .map((visit, index) => ({
      visitId: visit.visitId,
      visitNumber: index + 1, // ✅ Sequential number per patient
      visitDate: visit.visitDate,
      visitStatus: visit.visitStatus,
      appointmentCount: visit.appointmentCount,
      services: Array.from(visit.serviceNames).join(', '),
    }))
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

      const totalVisits = allVisits.length;
      const skip = (page - 1) * limit;
      const paginatedVisits = allVisits.slice(skip, skip + limit);

      const responseData = {
        patient: this.extractPatientBasicInfo(patient),
        visits: paginatedVisits,
      };

      return successResponse(
        responseData,
        'Patient visits retrieved successfully',
        200,
        page,
        limit,
        totalVisits,
      );

    } catch (error) {
      this.logger.error(
        `Failed to get patient visits for patient ID ${patientId}`,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.F_PT_SEARCH,
      );
    }
  }

  /**
   * Step 2: Get complete visit details with all services (detailed)
   */
  async getVisitDetails(visitId: number) {
    try {
      const visit = await this.visitRepository.findOne({
        where: { id: visitId },
        relations: [
          'patient',
          'vitalAssessment',
          'appointments',
          'appointments.vitalAssessment',
          'appointments.appointmentServices',
          'appointments.appointmentServices.service',
          'appointments.appointmentServices.pregnancyInfo',
          'appointments.appointmentServices.ancMedicalSurgicalHistory',
          'appointments.appointmentServices.ancVitalAssessment',
          'appointments.appointmentServices.pncVitalAssessment',
          'appointments.appointmentServices.pncBreastfeeding',
          'appointments.appointmentServices.pncFamilyPlanning',
          'appointments.appointmentServices.pncNutrition',

          'appointments.appointmentServices.deliveryPatients',
          'appointments.appointmentServices.deliveryPatients.mother',
          'appointments.appointmentServices.deliveryPatients.child',
          
          'appointments.appointmentServices.preDeliveryAssesment',
          'appointments.appointmentServices.postDeliveryAssesment',
          'appointments.appointmentServices.newbornAssesment',
          'appointments.appointmentServices.deliveryPatients.child.immunisationsDoses',
          'appointments.appointmentServices.deliveryPatients.child.immunisationsDoses.vaccine',
          'appointments.appointmentServices.deliveryReferralDetails',
          'appointments.appointmentServices.deliveryDischargeDetails',
          //immunisations
          'appointments.appointmentServices.immunisations',
          'appointments.appointmentServices.immunisations.doses.vaccine',
          'patient.immunisationCard',
          'patient.immunisationsDoses',
          'patient.immunisationsDoses.vaccine',
          
          // family planning
          'appointments.appointmentServices.familyPlanning',
          'appointments.appointmentServices.nutritionServiceInfo',
          'appointments.appointmentServices.nutritionVitalAssessment',
          'appointments.appointmentServices.opdMedicalHistory',
          'appointments.appointmentServices.opdDiagnosis',
          'appointments.appointmentServices.opdVitals',
          'appointments.appointmentServices.diagnosis',
          'appointments.appointmentServices.prescriptions',
          'appointments.appointmentServices.prescriptions.medicineVariant',
          'appointments.appointmentServices.prescriptions.medicineVariant.medicine',
          'appointments.appointmentServices.otherPrescriptions',
          'appointments.appointmentServices.prescriptions.createdBy',
          'appointments.appointmentServices.otherPrescriptions.createdBy',
          'appointments.appointmentServices.dispenser',
          'appointments.appointmentServices.dispenser.items',
          'appointments.appointmentServices.dispenser.items.medicineVariant',
          'appointments.appointmentServices.dispenser.items.medicineVariant.medicine',
          'appointments.appointmentServices.dispenser.items.batch',
          'appointments.appointmentServices.dispenser.dispensedBy',
          'appointments.appointmentServices.dispenser.facility',
          'appointments.appointmentServices.ultrasound',
          'appointments.appointmentServices.ctg',
        ],
        order: {
          appointments: {
            createdAt: 'DESC',
          },
        },
      });

      if (!visit) {
        throw new NotFoundException(
          `Visit with ID ${visitId} not found`,
        );
      }

      const patientBasicInfo = visit.patient ? this.extractPatientBasicInfo(visit.patient) : null;

      // ✅ CHANGED: Use Promise.all to await groupServicesByType
      const appointments = await Promise.all(
        (visit.appointments || []).map(async (appointment) => ({
          appointmentId: appointment.id,
          appointmentDate: appointment.createdAt,
          appointmentStatus: appointment.status,
          tokenNumber: appointment.token_number,
          vitalAssessment: this.deepCleanObject(appointment.vitalAssessment),
          services: await this.groupServicesByType(appointment.appointmentServices || []),
        }))
      );

      return {
        success: true,
        message: 'Visit details retrieved successfully',
        data: {
          visitId: visit.id,
          visitDate: visit.visitDate,
          visitStatus: visit.status,
          vitalAssessment: this.deepCleanObject(visit.vitalAssessment),
          createdAt: visit.createdAt,
          updatedAt: visit.updatedAt,
          patient: patientBasicInfo,
          appointments: appointments,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get visit details for visit ID ${visitId}`,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.F_PT_SEARCH,
      );
    }
  }

  private deepCleanObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCleanObject(item));
    }
    if (obj instanceof Date) {
      return obj;
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveField(key)) {
        continue;
      }
      if (value && typeof value === 'object') {
        cleaned[key] = this.deepCleanObject(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'accessToken', 'access_token', 'token', 'refreshToken', 'refresh_token',
      'email', 'createdBy', 'updatedBy', 'deletedBy', 'createdById', 'updatedById', 'deletedById',
      'created_by', 'updated_by', 'deleted_by', 'created_by_id', 'updated_by_id', 'deleted_by_id',
    ];
    return sensitiveFields.includes(fieldName);
  }

  private cleanUserObject(user: any): any {
    if (!user) return null;
    const safeFields = ['id', 'first_name', 'last_name', 'fullName', 'role', 'designation', 'status'];
    const cleaned: any = {};
    for (const field of safeFields) {
      if (user[field] !== undefined) {
        cleaned[field] = user[field];
      }
    }
    if (user.first_name && user.last_name && !cleaned.fullName) {
      cleaned.fullName = `${user.first_name} ${user.last_name}`;
    }
    return cleaned;
  }

  private extractPatientBasicInfo(patient: Patient) {
    return {
      mrNo: patient.mr_no,
      firstName: patient.first_name,
      lastName: patient.last_name,
      fullName: `${patient.first_name} ${patient.last_name}`,
      cnic: patient.cnic,
      cnicProvider: patient.cnic_provider,
      dateOfBirth: patient.dob,
      age: this.calculateAge(patient.dob),
      gender: patient.gender,
      phoneNumber: patient.phone_number,
      address: patient.address,
      immunisationNumber: patient.immunisation_number,
    };
  }

  // ✅ CHANGED: Made async to handle medicine fetching
  private async groupServicesByType(appointmentServices: any[]) {
    const grouped = {
      ANC: [],
      PNC: [],
      IMMUNISATION: [],
      DELIVERY: [],
      FAMILY_PLANNING: [],
      NUTRITION: [],
      OPD: [],
      MEDICINE_DISPENSING: [],
    };

    for (const appService of appointmentServices) {
      const serviceType = appService.service?.name;

      if (grouped[serviceType]) {
        const cleanedService = this.deepCleanObject(appService);

        // ✅ FETCH MEDICINE DETAILS FOR POST-DELIVERY ASSESSMENT
        if (cleanedService.postDeliveryAssesment?.medicinesAdministered) {
          cleanedService.postDeliveryAssesment.medicinesAdministered =
            await enrichMedicinesAdministered(
              this.medicineVariantRepository,
              cleanedService.postDeliveryAssesment.medicinesAdministered
            );
        }

        // ✅ FETCH MEDICINE DETAILS FOR NEWBORN ASSESSMENT
        if (cleanedService.newbornAssesment && Array.isArray(cleanedService.newbornAssesment)) {
          for (const newborn of cleanedService.newbornAssesment) {
            if (newborn.medicinesAdministered) {
              newborn.medicinesAdministered = await enrichMedicinesAdministered(
                this.medicineVariantRepository,
                newborn.medicinesAdministered
              );
            }
          }
        }

        if (cleanedService.prescriptions && Array.isArray(cleanedService.prescriptions)) {
          cleanedService.prescriptions = cleanedService.prescriptions.map((prescription: any) => {
            if (prescription.createdBy) {
              prescription.createdBy = this.cleanUserObject(prescription.createdBy);
            }
            return prescription;
          });
        }

        if (cleanedService.otherPrescriptions && Array.isArray(cleanedService.otherPrescriptions)) {
          cleanedService.otherPrescriptions = cleanedService.otherPrescriptions.map((prescription: any) => {
            if (prescription.createdBy) {
              prescription.createdBy = this.cleanUserObject(prescription.createdBy);
            }
            return prescription;
          });
        }

        const sensitiveFields = this.getSensitiveFields();
        this.removeSensitiveFieldsDeeply(cleanedService, sensitiveFields);

        grouped[serviceType].push(cleanedService);
      }
    }

    return Object.entries(grouped)
      .filter(([_, services]) => services.length > 0)
      .reduce((acc, [type, services]) => {
        acc[type] = services;
        return acc;
      }, {});
  }


  private getSensitiveFields(): string[] {
    return [
      'password', 'accessToken', 'access_token', 'token', 'refreshToken', 'refresh_token',
      'email', 'createdBy', 'updatedBy', 'deletedBy', 'createdById', 'updatedById', 'deletedById',
      'created_by', 'updated_by', 'deleted_by', 'created_by_id', 'updated_by_id', 'deleted_by_id',
    ];
  }

  private removeSensitiveFieldsDeeply(obj: any, sensitiveFields: string[]): void {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(item => this.removeSensitiveFieldsDeeply(item, sensitiveFields));
      return;
    }
    for (const field of sensitiveFields) {
      if (obj[field] !== undefined) {
        delete obj[field];
      }
    }
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object') {
        this.removeSensitiveFieldsDeeply(value, sensitiveFields);
      }
    }
  }

  private calculateAge(dob: Date): number {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}