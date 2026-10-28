import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { buildRules, getUnmetRules } from '../lib/completeness';
import { readAllPages, readPatientBatches } from '../lib/queryPaging';
import type { Patient, BloodTest, Report, TimelineEvent } from '../lib/types';
import type { Alert } from '../lib/types';
import { useAuth } from '../context/AuthContext';

async function fetchAlerts(userId: string): Promise<Alert[]> {
  // 1. Check the user's profile for is_active and their org (for shared-patient detection)
  //    SCHEMA FIX: user_profiles' primary key is `id` (== auth.uid()), not `user_id`.
  //    Confirmed against Project-Helix's live RLS policies (`up.id = auth.uid()`).
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, is_active')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  // Deactivated account — throw a sentinel that the screen will handle
  if (profile && profile.is_active === false) {
    throw new Error('ACCOUNT_DEACTIVATED');
  }

  const userOrgId: string | null = profile?.organization_id ?? null;

  // 2. Fetch all patients visible to this user (scoped by RLS)
  //    SCHEMA FIX: the tenant column on `patients` is `hospital_id`, not
  //    `organization_id` — confirmed against Project-Helix's patientQueries.js.
  const patients = await readAllPages<Pick<Patient, 'id' | 'name' | 'mrn' | 'family_history' | 'hospital_id'>>((from, to) => supabase
    .from('patients').select('id, name, mrn, family_history, hospital_id')
    .order('name').order('id').range(from, to));
  if (patients.length === 0) return [];
  const patientIds = patients.map(patient => patient.id);

  // A page failure rejects the entire result: partial records must not become missing-data alerts.
  const [bloods, reports, timeline] = await Promise.all([
    readPatientBatches<BloodTest>(patientIds, (ids, from, to) => supabase.from('blood_tests')
      .select('id, patient_id, test, value, flag, unit, reference_range, recorded_at')
      .in('patient_id', ids).order('recorded_at', { ascending: false }).order('id').range(from, to)),
    readPatientBatches<Report>(patientIds, (ids, from, to) => supabase.from('reports')
      .select('id, patient_id, type, date, status, document_id')
      .in('patient_id', ids).order('date', { ascending: false }).order('id').range(from, to)),
    readPatientBatches<TimelineEvent>(patientIds, (ids, from, to) => supabase.from('timeline_events')
      .select('id, patient_id, label, event_date, done, status, clinician, notes, sort_order')
      .in('patient_id', ids).order('sort_order').order('id').range(from, to)),
  ]);

  const allAlerts: Alert[] = [];

  for (const patient of patients) {
    const patientBloods = bloods.filter(
      (b: { patient_id: string }) => b.patient_id === patient.id,
    );
    const patientReports = reports.filter(
      (r: { patient_id: string }) => r.patient_id === patient.id,
    );
    const patientTimeline = timeline.filter(
      (t: { patient_id: string }) => t.patient_id === patient.id,
    );

    const rules = buildRules({
      bloods: patientBloods,
      reports: patientReports,
      timeline: patientTimeline,
      familyHistory: patient.family_history ?? null,
    });

    const unmet = getUnmetRules(rules);

    // A patient is "shared in" when their hospital differs from the current user's org.
    const isShared = Boolean(
      userOrgId && patient.hospital_id && patient.hospital_id !== userOrgId,
    );

    for (const rule of unmet) {
      allAlerts.push({
        id: `${patient.id}:${rule.key}`,
        patientId: patient.id,
        patientName: patient.name ?? 'Unknown',
        mrn: patient.mrn ?? '—',
        ruleKey: rule.key,
        ruleLabel: rule.label,
        priority: rule.priority,
        isShared,
      });
    }
  }

  return allAlerts.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return 0;
  });
}

export function useAlerts() {
  const { session, user } = useAuth();

  return useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled: !!session && !!user,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}
