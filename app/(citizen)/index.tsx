import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';

export default function CitizenHome() {
  const router = useRouter();
  const projects = useAppStore(s => s.projects);
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const complaints = useAppStore(s => s.complaints);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); };

  const getComplianceColor = (pct: number) => {
    if (pct >= 80) return COLORS.success;
    if (pct >= 55) return COLORS.warning;
    return COLORS.danger;
  };

  const getStatusLabel = (pct: number) => {
    if (pct >= 80) return 'Compliant';
    if (pct >= 55) return 'Partial';
    return 'Non-Compliant';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.citizenGreen} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>🌐 NIRIKSHAN</Text>
            <Text style={styles.portalLabel}>Citizen Public Portal</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => { logout(); router.replace('/login'); }}>
            <Text style={styles.avatarText}>{currentUser?.avatarInitials}</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeIcon}>👋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Hello, {currentUser?.name?.split(' ')[0]}</Text>
            <Text style={styles.welcomeSub}>Track government projects and file grievances in your area</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={styles.statValue}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects in Your District</Text>
          </View>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>
              {complaints.filter(c => c.status === 'OPEN').length}
            </Text>
            <Text style={styles.statLabel}>Open Complaints</Text>
          </View>
        </View>

        {/* Projects */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>GOVERNMENT PROJECTS · VARANASI</Text>
        </View>

        {projects.map(project => {
          const color = getComplianceColor(project.compliancePercent);
          const statusLabel = getStatusLabel(project.compliancePercent);
          const projectComplaints = complaints.filter(c => c.projectId === project.id && c.status === 'OPEN').length;

          return (
            <View key={project.id} style={[styles.projectCard, SHADOW.card]}>
              {/* Status bar at top */}
              <View style={[styles.statusBar, { backgroundColor: color }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectType}>{project.type}  ·  {project.district}</Text>
                  </View>
                  <View style={[styles.compliancePill, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                    <Text style={[styles.compliancePct, { color }]}>{project.compliancePercent}%</Text>
                    <Text style={[styles.complianceLabel, { color }]}>{statusLabel}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${project.compliancePercent}%`, backgroundColor: color }]} />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerItem}>📍 {project.location}</Text>
                  <Text style={styles.footerItem}>👤 {project.managerName.split(' ')[0]}</Text>
                </View>

                {/* Complaint button */}
                <TouchableOpacity
                  style={styles.complaintBtn}
                  onPress={() => router.push('/(citizen)/complaint')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.complaintBtnText}>
                    📣 {projectComplaints > 0 ? `${projectComplaints} Open Complaints · ` : ''}File a Grievance
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Compliance data is updated after each official inspection. For emergencies, call the district helpline: 1800-XXX-XXXX (toll-free).
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 30 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginBottom: 16 },
  appName: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  portalLabel: { fontSize: FONT.xs, color: COLORS.citizenGreen, fontWeight: '600', marginTop: 2 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.citizenGreen + '20', borderWidth: 2, borderColor: COLORS.citizenGreen + '50', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.citizenGreen },

  welcomeBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.citizenGreen + '10', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.citizenGreen + '30' },
  welcomeIcon: { fontSize: 28 },
  welcomeTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  welcomeSub: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },

  sectionHeader: { marginBottom: 12 },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5 },

  projectCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  statusBar: { height: 4 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  projectName: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  projectType: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },
  compliancePill: { borderRadius: RADIUS.lg, padding: 10, alignItems: 'center', borderWidth: 1, minWidth: 70 },
  compliancePct: { fontSize: FONT.xl, fontWeight: '900', letterSpacing: -0.5 },
  complianceLabel: { fontSize: FONT.xs, fontWeight: '700', marginTop: 2 },

  progressTrack: { height: 6, backgroundColor: COLORS.surfaceSunken, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 3 },

  cardFooter: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  footerItem: { fontSize: FONT.xs, color: COLORS.textSecondary },

  complaintBtn: { backgroundColor: COLORS.surfaceSunken, borderRadius: RADIUS.lg, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  complaintBtnText: { fontSize: FONT.xs, color: COLORS.citizenGreen, fontWeight: '700' },

  infoNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: 14, marginTop: 8, borderWidth: 1, borderColor: COLORS.border },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 18 },
});
