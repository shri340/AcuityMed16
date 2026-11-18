import React from 'react';
import { ClinicalBiomarker, ClinicalCase, RadarCalibrationAxis } from '../types/clinical';

interface BiomarkerTelemetryProps {
  activeCase: ClinicalCase;
  concordanceIndex: number;
}

export const BiomarkerTelemetry: React.FC<BiomarkerTelemetryProps> = ({
  activeCase,
  concordanceIndex,
}) => {
  const axes = activeCase.radarProfile;
  const center = 115;
  const maxRadius = 76;

  const getPolygonPoints = (values: number[]) => {
    if (values.length === 0) return '';
    return values
      .map((val, i) => {
        const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
        const r = (Math.max(0, Math.min(100, val)) / 100) * maxRadius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const patientPolygon = getPolygonPoints(axes.map((a) => a.patientValue));
  const baselinePolygon = getPolygonPoints(axes.map((a) => a.cohortBaseline));

  const renderStatusText = (status: ClinicalBiomarker['status']) => {
    if (status === 'Critical') {
      return <span className="font-mono text-xs font-semibold text-rose-600">✖ Critical</span>;
    }
    if (status === 'Drifting') {
      return <span className="font-mono text-xs font-medium text-amber-600">▲ Drifting</span>;
    }
    return <span className="font-mono text-xs text-emerald-600">● Nominal</span>;
  };

  return (
    <section
      aria-label="Clinical Dataset and Biomarker Telemetry"
      className="liquid-glass p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            02. Clinical Biomarker Dataset & Multi-Modal Calibration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quantitative laboratory assay concordance with radiographic severity profile
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
          <span>
            DATASET DEVIATION:{' '}
            <strong className="text-slate-900 tabular-nums">{activeCase.biomarkerDeviationScore}/100</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            IMAGING-LAB CONCORDANCE:{' '}
            <strong className="text-blue-600 tabular-nums">{concordanceIndex}%</strong>
          </span>
        </div>
      </div>

      <div className="space-y-5 pt-4">
        {/* Top Row: Spider / Radar Parameter Calibration Chart + Axis Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5">
          <div className="sm:col-span-6 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 240 210"
              className="w-full max-w-[220px] h-auto overflow-visible"
              role="img"
              aria-label="Radar chart comparing patient clinical signature against normal cohort baseline"
            >
              {[0.25, 0.5, 0.75, 1].map((scale) => (
                <polygon
                  key={scale}
                  points={getPolygonPoints(axes.map(() => scale * 100))}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
              ))}

              {axes.map((item: RadarCalibrationAxis, i: number) => {
                const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                const xEnd = center + maxRadius * Math.cos(angle);
                const yEnd = center + maxRadius * Math.sin(angle);
                const xLabel = center + (maxRadius + 21) * Math.cos(angle);
                const yLabel = center + (maxRadius + 21) * Math.sin(angle);

                return (
                  <g key={item.code}>
                    <line
                      x1={center}
                      y1={center}
                      x2={xEnd}
                      y2={yEnd}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <text
                      x={xLabel}
                      y={yLabel}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-mono fill-slate-700 font-semibold"
                    >
                      {item.code} ({item.patientValue})
                    </text>
                  </g>
                );
              })}

              <polygon
                points={baselinePolygon}
                fill="rgba(100, 116, 139, 0.12)"
                stroke="#64748b"
                strokeWidth="1.25"
                strokeDasharray="3 3"
              />

              <polygon
                points={patientPolygon}
                fill="rgba(6, 182, 212, 0.22)"
                stroke="#0891b2"
                strokeWidth="2"
              />
            </svg>

            <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-slate-500 mt-1 whitespace-nowrap">
              <span className="text-cyan-700 font-medium">— Patient Signature</span>
              <span aria-hidden="true">·</span>
              <span>--- Cohort Baseline</span>
            </div>
          </div>

          <div className="sm:col-span-6 space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
            <div className="text-[11px] font-mono text-slate-500 font-medium">
              MULTI-AXIS CALIBRATION VECTOR
            </div>
            {axes.map((item) => (
              <div key={item.code} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 truncate pr-2">
                  <span className="font-mono text-slate-400 mr-1.5">{item.code}</span>
                  {item.axis}
                </span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold shrink-0">
                  {item.patientValue} <span className="text-slate-400 font-normal">/ base {item.cohortBaseline}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Full-Width High-Density Clinical Biomarker Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500">
                <th className="py-2 pr-3 font-medium">ASSAY / BIOMARKER</th>
                <th className="py-2 px-3 font-medium text-right">OBSERVED VALUE</th>
                <th className="py-2 px-3 font-medium text-right">REFERENCE INTERVAL</th>
                <th className="py-2 pl-3 font-medium text-right">STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {activeCase.biomarkers.map((bio: ClinicalBiomarker) => (
                <tr key={bio.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900">{bio.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {bio.symbol} · Δ {bio.deltaPercent > 0 ? `+${bio.deltaPercent}%` : `${bio.deltaPercent}%`}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-900">{bio.value}</span>
                    <span className="text-[11px] font-mono text-slate-400 ml-1">{bio.unit}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                    {bio.referenceRange}
                  </td>
                  <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                    {renderStatusText(bio.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
