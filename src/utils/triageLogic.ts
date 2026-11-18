import {
  CaseIntakeInput,
  ClinicalBiomarker,
  ClinicalCase,
  ImagingModality,
  ModalityShort,
  PriorityTier,
  TriagePriority,
} from '../types/clinical';

export interface AcuityCalculationInput {
  imagingAbnormalityScore: number;
  biomarkerDeviationScore: number;
  vitalInstabilityScore: number;
  progressionVelocityScore: number;
}

export interface AcuityResult {
  acuityScore: number;
  priorityTier: PriorityTier;
  triagePriority: TriagePriority;
  targetTurnaroundMinutes: number;
  concordanceIndex: number;
}

const PRIORITY_RANK: Record<PriorityTier, number> = {
  STAT: 4,
  URGENT: 3,
  PRIORITY: 2,
  ROUTINE: 1,
};

const TRIAGE_PRIORITY_RANK: Record<TriagePriority, number> = {
  Critical: 3,
  Urgent: 2,
  Routine: 1,
};

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapAcuityToTriagePriority(acuityScore: number): TriagePriority {
  if (acuityScore >= 80) return 'Critical';
  if (acuityScore >= 55) return 'Urgent';
  return 'Routine';
}

/**
 * Masks a patient identifier or name for privacy protection by default.
 * Example: "MRN-482910" -> "MRN-•••910", "M. Lindqvist" -> "M. L•••••••"
 */
export function maskPatientIdentifier(value: string, masked: boolean): string {
  if (!masked || !value) return value;
  const trimmed = value.trim();
  if (trimmed.startsWith('MRN-') && trimmed.length >= 8) {
    return `MRN-•••${trimmed.slice(-3)}`;
  }
  if (trimmed.length <= 3) return '•••';
  return `${trimmed.slice(0, 3)}••••${trimmed.slice(-1)}`;
}

/**
 * Determines whether a case's AI confidence score falls below the safety threshold
 * and requires an explicit "AI uncertain, review manually" clinician warning.
 */
export function isLowConfidenceCase(aiConfidence: number, threshold = 75): boolean {
  return aiConfidence < threshold;
}

/**
 * Computes weighted composite clinical acuity score (0-100) and maps to a triage tier.
 */
export function calculateClinicalAcuity(input: AcuityCalculationInput): AcuityResult {
  const img = clampScore(input.imagingAbnormalityScore);
  const bio = clampScore(input.biomarkerDeviationScore);
  const vit = clampScore(input.vitalInstabilityScore);
  const prog = clampScore(input.progressionVelocityScore);

  const weightedRaw = img * 0.45 + bio * 0.25 + vit * 0.2 + prog * 0.1;
  const synergyBonus = img >= 80 && bio >= 75 ? 4 : 0;
  const acuityScore = clampScore(weightedRaw + synergyBonus);

  let priorityTier: PriorityTier;
  let targetTurnaroundMinutes: number;

  if (acuityScore >= 82 || (img >= 88 && vit >= 70)) {
    priorityTier = 'STAT';
    targetTurnaroundMinutes = 15;
  } else if (acuityScore >= 65) {
    priorityTier = 'URGENT';
    targetTurnaroundMinutes = 45;
  } else if (acuityScore >= 42) {
    priorityTier = 'PRIORITY';
    targetTurnaroundMinutes = 120;
  } else {
    priorityTier = 'ROUTINE';
    targetTurnaroundMinutes = 360;
  }

  const triagePriority = mapAcuityToTriagePriority(acuityScore);
  const diff = Math.abs(img - bio);
  const concordanceIndex = clampScore(100 - diff * 0.75);

  return {
    acuityScore,
    priorityTier,
    triagePriority,
    targetTurnaroundMinutes,
    concordanceIndex,
  };
}

/**
 * Evaluates a single biomarker value against reference intervals.
 */
export function evaluateBiomarkerStatus(
  value: number,
  referenceMin: number,
  referenceMax: number
): { status: 'Nominal' | 'Drifting' | 'Critical'; deltaPercent: number } {
  const span = Math.max(0.0001, referenceMax - referenceMin);
  if (value >= referenceMin && value <= referenceMax) {
    const midpoint = (referenceMin + referenceMax) / 2;
    const deltaPercent = Number((((value - midpoint) / midpoint) * 100).toFixed(1));
    return { status: 'Nominal', deltaPercent };
  }

  const distance = value < referenceMin ? referenceMin - value : value - referenceMax;
  const bound = value < referenceMin ? referenceMin : referenceMax;
  const rawDelta = bound !== 0 ? ((value - bound) / bound) * 100 : distance * 100;
  const deltaPercent = Number(rawDelta.toFixed(1));

  if (distance / span > 0.45) {
    return { status: 'Critical', deltaPercent };
  }
  return { status: 'Drifting', deltaPercent };
}

/**
 * Filters and sorts clinical cases for TriageLens dashboard and queue.
 */
export function filterAndSortCases(
  cases: ClinicalCase[],
  options: {
    priorityFilter?: PriorityTier | 'ALL';
    triagePriorityFilter?: TriagePriority | 'ALL' | 'PENDING';
    modalityFilter?: ImagingModality | ModalityShort | 'ALL';
    departmentFilter?: string | 'ALL';
    dateFilter?: string | 'ALL';
    searchQuery?: string;
    sortBy?: 'priority' | 'confidence' | 'waitTime';
    hideAssessed?: boolean;
  }
): ClinicalCase[] {
  const {
    priorityFilter = 'ALL',
    triagePriorityFilter = 'ALL',
    modalityFilter = 'ALL',
    departmentFilter = 'ALL',
    dateFilter = 'ALL',
    searchQuery = '',
    sortBy = 'priority',
    hideAssessed = false,
  } = options;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return cases
    .filter((c) => {
      const isReviewed =
        c.reviewStatus === 'Confirmed' ||
        c.reviewStatus === 'Overridden' ||
        c.reviewStatus === 'Assessed';
      if (hideAssessed && isReviewed) return false;
      if (priorityFilter !== 'ALL' && c.priorityTier !== priorityFilter) return false;
      if (triagePriorityFilter === 'PENDING') {
        if (isReviewed) return false;
      } else if (triagePriorityFilter !== 'ALL' && c.triagePriority !== triagePriorityFilter) {
        return false;
      }
      if (
        modalityFilter !== 'ALL' &&
        c.modality !== modalityFilter &&
        c.modalityShort !== modalityFilter
      ) {
        return false;
      }
      if (departmentFilter !== 'ALL' && c.department !== departmentFilter) return false;
      if (dateFilter !== 'ALL' && c.studyDate !== dateFilter) return false;

      if (normalizedQuery) {
        const haystack = [
          c.id,
          c.patientId,
          c.patientName,
          c.accessionNumber,
          c.modality,
          c.modalityShort,
          c.department,
          c.aiFlaggedFinding,
          c.chiefComplaint,
          c.primarySummary,
          ...c.differentialIndicators.map((d) => `${d.condition} ${d.icd10}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.aiConfidence - a.aiConfidence;
      }
      if (sortBy === 'waitTime') {
        return b.waitMinutes - a.waitMinutes;
      }

      const aDone =
        a.reviewStatus === 'Confirmed' ||
        a.reviewStatus === 'Overridden' ||
        a.reviewStatus === 'Assessed'
          ? 1
          : 0;
      const bDone =
        b.reviewStatus === 'Confirmed' ||
        b.reviewStatus === 'Overridden' ||
        b.reviewStatus === 'Assessed'
          ? 1
          : 0;
      if (aDone !== bDone) return aDone - bDone;

      const triageDiff =
        TRIAGE_PRIORITY_RANK[b.triagePriority] - TRIAGE_PRIORITY_RANK[a.triagePriority];
      if (triageDiff !== 0) return triageDiff;

      const tierDiff = PRIORITY_RANK[b.priorityTier] - PRIORITY_RANK[a.priorityTier];
      if (tierDiff !== 0) return tierDiff;

      if (b.acuityScore !== a.acuityScore) return b.acuityScore - a.acuityScore;
      return b.waitMinutes - a.waitMinutes;
    });
}

/**
 * Validates new case intake form fields. Never silently substitutes fallback values.
 */
export function validateCaseIntake(input: Partial<CaseIntakeInput>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.patientId || input.patientId.trim().length < 3) {
    errors.patientId = 'Patient MRN / ID is required (minimum 3 characters).';
  }
  if (!input.patientName || input.patientName.trim().length < 2) {
    errors.patientName = 'Patient initials or identifier name is required.';
  }
  if (typeof input.age !== 'number' || Number.isNaN(input.age) || input.age < 1 || input.age > 120) {
    errors.age = 'Patient age must be between 1 and 120 years.';
  }
  if (!input.chiefComplaint || input.chiefComplaint.trim().length < 5) {
    errors.chiefComplaint = 'Chief complaint & presenting indication are required (min 5 chars).';
  }
  if (!input.modality) {
    errors.modality = 'Approved imaging modality is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface CohortMetrics {
  totalCases: number;
  criticalCount: number;
  urgentCount: number;
  routineCount: number;
  statCount: number;
  pendingCount: number;
  assessedCount: number;
  meanAcuity: number;
  slaBreachRiskCount: number;
  criticalBiomarkerCount: number;
}

export function computeCohortMetrics(cases: ClinicalCase[]): CohortMetrics {
  if (cases.length === 0) {
    return {
      totalCases: 0,
      criticalCount: 0,
      urgentCount: 0,
      routineCount: 0,
      statCount: 0,
      pendingCount: 0,
      assessedCount: 0,
      meanAcuity: 0,
      slaBreachRiskCount: 0,
      criticalBiomarkerCount: 0,
    };
  }

  let criticalCount = 0;
  let urgentCount = 0;
  let routineCount = 0;
  let statCount = 0;
  let pendingCount = 0;
  let assessedCount = 0;
  let totalAcuity = 0;
  let slaBreachRiskCount = 0;
  let criticalBiomarkerCount = 0;

  for (const c of cases) {
    if (c.triagePriority === 'Critical') criticalCount++;
    else if (c.triagePriority === 'Urgent') urgentCount++;
    else routineCount++;

    if (c.priorityTier === 'STAT') statCount++;

    const isDone =
      c.reviewStatus === 'Confirmed' ||
      c.reviewStatus === 'Overridden' ||
      c.reviewStatus === 'Assessed';

    if (isDone) {
      assessedCount++;
    } else {
      pendingCount++;
      if (c.waitMinutes >= c.targetTurnaroundMinutes * 0.75) {
        slaBreachRiskCount++;
      }
    }
    totalAcuity += c.acuityScore;
    criticalBiomarkerCount += c.biomarkers.filter((b: ClinicalBiomarker) => b.status === 'Critical').length;
  }

  return {
    totalCases: cases.length,
    criticalCount,
    urgentCount,
    routineCount,
    statCount,
    pendingCount,
    assessedCount,
    meanAcuity: Number((totalAcuity / cases.length).toFixed(1)),
    slaBreachRiskCount,
    criticalBiomarkerCount,
  };
}
