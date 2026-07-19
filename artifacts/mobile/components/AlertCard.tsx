import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Alert } from '@/lib/types';

interface AlertCardProps {
  alert: Alert;
  onPress: () => void;
}

export function AlertCard({ alert, onPress }: AlertCardProps) {
  const colors = useColors();
  const isHigh = alert.priority === 'high';
  const priorityColor = isHigh ? colors.destructive : colors.warning;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Alert for ${alert.patientName}: ${alert.ruleLabel}`}
    >
      {/* Priority accent bar */}
      <View style={[styles.accentBar, { backgroundColor: priorityColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[styles.patientName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {alert.patientName}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: isHigh ? '#cf5a5a22' : '#c9903f22' },
            ]}
          >
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {isHigh ? 'HIGH' : 'MEDIUM'}
            </Text>
          </View>
        </View>

        <Text style={[styles.mrn, { color: colors.mutedForeground }]}>
          MRN {alert.mrn}
        </Text>

        <View style={styles.ruleRow}>
          <MaterialIcons
            name="error-outline"
            size={14}
            color={priorityColor}
            style={styles.ruleIcon}
          />
          <Text style={[styles.ruleLabel, { color: colors.foreground }]}>
            {alert.ruleLabel}
          </Text>
        </View>
      </View>

      <MaterialIcons
        name="chevron-right"
        size={22}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  patientName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  mrn: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  ruleIcon: {},
  ruleLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
