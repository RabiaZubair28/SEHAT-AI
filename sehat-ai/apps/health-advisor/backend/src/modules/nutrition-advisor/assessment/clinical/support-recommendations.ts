import { Finding, NutrientTargets, Recommendation } from '../../models/types';
import { ClinicalContext } from './context';
import { activityGuidanceFor } from './activity-guidance';

export function supportRecommendations(ctx: ClinicalContext, findings: Finding[], targets: NutrientTargets | null): Recommendation[] {
  const recs: Recommendation[] = [];
  const has = (id: string) => findings.some((f) => f.id === id);
  const find = (id: string) => findings.find((f) => f.id === id);
  const bmi = findings.find((f) => f.id === 'obs:bmi');
  if (find('obs:temp')?.status === 'high') {
    recs.push({
      id: 'fever_fluids', priority: 2, icon: '🌡️', tone: 'purple', evidence: ['obs:temp'],
      title: 'Extra fluids during fever',
      titleUr: 'بخار میں زیادہ پانی',
      detail: 'Drink extra water, soups and lemon water while the fever lasts, and return to the clinic if it continues.',
      detailUr: 'بخار کے دوران زیادہ پانی، سوپ اور لیموں پانی پئیں۔ بخار جاری رہے تو کلینک آئیں۔',
      basis: 'Fever increases fluid requirement',
    });
  }

  recs.push({
    id: 'hydration', priority: 5, icon: '💧', tone: 'purple', evidence: [],
    title: 'Stay well hydrated',
    titleUr: 'پانی کا استعمال',
    detail: `Drink about ${targets?.waterLitres ?? 2} litres (${Math.round(((targets?.waterLitres ?? 2) * 1000) / 250)} glasses) of clean water daily.`,
    detailUr: `روزانہ تقریباً ${Math.round(((targets?.waterLitres ?? 2) * 1000) / 250)} گلاس صاف پانی پئیں۔`,
    basis: 'EFSA adequate intake for water',
  });

  if (!has('safety:hb_severe')) {
    const act = activityGuidanceFor(ctx, findings);
    if (act.allowed) {
      recs.push({
        id: 'activity', priority: 6, icon: '🏃', tone: 'orange', evidence: bmi ? ['obs:bmi'] : [],
        title: 'Add light physical activity',
        titleUr: 'باقاعدہ جسمانی سرگرمی',
        detail: act.text, detailUr: act.textUr,
        basis: 'WHO physical activity guidelines (150 min/week)',
      });
    }
  }

  return recs;
}
