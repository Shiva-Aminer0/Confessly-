/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Custom SVG Bar Chart
export function SvgBarChart({ data, keys, colors }: { data: { [key: string]: number }, keys: string[], colors?: string[] }) {
  const maxVal = Math.max(...keys.map(k => data[k] || 0), 1);
  const chartHeight = 160;

  return (
    <div className="space-y-4">
      {keys.map((key, i) => {
        const val = data[key] || 0;
        const pct = (val / maxVal) * 100;
        const color = colors ? colors[i % colors.length] : 'bg-indigo-500';

        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">{key}</span>
              <span className="font-mono font-bold text-slate-900">{val} ({Math.round((val / (Object.values(data).reduce((a, b) => a + b, 0) || 1)) * 100)}%)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Custom SVG Line Chart for submission trends
export function SvgTrendChart({ data }: { data: { [key: string]: number } }) {
  const keys = Object.keys(data).sort();
  if (keys.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm font-mono border border-dashed border-slate-200 rounded-2xl">
        No trend data available yet
      </div>
    );
  }

  const values = keys.map(k => data[k]);
  const maxVal = Math.max(...values, 5);
  const minVal = 0;
  const range = maxVal - minVal;

  const width = 500;
  const height = 180;
  const padding = 30;

  // Generate coordinates
  const points = keys.map((key, i) => {
    const x = padding + (i / Math.max(keys.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((data[key] - minVal) / range) * (height - padding * 2);
    return { x, y, key, val: data[key] };
  });

  // Polyline string
  const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');

  // SVG Area path
  const areaPath = points.length > 0
    ? `${points.map(p => `${p.x},${p.y}`).join(' ')} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`
    : '';

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grids */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
          const y = padding + p * (height - padding * 2);
          const gridVal = Math.round(maxVal - p * range);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <text
                x={padding - 8}
                y={y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#trendGrad)"
            opacity="0.15"
          />
        )}

        {/* Glowing Trend Line */}
        {polylinePath && (
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePath}
          />
        )}

        {/* Coordinates data circles */}
        {points.map((p, idx) => (
          <g key={idx} className="group">
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#4f46e5"
              stroke="#818cf8"
              strokeWidth="2.5"
              className="cursor-pointer transition-transform duration-200 hover:scale-150"
            />
            {/* Simple tooltip simulation */}
            <title>{`${p.key}: ${p.val}`}</title>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, idx) => {
          // Show label for first, middle, last to prevent overlap
          const showLabel = idx === 0 || idx === Math.floor(points.length / 2) || idx === points.length - 1;
          if (!showLabel) return null;

          return (
            <text
              key={idx}
              x={p.x}
              y={height - 8}
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {p.key.length > 8 ? p.key.substring(0, 5) + '..' : p.key}
            </text>
          );
        })}

        {/* Define Gradient */}
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Custom Doughnut Ring for Geographic Distribution or similar
export function SvgDoughnutRing({ data, title }: { data: { [key: string]: number }, title: string }) {
  const keys = Object.keys(data).slice(0, 5); // top 5
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;

  const colors = [
    'stroke-indigo-500',
    'stroke-pink-500',
    'stroke-emerald-500',
    'stroke-amber-500',
    'stroke-cyan-500'
  ];

  const fillColors = [
    'bg-indigo-500',
    'bg-pink-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-cyan-500'
  ];

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          {keys.map((key, idx) => {
            const val = data[key];
            const pct = (val / total) * 100;
            const strokeDasharray = `${pct * 2.51} 251`; // circumference is 2 * PI * 40 ≈ 251.2
            const strokeDashoffset = `-${accumulatedPercent * 2.51}`;
            accumulatedPercent += pct;
            return (
              <circle
                key={key}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                className={`${colors[idx % colors.length]} transition-all duration-1000`}
                strokeWidth="9.5"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute text-center">
          <span className="block text-xl font-bold font-display text-slate-900">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{title}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 w-full">
        {keys.map((key, idx) => {
          const val = data[key];
          const pct = Math.round((val / total) * 100);
          return (
            <div key={key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${fillColors[idx % fillColors.length]}`} />
                <span className="text-slate-700 truncate max-w-[120px]">{key}</span>
              </div>
              <span className="font-mono font-semibold text-slate-900">{val} ({pct}%)</span>
            </div>
          );
        })}
        {keys.length === 0 && (
          <div className="text-slate-500 italic text-center text-xs py-4">
            No data recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
