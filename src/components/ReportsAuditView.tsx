import React, { useState } from 'react';
import {
  Printer,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  AlertTriangle,
  Lock,
  Bell,
  FileText,
} from 'lucide-react';
import {
  AuditLogEntry,
  ClinicalCase,
  UserRole,
} from '../types/clinical';
import { maskPatientIdentifier } from '../utils/triageLogic';

interface ReportsViewProps {
  cases: ClinicalCase[];
  activeCase: ClinicalCase;
  auditLogs: AuditLogEntry[];
  privacyMasked: boolean;
  currentUserRole: UserRole;
  currentClinicianName: string;
  onSelectCase: (caseId: string) => void;
  onSaveReportNote: (caseId: string, notes: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  cases,
  activeCase,
  auditLogs,
  privacyMasked,
  currentUserRole,
  currentClinicianName,
  onSelectCase,
  onSaveReportNote,
}) => {
  const [notesDraft, setNotesDraft] = useState<string>(
    activeCase.reportClinicianNotes ||
      `Attending ${currentUserRole} review of ${activeCase.modality} (${activeCase.accessionNumber}): Correlated TriageLens AI-flagged finding (${activeCase.aiFlaggedFinding}) with clinical presentation (${activeCase.chiefComplaint}) and laboratory biomarkers. Recommend immediate clinical follow-up per protocol.`
  );
  const [savedBanner, setSavedBanner] = useState(false);

  const handleCaseSwitch = (caseId: string) => {
    onSelectCase(caseId);
    const target = cases.find((c) => c.id === caseId);
    if (target) {
      setNotesDraft(
        target.reportClinicianNotes ||
          `Attending ${currentUserRole} review of ${target.modality} (${target.accessionNumber}): Correlated TriageLens AI-flagged finding (${target.aiFlaggedFinding}) with clinical presentation and laboratory biomarkers.`
      );
      setSavedBanner(false);
    }
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReportNote(activeCase.id, notesDraft);
    setSavedBanner(true);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <div className="text-xs font-mono text-[#1F2A44]/70">
            STRUCTURED CLINICAL SUMMARY · IMMUTABLE AUDIT TRAIL
          </div>
          <h1 className="text-2xl font-bold text-[#1F2A44] mt-0.5">
            05. Clinical Triage Report & Audit Log
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select clinical case for report generation"
            value={activeCase.id}
            onChange={(e) => handleCaseSwitch(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold bg-white/85 border border-slate-300/80 rounded-xl text-[#1F2A44]"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} · {maskPatientIdentifier(c.patientName, privacyMasked)} ({c.modalityShort})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportPdf}
            className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#1F2A44] hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#5EC4B6]" />
            <span>Export to PDF / Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editable Clinical Summary Report */}
        <section
          aria-label="Generated Clinical Decision-Support Report"
          className="lg:col-span-7 liquid-glass p-6 space-y-5"
        >
          <div className="flex items-start justify-between border-b border-slate-200/70 pb-4">
            <div>
              <div className="text-xs font-mono font-semibold text-teal-900">
                TRIAGELENS CLINICAL DECISION-SUPPORT SUMMARY (NOT A STANDALONE DIAGNOSIS)
              </div>
              <h2 className="text-lg font-bold text-[#1F2A44] mt-1">
                {activeCase.modality} — {activeCase.accessionNumber}
              </h2>
              <p className="text-xs font-mono text-[#1F2A44]/70 mt-0.5">
                Patient: {maskPatientIdentifier(activeCase.patientName, privacyMasked)} ({activeCase.age}
                {activeCase.sex}) · ID: {maskPatientIdentifier(activeCase.patientId, privacyMasked)} · Dept:{' '}
                {activeCase.department}
              </p>
            </div>
            <FileText className="w-6 h-6 text-[#5EC4B6] shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="liquid-glass-subtle p-3">
              <div className="text-[#1F2A44]/65">TRIAGE PRIORITY</div>
              <div className="text-sm font-bold text-[#1F2A44] mt-0.5">
                {activeCase.triagePriority} (Acuity {activeCase.acuityScore}/100)
              </div>
            </div>
            <div className="liquid-glass-subtle p-3">
              <div className="text-[#1F2A44]/65">AI CONFIDENCE</div>
              <div className="text-sm font-bold text-[#1F2A44] mt-0.5">
                {activeCase.aiConfidence.toFixed(1)}%
              </div>
            </div>
            <div className="liquid-glass-subtle p-3">
              <div className="text-[#1F2A44]/65">REVIEW STATUS</div>
              <div className="text-sm font-bold text-teal-900 mt-0.5">
                {activeCase.reviewStatus}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-mono font-semibold text-[#1F2A44]/70">
              AI-FLAGGED FINDING & PLAIN-LANGUAGE RATIONALE
            </div>
            <div className="p-3.5 rounded-2xl bg-white/75 border border-white space-y-1.5">
              <div className="font-bold text-sm text-[#1F2A44]">{activeCase.aiFlaggedFinding}</div>
              <p className="text-[#1F2A44]/85 leading-relaxed">{activeCase.plainLanguageReasoning}</p>
            </div>
          </div>

          <form onSubmit={handleSaveNotes} className="space-y-3 pt-2 border-t border-slate-200/70">
            <div className="flex items-center justify-between">
              <label htmlFor="report-clinician-notes" className="text-xs font-bold text-[#1F2A44]">
                Editable Attending Clinician Notes & Final Interpretation
              </label>
              <span className="text-[11px] font-mono text-[#1F2A44]/65">
                Signatory: {currentClinicianName} ({currentUserRole})
              </span>
            </div>

            <textarea
              id="report-clinician-notes"
              rows={4}
              value={notesDraft}
              onChange={(e) => {
                setNotesDraft(e.target.value);
                setSavedBanner(false);
              }}
              className="w-full p-3.5 text-xs bg-white/85 border border-slate-300/80 rounded-2xl text-[#1F2A44] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#5EC4B6]"
            />

            {savedBanner && (
              <div
                role="status"
                className="p-2.5 rounded-xl bg-[#7FD8A8]/35 text-xs font-semibold text-emerald-950 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Clinician report notes saved and logged to the immutable audit trail.</span>
              </div>
            )}

            <div className="flex justify-end no-print">
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#1F2A44] bg-[#5EC4B6] hover:bg-[#4eb3a5] rounded-xl transition-colors cursor-pointer"
              >
                Save & Sign Clinical Addendum
              </button>
            </div>
          </form>
        </section>

        {/* Live Immutable Audit Trail */}
        <section
          aria-label="Clinical Decision Audit Trail"
          className="lg:col-span-5 liquid-glass p-6 space-y-4"
        >
          <div className="border-b border-slate-200/70 pb-3">
            <h2 className="text-base font-bold text-[#1F2A44]">
              Cryptographic Clinical Audit Trail ({auditLogs.length} Events)
            </h2>
            <p className="text-xs text-[#1F2A44]/70 mt-0.5">
              Every AI flag, clinician confirmation, priority override, and escalation is logged
            </p>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="liquid-glass-subtle p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px] text-[#1F2A44]/70">
                  <span className="font-bold text-[#1F2A44]">{log.action}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="text-[11px] font-mono text-teal-900">
                  {log.caseId} · {maskPatientIdentifier(log.patientId, privacyMasked)} · Actor:{' '}
                  {log.actorName} ({log.actorRole})
                </div>
                <p className="text-[#1F2A44]/85 leading-relaxed">{log.rationale}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

interface SettingsTransparencyViewProps {
  privacyMasked: boolean;
  confidenceThreshold: number;
  sessionMinutesRemaining: number;
  onTogglePrivacyMasked: () => void;
  onChangeConfidenceThreshold: (val: number) => void;
  onResetSessionTimer: () => void;
}

export const SettingsTransparencyView: React.FC<SettingsTransparencyViewProps> = ({
  privacyMasked,
  confidenceThreshold,
  sessionMinutesRemaining,
  onTogglePrivacyMasked,
  onChangeConfidenceThreshold,
  onResetSessionTimer,
}) => {
  const [notifyCriticalAudio, setNotifyCriticalAudio] = useState(true);
  const [notifyLowConfidence, setNotifyLowConfidence] = useState(true);

  const MODALITY_METRICS = [
    { modality: 'Thoracic Radiography (CXR)', sensitivity: '96.4%', specificity: '92.1%', auc: '0.958', sampleSize: 'n = 14,200' },
    { modality: 'Neuro-MRI (Axial T2-FLAIR)', sensitivity: '95.8%', specificity: '94.0%', auc: '0.962', sampleSize: 'n = 8,450' },
    { modality: 'Retinal Fundus Photography', sensitivity: '97.1%', specificity: '93.5%', auc: '0.969', sampleSize: 'n = 19,800' },
    { modality: 'Polarized Dermoscopy (20×)', sensitivity: '91.2%', specificity: '86.4%', auc: '0.914', sampleSize: 'n = 6,120' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#1F2A44]/70">
          MODEL TRANSPARENCY CARD · BIAS & LIMITATIONS · PRIVACY GOVERNANCE
        </div>
        <h1 className="text-2xl font-bold text-[#1F2A44] mt-0.5">
          06. Settings, Model Transparency & Clinical Safety
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Model Version & Clinical Validation Performance */}
        <section className="lg:col-span-7 liquid-glass p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200/70">
            <div>
              <h2 className="text-base font-bold text-[#1F2A44]">
                Model Architecture & Multi-Center Validation Metrics
              </h2>
              <p className="text-xs font-mono text-[#1F2A44]/70 mt-0.5">
                Engine: TriageLens Multimodal CDS v4.2.0 (Powered by Gemini-4-Hydrogen)
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-teal-950 bg-[#5EC4B6]/30 px-3 py-1 rounded-xl">
              FDA 21 CFR §820 Non-Device CDS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 text-[11px] font-mono text-[#1F2A44]/65">
                  <th className="py-2.5 pr-3 font-semibold">APPROVED MODALITY</th>
                  <th className="py-2.5 px-3 font-semibold text-right">SENSITIVITY</th>
                  <th className="py-2.5 px-3 font-semibold text-right">SPECIFICITY</th>
                  <th className="py-2.5 px-3 font-semibold text-right">AUC-ROC</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">COHORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-xs">
                {MODALITY_METRICS.map((m) => (
                  <tr key={m.modality}>
                    <td className="py-3 pr-3 font-semibold text-[#1F2A44]">{m.modality}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-teal-900 font-bold">
                      {m.sensitivity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1F2A44]">
                      {m.specificity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#1F2A44]">
                      {m.auc}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono text-[#1F2A44]/70">
                      {m.sampleSize}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explicit Bias & Limitations Disclosure */}
          <div className="liquid-glass-subtle p-4 space-y-2 border border-[#FFC470]">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
              <span>Known Limitations, Subgroup Calibration & Bias Mitigation Note</span>
            </div>
            <ul className="text-xs text-[#1F2A44]/85 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                <strong>Intended Use:</strong> TriageLens is a clinical decision-support prioritization tool and must never be used as a standalone diagnostic replacement for radiologist or physician review.
              </li>
              <li>
                <strong>Dermatology Phototype Calibration:</strong> Polarized dermoscopy confidence may exhibit higher variance on Fitzpatrick Skin Phototypes V–VI or acral/mucosal lesions; cases scoring below {confidenceThreshold}% automatically trigger an <em>“AI uncertain, review manually”</em> alert.
              </li>
              <li>
                <strong>Portable / Supine Radiographs:</strong> AP supine portable chest radiographs with lordotic projection or motion artifact should be interpreted alongside serial laboratory biomarkers.
              </li>
            </ul>
          </div>
        </section>

        {/* Privacy, Safety Thresholds & Notification Preferences */}
        <section className="lg:col-span-5 liquid-glass p-6 space-y-5">
          <div className="border-b border-slate-200/70 pb-3">
            <h2 className="text-base font-bold text-[#1F2A44]">
              Privacy, Safety Thresholds & Notifications
            </h2>
            <p className="text-xs text-[#1F2A44]/70 mt-0.5">
              Configure PHI masking, uncertainty alert cutoffs, and session security
            </p>
          </div>

          <div className="space-y-4">
            {/* Privacy Masking Toggle */}
            <div className="liquid-glass-subtle p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#1F2A44] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-700" />
                  <span>Mask Patient Identifiers (PHI Safe-Harbor)</span>
                </div>
                <p className="text-[11px] text-[#1F2A44]/70">
                  Obfuscates patient names and MRNs on shared clinical monitors
                </p>
              </div>
              <button
                type="button"
                onClick={onTogglePrivacyMasked}
                className={`min-h-[40px] px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer ${
                  privacyMasked
                    ? 'bg-[#5EC4B6] text-[#1F2A44]'
                    : 'bg-slate-200 text-[#1F2A44]/75'
                }`}
              >
                {privacyMasked ? 'MASKED (ON)' : 'UNMASKED'}
              </button>
            </div>

            {/* Low-Confidence Manual Review Threshold Slider */}
            <div className="liquid-glass-subtle p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="uncertainty-cutoff-slider"
                  className="text-xs font-bold text-[#1F2A44] flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-700" />
                  <span>“AI Uncertain” Manual Review Threshold</span>
                </label>
                <span className="text-xs font-mono font-bold text-teal-900">
                  &lt; {confidenceThreshold}%
                </span>
              </div>
              <input
                id="uncertainty-cutoff-slider"
                type="range"
                min={60}
                max={90}
                value={confidenceThreshold}
                onChange={(e) => onChangeConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-[#5EC4B6] cursor-pointer"
              />
              <p className="text-[11px] text-[#1F2A44]/70">
                Any case with AI confidence below {confidenceThreshold}% displays a prominent manual-review warning badge.
              </p>
            </div>

            {/* Notification Preferences */}
            <div className="liquid-glass-subtle p-4 space-y-3">
              <div className="text-xs font-bold text-[#1F2A44] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#8FA8F8]" />
                <span>Clinical Queue Alert Preferences</span>
              </div>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span>Critical Priority Arrival Toast & Chime</span>
                <input
                  type="checkbox"
                  checked={notifyCriticalAudio}
                  onChange={(e) => setNotifyCriticalAudio(e.target.checked)}
                  className="w-4 h-4 accent-[#5EC4B6]"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span>Flag Low-Confidence Cases in Queue Header</span>
                <input
                  type="checkbox"
                  checked={notifyLowConfidence}
                  onChange={(e) => setNotifyLowConfidence(e.target.checked)}
                  className="w-4 h-4 accent-[#5EC4B6]"
                />
              </label>
            </div>

            {/* Session Timeout Status */}
            <div className="liquid-glass-subtle p-4 flex items-center justify-between gap-3">
              <div className="text-xs">
                <div className="font-bold text-[#1F2A44] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>HIPAA Idle Session Timer: {sessionMinutesRemaining}:00 remaining</span>
                </div>
                <p className="text-[11px] text-[#1F2A44]/70 mt-0.5">
                  Automatically locks workstation after 15 minutes of inactivity
                </p>
              </div>
              <button
                type="button"
                onClick={onResetSessionTimer}
                className="min-h-[40px] px-3 py-1.5 text-xs font-semibold bg-white/80 hover:bg-white border border-slate-300 rounded-xl cursor-pointer shrink-0"
              >
                Renew Session
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
