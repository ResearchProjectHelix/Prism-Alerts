import { NavLink } from 'react-router-dom';
import { colors } from '../lib/colors';

export function PatientTabs({ patientId }: { patientId: string }) {
  const tabs = [
    { label: 'Overview', to: `/patient/${patientId}` },
    { label: 'Results', to: `/patient/${patientId}/results` },
    { label: 'Scans', to: `/patient/${patientId}/scans` },
  ];

  return (
    <div
      style={{
        display: 'flex',
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to.endsWith(`/${patientId}`)}
          style={({ isActive }) => ({
            flex: 1,
            textAlign: 'center',
            padding: '12px 0',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.3,
            textDecoration: 'none',
            color: isActive ? colors.primary : colors.mutedForeground,
            borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
