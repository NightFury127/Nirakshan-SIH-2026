import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW } from '../theme';
import { RiskBadge } from './RiskBadge';
import { getRiskColor } from '../utils/riskEngine';
import type { Project } from '../store/mockData';

interface ProjectCardProps {
  project: Project;
  onPress?: () => void;
  showCompliance?: boolean;
}

export function ProjectCard({ project, onPress, showCompliance = false }: ProjectCardProps) {
  const riskColor = getRiskColor(project.riskLevel);
  const isHighRisk = project.riskScore >= 80;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        SHADOW.card,
        isHighRisk && styles.cardHighRisk,
      ]}
    >
      {isHighRisk && <View style={[styles.riskBar, { backgroundColor: riskColor }]} />}

      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.name} numberOfLines={1}>{project.name}</Text>
          <Text style={styles.location} numberOfLines={1}>
            📍 {project.location}
          </Text>
        </View>
        <RiskBadge level={project.riskLevel} score={project.riskScore} size="sm" />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <InfoChip icon="🏗️" label={project.type} />
        <InfoChip icon="👤" label={project.managerName.split(' ')[0]} />
        {showCompliance ? (
          <InfoChip icon="✅" label={`${project.compliancePercent}%`} />
        ) : (
          <InfoChip
            icon="📣"
            label={`${project.anomalies.openComplaints} issues`}
            highlight={project.anomalies.openComplaints > 0}
          />
        )}
      </View>

      {!showCompliance && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${project.riskScore}%`,
                  backgroundColor: riskColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: riskColor }]}>
            Risk {project.riskScore}/100
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function InfoChip({ icon, label, highlight }: { icon: string; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.chip, highlight && styles.chipHighlight]}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={[styles.chipText, highlight && styles.chipTextHighlight]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardHighRisk: {
    borderColor: 'rgba(255,45,85,0.3)',
    backgroundColor: 'rgba(255,45,85,0.04)',
  },
  riskBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: RADIUS.xl,
    borderBottomLeftRadius: RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  location: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 8,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSunken,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  chipHighlight: {
    backgroundColor: 'rgba(255,45,85,0.12)',
  },
  chipIcon: {
    fontSize: 11,
  },
  chipText: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextHighlight: {
    color: COLORS.danger,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingLeft: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: FONT.xs,
    fontWeight: '700',
    minWidth: 75,
    textAlign: 'right',
  },
});
