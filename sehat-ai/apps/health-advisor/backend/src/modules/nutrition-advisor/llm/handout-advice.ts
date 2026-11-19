import { FOOD_BY_ID } from '../foods/food-library';
import { AdvisorPreferences, Finding, Recommendation } from '../models/types';
import { AdvisorDraft } from './response';

const ALLERGEN_WORDS: Record<string, string[]> = {
  egg: ['egg'],
  dairy: ['dairy', 'milk'],
  gluten: ['gluten', 'wheat'],
  fish: ['fish'],
  peanut: ['peanut'],
  tree_nut: ['tree nut', 'almond', 'nut'],
};

// Sentences telling the patient to check with staff: the clinician already
// reviews and approves the plan before it is shared, so these add nothing.
const REVIEW_DISCLAIMER = /(clinician|doctor|physician|review|confirm|consult|suggestions? only|ڈاکٹر|معالج|تصدیق)/i;
const REVIEW_CLAUSE = /,?\s*\b(?:if|once|when|after|as)\s+(?:cleared|approved|advised|directed|allowed)\s+by\s+(?:your|the|a)\s+(?:doctor|clinician|physician)\b/gi;
// Topics with their own tip in the handout ("Drink water", "Physical activity").
const DEDICATED_TIP = /\b(hydrat\w*|water|fluids?|activity|exercise|walk\w*)\b/i;

/**
 * Keep "Important advice for better health" to genuine health advice. The
 * patient's own preferences, budget, allergies and foods to avoid are already
 * applied to the meal plan, so restating them as advice is dropped, as are
 * review disclaimers in the patient notes.
 */
export function cleanHandoutAdvice(draft: AdvisorDraft, preferences: AdvisorPreferences) {
  const removed: string[] = [];
  const findingById = new Map<string, Finding>(draft.findings.map((f) => [f.id, f]));

  const preferenceWords = [
    ...[...preferences.preferredFoodIds, ...preferences.excludedFoodIds].map((id) => FOOD_BY_ID[id]?.name.toLowerCase()),
    ...preferences.allergies.flatMap((a) => ALLERGEN_WORDS[a] ?? []),
  ].filter(Boolean) as string[];

  const isPreferenceOnly = (r: Recommendation) => {
    const evidence = r.evidence.map((id) => findingById.get(id)).filter(Boolean) as Finding[];
    if (evidence.length && evidence.every((f) => f.source === 'foodPreferences')) return true;
    // No health evidence, and it is about a preferred, avoided or allergen food.
    const healthEvidence = evidence.some((f) => f.source !== 'foodPreferences');
    const text = `${r.title} ${r.detail}`.toLowerCase();
    return !healthEvidence && preferenceWords.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`).test(text));
  };

  const stripDisclaimers = (text: string) => {
    // Clauses like ", if cleared by your doctor" are dropped; the rest of the sentence stays.
    const cleaned = text.replace(REVIEW_CLAUSE, '').replace(/\s+([.,;])/g, '$1');
    const sentences = cleaned.split(/(?<=[.!?۔])\s+/).filter(Boolean);
    const kept = sentences.filter((s) => !REVIEW_DISCLAIMER.test(s));
    return { text: kept.join(' ').trim(), dropped: sentences.length - kept.length };
  };

  const duplicates: string[] = [];
  const recommendations = draft.recommendations.flatMap((r) => {
    if (isPreferenceOnly(r)) { removed.push(r.title); return []; }
    // The handout has its own water and activity tips; avoid saying it twice.
    if (DEDICATED_TIP.test(r.title)) { duplicates.push(r.title); return []; }
    // Advice telling the patient to see the doctor is a review step, not advice.
    const detail = stripDisclaimers(r.detail).text;
    const detailUr = stripDisclaimers(r.detailUr).text;
    if (REVIEW_DISCLAIMER.test(r.title) || !detail) { removed.push(r.title); return []; }
    return [{ ...r, detail, detailUr }];
  });
  const notes = stripDisclaimers(draft.handout.patientNotes);
  const notesUr = stripDisclaimers(draft.handout.patientNotesUr);
  const activity = stripDisclaimers(draft.handout.activityGuidance);

  const repairs: string[] = [];
  if (removed.length) repairs.push(`${removed.length} preference, allergy or review item(s) removed from advice (${removed.join('; ')})`);
  if (duplicates.length) repairs.push(`${duplicates.length} water/activity item(s) left to their dedicated handout tips`);
  const activityChanged = activity.text !== draft.handout.activityGuidance.trim();
  if (notes.dropped || notesUr.dropped || activityChanged) repairs.push('review disclaimers removed from patient text');

  return {
    draft: { ...draft, recommendations, handout: { ...draft.handout, patientNotes: notes.text, patientNotesUr: notesUr.text,
      // Keep the original if stripping would leave no activity advice at all.
      activityGuidance: activity.text || draft.handout.activityGuidance } },
    repairs,
  };
}
