export interface Patient {
  id: string;
  name: string;
  mrn: string;
  dob: string | null;
  sex: string | null;
  diagnosis: string | null;
  stage: string | null;
  family_history: string | null;
  // Schema fix: this is `hospital_id` on the `patients` table, not
  // `organization_id` (confirmed against Project-Helix desktop app's live
  // RLS policies and queries — patients.hospital_id is the tenant column).
  hospital_id: string | null;
}

export interface BloodTest {
  id: string;
  patient_id: string;
  test: string;
  value: string;
  flag: boolean;
  unit: string | null;
  reference_range: string | null;
  recorded_at: string | null;
}

export interface Report {
  id: string;
  patient_id: string;
  type: string;
  date: string | null;
  status: string;
  document_id: string | null;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  label: string;
  event_date: string | null;
  done: boolean;
  status: string;
  clinician: string | null;
  notes: string | null;
  sort_order: number;
}

export type Priority = 'high' | 'medium';

export interface CompletenessRule {
  key: string;
  label: string;
  met: boolean;
  priority: Priority;
}

export interface Alert {
  /** Composite key: patientId + ruleKey */
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  ruleKey: string;
  ruleLabel: string;
  priority: Priority;
  /** True when this patient belongs to another org and was shared in. */
  isShared: boolean;
}

export interface PatientDetail {
  patient: Patient;
  rules: CompletenessRule[];
  bloods: BloodTest[];
  reports: Report[];
  timeline: TimelineEvent[];
  isShared: boolean;
}

/** A single blood test grouped with its full result history. */
export interface BloodResultGroup {
  testName: string;
  unit: string | null;
  referenceRange: string | null;
  history: BloodTest[];
  latest: BloodTest;
}

/**
 * Imaging-restricted document categories, matching the desktop app's
 * radiologist upload restriction (Clinical Documents). Keep this list in
 * sync with Project-Helix/src/renderer if the desktop categories change.
 */
export const IMAGING_CATEGORIES = ['CT', 'MRI', 'X-Ray', 'PET', 'Ultrasound'] as const;
export type ImagingCategory = (typeof IMAGING_CATEGORIES)[number];

export interface ClinicalDocument {
  id: string;
  patient_id: string;
  name: string;
  category: string;
  type: string;
  body_part: string | null;
  clinician: string | null;
  hospital: string | null;
  doc_date: string | null;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  uploaded_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  created_at: string;
}
