import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function SkeletonCard() {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: colors.muted }]} />
      <View style={styles.content}>
        <View
          style={[styles.line, styles.lineLong, { backgroundColor: colors.muted }]}
        />
        <View
          style={[styles.line, styles.lineShort, { backgroundColor: colors.muted }]}
        />
        <View
          style={[styles.line, styles.lineMid, { backgroundColor: colors.muted }]}
        />
      </View>
    </Animated.View>
  );
}

export function SkeletonList() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  bar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  lineLong: { width: '70%' },
  lineMid: { width: '50%' },
  lineShort: { width: '30%' },
});
