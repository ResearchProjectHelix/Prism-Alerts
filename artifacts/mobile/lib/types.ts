export interface Patient {
  id: string;
  name: string;
  mrn: string;
  dob: string | null;
  sex: string | null;
  diagnosis: string | null;
  stage: string | null;
  family_history: string | null;
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
}

export interface PatientDetail {
  patient: Patient;
  rules: CompletenessRule[];
  bloods: BloodTest[];
  reports: Report[];
  timeline: TimelineEvent[];
}
