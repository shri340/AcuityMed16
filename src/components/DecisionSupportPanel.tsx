import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  ArrowUpCircle,
  SlidersHorizontal,
  Clock,
  Info,
  X,
} from 'lucide-react';
import {
  ClinicalBiomarker,
  ClinicalCase,
  TriagePriority,
} from '../types/clinical';
import { isLowConfidenceCase } from '../utils/triageLogic';

interface DecisionSupportPanelProps {
  activeCase: ClinicalCase;
  confidenceThreshold?: number;
  onConfirmCase: (caseId: string, note: string) => void;
  onOverrideCase: (caseId: string, newPriority: TriagePriority, reason: string) => void;
  onRequestSecondOpinion: (caseId: string, specialist: string, note: string) => void;
  onEscalateCase: (caseId: string, reason: string) => void;
  onUpdateCaseFromAI: (
    caseId: string,
    aiPayload: {
      imagingAbnormalityScore: number;
      primarySummary: string;
      differentialIndicators: ClinicalCase['differentialIndicators'];
      recommendedNextSteps: string[];
      detectedRegions?: ClinicalCase['regionsOfInterest'];
    }
  ) => void;
}

export const DecisionSupportPanel: React.FC<DecisionSupportPanelProps> = ({
  activeCase,
  confidenceThreshold = 75,
  onConfirmCase,
  onOverrideCase,
  onRequestSecondOpinion,
  onEscalateCase,
  onUpdateCaseFromAI,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Modal states for Override and Second Opinion
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTargetPriority, setOverrideTargetPriority] = useState<TriagePriority>('Routine');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const [isSecondOpinionOpen, setIsSecondOpinionOpen] = useState(false);
  const [specialistTarget, setSpecialistTarget] = useState('Dr. K. Lindholm (Thoracic & Neuro Subspecialty)');
  const [secondOpinionNote, setSecondOpinionNote] = useState('');

  const lowConfidence = isLowConfidenceCase(activeCase.aiConfidence, confidenceThreshold);

  const handleRunGeminiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const response = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: activeCase.patientId,
          age: activeCase.age,
          sex: activeCase.sex,
          modality: activeCase.modality,
          anatomicalRegion: activeCase.anatomicalRegion,
          chiefComplaint: activeCase.chiefComplaint,
          clinicalHistory: activeCase.clinicalHistory,
          biomarkers: activeCase.biomarkers,
          imageUrl: activeCase.imageUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run Gemini multimodal analysis.');
      }

      onUpdateCaseFromAI(activeCase.id, {
        imagingAbnormalityScore: data.imagingAbnormalityScore,
        primarySummary: data.primarySummary,
        differentialIndicators: data.differentialIndicators,
        recommendedNextSteps: data.recommendedNextSteps,
        detectedRegions: data.detectedRegions,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini diagnostic service.';
      setAiError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason || overrideReason.trim().length < 5) {
      setOverrideError('Please document the clinical justification for overriding AI priority (min 5 chars).');
      return;
    }
    setOverrideError(null);
    onOverrideCase(activeCase.id, overrideTargetPriority, overrideReason.trim());
    setIsOverrideModalOpen(false);
    setOverrideReason('');
  };

  const handleSecondOpinionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestSecondOpinion(
      activeCase.id,
      specialistTarget,
      secondOpinionNote.trim() || 'Requested subspecialty correlation on imaging and biomarker profile.'
    );
    setIsSecondOpinionOpen(false);
    setSecondOpinionNote('');
  };

  const renderBiomarkerState = (status: ClinicalBiomarker['status']) => {
    if (status === 'Critical') {
      return <span className="font-mono text-xs font-bold text-rose-800">✖ Critical</span>;
    }
    if (status === 'Drifting') {
      return <span className="font-mono text-xs font-semibold text-amber-900">▲ Drifting</span>;
    }
    return <span className="font-mono text-xs text-emerald-900">● Nominal</span>;
  };

  return (
    <aside
      aria-label="Clinical Decision-Support Analysis and Actions"
      className="space-y-5"
    >
      {/* Main AI Findings, Explainability & Action Panel */}
      <div className="liquid-glass p-5 sm:p-6 space-y-5">
        {/* Persistent Human-in-the-Loop Label */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-200/70">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-teal-950 bg-[#5EC4B6]/25 px-3 py-1.5 rounded-xl">
            <Info className="w-4 h-4 text-teal-800 shrink-0" />
            <span>Decision support, not a diagnosis</span>
          </div>

          <button
            type="button"
            onClick={handleRunGeminiAnalysis}
            disabled={isAnalyzing}
            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold bg-[#1F2A44] text-white rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#5EC4B6]" />
            )}
            <span>{isAnalyzing ? 'Analyzing Scan...' : 'Re-Analyze with Gemini'}</span>
          </button>
        </div>

        {/* Low-Confidence Safety Warning Badge */}
        {lowConfidence && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-[#FFC470]/35 border border-[#FFC470] text-[#1F2A44] flex items-start gap-3"
          >
            <ShieldAlert className="w-5 h-5 text-amber-900 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-amber-950">
                AI uncertain, review manually ({activeCase.aiConfidence.toFixed(1)}% &lt; {confidenceThreshold}% threshold)
              </div>
              <p className="text-[#1F2A44]/85">
                Model certainty is borderline due to overlapping morphological features. Independent clinician verification is required before disposition.
              </p>
            </div>
          </div>
        )}

        {aiError && (
          <div
            role="alert"
            className="p-3 rounded-xl border border-[#FF8A80] bg-[#FF8A80]/20 text-xs text-rose-950 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Gemini Multimodal Analysis Alert</p>
              <p className="mt-0.5">{aiError}</p>
            </div>
          </div>
        )}

        {/* Headline Finding & Confidence Meter */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-[#1F2A44]">
              {activeCase.aiFlaggedFinding}
            </h2>
            <span className="text-xs font-mono font-semibold text-[#1F2A44]/70 shrink-0">
              Status: {activeCase.reviewStatus}
            </span>
          </div>

          <div className="liquid-glass-subtle p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#1F2A44]/75 font-semibold">MODEL CONFIDENCE METER</span>
              <span className="text-sm font-bold text-[#1F2A44] tabular-nums">
                {activeCase.aiConfidence.toFixed(1)}% · {activeCase.triagePriority} Priority
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(10, activeCase.aiConfidence))}%`,
                  backgroundColor: lowConfidence ? '#FFC470' : '#5EC4B6',
                }}
              />
            </div>
          </div>
        </div>

        {/* Plain-Language Explainability Section */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-semibold text-[#1F2A44]/70">
            WHY THIS CASE WAS FLAGGED (PLAIN-LANGUAGE EXPLANATION)
          </div>
          <p className="text-sm text-[#1F2A44] leading-relaxed bg-white/70 border border-white/90 rounded-2xl p-3.5">
            {activeCase.plainLanguageReasoning}
          </p>
        </div>

        {/* Differential Indicators with Confidence Bars */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200/70">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#1F2A44]/70">
            <span>AI DIFFERENTIAL INDICATORS</span>
            <span>PROBABILITY</span>
          </div>
          <div className="space-y-2.5">
            {activeCase.differentialIndicators.map((diff) => (
              <div key={diff.icd10 + diff.condition} className="liquid-glass-subtle p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xs font-bold text-[#1F2A44]">
                    {diff.condition}{' '}
                    <span className="font-mono font-normal text-[#1F2A44]/65">
                      · ICD-10 {diff.icd10}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold tabular-nums text-teal-900 shrink-0">
                    {diff.probability}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden my-1.5">
                  <div
                    className="bg-[#5EC4B6] h-full transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(6, diff.probability))}%` }}
                  />
                </div>
                <p className="text-xs text-[#1F2A44]/80">{diff.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Clinician 1-Click Action Bar (Minimum 44px Touch Targets) */}
        <div className="pt-3 border-t border-slate-200/70 space-y-2.5">
          <div className="text-xs font-mono font-semibold text-[#1F2A44]/70">
            CLINICIAN DECISION ACTIONS (LOGGED TO AUDIT TRAIL)
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() =>
                onConfirmCase(
                  activeCase.id,
                  `Clinician confirmed AI-flagged finding (${activeCase.aiFlaggedFinding}) and priority (${activeCase.triagePriority}).`
                )
              }
              className="min-h-[44px] px-3.5 py-2.5 text-xs font-bold text-[#1F2A44] bg-[#7FD8A8] hover:bg-[#6ec997] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Finding</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOverrideTargetPriority(
                  activeCase.triagePriority === 'Critical' ? 'Urgent' : 'Routine'
                );
                setIsOverrideModalOpen(true);
              }}
              className="min-h-[44px] px-3.5 py-2.5 text-xs font-bold text-[#1F2A44] bg-[#FFC470]/60 hover:bg-[#FFC470] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Override Priority</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSecondOpinionOpen(true)}
              className="min-h-[44px] px-3.5 py-2.5 text-xs font-bold text-[#1F2A44] bg-[#8FA8F8]/45 hover:bg-[#8FA8F8]/75 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Request Second Opinion</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onEscalateCase(
                  activeCase.id,
                  `Escalated to Critical STAT consult for immediate multidisciplinary assessment.`
                )
              }
              className="min-h-[44px] px-3.5 py-2.5 text-xs font-bold text-rose-950 bg-[#FF8A80]/65 hover:bg-[#FF8A80] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Escalate STAT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Lab Values vs. Reference Ranges Card */}
      <div className="liquid-glass p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
          <h3 className="text-sm font-bold text-[#1F2A44]">
            Key Lab Values vs. Reference Ranges
          </h3>
          <span className="text-xs font-mono text-[#1F2A44]/70">
            Deviation: {activeCase.biomarkerDeviationScore}/100
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 text-[11px] font-mono text-[#1F2A44]/65">
                <th className="py-2 pr-2 font-semibold">BIOMARKER</th>
                <th className="py-2 px-2 font-semibold text-right">VALUE</th>
                <th className="py-2 px-2 font-semibold text-right">REF RANGE</th>
                <th className="py-2 pl-2 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 text-xs">
              {activeCase.biomarkers.map((bio) => (
                <tr key={bio.id}>
                  <td className="py-2.5 pr-2 font-medium text-[#1F2A44]">
                    {bio.name}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                    {bio.value} <span className="font-normal text-[#1F2A44]/65">{bio.unit}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#1F2A44]/70 whitespace-nowrap">
                    {bio.referenceRange}
                  </td>
                  <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                    {renderBiomarkerState(bio.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Clinical Timeline Card */}
      <div className="liquid-glass p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
          <h3 className="text-sm font-bold text-[#1F2A44] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-700" />
            <span>Patient Longitudinal Timeline</span>
          </h3>
          <span className="text-xs font-mono text-[#1F2A44]/65">
            {activeCase.timeline.length} events
          </span>
        </div>

        <ol className="space-y-3">
          {activeCase.timeline.map((ev) => (
            <li key={ev.id} className="liquid-glass-subtle p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px] text-[#1F2A44]/70">
                <span className="font-semibold text-teal-900">{ev.category}</span>
                <span>
                  {ev.date} · {ev.time}
                </span>
              </div>
              <div className="font-bold text-[#1F2A44]">{ev.title}</div>
              <p className="text-[#1F2A44]/80 leading-relaxed">{ev.detail}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Confirmation Dialog Modal for Override Priority */}
      {isOverrideModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="override-dialog-title"
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="liquid-glass bg-white/95 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="override-dialog-title" className="text-base font-bold text-[#1F2A44]">
                Confirm Clinical Priority Override
              </h3>
              <button
                type="button"
                aria-label="Close override dialog"
                onClick={() => setIsOverrideModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOverrideSubmit} className="space-y-4">
              <p className="text-xs text-[#1F2A44]/80">
                You are overriding the AI-suggested priority (<strong>{activeCase.triagePriority}</strong>). This human-in-the-loop decision will be permanently recorded in the clinical audit trail.
              </p>

              {overrideError && (
                <div role="alert" className="p-2.5 rounded-xl bg-[#FF8A80]/25 text-xs text-rose-950 font-medium">
                  {overrideError}
                </div>
              )}

              <div>
                <label htmlFor="override-priority-target" className="block text-xs font-semibold text-[#1F2A44] mb-1">
                  New Assigned Priority
                </label>
                <select
                  id="override-priority-target"
                  value={overrideTargetPriority}
                  onChange={(e) => setOverrideTargetPriority(e.target.value as TriagePriority)}
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="Critical">Critical (Immediate SLA)</option>
                  <option value="Urgent">Urgent (45m SLA)</option>
                  <option value="Routine">Routine (Surveillance Queue)</option>
                </select>
              </div>

              <div>
                <label htmlFor="override-reason-input" className="block text-xs font-semibold text-[#1F2A44] mb-1">
                  Clinical Justification for Override (Required)
                </label>
                <textarea
                  id="override-reason-input"
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Chronic stable scarred opacity unchanged from 2024 baseline CT; no acute infiltrate."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#1F2A44]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-[#1F2A44] bg-[#FFC470] hover:bg-[#f5b659] rounded-xl cursor-pointer"
                >
                  Confirm Override & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Requesting Second Opinion */}
      {isSecondOpinionOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="second-opinion-dialog-title"
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="liquid-glass bg-white/95 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="second-opinion-dialog-title" className="text-base font-bold text-[#1F2A44]">
                Request Peer Subspecialty Second Opinion
              </h3>
              <button
                type="button"
                aria-label="Close second opinion dialog"
                onClick={() => setIsSecondOpinionOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSecondOpinionSubmit} className="space-y-4">
              <div>
                <label htmlFor="specialist-select" className="block text-xs font-semibold text-[#1F2A44] mb-1">
                  Select On-Call Subspecialist
                </label>
                <select
                  id="specialist-select"
                  value={specialistTarget}
                  onChange={(e) => setSpecialistTarget(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="Dr. K. Lindholm (Thoracic & Neuro Subspecialty)">
                    Dr. K. Lindholm (Thoracic & Neuro Subspecialty)
                  </option>
                  <option value="Dr. V. Narayanan (Vitreoretinal & Ophthalmic Imaging)">
                    Dr. V. Narayanan (Vitreoretinal & Ophthalmic Imaging)
                  </option>
                  <option value="Dr. E. Rostova (Dermatopathology & Oncology)">
                    Dr. E. Rostova (Dermatopathology & Oncology)
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="second-opinion-note" className="block text-xs font-semibold text-[#1F2A44] mb-1">
                  Clinical Question for Colleague
                </label>
                <textarea
                  id="second-opinion-note"
                  rows={2}
                  value={secondOpinionNote}
                  onChange={(e) => setSecondOpinionNote(e.target.value)}
                  placeholder="Specify region of interest or differential question..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSecondOpinionOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#1F2A44]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-[#1F2A44] bg-[#8FA8F8] hover:bg-[#7b97f5] rounded-xl cursor-pointer"
                >
                  Send Request & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
