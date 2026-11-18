export type PriorityTier = 'STAT' | 'URGENT' | 'PRIORITY' | 'ROUTINE';

export type TriagePriority = 'Critical' | 'Urgent' | 'Routine';

export type UserRole = 'Radiologist' | 'Physician' | 'Admin';

export type ModalityShort = 'X-Ray' | 'CT' | 'MRI' | 'Retinal Scan' | 'Dermoscopy';

export type ImagingModality =
  | 'Thoracic Radiography (CXR)'
  | 'Neuro-MRI (Axial T2-FLAIR)'
  | 'Retinal Fundus Photography'
  | 'Polarized Dermoscopy'
  | 'Thoracic CT Angiography';

export type ReviewStatus = 'Pending Triage' | 'In Review' | 'Confirmed' | 'Overridden' | 'Escalated' | 'Second Opinion Requested' | 'Assessed';

export interface RegionOfInterest {
  id: string;
  label: string;
  /** Percentage from left (0-100) */
  x: number;
  /** Percentage from top (0-100) */
  y: number;
  /** Width percentage (0-100) */
  width: number;
  /** Height percentage (0-100) */
  height: number;
  /** Confidence 0-100 */
  confidence: number;
  finding: string;
  measurementMm?: string;
}

export interface ClinicalBiomarker {
  id: string;
  name: string;
  symbol: string;
  value: number;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  referenceRange: string;
  deltaPercent: number;
  status: 'Nominal' | 'Drifting' | 'Critical';
}

export interface RadarCalibrationAxis {
  axis: string;
  code: string;
  patientValue: number; // 0 to 100 normalized
  cohortBaseline: number; // 0 to 100 normalized
  unitLabel: string;
}

export interface DifferentialIndicator {
  condition: string;
  icd10: string;
  probability: number; // 0 to 100
  evidence: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  category: 'Imaging' | 'Laboratory' | 'Vitals' | 'Clinical Note';
  title: string;
  detail: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  caseId: string;
  patientId: string;
  actorName: string;
  actorRole: UserRole | 'TriageLens AI Engine';
  action: 'AI Flagged' | 'Confirmed Finding' | 'Overrode Priority' | 'Requested Second Opinion' | 'Escalated Case' | 'Updated Report Note' | 'Uploaded Dataset';
  rationale: string;
  previousPriority?: TriagePriority;
  newPriority?: TriagePriority;
}

export interface PhysicianAssessment {
  disposition: 'Escalate to STAT Consult' | 'Schedule Confirmatory Biopsy/CT' | 'Routine Follow-up';
  overridePriority?: PriorityTier;
  clinicianNotes: string;
  assessedBy: string;
  assessedAt: string;
  concordanceWithModel: 'Concordant' | 'Modified Priority' | 'Discordant';
}

export interface PriorComparisonData {
  priorDate: string;
  priorAccession: string;
  priorSummary: string;
  lesionSizePriorMm: string;
  lesionSizeCurrentMm: string;
  intervalChangeNote: string;
  priorFilterStyle?: string;
}

export interface ClinicalCase {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  sex: 'F' | 'M';
  accessionNumber: string;
  studyDate: string;
  arrivalTimestamp: string;
  waitMinutes: number;
  modality: ImagingModality;
  modalityShort: ModalityShort;
  anatomicalRegion: string;
  department: 'Emergency' | 'Neurology' | 'Pulmonology' | 'Ophthalmology' | 'Oncology';
  referringDepartment: string;
  chiefComplaint: string;
  clinicalHistory: string;
  imageUrl: string;
  /** AI Flagged headline finding */
  aiFlaggedFinding: string;
  /** AI confidence percentage 0-100 */
  aiConfidence: number;
  /** Plain language explanation of why the case was flagged */
  plainLanguageReasoning: string;
  /** TriageLens 3-tier priority (Critical, Urgent, Routine) */
  triagePriority: TriagePriority;
  /** 0-100 severity of visual imaging findings */
  imagingAbnormalityScore: number;
  /** 0-100 severity of laboratory biomarker deviation */
  biomarkerDeviationScore: number;
  /** 0-100 vital sign instability index */
  vitalInstabilityScore: number;
  /** 0-100 symptom progression velocity */
  progressionVelocityScore: number;
  /** Computed composite acuity score (0-100) */
  acuityScore: number;
  priorityTier: PriorityTier;
  targetTurnaroundMinutes: number;
  reviewStatus: ReviewStatus;
  primarySummary: string;
  regionsOfInterest: RegionOfInterest[];
  biomarkers: ClinicalBiomarker[];
  radarProfile: RadarCalibrationAxis[];
  differentialIndicators: DifferentialIndicator[];
  recommendedNextSteps: string[];
  timeline: TimelineEvent[];
  priorComparison: PriorComparisonData;
  reportClinicianNotes?: string;
  secondOpinionAssignee?: string;
  overrideReason?: string;
  physicianAssessment?: PhysicianAssessment;
}

export interface CaseIntakeInput {
  patientId: string;
  patientName: string;
  age: number;
  sex: 'F' | 'M';
  modality: ImagingModality;
  anatomicalRegion: string;
  referringDepartment: string;
  chiefComplaint: string;
  clinicalHistory: string;
  imagingAbnormalityScore: number;
  biomarkerDeviationScore: number;
  vitalInstabilityScore: number;
  progressionVelocityScore: number;
}
