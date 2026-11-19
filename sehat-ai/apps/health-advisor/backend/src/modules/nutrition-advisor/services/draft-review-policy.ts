import { UnprocessableEntityException } from '@nestjs/common';
import { Assessment } from '../assessment/clinical/context';

/** Clinical review flags restrict release, not preparation of a clinician-facing draft. */
export function assertCanDraft(assessment: Assessment): void {
  const blocking = assessment.dataQuality.filter(issue => issue.severity === 'blocking');
  if (blocking.length || assessment.eligibility.status === 'needs_data' ||
      (assessment.eligibility.status === 'eligible' && !assessment.targets)) {
    throw new UnprocessableEntityException({
      message: 'Please correct the highlighted measurements before generating a plan.',
      reasons: blocking.length ? blocking.map(issue => `${issue.label}: ${issue.message}`) : assessment.eligibility.reasons,
    });
  }
}

export function draftReviewContext(assessment: Assessment) {
  return {
    required: true,
    individualized: assessment.eligibility.status === 'held',
    reasons: assessment.eligibility.status === 'held' ? assessment.eligibility.reasons : [],
  };
}

export function draftFollowUpDate(assessment: Assessment): string | null {
  return assessment.eligibility.status === 'held'
    ? null
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
