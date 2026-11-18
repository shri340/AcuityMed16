import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Flame,
  Maximize2,
  RotateCcw,
  Sliders,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Move,
} from 'lucide-react';
import { ClinicalCase, RegionOfInterest } from '../types/clinical';
import { maskPatientIdentifier } from '../utils/triageLogic';

interface DiagnosticViewportProps {
  activeCase: ClinicalCase;
  selectedRoiId: string | null;
  privacyMasked?: boolean;
  onSelectRoi: (roiId: string | null) => void;
}

export const DiagnosticViewport: React.FC<DiagnosticViewportProps> = ({
  activeCase,
  selectedRoiId,
  privacyMasked = true,
  onSelectRoi,
}) => {
  const [showRoiOverlays, setShowRoiOverlays] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [windowContrast, setWindowContrast] = useState(105);
  const [windowBrightness, setWindowBrightness] = useState(100);
  const [invertPolarity, setInvertPolarity] = useState(false);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleResetViewport = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setWindowContrast(105);
    setWindowBrightness(100);
    setInvertPolarity(false);
    onSelectRoi(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))));
    const y = Math.max(0, Math.min(100, Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1))));
    setCursorCoords({ x, y });

    if (isDragging) {
      setPanOffset({
        x: Math.max(-140, Math.min(140, e.clientX - dragStart.x)),
        y: Math.max(-140, Math.min(140, e.clientY - dragStart.y)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const hasImageFailed = Boolean(imageError[activeCase.id]);

  return (
    <section
      aria-label="Diagnostic Medical Imaging Viewport"
      className="liquid-glass overflow-hidden flex flex-col"
    >
      {/* Top Diagnostic Instrument Toolbar */}
      <div className="px-4 py-3 bg-[#1F2A44] text-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-semibold text-white">{activeCase.accessionNumber}</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span>{activeCase.modalityShort}</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="text-slate-300">{activeCase.anatomicalRegion}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              showHeatmap
                ? 'bg-[#FF8A80]/25 text-[#FF8A80] border border-[#FF8A80]/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap Overlay</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRoiOverlays((prev) => !prev)}
            className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              showRoiOverlays
                ? 'bg-[#5EC4B6]/25 text-[#5EC4B6] border border-[#5EC4B6]/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {showRoiOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>ROI Boxes ({activeCase.regionsOfInterest.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setInvertPolarity((prev) => !prev)}
            className={`min-h-[36px] px-2.5 py-1 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              invertPolarity
                ? 'bg-[#FFC470]/25 text-[#FFC470] border border-[#FFC470]/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Invert LUT
          </button>

          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl">
            <button
              type="button"
              aria-label="Zoom out medical image"
              onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono tabular-nums text-slate-200">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in medical image"
              onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetViewport}
            aria-label="Reset PACS viewport calibration"
            className="min-h-[36px] px-2.5 py-1 text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Darkroom PACS Canvas Area */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="diagnostic-image-stage"
        className="relative bg-slate-950 h-[420px] sm:h-[460px] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {/* Subtle calibration millimeter grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Transformable Image + Saliency Heatmap + ROI Container */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom})`,
            filter: `contrast(${windowContrast}%) brightness(${windowBrightness}%) ${
              invertPolarity ? 'invert(100%)' : ''
            }`,
          }}
        >
          {!hasImageFailed ? (
            <img
              src={activeCase.imageUrl}
              alt={`${activeCase.modality} scan for patient ${activeCase.patientId} (${activeCase.anatomicalRegion})`}
              referrerPolicy="no-referrer"
              draggable={false}
              onError={() =>
                setImageError((prev) => ({
                  ...prev,
                  [activeCase.id]: true,
                }))
              }
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6">
              <svg
                className="w-28 h-28 text-[#5EC4B6]/60 mb-3"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="10" y="10" width="100" height="100" rx="8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="60" y1="18" x2="60" y2="102" stroke="currentColor" strokeWidth="1" />
                <line x1="18" y1="60" x2="102" y2="60" stroke="currentColor" strokeWidth="1" />
              </svg>
              <p className="text-sm font-medium text-slate-200">{activeCase.modality}</p>
              <p className="text-xs font-mono text-slate-400 mt-1">
                {activeCase.accessionNumber} · {activeCase.anatomicalRegion}
              </p>
            </div>
          )}

          {/* AI Attention Saliency Heatmap Overlay */}
          {showHeatmap &&
            activeCase.regionsOfInterest.map((roi: RegionOfInterest) => (
              <div
                key={`heat-${roi.id}`}
                aria-hidden="true"
                style={{
                  left: `${roi.x - roi.width * 0.25}%`,
                  top: `${roi.y - roi.height * 0.25}%`,
                  width: `${roi.width * 1.5}%`,
                  height: `${roi.height * 1.5}%`,
                  background:
                    'radial-gradient(circle, rgba(255, 138, 128, 0.58) 0%, rgba(255, 196, 112, 0.38) 42%, rgba(94, 196, 182, 0.16) 72%, transparent 100%)',
                }}
                className="absolute rounded-full pointer-events-none blur-md mix-blend-screen"
              />
            ))}

          {/* Region of Interest (ROI) Bounding Overlays */}
          {showRoiOverlays &&
            activeCase.regionsOfInterest.map((roi: RegionOfInterest, idx: number) => {
              const isSelected = selectedRoiId === roi.id;
              return (
                <button
                  key={roi.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoi(isSelected ? null : roi.id);
                  }}
                  aria-label={`Inspect Region of Interest: ${roi.label} (${roi.confidence}% confidence)`}
                  style={{
                    left: `${roi.x}%`,
                    top: `${roi.y}%`,
                    width: `${roi.width}%`,
                    height: `${roi.height}%`,
                  }}
                  className={`absolute group transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5EC4B6] cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#FFC470] bg-[#FFC470]/15 z-20'
                      : 'border border-[#5EC4B6] bg-[#5EC4B6]/10 hover:bg-[#5EC4B6]/20 z-10'
                  }`}
                >
                  <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#5EC4B6]" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#5EC4B6]" />
                  <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#5EC4B6]" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#5EC4B6]" />

                  <div
                    className={`absolute ${
                      idx % 2 === 1 ? '-bottom-6' : '-top-6'
                    } left-0 bg-slate-950/90 text-slate-100 px-2 py-0.5 rounded-md text-[11px] font-mono whitespace-nowrap border border-slate-700`}
                  >
                    <span>R{idx + 1}: {roi.label}</span>
                    <span aria-hidden="true" className="mx-1 text-slate-500">·</span>
                    <span className="text-[#5EC4B6]">{roi.confidence.toFixed(1)}%</span>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Top-Left DICOM / Clinical Telemetry Overlay */}
        <div className="absolute top-3 left-3 pointer-events-none bg-slate-950/85 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 space-y-0.5">
          <div>
            PT:{' '}
            <span className="text-white font-semibold">
              {maskPatientIdentifier(activeCase.patientName, privacyMasked)}
            </span>{' '}
            ({activeCase.age}{activeCase.sex}) ·{' '}
            {maskPatientIdentifier(activeCase.patientId, privacyMasked)}
          </div>
          <div className="text-slate-400 flex items-center gap-2">
            <span>WL/WW: {windowBrightness}/{windowContrast}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3" /> Drag to pan ({panOffset.x}, {panOffset.y})
            </span>
          </div>
        </div>

        {/* Top-Right AI Confidence & Decision Support Tag */}
        <div className="absolute top-3 right-3 pointer-events-none bg-slate-950/85 border border-slate-800 rounded-xl px-3 py-2 text-right">
          <div className="text-[10px] font-mono text-slate-400">
            AI CONFIDENCE · DECISION SUPPORT
          </div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-xl font-mono font-bold tabular-nums text-[#5EC4B6]">
              {activeCase.aiConfidence.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Window / Level Calibration & Active ROI Telemetry Footer */}
      <div className="p-4 bg-white/60 border-t border-white/80 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-[#1F2A44]/70 shrink-0" />
            <label
              htmlFor="window-contrast-slider"
              className="text-xs font-semibold text-[#1F2A44] whitespace-nowrap shrink-0"
            >
              Window Width (Contrast)
            </label>
            <input
              id="window-contrast-slider"
              type="range"
              min={70}
              max={160}
              value={windowContrast}
              onChange={(e) => setWindowContrast(Number(e.target.value))}
              className="w-full accent-[#5EC4B6] cursor-pointer"
            />
            <span className="text-xs font-mono tabular-nums text-[#1F2A44] w-11 text-right">
              {windowContrast}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Maximize2 className="w-4 h-4 text-[#1F2A44]/70 shrink-0" />
            <label
              htmlFor="window-brightness-slider"
              className="text-xs font-semibold text-[#1F2A44] whitespace-nowrap shrink-0"
            >
              Window Level (Brightness)
            </label>
            <input
              id="window-brightness-slider"
              type="range"
              min={70}
              max={140}
              value={windowBrightness}
              onChange={(e) => setWindowBrightness(Number(e.target.value))}
              className="w-full accent-[#5EC4B6] cursor-pointer"
            />
            <span className="text-xs font-mono tabular-nums text-[#1F2A44] w-11 text-right">
              {windowBrightness}%
            </span>
          </div>
        </div>

        {/* ROI Selection Breakdown Strip */}
        <div className="pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#1F2A44] flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-teal-700" />
              <span>Regions of Interest:</span>
            </span>
            {activeCase.regionsOfInterest.map((roi, idx) => {
              const active = selectedRoiId === roi.id;
              return (
                <button
                  key={roi.id}
                  type="button"
                  onClick={() => onSelectRoi(active ? null : roi.id)}
                  className={`min-h-[36px] px-3 py-1 text-xs rounded-xl border transition-colors whitespace-nowrap shrink-0 font-mono cursor-pointer ${
                    active
                      ? 'bg-[#1F2A44] text-white border-[#1F2A44]'
                      : 'bg-white/80 text-[#1F2A44] border-slate-300 hover:border-[#5EC4B6]'
                  }`}
                >
                  R{idx + 1}: {roi.label} ({roi.confidence.toFixed(1)}%)
                </button>
              );
            })}
          </div>

          {selectedRoiId && (
            <div className="text-xs text-[#1F2A44] font-mono bg-white/85 border border-slate-200/80 rounded-xl px-3 py-1.5">
              {(() => {
                const roi = activeCase.regionsOfInterest.find((r) => r.id === selectedRoiId);
                if (!roi) return null;
                return (
                  <span>
                    <strong className="font-semibold">{roi.label}:</strong> {roi.finding}
                    {roi.measurementMm ? ` · Span: ${roi.measurementMm}` : ''}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
