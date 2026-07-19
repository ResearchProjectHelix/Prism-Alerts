import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { usePatientDetail } from '@/hooks/usePatientDetail';
import { CompletenessRow } from '@/components/CompletenessRow';
import { getUnmetRules } from '@/lib/completeness';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = usePatientDetail(id ?? '');

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;
  const headerHeight = 56;

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + webTopInset,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              height: headerHeight + insets.top + webTopInset,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + webTopInset,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              height: headerHeight + insets.top + webTopInset,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            Failed to load patient
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { patient, rules } = data;
  const unmetRules = getUnmetRules(rules);
  const metRules = rules.filter((r) => r.met);
  const completionPercent = Math.round((metRules.length / rules.length) * 100);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopInset,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            height: headerHeight + insets.top + webTopInset,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1 }]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            Patient Profile
          </Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + webBottomInset + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient card */}
        <View
          style={[
            styles.patientCard,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: colors.foreground }]}>
              {patient.name ?? 'Unknown'}
            </Text>
            <Text style={[styles.patientMeta, { color: colors.mutedForeground }]}>
              MRN {patient.mrn ?? '—'}
              {patient.diagnosis ? `  ·  ${patient.diagnosis}` : ''}
            </Text>
            {patient.stage && (
              <Text style={[styles.patientMeta, { color: colors.mutedForeground }]}>
                Stage {patient.stage}
              </Text>
            )}
          </View>

          {/* Progress ring summary */}
          <View style={styles.progressSummary}>
            <Text style={[styles.progressPercent, { color: completionPercent === 100 ? colors.success : colors.foreground }]}>
              {completionPercent}%
            </Text>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              complete
            </Text>
          </View>
        </View>

        {/* Outstanding alerts */}
        {unmetRules.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              OUTSTANDING ({unmetRules.length})
            </Text>
            <View style={[styles.ruleList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {unmetRules.map((rule) => (
                <CompletenessRow key={rule.key} rule={rule} />
              ))}
            </View>
          </View>
        )}

        {/* Completed items */}
        {metRules.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              COMPLETED ({metRules.length})
            </Text>
            <View style={[styles.ruleList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {metRules.map((rule) => (
                <CompletenessRow key={rule.key} rule={rule} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {},
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  headerRight: {
    width: 24,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  patientInfo: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  patientMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  progressSummary: {
    alignItems: 'center',
    minWidth: 56,
  },
  progressPercent: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  ruleList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  errorTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
