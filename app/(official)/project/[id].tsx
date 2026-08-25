import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../../src/theme';
import { calculateRiskScore, getRiskColor, getRiskBg } from '../../../src/utils/riskEngine';
import { RiskBadge } from '../../../src/components/RiskBadge';
import { InspectionCard } from '../../../src/components/InspectionCard';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const allProjects = useAppStore(s => s.projects);
  const allComplaints = useAppStore(s => s.complaints);
  const allInspections = useAppStore(s => s.inspections);
  const generateSurpriseInspection = useAppStore(s => s.generateSurpriseInspection);

  const project = useMemo(() => allProjects.find(p => p.id === id), [allProjects, id]);
  const complaints = useMemo(() => allComplaints.filter(c => c.projectId === id), [allComplaints, id]);
  const inspections = useMemo(() => allInspections.filter(i => i.projectId === id), [allInspections, id]);

  const [generatingInspection, setGeneratingInspection] = useState(false);
  const [inspectionGenerated, setInspectionGenerated] = useState(false);

  const riskBreakdown = useMemo(() => {
    if (!project) return null;
    return calculateRiskScore(project, complaints);
  }, [project, complaints]);

  if (!project) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.textSecondary }}>Project not found</Text>
      </View>
    );
  }

  const riskColor = getRiskColor(project.riskLevel);

  const handleSurpriseInspection = () => {
    Alert.alert(
      '⚡ Generate Surprise Inspection',
      `This will immediately dispatch Inspector Priya Nair to "${project.name}". She will be notified instantly.\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch Now',
          style: 'destructive',
          onPress: () => {
            setGeneratingInspection(true);
            setTimeout(() => {
              generateSurpriseInspection(project.id);
              setGeneratingInspection(false);
              setInspectionGenerated(true);
              Alert.alert(
                '✅ Inspection Dispatched',
                'Inspector Priya Nair has been notified. The inspection will appear in her task list immediately.',
                [{ text: 'OK' }]
              );
            }, 1200);
          },
        },
      ]
    );
  };

  const cctvStatusColor =
    project.cctvStatus === 'ONLINE' ? COLORS.success :
    project.cctvStatus === 'MAINTENANCE' ? COLORS.warning : COLORS.danger;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <RiskBadge level={project.riskLevel} score={project.riskScore} size="md" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Project Hero */}
        <View style={[styles.hero, { borderColor: riskColor + '40' }]}>
          <View style={[styles.heroBg, { backgroundColor: riskColor + '08' }]} />
          <View style={[styles.typeTag, { backgroundColor: COLORS.accent + '20' }]}>
            <Text style={[styles.typeTagText, { color: COLORS.accent }]}>{project.type}</Text>
          </View>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectLocation}>📍 {project.location}</Text>
          <Text style={styles.projectMeta}>
            👤 {project.managerName}  ·  💰 ₹{project.budget}L  ·  📅 Due {project.expectedCompletion}
          </Text>
        </View>

        {/* SURPRISE INSPECTION BUTTON */}
        <TouchableOpacity
          style={[
            styles.surpriseBtn,
            SHADOW.elevated,
            inspectionGenerated && styles.surpriseBtnDone,
          ]}
          onPress={handleSurpriseInspection}
          disabled={generatingInspection || inspectionGenerated}
          activeOpacity={0.8}
        >
          <Text style={styles.surpriseBtnIcon}>
            {generatingInspection ? '⏳' : inspectionGenerated ? '✅' : '⚡'}
          </Text>
          <View>
            <Text style={styles.surpriseBtnTitle}>
              {generatingInspection ? 'Dispatching...' : inspectionGenerated ? 'Inspection Dispatched!' : 'Generate Surprise Inspection'}
            </Text>
            <Text style={styles.surpriseBtnSub}>
              {inspectionGenerated ? 'Inspector Priya Nair has been notified' : 'Instantly dispatch an inspector to this site'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Risk Score Breakdown */}
        <Text style={styles.sectionLabel}>RISK ANALYSIS</Text>
        <View style={[styles.riskScoreCard, SHADOW.card]}>
          <View style={styles.riskScoreTop}>
            <View>
              <Text style={styles.riskScoreLabel}>Overall Risk Score</Text>
              <Text style={[styles.riskScoreValue, { color: riskColor }]}>{project.riskScore}</Text>
              <Text style={[styles.riskScoreLevel, { color: riskColor }]}>{project.riskLevel} RISK</Text>
            </View>
            <View style={styles.scoreGauge}>
              <View style={[styles.scoreGaugeInner, { height: `${project.riskScore}%`, backgroundColor: riskColor }]} />
            </View>
          </View>

          <View style={styles.riskDivider} />

          {riskBreakdown?.components.map((comp, idx) => (
            <View key={idx} style={styles.riskRow}>
              <Text style={styles.riskIcon}>{comp.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.riskRowLabel}>{comp.label}</Text>
                <View style={styles.riskTrack}>
                  <View style={[styles.riskFill, {
                    width: `${(comp.score / comp.maxScore) * 100}%`,
                    backgroundColor: comp.triggered ? riskColor : COLORS.textMuted,
                  }]} />
                </View>
              </View>
              <Text style={[styles.riskScore2, { color: comp.triggered ? riskColor : COLORS.textMuted }]}>
                +{comp.score}
              </Text>
            </View>
          ))}
        </View>

        {/* CCTV Status */}
        <Text style={styles.sectionLabel}>SURVEILLANCE</Text>
        <View style={[styles.cctvCard, SHADOW.card]}>
          <View style={styles.cctvHeader}>
            <Text style={styles.cctvTitle}>📹 CCTV System Status</Text>
            <View style={[styles.cctvStatus, { backgroundColor: cctvStatusColor + '20' }]}>
              <View style={[styles.cctvDot, { backgroundColor: cctvStatusColor }]} />
              <Text style={[styles.cctvStatusText, { color: cctvStatusColor }]}>{project.cctvStatus}</Text>
            </View>
          </View>
          {project.cctvStatus !== 'ONLINE' && (
            <Text style={styles.cctvWarning}>
              ⚠️ CCTV is {project.cctvStatus.toLowerCase()}. Remote monitoring unavailable. Physical inspection recommended.
            </Text>
          )}
          <View style={styles.cctvFeedGrid}>
            {[1, 2, 3, 4].map(n => (
              <View key={n} style={[styles.cctvFeed, { opacity: project.cctvStatus === 'ONLINE' ? 1 : 0.4 }]}>
                <Text style={styles.cctvFeedIcon}>
                  {project.cctvStatus === 'ONLINE' ? '🎥' : '❌'}
                </Text>
                <Text style={styles.cctvFeedLabel}>CAM {n.toString().padStart(2, '0')}</Text>
                <Text style={[styles.cctvFeedStatus, { color: cctvStatusColor }]}>
                  {project.cctvStatus === 'ONLINE' ? 'LIVE' : 'OFFLINE'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Inspections */}
        <Text style={styles.sectionLabel}>INSPECTION HISTORY</Text>
        {inspections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No inspections recorded for this project</Text>
          </View>
        ) : (
          inspections.slice(0, 5).map(insp => (
            <InspectionCard
              key={insp.id}
              inspection={insp}
              projectName={project.name}
            />
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 30 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { fontSize: FONT.md, color: COLORS.accent, fontWeight: '600' },

  hero: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 10,
  },
  typeTagText: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 0.5 },
  projectName: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  projectLocation: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: 4 },
  projectMeta: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 4 },

  surpriseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 24,
  },
  surpriseBtnDone: { backgroundColor: COLORS.success },
  surpriseBtnIcon: { fontSize: 32 },
  surpriseBtnTitle: { fontSize: FONT.lg, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  surpriseBtnSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  sectionLabel: {
    fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted,
    letterSpacing: 1.5, marginBottom: 10, marginTop: 4,
  },

  riskScoreCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  riskScoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  riskScoreLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: 4 },
  riskScoreValue: { fontSize: FONT['4xl'], fontWeight: '900', letterSpacing: -2 },
  riskScoreLevel: { fontSize: FONT.sm, fontWeight: '800', letterSpacing: 1 },
  scoreGauge: {
    width: 14,
    height: 80,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  scoreGaugeInner: { borderRadius: 7, minHeight: 4 },
  riskDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 14 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  riskIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  riskRowLabel: { fontSize: FONT.xs, color: COLORS.textSecondary, marginBottom: 5 },
  riskTrack: { height: 4, backgroundColor: COLORS.surfaceSunken, borderRadius: 2, overflow: 'hidden' },
  riskFill: { height: '100%', borderRadius: 2 },
  riskScore2: { fontSize: FONT.sm, fontWeight: '800', minWidth: 32, textAlign: 'right' },

  cctvCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cctvHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cctvTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  cctvStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, gap: 5 },
  cctvDot: { width: 7, height: 7, borderRadius: 4 },
  cctvStatusText: { fontSize: FONT.xs, fontWeight: '800', letterSpacing: 0.5 },
  cctvWarning: { fontSize: FONT.xs, color: COLORS.warning, marginBottom: 14, lineHeight: 18 },
  cctvFeedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cctvFeed: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  cctvFeedIcon: { fontSize: 24 },
  cctvFeedLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '600' },
  cctvFeedStatus: { fontSize: FONT.xs, fontWeight: '800', letterSpacing: 1 },

  emptyState: { alignItems: 'center', padding: 30, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center' },
});
