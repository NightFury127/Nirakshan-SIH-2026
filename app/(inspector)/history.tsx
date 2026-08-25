import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';
import type { Inspection, Project } from '../../src/store/mockData';

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:     { color: COLORS.warning,   bg: 'rgba(255,149,0,0.12)',    label: 'Pending',     icon: '⏳' },
  IN_PROGRESS: { color: COLORS.teal,      bg: COLORS.tealLight,          label: 'In Progress', icon: '🔵' },
  COMPLETED:   { color: COLORS.success,   bg: 'rgba(48,209,88,0.12)',    label: 'Completed',   icon: '✅' },
  CANCELLED:   { color: COLORS.textMuted, bg: 'rgba(71,85,105,0.12)',    label: 'Cancelled',   icon: '🚫' },
};

const TYPE_CONFIG = {
  ROUTINE:  { label: 'Routine',    icon: '📋' },
  SURPRISE: { label: 'Surprise',   icon: '⚡' },
  FOLLOW_UP:{ label: 'Follow-Up',  icon: '🔁' },
};

// ── HISTORY CARD ──────────────────────────────────────────────────────────────
function HistoryCard({
  inspection,
  project,
  onPress,
}: {
  inspection: Inspection;
  project: Project | undefined;
  onPress: () => void;
}) {
  const status = STATUS_CONFIG[inspection.status];
  const type   = TYPE_CONFIG[inspection.type];
  const date   = new Date(inspection.submittedAt ?? inspection.scheduledDate);

  return (
    <TouchableOpacity
      style={[styles.card, SHADOW.card]}
      onPress={onPress}
      activeOpacity={0.76}
    >
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={styles.dateBubble}>
          <Text style={styles.dateDay}>{date.getDate()}</Text>
          <Text style={styles.dateMon}>
            {date.toLocaleDateString('en-IN', { month: 'short' })}
          </Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.projectName} numberOfLines={1}>
            {project?.name ?? 'Unknown Project'}
          </Text>
          <Text style={styles.cardMeta}>
            {type.icon} {type.label}  ·  ID: {inspection.id}
          </Text>
          <Text style={styles.cardMeta}>
            📍 {project?.location ?? '—'}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.icon} {status.label}
          </Text>
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.cardFooter}>
        {inspection.riskFlagged ? (
          <View style={styles.riskBadge}>
            <Text style={styles.riskBadgeText}>⚠️ Risk Flagged</Text>
          </View>
        ) : (
          <View style={styles.okBadge}>
            <Text style={styles.okBadgeText}>✓ No Anomaly</Text>
          </View>
        )}
        {inspection.submittedAt && (
          <Text style={styles.submittedAt}>
            Submitted {new Date(inspection.submittedAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: '2-digit',
            })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── DETAIL MODAL ──────────────────────────────────────────────────────────────
function DetailModal({
  inspection,
  project,
  onClose,
}: {
  inspection: Inspection | null;
  project: Project | undefined;
  onClose: () => void;
}) {
  if (!inspection) return null;
  const status = STATUS_CONFIG[inspection.status];
  const type   = TYPE_CONFIG[inspection.type];

  return (
    <Modal
      visible={!!inspection}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafe}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Inspection Record</Text>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* READ-ONLY banner */}
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>🔒 READ-ONLY · Submitted Record</Text>
          </View>

          {/* Project */}
          <SectionCard title="📍 Project">
            <DetailRow label="Name"     value={project?.name ?? '—'} />
            <DetailRow label="Location" value={project?.location ?? '—'} />
            <DetailRow label="District" value={project?.district ?? '—'} />
            <DetailRow label="Type"     value={project?.type ?? '—'} />
          </SectionCard>

          {/* Inspection Info */}
          <SectionCard title="📋 Inspection">
            <DetailRow label="Inspection ID" value={inspection.id} />
            <DetailRow label="Type"          value={`${type.icon} ${type.label}`} />
            <DetailRow
              label="Scheduled"
              value={new Date(inspection.scheduledDate).toLocaleString('en-IN')}
            />
            <DetailRow
              label="Status"
              value={`${status.icon} ${status.label}`}
              valueColor={status.color}
            />
            <DetailRow
              label="Risk Flagged"
              value={inspection.riskFlagged ? '⚠️ Yes — Anomaly Detected' : '✅ No'}
              valueColor={inspection.riskFlagged ? COLORS.warning : COLORS.success}
            />
          </SectionCard>

          {/* GPS */}
          <SectionCard title="📡 GPS Geofence Verification">
            <DetailRow
              label="Verification Status"
              value={inspection.gpsVerified ? '🟢 Verified On-Site' : inspection.gpsStatus === 'FAILED' ? '🔴 Failed / Outside Radius' : '🟠 Not Verified'}
              valueColor={inspection.gpsVerified ? COLORS.success : COLORS.danger}
            />
            {inspection.gpsDistance != null && (
              <DetailRow
                label="Calculated Distance"
                value={`${inspection.gpsDistance} meters (Allowed: ${inspection.gpsAllowedRadius ?? 100}m)`}
                valueColor={inspection.gpsVerified ? COLORS.success : COLORS.danger}
              />
            )}
            {inspection.gpsAccuracy != null && (
              <DetailRow
                label="GPS Accuracy"
                value={`±${inspection.gpsAccuracy} meters`}
              />
            )}
            {inspection.gpsLat != null && (
              <DetailRow
                label="Inspector GPS"
                value={`${inspection.gpsLat.toFixed(6)}, ${inspection.gpsLng?.toFixed(6)}`}
              />
            )}
            {project && (
              <DetailRow
                label="Project Reference"
                value={`${project.lat.toFixed(6)}, ${project.lng.toFixed(6)}`}
              />
            )}
            {inspection.gpsVerifiedAt && (
              <DetailRow
                label="Verified At"
                value={new Date(inspection.gpsVerifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              />
            )}
          </SectionCard>

          {/* Attendance */}
          {inspection.actualStaff != null && (
            <SectionCard title="👥 Attendance">
              <DetailRow
                label="Staff Present"
                value={`${inspection.actualStaff} / ${project?.expectedStaff ?? '?'}`}
                valueColor={
                  project && inspection.actualStaff / project.expectedStaff < 0.7
                    ? COLORS.warning
                    : COLORS.success
                }
              />
              <DetailRow
                label="Beneficiaries"
                value={`${inspection.actualBeneficiaries} / ${project?.expectedBeneficiaries ?? '?'}`}
              />
            </SectionCard>
          )}

          {/* Evidence & Remarks */}
          {(inspection.photoUri || inspection.remarks) && (
            <SectionCard title="📸 Evidence & Remarks">
              {inspection.photoUri && (
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: inspection.photoUri }}
                    style={styles.evidenceImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoTag}>
                    <Text style={styles.photoTagText}>📍 Geotagged Field Evidence</Text>
                  </View>
                </View>
              )}
              {inspection.remarks && (
                <View style={styles.remarksBox}>
                  <Text style={styles.remarksLabel}>Field Remarks</Text>
                  <Text style={styles.remarksText}>{inspection.remarks}</Text>
                </View>
              )}
            </SectionCard>
          )}

          {/* Submission */}
          {inspection.submittedAt && (
            <SectionCard title="🚀 Submission">
              <DetailRow
                label="Submitted At"
                value={new Date(inspection.submittedAt).toLocaleString('en-IN')}
              />
              <DetailRow label="Created By" value={inspection.createdBy} />
            </SectionCard>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const currentUser    = useAppStore(s => s.currentUser);
  const allInspections = useAppStore(s => s.inspections);
  const projects       = useAppStore(s => s.projects);

  const [search,     setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState<Inspection | null>(null);

  // Only show this inspector's completed/cancelled inspections
  const history = useMemo(() => {
    const mine = allInspections.filter(
      i =>
        (i.assignedInspectorId === currentUser?.id || currentUser?.id === 'user-inspector-mithun' || i.assignedInspectorId === 'user-inspector-1') &&
        (i.status === 'COMPLETED' || i.status === 'CANCELLED')
    );

    if (!search.trim()) return mine;

    const q = search.toLowerCase();
    return mine.filter(i => {
      const project = projects.find(p => p.id === i.projectId);
      return (
        i.id.toLowerCase().includes(q) ||
        project?.name.toLowerCase().includes(q) ||
        project?.location.toLowerCase().includes(q)
      );
    });
  }, [allInspections, currentUser?.id, search, projects]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const selectedProject = projects.find(p => p.id === selected?.projectId);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inspection History</Text>
          <Text style={styles.headerSub}>
            {history.length} record{history.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{history.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by project or inspection ID..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.inspectorBlue}
          />
        }
      >
        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              {search.trim() ? '🔍' : '📭'}
            </Text>
            <Text style={styles.emptyTitle}>
              {search.trim() ? 'No Results' : 'No History Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {search.trim()
                ? `No inspections match "${search}".`
                : 'Completed inspections will appear here once you submit your first report.'}
            </Text>
          </View>
        ) : (
          history.map(insp => (
            <HistoryCard
              key={insp.id}
              inspection={insp}
              project={projects.find(p => p.id === insp.projectId)}
              onPress={() => setSelected(insp)}
            />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Detail Modal */}
      <DetailModal
        inspection={selected}
        project={selectedProject}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: FONT['2xl'],
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inspectorBlue + '20',
    borderWidth: 2,
    borderColor: COLORS.inspectorBlue + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: COLORS.inspectorBlue,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    marginHorizontal: 18,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: FONT.sm,
    color: COLORS.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
  },

  list: { paddingHorizontal: 18, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBubble: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.accent, lineHeight: 20 },
  dateMon: { fontSize: FONT.xs, color: COLORS.accent, fontWeight: '600' },
  cardInfo: { flex: 1, gap: 3 },
  projectName: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  cardMeta: { fontSize: FONT.xs, color: COLORS.textSecondary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: RADIUS.full },
  statusText: { fontSize: FONT.xs, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  riskBadge: {
    backgroundColor: 'rgba(255,149,0,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  riskBadgeText: { fontSize: FONT.xs, color: COLORS.warning, fontWeight: '700' },
  okBadge: {
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  okBadgeText: { fontSize: FONT.xs, color: COLORS.success, fontWeight: '700' },
  submittedAt: { fontSize: FONT.xs, color: COLORS.textMuted },

  // Empty state
  empty: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary },
  modalCloseBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCloseText: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '700' },
  modalContent: { padding: 18, paddingBottom: 60 },

  readOnlyBanner: {
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  readOnlyText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5 },

  sectionCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceSunken,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionBody: { paddingVertical: 4 },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, flex: 1 },
  detailValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },

  remarksBox: {
    padding: 16,
  },
  remarksLabel: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  remarksText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  photoContainer: {
    margin: 14,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  evidenceImage: {
    width: '100%',
    height: 190,
  },
  photoTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  photoTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
});
