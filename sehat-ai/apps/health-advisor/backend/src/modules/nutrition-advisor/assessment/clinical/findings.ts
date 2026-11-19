import { AdvisorPreferences, DataQualityIssue, Finding } from '../../models/types';
import { ClinicalContext, Assessment } from './context';
import { diagnosisFindings } from './diagnosis-findings';
import { anthropometricFindings } from './anthropometric-findings';
import { measurementFindings } from './measurement-findings';

export function buildFindings(ctx: ClinicalContext, effective: Assessment['effective'], dataQuality: DataQualityIssue[], prefs?: AdvisorPreferences): Finding[] {
  return [...diagnosisFindings(ctx, dataQuality, prefs), ...anthropometricFindings(ctx, effective, dataQuality, prefs), ...measurementFindings(ctx, effective, dataQuality)];
}
