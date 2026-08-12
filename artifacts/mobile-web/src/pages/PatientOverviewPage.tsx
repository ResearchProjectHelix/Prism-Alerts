import { useNavigate, useParams } from 'react-router-dom';
import { usePatientDetail } from '../hooks/usePatientDetail';
import { CompletenessRow } from '../components/CompletenessRow';
import { PatientTabs } from '../components/PatientTabs';
import { colors } from '../lib/colors';

export function PatientOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePatientDetail(id ?? '');

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: colors.background, color: colors.foreground }}>
      <header style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => navigate('/alerts')}
          style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, padding: 0, cursor: 'pointer' }}
        >
          &larr; Alerts
        </button>
        {data && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>{data.patient.name}</div>
            <div style={{ fontSize: 13, color: colors.mutedForeground }}>
              {data.patient.mrn} {data.isShared && '\u00b7 Shared record (read-only)'}
            </div>
          </>
        )}
      </header>

      {id && <PatientTabs patientId={id} />}

      {isLoading && <div style={{ padding: 40, textAlign: 'center', color: colors.mutedForeground }}>Loading\u2026</div>}
      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: colors.destructive }}>
          Couldn't load this patient's record.
        </div>
      )}

      {data && (
        <div>
          <div style={{ padding: '16px 20px 4px', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: colors.mutedForeground, textTransform: 'uppercase' }}>
            Pathway Completeness
          </div>
          {data.rules.map((rule) => (
            <CompletenessRow key={rule.key} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}
