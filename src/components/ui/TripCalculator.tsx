import React, { useState } from 'react';
import { Fuel, DollarSign, Route, Sparkles, TrendingDown } from 'lucide-react';

export default function TripCalculator() {
  const [distanceKm, setDistanceKm] = useState<number>(240);
  const [mileageKmpl, setMileageKmpl] = useState<number>(32);
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState<number>(102);

  // Calculations
  const fuelNeededLitres = (distanceKm / (mileageKmpl || 1)).toFixed(1);
  const rawTripCost = Math.round((distanceKm / (mileageKmpl || 1)) * fuelPricePerLitre);
  
  // RiderIQ smart throttle optimization estimated 7-10% fuel saving
  const riderIqSavings = Math.round(rawTripCost * 0.08);
  const optimizedTripCost = rawTripCost - riderIqSavings;

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        INTELLIGENT RIDE CALCULATOR
      </div>

      <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
        Estimate Tour Cost & Fuel Intelligence
      </h3>

      <p className="text-neutral-400 text-sm mb-6 max-w-xl">
        Adjust your tour distance, motorcycle fuel efficiency, and petrol rate to see instant trip analytics.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* Distance Input */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-300">
              <span className="flex items-center gap-1.5"><Route className="w-3.5 h-3.5 text-cyan-400" /> Planned Ride Distance</span>
              <span className="font-bold text-white text-sm">{distanceKm} km</span>
            </div>
            <input
              type="range"
              min="20"
              max="1500"
              step="10"
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 bg-neutral-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Mileage Input */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-300">
              <span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-orange-400" /> Bike Mileage</span>
              <span className="font-bold text-white text-sm">{mileageKmpl} km/L</span>
            </div>
            <input
              type="range"
              min="12"
              max="60"
              step="1"
              value={mileageKmpl}
              onChange={(e) => setMileageKmpl(parseInt(e.target.value, 10))}
              className="w-full accent-orange-400 bg-neutral-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Fuel Price Input */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-300">
              <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Fuel Rate</span>
              <span className="font-bold text-white text-sm">₹{fuelPricePerLitre} / L</span>
            </div>
            <input
              type="range"
              min="80"
              max="140"
              step="1"
              value={fuelPricePerLitre}
              onChange={(e) => setFuelPricePerLitre(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400 bg-neutral-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-black/60 border border-white/10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-mono text-neutral-400 mb-1">ESTIMATED FUEL</div>
              <div className="text-2xl font-black text-white">{fuelNeededLitres} <span className="text-xs font-normal text-neutral-400">Litres</span></div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-mono text-neutral-400 mb-1">BASE TRIP COST</div>
              <div className="text-2xl font-black text-white">₹{rawTripCost}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-cyan-400" />
                WITH RIDERIQ OPTIMIZATION
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Smooth throttle insights save ~8% fuel</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-cyan-400">₹{optimizedTripCost}</div>
              <div className="text-[11px] font-mono text-emerald-400">Save ₹{riderIqSavings}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
