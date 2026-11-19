import { MEAL_SLOTS } from '../models/types';
const string = { type: 'STRING' };
const enumeration = (values: string[]) => ({ type: 'STRING', enum: values });
const array = (items: object) => ({ type: 'ARRAY', items });
const object = (properties: Record<string, object>) => ({ type: 'OBJECT', properties, required: Object.keys(properties) });

export const advisorSchema = () => object({
  findings: array(object({ id: string,
    kind: enumeration(['recorded_diagnosis', 'patient_reported_condition', 'lab_result', 'observation', 'suspected', 'unavailable', 'safety_warning']),
    label: string, value: string, status: enumeration(['low', 'high', 'normal', 'abnormal', 'info', 'missing', 'outdated']),
    interpretation: string, source: string })),
  recommendations: array(object({ id: string, priority: { type: 'INTEGER' }, title: string, titleUr: string,
    detail: string, detailUr: string, icon: string,
    tone: enumeration(['red', 'green', 'blue', 'purple', 'orange']), evidence: array(string), basis: string })),
  plan: object({ days: { ...array(object({ day: { type: 'INTEGER' }, meals: {
    ...array(object({ slot: enumeration(MEAL_SLOTS.map((m) => m.slot)),
      items: array(object({ foodId: string, portions: { type: 'NUMBER' } })) })), minItems: 5, maxItems: 5,
  } })), minItems: 7, maxItems: 7 } }),
  handout: object({ activityGuidance: string, activityGuidanceUr: string, counselingNotes: string,
    patientNotes: string, patientNotesUr: string }),
});
