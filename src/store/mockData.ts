// ─── NIRIKSHAN MOCK DATA ───────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  type: string; // e.g. "Anganwadi Centre", "PHC", "School"
  budget: number; // in lakhs
  contractor: string;
  startDate: string;
  expectedCompletion: string;
  managerName: string;
  managerPhone: string;
  expectedStaff: number;
  expectedBeneficiaries: number;
  riskScore: number; // 0-100, computed by riskEngine
  riskLevel: RiskLevel;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
  lastInspectionDate: string | null;
  compliancePercent: number;
  anomalies: {
    lowAttendanceCount: number;
    overdueReports: number;
    openComplaints: number;
  };
  cctvEnabled: boolean;
  cctvStatus: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  role: 'official' | 'inspector' | 'citizen';
  designation?: string;
  district?: string;
  badgeNumber?: string;
  phone: string;
  email: string;
  password?: string;
  avatarInitials: string;
}

export interface Inspection {
  id: string;
  projectId: string;
  assignedInspectorId: string;
  scheduledDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  type: 'ROUTINE' | 'SURPRISE' | 'FOLLOW_UP';
  gpsVerified: boolean;
  gpsLat?: number;
  gpsLng?: number;
  actualStaff?: number;
  actualBeneficiaries?: number;
  photoUri?: string;
  remarks?: string;
  riskFlagged: boolean;
  submittedAt?: string;
  createdAt: string;
  createdBy: string; // official userId
}

export interface Complaint {
  id: string;
  projectId: string;
  citizenId: string;
  issueType: 'Poor Service' | 'Infrastructure' | 'Absenteeism' | 'Corruption' | 'Other';
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  createdAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ─── MOCK USERS ────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'user-official-1',
    name: 'Rajesh Kumar Sharma',
    role: 'official',
    designation: 'District Development Officer',
    district: 'Varanasi',
    phone: '9876543210',
    email: 'official@gov.in',
    password: 'password123',
    avatarInitials: 'RK',
  },
  {
    id: 'user-inspector-1',
    name: 'Priya Nair',
    role: 'inspector',
    designation: 'Field Inspector Grade II',
    district: 'Varanasi',
    badgeNumber: 'INS-2024-0042',
    phone: '9988776655',
    email: 'inspector@gov.in',
    password: 'password123',
    avatarInitials: 'PN',
  },
  {
    id: 'user-inspector-2',
    name: 'Amit Verma',
    role: 'inspector',
    designation: 'Senior Field Inspector',
    district: 'Varanasi',
    badgeNumber: 'INS-2024-0019',
    phone: '9900112233',
    email: 'amit@gov.in',
    password: 'password123',
    avatarInitials: 'AV',
  },
  {
    id: 'user-citizen-1',
    name: 'Sunita Devi',
    role: 'citizen',
    phone: '9012345678',
    email: 'citizen@gov.in',
    password: 'password123',
    avatarInitials: 'SD',
  },
];

// ─── MOCK PROJECTS ─────────────────────────────────────────────────────────────
// Projects start empty — inspectors add them via the Field App
export const MOCK_PROJECTS: Project[] = [];

// ─── MOCK INSPECTIONS ──────────────────────────────────────────────────────────
// Starts empty — inspections are created as projects are added
export const MOCK_INSPECTIONS: Inspection[] = [];


// ─── MOCK COMPLAINTS ───────────────────────────────────────────────────────────

export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 'comp-1',
    projectId: 'proj-1',
    citizenId: 'user-citizen-1',
    issueType: 'Absenteeism',
    description: 'Workers rarely show up. The centre was closed for 3 days last week without notice.',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    severity: 'HIGH',
  },
  {
    id: 'comp-2',
    projectId: 'proj-1',
    citizenId: 'user-citizen-1',
    issueType: 'Poor Service',
    description: 'Food quality is extremely poor. Children are falling sick.',
    status: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    severity: 'HIGH',
  },
  {
    id: 'comp-3',
    projectId: 'proj-4',
    citizenId: 'user-citizen-1',
    issueType: 'Infrastructure',
    description: 'Building has cracks in the wall. Roof leaks during rain.',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    severity: 'MEDIUM',
  },
];
