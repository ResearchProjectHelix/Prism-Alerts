import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBloodResults } from '../hooks/useBloodResults';
import { PatientTabs } from '../components/PatientTabs';
import { colors } from '../lib/colors';

export function PatientResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: groups, isLoading, error } = useBloodResults(id ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: colors.background, color: colors.foreground }}>
      <header style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => navigate(`/patient/${id}`)}
          style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, padding: 0, cursor: 'pointer' }}
        >
          &larr; Overview
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Blood Results</div>
      </header>

      {id && <PatientTabs patientId={id} />}

      {isLoading && <div style={{ padding: 40, textAlign: 'center', color: colors.mutedForeground }}>Loading\u2026</div>}
      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: colors.destructive }}>
          Couldn't load blood results.
        </div>
      )}
      {groups && groups.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: colors.mutedForeground }}>
          No blood test results recorded yet.
        </div>
      )}

      {groups && groups.length > 0 && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map((group) => {
            const isExpanded = expanded === group.testName;
            return (
              <div
                key={group.testName}
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : group.testName)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{group.testName}</div>
                    <div style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                      {group.latest.recorded_at
                        ? new Date(group.latest.recorded_at).toLocaleDateString('en-IE')
                        : 'No date recorded'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: group.latest.flag ? colors.destructive : colors.foreground,
                      }}
                    >
                      {group.latest.value}
                      {group.unit ? ` ${group.unit}` : ''}
                    </div>
                    {group.referenceRange && (
                      <div style={{ fontSize: 11, color: colors.mutedForeground }}>
                        Ref: {group.referenceRange}
                      </div>
                    )}
                  </div>
                </button>

                {isExpanded && group.history.length > 1 && (
                  <div style={{ borderTop: `1px solid ${colors.border}` }}>
                    {group.history.slice(1).map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          fontSize: 13,
                          color: colors.mutedForeground,
                          borderTop: `1px solid ${colors.border}`,
                        }}
                      >
                        <span>
                          {entry.recorded_at
                            ? new Date(entry.recorded_at).toLocaleDateString('en-IE')
                            : '\u2014'}
                        </span>
                        <span style={{ color: entry.flag ? colors.destructive : colors.mutedForeground }}>
                          {entry.value}
                          {group.unit ? ` ${group.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
