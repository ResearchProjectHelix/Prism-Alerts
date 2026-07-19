import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertCard } from '@/components/AlertCard';
import { SkeletonList } from '@/components/SkeletonCard';
import type { Alert } from '@/lib/types';

/** Returns a human-readable "X minutes ago" label, updating every 30 s. */
function useTimeAgo(timestamp: number): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!timestamp) {
      setLabel('');
      return;
    }
    function update() {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 10) setLabel('Just now');
      else if (seconds < 90) setLabel('Less than a minute ago');
      else if (seconds < 150) setLabel('1 minute ago');
      else setLabel(`${Math.floor(seconds / 60)} minutes ago`);
    }
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [timestamp]);

  return label;
}

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const {
    data: alerts,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useAlerts();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const lastUpdatedLabel = useTimeAgo(dataUpdatedAt);

  // Deactivated account: sign out immediately and redirect with a flag
  useEffect(() => {
    if (isError && (error as Error)?.message === 'ACCOUNT_DEACTIVATED') {
      signOut().then(() => {
        router.replace('/login?deactivated=1');
      });
    }
  }, [isError, error, signOut]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [signOut]);

  const handleAlertPress = useCallback((alert: Alert) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/patient/${alert.patientId}`);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const highCount = alerts?.filter((a) => a.priority === 'high').length ?? 0;
  const medCount = alerts?.filter((a) => a.priority === 'medium').length ?? 0;
  const patientCount = new Set(alerts?.map((a) => a.patientId)).size ?? 0;

  const headerHeight = 60;
  const isDeactivated =
    isError && (error as Error)?.message === 'ACCOUNT_DEACTIVATED';

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
          <View style={styles.headerLeft}>
            <MaterialIcons name="lens" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                PRISM{' '}
                <Text style={{ color: colors.primary }}>ALERTS</Text>
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleSignOut}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            accessibilityLabel="Sign out"
          >
            <MaterialIcons name="logout" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* Summary bar — shown when there are alerts */}
      {!isLoading && !isError && alerts && alerts.length > 0 && (
        <View
          style={[
            styles.summaryBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.destructive }]}>
              {highCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              High
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {medCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Medium
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {patientCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Patients
            </Text>
          </View>
        </View>
      )}

      {/* Last updated ticker — shown after first successful load */}
      {!isLoading && !isError && !!lastUpdatedLabel && (
        <View style={[styles.lastUpdatedBar, { borderBottomColor: colors.border }]}>
          <MaterialIcons name="schedule" size={11} color={colors.mutedForeground} />
          <Text style={[styles.lastUpdatedText, { color: colors.mutedForeground }]}>
            Last updated: {lastUpdatedLabel}
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={[styles.listContent, { paddingTop: 12 }]}>
          <SkeletonList />
        </View>
      ) : isDeactivated ? (
        // Handled by useEffect above — show nothing while redirecting
        null
      ) : isError ? (
        <View style={styles.centeredState}>
          <MaterialIcons name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>
            Failed to load alerts
          </Text>
          <Text style={[styles.stateSubtitle, { color: colors.mutedForeground }]}>
            Check your connection and try again
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={alerts ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: 12, paddingBottom: insets.bottom + webBottomInset + 20 },
            (alerts?.length ?? 0) === 0 && styles.emptyContainer,
          ]}
          scrollEnabled={!!(alerts && alerts.length > 0)}
          ListEmptyComponent={<AllCaughtUp colors={colors} />}
        />
      )}
    </View>
  );
}

/** Deliberately styled positive empty state. */
function AllCaughtUp({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.caughtUpOuter}>
      {/* Glowing circle */}
      <View style={styles.caughtUpIconWrap}>
        <View style={[styles.caughtUpGlow, { backgroundColor: '#4a9c7218' }]} />
        <View style={[styles.caughtUpCircle, { borderColor: '#4a9c7240' }]}>
          <MaterialIcons name="check" size={44} color="#4a9c72" />
        </View>
      </View>
      <Text style={[styles.caughtUpTitle, { color: colors.foreground }]}>
        All caught up
      </Text>
      <Text style={[styles.caughtUpSubtitle, { color: colors.mutedForeground }]}>
        No outstanding items across your patients
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  lastUpdatedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastUpdatedText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  listContent: {},
  emptyContainer: {
    flex: 1,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 40,
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 6,
  },
  stateSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  // All caught up empty state
  caughtUpOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 40,
  },
  caughtUpIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  caughtUpGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  caughtUpCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caughtUpTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  caughtUpSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
  },
});
