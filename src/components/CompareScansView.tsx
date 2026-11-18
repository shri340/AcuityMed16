import React, { useState } from 'react';
import { ZoomIn, RotateCcw, Columns, Eye, ArrowRight } from 'lucide-react';
import { ClinicalCase } from '../types/clinical';
import { maskPatientIdentifier } from '../utils/triageLogic';

interface CompareScansViewProps {
  cases: ClinicalCase[];
  activeCase: ClinicalCase;
  privacyMasked: boolean;
  onSelectCase: (caseId: string) => void;
  onBackToDetail: () => void;
}

export const CompareScansView: React.FC<CompareScansViewProps> = ({
  cases,
  activeCase,
  privacyMasked,
  onSelectCase,
  onBackToDetail,
}) => {
  const [syncedZoom, setSyncedZoom] = useState<number>(115);
  const [syncedContrast, setSyncedContrast] = useState<number>(105);
  const [showRoiMarkers, setShowRoiMarkers] = useState<boolean>(true);

  const prior = activeCase.priorComparison;

  return (
    <div className="space-y-6">
      {/* Header & Case Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#1F2A44]/70">
            LONGITUDINAL SERIAL IMAGING COMPARISON · DECISION SUPPORT
          </div>
          <h1 className="text-2xl font-bold text-[#1F2A44] mt-0.5">
            04. Side-by-Side Prior vs. Current Scan Comparison
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select patient case for scan comparison"
            value={activeCase.id}
            onChange={(e) => onSelectCase(e.target.value)}
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
            onClick={onBackToDetail}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#1F2A44] bg-[#5EC4B6] hover:bg-[#4eb3a5] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Full Analysis View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Synced Zoom & Window Control Bar */}
      <section aria-label="Synchronized Comparison Controls" className="liquid-glass p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-teal-800 shrink-0" />
            <label
              htmlFor="synced-zoom-slider"
              className="text-xs font-bold text-[#1F2A44] whitespace-nowrap shrink-0"
            >
              Synced Zoom Slider
            </label>
            <input
              id="synced-zoom-slider"
              type="range"
              min={100}
              max={200}
              value={syncedZoom}
              onChange={(e) => setSyncedZoom(Number(e.target.value))}
              className="w-full accent-[#5EC4B6] cursor-pointer"
            />
            <span className="text-xs font-mono font-bold tabular-nums text-[#1F2A44] w-12 text-right">
              {syncedZoom}%
            </span>
          </div>

          <div className="md:col-span-4 flex items-center gap-3">
            <Columns className="w-4 h-4 text-[#1F2A44]/70 shrink-0" />
            <label
              htmlFor="synced-contrast-slider"
              className="text-xs font-semibold text-[#1F2A44] whitespace-nowrap shrink-0"
            >
              Synced Contrast
            </label>
            <input
              id="synced-contrast-slider"
              type="range"
              min={80}
              max={145}
              value={syncedContrast}
              onChange={(e) => setSyncedContrast(Number(e.target.value))}
              className="w-full accent-[#8FA8F8] cursor-pointer"
            />
            <span className="text-xs font-mono tabular-nums text-[#1F2A44] w-11 text-right">
              {syncedContrast}%
            </span>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRoiMarkers((prev) => !prev)}
              className="min-h-[40px] px-3 py-1.5 text-xs font-semibold bg-white/80 hover:bg-white border border-slate-300/80 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span>{showRoiMarkers ? 'Hide Calipers' : 'Show Calipers'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSyncedZoom(100);
                setSyncedContrast(105);
              }}
              className="min-h-[40px] px-3 py-1.5 text-xs font-semibold bg-white/80 hover:bg-white border border-slate-300/80 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* Side-by-Side Prior vs. Current Scan Viewports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Prior Baseline Scan */}
        <section aria-label="Prior Baseline Scan" className="liquid-glass overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-800 text-slate-100 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-300">PRIOR BASELINE SCAN</span> ·{' '}
              <strong className="text-white">{prior.priorDate}</strong>
            </div>
            <span className="text-slate-300">{prior.priorAccession}</span>
          </div>

          <div className="relative bg-slate-950 h-[380px] overflow-hidden flex items-center justify-center">
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
              style={{
                transform: `scale(${syncedZoom / 100})`,
                filter: `${prior.priorFilterStyle || 'brightness(90%)'} contrast(${syncedContrast}%)`,
              }}
            >
              <img
                src={activeCase.imageUrl}
                alt={`Prior baseline ${activeCase.modality} scan from ${prior.priorDate}`}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain opacity-85"
              />

              {showRoiMarkers &&
                activeCase.regionsOfInterest.slice(0, 1).map((roi) => (
                  <div
                    key={`prior-${roi.id}`}
                    style={{
                      left: `${roi.x + 4}%`,
                      top: `${roi.y + 4}%`,
                      width: `${Math.max(6, roi.width * 0.45)}%`,
                      height: `${Math.max(6, roi.height * 0.45)}%`,
                    }}
                    className="absolute border border-dashed border-slate-300/80 bg-slate-400/10"
                  >
                    <div className="absolute -top-6 left-0 bg-slate-900/90 text-slate-200 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
                      Prior Span: {prior.lesionSizePriorMm}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="p-4 bg-white/65 border-t border-white/80 text-xs space-y-1">
            <div className="font-mono font-semibold text-[#1F2A44]/70">
              PRIOR STUDY IMPRESSION ({prior.priorDate})
            </div>
            <p className="text-[#1F2A44]">{prior.priorSummary}</p>
          </div>
        </section>

        {/* RIGHT: Current Active Scan */}
        <section aria-label="Current Active Scan" className="liquid-glass overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#1F2A44] text-white flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[#5EC4B6] font-semibold">CURRENT ACQUISITION</span> ·{' '}
              <strong>{activeCase.studyDate}</strong>
            </div>
            <span>{activeCase.accessionNumber}</span>
          </div>

          <div className="relative bg-slate-950 h-[380px] overflow-hidden flex items-center justify-center">
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
              style={{
                transform: `scale(${syncedZoom / 100})`,
                filter: `contrast(${syncedContrast}%)`,
              }}
            >
              <img
                src={activeCase.imageUrl}
                alt={`Current ${activeCase.modality} scan from ${activeCase.studyDate}`}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />

              {showRoiMarkers &&
                activeCase.regionsOfInterest.map((roi, idx) => (
                  <div
                    key={`curr-${roi.id}`}
                    style={{
                      left: `${roi.x}%`,
                      top: `${roi.y}%`,
                      width: `${roi.width}%`,
                      height: `${roi.height}%`,
                    }}
                    className="absolute border-2 border-[#5EC4B6] bg-[#5EC4B6]/15"
                  >
                    <div
                      className={`absolute ${
                        idx % 2 === 1 ? '-bottom-6' : '-top-6'
                      } left-0 bg-slate-950/90 text-[#5EC4B6] px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap`}
                    >
                      Current: {roi.measurementMm || prior.lesionSizeCurrentMm} ({roi.confidence.toFixed(1)}%)
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="p-4 bg-white/65 border-t border-white/80 text-xs space-y-1">
            <div className="font-mono font-semibold text-teal-900">
              INTERVAL PROGRESSION DELTA ({prior.lesionSizePriorMm} → {prior.lesionSizeCurrentMm})
            </div>
            <p className="text-[#1F2A44] font-medium">{prior.intervalChangeNote}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
