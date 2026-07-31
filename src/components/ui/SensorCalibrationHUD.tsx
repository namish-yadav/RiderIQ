import React, { useState } from 'react';
import { Smartphone, RefreshCcw, Compass, CheckCircle2, Sliders } from 'lucide-react';

export default function SensorCalibrationHUD() {
  const [mountType, setMountType] = useState<'handlebar' | 'tankbag' | 'pocket'>('handlebar');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pitchOffset, setPitchOffset] = useState<number>(15); // phone tilt angle

  const mountProfiles = {
    handlebar: { title: 'Handlebar RAM Mount', offset: '0° Ref', icon: '🏍️' },
    tankbag: { title: 'Tank Bag Flat', offset: '12° Pitch Offset', icon: '🧳' },
    pocket: { title: 'Rider Jacket Pocket', offset: 'Auto 3D Matrix', icon: '🧥' }
  };

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            IMU SENSOR FUSION ENGINE
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Smart Gyroscope & Mounting Calibration
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            AUTO 6-AXIS ZEROED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Interactive Mounting Simulator */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-black/70 border border-white/10 space-y-5">
          <div className="text-xs font-mono text-neutral-400">SELECT PHONE MOUNTING LOCATION</div>

          <div className="grid grid-cols-3 gap-2 max-w-full">
            {(['handlebar', 'tankbag', 'pocket'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMountType(type)}
                className={`p-2 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[54px] w-full min-w-0 overflow-hidden ${
                  mountType === type
                    ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 font-bold'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="text-xl sm:text-2xl shrink-0">{mountProfiles[type].icon}</span>
                <span className="text-[10px] sm:text-[11px] font-mono capitalize truncate max-w-full leading-tight text-center">{type}</span>
              </button>
            ))}
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 gap-3 max-w-full overflow-hidden">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
              <Smartphone className={`w-5 h-5 text-cyan-400 shrink-0 ${orientation === 'landscape' ? 'rotate-90' : ''} transition-transform duration-300`} />
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase tracking-wider truncate">SCREEN ORIENTATION</div>
                <div className="text-xs sm:text-sm font-bold text-white capitalize truncate">{orientation} Mode</div>
              </div>
            </div>

            <button
              onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 min-h-[44px]"
            >
              <RefreshCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Switch</span>
            </button>
          </div>

          {/* Dynamic IMU Sensor Matrix Visualizer */}
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-3 max-w-full overflow-hidden">
            <div className="flex justify-between items-center text-xs font-mono gap-2 flex-wrap">
              <span className="text-neutral-400 truncate">PITCH ANGLE TILT (MOUNT ANGLE)</span>
              <span className="text-cyan-400 font-bold shrink-0">+{pitchOffset}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              value={pitchOffset}
              onChange={(e) => setPitchOffset(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 bg-neutral-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>RiderIQ auto-zeroes +{pitchOffset}° pitch offset. True lean angle remains 0° at rest!</span>
            </div>
          </div>
        </div>

        {/* Technical Explanations */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Compass className="w-4 h-4 text-cyan-400" />
              Mounting Independent Lean Angle
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              No matter if your phone is mounted sideways on handlebars, flat on a tank bag, or inside your riding jacket — RiderIQ uses high-frequency gyroscope + accelerometer sensor fusion to construct a 3D rotation matrix and calibrate a true gravity reference.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <RefreshCcw className="w-4 h-4 text-purple-400" />
              Auto-Zeroing at Ride Start
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              As soon as you mount your motorcycle and start rolling above 5 km/h, RiderIQ dynamically isolates vehicle roll from phone tilt, guaranteeing precise lean metrics (±0.5° accuracy).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
