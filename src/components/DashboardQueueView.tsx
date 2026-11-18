import React from 'react';
import {
  Search,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  SlidersHorizontal,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import {
  ClinicalCase,
  ModalityShort,
  TriagePriority,
} from '../types/clinical';
import {
  CohortMetrics,
  isLowConfidenceCase,
  maskPatientIdentifier,
} from '../utils/triageLogic';

interface DashboardQueueViewProps {
  cases: ClinicalCase[];
  filteredCases: ClinicalCase[];
  metrics: CohortMetrics;
  triagePriorityFilter: TriagePriority | 'ALL' | 'PENDING';
  modalityFilter: ModalityShort | 'ALL';
  departmentFilter: string;
  dateFilter: string;
  searchQuery: string;
  sortBy: 'priority' | 'confidence' | 'waitTime';
  privacyMasked: boolean;
  confidenceThreshold: number;
  onChangeTriagePriorityFilter: (val: TriagePriority | 'ALL' | 'PENDING') => void;
  onChangeModalityFilter: (val: ModalityShort | 'ALL') => void;
  onChangeDepartmentFilter: (val: string) => void;
  onChangeDateFilter: (val: string) => void;
  onChangeSearchQuery: (val: string) => void;
  onChangeSortBy: (val: 'priority' | 'confidence' | 'waitTime') => void;
  onOpenCaseDetail: (caseId: string) => void;
  onOpenUpload: () => void;
}

export const DashboardQueueView: React.FC<DashboardQueueViewProps> = ({
  filteredCases,
  metrics,
  triagePriorityFilter,
  modalityFilter,
  departmentFilter,
  dateFilter,
  searchQuery,
  sortBy,
  privacyMasked,
  confidenceThreshold,
  onChangeTriagePriorityFilter,
  onChangeModalityFilter,
  onChangeDepartmentFilter,
  onChangeDateFilter,
  onChangeSearchQuery,
  onChangeSortBy,
  onOpenCaseDetail,
  onOpenUpload,
}) => {
  const renderConfidenceGauge = (confidence: number) => {
    const lowConf = isLowConfidenceCase(confidence, confidenceThreshold);
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.max(0, Math.min(100, confidence)) / 100) * circumference;
    const strokeColor = lowConf ? '#D97706' : '#0D9488';

    return (
      <div className="flex items-center gap-2.5">
        <svg className="w-10 h-10 -rotate-90 shrink-0" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="rgba(31, 42, 68, 0.1)"
            strokeWidth="3.5"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div>
          <div className="text-sm font-mono font-bold tabular-nums text-[#1F2A44]">
            {confidence.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#1F2A44]/65">
            {lowConf ? 'Low certainty' : 'Calibrated'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Decision Support Banner + Quick Intake Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#1F2A44]/70">
            DECISION SUPPORT, NOT A DIAGNOSIS · PRIORITIZED CLINICAL TRIAGE QUEUE
          </div>
          <h1 className="text-2xl font-bold text-[#1F2A44] mt-0.5">
            01. TriageLens Clinical Queue & Case Prioritization
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#1F2A44] bg-[#5EC4B6] hover:bg-[#4eb3a5] rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Scan / Dataset</span>
        </button>
      </div>

      {/* Top Summary Row of 4 Liquid Glass Stat Cards */}
      <section
        aria-label="Triage Summary Statistics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <button
          type="button"
          onClick={() =>
            onChangeTriagePriorityFilter(triagePriorityFilter === 'Critical' ? 'ALL' : 'Critical')
          }
          className={`liquid-glass liquid-glass-interactive p-5 text-left transition-all cursor-pointer ${
            triagePriorityFilter === 'Critical' ? 'ring-2 ring-[#FF8A80]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-rose-900">
              ✖ CRITICAL PRIORITY
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#FF8A80]/30 text-rose-900 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-[#1F2A44]">
              {metrics.criticalCount}
            </span>
            <span className="text-xs font-mono text-[#1F2A44]/65">cases · SLA &lt; 15m</span>
          </div>
          <p className="text-xs text-[#1F2A44]/75 mt-2">
            Immediate radiologist & attending physician review required
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeTriagePriorityFilter(triagePriorityFilter === 'Urgent' ? 'ALL' : 'Urgent')
          }
          className={`liquid-glass liquid-glass-interactive p-5 text-left transition-all cursor-pointer ${
            triagePriorityFilter === 'Urgent' ? 'ring-2 ring-[#FFC470]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-amber-900">
              ▲ URGENT PRIORITY
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#FFC470]/35 text-amber-900 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-[#1F2A44]">
              {metrics.urgentCount}
            </span>
            <span className="text-xs font-mono text-[#1F2A44]/65">cases · SLA &lt; 45m</span>
          </div>
          <p className="text-xs text-[#1F2A44]/75 mt-2">
            Expedited subspecialty correlation & confirmatory imaging
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeTriagePriorityFilter(triagePriorityFilter === 'Routine' ? 'ALL' : 'Routine')
          }
          className={`liquid-glass liquid-glass-interactive p-5 text-left transition-all cursor-pointer ${
            triagePriorityFilter === 'Routine' ? 'ring-2 ring-[#7FD8A8]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-emerald-900">
              ● ROUTINE / SURVEILLANCE
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#7FD8A8]/35 text-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-[#1F2A44]">
              {metrics.routineCount}
            </span>
            <span className="text-xs font-mono text-[#1F2A44]/65">cases · SLA &lt; 120m</span>
          </div>
          <p className="text-xs text-[#1F2A44]/75 mt-2">
            Standard diagnostic queue & borderline confidence review
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeTriagePriorityFilter(triagePriorityFilter === 'PENDING' ? 'ALL' : 'PENDING')
          }
          className={`liquid-glass liquid-glass-interactive p-5 text-left transition-all cursor-pointer ${
            triagePriorityFilter === 'PENDING' ? 'ring-2 ring-[#8FA8F8]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-indigo-950">
              ◆ PENDING REVIEW
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#8FA8F8]/30 text-indigo-950 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-[#1F2A44]">
              {metrics.pendingCount}
            </span>
            <span className="text-xs font-mono text-[#1F2A44]/65">
              awaiting clinician ({metrics.assessedCount} signed)
            </span>
          </div>
          <p className="text-xs text-[#1F2A44]/75 mt-2">
            Human-in-the-loop verification required before final report
          </p>
        </button>
      </section>

      {/* Filter, Search, and Sort Controls Card */}
      <section aria-label="Queue Filters and Prioritized Case List" className="liquid-glass p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 pb-4 border-b border-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Interactive Segmented Priority Filter */}
            <div
              role="group"
              aria-label="Filter queue by priority level"
              className="flex items-center gap-1 bg-white/60 p-1 rounded-2xl border border-white/80 overflow-x-auto"
            >
              {(['ALL', 'Critical', 'Urgent', 'Routine', 'PENDING'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onChangeTriagePriorityFilter(tier)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    triagePriorityFilter === tier
                      ? 'bg-[#1F2A44] text-white shadow-xs'
                      : 'text-[#1F2A44]/75 hover:text-[#1F2A44] hover:bg-white/60'
                  }`}
                >
                  {tier === 'ALL' ? 'All Cases' : tier === 'PENDING' ? 'Pending Review' : tier}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#1F2A44]/60 shrink-0" />
              <select
                aria-label="Sort triage queue by"
                value={sortBy}
                onChange={(e) =>
                  onChangeSortBy(e.target.value as 'priority' | 'confidence' | 'waitTime')
                }
                className="min-h-[38px] px-3 py-1.5 text-xs bg-white/80 border border-slate-300/80 rounded-xl text-[#1F2A44]"
              >
                <option value="priority">Sort: Priority & Acuity</option>
                <option value="confidence">Sort: AI Confidence</option>
                <option value="waitTime">Sort: Time Waiting</option>
              </select>
            </div>
          </div>

          {/* Search Input & Dropdown Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#1F2A44]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search cases by patient ID, modality, or AI finding"
                value={searchQuery}
                onChange={(e) => onChangeSearchQuery(e.target.value)}
                placeholder="Search patient ID, finding, ICD-10..."
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs bg-white/80 border border-slate-300/80 rounded-xl text-[#1F2A44] placeholder:text-[#1F2A44]/50 focus:outline-none focus:ring-2 focus:ring-[#5EC4B6]"
              />
            </div>

            <select
              aria-label="Filter by imaging modality"
              value={modalityFilter}
              onChange={(e) => onChangeModalityFilter(e.target.value as ModalityShort | 'ALL')}
              className="min-h-[38px] px-3 py-1.5 text-xs bg-white/80 border border-slate-300/80 rounded-xl text-[#1F2A44]"
            >
              <option value="ALL">All Modalities</option>
              <option value="X-Ray">X-Ray</option>
              <option value="MRI">MRI</option>
              <option value="Retinal Scan">Retinal Scan</option>
              <option value="Dermoscopy">Dermoscopy</option>
              <option value="CT">CT</option>
            </select>

            <select
              aria-label="Filter by clinical department"
              value={departmentFilter}
              onChange={(e) => onChangeDepartmentFilter(e.target.value)}
              className="min-h-[38px] px-3 py-1.5 text-xs bg-white/80 border border-slate-300/80 rounded-xl text-[#1F2A44]"
            >
              <option value="ALL">All Departments</option>
              <option value="Emergency">Emergency</option>
              <option value="Neurology">Neurology</option>
              <option value="Ophthalmology">Ophthalmology</option>
              <option value="Oncology">Oncology</option>
              <option value="Pulmonology">Pulmonology</option>
            </select>

            <select
              aria-label="Filter by study date"
              value={dateFilter}
              onChange={(e) => onChangeDateFilter(e.target.value)}
              className="min-h-[38px] px-3 py-1.5 text-xs font-mono bg-white/80 border border-slate-300/80 rounded-xl text-[#1F2A44]"
            >
              <option value="ALL">All Dates</option>
              <option value="2026-11-16">2026-11-16 (Today)</option>
              <option value="2026-11-15">2026-11-15 (Yesterday)</option>
            </select>
          </div>
        </div>

        {/* Prioritized Case List Table */}
        {filteredCases.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-medium text-[#1F2A44]">
              No clinical cases match your active filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                onChangeTriagePriorityFilter('ALL');
                onChangeModalityFilter('ALL');
                onChangeDepartmentFilter('ALL');
                onChangeDateFilter('ALL');
                onChangeSearchQuery('');
              }}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#1F2A44] bg-[#5EC4B6]/30 hover:bg-[#5EC4B6]/50 rounded-xl transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-mono text-[#1F2A44]/65">
                  <th className="py-2.5 pr-2.5 font-semibold">PRIORITY</th>
                  <th className="py-2.5 px-2.5 font-semibold">PATIENT ID & DEPT</th>
                  <th className="py-2.5 px-2.5 font-semibold">MODALITY</th>
                  <th className="py-2.5 px-2.5 font-semibold">AI-FLAGGED FINDING</th>
                  <th className="py-2.5 px-2.5 font-semibold">CONFIDENCE</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right">WAITING</th>
                  <th className="py-2.5 pl-2.5 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-xs">
                {filteredCases.map((c) => {
                  const lowConfidence = isLowConfidenceCase(c.aiConfidence, confidenceThreshold);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onOpenCaseDetail(c.id)}
                      className="hover:bg-white/65 transition-colors cursor-pointer group"
                    >
                      {/* Accessible Priority Indicator (Icon + Text beside pastel tone) */}
                      <td className="py-3.5 pr-2.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-xs flex items-center gap-1.5">
                          {c.triagePriority === 'Critical' && (
                            <span className="text-rose-800 bg-[#FF8A80]/30 px-2.5 py-1 rounded-lg">
                              ✖ Critical
                            </span>
                          )}
                          {c.triagePriority === 'Urgent' && (
                            <span className="text-amber-900 bg-[#FFC470]/35 px-2.5 py-1 rounded-lg">
                              ▲ Urgent
                            </span>
                          )}
                          {c.triagePriority === 'Routine' && (
                            <span className="text-emerald-900 bg-[#7FD8A8]/35 px-2.5 py-1 rounded-lg">
                              ● Routine
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#1F2A44]/65 mt-1">
                          {c.id} · {c.reviewStatus}
                        </div>
                      </td>

                      {/* Patient ID (Masked by default for privacy) */}
                      <td className="py-3.5 px-2.5 whitespace-nowrap">
                        <div className="font-semibold text-sm text-[#1F2A44]">
                          {maskPatientIdentifier(c.patientName, privacyMasked)}{' '}
                          <span className="font-mono text-xs font-normal text-[#1F2A44]/70">
                            ({c.age}{c.sex})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#1F2A44]/70 mt-0.5">
                          {maskPatientIdentifier(c.patientId, privacyMasked)} · {c.department}
                        </div>
                      </td>

                      {/* Modality */}
                      <td className="py-3.5 px-2.5 whitespace-nowrap">
                        <div className="font-semibold text-[#1F2A44]">{c.modalityShort}</div>
                        <div className="text-[11px] text-[#1F2A44]/65 truncate max-w-[140px]">
                          {c.anatomicalRegion}
                        </div>
                      </td>

                      {/* AI-Flagged Finding & Safety Warning */}
                      <td className="py-3.5 px-2.5 max-w-[260px]">
                        <div className="font-semibold text-xs sm:text-sm text-[#1F2A44] line-clamp-2">
                          {c.aiFlaggedFinding}
                        </div>
                        {lowConfidence && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-900 bg-[#FFC470]/30 px-2 py-0.5 rounded-md">
                            <ShieldAlert className="w-3 h-3 text-amber-800 shrink-0" />
                            <span>AI uncertain, review manually</span>
                          </div>
                        )}
                      </td>

                      {/* Confidence Score Gauge */}
                      <td className="py-3.5 px-2.5 whitespace-nowrap">
                        {renderConfidenceGauge(c.aiConfidence)}
                      </td>

                      {/* Time Waiting */}
                      <td className="py-3.5 px-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#1F2A44]">
                          {c.waitMinutes}m
                        </div>
                        <div className="text-[11px] text-[#1F2A44]/65">
                          SLA {c.targetTurnaroundMinutes}m
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 pl-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCaseDetail(c.id);
                          }}
                          className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-[#1F2A44] bg-white/80 hover:bg-[#5EC4B6] border border-slate-200/80 rounded-xl transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
