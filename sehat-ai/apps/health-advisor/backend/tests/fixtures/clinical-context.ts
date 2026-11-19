import { ClinicalContext } from '../../src/modules/nutrition-advisor/assessment/clinical-assessment';
import { SourcedValue } from '../../src/modules/nutrition-advisor/models/types';

export const sv = <T = number>(value: T | null, unit?: string): SourcedValue<T> => ({
  value,
  unit,
  source: 'test',
  recordedAt: new Date().toISOString(),
  isOutdated: false,
  isMissing: value == null,
});

export const baseContext = (overrides: Partial<ClinicalContext> = {}): ClinicalContext => ({
  patient: { ageYears: 35, sex: 'Male' },
  measurements: {
    weightKg: sv(80, 'kg'),
    heightCm: sv(150, 'cm'),
    bmi: sv<number>(null),
    systolicBp: sv(120, 'mmHg'),
    diastolicBp: sv(80, 'mmHg'),
    pulse: sv(76, 'bpm'),
    temperatureF: sv(98.6, '°F'),
    muacCm: sv<number>(null),
    spo2: sv<number>(null),
    edema: sv<string>('No edema'),
  },
  labs: { haemoglobin: sv(9.5, 'g/dL') },
  screening: { clinicalPallor: sv<boolean>(null), complications: sv<string[]>([]) },
  diagnoses: [],
  recordedAllergies: [],
  pregnancyStatus: null,
  ...overrides,
});
