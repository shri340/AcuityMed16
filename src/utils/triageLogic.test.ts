import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateClinicalAcuity,
  computeCohortMetrics,
  evaluateBiomarkerStatus,
  filterAndSortCases,
  isLowConfidenceCase,
  maskPatientIdentifier,
  validateCaseIntake,
} from './triageLogic';
import { APPROVED_CLINICAL_CASES } from '../data/approvedCases';

test('calculateClinicalAcuity assigns Critical/STAT tier for high imaging and biomarker severity', () => {
  const result = calculateClinicalAcuity({
    imagingAbnormalityScore: 92,
    biomarkerDeviationScore: 86,
    vitalInstabilityScore: 78,
    progressionVelocityScore: 80,
  });

  assert.equal(result.priorityTier, 'STAT');
  assert.equal(result.triagePriority, 'Critical');
  assert.equal(result.targetTurnaroundMinutes, 15);
  assert.ok(result.acuityScore >= 85);
});

test('calculateClinicalAcuity assigns Urgent and Routine tiers accurately', () => {
  const urgent = calculateClinicalAcuity({
    imagingAbnormalityScore: 75,
    biomarkerDeviationScore: 68,
    vitalInstabilityScore: 60,
    progressionVelocityScore: 55,
  });
  assert.equal(urgent.priorityTier, 'URGENT');
  assert.equal(urgent.triagePriority, 'Urgent');

  const routine = calculateClinicalAcuity({
    imagingAbnormalityScore: 22,
    biomarkerDeviationScore: 18,
    vitalInstabilityScore: 15,
    progressionVelocityScore: 20,
  });
  assert.equal(routine.priorityTier, 'ROUTINE');
  assert.equal(routine.triagePriority, 'Routine');
});

test('maskPatientIdentifier masks MRNs and names when privacy mode is active', () => {
  assert.equal(maskPatientIdentifier('MRN-482910', true), 'MRN-•••910');
  assert.equal(maskPatientIdentifier('MRN-482910', false), 'MRN-482910');
  assert.equal(maskPatientIdentifier('M. Lindqvist', true), 'M. ••••t');
});

test('isLowConfidenceCase flags AI confidence below safety threshold', () => {
  assert.equal(isLowConfidenceCase(68, 75), true);
  assert.equal(isLowConfidenceCase(92, 75), false);
});

test('evaluateBiomarkerStatus classifies Nominal, Drifting, and Critical ranges', () => {
  const nominal = evaluateBiomarkerStatus(4.5, 3.5, 5.5);
  assert.equal(nominal.status, 'Nominal');

  const drifting = evaluateBiomarkerStatus(6.0, 3.5, 5.5);
  assert.equal(drifting.status, 'Drifting');

  const critical = evaluateBiomarkerStatus(8.2, 3.5, 5.5);
  assert.equal(critical.status, 'Critical');
});

test('validateCaseIntake rejects empty or invalid fields and accepts complete input', () => {
  const invalid = validateCaseIntake({
    patientId: 'A',
    patientName: '',
    age: -4,
    chiefComplaint: 'abc',
  });
  assert.equal(invalid.valid, false);

  const valid = validateCaseIntake({
    patientId: 'MRN-9042',
    patientName: 'E. Vance',
    age: 64,
    sex: 'F',
    modality: 'Thoracic Radiography (CXR)',
    chiefComplaint: 'Acute dyspnea, pleuritic chest pain, and productive cough',
  });
  assert.equal(valid.valid, true);
});

test('filterAndSortCases orders Critical cases first and computes cohort metrics on approved dataset', () => {
  const sorted = filterAndSortCases(APPROVED_CLINICAL_CASES, { triagePriorityFilter: 'ALL' });
  assert.equal(sorted[0].triagePriority, 'Critical');

  const metrics = computeCohortMetrics(APPROVED_CLINICAL_CASES);
  assert.ok(metrics.totalCases >= 4);
  assert.ok(metrics.criticalCount >= 2);
});
