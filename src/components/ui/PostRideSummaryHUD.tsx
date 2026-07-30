import React, { useState } from 'react';
import { Flag, Clock, Zap, Gauge, Compass, Activity, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

export default function PostRideSummaryHUD() {
  const [selectedRoute, setSelectedRoute] = useState<'beta-delta' | 'express-pass' | 'mountain-loop'>('beta-delta');

  const routesData = {
    'beta-delta': {
      title: 'Beta ➔ Delta Sector',
      startPoint: 'Beta Circle',
      endPoint: 'Delta Plaza',
      distance: '14.2 km',
      baselineEtaMins: 10,
      actualDurationMins: 6,
      topSpeed: '124 km/h',
      avgSpeed: '82 km/h',
      maxLean: '34° Left',
      fuelUsed: '0.42 L',
      speedGraphData: [0, 24, 58, 86, 112, 124, 98, 76, 110, 84, 42, 0]
    },
    'express-pass': {
      title: 'City Express ➔ Mountain Highway',
      startPoint: 'Sector 62',
      endPoint: 'Yamuna View',
      distance: '38.5 km',
      baselineEtaMins: 32,
      actualDurationMins: 24,
      topSpeed: '162 km/h',
      avgSpeed: '96 km/h',
      maxLean: '41° Right',
      fuelUsed: '1.15 L',
      speedGraphData: [0, 40, 85, 120, 155, 162, 140, 110, 135, 90, 50, 0]
    },
    'mountain-loop': {
      title: 'Twisty Ghats ➔ Ridge Apex',
      startPoint: 'Valley Checkpoint',
      endPoint: 'Cloud Ridge',
      distance: '26.8 km',
      baselineEtaMins: 28,
      actualDurationMins: 20,
      topSpeed: '118 km/h',
      avgSpeed: '74 km/h',
      maxLean: '44.5° Left',
      fuelUsed: '0.88 L',
      speedGraphData: [0, 30, 65, 88, 105, 118, 92, 110, 85, 70, 35, 0]
    }
  };

  const currentRoute = routesData[selectedRoute];
  const timeDifferenceMins = currentRoute.baselineEtaMins - currentRoute.actualDurationMins;
  const isFaster = timeDifferenceMins > 0;

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Flag className="w-4 h-4 text-cyan-400" />
            AUTOMATIC POST-RIDE TELEMETRY REPORT
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Ride Summary & ETA Pace Delta
          </h3>
        </div>

        {/* Route Selector Switcher */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-full border border-white/10">
          {(['beta-delta', 'express-pass', 'mountain-loop'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedRoute(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedRoute === key
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {key === 'beta-delta' ? 'Beta ➔ Delta' : key === 'express-pass' ? 'Highway' : 'Mountain'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* ETA Pace Offset Hero Box (Beta to Delta Example) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase">ROUTE PACE SUMMARY</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              RIDE COMPLETED
            </span>
          </div>

          <div className="flex items-center gap-3 text-white font-bold text-lg">
            <span>{currentRoute.startPoint}</span>
            <ArrowRight className="w-5 h-5 text-cyan-400" />
            <span>{currentRoute.endPoint}</span>
          </div>

          {/* ETA vs Actual Time Card */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-mono text-neutral-400">ESTIMATED ETA</div>
              <div className="text-xl font-extrabold text-neutral-300">{currentRoute.baselineEtaMins} min</div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-neutral-400">YOUR ACTUAL TIME</div>
              <div className="text-xl font-extrabold text-cyan-400">{currentRoute.actualDurationMins} min</div>
            </div>
          </div>

          {/* Time Offset Highlight Banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            isFaster
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            <Zap className="w-6 h-6 text-emerald-400 shrink-0 animate-bounce" />
            <div>
              <div className="text-lg font-black tracking-tight">
                {Math.abs(timeDifferenceMins)} MINUTES FASTER ⚡
              </div>
              <div className="text-xs opacity-80">
                You reached your destination 40% ahead of Google Maps estimated ETA!
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Stats & Speed Graph */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" /> DISTANCE
              </div>
              <div className="text-xl font-black text-white">{currentRoute.distance}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> DURATION
              </div>
              <div className="text-xl font-black text-white">{currentRoute.actualDurationMins}m 00s</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" /> TOP SPEED
              </div>
              <div className="text-xl font-black text-amber-400">{currentRoute.topSpeed}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> MAX LEAN
              </div>
              <div className="text-xl font-black text-purple-400">{currentRoute.maxLean}</div>
            </div>
          </div>

          {/* Speed Graph Visualizer */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-300 flex items-center gap-1.5 font-bold">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> RIDE VELOCITY CURVE (SPEED GRAPH)
              </span>
              <span className="text-neutral-400">AVG: {currentRoute.avgSpeed}</span>
            </div>

            {/* SVG Speed Curve Graph */}
            <div className="h-28 w-full relative flex items-end justify-between gap-1 pt-4">
              {currentRoute.speedGraphData.map((val, idx) => {
                const heightPct = Math.round((val / 170) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-400 group-hover:to-teal-300 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-neutral-500 border-t border-white/10 pt-2">
              <span>0 min (Start)</span>
              <span>3 min (Mid-way Apex)</span>
              <span>{currentRoute.actualDurationMins} min (Destination Arrival)</span>
            </div>
          </div>

          <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Ride automatically saved to your RiderIQ History with full fuel, lean, & pace logs.
          </div>
        </div>
      </div>
    </div>
  );
}
