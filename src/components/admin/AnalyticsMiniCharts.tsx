import React from 'react';

type ChartColor = 'sky' | 'emerald' | 'violet' | 'blue' | 'amber' | 'rose' | 'purple' | 'slate';

const COLOR_MAP: Record<ChartColor, { stroke: string; fillFrom: string; fillTo: string; dot: string; bar: string }> = {
  sky: { stroke: '#0284c7', fillFrom: '#38bdf8', fillTo: '#e0f2fe', dot: '#0369a1', bar: '#38bdf8' },
  emerald: { stroke: '#059669', fillFrom: '#34d399', fillTo: '#d1fae5', dot: '#047857', bar: '#10b981' },
  violet: { stroke: '#7c3aed', fillFrom: '#a78bfa', fillTo: '#ede9fe', dot: '#6d28d9', bar: '#8b5cf6' },
  blue: { stroke: '#2563eb', fillFrom: '#60a5fa', fillTo: '#dbeafe', dot: '#1d4ed8', bar: '#3b82f6' },
  amber: { stroke: '#d97706', fillFrom: '#fbbf24', fillTo: '#fef3c7', dot: '#b45309', bar: '#f59e0b' },
  rose: { stroke: '#e11d48', fillFrom: '#fb7185', fillTo: '#ffe4e6', dot: '#be123c', bar: '#f43f5e' },
  purple: { stroke: '#9333ea', fillFrom: '#c084fc', fillTo: '#f3e8ff', dot: '#7e22ce', bar: '#a855f7' },
  slate: { stroke: '#64748b', fillFrom: '#94a3b8', fillTo: '#f1f5f9', dot: '#475569', bar: '#64748b' },
};

/**
 * MiniSparkline: Gráfica de área y tendencia ultra-compacta para tarjetas de métricas.
 */
export const MiniSparkline: React.FC<{
  data?: number[];
  color?: ChartColor;
  height?: number;
  className?: string;
  baselineZero?: boolean;
}> = ({ data = [0, 0, 0, 0, 0], color = 'sky', height = 28, className = '', baselineZero = true }) => {
  const palette = COLOR_MAP[color] || COLOR_MAP.sky;
  const gradId = `spark-grad-${color}-${Math.random().toString(36).substr(2, 6)}`;

  // Normalización de puntos
  const values = data.length > 0 ? data : [0, 0, 0, 0, 0];
  const maxVal = Math.max(...values, baselineZero ? 1 : Math.max(...values));
  const minVal = baselineZero ? 0 : Math.min(...values);
  const range = maxVal - minVal || 1;

  const w = 100;
  const h = height;
  const padY = 3;
  const usableH = h - padY * 2;

  const points = values.map((val, idx) => {
    const x = values.length > 1 ? (idx / (values.length - 1)) * (w - 6) + 3 : w / 2;
    const y = h - padY - ((val - minVal) / range) * usableH;
    return { x, y };
  });

  // Construir curva suave SVG
  let pathD = '';
  if (points.length === 1) {
    pathD = `M 3 ${points[0].y} L ${w - 3} ${points[0].y}`;
  } else {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  const lastPoint = points[points.length - 1];
  const areaD = `${pathD} L ${lastPoint.x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full block">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.fillFrom} stopOpacity={0.4} />
            <stop offset="100%" stopColor={palette.fillTo} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {/* Línea guía de base */}
        <line x1="2" y1={h - padY} x2={w - 2} y2={h - padY} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="2 2" />
        {/* Área rellena */}
        <path d={areaD} fill={`url(#${gradId})`} />
        {/* Línea de tendencia */}
        <path d={pathD} fill="none" stroke={palette.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Punto final destacado */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="2.2" fill={palette.dot} stroke="#ffffff" strokeWidth="1" />
      </svg>
    </div>
  );
};

/**
 * MiniBarChart: Gráfica de barras verticales compacta (e.g. horas pico, aforos, cupones).
 */
export const MiniBarChart: React.FC<{
  data: number[];
  color?: ChartColor;
  height?: number;
  highlightIndices?: number[];
  className?: string;
}> = ({ data, color = 'violet', height = 28, highlightIndices = [], className = '' }) => {
  const palette = COLOR_MAP[color] || COLOR_MAP.violet;
  const values = data.length > 0 ? data : [0, 0, 0, 0, 0];
  const maxVal = Math.max(...values, 1);

  const w = 100;
  const h = height;
  const barCount = values.length;
  const slotW = w / barCount;
  const barW = Math.max(3, slotW * 0.65);
  const padY = 2;

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full block">
        <line x1="2" y1={h - padY} x2={w - 2} y2={h - padY} stroke="#e2e8f0" strokeWidth="0.8" />
        {values.map((val, idx) => {
          const isHigh = highlightIndices.includes(idx);
          const barH = val > 0 ? Math.max(3, (val / maxVal) * (h - padY * 2)) : 1.5;
          const x = idx * slotW + (slotW - barW) / 2;
          const y = h - padY - barH;
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="1.2"
              fill={isHigh ? palette.stroke : val > 0 ? palette.bar : '#cbd5e1'}
              opacity={isHigh ? 1 : val > 0 ? 0.85 : 0.4}
            />
          );
        })}
      </svg>
    </div>
  );
};

/**
 * MiniGauge: Medidor radial o de arco compacto para porcentajes y tasas de cumplimiento.
 */
export const MiniGauge: React.FC<{
  percentage: number;
  color?: ChartColor;
  label?: string;
  height?: number;
  className?: string;
}> = ({ percentage, color = 'emerald', label, height = 28, className = '' }) => {
  const palette = COLOR_MAP[color] || COLOR_MAP.emerald;
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div className={`w-full flex items-center gap-2 ${className}`} style={{ height }}>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundColor: palette.stroke,
          }}
        />
      </div>
      <span className="text-[10px] font-black font-mono text-slate-700 whitespace-nowrap">
        {label || `${clamped}%`}
      </span>
    </div>
  );
};

/**
 * MiniSplitBar: Barra comparativa proporcional para distribuciones (NFC vs QR, Tarjeta vs Efectivo vs SPEI).
 */
export const MiniSplitBar: React.FC<{
  segments: { label: string; value: number; colorHex: string }[];
  height?: number;
  className?: string;
}> = ({ segments, height = 6, className = '' }) => {
  const total = segments.reduce((acc, s) => acc + (s.value > 0 ? s.value : 0), 0);

  return (
    <div className={`w-full space-y-1 ${className}`}>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex" style={{ height }}>
        {total === 0 ? (
          <div className="w-full bg-slate-200 h-full" />
        ) : (
          segments.map((s, idx) => {
            const pct = Math.round((s.value / total) * 100);
            if (pct <= 0) return null;
            return (
              <div
                key={idx}
                style={{ width: `${pct}%`, backgroundColor: s.colorHex }}
                className="h-full transition-all duration-300"
                title={`${s.label}: ${s.value} (${pct}%)`}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
