import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW } from '../theme';
import type { Inspection } from '../store/mockData';

interface InspectionCardProps {
  inspection: Inspection;
  projectName: string;
  onPress?: () => void;
}

const STATUS_CONFIG = {
  PENDING: { color: COLORS.warning, bg: 'rgba(255,149,0,0.12)', label: 'Pending', icon: '⏳' },
  IN_PROGRESS: { color: COLORS.teal, bg: COLORS.tealLight, label: 'In Progress', icon: '🔵' },
  COMPLETED: { color: COLORS.success, bg: 'rgba(48,209,88,0.12)', label: 'Completed', icon: '✅' },
  CANCELLED: { color: COLORS.textMuted, bg: 'rgba(71,85,105,0.12)', label: 'Cancelled', icon: '🚫' },
};

const TYPE_CONFIG = {
  ROUTINE: { label: 'Routine', icon: '📋' },
  SURPRISE: { label: '⚡ SURPRISE', icon: '⚡' },
  FOLLOW_UP: { label: 'Follow-Up', icon: '🔁' },
};

export function InspectionCard({ inspection, projectName, onPress }: InspectionCardProps) {
  const status = STATUS_CONFIG[inspection.status];
  const type = TYPE_CONFIG[inspection.type];
  const isSurprise = inspection.type === 'SURPRISE';
  const date = new Date(inspection.scheduledDate);
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        SHADOW.card,
        isSurprise && styles.cardSurprise,
      ]}
    >
      {isSurprise && <View style={styles.surpriseBadge}><Text style={styles.surpriseBadgeText}>⚡ SURPRISE</Text></View>}

      <View style={styles.row}>
        <View style={styles.dateBubble}>
          <Text style={styles.dateDay}>{date.getDate()}</Text>
          <Text style={styles.dateMon}>{date.toLocaleDateString('en-IN', { month: 'short' })}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.project} numberOfLines={1}>{projectName}</Text>
          <Text style={styles.time}>🕐 {timeStr}  ·  {isSurprise ? '⚡ Surprise Inspection' : type.label}</Text>
          <View style={styles.gpsBadgeRow}>
            {inspection.gpsVerified ? (
              <View style={styles.gpsVerifiedChip}>
                <Text style={styles.gpsVerifiedText}>
                  🟢 GPS Verified {inspection.gpsDistance != null ? `(${inspection.gpsDistance}m)` : ''}
                </Text>
              </View>
            ) : inspection.gpsStatus === 'FAILED' ? (
              <View style={styles.gpsFailedChip}>
                <Text style={styles.gpsFailedText}>
                  🔴 GPS Failed {inspection.gpsDistance != null ? `(${inspection.gpsDistance}m)` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.gpsPendingChip}>
                <Text style={styles.gpsPendingText}>🟠 GPS Pending</Text>
              </View>
            )}
          </View>
          {inspection.riskFlagged && (
            <Text style={styles.flagged}>⚠️ Risk Flagged — Anomalies Detected</Text>
          )}
        </View>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.icon} {status.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardSurprise: {
    borderColor: 'rgba(245,158,11,0.4)',
    backgroundColor: 'rgba(245,158,11,0.05)',
  },
  surpriseBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.officialGold,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.xl,
  },
  surpriseBadgeText: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBubble: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.accent,
    lineHeight: 20,
  },
  dateMon: {
    fontSize: FONT.xs,
    color: COLORS.accent,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  project: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  flagged: {
    fontSize: FONT.xs,
    color: COLORS.warning,
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONT.xs,
    fontWeight: '700',
  },
  gpsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  gpsVerifiedChip: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  gpsVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  gpsFailedChip: {
    backgroundColor: COLORS.danger + '15',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  gpsFailedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.danger,
  },
  gpsPendingChip: {
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  gpsPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.warning,
  },
});
