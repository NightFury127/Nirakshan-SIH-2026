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
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';
import { InspectionCard } from '../../src/components/InspectionCard';

// ─── PROJECT TYPE OPTIONS ──────────────────────────────────────────────────────
const PROJECT_TYPES = [
  'Anganwadi Centre',
  'Primary Health Centre',
  'Government School',
  'Nutrition Centre',
  'Infrastructure',
  'Community Hall',
  'Water Supply Scheme',
  'Other',
];

// ─── ADD PROJECT MODAL ────────────────────────────────────────────────────────
function AddProjectModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [type, setType] = useState('');
  const [budget, setBudget] = useState('');
  const [contractor, setContractor] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [expectedStaff, setExpectedStaff] = useState('');
  const [expectedBeneficiaries, setExpectedBeneficiaries] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [showTypes, setShowTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(''); setLocation(''); setDistrict(''); setState('Uttar Pradesh');
    setType(''); setBudget(''); setContractor(''); setManagerName('');
    setManagerPhone(''); setExpectedStaff(''); setExpectedBeneficiaries('');
    setLat(''); setLng(''); setError(null); setSubmitting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    setError(null);
    if (!name.trim())        { setError('Project name is required.'); return; }
    if (!location.trim())    { setError('Location is required.'); return; }
    if (!district.trim())    { setError('District is required.'); return; }
    if (!type)               { setError('Please select a project type.'); return; }
    if (!contractor.trim())  { setError('Contractor name is required.'); return; }
    if (!managerName.trim()) { setError('Manager name is required.'); return; }
    if (!expectedStaff || isNaN(Number(expectedStaff)))
      { setError('Expected staff must be a valid number.'); return; }
    if (!expectedBeneficiaries || isNaN(Number(expectedBeneficiaries)))
      { setError('Expected beneficiaries must be a valid number.'); return; }

    setSubmitting(true);
    setTimeout(() => {
      onSubmit({
        name, location, district, state, type,
        budget: parseFloat(budget) || 0,
        contractor, managerName, managerPhone,
        expectedStaff: parseInt(expectedStaff, 10),
        expectedBeneficiaries: parseInt(expectedBeneficiaries, 10),
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
      });
      setSubmitting(false);
      reset();
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={modal.safe}>
        {/* Header */}
        <View style={modal.header}>
          <View>
            <Text style={modal.title}>Add New Project</Text>
            <Text style={modal.subtitle}>Registered projects appear in Official Dashboard</Text>
          </View>
          <TouchableOpacity style={modal.closeBtn} onPress={handleClose}>
            <Text style={modal.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={modal.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {error && (
              <View style={modal.errorBanner}>
                <Text style={modal.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* Project Type Picker */}
            <Text style={modal.label}>Project Type *</Text>
            <TouchableOpacity
              style={[modal.input, { justifyContent: 'center' }]}
              onPress={() => setShowTypes(!showTypes)}
            >
              <Text style={type ? modal.inputText : modal.placeholder}>
                {type || 'Select project type...'}
              </Text>
            </TouchableOpacity>
            {showTypes && (
              <View style={modal.typeList}>
                {PROJECT_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[modal.typeItem, type === t && modal.typeItemActive]}
                    onPress={() => { setType(t); setShowTypes(false); }}
                  >
                    <Text style={[modal.typeItemText, type === t && { color: COLORS.inspectorBlue, fontWeight: '700' }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Field label="Project Name *" value={name} onChangeText={setName} placeholder="e.g. Bhelupur Anganwadi Centre" />
            <Field label="Location / Address *" value={location} onChangeText={setLocation} placeholder="e.g. Near Shiva Temple, Ward 5" />
            <Field label="District *" value={district} onChangeText={setDistrict} placeholder="e.g. Varanasi" />
            <Field label="State" value={state} onChangeText={setState} placeholder="e.g. Uttar Pradesh" />
            <Field label="Budget (in Lakhs)" value={budget} onChangeText={setBudget} placeholder="e.g. 48.5" keyboardType="decimal-pad" />
            <Field label="Contractor / Agency *" value={contractor} onChangeText={setContractor} placeholder="e.g. M/s Sharma Constructions" />
            <Field label="Manager Name *" value={managerName} onChangeText={setManagerName} placeholder="e.g. Deepak Mishra" />
            <Field label="Manager Phone" value={managerPhone} onChangeText={setManagerPhone} placeholder="e.g. +91-9123456789" keyboardType="phone-pad" />

            <View style={modal.row}>
              <View style={{ flex: 1 }}>
                <Field label="Expected Staff *" value={expectedStaff} onChangeText={setExpectedStaff} placeholder="e.g. 12" keyboardType="number-pad" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Expected Beneficiaries *" value={expectedBeneficiaries} onChangeText={setExpectedBeneficiaries} placeholder="e.g. 85" keyboardType="number-pad" />
              </View>
            </View>

            <View style={modal.row}>
              <View style={{ flex: 1 }}>
                <Field label="Latitude (GPS)" value={lat} onChangeText={setLat} placeholder="e.g. 25.3176" keyboardType="decimal-pad" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Longitude (GPS)" value={lng} onChangeText={setLng} placeholder="e.g. 82.9739" keyboardType="decimal-pad" />
              </View>
            </View>

            <TouchableOpacity
              style={[modal.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={modal.submitBtnText}>✚ Register Project</Text>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
}) {
  return (
    <View style={modal.fieldGroup}>
      <Text style={modal.label}>{label}</Text>
      <TextInput
        style={modal.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="words"
      />
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function InspectorTasks() {
  const router = useRouter();
  const currentUser = useAppStore(s => s.currentUser);
  const logout      = useAppStore(s => s.logout);
  const allInspections = useAppStore(s => s.inspections);
  const projects    = useAppStore(s => s.projects);
  const addProject  = useAppStore(s => s.addProject);

  const inspections = useMemo(() => {
    if (!currentUser?.id) return allInspections;
    return allInspections.filter(i => i.assignedInspectorId === currentUser.id);
  }, [allInspections, currentUser?.id]);

  const pending   = inspections.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS');
  const completed = inspections.filter(i => i.status === 'COMPLETED');

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const [refreshing, setRefreshing] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); };
  const surpriseCount = pending.filter(i => i.type === 'SURPRISE').length;

  const handleAddProject = (data: any) => {
    addProject(data);
    setShowAddProject(false);
    Alert.alert(
      '✅ Project Registered',
      `"${data.name}" has been added and is now visible in the Official Dashboard.`,
      [{ text: 'OK' }]
    );
  };

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

        {/* ── REGISTER PROJECT SECTION ── */}
        <Text style={styles.sectionLabel}>REGISTER A PROJECT</Text>
        <TouchableOpacity
          style={[styles.addProjectCard, SHADOW.card]}
          onPress={() => setShowAddProject(true)}
          activeOpacity={0.8}
        >
          <View style={styles.addProjectIcon}>
            <Text style={{ fontSize: 28 }}>🏗️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addProjectTitle}>Add New Project</Text>
            <Text style={styles.addProjectSub}>
              Register a government project — visible instantly in Official Dashboard
            </Text>
          </View>
          <View style={styles.addProjectArrow}>
            <Text style={styles.addProjectArrowText}>＋</Text>
          </View>
        </TouchableOpacity>

        {/* Registered project count */}
        <View style={styles.projectCountRow}>
          <Text style={styles.projectCountText}>
            📊 {projects.length} project{projects.length !== 1 ? 's' : ''} registered in system
          </Text>
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

      {/* Add Project Modal */}
      <AddProjectModal
        visible={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={handleAddProject}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 30 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 20, marginBottom: 16 },
  greeting:    { fontSize: FONT.sm, color: COLORS.textSecondary },
  userName:    { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  designation: { fontSize: FONT.xs, color: COLORS.inspectorBlue, fontWeight: '600', marginTop: 2 },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.inspectorBlue + '20', borderWidth: 2, borderColor: COLORS.inspectorBlue + '50', alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: FONT.md, fontWeight: '800', color: COLORS.inspectorBlue },

  dateBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  dateText:    { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '500' },
  countBadge:  { backgroundColor: COLORS.inspectorBlue + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  countText:   { fontSize: FONT.xs, color: COLORS.inspectorBlue, fontWeight: '700' },

  sectionLabel: { fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },

  // Add Project card
  addProjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.inspectorBlue + '40',
  },
  addProjectIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inspectorBlue + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProjectTitle: { fontSize: FONT.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 3 },
  addProjectSub:   { fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 16 },
  addProjectArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.inspectorBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProjectArrowText: { fontSize: 18, color: '#fff', fontWeight: '900', lineHeight: 22 },

  projectCountRow: {
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  projectCountText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '600' },

  surpriseAlert:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  surpriseAlertIcon:  { fontSize: 28 },
  surpriseAlertTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.officialGold },
  surpriseAlertSub:   { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },

  emptyState: { alignItems: 'center', padding: 36, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  emptyIcon:  { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  emptyText:  { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center' },

  statsRow:   { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard:   { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue:  { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary },
  statLabel:  { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
});

// ─── MODAL STYLES ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.bg },
  header:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:    { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 3 },
  closeBtn: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border },
  closeTxt: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '700' },
  content:  { padding: 18, paddingBottom: 60 },

  errorBanner: { backgroundColor: COLORS.danger + '18', borderRadius: RADIUS.md, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.danger + '40' },
  errorText:   { fontSize: FONT.sm, color: COLORS.danger, fontWeight: '600' },

  fieldGroup: { marginBottom: 14 },
  label:      { fontSize: FONT.xs, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  input:      { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.textPrimary, fontSize: FONT.sm, minHeight: 46 },
  inputText:  { color: COLORS.textPrimary, fontSize: FONT.sm },
  placeholder:{ color: COLORS.textMuted, fontSize: FONT.sm },
  row:        { flexDirection: 'row' },

  typeList:      { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14, overflow: 'hidden' },
  typeItem:      { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  typeItemActive:{ backgroundColor: COLORS.inspectorBlue + '15' },
  typeItemText:  { fontSize: FONT.sm, color: COLORS.textSecondary },

  submitBtn:     { backgroundColor: COLORS.inspectorBlue, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnText: { fontSize: FONT.md, fontWeight: '800', color: '#fff' },
});
