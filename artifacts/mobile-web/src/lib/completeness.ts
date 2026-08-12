/**
 * Clinical Completeness Engine (ported from PRISM desktop app).
 *
 * This does NOT diagnose or interpret clinical findings. It only checks
 * whether expected documentation/data exists for a patient on the
 * pancreatic cancer pathway, per Project Helix's core philosophy:
 * "Reduce the chance that important information is missed."
 */

import type { BloodTest, CompletenessRule, Report, TimelineEvent } from './types';

function timelineEventStatus(timeline: TimelineEvent[], label: string): string {
  const event = timeline.find((t) => t.label === label);
  return event ? event.status : 'Pending';
}

interface RuleInput {
  bloods: BloodTest[];
  reports: Report[];
  timeline: TimelineEvent[];
  familyHistory: string | null;
}

export function buildRules(patient: RuleInput): CompletenessRule[] {
  const { bloods, reports, timeline, familyHistory } = patient;

  const ca19_9 = bloods.find((b) => b.test === 'CA19-9');
  const ca19_9Recorded = !!ca19_9 && ca19_9.value !== 'Not recorded';

  const pathologyReport = reports.find((r) => r.type.includes('Pathology'));
  const pathologyAvailable =
    !!pathologyReport && pathologyReport.status === 'Available';
  const histopathologyEventCompleted =
    timelineEventStatus(timeline, 'Histopathology') === 'Completed';

  const familyHistoryRecorded =
    !!familyHistory && familyHistory !== 'Not yet recorded';

  return [
    {
      key: 'gp_referral',
      label: 'GP Referral',
      met: timelineEventStatus(timeline, 'GP Referral') === 'Completed',
      priority: 'medium',
    },
    {
      key: 'ct_scan',
      label: 'CT Scan',
      met: timelineEventStatus(timeline, 'CT Scan') === 'Completed',
      priority: 'medium',
    },
    {
      key: 'mri',
      label: 'MRI',
      met: timelineEventStatus(timeline, 'MRI Scan') === 'Completed',
      priority: 'medium',
    },
    {
      key: 'histopathology',
      label: 'Histopathology',
      met: histopathologyEventCompleted || pathologyAvailable,
      priority: 'high',
    },
    {
      key: 'ca19_9',
      label: 'CA19-9',
      met: ca19_9Recorded,
      priority: 'high',
    },
    {
      key: 'mdt_review',
      label: 'MDT Review',
      met: timelineEventStatus(timeline, 'MDT Review') === 'Completed',
      priority: 'high',
    },
    {
      key: 'family_history',
      label: 'Family History',
      met: familyHistoryRecorded,
      priority: 'medium',
    },
  ];
}

/**
 * Given a list of rules, return only the unmet ones,
 * sorted high priority first.
 */
export function getUnmetRules(rules: CompletenessRule[]): CompletenessRule[] {
  return rules
    .filter((r) => !r.met)
    .sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
    });
}
