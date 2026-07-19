import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildRules } from '@/lib/completeness';
import type { PatientDetail } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

async function fetchPatientDetail(patientId: string, userId: string): Promise<PatientDetail> {
  const [profileResult, patientResult, bloodsResult, reportsResult, timelineResult] =
    await Promise.all([
      supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single(),
      supabase
        .from('blood_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false }),
      supabase
        .from('reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false }),
      supabase
        .from('timeline_events')
        .select('*')
        .eq('patient_id', patientId)
        .order('sort_order'),
    ]);

  if (patientResult.error) throw patientResult.error;

  const patient = patientResult.data;
  const bloods = bloodsResult.data ?? [];
  const reports = reportsResult.data ?? [];
  const timeline = timelineResult.data ?? [];

  const rules = buildRules({
    bloods,
    reports,
    timeline,
    familyHistory: patient.family_history ?? null,
  });

  const userOrgId = profileResult.data?.organization_id ?? null;
  const isShared = Boolean(
    userOrgId && patient.organization_id && patient.organization_id !== userOrgId,
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
