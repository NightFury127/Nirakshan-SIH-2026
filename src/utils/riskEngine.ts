// ─── NIRIKSHAN RISK ENGINE ────────────────────────────────────────────────────
// Rule-based risk scoring 0-100 based on anomaly signals

import type { Project, Complaint } from '../store/mockData';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskBreakdown {
  total: number;
  level: RiskLevel;
  components: {
    label: string;
    score: number;
    maxScore: number;
    icon: string;
    triggered: boolean;
  }[];
}

/**
 * Calculates a 0-100 risk score for a project based on anomaly signals.
 * Rules:
 *  - Low attendance incidents (+20 per repeated occurrence, max 40)
 *  - Overdue reports (+25, max 25)
 *  - Open complaints (+20, max 20)
 *  - CCTV offline (+10)
 *  - No inspection in > 30 days (+5)
 */
export function calculateRiskScore(
  project: Project,
  openComplaints: Complaint[]
): RiskBreakdown {
  const components: RiskBreakdown['components'] = [];
  let total = 0;

  // 1. Low Attendance (max 40)
  const attendanceScore = Math.min(project.anomalies.lowAttendanceCount * 10, 40);
  total += attendanceScore;
  components.push({
    label: 'Attendance Anomalies',
    score: attendanceScore,
    maxScore: 40,
    icon: '👥',
    triggered: attendanceScore > 0,
  });

  // 2. Overdue Reports (max 25)
  const overdueScore = Math.min(project.anomalies.overdueReports * 8, 25);
  total += overdueScore;
  components.push({
    label: 'Overdue Inspection Reports',
    score: overdueScore,
    maxScore: 25,
    icon: '📋',
    triggered: overdueScore > 0,
  });

  // 3. Open Complaints (max 20)
  const complaintCount = openComplaints.filter(c => c.projectId === project.id && c.status === 'OPEN').length;
  const complaintScore = Math.min(complaintCount * 5, 20);
  total += complaintScore;
  components.push({
    label: 'Open Citizen Complaints',
    score: complaintScore,
    maxScore: 20,
    icon: '📣',
    triggered: complaintScore > 0,
  });

  // 4. CCTV Offline (+10)
  const cctvScore = project.cctvEnabled && project.cctvStatus === 'OFFLINE' ? 10 : 0;
  total += cctvScore;
  components.push({
    label: 'CCTV System Offline',
    score: cctvScore,
    maxScore: 10,
    icon: '📹',
    triggered: cctvScore > 0,
  });

  // 5. Stale Inspection (+5)
  let staleScore = 0;
  if (project.lastInspectionDate) {
    const daysSince = Math.floor((Date.now() - new Date(project.lastInspectionDate).getTime()) / 86400000);
    if (daysSince > 30) staleScore = 5;
  } else {
    staleScore = 5;
  }
  total += staleScore;
  components.push({
    label: 'Inspection Overdue (>30d)',
    score: staleScore,
    maxScore: 5,
    icon: '⏰',
    triggered: staleScore > 0,
  });

  total = Math.min(total, 100);

  let level: RiskLevel;
  if (total >= 80) level = 'CRITICAL';
  else if (total >= 60) level = 'HIGH';
  else if (total >= 35) level = 'MEDIUM';
  else level = 'LOW';

  return { total, level, components };
}

export function getRiskColor(level: RiskLevel | string): string {
  switch (level) {
    case 'CRITICAL': return '#FF2D55';
    case 'HIGH': return '#FF9500';
    case 'MEDIUM': return '#FFCC00';
    case 'LOW': return '#30D158';
    default: return '#8E8E93';
  }
}

export function getRiskBg(level: RiskLevel | string): string {
  switch (level) {
    case 'CRITICAL': return 'rgba(255,45,85,0.12)';
    case 'HIGH': return 'rgba(255,149,0,0.12)';
    case 'MEDIUM': return 'rgba(255,204,0,0.12)';
    case 'LOW': return 'rgba(48,209,88,0.12)';
    default: return 'rgba(142,142,147,0.12)';
  }
}
