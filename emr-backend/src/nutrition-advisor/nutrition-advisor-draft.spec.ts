import { NutritionAdvisorService } from './nutrition-advisor.service';
import { DEFAULT_PREFERENCES } from '@health-advisor/modules/nutrition-advisor/models/types';
import { baseContext, sv } from '../../../sehat-ai/apps/health-advisor/backend/tests/fixtures/clinical-context';

describe('Generate from unsaved Nutrition form details', () => {
  const setup = () => {
    const encounter: any = { patient: { ageYears: 35, sex: 'Male' },
      appointmentService: { id: 3, status: 'in_progress', appointment: { id: 3 } } };
    const context = { loadEncounter: jest.fn(async () => encounter), buildClinicalContext: jest.fn(async (_encounter: any) => baseContext()) };
    const ai = { draftAdvisor: jest.fn<Promise<any>, any[]>(async () => { throw new Error('model reached'); }) };
    const repo = { create: jest.fn(value => value), save: jest.fn() };
    const service = new NutritionAdvisorService(repo as any, {} as any, {} as any, context as any, ai as any, {} as any);
    const input: any = { appointment_id: 3, prescribing_supplements: false,
      serviceInfo: { patient_coming_from: 'Refer by LHW', reason_for_admission: 'Other', counselled_on_nutrition_and_diet: false },
      vitalAssessment: { weight: 70, height: 67, temperature: 98.6, pulse: 75, systolic_bp: 120,
        diastolic_bp: 80, edema: 'No edema', is_experiencing_complications: false },
    };
    return { encounter, context, ai, repo, service, input };
  };
  it('reaches AI using form inputs without completing the encounter', async () => {
    const { encounter, context, ai, repo, service, input } = setup();
    await expect(service.generatePlan(3, { preferences: DEFAULT_PREFERENCES, nutritionInput: input }, { sub: 1 })).rejects.toThrow('model reached');
    expect(context.buildClinicalContext.mock.calls[0][0].appointmentService.nutritionVitalAssessment).toEqual(input.vitalAssessment);
    expect(encounter.appointmentService.status).toBe('in_progress');
    expect(ai.draftAdvisor).toHaveBeenCalledTimes(1);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('rejects form details for a different encounter before calling AI', async () => {
    const { service, input, ai } = setup(); input.appointment_id = 99;
    await expect(service.generatePlan(3, { preferences: DEFAULT_PREFERENCES, nutritionInput: input }, { sub: 1 })).rejects.toThrow('different encounter');
    expect(ai.draftAdvisor).not.toHaveBeenCalled();
  });
  it('still blocks missing mandatory inputs', async () => {
    const { service, input, ai } = setup(); delete input.serviceInfo.reason_for_admission;
    await expect(service.generatePlan(3, { preferences: DEFAULT_PREFERENCES, nutritionInput: input }, { sub: 1 })).rejects.toThrow('required Nutrition fields');
    expect(ai.draftAdvisor).not.toHaveBeenCalled();
  });
  it('calls AI for moderate oedema and liver disease instead of blocking generation', async () => {
    const { service, input, context, ai, encounter } = setup();
    input.vitalAssessment.edema = 'Moderate';
    context.buildClinicalContext.mockResolvedValue(baseContext({
      measurements: { ...baseContext().measurements, edema: sv('Moderate') },
    }));
    const preferences = { ...DEFAULT_PREFERENCES, healthConditions: ['liver_disease' as const], allergies: ['egg' as const] };
    await expect(service.generatePlan(3, { preferences, nutritionInput: input }, { sub: 1 })).rejects.toThrow('model reached');
    expect(ai.draftAdvisor).toHaveBeenCalledWith(
      expect.objectContaining({ measurements: expect.objectContaining({ edema: expect.objectContaining({ value: 'Moderate' }) }) }),
      expect.objectContaining({ targets: null, eligibility: expect.objectContaining({ status: 'held' }) }),
      expect.objectContaining({ healthConditions: ['liver_disease'], allergies: ['egg'] }),
    );
    expect(encounter.appointmentService.status).toBe('in_progress');
  });
  it.each(['download', 'whatsapp'])('prevents %s before doctor approval', async channel => {
    const { service } = setup();
    jest.spyOn(service as any, 'loadPlan').mockResolvedValue({ id: 1, status: 'pending_review' });
    jest.spyOn(service as any, 'assertLatest').mockResolvedValue(undefined);
    await expect(service.createDelivery(1, { channel } as any, undefined, { sub: 1 })).rejects.toThrow('Only an approved plan');
  });
  it('persists a successful high-review response as a draft with review flags and no routine targets', async () => {
    const { service, input, context, ai, repo, encounter } = setup();
    context.buildClinicalContext.mockResolvedValue(baseContext({
      measurements: { ...baseContext().measurements, edema: sv('Moderate') },
    }));
    ai.draftAdvisor.mockResolvedValue({ findings: [], recommendations: [], plan: { days: [] },
      handout: { activityGuidance: '', activityGuidanceUr: '', counselingNotes: 'Doctor review required', patientNotes: '', patientNotesUr: '' },
      generation: { provider: 'groq', model: 'test-model' }, generatedBy: 'ai:test-model', note: null });
    repo.save.mockImplementation(async plan => ({ ...plan, id: 12 }));
    jest.spyOn(service as any, 'latestPlan').mockResolvedValue(null);
    jest.spyOn(service as any, 'loadPlan').mockResolvedValue({ id: 12 });
    jest.spyOn(service as any, 'describePlan').mockResolvedValue({});
    jest.spyOn(service as any, 'log').mockResolvedValue(undefined);
    await service.generatePlan(3, { preferences: { ...DEFAULT_PREFERENCES, healthConditions: ['liver_disease'] }, nutritionInput: input }, { sub: 1 });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'draft', contextSnapshot: expect.objectContaining({ targets: null,
        clinicalReview: expect.objectContaining({ required: true, individualized: true }) }),
      handout: expect.objectContaining({ followUpDate: null }),
    }));
    expect(encounter.appointmentService.status).toBe('in_progress');
  });
});
