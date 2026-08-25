import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';
import { InspectionCard } from '../../src/components/InspectionCard';

export default function InspectorTasks() {
  const router = useRouter();
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const allInspections = useAppStore(s => s.inspections);
  const projects = useAppStore(s => s.projects);

  const inspections = useMemo(() => {
    if (!currentUser?.id) return allInspections;
    return allInspections.filter(i => i.assignedInspectorId === currentUser.id);
  }, [allInspections, currentUser?.id]);

  const pending = inspections.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS');
  const completed = inspections.filter(i => i.status === 'COMPLETED');

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); };

  const surpriseCount = pending.filter(i => i.type === 'SURPRISE').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.inspectorBlue} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Field App</Text>
            <Text style={styles.userName}>{currentUser?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.designation}>{currentUser?.badgeNumber}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => { logout(); router.replace('/login'); }}>
            <Text style={styles.avatarText}>{currentUser?.avatarInitials}</Text>
          </TouchableOpacity>
        </View>

        {/* Date strip */}
        <View style={styles.dateBanner}>
          <Text style={styles.dateText}>📅 {today}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{pending.length} Task{pending.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Surprise alert */}
        {surpriseCount > 0 && (
          <View style={styles.surpriseAlert}>
            <Text style={styles.surpriseAlertIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.surpriseAlertTitle}>{surpriseCount} Surprise Inspection{surpriseCount > 1 ? 's' : ''} Assigned!</Text>
              <Text style={styles.surpriseAlertSub}>Official has dispatched an urgent inspection. Proceed immediately.</Text>
            </View>
          </View>
        )}

        {/* Pending Tasks */}
        <Text style={styles.sectionLabel}>TODAY'S ASSIGNMENTS</Text>
        {pending.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>No pending inspections assigned for today.</Text>
          </View>
        ) : (
          pending.map(insp => {
            const project = projects.find(p => p.id === insp.projectId);
            return (
              <InspectionCard
                key={insp.id}
                inspection={insp}
                projectName={project?.name ?? 'Unknown Project'}
                onPress={() => router.push(`/(inspector)/inspection/${insp.id}`)}
              />
            );
          })
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>COMPLETED</Text>
            {completed.slice(0, 3).map(insp => {
              const project = projects.find(p => p.id === insp.projectId);
              return (
                <InspectionCard
                  key={insp.id}
                  inspection={insp}
                  projectName={project?.name ?? 'Unknown Project'}
                />
              );
            })}
          </>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={styles.statValue}>{inspections.length}</Text>
            <Text style={styles.statLabel}>Total Assigned</Text>
          </View>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{completed.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{pending.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 30 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 20, marginBottom: 16 },
  greeting: { fontSize: FONT.sm, color: COLORS.textSecondary },
  userName: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  designation: { fontSize: FONT.xs, color: COLORS.inspectorBlue, fontWeight: '600', marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.inspectorBlue + '20', borderWidth: 2, borderColor: COLORS.inspectorBlue + '50', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONT.md, fontWeight: '800', color: COLORS.inspectorBlue },

  dateBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  dateText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '500' },
  countBadge: { backgroundColor: COLORS.inspectorBlue + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  countText: { fontSize: FONT.xs, color: COLORS.inspectorBlue, fontWeight: '700' },

  surpriseAlert: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  surpriseAlertIcon: { fontSize: 28 },
  surpriseAlertTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.officialGold },
  surpriseAlertSub: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },

  sectionLabel: { fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },

  emptyState: { alignItems: 'center', padding: 36, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  emptyText: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
});
