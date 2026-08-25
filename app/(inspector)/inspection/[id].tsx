import React, { useState, useMemo } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../../src/theme';
import { formatGpsDistance, type GpsVerificationResult } from '../../../src/utils/gpsVerification';

type Step = 'gps' | 'attendance' | 'evidence' | 'review';

const STEPS: Step[] = ['gps', 'attendance', 'evidence', 'review'];
const STEP_LABELS = ['GPS Verify', 'Attendance', 'Evidence', 'Submit'];

export default function ActiveInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const allInspections = useAppStore(s => s.inspections);
  const allProjects = useAppStore(s => s.projects);
  const submitInspectionReport = useAppStore(s => s.submitInspectionReport);
  const updateInspection = useAppStore(s => s.updateInspection);
  const verifyInspectionGps = useAppStore(s => s.verifyInspectionGps);

  const inspection = useMemo(() => allInspections.find(i => i.id === id), [allInspections, id]);
  const project = useMemo(() => allProjects.find(p => p.id === inspection?.projectId), [allProjects, inspection?.projectId]);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('gps');

  // GPS state
  const [isVerifyingGps, setIsVerifyingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsResult, setGpsResult] = useState<GpsVerificationResult | null>(() => {
    if (inspection?.gpsVerified && inspection.gpsLat && inspection.gpsLng) {
      return {
        verified: true,
        distance: inspection.gpsDistance ?? 0,
        allowedRadius: inspection.gpsAllowedRadius ?? 100,
        inspectorLat: inspection.gpsLat,
        inspectorLng: inspection.gpsLng,
        projectLat: project?.lat ?? 0,
        projectLng: project?.lng ?? 0,
        accuracy: inspection.gpsAccuracy,
        timestamp: inspection.gpsVerifiedAt ?? new Date().toISOString(),
        status: 'VERIFIED',
        message: 'Previously verified on-site location.',
      };
    }
    return null;
  });

  // Attendance state
  const [actualStaff, setActualStaff] = useState('');
  const [actualBeneficiaries, setActualBeneficiaries] = useState('');

  // Evidence state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!inspection || !project) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.textSecondary }}>Inspection not found</Text>
      </View>
    );
  }

  if (inspection.status === 'COMPLETED' || submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successSub}>
            Inspection data has been recorded. The system will recalculate the risk score for "{project.name}".
          </Text>
          {inspection.riskFlagged && (
            <View style={styles.flaggedBanner}>
              <Text style={styles.flaggedText}>⚠️ Anomalies Detected — Risk Score has been updated. The Official has been notified.</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeBtnText}>← Back to Tasks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── REAL DEVICE GPS VERIFICATION ──────────────────────────────────────────
  const handleRealGpsVerify = async () => {
    setIsVerifyingGps(true);
    setGpsError(null);

    try {
      // 1. Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Location permission denied. Please grant GPS access in device settings.');
        setIsVerifyingGps(false);
        return;
      }

      // 2. Check if device location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setGpsError('Device location services (GPS) are turned off. Please enable GPS.');
        setIsVerifyingGps(false);
        return;
      }

      // 3. Acquire real device GPS position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // 4. Run through verification engine against registered project location
      const res = verifyInspectionGps(
        id,
        {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? undefined,
        },
        100
      );

      setGpsResult(res);
    } catch (err: any) {
      setGpsError(err?.message || 'Could not acquire GPS fix. Please ensure you have a clear view of the sky and try again.');
    } finally {
      setIsVerifyingGps(false);
    }
  };

  // ── DEMO SIMULATOR CONTROLS (FOR HACKATHON JUDGING) ──────────────────────
  const handleSimulateGps = (type: 'onsite' | 'offsite') => {
    setIsVerifyingGps(true);
    setGpsError(null);

    setTimeout(() => {
      let simLat = project.lat;
      let simLng = project.lng;

      if (type === 'onsite') {
        // Simulates being ~25 meters from registered coordinates
        simLat = project.lat + 0.00018;
        simLng = project.lng + 0.00012;
      } else {
        // Simulates being ~450 meters away (outside 100m geofence)
        simLat = project.lat + 0.0035;
        simLng = project.lng + 0.0028;
      }

      const res = verifyInspectionGps(
        id,
        {
          lat: simLat,
          lng: simLng,
          accuracy: type === 'onsite' ? 6 : 14,
        },
        100
      );

      setGpsResult(res);
      setIsVerifyingGps(false);
    }, 600);
  };

  // ── PHOTO STEP ────────────────────────────────────────────────────────────
  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is required to capture evidence.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const staff = parseInt(actualStaff, 10);
    const beneficiaries = parseInt(actualBeneficiaries, 10);

    if (isNaN(staff) || isNaN(beneficiaries)) {
      Alert.alert('Missing Data', 'Please enter valid attendance figures.');
      return;
    }

    if (!gpsResult?.verified && !inspection.gpsVerified) {
      Alert.alert('Security Block', 'Cannot submit: GPS location verification is required on site.');
      return;
    }

    Alert.alert(
      'Submit Inspection Report',
      'This action will finalize the report and update the project risk score. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report',
          onPress: () => {
            setSubmitting(true);
            setTimeout(() => {
              const res = submitInspectionReport(id, {
                actualStaff: staff,
                actualBeneficiaries: beneficiaries,
                remarks,
                photoUri: photoUri ?? undefined,
                gpsLat: gpsResult?.inspectorLat ?? inspection.gpsLat,
                gpsLng: gpsResult?.inspectorLng ?? inspection.gpsLng,
              });

              setSubmitting(false);

              if (res && !res.success) {
                Alert.alert('Submission Failed', res.error || 'Could not submit report.');
                return;
              }

              setSubmitted(true);
            }, 1200);
          },
        },
      ]
    );
  };

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isGpsVerified = Boolean(gpsResult?.verified || inspection?.gpsVerified);
  const canProceedFromAttendance = actualStaff.length > 0 && actualBeneficiaries.length > 0;

  const attendanceRatioStaff = actualStaff ? parseInt(actualStaff) / project.expectedStaff : 0;
  const isLowAttendance = actualStaff ? attendanceRatioStaff < 0.7 : false;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.typeBadge, inspection.type === 'SURPRISE' && styles.typeBadgeSurprise]}>
          <Text style={[styles.typeBadgeText, inspection.type === 'SURPRISE' && { color: '#000' }]}>
            {inspection.type === 'SURPRISE' ? '⚡ SURPRISE' : inspection.type}
          </Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEP_LABELS.map((label, i) => (
          <View key={i} style={styles.stepperItem}>
            <View style={[
              styles.stepDot,
              i < currentStepIndex && styles.stepDotDone,
              i === currentStepIndex && styles.stepDotActive,
            ]}>
              <Text style={[styles.stepDotText, (i <= currentStepIndex) && styles.stepDotTextActive]}>
                {i < currentStepIndex ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === currentStepIndex && styles.stepLabelActive]}>{label}</Text>
            {i < STEP_LABELS.length - 1 && (
              <View style={[styles.stepConnector, i < currentStepIndex && styles.stepConnectorDone]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project info */}
        <View style={styles.projectBanner}>
          <Text style={styles.projectBannerName} numberOfLines={1}>{project.name}</Text>
          <Text style={styles.projectBannerLoc}>📍 {project.location}</Text>
        </View>

        {/* ── STEP: GPS VERIFICATION ── */}
        {currentStep === 'gps' && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>📡 GPS Verification</Text>
                <Text style={styles.stepDesc}>
                  Confirm physical presence at the registered project reference location before beginning the inspection.
                </Text>
              </View>
            </View>

            {/* GPS Telemetry & Comparison Card */}
            <View style={[styles.gpsCard, SHADOW.card, isGpsVerified && styles.gpsCardVerified]}>
              <View style={styles.gpsCardHeader}>
                <Text style={styles.gpsCardHeaderTitle}>GEOFENCE & LOCATION TELEMETRY</Text>
                <View style={[
                  styles.gpsStatusBadge,
                  isGpsVerified ? styles.gpsStatusBadgeSuccess :
                  gpsResult && !gpsResult.verified ? styles.gpsStatusBadgeDanger : styles.gpsStatusBadgePending
                ]}>
                  <Text style={[
                    styles.gpsStatusBadgeText,
                    isGpsVerified ? { color: COLORS.success } :
                    gpsResult && !gpsResult.verified ? { color: COLORS.danger } : { color: COLORS.warning }
                  ]}>
                    {isGpsVerified ? '🟢 VERIFIED' : gpsResult && !gpsResult.verified ? '🔴 OUTSIDE GEOFENCE' : '🟠 AWAITING GPS'}
                  </Text>
                </View>
              </View>

              {/* Data comparison grid */}
              <View style={styles.telemetryGrid}>
                <View style={styles.telemetryItem}>
                  <Text style={styles.telemetryLabel}>🏛️ Registered Project Lat/Lng</Text>
                  <Text style={styles.telemetryValueMonospace}>
                    {project.lat.toFixed(6)}, {project.lng.toFixed(6)}
                  </Text>
                </View>

                <View style={styles.telemetryItem}>
                  <Text style={styles.telemetryLabel}>📱 Inspector Current Coordinates</Text>
                  <Text style={[
                    styles.telemetryValueMonospace,
                    gpsResult ? { color: isGpsVerified ? COLORS.success : COLORS.danger } : { color: COLORS.textMuted }
                  ]}>
                    {gpsResult ? `${gpsResult.inspectorLat.toFixed(6)}, ${gpsResult.inspectorLng.toFixed(6)}` : 'Not acquired yet'}
                  </Text>
                </View>

                <View style={styles.telemetrySplitRow}>
                  <View style={[styles.telemetryItem, { flex: 1 }]}>
                    <Text style={styles.telemetryLabel}>🎯 Allowed Radius</Text>
                    <Text style={styles.telemetryValue}>100 m</Text>
                  </View>

                  <View style={[styles.telemetryItem, { flex: 1 }]}>
                    <Text style={styles.telemetryLabel}>📏 Calculated Distance</Text>
                    <Text style={[
                      styles.telemetryValue,
                      gpsResult ? (isGpsVerified ? { color: COLORS.success } : { color: COLORS.danger }) : {}
                    ]}>
                      {gpsResult ? formatGpsDistance(gpsResult.distance) : '—'}
                    </Text>
                  </View>

                  <View style={[styles.telemetryItem, { flex: 1 }]}>
                    <Text style={styles.telemetryLabel}>🛰️ GPS Accuracy</Text>
                    <Text style={styles.telemetryValue}>
                      {gpsResult?.accuracy ? `±${gpsResult.accuracy}m` : '—'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Banner / Feedback */}
              {isVerifyingGps ? (
                <View style={styles.gpsStatusBannerLoading}>
                  <ActivityIndicator size="small" color={COLORS.inspectorBlue} />
                  <Text style={styles.gpsStatusBannerLoadingText}>
                    Acquiring real-device GPS satellites & calculating Haversine distance...
                  </Text>
                </View>
              ) : isGpsVerified ? (
                <View style={styles.gpsStatusBannerSuccess}>
                  <Text style={styles.gpsBannerIcon}>✓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gpsStatusBannerSuccessTitle}>LOCATION VERIFIED</Text>
                    <Text style={styles.gpsStatusBannerSuccessSub}>
                      Inspector is within {gpsResult?.distance ?? inspection.gpsDistance ?? 0}m of the project reference location.
                    </Text>
                  </View>
                </View>
              ) : gpsResult && !gpsResult.verified ? (
                <View style={styles.gpsStatusBannerFailure}>
                  <Text style={styles.gpsBannerIcon}>✕</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gpsStatusBannerFailureTitle}>GPS VERIFICATION FAILED</Text>
                    <Text style={styles.gpsStatusBannerFailureSub}>
                      You are {formatGpsDistance(gpsResult.distance)} away from the registered site.
                      Allowed geofence radius is 100 m.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.gpsStatusBannerIdle}>
                  <Text style={styles.gpsBannerIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gpsStatusBannerIdleTitle}>Awaiting GPS Verification</Text>
                    <Text style={styles.gpsStatusBannerIdleSub}>
                      Tap below to acquire your phone's real GPS position.
                    </Text>
                  </View>
                </View>
              )}

              {gpsError && (
                <View style={styles.gpsErrorBox}>
                  <Text style={styles.gpsErrorText}>⚠️ {gpsError}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.gpsActionSection}>
              {!isGpsVerified ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, isVerifyingGps && styles.primaryBtnDisabled]}
                  onPress={handleRealGpsVerify}
                  disabled={isVerifyingGps}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {isVerifyingGps ? 'Acquiring GPS...' : '📍 Acquire Real Device GPS'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: COLORS.success }]}
                  onPress={() => setCurrentStep('attendance')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Continue to Checklist →</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Hackathon Judge / Demo Simulation Presets */}
            <View style={styles.demoSimCard}>
              <View style={styles.demoSimHeader}>
                <Text style={styles.demoSimTag}>⚡ HACKATHON DEMO CONTROLS</Text>
                <Text style={styles.demoSimSub}>
                  Test both positive and negative Geofence validation cases:
                </Text>
              </View>
              <View style={styles.demoSimBtnRow}>
                <TouchableOpacity
                  style={[styles.simBtn, styles.simBtnSuccess]}
                  onPress={() => handleSimulateGps('onsite')}
                  disabled={isVerifyingGps}
                >
                  <Text style={styles.simBtnSuccessText}>🎯 Simulate On-Site (~25m)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.simBtn, styles.simBtnDanger]}
                  onPress={() => handleSimulateGps('offsite')}
                  disabled={isVerifyingGps}
                >
                  <Text style={styles.simBtnDangerText}>🏃 Simulate Off-Site (~450m)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── STEP: ATTENDANCE ── */}
        {currentStep === 'attendance' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>👥 Attendance Recording</Text>
            <Text style={styles.stepDesc}>
              Record the actual staff and beneficiary count. Discrepancies will automatically flag a risk anomaly.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expected Staff</Text>
              <View style={styles.inputReadonly}>
                <Text style={styles.inputReadonlyText}>{project.expectedStaff} personnel</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Actual Staff Present *</Text>
              <TextInput
                style={[styles.textInput, isLowAttendance && styles.textInputDanger]}
                value={actualStaff}
                onChangeText={setActualStaff}
                keyboardType="number-pad"
                placeholder={`Enter count (expected: ${project.expectedStaff})`}
                placeholderTextColor={COLORS.textMuted}
              />
              {isLowAttendance && actualStaff.length > 0 && (
                <Text style={styles.warningText}>⚠️ Low attendance detected — below 70% threshold</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expected Beneficiaries</Text>
              <View style={styles.inputReadonly}>
                <Text style={styles.inputReadonlyText}>{project.expectedBeneficiaries} people</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Actual Beneficiaries Present *</Text>
              <TextInput
                style={styles.textInput}
                value={actualBeneficiaries}
                onChangeText={setActualBeneficiaries}
                keyboardType="number-pad"
                placeholder={`Enter count (expected: ${project.expectedBeneficiaries})`}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentStep('gps')}>
                <Text style={styles.secondaryBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }, !canProceedFromAttendance && styles.primaryBtnDisabled]}
                onPress={() => canProceedFromAttendance && setCurrentStep('evidence')}
              >
                <Text style={styles.primaryBtnText}>Next: Evidence →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP: EVIDENCE ── */}
        {currentStep === 'evidence' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>📸 Evidence Capture</Text>
            <Text style={styles.stepDesc}>
              Capture at least one photo as evidence. You can also add written remarks about site conditions.
            </Text>

            {photoUri ? (
              <View style={styles.photoPreview}>
                <Text style={styles.photoPreviewIcon}>🖼️</Text>
                <View style={styles.photoPreviewInfo}>
                  <Text style={styles.photoPreviewText}>Photo captured</Text>
                  <Text style={styles.photoPreviewSub}>Tap to replace</Text>
                </View>
                <TouchableOpacity style={styles.replaceBtn} onPress={handlePickPhoto}>
                  <Text style={styles.replaceText}>Replace</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoOptions}>
                <TouchableOpacity style={styles.photoOptionBtn} onPress={handlePickPhoto}>
                  <Text style={styles.photoOptionIcon}>📷</Text>
                  <Text style={styles.photoOptionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoOptionBtn} onPress={handlePickGallery}>
                  <Text style={styles.photoOptionIcon}>🖼️</Text>
                  <Text style={styles.photoOptionText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field Remarks (observations, issues found)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={5}
                placeholder="Describe site conditions, anomalies, infrastructure status..."
                placeholderTextColor={COLORS.textMuted}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentStep('attendance')}>
                <Text style={styles.secondaryBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setCurrentStep('review')}>
                <Text style={styles.primaryBtnText}>Review & Submit →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP: REVIEW ── */}
        {currentStep === 'review' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>📋 Review & Submit</Text>
            <Text style={styles.stepDesc}>Verify all data before final submission. This report is permanent.</Text>

            <View style={[styles.reviewCard, SHADOW.card]}>
              <ReviewRow
                icon="📍"
                label="GPS Verification"
                value={isGpsVerified ? `✅ Verified (${gpsResult?.distance ?? inspection.gpsDistance ?? 0}m)` : '❌ Not Verified'}
                valueColor={isGpsVerified ? COLORS.success : COLORS.danger}
              />
              <ReviewRow
                icon="📱"
                label="Inspector GPS"
                value={gpsResult ? `${gpsResult.inspectorLat.toFixed(4)}, ${gpsResult.inspectorLng.toFixed(4)}` : `${inspection.gpsLat?.toFixed(4)}, ${inspection.gpsLng?.toFixed(4)}`}
              />
              <ReviewRow icon="👤" label="Actual Staff" value={actualStaff} valueColor={isLowAttendance ? COLORS.danger : COLORS.textPrimary} />
              <ReviewRow icon="👥" label="Actual Beneficiaries" value={actualBeneficiaries} />
              <ReviewRow icon="📸" label="Photo Evidence" value={photoUri ? '1 photo attached' : 'No photo'} valueColor={photoUri ? COLORS.success : COLORS.warning} />
              <ReviewRow icon="📝" label="Remarks" value={remarks || 'None'} />
            </View>

            {isLowAttendance && (
              <View style={styles.riskAlert}>
                <Text style={styles.riskAlertIcon}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.riskAlertTitle}>Anomaly Will Be Flagged</Text>
                  <Text style={styles.riskAlertSub}>
                    Staff attendance ({actualStaff}/{project.expectedStaff}) is below the 70% threshold.
                    This will increase the project risk score and alert the Official.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentStep('evidence')}>
                <Text style={styles.secondaryBtnText}>← Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (submitting || !isGpsVerified) && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting || !isGpsVerified}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>🚀 Submit Report</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewIcon}>{icon}</Text>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={[styles.reviewValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 30 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { fontSize: FONT.md, color: COLORS.accent, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.accent + '20' },
  typeBadgeSurprise: { backgroundColor: COLORS.officialGold },
  typeBadgeText: { fontSize: FONT.xs, fontWeight: '800', color: COLORS.accent, letterSpacing: 0.5 },

  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, position: 'relative' },
  stepperItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surfaceElevated, borderWidth: 2, borderColor: COLORS.textMuted, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepDotActive: { borderColor: COLORS.inspectorBlue, backgroundColor: COLORS.inspectorBlue + '20' },
  stepDotDone: { borderColor: COLORS.success, backgroundColor: COLORS.success },
  stepDotText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
  stepDotTextActive: { color: COLORS.inspectorBlue },
  stepLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
  stepLabelActive: { color: COLORS.inspectorBlue },
  stepConnector: { position: 'absolute', top: 14, left: '50%', right: '-50%', height: 2, backgroundColor: COLORS.textMuted + '50', zIndex: 0 },
  stepConnectorDone: { backgroundColor: COLORS.success },

  projectBanner: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: 14, marginVertical: 14, borderWidth: 1, borderColor: COLORS.border },
  projectBannerName: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  projectBannerLoc: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },

  stepContent: { paddingTop: 4 },
  stepHeaderRow: { marginBottom: 12 },
  stepTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  stepDesc: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },

  // ── GPS Card & Telemetry ──
  gpsCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  gpsCardVerified: {
    borderColor: COLORS.success + '45',
    backgroundColor: 'rgba(48,209,88,0.03)',
  },
  gpsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  gpsCardHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  gpsStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  gpsStatusBadgeSuccess: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success + '40',
  },
  gpsStatusBadgeDanger: {
    backgroundColor: COLORS.danger + '15',
    borderColor: COLORS.danger + '40',
  },
  gpsStatusBadgePending: {
    backgroundColor: COLORS.warning + '15',
    borderColor: COLORS.warning + '40',
  },
  gpsStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  telemetryGrid: {
    gap: 10,
    marginBottom: 14,
  },
  telemetryItem: {
    backgroundColor: COLORS.surfaceSunken,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border + '60',
  },
  telemetrySplitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  telemetryValue: {
    fontSize: FONT.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  telemetryValueMonospace: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },

  gpsStatusBannerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.inspectorBlue + '15',
    borderColor: COLORS.inspectorBlue + '40',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  gpsStatusBannerLoadingText: {
    flex: 1,
    fontSize: FONT.xs,
    color: COLORS.inspectorBlue,
    fontWeight: '600',
    lineHeight: 16,
  },
  gpsStatusBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.success + '18',
    borderColor: COLORS.success + '45',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  gpsStatusBannerSuccessTitle: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  gpsStatusBannerSuccessSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  gpsStatusBannerFailure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.danger + '18',
    borderColor: COLORS.danger + '45',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  gpsStatusBannerFailureTitle: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },
  gpsStatusBannerFailureSub: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 2,
    lineHeight: 15,
  },
  gpsStatusBannerIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceSunken,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  gpsStatusBannerIdleTitle: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  gpsStatusBannerIdleSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gpsBannerIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  gpsErrorBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.danger + '15',
  },
  gpsErrorText: {
    fontSize: 11,
    color: COLORS.danger,
    lineHeight: 15,
  },

  gpsActionSection: {
    marginBottom: 16,
  },

  // ── Hackathon Demo Simulator Section ──
  demoSimCard: {
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBright + '40',
  },
  demoSimHeader: {
    marginBottom: 10,
  },
  demoSimTag: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.officialGold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  demoSimSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  demoSimBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  simBtnSuccess: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success + '50',
  },
  simBtnSuccessText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  simBtnDanger: {
    backgroundColor: COLORS.danger + '15',
    borderColor: COLORS.danger + '50',
  },
  simBtnDangerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
  },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  textInput: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, fontSize: FONT.md, paddingHorizontal: 14, paddingVertical: 12 },
  textInputDanger: { borderColor: COLORS.danger + '60' },
  textArea: { minHeight: 110, paddingTop: 12 },
  inputReadonly: { backgroundColor: COLORS.surfaceSunken, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12 },
  inputReadonlyText: { color: COLORS.textMuted, fontSize: FONT.md },
  warningText: { fontSize: FONT.xs, color: COLORS.warning, marginTop: 5, fontWeight: '600' },

  photoOptions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  photoOptionBtn: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, padding: 22, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border },
  photoOptionIcon: { fontSize: 32 },
  photoOptionText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '600' },

  photoPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '15', borderRadius: RADIUS.lg, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.success + '40', gap: 12 },
  photoPreviewIcon: { fontSize: 32 },
  photoPreviewInfo: { flex: 1 },
  photoPreviewText: { fontSize: FONT.md, fontWeight: '700', color: COLORS.success },
  photoPreviewSub: { fontSize: FONT.xs, color: COLORS.textSecondary },
  replaceBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.full },
  replaceText: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '600' },

  reviewCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 16 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  reviewIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  reviewLabel: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary },
  reviewValue: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.textPrimary, maxWidth: 160, textAlign: 'right' },

  riskAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(255,149,0,0.1)', borderRadius: RADIUS.lg, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)' },
  riskAlertIcon: { fontSize: 24 },
  riskAlertTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.warning, marginBottom: 4 },
  riskAlertSub: { fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 18 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: { flex: 1, backgroundColor: COLORS.inspectorBlue, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: FONT.md, fontWeight: '800', color: '#fff' },
  secondaryBtn: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  secondaryBtnText: { fontSize: FONT.md, fontWeight: '600', color: COLORS.textSecondary },
  submitBtn: { flex: 1, backgroundColor: COLORS.success, borderRadius: RADIUS.xl, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontSize: FONT.md, fontWeight: '800', color: '#fff' },

  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 20 },
  successTitle: { fontSize: FONT['3xl'], fontWeight: '900', color: COLORS.success, marginBottom: 12, letterSpacing: -0.5 },
  successSub: { fontSize: FONT.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  flaggedBanner: { backgroundColor: COLORS.warning + '15', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.warning + '40', marginBottom: 24 },
  flaggedText: { fontSize: FONT.sm, color: COLORS.warning, textAlign: 'center', lineHeight: 20 },
  backHomeBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.full },
  backHomeBtnText: { fontSize: FONT.md, fontWeight: '800', color: '#fff' },
});
