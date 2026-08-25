import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW } from '../theme';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  accentColor?: string;
}

export function MetricCard({ icon, label, value, subValue, accentColor = COLORS.accent }: MetricCardProps) {
  return (
    <View style={[styles.card, SHADOW.card]}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subValue && <Text style={styles.subValue}>{subValue}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 18,
  },
  value: {
    fontSize: FONT['2xl'],
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  subValue: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
