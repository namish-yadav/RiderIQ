import React, { useState } from 'react';
import { ShieldCheck, Compass, Gauge, AlertTriangle, RefreshCw } from 'lucide-react';

export default function LeanAngleHUD() {
  const [angle, setAngle] = useState<number>(34); // initial lean angle in degrees
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const absAngle = Math.abs(angle);
  const lateralG = (Math.tan((absAngle * Math.PI) / 180)).toFixed(2);
  const cornerSpeedLimit = Math.round(45 + absAngle * 1.8);
  const stabilityIndex = Math.max(10, Math.round(100 - absAngle * 1.5));

  const isExtreme = absAngle > 40;
  const isWarning = absAngle > 36;

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            LIVE CORNERING TELEMETRY SIMULATOR
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Lean Angle & Traction HUD</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAngle(34)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/50 text-neutral-400 hover:text-white transition-all text-xs font-mono flex items-center gap-1 cursor-pointer"
            title="Reset Lean Angle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isExtreme 
              ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
              : isWarning
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
          }`}>
            {direction === 'left' ? 'LEFT TURN' : 'RIGHT TURN'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Interactive Gauge / Bike Roll Visualization */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/60 border border-white/10 relative">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer Arc Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-neutral-800"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={264}
                strokeDashoffset={264 - (absAngle / 50) * 264}
                className={isExtreme ? 'text-red-500' : isWarning ? 'text-amber-400' : 'text-cyan-400'}
                strokeLinecap="round"
              />
            </svg>

            {/* Simulated Bike Silhouette Tilting */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-150 ease-out"
              style={{
                transform: `rotate(${direction === 'left' ? -absAngle : absAngle}deg)`
              }}
            >
              <div className={`w-3 h-24 rounded-full bg-gradient-to-t ${
                isExtreme ? 'from-red-500 to-amber-400' : 'from-cyan-400 to-blue-500'
              } shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center`}>
                <div className="w-1.5 h-12 bg-white/80 rounded-full"></div>
              </div>
            </div>

            {/* Readout Overlay */}
            <div className="absolute flex flex-col items-center justify-center bg-black/80 rounded-full w-24 h-24 border border-white/15 backdrop-blur-md">
              <span className="text-3xl font-black text-white">{absAngle}°</span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">{direction}</span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>-45° Left</span>
              <span className="text-white font-bold">Drag to test lean angle</span>
              <span>+45° Right</span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              value={direction === 'left' ? -absAngle : absAngle}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val < 0) {
                  setDirection('left');
                  setAngle(Math.abs(val));
                } else {
                  setDirection('right');
                  setAngle(val);
                }
              }}
              className="w-full accent-cyan-400 bg-neutral-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Telemetry Metrics Readout */}
        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                <span>LATERAL G-FORCE</span>
                <Compass className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{lateralG} <span className="text-xs font-normal text-neutral-400">G</span></div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                <span>OPTIMAL SPEED</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{cornerSpeedLimit} <span className="text-xs font-normal text-neutral-400">km/h</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-400">TRACTION & CORNERING STABILITY</span>
              <span className={`font-bold ${isExtreme ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stabilityIndex}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isExtreme ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${stabilityIndex}%` }}
              ></div>
            </div>
          </div>

          {/* Advice / Alert Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            isExtreme
              ? 'bg-red-950/30 border-red-500/30 text-red-300'
              : isWarning
              ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
          }`}>
            {isExtreme || isWarning ? (
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
            )}
            <div>
              {isExtreme
                ? 'High lean angle detected! Ensure smooth throttle control and check road surface traction.'
                : isWarning
                ? 'Approaching progressive lean threshold. RiderIQ telemetry logs corner entry speed and roll rate.'
                : 'Optimal cornering geometry. RiderIQ captures smooth arc trajectories automatically.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
