import React, { useState, useMemo } from 'react';
import { Flag, Clock, Zap, Gauge, Compass, Activity, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

// ─── Module-level constants — not recreated on every render ───────────────────

const SVG_WIDTH = 540;
const SVG_HEIGHT = 220;
const PADDING = { top: 35, bottom: 25, left: 35, right: 75 };
const CHART_W = SVG_WIDTH - PADDING.left - PADDING.right;
const CHART_H = SVG_HEIGHT - PADDING.top - PADDING.bottom;

/**
 * Realistic GPS speed traces — carefully crafted to match displayed statistics.
 *
 * Greater Noida → Mathura (Yamuna Expressway):
 *   Distance 112.5 km, Duration 52 min, AvgSpeed ~130 km/h, TopSpeed 223 km/h
 *   Characteristics: Long highway cruise 170–215 km/h, 2 brief 223 peaks, smooth transitions.
 *
 * City Express (Highway Route):
 *   Distance 28.4 km, Duration 18 min, AvgSpeed ~95 km/h, TopSpeed 146 km/h
 *   Characteristics: Stop-and-go early, open highway burst mid-section, traffic deceleration.
 *
 * Mountain Loop:
 *   Distance 18.2 km, Duration 26 min, AvgSpeed ~42 km/h, TopSpeed 84 km/h
 *   Characteristics: Constant speed variation, heavy braking for corners, no flat sections.
 */
const ROUTES_DATA = {
  'greater-noida-mathura': {
    title: 'Greater Noida ➔ Mathura (Yamuna Expressway)',
    startPoint: 'Greater Noida',
    endPoint: 'Mathura',
    distance: '112.5 km',
    baselineEtaMins: 75,
    actualDurationMins: 36,
    topSpeed: '288 km/h',
    topSpeedNum: 288,
    avgSpeed: '188 km/h',
    avgSpeedNum: 188,
    maxScale: 300,
    maxLean: '34° Left',
    fuelUsed: '4.80 L',
    startTime: '7:03 PM',
    midTime1: '7:15 PM',
    midTime2: '7:28 PM',
    endTime: '7:39 PM End',
    // Yamuna Expressway superbike trace: smooth launch, progressive accel 60->120->180, cruise 170-220, 288 bursts, gradual decel
    speedGraphData: [
      0, 25, 62, 120, 180, 210, 205, 215, 220, 210, 195, 220, 288, 240, 210, 190, 215, 220, 285, 225, 210, 195, 215, 220, 205, 180, 140, 90, 45, 0
    ]
  },
  'express-pass': {
    title: 'City Express ➔ Mountain Highway',
    startPoint: 'Sector 62',
    endPoint: 'Yamuna View',
    distance: '28.4 km',
    baselineEtaMins: 28,
    actualDurationMins: 18,
    topSpeed: '146 km/h',
    topSpeedNum: 146,
    avgSpeed: '95 km/h',
    avgSpeedNum: 95,
    maxScale: 160,
    maxLean: '41° Right',
    fuelUsed: '1.15 L',
    startTime: '8:10 AM',
    midTime1: '8:16 AM',
    midTime2: '8:23 AM',
    endTime: '8:28 AM End',
    // City route: stop-go traffic early, highway burst in middle, decel for exit
    speedGraphData: [
      0, 18, 35, 28, 0, 15, 42, 58, 45, 0, 22, 55, 80, 108,
      128, 138, 146, 140, 132, 120, 108, 95, 80, 62, 42, 22, 8, 0
    ]
  },
  'mountain-loop': {
    title: 'Twisty Ghats ➔ Ridge Apex',
    startPoint: 'Valley Checkpoint',
    endPoint: 'Cloud Ridge',
    distance: '18.2 km',
    baselineEtaMins: 35,
    actualDurationMins: 26,
    topSpeed: '84 km/h',
    topSpeedNum: 84,
    avgSpeed: '42 km/h',
    avgSpeedNum: 42,
    maxScale: 100,
    maxLean: '44.5° Left',
    fuelUsed: '0.88 L',
    startTime: '6:15 AM',
    midTime1: '6:24 AM',
    midTime2: '6:33 AM',
    endTime: '6:41 AM End',
    // Mountain trace: heavy braking corners, moderate exits, continuous variation
    speedGraphData: [
      0, 22, 45, 68, 80, 55, 28, 18, 38, 65, 78, 58, 32, 20,
      42, 70, 84, 62, 38, 22, 48, 72, 80, 58, 35, 18, 8, 0
    ]
  }
} as const;

type RouteKey = keyof typeof ROUTES_DATA;

// ─── SVG path builder (pure function, called inside useMemo) ──────────────────

function buildSvgPaths(data: readonly number[], maxScale: number) {
  const dataPoints = data.map((val, idx) => {
    const x = PADDING.left + (idx / (data.length - 1)) * CHART_W;
    const y = PADDING.top + CHART_H - (val / maxScale) * CHART_H;
    return { x, y, val };
  });

  let linePath = `M ${dataPoints[0].x.toFixed(1)},${dataPoints[0].y.toFixed(1)}`;
  for (let i = 0; i < dataPoints.length - 1; i++) {
    const p0 = dataPoints[i];
    const p1 = dataPoints[i + 1];
    const ctrlX = (p0.x + p1.x) / 2;
    linePath += ` C ${ctrlX.toFixed(1)},${p0.y.toFixed(1)} ${ctrlX.toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }

  const bottomY = PADDING.top + CHART_H;
  const areaPath = `${linePath} L ${dataPoints[dataPoints.length - 1].x.toFixed(1)},${bottomY} L ${dataPoints[0].x.toFixed(1)},${bottomY} Z`;

  return { dataPoints, linePath, areaPath };
}

function buildYTicks(maxScale: number) {
  return [
    Math.round(maxScale),
    Math.round(maxScale * 0.75),
    Math.round(maxScale * 0.5),
    Math.round(maxScale * 0.25),
    0,
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostRideSummaryHUD() {
  const [selectedRoute, setSelectedRoute] = useState<RouteKey>('greater-noida-mathura');

  const currentRoute = ROUTES_DATA[selectedRoute];
  const timeDifferenceMins = currentRoute.baselineEtaMins - currentRoute.actualDurationMins;
  const isFaster = timeDifferenceMins > 0;
  const percentageFaster = Math.round((timeDifferenceMins / currentRoute.baselineEtaMins) * 100);

  // Memoize all SVG calculations — only recomputes when route changes
  const svgData = useMemo(() => {
    const { dataPoints, linePath, areaPath } = buildSvgPaths(
      currentRoute.speedGraphData,
      currentRoute.maxScale
    );
    const topSpeedY = PADDING.top + CHART_H - (currentRoute.topSpeedNum / currentRoute.maxScale) * CHART_H;
    const avgSpeedY = PADDING.top + CHART_H - (currentRoute.avgSpeedNum / currentRoute.maxScale) * CHART_H;
    const yTicks = buildYTicks(currentRoute.maxScale);
    const peakPoints = dataPoints.filter(p => p.val === currentRoute.topSpeedNum);
    return { dataPoints, linePath, areaPath, topSpeedY, avgSpeedY, yTicks, peakPoints };
  }, [selectedRoute]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-2xl max-w-full font-ios">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Flag className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>AUTOMATIC POST-RIDE TELEMETRY REPORT</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Ride Summary &amp; ETA Pace Delta
          </h3>
        </div>

        {/* Route Selector */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-stretch sm:items-center justify-center gap-1.5 bg-white/5 p-1.5 sm:p-1 rounded-2xl sm:rounded-full border border-white/10 w-full sm:w-auto max-w-full mt-2 sm:mt-0">
          {(['greater-noida-mathura', 'express-pass', 'mountain-loop'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedRoute(key)}
              className={`px-2 sm:px-3.5 py-2.5 sm:py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center text-center leading-tight ${
                selectedRoute === key
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {key === 'greater-noida-mathura' ? 'Noida ➔ Mathura' : key === 'express-pass' ? 'Highway' : 'Mountain'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center max-w-full">
        {/* ETA Pace Offset Hero Box */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-white/15 space-y-4 max-w-full overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase truncate">ROUTE PACE SUMMARY</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              RIDE COMPLETED
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-white font-bold text-base sm:text-lg flex-wrap min-w-0">
            <span className="truncate">{currentRoute.startPoint}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <span className="truncate">{currentRoute.endPoint}</span>
          </div>

          {/* ETA vs Actual Time Card */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] sm:text-[11px] font-mono text-neutral-400">ESTIMATED ETA</div>
              <div className="text-lg sm:text-xl font-extrabold text-neutral-300">{currentRoute.baselineEtaMins} min</div>
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-mono text-neutral-400">YOUR ACTUAL TIME</div>
              <div className="text-lg sm:text-xl font-extrabold text-cyan-400">{currentRoute.actualDurationMins} min</div>
            </div>
          </div>

          {/* Time Offset Highlight */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            isFaster
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0 animate-bounce" />
            <div className="min-w-0 flex-1">
              <div className="text-base sm:text-lg font-black tracking-tight leading-snug">
                {Math.abs(timeDifferenceMins)} MINUTES FASTER ⚡
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                You reached your destination {percentageFaster}% ahead of Google Maps estimated ETA!
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Stats & Speed Graph */}
        <div className="lg:col-span-7 space-y-4 max-w-full overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 min-w-0">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1 truncate">
                <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> DISTANCE
              </div>
              <div className="text-lg sm:text-xl font-black text-white truncate">{currentRoute.distance}</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 min-w-0">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1 truncate">
                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" /> DURATION
              </div>
              <div className="text-lg sm:text-xl font-black text-white truncate">{currentRoute.actualDurationMins}m</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 min-w-0">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1 truncate">
                <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" /> TOP SPEED
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-400 truncate">{currentRoute.topSpeed}</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 min-w-0">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1 truncate">
                <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" /> MAX LEAN
              </div>
              <div className="text-lg sm:text-xl font-black text-purple-400 truncate">{currentRoute.maxLean}</div>
            </div>
          </div>

          {/* iOS Style Speed Graph */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#09090c] border border-white/10 space-y-3 max-w-full overflow-hidden shadow-2xl font-ios">
            <div className="flex justify-between items-center text-xs font-ios gap-2 flex-wrap">
              <span className="text-neutral-200 flex items-center gap-1.5 font-bold tracking-tight">
                <TrendingUp className="w-4 h-4 text-red-500 shrink-0" />
                <span>RIDE VELOCITY CURVE</span>
              </span>
              <span className="text-red-400 font-extrabold tracking-wide text-xs">iOS TELEMETRY GRAPH</span>
            </div>

            {/* Responsive SVG Area Chart */}
            <div className="w-full relative max-w-full overflow-hidden pt-1">
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto overflow-visible select-none">
                <defs>
                  <linearGradient id="iosSpeedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b30" stopOpacity="0.45" />
                    <stop offset="65%" stopColor="#ff3b30" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#ff3b30" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="iosRedGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ff3b30" floodOpacity="0.75" />
                  </filter>
                </defs>

                {/* Y-Axis Gridlines */}
                {svgData.yTicks.map((tickVal, idx) => {
                  const tickY = PADDING.top + CHART_H - (tickVal / currentRoute.maxScale) * CHART_H;
                  return (
                    <g key={idx}>
                      <line x1={PADDING.left} y1={tickY} x2={SVG_WIDTH - PADDING.right} y2={tickY}
                        stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
                      <text x={PADDING.left - 8} y={tickY + 4} fill="#8e8e93" fontSize="11"
                        fontWeight="500" textAnchor="end" className="font-ios">
                        {tickVal}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical milestone gridlines */}
                <line x1={PADDING.left + CHART_W * 0.42} y1={PADDING.top}
                  x2={PADDING.left + CHART_W * 0.42} y2={PADDING.top + CHART_H}
                  stroke="rgba(255, 255, 255, 0.14)" strokeDasharray="3 4" strokeWidth="1" />
                <line x1={PADDING.left + CHART_W * 0.78} y1={PADDING.top}
                  x2={PADDING.left + CHART_W * 0.78} y2={PADDING.top + CHART_H}
                  stroke="rgba(255, 255, 255, 0.14)" strokeDasharray="3 4" strokeWidth="1" />

                {/* Top Speed dashed line */}
                <line x1={PADDING.left} y1={svgData.topSpeedY} x2={SVG_WIDTH - PADDING.right} y2={svgData.topSpeedY}
                  stroke="#ff3b30" strokeDasharray="4 4" strokeWidth="1.5" />
                <text x={SVG_WIDTH - PADDING.right + 8} y={svgData.topSpeedY + 4} fill="#ff3b30"
                  fontSize="12" fontWeight="800" textAnchor="start" className="font-ios">
                  Top {currentRoute.topSpeedNum}
                </text>

                {/* Average Speed dashed line */}
                <line x1={PADDING.left} y1={svgData.avgSpeedY} x2={SVG_WIDTH - PADDING.right} y2={svgData.avgSpeedY}
                  stroke="#ffd60a" strokeDasharray="4 4" strokeWidth="1.5" />
                <text x={SVG_WIDTH - PADDING.right + 8} y={svgData.avgSpeedY + 4} fill="#ffd60a"
                  fontSize="12" fontWeight="800" textAnchor="start" className="font-ios">
                  Avg {currentRoute.avgSpeedNum}
                </text>

                {/* Gradient area fill */}
                <path d={svgData.areaPath} fill="url(#iosSpeedGradient)" />

                {/* Glowing speed curve */}
                <path d={svgData.linePath} fill="none" stroke="#ff3b30" strokeWidth="2.8"
                  strokeLinecap="round" strokeLinejoin="round" filter="url(#iosRedGlow)" />

                {/* Peak dots */}
                {svgData.peakPoints.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="3.5"
                    fill="#ffffff" stroke="#ff3b30" strokeWidth="2" />
                ))}
              </svg>

              {/* Bottom time legend */}
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-ios text-[#8e8e93] font-semibold pt-1 px-1 border-t border-white/10 mt-1">
                <span>Start {currentRoute.startTime}</span>
                <span className="hidden sm:inline">{currentRoute.midTime1}</span>
                <span className="text-[#a1a1aa] font-bold tracking-widest text-xs uppercase">KM/H</span>
                <span className="hidden sm:inline">{currentRoute.midTime2}</span>
                <span>{currentRoute.endTime}</span>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ride automatically saved to your RiderIQ History with full fuel, lean, &amp; pace logs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
