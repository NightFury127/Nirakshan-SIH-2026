import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';
import type { Complaint } from '../../src/store/mockData';

const ISSUE_TYPES: Complaint['issueType'][] = [
  'Poor Service',
  'Infrastructure',
  'Absenteeism',
  'Corruption',
  'Other',
];

const ISSUE_ICONS: Record<string, string> = {
  'Poor Service': '🛑',
  'Infrastructure': '🏚️',
  'Absenteeism': '👻',
  'Corruption': '💰',
  'Other': '📋',
};

export default function ComplaintScreen() {
  const projects = useAppStore(s => s.projects);
  const submitComplaint = useAppStore(s => s.submitComplaint);
  const complaints = useAppStore(s => s.complaints);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Complaint['issueType'] | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const canSubmit = selectedProjectId && selectedIssue && description.trim().length >= 10;

  const myComplaints = complaints.filter(c => c.citizenId === 'user-citizen-1');

  const handleSubmit = () => {
    if (!canSubmit) return;
    Alert.alert(
      'Submit Grievance',
      `Your complaint about "${selectedProject?.name}" will be registered in the national system and escalated to the District Official.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            setSubmitting(true);
            setTimeout(() => {
              submitComplaint(selectedProjectId!, selectedIssue!, description);
              setSubmitting(false);
              setSubmitted(true);
            }, 1200);
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedProjectId(null);
    setSelectedIssue(null);
    setDescription('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Grievance Filed!</Text>
          <Text style={styles.successSub}>
            Your complaint has been registered under Grievance ID #{Date.now().toString().slice(-6)}.
            The District Official will be notified and the project risk score has been updated.
          </Text>
          <View style={styles.successDetail}>
            <Text style={styles.successDetailText}>📋 Project: {selectedProject?.name}</Text>
            <Text style={styles.successDetailText}>🏷️ Issue: {selectedIssue}</Text>
            <Text style={styles.successDetailText}>📅 Filed: {new Date().toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.submitNewBtn} onPress={resetForm}>
            <Text style={styles.submitNewBtnText}>+ File Another Grievance</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📣 File a Grievance</Text>
          <Text style={styles.subtitle}>Report issues with government projects in your area</Text>
        </View>

        {/* Form */}
        <View style={[styles.formCard, SHADOW.card]}>

          {/* Project Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Select Project *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowProjectPicker(!showProjectPicker)}
              activeOpacity={0.8}
            >
              <Text style={selectedProject ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedProject ? selectedProject.name : 'Choose a project...'}
              </Text>
              <Text style={styles.pickerArrow}>{showProjectPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showProjectPicker && (
              <View style={styles.dropdown}>
                {projects.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.dropdownItem, selectedProjectId === p.id && styles.dropdownItemSelected]}
                    onPress={() => { setSelectedProjectId(p.id); setShowProjectPicker(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemText, selectedProjectId === p.id && styles.dropdownItemTextSelected]}>
                        {p.name}
                      </Text>
                      <Text style={styles.dropdownItemSub}>{p.type}  ·  {p.district}</Text>
                    </View>
                    {selectedProjectId === p.id && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Issue Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Issue Type *</Text>
            <View style={styles.issueGrid}>
              {ISSUE_TYPES.map(issue => (
                <TouchableOpacity
                  key={issue}
                  style={[styles.issueChip, selectedIssue === issue && styles.issueChipSelected]}
                  onPress={() => setSelectedIssue(issue)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.issueChipIcon}>{ISSUE_ICONS[issue]}</Text>
                  <Text style={[styles.issueChipText, selectedIssue === issue && styles.issueChipTextSelected]}>
                    {issue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description * (min. 10 characters)</Text>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              placeholder="Describe the issue in detail. Include specific observations, dates, and any other relevant information..."
              placeholderTextColor={COLORS.textMuted}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, description.length < 10 && { color: COLORS.danger }]}>
              {description.length} / minimum 10 characters
            </Text>
          </View>

          {/* Anonymous note */}
          <View style={styles.anonymousNote}>
            <Text style={styles.anonymousIcon}>🔒</Text>
            <Text style={styles.anonymousText}>
              Your identity is protected. Complaints are routed to the District Official without revealing personal information.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>📤 Submit Grievance</Text>
          }
        </TouchableOpacity>

        {/* My Past Complaints */}
        {myComplaints.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>MY COMPLAINTS</Text>
            {myComplaints.slice(0, 3).map(c => {
              const proj = projects.find(p => p.id === c.projectId);
              const statusColor = c.status === 'OPEN' ? COLORS.danger : c.status === 'UNDER_REVIEW' ? COLORS.warning : COLORS.success;
              return (
                <View key={c.id} style={[styles.myComplaintCard, SHADOW.card]}>
                  <View style={styles.myComplaintHeader}>
                    <Text style={styles.myComplaintIssue}>{ISSUE_ICONS[c.issueType]} {c.issueType}</Text>
                    <View style={[styles.myStatusPill, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.myStatusText, { color: statusColor }]}>{c.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.myComplaintProject} numberOfLines={1}>{proj?.name}</Text>
                  <Text style={styles.myComplaintDesc} numberOfLines={2}>{c.description}</Text>
                  <Text style={styles.myComplaintDate}>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 40 },

  header: { paddingTop: 20, marginBottom: 20 },
  title: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary },

  formCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS['2xl'], padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },

  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },

  picker: { backgroundColor: COLORS.surfaceSunken, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerValue: { fontSize: FONT.md, color: COLORS.textPrimary, flex: 1, fontWeight: '600' },
  pickerPlaceholder: { fontSize: FONT.md, color: COLORS.textMuted, flex: 1 },
  pickerArrow: { fontSize: FONT.sm, color: COLORS.textMuted, marginLeft: 8 },

  dropdown: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderBright, marginTop: 6, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownItemSelected: { backgroundColor: COLORS.accentLight },
  dropdownItemText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '500' },
  dropdownItemTextSelected: { color: COLORS.accent, fontWeight: '700' },
  dropdownItemSub: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
  checkmark: { fontSize: FONT.md, color: COLORS.accent, fontWeight: '800', marginLeft: 8 },

  issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  issueChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceSunken, borderWidth: 1, borderColor: COLORS.border },
  issueChipSelected: { backgroundColor: COLORS.citizenGreen + '15', borderColor: COLORS.citizenGreen + '60' },
  issueChipIcon: { fontSize: 14 },
  issueChipText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '600' },
  issueChipTextSelected: { color: COLORS.citizenGreen },

  textarea: { backgroundColor: COLORS.surfaceSunken, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, fontSize: FONT.md, paddingHorizontal: 14, paddingVertical: 12, minHeight: 130 },
  charCount: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 4, textAlign: 'right' },

  anonymousNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.surfaceSunken, borderRadius: RADIUS.md, padding: 12 },
  anonymousIcon: { fontSize: 16 },
  anonymousText: { flex: 1, fontSize: FONT.xs, color: COLORS.textMuted, lineHeight: 18 },

  submitBtn: { backgroundColor: COLORS.citizenGreen, borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: FONT.md, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  sectionLabel: { fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 10 },

  myComplaintCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  myComplaintHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  myComplaintIssue: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.textPrimary },
  myStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  myStatusText: { fontSize: FONT.xs, fontWeight: '700' },
  myComplaintProject: { fontSize: FONT.xs, color: COLORS.textSecondary, marginBottom: 4 },
  myComplaintDesc: { fontSize: FONT.sm, color: COLORS.textMuted, lineHeight: 18, marginBottom: 6 },
  myComplaintDate: { fontSize: FONT.xs, color: COLORS.textMuted },

  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 20 },
  successTitle: { fontSize: FONT['3xl'], fontWeight: '900', color: COLORS.citizenGreen, marginBottom: 12, letterSpacing: -0.5 },
  successSub: { fontSize: FONT.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  successDetail: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, padding: 16, width: '100%', borderWidth: 1, borderColor: COLORS.border, gap: 8, marginBottom: 24 },
  successDetailText: { fontSize: FONT.sm, color: COLORS.textSecondary },
  submitNewBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.full },
  submitNewBtnText: { fontSize: FONT.md, fontWeight: '800', color: '#fff' },
});
