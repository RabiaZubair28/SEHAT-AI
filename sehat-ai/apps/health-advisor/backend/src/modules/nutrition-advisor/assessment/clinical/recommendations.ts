import { Finding, MedicalRestriction, NutrientTargets, Recommendation } from '../../models/types';
import { ClinicalContext } from './context';
import { coreRecommendations } from './core-recommendations';
import { conditionRecommendations } from './condition-recommendations';
import { supportRecommendations } from './support-recommendations';

export function buildRecommendations(ctx: ClinicalContext, findings: Finding[], restrictions: MedicalRestriction[], targets: NutrientTargets | null): Recommendation[] {
  return [...coreRecommendations(findings, targets), ...conditionRecommendations(findings, restrictions), ...supportRecommendations(ctx, findings, targets)].sort((a, b) => a.priority - b.priority);
}
