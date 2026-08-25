import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';
import { MetricCard } from '../../src/components/MetricCard';
import { ProjectCard } from '../../src/components/ProjectCard';

export default function OfficialDashboard() {
  const router = useRouter();
  const projects = useAppStore(s => s.projects);
  const inspections = useAppStore(s => s.inspections);
  const complaints = useAppStore(s => s.complaints);
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.riskScore - a.riskScore),
    [projects]
  );

  const pendingInspections = inspections.filter(i => i.status === 'PENDING').length;
  const activeAlerts = projects.filter(p => p.riskScore >= 60).length;
  const criticalProjects = projects.filter(p => p.riskLevel === 'CRITICAL').length;
  const openComplaints = complaints.filter(c => c.status === 'OPEN').length;

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.userName}>{currentUser?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.designation}>{currentUser?.designation}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => { logout(); router.replace('/login'); }}>
            <Text style={styles.avatarText}>{currentUser?.avatarInitials}</Text>
          </TouchableOpacity>
        </View>

        {/* District Banner */}
        <View style={styles.districtBanner}>
          <Text style={styles.districtText}>📍 Varanasi District  ·  Uttar Pradesh</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Alert Banner for critical */}
        {criticalProjects > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertIcon}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{criticalProjects} Critical Project{criticalProjects > 1 ? 's' : ''} Need Attention</Text>
              <Text style={styles.alertSub}>Immediate inspection recommended. Risk scores above 80.</Text>
            </View>
          </View>
        )}

        {/* Metrics */}
        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        <View style={styles.metricsRow}>
          <MetricCard icon="🏗️" label="Total Projects" value={projects.length} accentColor={COLORS.accent} />
          <MetricCard icon="⏳" label="Pending" value={pendingInspections} accentColor={COLORS.warning} />
        </View>
        <View style={[styles.metricsRow, { marginTop: 10 }]}>
          <MetricCard icon="🚨" label="Active Alerts" value={activeAlerts} accentColor={COLORS.danger} />
          <MetricCard icon="📣" label="Complaints" value={openComplaints} accentColor={COLORS.teal} />
        </View>

        {/* Projects List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>PROJECTS · RISK SORTED</Text>
          <View style={styles.filterPill}>
            <Text style={styles.filterText}>All Districts</Text>
          </View>
        </View>

        {sortedProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onPress={() => router.push(`/(official)/project/${project.id}`)}
          />
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 30 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    marginBottom: 16,
  },
  greeting: { fontSize: FONT.sm, color: COLORS.textSecondary },
  userName: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  designation: { fontSize: FONT.xs, color: COLORS.officialGold, fontWeight: '600', marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.officialGold + '20',
    borderWidth: 2,
    borderColor: COLORS.officialGold + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FONT.md, fontWeight: '800', color: COLORS.officialGold },

  districtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  districtText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '500' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  liveText: { fontSize: FONT.xs, color: COLORS.success, fontWeight: '800', letterSpacing: 1 },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,45,85,0.1)',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.3)',
  },
  alertIcon: { fontSize: 28 },
  alertTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.danger },
  alertSub: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterText: { fontSize: FONT.xs, color: COLORS.textSecondary },

  metricsRow: { flexDirection: 'row', gap: 10 },
});
