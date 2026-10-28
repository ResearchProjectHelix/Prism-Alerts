import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export interface PatientIdentityData {
  id: string;
  name: string;
  mrn: string | null;
  isShared: boolean;
}

export function usePatientIdentity(patientId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['patient-identity', patientId, user?.id],
    enabled: !!patientId && !!user,
    staleTime: 20_000,
    queryFn: async (): Promise<PatientIdentityData> => {
      const { data: profile, error: profileError } = await supabase.from('user_profiles')
        .select('organization_id, is_active').eq('id', user!.id).single();
      if (profileError) throw profileError;
      if (!profile || profile.is_active !== true) throw new Error('ACCOUNT_DEACTIVATED');
      const { data, error } = await supabase.from('patients')
        .select('id, name, mrn, hospital_id').eq('id', patientId).single();
      if (error) throw error;
      if (!data) throw new Error('Patient record unavailable.');
      return { id: data.id, name: data.name, mrn: data.mrn, isShared: Boolean(
        profile.organization_id && data.hospital_id && data.hospital_id !== profile.organization_id,
      ) };
    },
  });
}
