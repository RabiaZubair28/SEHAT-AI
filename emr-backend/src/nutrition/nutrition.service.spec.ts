import { NutritionService } from './nutrition.service';
import { PatientStatus } from '../common/enums/enums';
import { NutritionVitalAssessment } from './entities/nutrition-vital-assessment.entity';

describe('Nutrition saves for partially completed encounters', () => {
  const setup = (existing: any) => {
    const encounter: any = { id: 3, status: PatientStatus.IN_PROGRESS };
    const manager: any = {
      create: jest.fn((entity, values) => ({ ...values })),
      save: jest.fn(async (value) => value),
      findOne: jest.fn(async () => encounter),
    };
    const repo: any = { findOne: jest.fn(async () => existing),
      manager: { transaction: jest.fn(async (work) => work(manager)) } };
    const utility: any = {
      validateAppointment: jest.fn(async () => ({ id: 3, patient: { id: 5, gender: 'Male', dob: '1990-01-01' } })),
      validatePatientAccess: jest.fn(), getServiceByType: jest.fn(async () => ({ id: 7 })),
      validateAndGetAppointmentService: jest.fn(async () => encounter),
    };
    const service = new NutritionService(repo, utility);
    const save = () => service.create({ appointment_id: 3, prescribing_supplements: false,
      serviceInfo: { patient_coming_from: 'Refer by LHW', reason_for_admission: 'Other', counselled_on_nutrition_and_diet: false },
      vitalAssessment: { weight: 70, height: 67, muac: 24 },
    } as any, { user: { sub: 1 } } as any);
    return { manager, encounter, save };
  };

  it('reuses a saved vitals row and creates missing admission details', async () => {
    const vitals = { id: 2, weight: 60 };
    const { manager, encounter, save } = setup({ status: PatientStatus.IN_PROGRESS, nutritionVitalAssessment: vitals });
    await save();
    expect(encounter.nutritionVitalAssessment).toBe(vitals);
    expect(encounter.nutritionVitalAssessment).toMatchObject({ id: 2, weight: 70 });
    expect(manager.create.mock.calls.some(([entity]) => entity === NutritionVitalAssessment)).toBe(false);
    expect(encounter.nutritionServiceInfo.patient_coming_from).toBe('Refer by LHW');
    expect(encounter.status).toBe(PatientStatus.COMPLETED);
  });

  it('reuses both saved child rows without creating duplicates', async () => {
    const { manager, encounter, save } = setup({ status: PatientStatus.IN_PROGRESS,
      nutritionServiceInfo: { id: 1 }, nutritionVitalAssessment: { id: 2 } });
    await save();
    expect(manager.create).not.toHaveBeenCalled();
    expect(encounter.nutritionServiceInfo.id).toBe(1);
  });

  it('still rejects creation for a completed record', async () => {
    const { manager, save } = setup({ status: PatientStatus.COMPLETED });
    await expect(save()).rejects.toThrow('Nutrition record already exists');
    expect(manager.save).not.toHaveBeenCalled();
  });
});
