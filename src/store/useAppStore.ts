// ─── ZUSTAND GLOBAL STORE ─────────────────────────────────────────────────────
import { create } from 'zustand';
import {
  MOCK_PROJECTS,
  MOCK_USERS,
  MOCK_INSPECTIONS,
  MOCK_COMPLAINTS,
  type Project,
  type User,
  type Inspection,
  type Complaint,
} from './mockData';
import { calculateRiskScore, type RiskLevel } from '../utils/riskEngine';

interface AppState {
  // Auth
  currentUser: User | null;
  login: (role: 'official' | 'inspector' | 'citizen') => void;
  loginWithCredentials: (
    identifier: string,
    password: string,
    role: 'official' | 'inspector' | 'citizen'
  ) => { success: boolean; error?: string };
  registerUser: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'official' | 'inspector' | 'citizen';
    designation?: string;
    district?: string;
    badgeNumber?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;

  // Data
  projects: Project[];
  inspections: Inspection[];
  complaints: Complaint[];
  users: User[];

  // Actions — Official
  generateSurpriseInspection: (projectId: string) => Inspection;

  // Actions — Inspector
  updateInspection: (
    inspectionId: string,
    data: Partial<Inspection>
  ) => void;
  submitInspectionReport: (
    inspectionId: string,
    data: {
      actualStaff: number;
      actualBeneficiaries: number;
      remarks: string;
      photoUri?: string;
      gpsLat: number;
      gpsLng: number;
    }
  ) => void;

  // Actions — Citizen
  submitComplaint: (
    projectId: string,
    issueType: Complaint['issueType'],
    description: string
  ) => void;

  // Derived helpers
  getProjectById: (id: string) => Project | undefined;
  getInspectionsForInspector: (inspectorId: string) => Inspection[];
  getInspectionsForProject: (projectId: string) => Inspection[];
  getComplaintsForProject: (projectId: string) => Complaint[];
  recalculateRisk: (projectId: string) => void;
}

function recomputeRisk(project: Project, complaints: Complaint[]): { riskScore: number; riskLevel: RiskLevel } {
  const breakdown = calculateRiskScore(project, complaints);
  return { riskScore: breakdown.total, riskLevel: breakdown.level };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  projects: MOCK_PROJECTS.map(p => ({ ...p })),
  inspections: MOCK_INSPECTIONS.map(i => ({ ...i })),
  complaints: MOCK_COMPLAINTS.map(c => ({ ...c })),
  users: MOCK_USERS.map(u => ({ ...u })),

  // ── AUTH & DATABASE VALIDATION ──────────────────────────────────────────
  login: (role) => {
    const user = get().users.find(u => u.role === role) ?? null;
    set({ currentUser: user });
  },

  loginWithCredentials: (identifier, password, role) => {
    const { users } = get();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check against database users
    const matchedUser = users.find(u => 
      (u.email.toLowerCase() === cleanId || u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')) &&
      u.role === role
    );

    if (!matchedUser) {
      // Check if user exists under a different role
      const userAnyRole = users.find(u => 
        u.email.toLowerCase() === cleanId || u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')
      );
      if (userAnyRole) {
        return { 
          success: false, 
          error: `This account is registered as "${userAnyRole.role.toUpperCase()}", not "${role.toUpperCase()}". Please switch the role tab.` 
        };
      }
      return { 
        success: false, 
        error: `No ${role.toUpperCase()} account found with "${identifier}". Please create an account first.` 
      };
    }

    if (matchedUser.password && matchedUser.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    set({ currentUser: matchedUser });
    return { success: true };
  },

  registerUser: (data) => {
    const { users } = get();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    // Validate if already exists in database
    const existing = users.find(u => 
      u.email.toLowerCase() === cleanEmail || 
      (cleanPhone && u.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, ''))
    );

    if (existing) {
      return { 
        success: false, 
        error: `An account already exists with this email or phone (${existing.name} - ${existing.role.toUpperCase()}). Please Sign In.` 
      };
    }

    // Generate avatar initials
    const parts = data.name.trim().split(' ');
    const initials = parts.length > 1 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : data.name.substring(0, 2).toUpperCase();

    const newUser: User = {
      id: `user-${data.role}-${Date.now()}`,
      name: data.name.trim(),
      role: data.role,
      email: cleanEmail,
      phone: cleanPhone || '+91-XXXXXXXXXX',
      password: data.password.trim(),
      designation: data.designation || (data.role === 'official' ? 'Administrative Officer' : data.role === 'inspector' ? 'Field Inspector' : 'Resident'),
      district: data.district || 'Varanasi',
      badgeNumber: data.badgeNumber || (data.role === 'inspector' ? `INS-${Date.now().toString().slice(-4)}` : undefined),
      avatarInitials: initials,
    };

    set({ 
      users: [newUser, ...users],
      currentUser: newUser,
    });

    return { success: true };
  },

  logout: () => set({ currentUser: null }),

  // ── OFFICIAL: Generate Surprise Inspection ──────────────────────────────
  generateSurpriseInspection: (projectId) => {
    const { users, inspections } = get();
    // Assign to inspector-1 by default for demo
    const inspector = users.find(u => u.id === 'user-inspector-1')!;
    const newInspection: Inspection = {
      id: `insp-${Date.now()}`,
      projectId,
      assignedInspectorId: inspector.id,
      scheduledDate: new Date().toISOString(),
      status: 'PENDING',
      type: 'SURPRISE',
      gpsVerified: false,
      riskFlagged: false,
      createdAt: new Date().toISOString(),
      createdBy: 'user-official-1',
    };
    set({ inspections: [newInspection, ...inspections] });
    return newInspection;
  },

  // ── INSPECTOR: Update inspection fields ────────────────────────────────
  updateInspection: (inspectionId, data) => {
    set(state => ({
      inspections: state.inspections.map(i =>
        i.id === inspectionId ? { ...i, ...data } : i
      ),
    }));
  },

  // ── INSPECTOR: Submit final report ────────────────────────────────────
  submitInspectionReport: (inspectionId, data) => {
    const { inspections, projects, complaints } = get();
    const inspection = inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    const project = projects.find(p => p.id === inspection.projectId);
    if (!project) return;

    // Detect anomalies
    const attendanceRatio = data.actualStaff / project.expectedStaff;
    const beneficiaryRatio = data.actualBeneficiaries / project.expectedBeneficiaries;
    const isLowAttendance = attendanceRatio < 0.7 || beneficiaryRatio < 0.6;
    const riskFlagged = isLowAttendance;

    // Update anomaly counts on the project
    const updatedProject: Project = {
      ...project,
      lastInspectionDate: new Date().toISOString(),
      anomalies: {
        ...project.anomalies,
        lowAttendanceCount: isLowAttendance
          ? project.anomalies.lowAttendanceCount + 1
          : project.anomalies.lowAttendanceCount,
        overdueReports: Math.max(0, project.anomalies.overdueReports - 1),
      },
    };

    // Recalculate risk
    const { riskScore, riskLevel } = recomputeRisk(updatedProject, complaints);
    updatedProject.riskScore = riskScore;
    updatedProject.riskLevel = riskLevel;

    const updatedInspection: Inspection = {
      ...inspection,
      status: 'COMPLETED',
      gpsVerified: true,
      gpsLat: data.gpsLat,
      gpsLng: data.gpsLng,
      actualStaff: data.actualStaff,
      actualBeneficiaries: data.actualBeneficiaries,
      remarks: data.remarks,
      photoUri: data.photoUri,
      riskFlagged,
      submittedAt: new Date().toISOString(),
    };

    set(state => ({
      inspections: state.inspections.map(i =>
        i.id === inspectionId ? updatedInspection : i
      ),
      projects: state.projects.map(p =>
        p.id === inspection.projectId ? updatedProject : p
      ),
    }));
  },

  // ── CITIZEN: Submit complaint ──────────────────────────────────────────
  submitComplaint: (projectId, issueType, description) => {
    const { complaints, projects } = get();
    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      projectId,
      citizenId: 'user-citizen-1',
      issueType,
      description,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      severity: 'MEDIUM',
    };

    const updatedComplaints = [newComplaint, ...complaints];
    const project = projects.find(p => p.id === projectId);

    let updatedProjects = projects;
    if (project) {
      const updatedProject: Project = {
        ...project,
        anomalies: {
          ...project.anomalies,
          openComplaints: project.anomalies.openComplaints + 1,
        },
      };
      const { riskScore, riskLevel } = recomputeRisk(updatedProject, updatedComplaints);
      updatedProject.riskScore = riskScore;
      updatedProject.riskLevel = riskLevel;
      updatedProjects = projects.map(p => p.id === projectId ? updatedProject : p);
    }

    set({ complaints: updatedComplaints, projects: updatedProjects });
  },

  // ── HELPERS ───────────────────────────────────────────────────────────
  getProjectById: (id) => get().projects.find(p => p.id === id),

  getInspectionsForInspector: (inspectorId) =>
    get().inspections.filter(i => i.assignedInspectorId === inspectorId),

  getInspectionsForProject: (projectId) =>
    get().inspections.filter(i => i.projectId === projectId),

  getComplaintsForProject: (projectId) =>
    get().complaints.filter(c => c.projectId === projectId),

  recalculateRisk: (projectId) => {
    const { projects, complaints } = get();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const { riskScore, riskLevel } = recomputeRisk(project, complaints);
    set(state => ({
      projects: state.projects.map(p =>
        p.id === projectId ? { ...p, riskScore, riskLevel } : p
      ),
    }));
  },
}));
