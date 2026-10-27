import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface PatientSummary {
  id: string;
  name: string;
  mrn: string | null;
  hospital_id: string | null;
  isShared: boolean;
}

async function fetchPatients(userId: string): Promise<PatientSummary[]> {
  const { data: profile, error } = await supabase.from('user_profiles')
    .select('organization_id, is_active').eq('id', userId).single();
  if (error) throw error;
  if (!profile || profile.is_active === false) throw new Error('ACCOUNT_DEACTIVATED');

  const patients: PatientSummary[] = [];
  const pageSize = 200;
  for (let offset = 0; ; offset += pageSize) {
    // RLS determines visibility. Fetch every page rather than silently truncating the directory.
    const { data, error: patientsError } = await supabase.from('patients')
      .select('id, name, mrn, hospital_id').order('name').order('id')
      .range(offset, offset + pageSize - 1);
    if (patientsError) throw patientsError;
    const rows = data ?? [];
    patients.push(...rows.map(patient => ({ ...patient, isShared: Boolean(
      profile.organization_id && patient.hospital_id && patient.hospital_id !== profile.organization_id,
    ) })));
    if (rows.length < pageSize) return patients;
  }
}

export function usePatients() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['patients', user?.id], queryFn: () => fetchPatients(user!.id),
    enabled: !!user, staleTime: 20_000 });
}
