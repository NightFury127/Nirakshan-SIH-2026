// ─── ZUSTAND GLOBAL STORE WITH ASYNCSTORAGE PERSISTENCE ──────────────────────
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MOCK_USERS,
  MOCK_COMPLAINTS,
  type Project,
  type User,
  type Inspection,
  type Complaint,
} from './mockData';
import { calculateRiskScore, type RiskLevel } from '../utils/riskEngine';
import { verifyInspectorLocation, type GpsVerificationResult } from '../utils/gpsVerification';

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
  addProject: (data: {
    name: string;
    location: string;
    district: string;
    state: string;
    type: string;
    budget: number;
    contractor: string;
    managerName: string;
    managerPhone: string;
    expectedStaff: number;
    expectedBeneficiaries: number;
    lat: number;
    lng: number;
  }) => Project;
  updateInspection: (
    inspectionId: string,
    data: Partial<Inspection>
  ) => void;
  verifyInspectionGps: (
    inspectionId: string,
    coords: { lat: number; lng: number; accuracy?: number },
    allowedRadius?: number
  ) => GpsVerificationResult;
  submitInspectionReport: (
    inspectionId: string,
    data: {
      actualStaff: number;
      actualBeneficiaries: number;
      remarks: string;
      photoUri?: string;
      gpsLat?: number;
      gpsLng?: number;
    }
  ) => { success: boolean; error?: string };

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      // Data starts empty — seeded with mock users/complaints but no projects
      projects:    [],
      inspections: [],
      complaints:  MOCK_COMPLAINTS.map(c => ({ ...c })),
      users:       MOCK_USERS.map(u => ({ ...u })),

      // ── AUTH ────────────────────────────────────────────────────────────────
      login: (role) => {
        const user = get().users.find(u => u.role === role) ?? null;
        set({ currentUser: user });
      },

      loginWithCredentials: (identifier, password, role) => {
        const { users } = get();
        const cleanId   = identifier.trim().toLowerCase();
        const cleanPass = password.trim();

        // 1. Universal Master Account check (mithun@gmail.com / 123456)
        if (cleanId === 'mithun@gmail.com' && cleanPass === '123456') {
          let matchedUser = users.find(u => u.email.toLowerCase() === cleanId && u.role === role);
          if (!matchedUser) {
            matchedUser = {
              id: `user-${role}-mithun`,
              name: 'Mithun',
              role,
              designation: role === 'official' ? 'District Administrative Officer' : role === 'inspector' ? 'Lead Field Inspector' : 'Resident',
              district: 'Varanasi',
              badgeNumber: role === 'inspector' ? 'INS-2026-0001' : undefined,
              phone: '9876500001',
              email: 'mithun@gmail.com',
              password: '123456',
              avatarInitials: 'M',
            };
            set({
              users: [matchedUser, ...users.filter(u => u.id !== matchedUser!.id)],
              currentUser: matchedUser,
            });
          } else {
            set({ currentUser: matchedUser });
          }
          return { success: true };
        }

        const matchedUser = users.find(u =>
          (u.email.toLowerCase() === cleanId ||
           u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')) &&
          u.role === role
        );

        if (!matchedUser) {
          const userAnyRole = users.find(u =>
            u.email.toLowerCase() === cleanId ||
            u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')
          );
          if (userAnyRole) {
            return {
              success: false,
              error: `This account is registered as "${userAnyRole.role.toUpperCase()}", not "${role.toUpperCase()}". Please switch the role tab.`,
            };
          }
          return {
            success: false,
            error: `No ${role.toUpperCase()} account found with "${identifier}". Please create an account first.`,
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

        // Block duplicates only within the SAME role
        const existingSameRole = users.find(u =>
          u.role === data.role &&
          (
            u.email.toLowerCase() === cleanEmail ||
            (cleanPhone && u.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, ''))
          )
        );

        if (existingSameRole) {
          return {
            success: false,
            error: `A ${data.role.toUpperCase()} account already exists with this email or phone (${existingSameRole.name}). Please Sign In instead.`,
          };
        }

        const parts    = data.name.trim().split(' ');
        const initials = parts.length > 1
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : data.name.substring(0, 2).toUpperCase();

        const newUser: User = {
          id:             `user-${data.role}-${Date.now()}`,
          name:           data.name.trim(),
          role:           data.role,
          email:          cleanEmail,
          phone:          cleanPhone || '+91-XXXXXXXXXX',
          password:       data.password.trim(),
          designation:    data.designation || (data.role === 'official' ? 'Administrative Officer' : data.role === 'inspector' ? 'Field Inspector' : 'Resident'),
          district:       data.district || 'Varanasi',
          badgeNumber:    data.badgeNumber || (data.role === 'inspector' ? `INS-${Date.now().toString().slice(-4)}` : undefined),
          avatarInitials: initials,
        };

        set({
          users:       [newUser, ...users],
          currentUser: newUser,
        });

        return { success: true };
      },

      logout: () => set({ currentUser: null }),

      // ── OFFICIAL: Generate Surprise Inspection ──────────────────────────────
      generateSurpriseInspection: (projectId) => {
        const { users, inspections, currentUser } = get();
        const inspector = (currentUser?.role === 'inspector' ? currentUser : null)
          || users.find(u => u.role === 'inspector')
          || { id: 'user-inspector-1' };
        const newInspection: Inspection = {
          id:                  `insp-${Date.now()}`,
          projectId,
          assignedInspectorId: inspector.id,
          scheduledDate:       new Date().toISOString(),
          status:              'PENDING',
          type:                'SURPRISE',
          gpsVerified:         false,
          riskFlagged:         false,
          createdAt:           new Date().toISOString(),
          createdBy:           currentUser?.id || 'user-official-1',
        };
        set({ inspections: [newInspection, ...inspections] });
        return newInspection;
      },

      // ── INSPECTOR: Add a new project ─────────────────────────────────────────
      addProject: (data) => {
        const { projects } = get();
        const now = new Date().toISOString();
        const newProject: Project = {
          id:                   `proj-${Date.now()}`,
          name:                 data.name.trim(),
          location:             data.location.trim(),
          district:             data.district.trim(),
          state:                data.state.trim(),
          type:                 data.type.trim(),
          budget:               data.budget,
          contractor:           data.contractor.trim(),
          startDate:            now.split('T')[0],
          expectedCompletion:   '',
          managerName:          data.managerName.trim(),
          managerPhone:         data.managerPhone.trim(),
          expectedStaff:        data.expectedStaff,
          expectedBeneficiaries: data.expectedBeneficiaries,
          riskScore:            0,
          riskLevel:            'LOW',
          status:               'ACTIVE',
          lastInspectionDate:   null,
          compliancePercent:    100,
          anomalies:            { lowAttendanceCount: 0, overdueReports: 0, openComplaints: 0 },
          cctvEnabled:          false,
          cctvStatus:           'OFFLINE',
          lat:                  data.lat,
          lng:                  data.lng,
        };
        set({ projects: [newProject, ...projects] });
        return newProject;
      },

      // ── INSPECTOR: Update inspection fields ────────────────────────────────
      updateInspection: (inspectionId, data) => {
        set(state => ({
          inspections: state.inspections.map(i =>
            i.id === inspectionId ? { ...i, ...data } : i
          ),
        }));
      },

      // ── INSPECTOR: Real GPS Verification against Registered Project Reference ──
      verifyInspectionGps: (inspectionId, coords, allowedRadius = 100) => {
        const { inspections, projects } = get();
        const inspection = inspections.find(i => i.id === inspectionId);
        if (!inspection) {
          throw new Error('Inspection not found');
        }
        const project = projects.find(p => p.id === inspection.projectId);
        if (!project) {
          throw new Error('Project reference not found');
        }

        const result = verifyInspectorLocation({
          inspectorLat: coords.lat,
          inspectorLng: coords.lng,
          projectLat: project.lat,
          projectLng: project.lng,
          accuracy: coords.accuracy,
          allowedRadius,
        });

        // Save complete GPS audit trail into store
        set(state => ({
          inspections: state.inspections.map(i =>
            i.id === inspectionId
              ? {
                  ...i,
                  gpsVerified: result.verified,
                  gpsLat: result.inspectorLat,
                  gpsLng: result.inspectorLng,
                  gpsAccuracy: result.accuracy,
                  gpsDistance: result.distance,
                  gpsAllowedRadius: result.allowedRadius,
                  gpsVerifiedAt: result.timestamp,
                  gpsStatus: result.status,
                }
              : i
          ),
        }));

        return result;
      },

      // ── INSPECTOR: Submit final report ────────────────────────────────────
      submitInspectionReport: (inspectionId, data) => {
        const { inspections, projects, complaints } = get();
        const inspection = inspections.find(i => i.id === inspectionId);
        if (!inspection) {
          return { success: false, error: 'Inspection record not found.' };
        }

        // Security check: GPS verification MUST be completed on-site before finalizing
        if (!inspection.gpsVerified) {
          return {
            success: false,
            error: 'Security Error: GPS location verification is required before submitting inspection report.',
          };
        }

        const project = projects.find(p => p.id === inspection.projectId);
        if (!project) {
          return { success: false, error: 'Project record not found.' };
        }

        const attendanceRatio  = data.actualStaff / project.expectedStaff;
        const beneficiaryRatio = data.actualBeneficiaries / project.expectedBeneficiaries;
        const isLowAttendance  = attendanceRatio < 0.7 || beneficiaryRatio < 0.6;
        const riskFlagged      = isLowAttendance;

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

        const { riskScore, riskLevel } = recomputeRisk(updatedProject, complaints);
        updatedProject.riskScore = riskScore;
        updatedProject.riskLevel = riskLevel;

        const updatedInspection: Inspection = {
          ...inspection,
          status:               'COMPLETED',
          gpsVerified:          true,
          gpsLat:               data.gpsLat ?? inspection.gpsLat,
          gpsLng:               data.gpsLng ?? inspection.gpsLng,
          actualStaff:          data.actualStaff,
          actualBeneficiaries:  data.actualBeneficiaries,
          remarks:              data.remarks,
          photoUri:             data.photoUri,
          riskFlagged,
          submittedAt:          new Date().toISOString(),
        };

        set(state => ({
          inspections: state.inspections.map(i =>
            i.id === inspectionId ? updatedInspection : i
          ),
          projects: state.projects.map(p =>
            p.id === inspection.projectId ? updatedProject : p
          ),
        }));

        return { success: true };
      },

      // ── CITIZEN: Submit complaint ──────────────────────────────────────────
      submitComplaint: (projectId, issueType, description) => {
        const { complaints, projects, currentUser } = get();
        const newComplaint: Complaint = {
          id:          `comp-${Date.now()}`,
          projectId,
          citizenId:   currentUser?.id || 'user-citizen-1',
          issueType,
          description,
          status:      'OPEN',
          createdAt:   new Date().toISOString(),
          severity:    'MEDIUM',
        };

        const updatedComplaints = [newComplaint, ...complaints];
        const project           = projects.find(p => p.id === projectId);

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
    }),
    {
      name: 'nirikshan-store',   // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the data that should survive app restarts
      partialize: (state) => ({
        projects:    state.projects,
        inspections: state.inspections,
        complaints:  state.complaints,
        users:       state.users,
        // Do NOT persist currentUser — force login every session
      }),
    }
  )
);
