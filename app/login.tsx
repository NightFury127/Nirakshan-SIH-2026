import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../src/theme';

type Role = 'official' | 'inspector' | 'citizen';
type AuthMode = 'login' | 'register';

const ROLE_CONFIG: Record<Role, {
  label: string;
  icon: string;
  color: string;
  tagline: string;
  route: string;
}> = {
  official: {
    label: 'Official',
    icon: '🏛️',
    color: COLORS.officialGold,
    tagline: 'District Administration & Command Center',
    route: '/(official)',
  },
  inspector: {
    label: 'Inspector',
    icon: '📋',
    color: COLORS.inspectorBlue,
    tagline: 'Field Verification & GPS Geotagged Audits',
    route: '/(inspector)',
  },
  citizen: {
    label: 'Citizen',
    icon: '👥',
    color: COLORS.citizenGreen,
    tagline: 'Public Transparency & Grievance Portal',
    route: '/(citizen)',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const loginWithCredentials = useAppStore(s => s.loginWithCredentials);
  const registerUser = useAppStore(s => s.registerUser);
  // Live system stats — visible on login screen to confirm sync is working
  const projects    = useAppStore(s => s.projects);
  const inspections = useAppStore(s => s.inspections);

  const [selectedRole, setSelectedRole] = useState<Role>('official');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Clean, empty form fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Varanasi');
  const [designation, setDesignation] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeRoleConfig = ROLE_CONFIG[selectedRole];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (authMode === 'login') {
      if (!identifier.trim()) {
        setErrorMessage('Please enter your email or registered phone number.');
        return;
      }
      if (!password.trim()) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const res = loginWithCredentials(identifier, password, selectedRole);
        setLoading(false);

        if (res.success) {
          setSuccessMessage(`Authenticated as ${activeRoleConfig.label}! Redirecting...`);
          setTimeout(() => {
            router.replace(activeRoleConfig.route as any);
          }, 400);
        } else {
          setErrorMessage(res.error || 'Authentication failed.');
        }
      }, 500);
    } else {
      // Registration validation
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!identifier.trim()) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      if (!password.trim() || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const res = registerUser({
          name,
          email: identifier,
          phone: phone || '',
          password,
          role: selectedRole,
          district: district || 'Varanasi',
          designation,
          badgeNumber,
        });
        setLoading(false);

        if (res.success) {
          setSuccessMessage(`Account created successfully! Redirecting to ${activeRoleConfig.label} Portal...`);
          setTimeout(() => {
            router.replace(activeRoleConfig.route as any);
          }, 500);
        } else {
          setErrorMessage(res.error || 'Registration failed.');
        }
      }, 600);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.emblemBadge}>
              <Text style={{ fontSize: 32 }}>🏛️</Text>
            </View>
            <Text style={styles.brandTitle}>NIRIKSHAN</Text>
            <Text style={styles.brandSubtitle}>
              National Infrastructure & Service Inspection Portal
            </Text>
            <View style={styles.govTag}>
              <Text style={styles.govTagText}>GOVERNMENT OF INDIA · SECURE ACCESS</Text>
            </View>
          </View>
          {/* System Status — shows live data so user knows sync is working */}
          {projects.length > 0 && (
            <View style={styles.syncBar}>
              <View style={styles.syncDot} />
              <Text style={styles.syncText}>
                {projects.length} project{projects.length !== 1 ? 's' : ''} in system
                {'  ·  '}{inspections.length} inspection{inspections.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <View style={[styles.authCard, SHADOW.card]}>
            
            {/* 3-Role Selector */}
            <Text style={styles.sectionHeading}>SELECT ROLE</Text>
            <View style={styles.roleTabsContainer}>
              {(['official', 'inspector', 'citizen'] as Role[]).map((role) => {
                const conf = ROLE_CONFIG[role];
                const isSelected = selectedRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleTab,
                      isSelected && {
                        backgroundColor: conf.color + '15',
                        borderColor: conf.color,
                      },
                    ]}
                    onPress={() => handleRoleSelect(role)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleTabIcon}>{conf.icon}</Text>
                    <Text
                      style={[
                        styles.roleTabText,
                        isSelected && { color: conf.color, fontWeight: '800' },
                      ]}
                    >
                      {conf.label}
                    </Text>
                    {isSelected && (
                      <View
                        style={[styles.roleActiveDot, { backgroundColor: conf.color }]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Role Info Banner */}
            <View
              style={[
                styles.roleInfoBanner,
                { backgroundColor: activeRoleConfig.color + '12', borderColor: activeRoleConfig.color + '35' },
              ]}
            >
              <Text style={styles.roleInfoIcon}>{activeRoleConfig.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleInfoTitle, { color: activeRoleConfig.color }]}>
                  {activeRoleConfig.label} Login
                </Text>
                <Text style={styles.roleInfoTagline}>{activeRoleConfig.tagline}</Text>
              </View>
            </View>

            {/* Mode Switch (Sign In vs Create Account) */}
            <View style={styles.modeSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  authMode === 'login' && styles.modeButtonActive,
                ]}
                onPress={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIdentifier('');
                  setPassword('');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    authMode === 'login' && styles.modeButtonTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  authMode === 'register' && styles.modeButtonActive,
                ]}
                onPress={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIdentifier('');
                  setPassword('');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    authMode === 'register' && styles.modeButtonTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Feedback Messages */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.successBanner}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Form Fields */}
            {authMode === 'register' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>
                {authMode === 'login' ? 'Email or Mobile Number *' : 'Email Address *'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={
                  authMode === 'login'
                    ? 'Enter your registered email or phone'
                    : 'Enter email address'
                }
                placeholderTextColor={COLORS.textMuted}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {authMode === 'register' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {authMode === 'register' && selectedRole === 'inspector' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Inspector Badge ID (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. INS-2024-0089"
                  placeholderTextColor={COLORS.textMuted}
                  value={badgeNumber}
                  onChangeText={setBadgeNumber}
                />
              </View>
            )}

            {authMode === 'register' && selectedRole === 'official' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Designation / Department</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. District Magistrate / DDO"
                  placeholderTextColor={COLORS.textMuted}
                  value={designation}
                  onChangeText={setDesignation}
                />
              </View>
            )}

            {/* Action Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: activeRoleConfig.color },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {authMode === 'login'
                    ? `Sign In as ${activeRoleConfig.label}`
                    : `Create ${activeRoleConfig.label} Account`}
                </Text>
              )}
            </TouchableOpacity>

            {/* Mode Switch Footer Note */}
            <View style={styles.footerToggleRow}>
              <Text style={styles.footerToggleText}>
                {authMode === 'login'
                  ? "Don't have an account?"
                  : 'Already have an existing account?'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIdentifier('');
                  setPassword('');
                  if (authMode === 'login') {
                    setAuthMode('register');
                  } else {
                    setAuthMode('login');
                  }
                }}
              >
                <Text style={[styles.footerToggleAction, { color: activeRoleConfig.color }]}>
                  {authMode === 'login' ? ' Create Account' : ' Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Footer Security Notice */}
          <View style={styles.securityFooter}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              256-Bit Encrypted · Role-Based Access Control · National Data Protection Standards
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Sync status bar
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success + '18',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.success + '35',
    marginBottom: 12,
    alignSelf: 'center',
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  syncText: {
    fontSize: FONT.xs,
    color: COLORS.success,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emblemBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: FONT['3xl'],
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  govTag: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  govTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  authCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },

  roleTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  roleTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  roleTabText: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  roleActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  roleInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  roleInfoIcon: {
    fontSize: 22,
  },
  roleInfoTitle: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  roleInfoTagline: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 18,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
  },
  modeButtonText: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modeButtonTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.danger + '18',
    borderColor: COLORS.danger + '40',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    fontSize: FONT.xs,
    color: COLORS.danger,
    lineHeight: 16,
    fontWeight: '600',
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.success + '18',
    borderColor: COLORS.success + '40',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 16,
  },
  successText: {
    flex: 1,
    fontSize: FONT.xs,
    color: COLORS.success,
    lineHeight: 16,
    fontWeight: '600',
  },

  fieldGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceSunken,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
  },

  submitButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  submitButtonText: {
    fontSize: FONT.sm,
    fontWeight: '800',
    color: '#0F1117',
    letterSpacing: 0.5,
  },

  footerToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerToggleText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  footerToggleAction: {
    fontSize: FONT.xs,
    fontWeight: '700',
  },

  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  securityIcon: {
    fontSize: 12,
  },
  securityText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});
