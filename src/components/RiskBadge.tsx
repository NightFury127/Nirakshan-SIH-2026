import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS } from '../theme';
import { getRiskColor, getRiskBg } from '../utils/riskEngine';

interface RiskBadgeProps {
  level: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
  const color = getRiskColor(level);
  const bg = getRiskBg(level);
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg, borderColor: color + '40' },
      isSm && styles.badgeSm,
      isLg && styles.badgeLg,
    ]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[
        styles.label,
        { color },
        isSm && styles.labelSm,
        isLg && styles.labelLg,
      ]}>
        {level}{score !== undefined ? ` · ${score}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSm: {
    fontSize: FONT.xs,
  },
  labelLg: {
    fontSize: FONT.md,
  },
});
