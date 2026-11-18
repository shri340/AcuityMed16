import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  ScanSearch,
  UploadCloud,
  Columns,
  FileText,
  Sliders,
  UserCheck,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { APPROVED_CLINICAL_CASES, INITIAL_AUDIT_LOGS } from './data/approvedCases';
import {
  AuditLogEntry,
  ClinicalCase,
  ModalityShort,
  TriagePriority,
  UserRole,
} from './types/clinical';
import {
  calculateClinicalAcuity,
  computeCohortMetrics,
  filterAndSortCases,
  maskPatientIdentifier,
} from './utils/triageLogic';
import { LoginRoleScreen } from './components/LoginRoleScreen';
import { DashboardQueueView } from './components/DashboardQueueView';
import { UploadIntakeView } from './components/UploadIntakeView';
import { DiagnosticViewport } from './components/DiagnosticViewport';
import { BiomarkerTelemetry } from './components/BiomarkerTelemetry';
import { DecisionSupportPanel } from './components/DecisionSupportPanel';
import { CompareScansView } from './components/CompareScansView';
import { ReportsView, SettingsTransparencyView } from './components/ReportsAuditView';

export type TriageLensScreen =
  | 'login'
  | 'dashboard'
  | 'detail'
  | 'upload'
  | 'compare'
  | 'reports'
  | 'settings';

export default function App() {
  const [cases, setCases] = useState<ClinicalCase[]>(APPROVED_CLINICAL_CASES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(APPROVED_CLINICAL_CASES[0].id);
  const [selectedRoiId, setSelectedRoiId] = useState<string | null>(
    APPROVED_CLINICAL_CASES[0].regionsOfInterest[0]?.id || null
  );

  // Support ?autostart=1 or ?screen=... query params; default to dashboard so all triage data is immediately visible, with 1-click Login/Role screen
  const [activeScreen, setActiveScreen] = useState<TriageLensScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get('screen') as TriageLensScreen | null;
      if (requested) return requested;
    }
    return 'dashboard';
  });

  // Clinician role, privacy masking, and safety thresholds
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Radiologist');
  const [currentClinicianName, setCurrentClinicianName] = useState<string>('Dr. S. Chen, MD, FRCR');
  const [privacyMasked, setPrivacyMasked] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(75);
  const [sessionMinutesRemaining, setSessionMinutesRemaining] = useState<number>(14);

  // Dashboard Queue Filters & Sorting
  const [triagePriorityFilter, setTriagePriorityFilter] = useState<
    TriagePriority | 'ALL' | 'PENDING'
  >('ALL');
  const [modalityFilter, setModalityFilter] = useState<ModalityShort | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'confidence' | 'waitTime'>('priority');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const filteredQueue = useMemo(
    () =>
      filterAndSortCases(cases, {
        triagePriorityFilter,
        modalityFilter,
        departmentFilter,
        dateFilter,
        searchQuery,
        sortBy,
      }),
    [
      cases,
      triagePriorityFilter,
      modalityFilter,
      departmentFilter,
      dateFilter,
      searchQuery,
      sortBy,
    ]
  );

  const activeCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) || filteredQueue[0] || cases[0],
    [cases, selectedCaseId, filteredQueue]
  );

  const cohortMetrics = useMemo(() => computeCohortMetrics(cases), [cases]);

  const activeAcuityDetails = useMemo(
    () =>
      calculateClinicalAcuity({
        imagingAbnormalityScore: activeCase.imagingAbnormalityScore,
        biomarkerDeviationScore: activeCase.biomarkerDeviationScore,
        vitalInstabilityScore: activeCase.vitalInstabilityScore,
        progressionVelocityScore: activeCase.progressionVelocityScore,
      }),
    [activeCase]
  );

  const appendAuditLog = (
    caseId: string,
    patientId: string,
    action: AuditLogEntry['action'],
    rationale: string,
    previousPriority?: TriagePriority,
    newPriority?: TriagePriority
  ) => {
    const newEntry: AuditLogEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: `2026-11-16 ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`,
      caseId,
      patientId,
      actorName: currentClinicianName,
      actorRole: currentUserRole,
      action,
      rationale,
      previousPriority,
      newPriority,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleOpenCaseDetail = (caseId: string) => {
    setSelectedCaseId(caseId);
    const target = cases.find((c) => c.id === caseId);
    setSelectedRoiId(target?.regionsOfInterest[0]?.id || null);
    setActiveScreen('detail');
  };

  const handleConfirmCase = (caseId: string, note: string) => {
    const target = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, reviewStatus: 'Confirmed' } : c))
    );
    if (target) {
      appendAuditLog(caseId, target.patientId, 'Confirmed Finding', note, target.triagePriority, target.triagePriority);
      setToastMessage(`Confirmed finding for ${caseId} (${target.triagePriority}). Logged to audit trail.`);
    }
  };

  const handleOverrideCase = (
    caseId: string,
    newPriority: TriagePriority,
    reason: string
  ) => {
    const target = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              triagePriority: newPriority,
              reviewStatus: 'Overridden',
              overrideReason: reason,
            }
          : c
      )
    );
    if (target) {
      appendAuditLog(
        caseId,
        target.patientId,
        'Overrode Priority',
        `Priority changed from ${target.triagePriority} to ${newPriority}: ${reason}`,
        target.triagePriority,
        newPriority
      );
      setToastMessage(`Overrode ${caseId} priority to ${newPriority}. Justification logged.`);
    }
  };

  const handleRequestSecondOpinion = (
    caseId: string,
    specialist: string,
    note: string
  ) => {
    const target = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              reviewStatus: 'Second Opinion Requested',
              secondOpinionAssignee: specialist,
            }
          : c
      )
    );
    if (target) {
      appendAuditLog(
        caseId,
        target.patientId,
        'Requested Second Opinion',
        `Routed to ${specialist}: ${note}`
      );
      setToastMessage(`Second opinion requested from ${specialist}.`);
    }
  };

  const handleEscalateCase = (caseId: string, reason: string) => {
    const target = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              triagePriority: 'Critical',
              priorityTier: 'STAT',
              targetTurnaroundMinutes: 15,
              reviewStatus: 'Escalated',
            }
          : c
      )
    );
    if (target) {
      appendAuditLog(
        caseId,
        target.patientId,
        'Escalated Case',
        reason,
        target.triagePriority,
        'Critical'
      );
      setToastMessage(`Escalated ${caseId} to Critical STAT priority.`);
    }
  };

  const handleUpdateCaseFromAI = (
    caseId: string,
    aiPayload: {
      imagingAbnormalityScore: number;
      primarySummary: string;
      differentialIndicators: ClinicalCase['differentialIndicators'];
      recommendedNextSteps: string[];
      detectedRegions?: ClinicalCase['regionsOfInterest'];
    }
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updatedAcuity = calculateClinicalAcuity({
          imagingAbnormalityScore: aiPayload.imagingAbnormalityScore,
          biomarkerDeviationScore: c.biomarkerDeviationScore,
          vitalInstabilityScore: c.vitalInstabilityScore,
          progressionVelocityScore: c.progressionVelocityScore,
        });
        return {
          ...c,
          imagingAbnormalityScore: aiPayload.imagingAbnormalityScore,
          acuityScore: updatedAcuity.acuityScore,
          priorityTier: updatedAcuity.priorityTier,
          triagePriority: updatedAcuity.triagePriority,
          targetTurnaroundMinutes: updatedAcuity.targetTurnaroundMinutes,
          primarySummary: aiPayload.primarySummary,
          plainLanguageReasoning: aiPayload.primarySummary,
          differentialIndicators: aiPayload.differentialIndicators,
          recommendedNextSteps: aiPayload.recommendedNextSteps,
          regionsOfInterest: aiPayload.detectedRegions?.length
            ? aiPayload.detectedRegions
            : c.regionsOfInterest,
        };
      })
    );
    setToastMessage(`Gemini multimodal analysis updated for ${caseId}.`);
  };

  const handleAddCaseAndOpen = (newCase: ClinicalCase) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setSelectedRoiId(newCase.regionsOfInterest[0]?.id || null);
    appendAuditLog(
      newCase.id,
      newCase.patientId,
      'Uploaded Dataset',
      `Uploaded ${newCase.modality} scan and clinical dataset. Initial AI priority: ${newCase.triagePriority}.`,
      undefined,
      newCase.triagePriority
    );
    setToastMessage(`Uploaded and prioritized ${newCase.id} (${newCase.triagePriority}).`);
    setActiveScreen('detail');
  };

  const handleSaveReportNote = (caseId: string, notes: string) => {
    const target = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, reportClinicianNotes: notes } : c))
    );
    if (target) {
      appendAuditLog(
        caseId,
        target.patientId,
        'Updated Report Note',
        `Signed clinical addendum: "${notes.slice(0, 90)}..."`
      );
      setToastMessage(`Saved clinical report addendum for ${caseId}.`);
    }
  };

  const NAV_ITEMS: Array<{
    id: TriageLensScreen;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'dashboard',
      label: 'Triage Queue',
      shortLabel: 'Queue',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'detail',
      label: 'Case Analysis',
      shortLabel: 'Analysis',
      icon: <ScanSearch className="w-4 h-4" />,
    },
    {
      id: 'upload',
      label: 'Upload & Intake',
      shortLabel: 'Upload',
      icon: <UploadCloud className="w-4 h-4" />,
    },
    {
      id: 'compare',
      label: 'Compare Scans',
      shortLabel: 'Compare',
      icon: <Columns className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports & Audit',
      shortLabel: 'Reports',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Model & Settings',
      shortLabel: 'Settings',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'login',
      label: 'Role & Access',
      shortLabel: 'Role',
      icon: <UserCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col tl-mesh-bg text-[#1F2A44] relative overflow-x-hidden">
      {/* Slow-Floating Blurred Pastel Orbs Behind Content */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print"
      >
        <div
          className="orb-animate-1 absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-55 blur-3xl"
          style={{ backgroundColor: '#E6F7F4' }}
        />
        <div
          className="orb-animate-2 absolute top-1/4 -right-24 w-[420px] h-[420px] rounded-full opacity-55 blur-3xl"
          style={{ backgroundColor: '#E3F0FF' }}
        />
        <div
          className="orb-animate-1 absolute -bottom-28 left-1/3 w-[380px] h-[380px] rounded-full opacity-50 blur-3xl"
          style={{ backgroundColor: '#EEE8FF' }}
        />
      </div>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="relative z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/65 backdrop-blur-xl border-b border-white/85 no-print">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveScreen('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-[#1F2A44] whitespace-nowrap shrink-0 font-display"
        >
          TriageLens
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#1F2A44]/75"
        >
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen('dashboard');
            }}
            className={`hover:text-[#1F2A44] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeScreen === 'dashboard'
                ? 'text-[#1F2A44] font-semibold underline underline-offset-8 decoration-2 decoration-[#5EC4B6]'
                : ''
            }`}
          >
            Triage Queue
          </a>
          <a
            href="#detail"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen('detail');
            }}
            className={`hover:text-[#1F2A44] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeScreen === 'detail'
                ? 'text-[#1F2A44] font-semibold underline underline-offset-8 decoration-2 decoration-[#5EC4B6]'
                : ''
            }`}
          >
            Case Analysis
          </a>
          <a
            href="#compare"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen('compare');
            }}
            className={`hover:text-[#1F2A44] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeScreen === 'compare'
                ? 'text-[#1F2A44] font-semibold underline underline-offset-8 decoration-2 decoration-[#5EC4B6]'
                : ''
            }`}
          >
            Compare Scans
          </a>
          <a
            href="#reports"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen('reports');
            }}
            className={`hover:text-[#1F2A44] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeScreen === 'reports'
                ? 'text-[#1F2A44] font-semibold underline underline-offset-8 decoration-2 decoration-[#5EC4B6]'
                : ''
            }`}
          >
            Reports & Audit
          </a>
          <a
            href="#settings"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen('settings');
            }}
            className={`hover:text-[#1F2A44] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeScreen === 'settings'
                ? 'text-[#1F2A44] font-semibold underline underline-offset-8 decoration-2 decoration-[#5EC4B6]'
                : ''
            }`}
          >
            Model Transparency
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveScreen('upload')}
            className="min-h-[40px] px-4 py-2 text-xs font-bold text-[#1F2A44] bg-[#5EC4B6] hover:bg-[#4eb3a5] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Upload Scan / Dataset
          </button>
        </div>
      </header>

      {/* Secondary Privacy, Role & Session Governance Ribbon */}
      <div className="relative z-20 bg-white/45 backdrop-blur-md border-b border-white/75 px-6 py-2 no-print">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-[#1F2A44]/80">
            <span>
              ROLE: <strong className="text-[#1F2A44]">{currentUserRole.toUpperCase()}</strong> ({currentClinicianName})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              ACTIVE CASE:{' '}
              <strong className="text-teal-900">
                {activeCase.id} ({maskPatientIdentifier(activeCase.patientId, privacyMasked)})
              </strong>
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline text-[#1F2A44]/70">
              Decision support, not a diagnosis
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Persistent Privacy Masking Toggle */}
            <button
              type="button"
              onClick={() => setPrivacyMasked((prev) => !prev)}
              aria-label={privacyMasked ? 'Unmask patient identifiers' : 'Mask patient identifiers'}
              className="px-2.5 py-1 rounded-lg bg-white/75 hover:bg-white border border-slate-200/80 text-[#1F2A44] flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              {privacyMasked ? (
                <EyeOff className="w-3.5 h-3.5 text-teal-700" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-amber-700" />
              )}
              <span>{privacyMasked ? 'PHI Masked' : 'PHI Visible'}</span>
            </button>

            {/* Session Timeout Indicator */}
            <button
              type="button"
              onClick={() => {
                setSessionMinutesRemaining(15);
                setToastMessage('Clinical workstation session renewed for 15 minutes.');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/75 hover:bg-white border border-slate-200/80 text-[#1F2A44]/80 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-[#8FA8F8]" />
              <span>Session: {sessionMinutesRemaining}m</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 liquid-glass bg-white/90 px-4 py-3 flex items-center gap-3 max-w-md shadow-lg border border-[#5EC4B6]"
        >
          <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
          <span className="text-xs font-semibold text-[#1F2A44]">{toastMessage}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToastMessage(null)}
            className="p-1 text-[#1F2A44]/60 hover:text-[#1F2A44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace with Glass Sidebar Navigation + Content Stage */}
      <div className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Glass Sidebar Navigation (Desktop & Tablet) */}
        <aside
          aria-label="TriageLens Screen Navigation Sidebar"
          className="w-full lg:w-56 shrink-0 liquid-glass p-3 no-print"
        >
          <div className="px-3 py-2 text-[11px] font-mono font-semibold text-[#1F2A44]/60 hidden lg:block">
            WORKSTATION SCREENS
          </div>
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#1F2A44] text-white shadow-xs'
                      : 'text-[#1F2A44]/80 hover:bg-white/65 hover:text-[#1F2A44]'
                  }`}
                >
                  <span className={isActive ? 'text-[#5EC4B6]' : 'text-[#1F2A44]/70'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Compact Active Case Selector in Sidebar */}
          <div className="hidden lg:block mt-4 pt-4 border-t border-slate-200/70 px-2 space-y-2">
            <div className="text-[11px] font-mono font-semibold text-[#1F2A44]/60">
              QUICK CASE SWITCHER
            </div>
            <div className="space-y-1.5">
              {cases.map((c) => {
                const isSelected = c.id === activeCase.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      setSelectedRoiId(c.regionsOfInterest[0]?.id || null);
                      if (
                        activeScreen !== 'detail' &&
                        activeScreen !== 'compare' &&
                        activeScreen !== 'reports'
                      ) {
                        setActiveScreen('detail');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#5EC4B6]/30 font-bold text-[#1F2A44] border border-[#5EC4B6]'
                        : 'hover:bg-white/60 text-[#1F2A44]/80'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span>{c.id}</span>
                      <span>
                        {c.triagePriority === 'Critical' && '✖ Crit'}
                        {c.triagePriority === 'Urgent' && '▲ Urg'}
                        {c.triagePriority === 'Routine' && '● Rout'}
                      </span>
                    </div>
                    <div className="truncate mt-0.5">
                      {maskPatientIdentifier(c.patientName, privacyMasked)} · {c.modalityShort}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Screen Viewport */}
        <main className="flex-1 w-full min-w-0">
          {activeScreen === 'login' && (
            <LoginRoleScreen
              selectedRole={currentUserRole}
              onSelectRoleAndEnter={(role, name) => {
                setCurrentUserRole(role);
                setCurrentClinicianName(name);
                setToastMessage(`Authenticated as ${name} (${role}).`);
                setActiveScreen('dashboard');
              }}
            />
          )}

          {activeScreen === 'dashboard' && (
            <DashboardQueueView
              cases={cases}
              filteredCases={filteredQueue}
              metrics={cohortMetrics}
              triagePriorityFilter={triagePriorityFilter}
              modalityFilter={modalityFilter}
              departmentFilter={departmentFilter}
              dateFilter={dateFilter}
              searchQuery={searchQuery}
              sortBy={sortBy}
              privacyMasked={privacyMasked}
              confidenceThreshold={confidenceThreshold}
              onChangeTriagePriorityFilter={setTriagePriorityFilter}
              onChangeModalityFilter={setModalityFilter}
              onChangeDepartmentFilter={setDepartmentFilter}
              onChangeDateFilter={setDateFilter}
              onChangeSearchQuery={setSearchQuery}
              onChangeSortBy={setSortBy}
              onOpenCaseDetail={handleOpenCaseDetail}
              onOpenUpload={() => setActiveScreen('upload')}
            />
          )}

          {activeScreen === 'detail' && (
            <div className="space-y-6">
              {/* Case Detail Header Bar */}
              <div className="liquid-glass p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-[#1F2A44]/70">
                    03. CASE DETAIL & MULTIMODAL AI ANALYSIS · {activeCase.id}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1F2A44] mt-0.5">
                    {maskPatientIdentifier(activeCase.patientName, privacyMasked)} ({activeCase.age}
                    {activeCase.sex}) · {activeCase.modality}
                  </h1>
                  <p className="text-xs text-[#1F2A44]/75 mt-0.5">
                    <strong>Presenting Indication:</strong> {activeCase.chiefComplaint}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveScreen('compare')}
                    className="min-h-[42px] px-3.5 py-2 text-xs font-semibold bg-white/80 hover:bg-white border border-slate-300/80 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Columns className="w-3.5 h-3.5 text-teal-700" />
                    <span>Compare Prior Scan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('reports')}
                    className="min-h-[42px] px-3.5 py-2 text-xs font-semibold bg-white/80 hover:bg-white border border-slate-300/80 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8FA8F8]" />
                    <span>Open Report & Audit</span>
                  </button>
                </div>
              </div>

              {/* Split Layout: Left Image Viewer + Biomarker Radar | Right AI Findings, Labs, Timeline & Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 space-y-6">
                  <DiagnosticViewport
                    activeCase={activeCase}
                    selectedRoiId={selectedRoiId}
                    privacyMasked={privacyMasked}
                    onSelectRoi={setSelectedRoiId}
                  />

                  <BiomarkerTelemetry
                    activeCase={activeCase}
                    concordanceIndex={activeAcuityDetails.concordanceIndex}
                  />
                </div>

                <div className="xl:col-span-5">
                  <DecisionSupportPanel
                    activeCase={activeCase}
                    confidenceThreshold={confidenceThreshold}
                    onConfirmCase={handleConfirmCase}
                    onOverrideCase={handleOverrideCase}
                    onRequestSecondOpinion={handleRequestSecondOpinion}
                    onEscalateCase={handleEscalateCase}
                    onUpdateCaseFromAI={handleUpdateCaseFromAI}
                  />
                </div>
              </div>
            </div>
          )}

          {activeScreen === 'upload' && (
            <UploadIntakeView onAddCaseAndOpen={handleAddCaseAndOpen} />
          )}

          {activeScreen === 'compare' && (
            <CompareScansView
              cases={cases}
              activeCase={activeCase}
              privacyMasked={privacyMasked}
              onSelectCase={(id) => {
                setSelectedCaseId(id);
                const target = cases.find((c) => c.id === id);
                setSelectedRoiId(target?.regionsOfInterest[0]?.id || null);
              }}
              onBackToDetail={() => setActiveScreen('detail')}
            />
          )}

          {activeScreen === 'reports' && (
            <ReportsView
              cases={cases}
              activeCase={activeCase}
              auditLogs={auditLogs}
              privacyMasked={privacyMasked}
              currentUserRole={currentUserRole}
              currentClinicianName={currentClinicianName}
              onSelectCase={(id) => setSelectedCaseId(id)}
              onSaveReportNote={handleSaveReportNote}
            />
          )}

          {activeScreen === 'settings' && (
            <SettingsTransparencyView
              privacyMasked={privacyMasked}
              confidenceThreshold={confidenceThreshold}
              sessionMinutesRemaining={sessionMinutesRemaining}
              onTogglePrivacyMasked={() => setPrivacyMasked((prev) => !prev)}
              onChangeConfidenceThreshold={setConfidenceThreshold}
              onResetSessionTimer={() => {
                setSessionMinutesRemaining(15);
                setToastMessage('Idle session timer reset to 15:00.');
              }}
            />
          )}
        </main>
      </div>

      {/* Quiet Clinical Governance Footer */}
      <footer className="relative z-10 border-t border-white/80 bg-white/50 backdrop-blur-md px-6 py-3.5 mt-8 no-print">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-[#1F2A44]/70">
          <span>
            TriageLens Clinical Decision-Support System · Decision support, not a diagnosis
          </span>
          <span>
            Supports clinicians and never replaces their judgment · HIPAA & FDA 21 CFR §820 Non-Device CDS
          </span>
        </div>
      </footer>
    </div>
  );
}
