import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { CompletenessRule } from '@/lib/types';

interface CompletenessRowProps {
  rule: CompletenessRule;
}

export function CompletenessRow({ rule }: CompletenessRowProps) {
  const colors = useColors();

  const statusColor = rule.met
    ? colors.success
    : rule.priority === 'high'
      ? colors.destructive
      : colors.warning;

  const iconName = rule.met ? 'check-circle' : 'cancel';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <MaterialIcons name={iconName} size={20} color={statusColor} />
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {rule.label}
        </Text>
        {!rule.met && (
          <Text style={[styles.status, { color: colors.mutedForeground }]}>
            {rule.priority === 'high' ? 'Required — not completed' : 'Recommended — not completed'}
          </Text>
        )}
      </View>
      {!rule.met && (
        <View
          style={[
            styles.priorityPill,
            {
              backgroundColor:
                rule.priority === 'high' ? '#cf5a5a22' : '#c9903f22',
            },
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              {
                color:
                  rule.priority === 'high' ? colors.destructive : colors.warning,
              },
            ]}
          >
            {rule.priority.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  labelContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  status: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  priorityPill: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});
