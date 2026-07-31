import React, { useState, useMemo } from 'react';
import { Trophy, Users, Award, Flame, ChevronRight } from 'lucide-react';

type LeaderboardCategory = 'topSpeed' | 'distance' | 'lean' | 'smoothness';

// ─── Module-level constants — not recreated on every render ───────────────────

/**
 * Rider stats are carefully tuned to be consistent with real-world motorcycle specs:
 *
 * BMW S1000RR – superbike, top speed 299 km/h stock, shown at 223 (track day limit / safe speed)
 *   Lean 48.5° — aggressive superbike sport tyres
 *
 * Bajaj Dominar 400 – sport tourer, top speed ~150 km/h stock
 *   Lean 38° — sticky performance tyres, lowish CoG
 *
 * Royal Enfield Hunter 350 – standard roadster, top speed ~118 km/h
 *   Lean 31° — standard compound tyres, longer wheelbase
 *
 * Honda CB Highness 350 – neo-retro standard, top speed ~112 km/h
 *   Lean 22° — upright geometry, conservative cornering
 */
const RAW_RIDERS = [
  {
    id: 'arav',
    name: "Arav Dahiya",
    handle: "@aravdah1ya",
    bike: "BMW S1000RR",
    avatarBg: "bg-blue-500",
    distance: "2,450 km",
    lean: "48.5°",
    topSpeed: "288 km/h",
    smoothness: "99 pts",
    isUser: false,
    badge: "SUPERBIKE KING"
  },
  {
    id: 'abhinav',
    name: "Abhinav Verma",
    handle: "@abhinav_verma",
    bike: "Bajaj Dominar 400",
    avatarBg: "bg-orange-500",
    distance: "1,840 km",
    lean: "38.0°",
    topSpeed: "152 km/h",
    smoothness: "95 pts",
    isUser: false,
    badge: "DOMINAR SPEEDSTER"
  },
  {
    id: 'namish',
    name: "Namish Yadav",
    handle: "@nam7sh",
    bike: "Royal Enfield Hunter 350",
    avatarBg: "bg-cyan-500",
    distance: "1,428 km",
    lean: "31.0°",
    topSpeed: "118 km/h",
    smoothness: "98 pts",
    isUser: true,
    badge: "LEGEND RIDER"
  },
  {
    id: 'aryan',
    name: "Aryan Nagar",
    handle: "@diabolic",
    bike: "Honda CB Highness 350",
    avatarBg: "bg-purple-500",
    distance: "963 km",
    lean: "22.0°",
    topSpeed: "108 km/h",
    smoothness: "92 pts",
    isUser: false,
    badge: "CB CRUISER"
  }
];

/**
 * Max values for progress bar scaling.
 * Based on the highest value in any category across all riders.
 * topSpeed: 300 (BMW S1000RR superbike top speed max scale)
 * distance: 2500
 * lean: 50°
 * smoothness: 100 pts
 */
const MAX_VALUES: Record<LeaderboardCategory, number> = {
  topSpeed: 300,
  distance: 2500,
  lean: 50,
  smoothness: 100
};

// Reusable value parser — avoids repeated inline parseFloat calls
function parseMetricValue(valStr: string): number {
  const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MultiplayerLeaderboard() {
  const [category, setCategory] = useState<LeaderboardCategory>('topSpeed');

  const sortedRiders = useMemo(() => {
    return [...RAW_RIDERS]
      .sort((a, b) => parseMetricValue(b[category]) - parseMetricValue(a[category]))
      .map((rider, idx) => ({ ...rider, rank: idx + 1 }));
  }, [category]);

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-2xl max-w-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>MULTIPLAYER &amp; COMMUNITY LEADERBOARD</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Compete &amp; Rank Among Friends
          </h3>
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 bg-white/5 p-1.5 sm:p-1 rounded-2xl sm:rounded-full border border-white/10 w-full sm:w-auto max-w-full">
          {([
            { id: 'topSpeed', label: 'Top Speed' },
            { id: 'distance', label: 'Distance' },
            { id: 'lean', label: 'Max Lean' },
            { id: 'smoothness', label: 'Smoothness' },
          ] as const).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`w-full sm:w-auto px-3 sm:px-3.5 py-2 rounded-xl sm:rounded-full text-xs font-mono font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center whitespace-nowrap text-center ${
                category === cat.id
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3 max-w-full">
        {sortedRiders.map((friend) => {
          let metricValue = friend.topSpeed;
          let numVal = parseMetricValue(friend.topSpeed);
          let maxVal = MAX_VALUES.topSpeed;

          if (category === 'distance') {
            metricValue = friend.distance;
            numVal = parseMetricValue(friend.distance);
            maxVal = MAX_VALUES.distance;
          } else if (category === 'lean') {
            metricValue = friend.lean;
            numVal = parseMetricValue(friend.lean);
            maxVal = MAX_VALUES.lean;
          } else if (category === 'smoothness') {
            metricValue = friend.smoothness;
            numVal = parseMetricValue(friend.smoothness);
            maxVal = MAX_VALUES.smoothness;
          }

          const barWidthPct = Math.min(100, Math.max(8, Math.round((numVal / maxVal) * 100)));

          return (
            <div
              key={friend.id}
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 transition-all max-w-full overflow-hidden ${
                friend.isUser
                  ? 'bg-cyan-950/40 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 overflow-hidden">
                {/* Rank Badge */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm font-mono shrink-0 bg-white/5 border border-white/10">
                  {friend.rank === 1 ? (
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  ) : friend.rank === 2 ? (
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />
                  ) : friend.rank === 3 ? (
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  ) : (
                    <span className="text-neutral-500 text-xs sm:text-sm">#{friend.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${friend.avatarBg} text-black font-black text-xs sm:text-sm flex items-center justify-center shadow-md shrink-0`}>
                  {friend.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-bold text-white text-sm sm:text-base truncate max-w-full">{friend.name}</span>
                    {friend.isUser && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
                        YOU
                      </span>
                    )}
                    <span className="hidden xl:inline-block text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 truncate">
                      {friend.badge}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400 flex items-center gap-1.5 flex-wrap sm:flex-nowrap min-w-0 truncate">
                    <span className="truncate">{friend.handle}</span>
                    <span className="hidden sm:inline text-neutral-600">•</span>
                    <span className="text-cyan-300 font-semibold truncate">{friend.bike}</span>
                  </div>
                </div>
              </div>

              {/* Metric, Progress Bar & Chevron */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 min-w-0 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                <div className="flex-1 sm:w-36 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    <span>
                      {category === 'topSpeed' ? 'TOP SPEED'
                        : category === 'distance' ? 'DISTANCE'
                        : category === 'lean' ? 'MAX LEAN'
                        : 'SMOOTHNESS'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800/80 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg sm:text-2xl font-black text-cyan-400">{metricValue}</div>
                </div>

                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 hidden sm:block shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-400">
        <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-400 shrink-0" /> Weekly Rider League resets in 2d 14h</span>
        <span className="text-cyan-400">Friends Sync Connected</span>
      </div>
    </div>
  );
}
