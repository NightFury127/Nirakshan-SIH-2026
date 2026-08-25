import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { COLORS, FONT, RADIUS, SHADOW } from '../../src/theme';

const RANDOM_VC_NAMES = [
  'Block Development Officer, Mirzapur',
  'DDO — Allahabad Division',
  'State Project Director, Lucknow',
  'District Collector, Chandauli',
];

export default function MonitoringScreen() {
  const projects = useAppStore(s => s.projects);
  const onlineProjects = projects.filter(p => p.cctvStatus === 'ONLINE');
  const [vcName] = useState(RANDOM_VC_NAMES[Math.floor(Math.random() * RANDOM_VC_NAMES.length)]);
  const [vcConnected, setVcConnected] = useState(false);
  const [pulsing] = useState(new Animated.Value(1));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsing, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulsing, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Live Monitoring</Text>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Random VC Panel */}
        <Text style={styles.sectionLabel}>RANDOM VIDEO CONFERENCE</Text>
        <View style={[styles.vcCard, SHADOW.elevated]}>
          {vcConnected ? (
            <View style={styles.vcConnected}>
              <Animated.View style={[styles.vcAvatar, { transform: [{ scale: pulsing }] }]}>
                <Text style={styles.vcAvatarText}>👔</Text>
              </Animated.View>
              <View style={styles.vcInfo}>
                <Text style={styles.vcName}>{vcName}</Text>
                <Text style={styles.vcStatus}>🟢 Connected · Encrypted</Text>
                <Text style={styles.vcDuration}>00:03:42</Text>
              </View>
              <TouchableOpacity style={styles.vcEndBtn} onPress={() => setVcConnected(false)}>
                <Text style={styles.vcEndText}>End</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.vcDisconnected}>
              <View style={styles.vcDisconIcon}>
                <Text style={{ fontSize: 40 }}>📹</Text>
              </View>
              <Text style={styles.vcTitle}>Random Surprise VC</Text>
              <Text style={styles.vcSubtitle}>Connect to a random field officer without warning to verify attendance and conditions</Text>
              <TouchableOpacity style={styles.vcConnectBtn} onPress={() => setVcConnected(true)}>
                <Text style={styles.vcConnectText}>⚡ Connect Random Officer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* CCTV Feeds */}
        <Text style={styles.sectionLabel}>LIVE CCTV FEEDS</Text>
        {onlineProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>No live CCTV feeds available. All cameras offline or under maintenance.</Text>
          </View>
        ) : (
          onlineProjects.map(p => (
            <View key={p.id} style={[styles.feedCard, SHADOW.card]}>
              <View style={styles.feedHeader}>
                <View>
                  <Text style={styles.feedName}>{p.name}</Text>
                  <Text style={styles.feedLocation}>📍 {p.district}</Text>
                </View>
                <View style={styles.feedLive}>
                  <View style={styles.feedLiveDot} />
                  <Text style={styles.feedLiveText}>LIVE</Text>
                </View>
              </View>
              <View style={styles.feedGrid}>
                {[1, 2].map(n => (
                  <View key={n} style={styles.feedPreview}>
                    <Text style={styles.feedPreviewIcon}>🎥</Text>
                    <Text style={styles.feedPreviewLabel}>CAM {n.toString().padStart(2, '0')}</Text>
                    <View style={styles.feedPreviewBadge}>
                      <Text style={styles.feedPreviewBadgeText}>HD · 1080p</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Alert Log */}
        <Text style={styles.sectionLabel}>SYSTEM ALERTS</Text>
        <View style={[styles.alertLog, SHADOW.card]}>
          {[
            { time: '09:12', msg: 'XYZ Anganwadi Centre — CCTV went offline', type: 'danger' },
            { time: '08:45', msg: 'Community Nutrition Centre — CCTV under maintenance', type: 'warning' },
            { time: '08:30', msg: 'Surprise inspection dispatched to XYZ Anganwadi', type: 'info' },
            { time: '07:55', msg: 'PHC Sarnath — All systems normal', type: 'success' },
          ].map((alert, i) => (
            <View key={i} style={[styles.alertItem, i < 3 && styles.alertItemBorder]}>
              <View style={[styles.alertDot, {
                backgroundColor:
                  alert.type === 'danger' ? COLORS.danger :
                  alert.type === 'warning' ? COLORS.warning :
                  alert.type === 'info' ? COLORS.info : COLORS.success,
              }]} />
              <Text style={styles.alertTime}>{alert.time}</Text>
              <Text style={styles.alertMsg} numberOfLines={2}>{alert.msg}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginBottom: 20 },
  title: { fontSize: FONT['2xl'], fontWeight: '800', color: COLORS.textPrimary },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.success + '20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  liveText: { fontSize: FONT.xs, color: COLORS.success, fontWeight: '800', letterSpacing: 1 },

  sectionLabel: { fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },

  vcCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS['2xl'], borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 24 },
  vcConnected: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  vcAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.accent },
  vcAvatarText: { fontSize: 30 },
  vcInfo: { flex: 1 },
  vcName: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  vcStatus: { fontSize: FONT.sm, color: COLORS.success, marginTop: 2 },
  vcDuration: { fontSize: FONT.sm, color: COLORS.textMuted, marginTop: 2 },
  vcEndBtn: { backgroundColor: COLORS.danger, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full },
  vcEndText: { color: '#fff', fontSize: FONT.sm, fontWeight: '700' },
  vcDisconnected: { padding: 28, alignItems: 'center' },
  vcDisconIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  vcTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' },
  vcSubtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  vcConnectBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.full },
  vcConnectText: { color: '#fff', fontSize: FONT.md, fontWeight: '800' },

  feedCard: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  feedName: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  feedLocation: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },
  feedLive: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  feedLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  feedLiveText: { fontSize: FONT.xs, color: COLORS.success, fontWeight: '800' },
  feedGrid: { flexDirection: 'row', gap: 10 },
  feedPreview: { flex: 1, backgroundColor: COLORS.surfaceSunken, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', gap: 4 },
  feedPreviewIcon: { fontSize: 28 },
  feedPreviewLabel: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '600' },
  feedPreviewBadge: { backgroundColor: COLORS.tealLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  feedPreviewBadgeText: { fontSize: FONT.xs - 1, color: COLORS.teal, fontWeight: '700' },

  emptyState: { alignItems: 'center', padding: 30, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  alertLog: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  alertItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  alertItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertTime: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', width: 38 },
  alertMsg: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary },
});
