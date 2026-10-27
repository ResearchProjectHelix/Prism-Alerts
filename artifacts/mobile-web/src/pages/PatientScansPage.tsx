import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocuments, type ScanWithUrl } from '../hooks/useDocuments';
import { PatientTabs } from '../components/PatientTabs';
import { ScanViewer } from '../components/ScanViewer';
import { colors } from '../lib/colors';

export function PatientScansPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: scans, isLoading, isFetching, error, refetch } = useDocuments(id ?? '');
  const [viewing, setViewing] = useState<ScanWithUrl | null>(null);

  return (
    <div className="connect-page" style={{ minHeight: '100dvh', backgroundColor: colors.background, color: colors.foreground }}>
      <header className="connect-header" style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => navigate(`/patient/${id}`)}
          style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, padding: 0, cursor: 'pointer' }}
        >
          &larr; Overview
        </button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Scans</div>
          <button className="btn btn-ghost" disabled={isFetching} onClick={() => void refetch()} style={{ width: 'auto', paddingInline: 14 }}>Refresh files</button>
        </div>
      </header>

      {id && <PatientTabs patientId={id} />}

      {isLoading && <div style={{ padding: 40, textAlign: 'center', color: colors.mutedForeground }}>Loading\u2026</div>}
      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: colors.destructive }}>
          Couldn't load scans.
        </div>
      )}
      {scans && scans.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: colors.mutedForeground }}>
          No imaging scans uploaded yet.
        </div>
      )}

      {scans && scans.length > 0 && (
        <div className="connect-card-grid" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scans.map((scan) => (
            <button
              className="connect-scan-row"
              key={scan.id}
              onClick={() => setViewing(scan)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '14px 16px',
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{scan.name}</div>
                <div style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  {scan.type || scan.category}
                  {scan.doc_date ? ` \u00b7 ${scan.doc_date}` : ''}
                  {scan.clinician ? ` \u00b7 ${scan.clinician}` : ''}
                </div>
              </div>
              <span style={{ color: scan.fileState === 'ready' ? colors.primary : colors.mutedForeground, fontSize: 13, flexShrink: 0 }}>
                {scan.fileState === 'ready' ? 'View →' : scan.fileState === 'no_file' ? 'No file attached' : 'File unavailable'}
              </span>
            </button>
          ))}
        </div>
      )}

      {viewing && <ScanViewer doc={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
