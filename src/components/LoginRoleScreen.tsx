import React, { useState } from 'react';
import { ShieldCheck, Stethoscope, ScanEye, Lock, ArrowRight, Settings2 } from 'lucide-react';
import { UserRole } from '../types/clinical';

interface LoginRoleScreenProps {
  selectedRole: UserRole;
  onSelectRoleAndEnter: (role: UserRole, clinicianName: string) => void;
}

const ROLE_CARDS: Array<{
  role: UserRole;
  title: string;
  clinicianDefault: string;
  department: string;
  description: string;
  permissions: string;
}> = [
  {
    role: 'Radiologist',
    title: 'Attending Radiologist',
    clinicianDefault: 'Dr. S. Chen, MD, FRCR',
    department: 'Diagnostic Thoracic & Neuro Imaging',
    description:
      'Full PACS window/level calibration, ROI bounding box & saliency heatmap inspection, prior scan comparison, and primary imaging sign-off.',
    permissions: 'Read/Write Imaging · Override AI Priority · Sign Diagnostic Reports',
  },
  {
    role: 'Physician',
    title: 'Ordering / ED Physician',
    clinicianDefault: 'Dr. A. Rivera, MD, FACEP',
    department: 'Emergency & Acute Care Medicine',
    description:
      'Multi-modal triage queue monitoring, plain-language AI flag correlation with bedside labs/vitals, and STAT specialist escalation.',
    permissions: 'Triage Queue Access · Lab/Timeline Correlation · Request Second Opinion',
  },
  {
    role: 'Admin',
    title: 'Clinical Governance Admin',
    clinicianDefault: 'M. Patel, MS, CPHIMS',
    department: 'Clinical AI Safety & Quality Assurance',
    description:
      'Audit trail verification, model calibration metrics, sensitivity/specificity operating thresholds, and bias/limitations monitoring.',
    permissions: 'Audit Trail Export · Model Transparency · Privacy & Timeout Policy',
  },
];

export const LoginRoleScreen: React.FC<LoginRoleScreenProps> = ({
  selectedRole,
  onSelectRoleAndEnter,
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>(selectedRole);
  const [clinicianName, setClinicianName] = useState<string>(
    ROLE_CARDS.find((r) => r.role === selectedRole)?.clinicianDefault || 'Dr. S. Chen, MD, FRCR'
  );

  const handleRolePick = (role: UserRole) => {
    setActiveRole(role);
    const match = ROLE_CARDS.find((r) => r.role === role);
    if (match) setClinicianName(match.clinicianDefault);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectRoleAndEnter(
      activeRole,
      clinicianName.trim() || 'Dr. S. Chen, MD, FRCR'
    );
  };

  return (
    <div className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4 py-10">
      <div className="liquid-glass max-w-4xl w-full p-6 sm:p-10 space-y-8">
        {/* Header & Human-in-the-Loop Governance Statement */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-[#1F2A44]/70">
              TRIAGELENS CLINICAL DECISION SUPPORT · WORKSTATION AUTHENTICATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2A44]">
              Select Clinical Role to Enter Workspace
            </h1>
            <p className="text-sm text-[#1F2A44]/80 max-w-2xl">
              Decision support, not a diagnosis. TriageLens analyzes approved medical images and clinical datasets to help prioritize cases—it supports clinicians and never replaces their judgment.
            </p>
          </div>

          <div className="liquid-glass-subtle px-4 py-3 text-xs font-mono text-[#1F2A44] shrink-0 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-teal-800">
              <Lock className="w-3.5 h-3.5 text-[#5EC4B6]" />
              <span>HIPAA & 21 CFR §820 Compliant</span>
            </div>
            <div className="text-[#1F2A44]/70">PHI Masked by Default · TLS 1.3</div>
          </div>
        </div>

        {/* Role Cards Grid */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            role="radiogroup"
            aria-label="Clinical Workstation Role Selection"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {ROLE_CARDS.map((card) => {
              const isSelected = activeRole === card.role;
              return (
                <button
                  key={card.role}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleRolePick(card.role)}
                  className={`text-left p-5 rounded-[22px] transition-all duration-200 flex flex-col justify-between min-h-[210px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5EC4B6] ${
                    isSelected
                      ? 'bg-white/85 border-2 border-[#5EC4B6] shadow-md'
                      : 'liquid-glass-subtle liquid-glass-interactive hover:bg-white/65'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#5EC4B6]/20 text-teal-900'
                            : 'bg-[#8FA8F8]/20 text-[#1F2A44]'
                        }`}
                      >
                        {card.role === 'Radiologist' && <ScanEye className="w-5 h-5" />}
                        {card.role === 'Physician' && <Stethoscope className="w-5 h-5" />}
                        {card.role === 'Admin' && <Settings2 className="w-5 h-5" />}
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#1F2A44]/70">
                        {isSelected ? '● Selected Role' : 'Select'}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-[#1F2A44]">{card.title}</h2>
                      <p className="text-xs font-mono text-[#1F2A44]/65 mt-0.5">
                        {card.department}
                      </p>
                    </div>

                    <p className="text-xs text-[#1F2A44]/80 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-200/60 text-[11px] font-mono text-[#1F2A44]/70">
                    {card.permissions}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Clinician Identifier & Launch Action */}
          <div className="liquid-glass-subtle p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label
                htmlFor="login-clinician-name"
                className="block text-xs font-semibold text-[#1F2A44] mb-1.5"
              >
                Authenticated Clinician / Operator Identifier (Logged in Audit Trail)
              </label>
              <input
                id="login-clinician-name"
                type="text"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white/80 border border-slate-300/80 rounded-xl text-[#1F2A44] focus:outline-none focus:ring-2 focus:ring-[#5EC4B6]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 text-sm font-semibold text-[#1F2A44] bg-[#5EC4B6] hover:bg-[#4eb3a5] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Enter TriageLens as {activeRole}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Compliance & Security Footnote */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#1F2A44]/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              All AI-assisted triage suggestions, overrides, and second-opinion requests are cryptographically timestamped in the clinical audit trail.
            </span>
          </div>
          <span className="font-mono">Auto-Timeout: 15:00 idle</span>
        </div>
      </div>
    </div>
  );
};
