import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { ServiceType } from 'src/common/enums/enums';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { CreateNutritionDto } from 'src/nutrition/dto/create-nutrition.dto';
import {
  ClinicalContext,
  MedicationContext,
  MedicationItem,
  RecordedDiagnosis,
} from '@health-advisor/modules/nutrition-advisor/assessment/clinical-assessment';
import { SourcedValue } from '@health-advisor/modules/nutrition-advisor/models/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const VITALS_STALE_DAYS = 30;
const LAB_STALE_DAYS = 90;

export interface AdvisorUser {
  sub: number;
  role?: string;
  facilityId?: number | null;
}

export interface NutritionEncounter {
  appointmentService: AppointmentService;
  patientId: number;
  patient: {
    name: string;
    mrNo: string;
    ageYears: number;
    sex: 'Male' | 'Female' | 'Other';
    phone: string | null;
  };
}

const ageInYears = (dob: Date | string) => {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
};

const sourced = <T = number>(
  value: T | null | undefined,
  unit: string | undefined,
  source: string,
  recordedAt: Date | string | null | undefined,
  staleDays = VITALS_STALE_DAYS,
): SourcedValue<T> => {
  const date = recordedAt ? new Date(recordedAt) : null;
  const missing = value === null || value === undefined || (typeof value === 'number' && value === 0);
  return {
    value: missing ? null : (value as T),
    unit,
    source,
    recordedAt: date ? date.toISOString() : null,
    isMissing: missing,
    isOutdated: !missing && !!date && Date.now() - date.getTime() > staleDays * DAY_MS,
  };
};

/**
 * Reads the current patient and encounter for the Advisor. It only reads
 * existing EMR records; it never creates enrolments or changes them (NA-02).
 */
@Injectable()
export class NutritionAdvisorContextService {
  constructor(
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepo: Repository<AppointmentService>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(OtherPrescription)
    private readonly otherPrescriptionRepo: Repository<OtherPrescription>,
    @InjectRepository(MedicineVariant)
    private readonly medicineVariantRepo: Repository<MedicineVariant>,
  ) {}

  /** NA-01 / SH-01: Nutrition enrolment in this encounter, at the user's facility. */
  async loadEncounter(appointmentServiceId: number, user: AdvisorUser): Promise<NutritionEncounter> {
    const appointmentService = await this.appointmentServiceRepo.findOne({
      where: { id: appointmentServiceId },
      relations: {
        service: true,
        appointment: { patient: true, facility: true, vitalAssessment: true },
        nutritionVitalAssessment: true,
        nutritionServiceInfo: true,
      },
    });
    if (!appointmentService || appointmentService.service?.name !== ServiceType.NUTRITION) {
      throw new NotFoundException('This patient is not enrolled in the Nutrition service for this visit.');
    }
    const facilityId = appointmentService.appointment?.facility?.id;
    if (user.facilityId && facilityId && user.facilityId !== facilityId) {
      throw new ForbiddenException('This Nutrition encounter belongs to another facility.');
    }
    const p = appointmentService.appointment.patient;
    return {
      appointmentService,
      patientId: p.id,
      patient: {
        name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
        mrNo: p.mr_no,
        ageYears: ageInYears(p.dob),
        sex: (p.gender as any) ?? 'Other',
        phone: p.phone_number ?? null,
      },
    };
  }

  async buildClinicalContext(encounter: NutritionEncounter, draft?: CreateNutritionDto): Promise<ClinicalContext> {
    const as = encounter.appointmentService;
    // The unsaved Nutrition form, when given, wins over what was saved earlier.
    const nv = draft?.vitalAssessment
      ? { ...(as.nutritionVitalAssessment ?? {}), ...draft.vitalAssessment }
      : as.nutritionVitalAssessment;
    const gv = as.appointment?.vitalAssessment;
    const nvDate = draft?.vitalAssessment ? new Date() : as.createdAt;
    const gvDate = as.appointment?.createdAt;
    const NUTRITION_SRC = 'Nutrition › Vitals & Assessment';
    const VITALS_SRC = 'Visit vitals';

    // Prefer the Nutrition tab's measurements; fall back to visit vitals.
    const pick = (nKey: string, gKey: string, unit: string, convert = (v: number) => v) => {
      const nVal = (nv as any)?.[nKey];
      if (nVal) return sourced(convert(Number(nVal)), unit, NUTRITION_SRC, nvDate);
      const gVal = (gv as any)?.[gKey];
      return sourced(gVal ? convert(Number(gVal)) : null, unit, VITALS_SRC, gvDate);
    };
    const inchesToCm = (v: number) => Number((v * 2.54).toFixed(1));

    const [haemoglobin, pregnancyStatus, history, medications] = await Promise.all([
      this.latestHaemoglobin(encounter.patientId),
      this.pregnancyStatus(encounter.patientId, encounter.patient.sex),
      this.latestOpdHistory(encounter.patientId),
      this.medications(encounter, draft),
    ]);

    return {
      patient: { ageYears: encounter.patient.ageYears, sex: encounter.patient.sex },
      measurements: {
        weightKg: pick('weight', 'weight', 'kg'),
        heightCm: pick('height', 'height', 'cm', inchesToCm),
        bmi: sourced(gv?.body_mass_index ? Number(gv.body_mass_index) : null, 'kg/m²', VITALS_SRC, gvDate),
        systolicBp: pick('systolic_bp', 'systolic_bp', 'mmHg'),
        diastolicBp: pick('diastolic_bp', 'diastolic_bp', 'mmHg'),
        pulse: pick('pulse', 'pulse', 'bpm'),
        temperatureF: pick('temperature', 'temperature', '°F'),
        muacCm: sourced(nv?.muac ? Number(nv.muac) : null, 'cm', NUTRITION_SRC, nvDate),
        spo2: sourced(gv?.spo2 ? Number(gv.spo2) : null, '%', VITALS_SRC, gvDate),
        edema: sourced<string>(nv?.edema ?? null, undefined, NUTRITION_SRC, nvDate),
      },
      labs: { haemoglobin },
      screening: {
        clinicalPallor: sourced<boolean>(gv?.is_anemic ?? null, undefined, 'Visit vitals › General screening', gvDate),
        complications: sourced<string[]>(nv?.is_experiencing_complications ? (nv.complications ?? []) : [], undefined, NUTRITION_SRC, nvDate),
      },
      diagnoses: history.diagnoses,
      recordedAllergies: history.allergies,
      pregnancyStatus,
      medications,
    };
  }

  /**
   * Medicines and supplements from the Nutrition "Supplements" tab: the unsaved
   * form when the worker is still filling it, otherwise the saved encounter.
   */
  private async medications(encounter: NutritionEncounter, draft?: CreateNutritionDto): Promise<MedicationContext> {
    const SRC = 'Nutrition › Supplements';
    const variantName = (v?: MedicineVariant | null) =>
      v?.medicine ? `${v.medicine.name}${v.strength ? ` ${v.strength}${v.unit ?? ''}` : ''}` : null;
    const item = (name: string | null, dosage?: string | null, instruction?: string | null): MedicationItem[] =>
      name ? [{ name, dosage: dosage ?? null, instruction: instruction ?? null, source: SRC }] : [];

    if (draft) {
      const prescriptions = draft.prescribing_supplements ? draft.prescriptions ?? [] : [];
      const ids = prescriptions.map((p) => p.medicine_variant_id);
      const variants = ids.length ? await this.medicineVariantRepo.find({ where: { id: In(ids) } }) : [];
      const byId = new Map(variants.map((v) => [v.id, v]));
      const items = [
        ...prescriptions.flatMap((p) => item(variantName(byId.get(p.medicine_variant_id)), p.medicineDosage, p.medicineInstruction)),
        ...(draft.otherPrescriptions ?? []).flatMap((p) => item(p.name, p.medicineDosage, p.medicineInstruction)),
      ];
      return { given: draft.prescribing_supplements || items.length > 0, items };
    }

    const where = { appointmentService: { id: encounter.appointmentService.id } };
    const [prescriptions, others] = await Promise.all([
      this.prescriptionRepo.find({ where }),
      this.otherPrescriptionRepo.find({ where }),
    ]);
    const items = [
      ...prescriptions.flatMap((p) => item(variantName(p.medicineVariant), p.medicineDosage, p.medicineInstruction)),
      ...others.flatMap((p) => item(p.name, p.medicineDosage, p.medicineInstruction)),
    ];
    // A saved Nutrition record with no prescriptions means none were given.
    const recorded = !!encounter.appointmentService.nutritionServiceInfo;
    return { given: items.length > 0 ? true : recorded ? false : null, items };
  }

  private async latestHaemoglobin(patientId: number): Promise<SourcedValue> {
    const row = await this.appointmentServiceRepo
      .createQueryBuilder('as')
      .innerJoin('as.appointment', 'appointment')
      .leftJoinAndSelect('as.ancVitalAssessment', 'anc')
      .leftJoinAndSelect('as.pncVitalAssessment', 'pnc')
      .innerJoinAndSelect('as.service', 'service')
      .where('appointment.patient_id = :patientId', { patientId })
      .andWhere('(anc.haemoglobin IS NOT NULL OR pnc.haemoglobin IS NOT NULL)')
      .orderBy('as.createdAt', 'DESC')
      .getOne();
    if (!row) return sourced<number>(null, 'g/dL', 'No lab result on record', null);
    const value = row.ancVitalAssessment?.haemoglobin ?? (row as any).pncVitalAssessment?.haemoglobin;
    return sourced(Number(value), 'g/dL', `${row.service.name} › Haemoglobin`, row.createdAt, LAB_STALE_DAYS);
  }

  private async pregnancyStatus(patientId: number, sex: string): Promise<ClinicalContext['pregnancyStatus']> {
    if (sex !== 'Female') return null;
    const rows = await this.appointmentServiceRepo
      .createQueryBuilder('as')
      .innerJoin('as.appointment', 'appointment')
      .innerJoinAndSelect('as.service', 'service')
      .where('appointment.patient_id = :patientId', { patientId })
      .andWhere('service.name IN (:...names)', { names: [ServiceType.ANC, ServiceType.DELIVERY, ServiceType.PNC] })
      .andWhere('as.createdAt > :since', { since: new Date(Date.now() - 280 * DAY_MS) })
      .orderBy('as.createdAt', 'DESC')
      .getMany();
    const latest = rows[0];
    if (!latest) return null;
    const recordedAt = latest.createdAt?.toISOString() ?? null;
    if (latest.service.name === ServiceType.ANC) {
      return { status: 'pregnant', source: 'ANC visit', recordedAt };
    }
    if (Date.now() - new Date(latest.createdAt).getTime() < 183 * DAY_MS) {
      return { status: 'lactating', source: `${latest.service.name} visit`, recordedAt };
    }
    return null;
  }

  private async latestOpdHistory(patientId: number): Promise<{ diagnoses: RecordedDiagnosis[]; allergies: string[] }> {
    const row = await this.appointmentServiceRepo
      .createQueryBuilder('as')
      .innerJoin('as.appointment', 'appointment')
      .innerJoinAndSelect('as.opdMedicalHistory', 'history')
      .leftJoinAndSelect('as.opdDiagnosis', 'diagnosis')
      .where('appointment.patient_id = :patientId', { patientId })
      .orderBy('as.createdAt', 'DESC')
      .getOne();
    if (!row) return { diagnoses: [], allergies: [] };
    const recordedAt = row.createdAt?.toISOString() ?? null;
    const diagnoses: RecordedDiagnosis[] = (row.opdMedicalHistory?.associatedConditions ?? []).map((label) => ({
      label,
      source: 'OPD › Medical history',
      recordedAt,
    }));
    for (const label of row.opdDiagnosis?.finalDiagnosis ?? []) {
      diagnoses.push({ label, source: 'OPD › Final diagnosis', recordedAt });
    }
    const allergies = row.opdMedicalHistory?.known_allergies ? (row.opdMedicalHistory.allergy ?? []) : [];
    return { diagnoses, allergies };
  }
}
