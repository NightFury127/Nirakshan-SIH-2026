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

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'XYZ Anganwadi Centre',
    location: 'Bhelupur Ward, Near Shiva Temple',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    type: 'Anganwadi Centre',
    budget: 48.5,
    contractor: 'M/s Sharma Constructions Pvt Ltd',
    startDate: '2024-01-15',
    expectedCompletion: '2024-08-31',
    managerName: 'Deepak Mishra',
    managerPhone: '+91-9123456789',
    expectedStaff: 12,
    expectedBeneficiaries: 85,
    riskScore: 87,
    riskLevel: 'CRITICAL',
    status: 'ACTIVE',
    lastInspectionDate: '2024-06-10',
    compliancePercent: 42,
    anomalies: {
      lowAttendanceCount: 4,
      overdueReports: 3,
      openComplaints: 5,
    },
    cctvEnabled: true,
    cctvStatus: 'OFFLINE',
    lat: 25.3176,
    lng: 82.9739,
  },
  {
    id: 'proj-2',
    name: 'Primary Health Centre — Sarnath',
    location: 'Sarnath Road, Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    type: 'Primary Health Centre',
    budget: 120.0,
    contractor: 'BuildRight Infrastructure Ltd',
    startDate: '2024-02-01',
    expectedCompletion: '2024-12-15',
    managerName: 'Dr. Anjali Singh',
    managerPhone: '+91-9234567890',
    expectedStaff: 25,
    expectedBeneficiaries: 350,
    riskScore: 52,
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    lastInspectionDate: '2024-07-20',
    compliancePercent: 68,
    anomalies: {
      lowAttendanceCount: 2,
      overdueReports: 1,
      openComplaints: 2,
    },
    cctvEnabled: true,
    cctvStatus: 'ONLINE',
    lat: 25.3782,
    lng: 83.0230,
  },
  {
    id: 'proj-3',
    name: 'Govt. Upper Primary School — Assi',
    location: 'Assi Ghat Area, Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    type: 'Government School',
    budget: 75.25,
    contractor: 'EduBuild Contractors',
    startDate: '2024-03-01',
    expectedCompletion: '2024-11-30',
    managerName: 'Ramesh Yadav',
    managerPhone: '+91-9345678901',
    expectedStaff: 18,
    expectedBeneficiaries: 210,
    riskScore: 28,
    riskLevel: 'LOW',
    status: 'ACTIVE',
    lastInspectionDate: '2024-07-25',
    compliancePercent: 88,
    anomalies: {
      lowAttendanceCount: 0,
      overdueReports: 0,
      openComplaints: 1,
    },
    cctvEnabled: false,
    cctvStatus: 'OFFLINE',
    lat: 25.2985,
    lng: 82.9842,
  },
  {
    id: 'proj-4',
    name: 'Community Nutrition Centre — Sigra',
    location: 'Sigra Colony, Near Market',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    type: 'Nutrition Centre',
    budget: 35.0,
    contractor: 'Social Works Co.',
    startDate: '2024-04-10',
    expectedCompletion: '2024-10-31',
    managerName: 'Kavita Sharma',
    managerPhone: '+91-9456789012',
    expectedStaff: 8,
    expectedBeneficiaries: 120,
    riskScore: 65,
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    lastInspectionDate: '2024-06-28',
    compliancePercent: 55,
    anomalies: {
      lowAttendanceCount: 3,
      overdueReports: 2,
      openComplaints: 3,
    },
    cctvEnabled: true,
    cctvStatus: 'MAINTENANCE',
    lat: 25.3345,
    lng: 82.9614,
  },
  {
    id: 'proj-5',
    name: 'Rural Water Supply Scheme — Ramnagar',
    location: 'Ramnagar Block, Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    type: 'Infrastructure',
    budget: 220.0,
    contractor: 'AquaInfra Solutions',
    startDate: '2023-11-01',
    expectedCompletion: '2024-09-30',
    managerName: 'Suresh Pandey',
    managerPhone: '+91-9567890123',
    expectedStaff: 30,
    expectedBeneficiaries: 1500,
    riskScore: 15,
    riskLevel: 'LOW',
    status: 'ACTIVE',
    lastInspectionDate: '2024-07-30',
    compliancePercent: 92,
    anomalies: {
      lowAttendanceCount: 0,
      overdueReports: 0,
      openComplaints: 0,
    },
    cctvEnabled: false,
    cctvStatus: 'OFFLINE',
    lat: 25.2751,
    lng: 83.0455,
  },
];

// ─── MOCK INSPECTIONS ──────────────────────────────────────────────────────────

export const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: 'insp-1',
    projectId: 'proj-2',
    assignedInspectorId: 'user-inspector-2',
    scheduledDate: new Date().toISOString(),
    status: 'PENDING',
    type: 'ROUTINE',
    gpsVerified: false,
    riskFlagged: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'user-official-1',
  },
  {
    id: 'insp-2',
    projectId: 'proj-4',
    assignedInspectorId: 'user-inspector-1',
    scheduledDate: new Date().toISOString(),
    status: 'PENDING',
    type: 'FOLLOW_UP',
    gpsVerified: false,
    riskFlagged: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: 'user-official-1',
  },
  {
    id: 'insp-3',
    projectId: 'proj-1',
    assignedInspectorId: 'user-inspector-1',
    scheduledDate: new Date(Date.now() - 2592000000).toISOString(),
    status: 'COMPLETED',
    type: 'ROUTINE',
    gpsVerified: true,
    gpsLat: 25.3176,
    gpsLng: 82.9739,
    actualStaff: 5,
    actualBeneficiaries: 32,
    remarks: 'Severe understaffing. Attendance record discrepancies noted. CCTV non-functional.',
    riskFlagged: true,
    submittedAt: new Date(Date.now() - 2505600000).toISOString(),
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    createdBy: 'user-official-1',
  },
];

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
