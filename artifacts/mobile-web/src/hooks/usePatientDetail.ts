import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { buildRules } from '../lib/completeness';
import { readAllPages } from '../lib/queryPaging';
import type { BloodTest, Report, TimelineEvent } from '../lib/types';
import type { PatientDetail } from '../lib/types';
import { useAuth } from '../context/AuthContext';

async function fetchPatientDetail(patientId: string, userId: string): Promise<PatientDetail> {
  const [profileResult, patientResult, bloods, reports, timeline] =
    await Promise.all([
      // SCHEMA FIX: user_profiles' primary key is `id`, not `user_id`.
      supabase.from('user_profiles').select('organization_id').eq('id', userId).single(),
      supabase.from('patients').select('*').eq('id', patientId).single(),
      readAllPages<BloodTest>((from, to) => supabase
        .from('blood_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false }).order('id').range(from, to)),
      readAllPages<Report>((from, to) => supabase
        .from('reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false }).order('id').range(from, to)),
      readAllPages<TimelineEvent>((from, to) => supabase.from('timeline_events').select('*')
        .eq('patient_id', patientId).order('sort_order').order('id').range(from, to)),
    ]);

  // A failed query is not evidence that clinical information is missing.
  if (profileResult.error) throw profileResult.error;
  if (patientResult.error) throw patientResult.error;

  const patient = patientResult.data;

  const rules = buildRules({
    bloods,
    reports,
    timeline,
    familyHistory: patient.family_history ?? null,
  });

  const userOrgId = profileResult.data?.organization_id ?? null;
  // SCHEMA FIX: `patients.hospital_id` is the tenant column, not `organization_id`.
  const isShared = Boolean(
    userOrgId && patient.hospital_id && patient.hospital_id !== userOrgId,
  );

  return { patient, rules, bloods, reports, timeline, isShared };
}

export function usePatientDetail(patientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patient', patientId, user?.id],
    queryFn: () => fetchPatientDetail(patientId, user?.id ?? ''),
    enabled: !!patientId && !!user,
    staleTime: 20_000,
  });
}
