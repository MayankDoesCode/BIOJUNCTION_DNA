export type UserRole = 
  | 'ADMIN' 
  | 'FIELD_OFFICER' 
  | 'SUPERVISOR' 
  | 'LAB_USER' 
  | 'VIEWER';

export type Role = UserRole;

export type Permission =
  | 'CASE_CREATE'
  | 'CASE_VIEW'
  | 'CASE_EDIT'
  | 'CASE_ASSIGN'
  | 'CASE_DELETE'
  | 'FIELD_TEST_CREATE'
  | 'FIELD_TEST_EDIT'
  | 'SAMPLE_CREATE'
  | 'SAMPLE_VIEW'
  | 'EVIDENCE_ADD'
  | 'REPORT_VIEW'
  | 'REPORT_REVIEW'
  | 'AUDIT_VIEW'
  | 'SETTINGS_MANAGE';

export interface User {
  id: string;
  username: string;
  fullName: string;
  badgeNumber: string;
  agency: string;
  role: UserRole;
  email: string;
  active: boolean;
  createdAt: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  password?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  createdAt: string;
  expiresAt: string;
  rememberMe: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSession | null;
}

export interface LoginCredentials {
  identifier: string; // username or email
  password: string;
  rememberMe?: boolean;
}

export type CaseStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'SAMPLE_COLLECTED'
  | 'TEST_COMPLETED'
  | 'UNDER_REVIEW'
  | 'CLOSED'
  | 'CANCELLED';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CaseLocation {
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: CaseStatus;
  priority: CasePriority;
  location?: CaseLocation;
  createdBy: string;
  assignedOfficer?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  isArchived?: boolean;

  // Backward compatibility fields
  incidentDate?: string;
  leadOfficerId?: string;
  leadOfficerName?: string;
  agency?: string;
}

export interface CaseFilters {
  status?: CaseStatus | 'ALL';
  priority?: CasePriority | 'ALL';
  assignedOfficer?: string;
  searchQuery?: string;
  includeArchived?: boolean;
}

export type CaseSortField = 'caseNumber' | 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface CaseSortOption {
  field: CaseSortField;
  direction: SortDirection;
}

export type SamplePhysicalState = 
  | 'POWDER' 
  | 'CRYSTAL' 
  | 'LIQUID' 
  | 'PLANT_MATERIAL' 
  | 'PILL_TABLET' 
  | 'RESIDUE' 
  | 'OTHER';

export type CustodyStatus = 
  | 'FIELD_CUSTODY' 
  | 'TRANSIT_TO_LAB' 
  | 'SECURED_EVIDENCE_LOCKER' 
  | 'PROCESSED';

export interface Sample {
  id: string;
  sampleNumber: string;
  caseId: string;
  description: string;
  physicalState: SamplePhysicalState;
  estimatedQuantity: string;
  unit: string;
  packagingType: string;
  collectionLocation: string;
  collectedAt: string;
  collectedBy: string;
  custodyStatus: CustodyStatus;
  notes?: string;
}

export type TestResultOutcome = 
  | 'PRESUMPTIVE_POSITIVE' 
  | 'PRESUMPTIVE_NEGATIVE' 
  | 'INCONCLUSIVE' 
  | 'INVALID' 
  | 'PENDING';

export interface FieldTest {
  id: string;
  testNumber: string;
  caseId: string;
  sampleId: string;
  kitType: string;
  performedBy: string;
  timestamp: string;
  resultStatus: TestResultOutcome;
  presumptiveCategory?: string;
  confidenceRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  temperatureCelsius?: number;
  notes?: string;
  photoAttached?: boolean;
}

export interface CustodyEvent {
  action: string;
  performedBy: string;
  timestamp: string;
  destinationLocation?: string;
  notes?: string;
}

export interface Evidence {
  id: string;
  evidenceTag: string;
  caseId: string;
  sampleId: string;
  chainOfCustody: CustodyEvent[];
  barcode: string;
  sealed: boolean;
  sealNumber: string;
  storageLocation: string;
  createdAt: string;
}

export interface TestResult {
  id: string;
  fieldTestId: string;
  sampleId: string;
  analyteTarget: string;
  primaryReaction: string;
  secondaryReaction?: string;
  outcome: TestResultOutcome;
  verifiedBySupervisor: boolean;
  supervisorNotes?: string;
  recordedAt: string;
}

export type ReportType = 
  | 'FIELD_SUMMARY' 
  | 'CHAIN_OF_CUSTODY' 
  | 'PRESUMPTIVE_TEST_RECORD' 
  | 'CASE_AUDIT';

export type ReportStatus = 'DRAFT' | 'FINALIZED' | 'SUBMITTED';

export interface Report {
  id: string;
  reportNumber: string;
  caseId: string;
  title: string;
  type: ReportType;
  generatedBy: string;
  generatedAt: string;
  summary: string;
  status: ReportStatus;
  exportFormat: 'PDF' | 'JSON';
}

export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface SyncRecord {
  id: string;
  entityType: 'cases' | 'fieldTests' | 'samples' | 'evidence' | 'testResults' | 'reports' | 'auditLogs';
  entityId: string;
  action: SyncAction;
  payload: string;
  status: SyncStatus;
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  eventId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  userRole: UserRole;
  timestamp: string;
  details?: string;
  metadata?: Record<string, unknown> | string;
  ipAddress?: string;
  integrityHash?: string;
}

export type AuditEvent = AuditLog;

/**
 * =========================================================================
 * DRUG–PROTEIN MOLECULAR DOCKING PROTOTYPE TYPES
 * =========================================================================
 */

export interface Protein {
  id: string;
  name: string;
  structureId?: string; // e.g. "6LU7", "1HSG"
  description?: string;
  source: string; // e.g. "RCSB PDB Reference", "Manual Upload", "AlphaFold DB"
  fileName?: string;
  fileFormat?: 'PDB' | 'PDBQT' | 'CIF' | 'MOL2';
  fileSize?: number;
  fileData?: string; // Text content of PDB/PDBQT for offline storage/viewer
  uploadDate: string;
  status: 'READY' | 'PARSED' | 'PENDING' | 'ERROR';
  organism?: string;
  resolution?: string;
}

export interface Ligand {
  id: string;
  name: string;
  chemicalName?: string;
  formula?: string;
  smiles?: string;
  fileName?: string;
  fileFormat?: 'PDBQT' | 'SDF' | 'MOL2' | 'PDB';
  fileSize?: number;
  fileData?: string;
  isDemo: boolean;
  uploadDate: string;
  status: 'READY' | 'PENDING' | 'ERROR';
  description?: string;
  molecularWeight?: number;
}

export interface BindingSite {
  name: string;
  description?: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  spacing?: number; // Default 0.375 Å
}

export type DockingJobStatus = 'QUEUED' | 'PREPARING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface DockingConfiguration {
  engine: string;
  bindingSite: BindingSite;
  exhaustiveness: number;
  numModes: number;
  energyRange: number;
  cpu?: number;
  seed?: number;
}

export interface DockingPose {
  mode: number;
  affinity: number; // kcal/mol
  rmsdLowerBound: number;
  rmsdUpperBound: number;
  modelCoordinates?: string;
}

export interface PreparedInput {
  proteinId: string;
  proteinName: string;
  proteinFormat: string;
  proteinPdbqtContent?: string;
  ligandId: string;
  ligandName: string;
  ligandFormat: string;
  ligandPdbqtContent?: string;
  configuration: DockingConfiguration;
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];
}

export interface DockingJob {
  id: string;
  jobId: string;
  proteinId: string;
  proteinName: string;
  ligandId: string;
  ligandName: string;
  configuration: DockingConfiguration;
  bindingSite?: BindingSite; // Backwards-compatibility
  status: DockingJobStatus;
  progressPercent?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  isDemoMode: boolean;
  notes?: string;
  outputFiles?: Array<{ name: string; size?: number; content?: string }>;
}

export interface DockingResult {
  id: string;
  jobId: string;
  proteinId: string;
  ligandId: string;
  proteinName: string;
  ligandName: string;
  status: 'COMPLETED' | 'FAILED' | 'NO_RESULT' | 'PENDING';
  hasRealResult: boolean; // False when engine is unavailable or in mock mode
  dockingScore?: number; // Best kcal/mol from AutoDock Vina
  poses?: DockingPose[];
  outputPdbqt?: string;
  logOutput?: string;
  error?: string;
  dockingStatusNote: string;
  timestamp: string;
  configuration: DockingConfiguration;
  bindingSiteConfig?: BindingSite; // Backwards-compatibility
  engineUsed: string;
  outputFiles?: Array<{ name: string; size?: number; content?: string }>;
  interactionAnalysis?: InteractionAnalysisResult;
}

export type InteractionType =
  | 'HYDROGEN_BOND'
  | 'HYDROPHOBIC'
  | 'SALT_BRIDGE'
  | 'PI_STACKING'
  | 'OTHER';

export interface MolecularInteraction {
  id?: string;
  type: InteractionType;
  proteinResidue: string;
  residueNumber: number;
  chain?: string;
  ligandAtom?: string;
  distance?: number; // Distance in Angstroms (Å)
  confidence?: number;
  description?: string;
}

export interface InteractionAnalysisResult {
  hasAnalysis: boolean;
  interactions: MolecularInteraction[];
  hydrogenBondsCount: number;
  hydrophobicContactsCount: number;
  interactingResiduesCount: number;
  analyzedAt?: string;
  method?: string;
  statusNote?: string;
}

export interface DockingComparisonItem {
  candidateId: string;
  candidateName: string;
  isDemo: boolean;
  targetProtein: string;
  bindingSiteName: string;
  dockingScoreDisplay: string; // e.g. "Awaiting docking result"
  hydrogenBondsDisplay: string;
  interactingResiduesDisplay: string;
  status: 'AWAITING_RESULT' | 'COMPLETED' | 'DEMO_READY';
}

export interface DockingComparisonRow {
  candidateId: string;
  candidateName: string;
  chemicalName?: string;
  formula?: string;
  isDemo?: boolean;
  jobId?: string;
  dockingStatus: 'COMPLETED' | 'STANDBY' | 'PENDING' | 'QUEUED' | 'RUNNING' | 'FAILED' | 'AWAITING_DOCKING';
  dockingScore?: number;
  bestPose?: string;
  hydrogenBondsCount?: number;
  hydrophobicContactsCount?: number;
  interactingResiduesCount?: number;
  configuration?: DockingConfiguration;
  isCompatible: boolean;
  compatibilityNote?: string;
  hasResult: boolean;
}

export interface ComparisonSummary {
  targetProteinName: string;
  targetProteinId: string;
  totalCandidates: number;
  completedDockings: number;
  pendingDockings: number;
  failedDockings: number;
  hasConfigurationMismatch: boolean;
  configurationWarnings: string[];
}

export interface MolecularDockingReport {
  id: string;
  jobId: string;
  reportTitle: string; // "Molecular Docking Analysis Report"
  appName: string; // "Drug–Protein Molecular Docking Software"
  scientificLabel: string; // "Computational Docking & Binding Affinity Analysis"
  generatedAt: string;
  isComparisonReport?: boolean;

  // Target Protein (actual stored info)
  targetProtein: {
    id?: string;
    name: string;
    structureId?: string;
    filename?: string;
    format?: string;
    validationStatus?: string;
    organism?: string;
    resolution?: string;
    bindingSite: BindingSite;
  };

  // Candidate Ligand (actual stored info)
  candidateLigand: {
    id?: string;
    name: string;
    chemicalName?: string;
    formula?: string;
    molecularWeight?: number;
    filename?: string;
    format?: string;
    validationStatus?: string;
  };

  // Docking Configuration (actual parameters)
  dockingConfiguration: {
    engine: string;
    engineVersion?: string;
    exhaustiveness: number;
    numModes: number;
    energyRange: number;
    searchBoxCenter: { x: number; y: number; z: number };
    searchBoxSize: { x: number; y: number; z: number };
    spacing?: number;
  };

  // Docking Results (actual parsed output)
  dockingResults: {
    status: 'COMPLETED' | 'STANDBY' | 'FAILED' | 'PENDING' | 'NO_RESULT';
    hasCompletedResult: boolean;
    bestAffinity?: number;
    bestAffinityDisplay: string;
    poseNumber?: number;
    rmsdLowerBound?: number;
    rmsdUpperBound?: number;
    availablePoses: Array<{
      mode: number;
      affinity: number;
      rmsdLowerBound: number;
      rmsdUpperBound: number;
    }>;
    statusNote: string;
  };

  // Interaction Analysis (actual computed contacts)
  interactionAnalysis: {
    available: boolean;
    hydrogenBondsCount: number;
    hydrophobicContactsCount: number;
    interactingResiduesCount: number;
    statusNote: string;
    details?: Array<{
      type: string;
      residue: string;
      atom?: string;
      distance?: number;
      description?: string;
    }>;
  };

  // 3D Visualization Note
  visualizationNote: string;

  // Multiple-Candidate Comparison
  comparisonData?: {
    isComparisonReport: boolean;
    targetProteinName: string;
    rows: DockingComparisonRow[];
  };

  // Scientific Interpretation
  scientificInterpretation: string;

  // Scientific Disclaimer (exact required prompt text)
  scientificDisclaimer: string;
}

export interface ReportHistoryItem {
  id: string;
  jobId: string;
  targetProtein: string;
  candidateLigand: string;
  generatedAt: string;
  status: 'COMPLETED' | 'STANDBY' | 'FAILED' | 'COMPARISON';
  reportData: MolecularDockingReport;
}

export interface DockingReportPreview {
  projectTitle: string;
  targetProtein: string;
  candidateMolecule: string;
  bindingSite: BindingSite;
  dockingConfiguration: {
    engine: string;
    exhaustiveness?: number;
    numModes?: number;
    energyRange?: number;
  };
  dockingResultSummary: string;
  interactionInformation: string;
  comparisonSummary: string;
  timestamp: string;
  disclaimer: string;
}

