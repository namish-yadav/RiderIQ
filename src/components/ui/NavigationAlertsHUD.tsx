import React, { useState, useEffect } from 'react';
import { Navigation, AlertTriangle, ShieldCheck, MapPin, Zap, Radio, Volume2, VolumeX, BellRing } from 'lucide-react';

export default function NavigationAlertsHUD() {
  const [activeMapProvider, setActiveMapProvider] = useState<'google' | 'apple'>('google');
  const [speedLimit, setSpeedLimit] = useState<number>(80);
  const [currentSpeed, setCurrentSpeed] = useState<number>(115);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  const speedDelta = currentSpeed - speedLimit;
  const isSpeeding = speedDelta > 0;

  // Web Audio API synthesized high-end radar chime tone
  const playRadarBeep = (doublePulse = true) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const createBeep = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      createBeep(880, now, 0.14); // A5 note chime
      if (doublePulse) {
        createBeep(1174.66, now + 0.15, 0.18); // D6 note chime
      }
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  };

  // Continuous audio loop while speed exceeds speed limit
  useEffect(() => {
    let intervalId: any = null;

    if (isSpeeding && audioEnabled) {
      // Play immediately on speed limit breach
      playRadarBeep(true);

      // Loop audio warning chime every 750ms while speeding
      intervalId = setInterval(() => {
        playRadarBeep(true);
      }, 750);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSpeeding, audioEnabled]);

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            NAVIGATION & RADAR INTELLIGENCE
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Speed Trap & Camera Alert Engine (Up to 300 km/h)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Alert Toggle */}
          <button
            onClick={() => {
              const nextState = !audioEnabled;
              setAudioEnabled(nextState);
              if (nextState) playRadarBeep(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer border ${
              audioEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
            }`}
            title={audioEnabled ? 'Audio Warnings Enabled' : 'Audio Warnings Muted'}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioEnabled ? 'AUDIO ALERT ON' : 'MUTED'}</span>
          </button>

          {/* Map API Provider Switcher */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setActiveMapProvider('google')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeMapProvider === 'google'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Google Maps API
            </button>
            <button
              onClick={() => setActiveMapProvider('apple')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeMapProvider === 'apple'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Apple Maps API
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Interactive Map Alert HUD */}
        <div className="lg:col-span-6 relative p-6 rounded-2xl bg-black/70 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>CONNECTED VIA {activeMapProvider === 'google' ? 'GOOGLE MAPS SDK' : 'APPLE MAPKIT'}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              RADAR ACTIVE
            </span>
          </div>

          {/* Speed Limit & Alert Card */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-neutral-900 to-black border border-white/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* European / Indian style speed limit circle */}
              <div className="w-14 h-14 rounded-full border-4 border-red-500 bg-white text-black font-black text-xl flex-shrink-0 flex items-center justify-center shadow-lg">
                {speedLimit}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">ZONE SPEED LIMIT</div>
                <div className="text-lg sm:text-xl font-bold text-white truncate">NH-44 Express Highway</div>
                <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  <span>Auto-detected via Map API</span>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">CURRENT SPEED</div>
              <div className={`text-3xl font-black ${isSpeeding ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                {currentSpeed} <span className="text-xs font-normal text-neutral-400">km/h</span>
              </div>
              <div className="mt-1 flex justify-end">
                {isSpeeding ? (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 whitespace-nowrap">
                    +{speedDelta} km/h OVER LIMIT
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 whitespace-nowrap">
                    {Math.abs(speedDelta)} km/h SAFE MARGIN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Speed Camera Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            isSpeeding
              ? 'bg-red-950/50 border-red-500/50 text-red-300 shadow-lg shadow-red-500/10'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
          }`}>
            <div className="flex items-center gap-3">
              {isSpeeding ? (
                <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {isSpeeding ? 'HIGH SPEED CAMERA DETECTED (350m)' : 'Speed Within Safe Zone'}
                </div>
                <div className="text-xs opacity-80">
                  {isSpeeding
                    ? 'Speed trap alert active! Audible intercom warning playing.'
                    : 'Real-time radar active. Road clear ahead.'}
                </div>
              </div>
            </div>

            <button
              onClick={() => playRadarBeep(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer border border-white/15"
              title="Test Web Audio API radar alert tone"
            >
              <BellRing className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Sound</span>
            </button>
          </div>

          {/* Interactive Speed Slider up to 300 km/h */}
          <div className="pt-2 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-400">Simulate Rider Speed (50 - 300 km/h)</span>
              <span className={`font-bold px-2.5 py-0.5 rounded ${isSpeeding ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'}`}>
                {currentSpeed} km/h
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              value={currentSpeed}
              onChange={(e) => setCurrentSpeed(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 bg-neutral-800 h-2.5 rounded-lg cursor-pointer"
            />

            {/* Quick Speed Preset Buttons */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {[80, 120, 180, 240, 300].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setCurrentSpeed(spd)}
                  className={`flex-1 py-1 rounded text-[11px] font-mono transition-all cursor-pointer border ${
                    currentSpeed === spd
                      ? 'bg-cyan-500 text-black font-extrabold border-cyan-400'
                      : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {spd} <span className="text-[9px]">km/h</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Explanations */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Zap className="w-4 h-4 text-cyan-400" />
              High-Velocity Speed Radar (300 km/h Support)
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Engineered specifically for high-speed highway riding and track runs up to 300 km/h. Synthesizes real-time audio warnings directly to Bluetooth intercoms 500m before enforcement zones.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <BellRing className="w-4 h-4 text-emerald-400" />
              Web Audio Intercom Warning Beep
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Native Web Audio API dual-tone warning sound plays instantly without buffering or audio latency. Works seamlessly with Helmet Bluetooth intercom headsets.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <MapPin className="w-4 h-4 text-purple-400" />
              Dynamic Route Limit Sync
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Automatically adjusts speed limit thresholds based on state highways, city streets, or mountain passes so you always stay aware of local enforcement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

