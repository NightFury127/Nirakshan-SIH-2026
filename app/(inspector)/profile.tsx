import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';

// ── APP META ──────────────────────────────────────────────────────────────────
const APP_VERSION = '1.0.0';
const API_STATUS  = 'Local Mock';

// ── PROFILE ROW ───────────────────────────────────────────────────────────────
function ProfileRow({
  icon,
  label,
  value,
  valueColor,
  noBorder = false,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.profileRow, noBorder && { borderBottomWidth: 0 }]}>
      <Text style={styles.profileRowIcon}>{icon}</Text>
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={[styles.profileRowValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

// ── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router      = useRouter();
  const currentUser = useAppStore(s => s.currentUser);
  const logout      = useAppStore(s => s.logout);
  const inspections = useAppStore(s => s.inspections);

  const myInspections = inspections.filter(
    i => i.assignedInspectorId === currentUser?.id
  );
  const completed = myInspections.filter(i => i.status === 'COMPLETED').length;
  const pending   = myInspections.filter(
    i => i.status === 'PENDING' || i.status === 'IN_PROGRESS'
  ).length;

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the inspector portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setLoggingOut(true);
            setTimeout(() => {
              logout();
              router.replace('/login');
            }, 300);
          },
        },
      ]
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerFallback}>
          <Text style={styles.fallbackText}>No user session found.</Text>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.logoutBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── AVATAR HEADER ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser.avatarInitials}</Text>
          </View>
          <Text style={styles.userName}>{currentUser.name}</Text>
          {currentUser.badgeNumber && (
            <View style={styles.badgeTag}>
              <Text style={styles.badgeTagText}>🪪 {currentUser.badgeNumber}</Text>
            </View>
          )}
          <View style={styles.statusTag}>
            <View style={styles.statusDot} />
            <Text style={styles.statusTagText}>ACTIVE</Text>
          </View>
        </View>

        {/* ── QUICK STATS ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={styles.statValue}>{myInspections.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, SHADOW.card]}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* ── EMPLOYEE INFORMATION ── */}
        <SectionCard title="👤 Employee Information">
          <ProfileRow icon="📛" label="Full Name"    value={currentUser.name} />
          <ProfileRow icon="🆔" label="Role"         value="Field Inspector" />
          {currentUser.designation && (
            <ProfileRow icon="💼" label="Designation" value={currentUser.designation} />
          )}
          {currentUser.district && (
            <ProfileRow icon="🗺️" label="District"    value={currentUser.district} />
          )}
          {currentUser.badgeNumber && (
            <ProfileRow icon="🪪" label="Badge Number" value={currentUser.badgeNumber} />
          )}
        </SectionCard>

        {/* ── CONTACT ── */}
        <SectionCard title="📞 Contact">
          <ProfileRow icon="✉️" label="Email" value={currentUser.email} />
          <ProfileRow
            icon="📱"
            label="Phone"
            value={currentUser.phone ?? '—'}
            noBorder
          />
        </SectionCard>

        {/* ── ACCOUNT ── */}
        <SectionCard title="🔐 Account">
          <ProfileRow
            icon="✅"
            label="Account Status"
            value="Active · Verified"
            valueColor={COLORS.success}
          />
          <ProfileRow
            icon="🛡️"
            label="Access Level"
            value="Inspector"
            valueColor={COLORS.inspectorBlue}
            noBorder
          />
        </SectionCard>

        {/* ── APPLICATION ── */}
        <SectionCard title="ℹ️ Application">
          <ProfileRow icon="📦" label="App Version" value={`v${APP_VERSION}`} />
          <ProfileRow
            icon="🔌"
            label="Data Source"
            value={API_STATUS}
            valueColor={COLORS.warning}
          />
          <ProfileRow
            icon="🏛️"
            label="Portal"
            value="NIRIKSHAN"
            noBorder
          />
        </SectionCard>

        {/* ── SIGN OUT ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          NIRIKSHAN · National Infrastructure &amp; Service Inspection Portal{'\n'}
          Government of India · Secure Session
        </Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 40 },

  centerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  fallbackText: { fontSize: FONT.md, color: COLORS.textSecondary },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.inspectorBlue + '25',
    borderWidth: 3,
    borderColor: COLORS.inspectorBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: FONT['2xl'],
    fontWeight: '900',
    color: COLORS.inspectorBlue,
  },
  userName: {
    fontSize: FONT['2xl'],
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeTag: {
    backgroundColor: COLORS.inspectorBlue + '18',
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.inspectorBlue + '40',
    marginBottom: 8,
  },
  badgeTagText: {
    fontSize: FONT.xs,
    color: COLORS.inspectorBlue,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.success + '15',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusTagText: {
    fontSize: FONT.xs,
    color: COLORS.success,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },

  // Section card
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

  // Profile row
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  profileRowIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  profileRowLabel: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary },
  profileRowValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    maxWidth: 180,
    textAlign: 'right',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.danger + '18',
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
  },
  logoutIcon: { fontSize: 18 },
  logoutBtnText: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: COLORS.danger,
  },

  footer: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
