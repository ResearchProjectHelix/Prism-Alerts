import type { CompletenessRule } from '../lib/types';
import { colors } from '../lib/colors';

export function CompletenessRow({ rule }: { rule: CompletenessRule }) {
  const statusColor = rule.met
    ? colors.success
    : rule.priority === 'high'
      ? colors.destructive
      : colors.warning;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 20px',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <span style={{ fontSize: 18, color: statusColor, lineHeight: 1 }}>
        {rule.met ? '\u2713' : '\u2715'}
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: colors.foreground }}>
          {rule.label}
        </span>
        {!rule.met && (
          <span style={{ fontSize: 12, color: colors.mutedForeground }}>
            {rule.priority === 'high' ? 'Required \u2014 not completed' : 'Recommended \u2014 not completed'}
          </span>
        )}
      </div>
      {!rule.met && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.5,
            borderRadius: 4,
            padding: '2px 7px',
            color: rule.priority === 'high' ? colors.destructive : colors.warning,
            backgroundColor: rule.priority === 'high' ? '#cf5a5a22' : '#c9903f22',
          }}
        >
          {rule.priority.toUpperCase()}
        </span>
      )}
    </div>
  );
}
