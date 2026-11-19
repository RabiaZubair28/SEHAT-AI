import { FOOD_BY_ID } from '../foods/food-library';
import { normalizePlan } from '../meal-planning/meal-planner';
import { Finding, MealPlanContent, MEAL_SLOTS, PLAN_DAYS, Recommendation } from '../models/types';

export interface AdvisorDraft {
  findings: Finding[];
  recommendations: Recommendation[];
  plan: MealPlanContent;
  handout: { activityGuidance: string; activityGuidanceUr: string; counselingNotes: string; patientNotes: string; patientNotesUr: string };
}

const HANDOUT_KEYS = ['activityGuidance', 'activityGuidanceUr', 'counselingNotes', 'patientNotes', 'patientNotesUr'] as const;
const FINDING_KINDS = ['recorded_diagnosis', 'patient_reported_condition', 'lab_result', 'observation', 'suspected', 'unavailable', 'safety_warning'] as const;
const FINDING_STATUSES = ['low', 'high', 'normal', 'abnormal', 'info', 'missing', 'outdated'] as const;
const TONES = ['red', 'green', 'blue', 'purple', 'orange'] as const;
const strings = (v: any, keys: readonly string[]) => v && keys.every((key) => typeof v[key] === 'string');
// Below this share of filled meals the model output is not a usable plan.
const MIN_FILLED_MEALS = 0.7;

/**
 * Accept the model's answer, repairing small faults (unknown foods, portions
 * out of range, malformed items) and recording each repair. Only output with
 * too little usable content is rejected.
 */
const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Undo common structural slips in model JSON: the answer split into a list of
 * pieces, handout fields left loose, a plan given as a bare list of days, or
 * days placed at the top level. Content is kept; only the wrapping changes.
 */
function restoreAnswerShape(raw: unknown, repairs: string[]): Record<string, any> {
  let v: Record<string, any>;
  if (Array.isArray(raw)) {
    v = {};
    for (const part of raw.filter(isObject)) {
      const handoutLike = HANDOUT_KEYS.some((key) => key in part) && !('handout' in part);
      if (handoutLike) v.handout = { ...(v.handout ?? {}), ...part };
      else Object.assign(v, part);
    }
    repairs.push('answer was split into pieces; reassembled');
  } else {
    v = isObject(raw) ? { ...raw } : {};
  }
  if (!v.handout && HANDOUT_KEYS.some((key) => typeof v[key] === 'string')) {
    v.handout = Object.fromEntries(HANDOUT_KEYS.map((key) => [key, v[key]]));
    repairs.push('handout fields regrouped');
  }
  if (Array.isArray(v.plan)) {
    v.plan = { days: v.plan };
    repairs.push('plan list regrouped into days');
  } else if (!v.plan && Array.isArray(v.days)) {
    v.plan = { days: v.days };
    repairs.push('days regrouped into plan');
  }
  return v;
}

export function parseAdvisorDraftWithRepairs(raw: unknown): { draft: AdvisorDraft; repairs: string[] } {
  const repairs: string[] = [];
  const v = restoreAnswerShape(raw, repairs);
  if (!Array.isArray(v.plan?.days)) throw new Error('Missing diet plan');

  // Keep any finding or recommendation with its essential text; fill secondary
  // fields with safe defaults instead of discarding otherwise good content.
  const text = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  const oneOf = <T extends string>(x: unknown, allowed: readonly T[], fallback: T): T =>
    (allowed as readonly unknown[]).includes(x) ? (x as T) : fallback;
  let defaulted = 0;
  const note = (filled: boolean) => { if (filled) defaulted++; };

  const seenFindings = new Set<string>();
  const rawFindings: any[] = Array.isArray(v.findings) ? v.findings : [];
  const findings: Finding[] = [];
  rawFindings.forEach((f, index) => {
    if (!isObject(f) || !text(f.label) || !text(f.interpretation)) return;
    let id = text(f.id) || `finding-${index + 1}`;
    if (seenFindings.has(id)) id = `${id}-${index + 1}`;
    seenFindings.add(id);
    note(!text(f.id) || !FINDING_KINDS.includes(f.kind) || !FINDING_STATUSES.includes(f.status) || !text(f.source));
    findings.push({ ...f, id, label: text(f.label), interpretation: text(f.interpretation),
      value: text(f.value), source: text(f.source) || 'patient',
      kind: oneOf(f.kind, FINDING_KINDS, 'observation'), status: oneOf(f.status, FINDING_STATUSES, 'info') });
  });
  if (rawFindings.length - findings.length) repairs.push(`${rawFindings.length - findings.length} finding(s) without text removed`);

  const seenRecs = new Set<string>();
  const rawRecs: any[] = Array.isArray(v.recommendations) ? v.recommendations : [];
  const recommendations: Recommendation[] = [];
  rawRecs.forEach((r, index) => {
    if (!isObject(r) || !text(r.title) || !text(r.detail)) return;
    let id = text(r.id) || `advice-${index + 1}`;
    if (seenRecs.has(id)) id = `${id}-${index + 1}`;
    seenRecs.add(id);
    note(!text(r.id) || !text(r.titleUr) || !text(r.detailUr) || !TONES.includes(r.tone) || !text(r.basis));
    recommendations.push({ ...r, id, title: text(r.title), detail: text(r.detail),
      // Missing Urdu stays blank for staff to complete; it must be proofread before sharing anyway.
      titleUr: text(r.titleUr), detailUr: text(r.detailUr),
      tone: oneOf(r.tone, TONES, 'blue'), basis: text(r.basis),
      icon: typeof r.icon === 'string' ? r.icon : '',
      // Models sometimes write numbers as text ("4").
      priority: Number.isFinite(Number(r.priority)) && r.priority !== '' && r.priority !== null ? Number(r.priority) : index + 1,
      // Evidence may only point at findings that survived.
      evidence: (Array.isArray(r.evidence) ? r.evidence : []).filter((e: unknown) => typeof e === 'string' && seenFindings.has(e)) });
  });
  if (rawRecs.length - recommendations.length) repairs.push(`${rawRecs.length - recommendations.length} recommendation(s) without text removed`);
  if (defaulted) repairs.push(`${defaulted} item(s) had missing details filled with defaults`);
  if (!recommendations.length) throw new Error('No usable recommendations');

  const rawItems = v.plan.days.flatMap((d: any) => (Array.isArray(d?.meals) ? d.meals : []).flatMap((m: any) => (Array.isArray(m?.items) ? m.items : [])));
  const unknownFoods = rawItems.filter((i: any) => !FOOD_BY_ID[i?.foodId]).length;
  const outOfRange = rawItems.filter((i: any) => FOOD_BY_ID[i?.foodId] && !(Number(i.portions) >= 0.5 && Number(i.portions) <= 4)).length;
  if (unknownFoods) repairs.push(`${unknownFoods} unknown food(s) removed`);
  if (outOfRange) repairs.push(`${outOfRange} portion(s) brought into the 0.5–4 serving range`);
  const plan = normalizePlan(v.plan);
  const filled = plan.days.flatMap((d) => d.meals).filter((m) => m.items.length > 0).length;
  if (filled < PLAN_DAYS * MEAL_SLOTS.length * MIN_FILLED_MEALS) throw new Error('Too few meals with valid foods');

  const handout = Object.fromEntries(HANDOUT_KEYS.map((key) => [key, typeof v.handout?.[key] === 'string' ? v.handout[key] : ''])) as AdvisorDraft['handout'];
  const missingHandout = HANDOUT_KEYS.filter((key) => typeof v.handout?.[key] !== 'string');
  if (missingHandout.length) repairs.push(`missing handout text left blank: ${missingHandout.join(', ')}`);

  return { draft: { findings, recommendations, plan, handout }, repairs };
}

/** Basic response contract needed by existing screens. */
export function parseAdvisorDraft(raw: unknown): AdvisorDraft {
  return parseAdvisorDraftWithRepairs(raw).draft;
}
